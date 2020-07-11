const volumeStepInput = document.getElementById('volumeStep');
if (volumeStepInput) {
  chrome.storage.sync.get(['volumeStep'], (result => {
    volumeStepInput.value = result.volumeStep;
  }));

  volumeStepInput.addEventListener('change', event => {
    chrome.storage.sync.set({volumeStep: event.target.value}, function() {
      console.log('New volume step is ' + event.target.value);
    })
  })
}
