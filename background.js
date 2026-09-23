// Background Service Worker for Social Anti-Ragebait
// Handles extension lifecycle and navigation messages

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Social Anti-Ragebait] Extension installed / updated.');
  // Set default confidence threshold in storage if not already set
  chrome.storage.local.get(['confidenceThreshold'], (res) => {
    if (typeof res.confidenceThreshold !== 'number') {
      chrome.storage.local.set({ confidenceThreshold: 0.30 });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard.html');
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime?.lastError || !tabs) {
          chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
            sendResponse({ success: true, tabId: newTab ? newTab.id : null });
          });
          return;
        }
        const existingTab = tabs.find((t) => t.url && t.url.startsWith(dashboardUrl));
        if (existingTab && existingTab.id) {
          chrome.tabs.update(existingTab.id, { active: true });
          if (existingTab.windowId) {
            chrome.windows.update(existingTab.windowId, { focused: true });
          }
          sendResponse({ success: true, tabId: existingTab.id });
        } else {
          chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
            sendResponse({ success: true, tabId: newTab ? newTab.id : null });
          });
        }
      });
    } else if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
        sendResponse({ success: true, tabId: newTab ? newTab.id : null });
      });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }
});
