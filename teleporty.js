let audibleTab = null;

async function findFirstAudibleTab() {
  let tabs = await browser.tabs.query({
    audible: true,
    // currentWindow: true
  });

  if (tabs.length > 0) {
    return tabs[0].id;
  }
}

async function teleport(tab) {
  if (audibleTab == null) {
    audibleTab = await findFirstAudibleTab();
  }

  // teleport to the audible tab
  browser.tabs.update(audibleTab, {
    active: true
  }).catch();
}

function processTabUpdate(tabId, currentInfo) {
  if (currentInfo.audible === true) {
    audibleTab = tabId;
  }
}

browser.tabs.onUpdated.addListener(processTabUpdate);
browser.browserAction.onClicked.addListener(teleport);
