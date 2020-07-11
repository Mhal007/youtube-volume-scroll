let indicatorTimeout;
const onWheel = (event, video, volumeIndicator) => {
  event.preventDefault();
  chrome.storage.sync.get(['volumeStep'], (result => {
    const volumeStep = +(result.volumeStep / 100).toFixed(2);
    let newVolume;
    if (event.deltaY < 0) {
      // Scroll up
      newVolume = Math.min(+((video.volume ?? 0) + volumeStep).toFixed(2), 1);
    } else {
      // Scroll down
      newVolume = Math.max(+((video.volume ?? 0) - volumeStep).toFixed(2), 0);
    }

    video.volume = newVolume;
    localStorage.setItem('yt-player-volume', JSON.stringify({
      creation: Date.now(),
      data: JSON.stringify({ volume: +(newVolume * 100).toFixed(0), muted: false }),
      expiration: Date.now() + 1000 * 60 * 60 * 24 * 30
    }))

    volumeIndicator.innerHTML = `<div>${(newVolume * 100).toFixed(0)}</div>`;
    volumeIndicator.style.display = 'block';

    if (indicatorTimeout) {
      window.clearTimeout(indicatorTimeout);
    }

    indicatorTimeout = setTimeout(() => {
      volumeIndicator.style.display = 'none';
    }, 1000)
  }));
}

const video = document.getElementsByTagName('video')[0];
if (video) {
  // const lastUsedVolume = JSON.parse(JSON.parse(localStorage.getItem('yt-player-volume') ?? '{}')?.data ?? '{}')?.volume;
  // console.log('lastUsedVolume', lastUsedVolume);
  // if (lastUsedVolume) {
  //   setTimeout(() => {
  //     video.volume = +(lastUsedVolume / 100).toFixed(2);
  //     }, 100);
  //   console.log('video.volume', video.volume);
  // }

  const volumeIndicator = document.createElement('div');
  volumeIndicator.id = "volume-indicator"

  video.addEventListener('wheel', event => onWheel(event, video, volumeIndicator));
  video.parentElement.appendChild(volumeIndicator);
}
