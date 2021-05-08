import './index.less';
import { ChromeStorageItems, isHTMLElement } from "./types";
import {CHROME_STORAGE_VOLUME_STEP_KEY, DEFAULT_VOLUME, STORAGE_VOLUME_KEY, VOLUME_INDICATOR_ID} from "./const";

/* GETTERS */

const getVideo = () => {
  const video = document.querySelector('video');
  if (!video) {
    console.error('Video element not found');
  }

  return video;
}

const getVolumeIndicator = () => {
  const volumeIndicator = document.querySelector<HTMLElement>(`#${VOLUME_INDICATOR_ID}`);
  if (!volumeIndicator) {
    console.error('Volume indicator not found');
  }

  return volumeIndicator;
}

const getVolumeSliderHandle = () => {
  const volumeSliderHandle = document.querySelector<HTMLElement>('.ytp-volume-slider-handle');
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

const setVolume = (newVolume: number) => {
  setVideoVolume(newVolume);
  setSliderVolume(newVolume);
  setStorageVolume(newVolume);
  setIndicatorVolume(newVolume);
}

const setVideoVolume = (newVolume: number) => {
  const video = getVideo();
  if (!video) {
    return;
  }

  video.volume = newVolume;
}

const setSliderVolume = (newVolume: number) => {
  const volumeSliderHandle = getVolumeSliderHandle();
  if (!volumeSliderHandle) {
    return;
  }

  volumeSliderHandle.style.left = newVolume * 40 + 'px';
}

const setStorageVolume = (newVolume: number) => {
  const now = Date.now();
  const newVolumeObject = JSON.stringify({
    creation: now,
    data: JSON.stringify({ volume: +(newVolume * 100).toFixed(0), muted: false }),
    expiration: now + 1000 * 60 * 60 * 24 * 30
  });

  localStorage.setItem(STORAGE_VOLUME_KEY, newVolumeObject)
  sessionStorage.setItem(STORAGE_VOLUME_KEY, newVolumeObject)
}

const setIndicatorVolume = (newVolume: number) => {
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

const adjustVolume = (event: WheelEvent) => {
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

const withVolumeStep = (callback: (items: ChromeStorageItems) => void) => {
  chrome.storage.sync.get([CHROME_STORAGE_VOLUME_STEP_KEY], callback);
}

const onWheel = (event: WheelEvent) => {
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
    function(request) {
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
      let node = mutation.target as HTMLElement;

      if (isHTMLElement(node) && node.tagName === 'VIDEO') {
        retrieveLastUsedVolume();
      }

      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const added = mutation.addedNodes[i] as HTMLElement;

        if (isHTMLElement(added) && added.tagName === 'VIDEO') {
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

let indicatorTimeout: number | undefined;

const initiateVolumeIndicator = () => {
  const video = getVideo();
  if (!video) {
    return;
  }

  const volumeIndicator = document.createElement('div');
  volumeIndicator.id = VOLUME_INDICATOR_ID;

  video.parentElement?.appendChild(volumeIndicator);
}

initiateVolumeIndicator();


/* EXECUTION */

retrieveLastUsedVolume();
listenForVideoScroll();
listenForVideoChanges();
listenForUrlChange();
