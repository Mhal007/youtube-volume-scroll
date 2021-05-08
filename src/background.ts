import {DEFAULT_VOLUME_STEP} from "./const";

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({volumeStep: DEFAULT_VOLUME_STEP}, function() {
    console.log("Volume step set to " + DEFAULT_VOLUME_STEP);
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'youtube.com' },
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
      chrome.tabs.sendMessage(tabId, {
        message: 'TAB_URL_CHANGED',
        url: changeInfo.url
      })
    }
  }
);
