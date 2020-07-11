const defaultVolumeStep = 3;

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({volumeStep: defaultVolumeStep}, function() {
    console.log("The volume step has been set to " + defaultVolumeStep);
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'youtube.com'},
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});
