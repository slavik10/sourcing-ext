function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

// var el = document.createElement("span");
// el.innerHTML = "test";
// "test"
// 

function createActionBtnEl(params) {
  let htmlEl = `<div class="ih">`
  htmlEl += `      Основная техология для резюме: <select id="mainTag-${params.dbId}">` 
  htmlEl += `      <option value="">Не определено</option>` 
  htmlEl += `      ` 
  htmlEl += `      <option value="Java">Java</option>` 
  htmlEl += `      <option value="JavaScript">JavaScript</option>` 
  htmlEl += `      <option value="Angular">Angular</option>` 
  htmlEl += `      <option value="Kotlin">Kotlin</option>` 
  htmlEl += `      <option value="Python">Python</option>` 
  htmlEl += `      <option value="С#">С#</option>` 
  htmlEl += `      <option value="1C">1C</option>` 
  htmlEl += `      <option value="ABAP">ABAP</option>` 
  htmlEl += `      <option value="Android">Android</option>` 
  htmlEl += `      <option value="Axapta">Axapta</option>` 
  htmlEl += `      <option value="C++">C++</option>` 
  htmlEl += `      <option value="Delphi">Delphi</option>` 
  htmlEl += `      <option value="Devops">Devops</option>` 
  htmlEl += `      <option value="DWH">DWH</option>` 
  htmlEl += `      <option value="ETL">ETL</option>` 
  htmlEl += `      <option value="Flutter">Flutter</option>` 
  htmlEl += `      <option value="Go">Go</option>` 
  htmlEl += `      <option value="IOS">IOS</option>` 
  htmlEl += `      <option value="ML, DataScience">ML, DataScience</option>` 
  htmlEl += `      <option value="Node.js">Node.js</option>` 
  htmlEl += `      <option value="Objective-C">Objective-C</option>` 
  htmlEl += `      <option value="Oracle DB">Oracle DB</option>` 
  htmlEl += `      <option value="Perl">Perl</option>` 
  htmlEl += `      <option value="PHP">PHP</option>` 
  htmlEl += `      <option value="PL/SQL">PL/SQL</option>` 
  htmlEl += `      <option value="QA">QA</option>` 
  htmlEl += `      <option value="React">React</option>` 
  htmlEl += `      <option value="Ruby">Ruby</option>` 
  htmlEl += `      <option value="SAP">SAP</option>` 
  htmlEl += `      <option value="Scala">Scala</option>` 
  htmlEl += `      <option value="SharePoint">SharePoint</option>` 
  htmlEl += `      <option value="Swift">Swift</option>` 
  htmlEl += `      <option value="Unity Engine">Unity Engine</option>` 
  htmlEl += `      <option value="Unreal Engine">Unreal Engine</option>` 
  htmlEl += `      <option value="Vue">Vue</option>` 
  htmlEl += `    </select>` 

  htmlEl += `    <button id="addToBubble-${params.dbId}" style="width: 200px">` 
  htmlEl += `      Добавить в очередь` 
  htmlEl += `    </button>` 

  htmlEl += `    </div>` 

  var el = document.createElement("div");
  el.innerHTML = htmlEl;
  
  return el
}

async function markExistingContacts(contacts) {
  // как это работает?
  
  for (let i = 0; i < contacts.length; i++) {
    const res = contacts[i];

    if(res.raw) {
      let parentNode = document.querySelector(`[data-resume-id="${res.hhResumeId}"]`);
      parentNode.style.background = '#EDF4F0';
      
      let actionsEl = createActionBtnEl(res)

      insertAfter(
        parentNode.querySelector('.output__addition:last-child'), 
        actionsEl
      );

      var uplCreateTaskButton = parentNode.querySelector(`#addToBubble-${res.dbId}`);  

      uplCreateTaskButton.addEventListener('click', async function() { 
        let parent = this.closest('.ih')

        var mainTagSelect = parent.querySelector(`#mainTag-${res.dbId}`);
        const mainTag = mainTagSelect.value; // как получить имя файла?
      
        if(!mainTag) {
          alert('Технология не выбрана')
          return;
        }

        let formData = new FormData();
        formData.append("userId", res.dbId);
        formData.append("mainTag", mainTag);
  
        await fetch('https://atsjobforce.bubbleapps.io/api/1.1/wf/getcandidatesfortasks', {
          method: 'POST',
          body: formData
        });
  
        alert('done')

        // alert(`${res.dbId} - ${res.hhResumeId} - ${mainTagSelect.value}`);
        // alert(res.dbId);
        // alert(res.dbId);
        // alert(res.hhResumeId);
        // то есть здесь нужно найти парент
        // нужно понять id пользователя
      }, false);
    }
  }

  

  // Повесить обработчик кнопки
  // проверять сразу нужную выпадушку
}

try {
  markExistingContacts(foundContacts)  
} catch (error) {
  console.log(error);
}
