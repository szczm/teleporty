let audibleTab = null;
let lastTabId = null;

async function findFirstAudibleTab() {
  let tabs = await browser.tabs.query({
    audible: true,
    // currentWindow: true
  });

  if (tabs.length > 0) {
    return tabs[0];
  }
}

async function isAudibleTabActive() {
  if (audibleTab == null) {
    audibleTab = await findFirstAudibleTab();

    if (audibleTab == null) {
      return;
    }
  }

  let tabs = await browser.tabs.query({ active: true });

  return tabs.some(tab => tab.id == audibleTab.id);
}

async function teleport(tab) {
  if (audibleTab == null) {
    audibleTab = await findFirstAudibleTab();

    if (audibleTab == null) {
      return;
    }
  }

  let targetTabId = await isAudibleTabActive() ? lastTabId : audibleTab.id;
    
  // teleport to the audible tab
  browser.tabs.update(targetTabId, {
    active: true
  }).catch();
}

async function updateIcon() {
  if (await isAudibleTabActive() == true) {
    setAudibleActiveIcon();
  } else {
    setAudibleInactiveIcon();
  }
}

function setAudibleInactiveIcon() {
  browser.browserAction.setIcon({
    path: {
      16: "/icons/teleporty-16.png",
      32: "/icons/teleporty-32.png",
    }
  });
}

function setAudibleActiveIcon() {
  browser.browserAction.setIcon({
    path: {
      16: "/icons/teleporty-active-16.png",
      32: "/icons/teleporty-active-32.png",
    }
  });
}

function assignAudibleTab(tabId, currentInfo, tab) {
  if (currentInfo.audible === true) {
    audibleTab = tab;
  }
}

function assignLastTab(activeInfo) {
  if (audibleTab && audibleTab.windowId === activeInfo.windowId) {
    lastTabId = activeInfo.previousTabId;
  }
}

function checkRemovedTab(tabId) {
  if (audibleTab && audibleTab.id == tabId) {
    audibleTab = null;
  }

  if (lastTabId == tabId) {
    lastTabId = null;
  }
}
browser.tabs.onUpdated.addListener(assignAudibleTab);
browser.tabs.onActivated.addListener(assignLastTab);
browser.tabs.onRemoved.addListener(checkRemovedTab)

browser.tabs.onUpdated.addListener(updateIcon);
browser.tabs.onActivated.addListener(updateIcon);
browser.tabs.onRemoved.addListener(updateIcon);

updateIcon();

browser.browserAction.onClicked.addListener(teleport);
// browser.browserAction.onClicked.addListener(teleport);
