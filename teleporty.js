let audibleTab = null;
let lastTabIds = {};

const AUDIBLE_TAB_NOT_FOUND = new Object;

async function findFirstAudibleTab(excludeTabId = null) {
  let tabs = await browser.tabs.query({
    audible: true,
    // currentWindow: true
  });

  if (excludeTabId != null) {
    tabs = tabs.filter(tab => tab.id != excludeTabId);
  }

  if (tabs.length > 0) {
    return tabs[0];
  }

  return AUDIBLE_TAB_NOT_FOUND;
}

async function isAudibleTabActive() {
  if (audibleTab == null) {
    let newAudibleTab = await findFirstAudibleTab();

    if (newAudibleTab == AUDIBLE_TAB_NOT_FOUND) {
      return false;
    }

    audibleTab = newAudibleTab;
  }

  let tabs = await browser.tabs.query({ active: true });

  return tabs.some(tab => tab.id == audibleTab.id);
}

async function teleport(tab) {
  if (audibleTab == null) {
    let newAudibleTab = await findFirstAudibleTab();

    if (newAudibleTab != AUDIBLE_TAB_NOT_FOUND) {
      audibleTab = newAudibleTab;
    }
  }

  // Gotta refresh that data
  let freshAudible = await browser.tabs.get(audibleTab.id);
  let targetTabId = freshAudible.active ? lastTabIds[audibleTab.windowId] : audibleTab.id;

  // teleport to the audible tab
  browser.tabs.update(targetTabId, {
    active: true
  }).catch(console.log);
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

async function assignAudibleTab(tabId, currentInfo, tab) {
  if (currentInfo.audible === true) {
    audibleTab = tab;
    return;
  }

  if (currentInfo.audible === false) {
    // This should probably use a stack for best UX, but I'm lazy
    let newAudibleTab = await findFirstAudibleTab(tabId);

    if (newAudibleTab != AUDIBLE_TAB_NOT_FOUND) {
      audibleTab = newAudibleTab;
      return;
    }
  }
}

async function assignLastTab(activeInfo) {
  // if (audibleTab && audibleTab.windowId === activeInfo.windowId) {
    // lastTabId = activeInfo.previousTabId;
  // }

  let previousTab = await browser.tabs.get(activeInfo.previousTabId);

  lastTabIds[previousTab.windowId] = activeInfo.previousTabId;
}

async function checkRemovedTab(tabId, removeInfo) {
  if (audibleTab && audibleTab.id == tabId) {
    audibleTab = null;

    // This should probably use a stack for best UX, but I'm lazy
    let newAudibleTab = await findFirstAudibleTab();

    if (newAudibleTab != AUDIBLE_TAB_NOT_FOUND) {
      audibleTab = newAudibleTab;
      return;
    }

    if (removeInfo.isWindowClosing === false) {
      let tabs = await browser.tabs.query({
        active: true,
        windowId: removeInfo.windowId
      });
      
      audibleTab = tabs[0];
    }
  }

  // if (lastTabId == tabId) {
  //   lastTabId = null;
  // }

  if (tabId == lastTabIds[removeInfo.windowId]) {
    delete lastTabIds[removeInfo.windowId];
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
