const blockAdsCheckbox = document.querySelector('.block-ads input[type="checkbox"]');
const blockAdTrackersCheckbox = document.querySelector('.block-ad-trackers input[type="checkbox"]');
const blockAdsButton = document.querySelector('.block-ads span');
const blockAdTrackersButton = document.querySelector('.block-ad-trackers span');

blockAdsCheckbox.addEventListener('change', () => {
  if (blockAdsCheckbox.checked) {
    blockAdsButton.textContent = 'Ads Blocked';
    // logic for blocking ads
  } else {
    blockAdsButton.textContent = 'Block Ads';
    // Logic for unblocking ads
  }
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

