function getHtmlBanner(src) {
  let html = '<div class="info-block">'
  html += '   <div class="info-block-substrate-warning">'
  html += '      <div class="bloko-columns-wrapper">'
  html += '         <div class="bloko-column bloko-column_xs-4 bloko-column_s-6 bloko-column_m-12 bloko-column_l-16">'
  html += '            <div class="bloko-gap bloko-gap_top bloko-gap_bottom">'
  html += `               <p>Ваше расширение Selecty-CRM устарело, скачайте новую версию по <a href="${src}" target="_blank">cсылке</a>, или обратитесь к администратору</p>`
  html += '            </div>'
  html += '         </div>'
  html += '      </div>'
  html += '   </div>'
  html += '</div>'
  
  return html;
}

async function _getLatestVersion() {
  const baseApiUrl = 'https://amocrm-hr.vercel.app/api';

  let res = await fetch(`${baseApiUrl}/version`);
  let versionInfo = await res.json();

  return versionInfo;
}

async function addBanner(versionInfo) {
  let bannerHtml = getHtmlBanner(versionInfo.src);
  
  // Get the current element
  var parentNode = document.querySelector("body");;

  // Create a new element
  var newNode = document.createElement('div');

  // Add ID and content
  newNode.id = 'banner';
  newNode.innerHTML = bannerHtml;

  parentNode.prepend(newNode)
}

async function _checkVersion() {
  const CURRENT_VERSION = 3;
  let latestVersionInfo = await _getLatestVersion();

  if(latestVersionInfo.version > CURRENT_VERSION) {
    addBanner(latestVersionInfo);
  }
}

async function _start() {
  try {
    await _checkVersion();
  } catch (error) {
    console.log(error.toString());
  }
}

_start();