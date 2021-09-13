function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// const api = {}

function chromeTabExecScriptAsync(tabId, params) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, params, function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(result);
      }
    });
  });
}

function chromeTabsGetCurrentAsync() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tab) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(tab);
      }
    });
  });
}

async function getUserInfo() {
  const chromeTab = await chromeTabsGetCurrentAsync()

  const state = (await chromeTabExecScriptAsync(chromeTab.id, { 
    file: "checkUserId.js" 
  }))[0];

  return state;
}

async function getDataToUpd() {
  const chromeTab = await chromeTabsGetCurrentAsync()

  const state = (await chromeTabExecScriptAsync(chromeTab.id, { 
    file: "getDataToSend.js" 
  }))[0];

  return state;
}

document.addEventListener('DOMContentLoaded', async function() {
  var uplCreateTaskButton = document.getElementById('addToBubble');
  // var checkSearchResultButton = document.getElementById('checkSearchResult');
  var mainTagSelect = document.getElementById('mainTag');
  
  // checkSearchResultButton.addEventListener('click', async function() { 
  //   alert('checkSearchResultButton')
  // }, false);

  uplCreateTaskButton.addEventListener('click', async function() { 
    // 
    // как получить эту инфу?
    // Кандидата нет в БД
    // Задача отправлена
    
    let _userState = await getUserInfo()

    if(_userState.status == 'loading') {
      alert('Проверка наличия кандидата в БД');
    } else if (_userState.status == 'found') {
      let dataToSend = await getDataToUpd();
      const mainTag = mainTagSelect.value; // как получить имя файла?
      
      if(!mainTag) {
        alert('Технология не выбрана')
        return;
      }

      fetch(`https://amocrm-hr.vercel.app/api/resume/updInfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      }).catch((error) => {
        console.log(error.toString())
      });

      let formData = new FormData();
      formData.append("userId", _userState.data.dbId);
      formData.append("mainTag", mainTag);

      await fetch('https://atsjobforce.bubbleapps.io/api/1.1/wf/getcandidatesfortasks', {
        method: 'POST',
        body: formData
      });

      alert('done')
    } else {
      alert('Пользователь не найден в БД');
    }

  }, false);

}, false);