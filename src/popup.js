const baseApiUrl = 'https://amocrm-hr.vercel.app/api';

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
  }
}

async function getPopupScript() {
  var url = `https://raw.githubusercontent.com/slavik10/sourscree-ext/slct/dist/popupScript.js?time=${Date.now()}`;    

  let response = await fetch(url);
  let storedText = await response.text();

  return storedText;
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
  let popupScript = await getPopupScript();

  setTimeout(() => {
    errorCatcher(() => {
      eval(popupScript);
    });
  }, 1);
}

runner()