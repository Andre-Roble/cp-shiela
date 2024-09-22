const blockAdsCheckbox = document.getElementById('ad-block-toggle');
const blockAdTrackersCheckbox = document.querySelector('.block-ad-trackers input[type="checkbox"]');
const blockAdsButton = document.querySelector('.block-ads span');
const blockAdTrackersButton = document.querySelector('.block-ad-trackers span');

// Initialize settings from Chrome storage
chrome.storage.sync.get(['adBlockEnabled', 'adTrackerEnabled'], (result) => {
  blockAdsCheckbox.checked = result.adBlockEnabled || false;
  blockAdTrackersCheckbox.checked = result.adTrackerEnabled || false;
  blockAdsButton.textContent = blockAdsCheckbox.checked ? 'Ads Blocked' : 'Block Ads';
  blockAdTrackersButton.textContent = blockAdTrackersCheckbox.checked ? 'Ad Trackers Blocked' : 'Block Ad Trackers';
});

// Event listener for blocking/unblocking ads
blockAdsCheckbox.addEventListener('change', () => {
  const isEnabled = blockAdsCheckbox.checked;

  if (isEnabled) {
    blockAdsButton.textContent = 'Ads Blocked';
    blockAds();        // Call function to block ads
  } else {
    blockAdsButton.textContent = 'Block Ads';
    unblockAds();      // Call function to unblock ads
  }

  // Send message to background script to enable/disable ad blocking
  chrome.runtime.sendMessage({ action: 'toggleAdBlock', enabled: isEnabled });

  // Save the state
  chrome.storage.sync.set({ adBlockEnabled: isEnabled });
});

// Event listener for blocking/unblocking ad trackers
blockAdTrackersCheckbox.addEventListener('change', () => {
  const isEnabled = blockAdTrackersCheckbox.checked;

  if (isEnabled) {
    blockAdTrackersButton.textContent = 'Ad Trackers Blocked';
    blockTrackers(); // Call function to block trackers
  } else {
    blockAdTrackersButton.textContent = 'Block Ad Trackers';
    unblockTrackers(); // Call function to unblock trackers
  }

  // Save the state
  chrome.storage.sync.set({ adTrackerEnabled: isEnabled });
});

// Back button
document.querySelector('.back-button').addEventListener('click', () => {
  window.history.back();
});

const RULESET_ID = 'ruleset_1';

// Function to block ads and trackers by enabling the ruleset
function blockAds() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: [RULESET_ID] },
    () => {
      console.log("Ads have been blocked.");
    }
  );
}

// Function to unblock ads and trackers by disabling the ruleset
function unblockAds() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: [RULESET_ID] },
    () => {
      console.log("Ads have been unblocked.");
    }
  );
}

// Function to block ad trackers using specific URL patterns
function blockTrackers() {
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      { id: 11, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.google-analytics.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 12, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.facebook.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 13, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.googletagmanager.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 14, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.scorecardresearch.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 15, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.doubleclick.net/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 16, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.adservice.google.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 17, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.quantserve.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 18, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.pinterest.com/*", resourceTypes: ["script", "xmlhttprequest"] } },
      { id: 19, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*.linkedin.com/*", resourceTypes: ["script", "xmlhttprequest"] } }
    ],
    removeRuleIds: Array.from({ length: 11 }, (_, i) => 11 + i) // Remove corresponding unblock rules
  });
}

// Function to unblock ad trackers
function unblockTrackers() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 11 }, (_, i) => 11 + i)
  });
}

// Check SSL button functionality
const checkButton = document.querySelector('.check-btn');
checkButton.addEventListener('click', fetchData);

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  var currentTab = tabs[0];
  var url = currentTab.url;
  var domain = url.replace(/https?:\/\//, ''); // for auto
  document.getElementById('textInput').value = domain;
});

async function fetchData() {
  const textInput = document.getElementById('textInput').value.trim();
  if (!textInput) {
    alert('Please enter a valid domain');
    return;
  }

  const domain = textInput.replace(/https?:\/\//, ''); // for input
  const parts = domain.split('.');
  if (parts.length < 2) {
    alert('Invalid input. Please enter a valid domain (e.g. example.com, etc.)');
    return;
  }

  try {
    const response = await fetch(`https://check-ssl.p.rapidapi.com/sslcheck?domain=${domain}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '745c95af6bmshe6b922b175f24bdp1921e4jsn7694b614c269',
        'x-rapidapi-host': 'check-ssl.p.rapidapi.com'
      }
    });
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error(error);
    displayError('Failed to fetch data. Please try again later.');
  }
}

function displayResults(data) {
  const resultElement = document.getElementById('ssl-result');
  const keysToDisplay = [
    'isvalidCertificate',
    'canBeSelfSigned',
    'isWildCard',
    'isExpired',
    'message',
    'expiry',
    'daysLeft',
    'lifespanInDays',
    'issuer',
  ];

  const keysToDisplay1 = [
    'certDetails',
    'name',
    'CN',
    'hash',
    'issuer',
    'C',
    'O',
    'version',
    'serialNumber',
    'serialNumberHex',
    'validFrom',
    'validTo',
    'validFrom_time_t',
    'validTo_time_t',
    'signatureTypeSN',
    'signatureTypeLN',
    'signatureTypeNID',
    'validLeft',
    'apiVersion',
    'error'
  ];

  const displayData = (data, keys) => {
    return keys.map(key => {
      if (keysToDisplay.includes(key) || keysToDisplay1.includes(key)) {
        if (typeof data[key] === 'object') {
          return `<tr><td colspan="2">${key}</td></tr>${displayData(data[key], Object.keys(data[key]))}`;
        } else if (data[key] !== undefined) {
          return `<tr><td>${key}</td><td>${data[key]}</td></tr>`;
        } else {
          return '';
        }
      }
      return '';
    }).join('');
  };

  const tableTemplate = (data, keys) => {
    return `
      <table class="ssl-result-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${displayData(data, keys)}
        </tbody>
      </table>
    `;
  };

  const showMoreButton = document.createElement('button');
  showMoreButton.textContent = '--Show more--';
  showMoreButton.classList.add('show-more-button');
  showMoreButton.onclick = () => {
    resultElement.innerHTML = tableTemplate(data, [...keysToDisplay, ...keysToDisplay1]);
    const showLessButton = document.createElement('button');
    showLessButton.textContent = '--Show less--';
    showLessButton.classList.add('show-less-button');
    showLessButton.onclick = () => {
      resultElement.innerHTML = tableTemplate(data, keysToDisplay);
      resultElement.appendChild(showMoreButton);
    };
    resultElement.appendChild(showLessButton);
  };

  resultElement.innerHTML = tableTemplate(data, keysToDisplay);
  resultElement.appendChild(showMoreButton);
}
