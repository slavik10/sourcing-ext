const infoCheckerCode = `
const baseApiUrl = 'https://amocrm-hr.vercel.app/api';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const apiSaveTaskResult = async (task, resumes, workerId) => {
  let response = await fetch(baseApiUrl+"/parserTasks/saveTaskResult2", {
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
}

const apiCreateWorker = async () => {
  let response = await fetch(baseApiUrl+"/workers/create", {
    method: 'POST'
  });
  let result = await response.json();

  return result.id;
}

const apiResumeInfoOpened = async (workerId) => {
  let res = await fetch(baseApiUrl + "/resume/infoOpened?workerId=" + workerId);
  let result = await res.json();

  return result;
}

const apiGetResumeInfoByPost = async (userId, resumeData, workerId) => {
  // let res = await fetch(baseApiUrl + "/resume/info?userId=" + userId + "&workerId=" + workerId);
  // let resumeRes = await res.json();
  
  let res = await fetch(baseApiUrl + "/resume/smartinfo", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      resumeData,
      workerId
    })
  })

  let resumeRes = await res.json();

  return resumeRes
}

const apiGetResumeInfo = async (userId, workerId) => {
  let res = await fetch(baseApiUrl + "/resume/info?userId=" + userId + "&workerId=" + workerId);
  let resumeRes = await res.json();
  
  return resumeRes
}

function getNoContactBanner() {
  let html = '<div class="info-block">'
  html += '   <div class="info-block-substrate-warning">'
  html += '      <div class="bloko-columns-wrapper">'
  html += '         <div class="bloko-column bloko-column_xs-4 bloko-column_s-6 bloko-column_m-12 bloko-column_l-16">'
  html += '            <div class="bloko-gap bloko-gap_top bloko-gap_bottom">'
  html += '               <p>К сожалению контакт не нашелся у нас в БД, при необходимости покупайте контакт через HH (синяя кнопка)</p>'
  html += '            </div>'
  html += '         </div>'
  html += '      </div>'
  html += '   </div>'
  html += '</div>'
  
  return html;
}

function getHtmlLoaderBanner() {
  let html = '<div class="info-block">'
  html += '   <div class="info-block-substrate-secondary" style="background-color: red; font-size: 16px;">'
  html += '      <div class="bloko-columns-wrapper">'
  html += '         <div class="bloko-column bloko-column_xs-4 bloko-column_s-6 bloko-column_m-12 bloko-column_l-16">'
  html += '            <div class="bloko-gap bloko-gap_top bloko-gap_bottom">'
  html += '               <p>Проверка наличия резюме во внутренней базе, пока не открывайте контакты!</p>'
  html += '            </div>'
  html += '         </div>'
  html += '      </div>'
  html += '   </div>'
  html += '</div>'
  
  return html;
}

function addNoContactBanner() {
  let bannerHtml = getNoContactBanner();
  
  // Get the current element
  var parentNode = document.querySelector(".main-content");;

  // Create a new element
  var newNode = document.createElement('div');

  // Add ID and content
  newNode.id = 'nocontact_banner';
  newNode.innerHTML = bannerHtml;

  parentNode.prepend(newNode)
}

function addLoaderBanner() {
  let bannerHtml = getHtmlLoaderBanner();
  
  // Get the current element
  var parentNode = document.querySelector(".main-content");;

  // Create a new element
  var newNode = document.createElement('div');

  // Add ID and content
  newNode.id = 'loader_banner';
  newNode.innerHTML = bannerHtml;

  parentNode.prepend(newNode)
}

async function getStorageKey(key) {
  return new Promise(async (resolve, reject) => {
    chrome.storage.local.get(key, (result)=> {
      resolve(result[key]);
    })
  })
}

async function getIgnoreInfoCheckerFn() {
  let ignoreInfoCheckerFn = await getStorageKey('getIgnoreInfoCheckerFn');
  return !!ignoreInfoCheckerFn;
}

async function getWorker() {
  let worker = await getStorageKey('worker');

  if(!worker) {
    worker = await apiCreateWorker();
    chrome.storage.local.set({ worker });
  }

  return worker
}

function _getInitialState() {
  let stateNode = document.getElementById('HH-Lux-InitialState')
  let initialState = JSON.parse(stateNode?.content?.textContent || stateNode?.innerText || '{}');
  
  return initialState
}

let _loaderNode = null;
let _contactsNode = null;

function getLoaderNode() {
  if(!_loaderNode) {
    _loaderNode = document.createElement('div');

    _loaderNode.id = '_loader';
    _loaderNode.innerHTML = '<p>Идет загрузка</p>';
  }

  return _loaderNode;
}

function updateFriendworkData(userInfo, state) {
  let dataToSend = {
    dbId: userInfo.dbId,
    fwId: userInfo.fwId,
    resume: {
      ...state,
      ...userInfo.raw
    }
  };
  window.__dtToSend = dataToSend;

  if(userInfo.sendToFw) {
    fetch('https://selective.selecty.info/erp/scripts/parse/flow.php', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    }).then(result => {
      if (!result.ok) {};
      return result.json();
    }).catch((error) => {
      console.log(error.toString())
    });
  }
}

let isContactsShown = false;
function getSelContactsNode(userInfo, upd = false) {
  let needToAddHtml = upd;

  if(!_contactsNode) {
    needToAddHtml = true;

    _contactsNode = document.createElement('div');
    _contactsNode.id = '_loader';
  } 

  if(needToAddHtml) {
    // Нужно вставить структуру, существующую у HH
    // Что для этого нужно?

    // 1) Повторить структуру HH
    // 2) Вставить ее куда нужно

    // Имя -
    let strNameArr = userInfo.name.split(' ')
    strNameArr = [strNameArr[1], strNameArr[0], strNameArr[2]]
    
    let phones = (userInfo.phone || []).map(el => el.formatted).join(', ');
    let emails = userInfo.email.join(', ');

    let nameStr = \`
      <div class="resume-header-name">
        <h2 data-qa="resume-personal-name" class="bloko-header-1">\`;
        nameStr += '<span>' + strNameArr.join(' ').trim() + '</span>';
      nameStr += \`</h2>
        <div class="bloko-v-spacing bloko-v-spacing_base-4"></div>
      </div>
    \`
    
    let contactsStr = \`
    <div data-qa="resume-block-contacts">
      <div class="bloko-text bloko-text_small bloko-text_tertiary">Контакты</div>
      <div class="bloko-v-spacing bloko-v-spacing_base-2"></div>
      <div data-qa="resume-serp_resume-item-content">
        <div data-qa="resume-contacts-phone">
          <span class="bloko-icon bloko-icon_done bloko-icon_initial-secondary"></span>&nbsp;\`;
   contactsStr += '<span data-qa="resume-contact-preferred">' + phones + '</span>';
   contactsStr += \`<div class="bloko-translate-guard">
            <div class="bloko-translate-guard">&nbsp;— предпочитаемый способ связи</div>
          </div>
          <div class="resume-search-item-phone-verification-status">
            <div class="bloko-text bloko-text_small">Телефон подтвержден</div>
          </div>
        </div>
      </div>\`;
contactsStr += '<div data-qa="resume-contact-email"><a href="mailto:' + emails +'"><span>' + emails + '</span></a></div>';
contactsStr += \`<div class="resume__contacts-sites-group">
        <div class="bloko-text bloko-text_small bloko-text_tertiary">Возможные способы связи</div>
        <div class="bloko-v-spacing bloko-v-spacing_base-2"></div>
        <span class="noprint"><span class="resume-header-contact"><span class="bloko-icon-dynamic"><span class="resume__contacts-links"><span class="resume-contact-whatsapp"><span class="bloko-icon bloko-icon_whatsapp bloko-icon_initial-default bloko-icon_highlighted-unique"></span>&nbsp;WhatsApp</span></span></span></span><span class="resume-header-contact"><span class="bloko-icon-dynamic"><span class="resume__contacts-links"><span class="resume-contact-viber"><span class="bloko-icon bloko-icon_viber bloko-icon_initial-default bloko-icon_highlighted-unique"></span>&nbsp;Viber</span></span></span></span></span>
      </div>
    </div>
  \`

    let html = "<div>"
    if(isContactsShown) {
      let el = document.querySelector('.resume-online-status')
      el.insertAdjacentHTML('afterEnd', nameStr)

      document.querySelector('.resume-header-field').innerHTML = contactsStr;

      // Вставить имя и телефон
      // Куда вставить?

      // html += "<p>Имя: " + userInfo.name + "</p>"
      // html += "<p>Телефон: " + phones + "</p>"
      // html += "<p>Email: " + emails + "</p>"
      
      // if(userInfo.fwId) {
      //   let fwLink = 'https://app.friend.work/Candidate/Profile/' + userInfo.fwId
      //   html += '<p><a href="' + fwLink + '" target="_blank">ссылка на Friendwork</a></p>'
      // } else {
      //   html += '<p>Кандидат почему-то не нашелся на friend.work :( обратитесь к админам</p>'
      // }

    } else {
      html += '<p><button id="shInfo">Показать контакты</button></p>'
    }
    html += '</div>'

    _contactsNode.innerHTML = html;
  }
  
  return _contactsNode;
}

let userInfo = null;

// контакты уже куплены через hh
async function openedByHH(initialState, workerId) {
  let originalNode = document.querySelector('[data-qa="resume-block-contacts"]')
  let parentNode = originalNode.parentNode;

  let observer = new MutationObserver(mutations => {
    if(originalNode.innerText.indexOf('@') > 0) {
      // распарсиваем и сохраняем инфу
      let lines = originalNode.innerText.split('\\n')
      let phones = []

      for(let i = 0; i < lines.length; i++) {
        let str = lines[i];
        if(str.includes('+')) {
          str = str.replace('— предпочитаемый способ связи', '').trim();

          phones.push({
            "city": str.substring(str.lastIndexOf("(") + 1, str.lastIndexOf(")")).trim(),
            "comment": null,
            "country": str.substring(str.lastIndexOf("+") + 1, str.lastIndexOf("(")).trim(),
            "formatted": str,
            "needVerification": false,
            "number": str.substring(str.lastIndexOf(")") + 1).replace(/-/g, '').trim(),
            "raw": str.replace( /\\D+/g, '').trim(), // только цифры
            "type": "cell",
            "verified": true
          })
        }
      }

      let dataToSave = {
        ...initialState.resume,
        phone: {
          block: "contacts",
          type: "manual",
          value: phones,
        }
      };

      apiSaveTaskResult({
        url: window.location.href,
        decompose_filter_url: 'resume',
      }, [dataToSave], workerId)
    }

    // for(let mutation of mutations) {
    //   console.log('--new el--')
    //   for(let addedNode of mutation.addedNodes) {
    //     if(currentState.indexOf('hh') >= 0) {
    //       console.log(addedNode.innerText)
    //       console.log("Сохранять как то данные, при покупке");
    //     }
    //   }
    // }

    // if(currentState == 'loader') {
    //   let loaderNode = getLoaderNode()
      
    //   if('<p>Идет загрузка</p>' != actualNode.innerHTML) {
    //     loaderNode.innerHTML = '<p>Идет загрузка</p>'
    //   }
    // } else 
  });

  // Cледим за перерисовками, которые случаются на стороне react
  observer.observe(parentNode, { childList: true, subtree: true });
}

// контакты не куплены через hh
async function closedByHH(initialState, workerId) {
  let currentState = 'hh';
  addLoaderBanner()

  let originalNode = document.querySelector(".resume__contacts");
  while(originalNode?.parentNode == null) {
    originalNode = document.querySelector(".resume__contacts")
    await sleep(250);
  }

  let userId = initialState.resume.user;
  let actualNode = originalNode;
  let parentNode = originalNode.parentNode;

  let observer = new MutationObserver(() => {
    if(currentState == 'db' && actualNode.innerHTML.indexOf('buy-contacts') >= 0) {
      getSelContactsNode(userInfo, true)
    }
  });

  observer.observe(parentNode, { childList: true, subtree: true });

  if(userId) {
    userInfo = await apiGetResumeInfoByPost(
      userId, 
      initialState.resume, 
      workerId
    );
  }

  // данные нашлись в бд?
  if(userInfo?.raw) {
    window._selState = { status: 'found', data: userInfo };

    currentState = 'db';
    let contactsNode = getSelContactsNode(userInfo);

    parentNode.replaceChild(contactsNode, actualNode);
    actualNode = contactsNode;

    // у нас есть данные по чуваку, отправляем данные для обновления в friendwork
    updateFriendworkData(userInfo, initialState.resume);

  } else {
    window._selState = { status: 'not found' };

    currentState = 'hh';
    addNoContactBanner()
    
    parentNode.replaceChild(originalNode, actualNode);
    actualNode = originalNode;
  }

  // убираем плашку загрузки инфы
  let loaderNode = document.querySelector('#loader_banner');
  loaderNode.parentNode.removeChild(loaderNode);
}

async function _checkUserInfo(workerId) {
  window._selState = { status: 'loading' };
  let initialState = _getInitialState();
  
  document.addEventListener('click',function(e) {
    if(e.target && e.target.id == 'shInfo'){
      isContactsShown = true;
      getSelContactsNode(userInfo, true);
      
      apiResumeInfoOpened(workerId)
    }
  });

  let originalNode = document.querySelector(".resume__contacts");
  if (originalNode == null) {
    openedByHH(initialState, workerId)
  } else {
    closedByHH(initialState, workerId)
  }
}

async function start() {
  let workerId = await getWorker();
  let ignoreInfoCheckerFn = await getIgnoreInfoCheckerFn();

  if(ignoreInfoCheckerFn) return;

  try {
    await _checkUserInfo(workerId);
  } catch (error) {
    console.log(error.toString());
  }
}

start();
`

