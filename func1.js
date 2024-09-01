const blockAdsCheckbox = document.getElementById('ad-block-toggle');
const blockAdTrackersCheckbox = document.querySelector('.block-ad-trackers input[type="checkbox"]');
const blockAdsButton = document.querySelector('.block-ads span');
const blockAdTrackersButton = document.querySelector('.block-ad-trackers span');

chrome.storage.sync.get(['adBlockEnabled'], (result) => {
  blockAdsCheckbox.checked = result.adBlockEnabled || false;
  blockAdsButton.textContent = blockAdsCheckbox.checked ? 'Ads Blocked' : 'Block Ads';
});

// listen for checkbox if toggled or not
blockAdsCheckbox.addEventListener('change', () => {
  const isEnabled = blockAdsCheckbox.checked;
  
  blockAdsButton.textContent = isEnabled ? 'Ads Blocked' : 'Block Ads';

  // send message to background script to enable/disable ad blocking
  chrome.runtime.sendMessage({ action: 'toggleAdBlock', enabled: isEnabled });

  // save the state
  chrome.storage.sync.set({ adBlockEnabled: isEnabled });
});

blockAdTrackersCheckbox.addEventListener('change', () => {
  if (blockAdTrackersCheckbox.checked) {
    blockAdTrackersButton.textContent = 'Ad Trackers Blocked';
    // logic for blocking ad trackers
  } else {
    blockAdTrackersButton.textContent = 'Block Ad Trackers';
    // Logic for unblocking ad trackers
  }
});

