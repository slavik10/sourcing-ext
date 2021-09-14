const baseApiUrl = 'https://amocrm-hr.vercel.app/api';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const api = {
  notify: async ({ title, text }) => {
    try {
      let response = await fetch(`${baseApiUrl}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
          title,
          text
        })
      });
      
      let result = await response.json();

      return result; 
    } catch (error) {}
  },
  createWorker: async () => {
    let response = await fetch(`${baseApiUrl}/workers/create`, {
      method: 'POST'
    });
    let result = await response.json();

    return result.id;
  },
  getWorkerSettings: async (workerId) => {
    let response = await fetch(`${baseApiUrl}/workers/settings?workerId=${workerId}`);
    result = await response.json();

    return result;
  },
  saveTaskResult: async (task, resumes, workerId) => {
    let response = await fetch(`${baseApiUrl}/parserTasks/saveTaskResult2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        workerId,
        taskUrl: task.url,
        filterUrl: task.decompose_filter_url,
        resumes
      })
    });
    
    let rv = await response.json();
    return rv;
  },
}

const _tryToCreateWorker = async (attemptNum = 0) => {
  let workerId = getRandomInt(100, 1000);

  try {
    workerId = await api.createWorker()
  } catch(er) {
    if(attemptNum < 2) {
      workerId = await _tryToCreateWorker(attemptNum + 1)
    }
  }

  return workerId;
}

const _tryToSaveData = async (task, resumes, workerId, attemptNum = 0) => {
  let contacts = null;

  try {
    contacts = await api.saveTaskResult(task, resumes, workerId)
  } catch(er) {
    // if(attemptNum < 2) {
    //   isSaveResultOk = await _tryToSaveData(task, resumes, workerId, attemptNum + 1)
    // }
  }

  return contacts;
}

async function _getStorage(key) {
  return new Promise(async (resolve, reject) => {
    chrome.storage.local.get(key, (result)=> {
      resolve(result[key]);
    })
  })
}

async function getWorker() {
  let worker = await _getStorage('worker');

  if(!worker) {
    worker = await _tryToCreateWorker();
    chrome.storage.local.set({ worker });
  }

  return worker
}

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

async function _tryGetInitialInfo(tab, attempt = 0) {
  var initialState = [];

  try {
    initialState = (await chromeTabExecScriptAsync(tab.id, { 
      file: "getInitialState.js" 
    }));
  } catch(er) {
    console.log(er);

    if(attempt < 3) {
      await sleep(200);
      initialState = await _tryGetInitialInfo(tab, attempt + 1)
    }
  }

  return initialState;
}

async function _tryCheckTabPage(tab, attempt = 0) {
  var res = [{ isDef: true }];

  try {
    res = await chrome.tabs.executeScript(tab.id, { 
      file: "pageCheck.js" 
    }); 
  } catch(er) {
    console.log(er)
    if(attempt < 3) {
      await sleep(200);
      res = await _tryCheck(tab, attempt + 1)
    }
  }

  return res;
}

function checkTabs(workerId) {
  async function onUpdated(tabId, changeInfo, updatedTab) {
    if(changeInfo.status == 'complete') {
      if(updatedTab.url.indexOf('selecty.info') >= 0) {
        (await chromeTabExecScriptAsync(tabId, { 
          code: `var elemDiv = document.createElement('div'); elemDiv.id = "__ext_alive";  elemDiv.className = "__ext_alive"; document.body.appendChild(elemDiv);`
        }));
      } else if(updatedTab.url.indexOf('hh') >= 0) {      
        let initialState = await _tryGetInitialInfo(updatedTab);
        
        let resumes = initialState[0]?.resumeSearchResult?.resumes
        let resume = initialState[0]?.resume

        if(resumes?.length > 0) {
          const autoTask = {
            url: updatedTab.url,
            decompose_filter_url: 'search',
          }

          let contacts = await _tryToSaveData(autoTask, resumes, workerId);
          // (await chromeTabExecScriptAsync(tabId, { 
          //   code: 'var foundContacts = ' + JSON.stringify(contacts),
          // }));

          // (await chromeTabExecScriptAsync(tabId, { 
          //   file: "markExistingContacts.js" 
          // }));
        }

        if(resume?.hash) { 
          const autoTask = {
            url: updatedTab.url,
            decompose_filter_url: 'search',
          }

          _tryToSaveData(autoTask, [resume], workerId);
        }
      }
    }
  }

  chrome.tabs.onUpdated.addListener(onUpdated);

  return onUpdated;
}

async function runner() {
  var listner;

  let exitFn = () => {
    chrome.tabs.onUpdated.removeListener(listner);
  }

  try {
    const workerId = await getWorker();
    listner = checkTabs(workerId);
  } catch (error) {
    exitFn()

    await api.notify({
      title: 'Inside BgScript Error',
      text: error.stack.toString()
    });
    
    await sleep(1000)
    runner();
  }

  return exitFn;
}

return runner()