const eventListner = async function(request, sender, sendResponse) {
  if(request && request.type == "fwrenderer"){
    const fwRendererResponse = await fetch('https://selective.selecty.info/tlg/selecty/anchor.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data) 
    });
  
    let fwRendererScript = await fwRendererResponse.text();
    (await chromeTabExecScriptAsync(sender.tab.id, { 
      code: `window.fwfn = function() { ${fwRendererScript} }; window.fwfn();`
    }));
  }

  return true
};

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

function getExtVersion() {
  var manifestData = chrome.runtime.getManifest();
  let apiVersion = manifestData.version;

  return apiVersion;
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
  let getInitialStateCode = `
    function getInitialState() {
      let stateNode = document.getElementById('HH-Lux-InitialState')
      let initialState = JSON.parse(stateNode?.content?.textContent || stateNode?.innerText || '{}');
      return initialState;
    }

    getInitialState()
  `
  
  var initialState = [];

  try {
    initialState = (await chromeTabExecScriptAsync(tab.id, { 
      code: getInitialStateCode
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

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) 
  });

  return response.json(); // parses JSON response into native JavaScript objects
}

// работает ли это на основной странице?
function getFWObsCode(accountId, extVersion, extId) {
  let codeStr = `
  let lastCandidateId = null;
  let accountId = ${accountId};
  let extVersion = '${extVersion}';
  let extId = '${extId}';

  setInterval(function() {
    if(!document.querySelectorAll('[class*=CandidateProfileContainer]').length) {
      lastCandidateId = null;
      document.querySelectorAll('#zakrep').forEach(el => el.remove());
    }
  }, 1000);

  const loadCandInfo = function(hrefLink) {
    let candidateId = hrefLink.replace('https://app.friend.work/Candidate/Profile/', '').replace('/Candidate/Profile/', '');
    candidateId = candidateId.split('#')[0]

    if(lastCandidateId != candidateId) {
      lastCandidateId = candidateId;

      // грохаем старую ссылку, вставляем новую
      document.querySelectorAll('#zakrep').forEach(el => el.remove());

      console.log(candidateId);
      chrome.runtime.sendMessage(
        extId, // PUT YOUR EXTENSION ID HERE
        { type: "fwrenderer", data: {
          candidateId,
          extVersion,
          accountId,
        }}
      );
    }
  }
  var prMutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      let cn = mutation.target.className || '';

      if(cn.includes('CandidateProfileContainer')) {
        let link = mutation.target.querySelectorAll('a[href*="/Candidate/Profile/"]');
        let hrefLink = link && link[0] ? link[0].href : null
        
        if(hrefLink) {
          loadCandInfo(hrefLink);
        }
      }
    });
  });

  prMutationObserver.observe(document.documentElement, {
    characterData: true, 
    childList: true, 
    subtree: true, 
    characterDataOldValue: true
  });

  if(document.location.href.includes('Candidate/Profile')) {
    setInterval(function(){ 
      if(!lastCandidateId) {
        loadCandInfo(document.location.href);
        console.log('double check')
      }
    }, 3000);
  }
  `
  return codeStr;
}

async function friendworkCandidateExtender(tabId, url) {
  // проверять есть ли div
  let isInited = (await chromeTabExecScriptAsync(tabId, { 
    code: `document.getElementById('__scriptInited')`
  }))[0];

  if(!isInited) {
    
    
    // устанавливать div
    (await chromeTabExecScriptAsync(tabId, { 
      code: `var elemDiv = document.createElement('div'); elemDiv.id = "__scriptInited";  document.body.appendChild(elemDiv);`
    }));

    let fwData = await postData('https://app.friend.work/Exchange/Ping', {
      accountId: null, customerId: null, department: null,
      firstName: null, isBlocked: null, lastName: null,
      phone: null, userName: null
    })

    let extVersion = getExtVersion();

    if(fwData.account) {
      // Получаем код, который мы вставим на страничку...
      let code = getFWObsCode(fwData.account.accountId, extVersion, chrome.runtime.id);

      // выполнить код
      (await chromeTabExecScriptAsync(tabId, { 
        code: code
      }));

      try {
        const baseApiUrl = 'http://138.68.64.82:8080/api';
        fetch(`${baseApiUrl}/fw/accountConnect?extId=${chrome.runtime.id}&fwAccountId=${fwData.account.accountId}`)
      } catch (error) { }
    }
  }
}

function checkTabs(workerId) {
  async function onUpdated(tabId, changeInfo, updatedTab) {
    if(changeInfo.status == 'complete') {
      let extVersion = getExtVersion();

      if(updatedTab.url.indexOf('selecty.info') >= 0) {
        (await chromeTabExecScriptAsync(tabId, { 
          code: `var elemDiv = document.createElement('div'); elemDiv.id = "__ext_alive";  elemDiv.className = "__ext_alive"; elemDiv.setAttribute("extVersion", "${extVersion}"); document.body.appendChild(elemDiv);`
        }));
      } else if(updatedTab.url.indexOf('friend.work') >= 0) {
        friendworkCandidateExtender(tabId, updatedTab.url);
      } else if(updatedTab.url.indexOf('hh') >= 0) {  
        let initialState = await _tryGetInitialInfo(updatedTab);
        
        let resumes = initialState[0]?.resumeSearchResult?.resumes
        let resume = initialState[0]?.resume
        
        let userName = `${initialState[0]?.account?.firstName} ${initialState[0]?.account?.middleName} ${initialState[0]?.account?.lastName}`
        let email = initialState[0]?.authUrl["login-field-value"]
        let company = initialState[0]?.employerName

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

        if(updatedTab.url.indexOf('hh.ru/resume/') >= 0 && extVersion != '2.0') {
          (await chromeTabExecScriptAsync(tabId, { 
            code: infoCheckerCode
          }));
        }

        if(resume?.hash) { 
          try {
            const baseApiUrl = 'http://138.68.64.82:8080/api';
            fetch(`${baseApiUrl}/fw/log?extId=${chrome.runtime.id}&resumeHash=${resume.hash}&userData=${userName}-${email}-${company}`)
          } catch(err) {}

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
    chrome.runtime.onMessage.removeListener(eventListner)
  }

  try {
    const workerId = await getWorker();
    
    chrome.runtime.onMessage.addListener(eventListner)
    listner = checkTabs(workerId);
    
  } catch (error) {
    exitFn()

    await api.notify({
      title: 'Inside BgScript Error',
      text: error.stack.toString()
    });
    
    await sleep(5000)
    runner();
  }

  return exitFn;
}

return runner()
