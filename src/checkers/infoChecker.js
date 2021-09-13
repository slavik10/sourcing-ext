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
}

const apiCreateWorker = async () => {
  let response = await fetch(`${baseApiUrl}/workers/create`, {
    method: 'POST'
  });
  let result = await response.json();

  return result.id;
}

const apiResumeInfoOpened = async (workerId) => {
  let res = await fetch(`${baseApiUrl}/resume/infoOpened?workerId=${workerId}`);
  let result = await res.json();

  return result;
}

const apiGetResumeInfoByPost = async (userId, resumeData, workerId) => {
  // let res = await fetch(`${baseApiUrl}/resume/info?userId=${userId}&workerId=${workerId}`);
  // let resumeRes = await res.json();
  
  let res = await fetch(`${baseApiUrl}/resume/smartinfo`, {
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
  let res = await fetch(`${baseApiUrl}/resume/info?userId=${userId}&workerId=${workerId}`);
  let resumeRes = await res.json();
  
  return resumeRes
}

function getNoContactBanner() {
  let html = '<div class="info-block">'
  html += '   <div class="info-block-substrate-warning">'
  html += '      <div class="bloko-columns-wrapper">'
  html += '         <div class="bloko-column bloko-column_xs-4 bloko-column_s-6 bloko-column_m-12 bloko-column_l-16">'
  html += '            <div class="bloko-gap bloko-gap_top bloko-gap_bottom">'
  html += `               <p>К сожалению контакт не нашелся у нас в БД, при необходимости покупайте контакт через HH (синяя кнопка)</p>`
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
  html += `               <p>Проверка наличия резюме во внутренней базе, пока не открывайте контакты!</p>`
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
    fetch(`https://selective.selecty.info/erp/scripts/parse/flow.php`, {
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
    let phones = (userInfo.phone || []).map(el => el.formatted).join(', ');
    let emails = userInfo.email.join(', ');

    let html = `<div>`
    if(isContactsShown) {
      html += `<p>Имя: ${userInfo.name}</p>`
      html += `<p>Телефон: ${phones}</p>`
      html += `<p>Email: ${emails}</p>`
      
      if(userInfo.fwId) {
        let fwLink = `https://app.friend.work/Candidate/Profile/${userInfo.fwId}`
        html += `<p><a href="${fwLink}" target="_blank">ссылка на Friendwork</a></p>`
      } else {
        html += `<p>Кандидат почему-то не нашелся на friend.work :( обратитесь к админам</p>`
      }

    } else {
      html += `<p><button id="shInfo">Показать контакты</button></p>`
    }
    html += `</div>`

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
      let lines = originalNode.innerText.split('\n')
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
            "raw": str.replace( /\D+/g, '').trim(), // только цифры
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

  try {
    await _checkUserInfo(workerId);
  } catch (error) {
    console.log(error.toString());
  }
}

start();