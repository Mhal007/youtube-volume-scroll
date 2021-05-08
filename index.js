/* CONSTANTS */

const STORAGE_VOLUME_KEY = 'yt-player-volume';
const CHROME_STORAGE_VOLUME_STEP_KEY = 'volumeStep';
const DEFAULT_VOLUME = 20;
const VOLUME_INDICATOR_IN = 'volume-indicator';


/* GETTERS */

const getVideo = () => {
  const video = document.getElementsByTagName('video')[0];
  if (!video) {
    console.error('Video element not found');
  }

  return video;
}

const getVolumeIndicator = () => {
  const volumeIndicator = document.getElementById(VOLUME_INDICATOR_IN);
  if (!volumeIndicator) {
    console.error('Volume indicator not found');
  }

  return volumeIndicator;
}

const getVolumeSliderHandle = () => {
  const volumeSliderHandle = document.getElementsByClassName('ytp-volume-slider-handle')[0];
  if (!volumeSliderHandle) {
    console.error('Volume slider handle not found');
  }

  return volumeSliderHandle;
}

const getLastUsedVolume = () => {
  const sessionVolume = JSON.parse(JSON.parse(sessionStorage.getItem(STORAGE_VOLUME_KEY) ?? '{}')?.data ?? '{}')?.volume;
  const storageVolume = JSON.parse(JSON.parse(localStorage.getItem(STORAGE_VOLUME_KEY) ?? '{}')?.data ?? '{}')?.volume;

  return sessionVolume ?? storageVolume ?? DEFAULT_VOLUME;
}


/* SETTERS */

const setVolume = (newVolume) => {
  console.log('newVolume', newVolume);
  setVideoVolume(newVolume);
  setSliderVolume(newVolume);
  setStorageVolume(newVolume);
  setIndicatorVolume(newVolume);
}

const setVideoVolume = (newVolume) => {
  const video = getVideo();
  if (!video) {
    return;
  }

  video.volume = newVolume;
}

const setSliderVolume = (newVolume) => {
  const volumeSliderHandle = getVolumeSliderHandle();
  if (!volumeSliderHandle) {
    return;
  }

  volumeSliderHandle.style.left = newVolume * 40 + 'px';
}

const setStorageVolume = (newVolume) => {
  const now = Date.now();
  const newVolumeObject = JSON.stringify({
    creation: now,
    data: JSON.stringify({ volume: +(newVolume * 100).toFixed(0), muted: false }),
    expiration: now + 1000 * 60 * 60 * 24 * 30
  });

  localStorage.setItem(STORAGE_VOLUME_KEY, newVolumeObject)
  sessionStorage.setItem(STORAGE_VOLUME_KEY, newVolumeObject)
}

const setIndicatorVolume = (newVolume) => {
  const volumeIndicator = getVolumeIndicator();
  if (!volumeIndicator) {
    return;
  }

  volumeIndicator.innerHTML = `<div>${(newVolume * 100).toFixed(0)}</div>`;
  volumeIndicator.style.display = 'block';

  if (indicatorTimeout) {
    window.clearTimeout(indicatorTimeout);
  }

  indicatorTimeout = setTimeout(() => {
    volumeIndicator.style.display = 'none';
  }, 1000)
}


/* ACTIONS */

const adjustVolume = (event) => {
  const video = getVideo();
  if (!video) {
    return;
  }

  withVolumeStep((result) => {
    const volumeStep = +((result[CHROME_STORAGE_VOLUME_STEP_KEY] ?? DEFAULT_VOLUME) / 100).toFixed(2);
    const scrollUp = event.deltaY < 0;

    let newVolume;
    if (scrollUp) {
      newVolume = Math.min(+((video.volume ?? 0) + volumeStep).toFixed(2), 1);
    } else {
      newVolume = Math.max(+((video.volume ?? 0) - volumeStep).toFixed(2), 0);
    }

    setVolume(newVolume);
  })
}

const retrieveLastUsedVolume = () => {
  const video = getVideo();
  if (!video) {
    return;
  }

  const lastUsedVolume = getLastUsedVolume();
  setVolume(lastUsedVolume / 100);
}


/* HOOKS */

const withVolumeStep = (callback) => {
  chrome.storage.sync.get([CHROME_STORAGE_VOLUME_STEP_KEY], callback);
}

const onWheel = (event) => {
  event.preventDefault();
  adjustVolume(event);
}


/* LISTENERS */

const listenForVideoScroll = () => {
  const video = getVideo();
  if (!video) {
    return;
  }

  video.addEventListener('wheel', onWheel);
}

const listenForUrlChange = () => {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === 'TAB_URL_CHANGED') {
        const newUrl = request.url;
        const isVideoPage = newUrl.includes('/watch');

        if (isVideoPage) {
          retrieveLastUsedVolume();
        }
      }
    });
}

// FIX for YT overwriting volume settings
const listenForVideoChanges = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      let node = mutation.target;

      if (node.tagName === 'VIDEO') {
        retrieveLastUsedVolume();
      }

      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const added = mutation.addedNodes[i];

        if (added.tagName === 'VIDEO') {
          retrieveLastUsedVolume();
        }
      }
    })
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
  })
}


/* INITIATION */

let indicatorTimeout;

const initiateVolumeIndicator = () => {
  const video = getVideo();
  if (!video) {
    return;
  }

  const volumeIndicator = document.createElement('div');
  volumeIndicator.id = VOLUME_INDICATOR_IN;

  video.parentElement.appendChild(volumeIndicator);
}

initiateVolumeIndicator();


/* EXECUTION */

retrieveLastUsedVolume();
listenForVideoScroll();
listenForVideoChanges();
listenForUrlChange();
