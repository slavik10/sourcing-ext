async function getBackgroundScript() {
  var url = `https://raw.githubusercontent.com/slavik10/sourscree-ext/slct/dist/backgroundScript.js`;    

  let response = await fetch(url);
  let storedText = await response.text();

  return storedText;
}

async function getBackgroundTabCheckerScript() {
  let str = `async function _getStorage(key) { `
  str += `return new Promise(async (resolve, reject) => { `
  str += ` chrome.storage.local.get(key, (result)=> { `
  str += ` resolve(result[key]); `
  str += ` }) `
  str += ` }) `
  str += ` } `

  str += ` setInterval(async function() { console.log((await _getStorage('worker')))}, 3000); `

  return str;
}

async function errorCatcher(fn, catchFn = () => {}) {
  try {
    fn();
  } catch (error) {
    await api.notify({
      title: 'Global Error',
      text: error.toString()
    });

    catchFn();
  }
}

async function runner() {
  let backgroundScript = await getBackgroundScript();

  setTimeout(() => {
    errorCatcher(() => {
      eval(backgroundScript);
    });
  }, 1);
}

runner()