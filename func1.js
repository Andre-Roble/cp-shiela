// Select necessary DOM elements
const blockAdsCheckbox = document.getElementById('ad-block-toggle');
const blockAdTrackersCheckbox = document.getElementById('ad-tracker-toggle');
const blockAdsButton = document.querySelector('.block-ads span');
const blockAdTrackersButton = document.querySelector('.block-ad-trackers span');
const phishDetectionCheckbox = document.getElementById('phish-toggle');
const phishDetectionButton = document.querySelector('.phish span');

// Initialize phishing detection toggle state
let isPhishDetectionEnabled = false;

// Initialize settings from Chrome storage for all features
chrome.storage.sync.get(
  ['adBlockEnabled', 'adTrackerEnabled', 'phishingDetectionEnabled'],
  (result) => {
    // Set ad and tracker block states
    blockAdsCheckbox.checked = result.adBlockEnabled || false;
    blockAdTrackersCheckbox.checked = result.adTrackerEnabled || false;
    blockAdsButton.textContent = blockAdsCheckbox.checked ? 'HTTP Detector On' : 'HTTP Detector';
    blockAdTrackersButton.textContent = blockAdTrackersCheckbox.checked ? 'Ads and Trackers Blocked' : 'Block Ads and Trackers';

    // Set phishing detection state
    isPhishDetectionEnabled = result.phishingDetectionEnabled || false;
    phishDetectionCheckbox.checked = isPhishDetectionEnabled;
    phishDetectionButton.textContent = isPhishDetectionEnabled
      ? 'Phishing Detection: On'
      : 'Phishing Detection: Off';
  }
);

// Debounce function to prevent rapid toggling
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Define phishing detection functions
function enablePhishDetection() {
  console.log('Phishing detection enabled.');
  // Logic for enabling phishing detection (e.g., initialize listeners or background checks)
}


function disablePhishDetection() {
  console.log('Phishing detection disabled.');
  // Logic for disabling phishing detection (e.g., remove listeners or stop checks)
}

// Event listener for phishing detection toggle
phishDetectionCheckbox.addEventListener(
  'change',
  debounce(() => {
    isPhishDetectionEnabled = phishDetectionCheckbox.checked;

    // Save the state to Chrome storage
    chrome.storage.sync.set({ phishingDetectionEnabled: isPhishDetectionEnabled });

    // Update the button text
    phishDetectionButton.textContent = isPhishDetectionEnabled
      ? 'Phishing Detection: On'
      : 'Phishing Detection: Off';

      if (isPhishDetectionEnabled) {
        enablePhishDetection();
      } else {
        disablePhishDetection();
      }
  }, 300)
);

function checkPhishingOnActiveTab() {
  if (!isPhishDetectionEnabled) return; // Skip detection if disabled

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      console.error('No active tab found.');
      return;
    }

    const url = tabs[0].url;
    console.log('Checking URL for threats:', url);

    // Send a message to the background script to check the URL
    chrome.runtime.sendMessage(
      { action: 'checkURLWithVirusTotal', url },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error in response:', chrome.runtime.lastError);
          return;
        }

        if (response && response.isThreat) {
          const threatLevel = response.threatLevel || 'Unknown';
          console.log(`Threat detected: ${threatLevel}`);
        } else {
          console.log('No threat detected.');
        }
      }
    );
  });
}

// Periodically check phishing detection on active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkPhishingOnActiveTab();
  }
});

// Event listener for HTTP Detector toggle
blockAdsCheckbox.addEventListener('change', () => {
  const isEnabled = blockAdsCheckbox.checked;

  if (isEnabled) {
    blockAdsButton.textContent = 'HTTP Detector On';
    blockAds();        // Call function on HTTP warning page
  } else {
    blockAdsButton.textContent = 'HTTP Detector';
    unblockAds();      // Call function to off/notification warning
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
    blockAdTrackersButton.textContent = 'Ads and Trackers Blocked';
    blockTrackers(); // Call function to block trackers
  } else {
    blockAdTrackersButton.textContent = 'Block Ads and Trackers';
    unblockTrackers(); // Call function to unblock trackers
  }

    // Send message to background script to enable/disable ad blocking
    chrome.runtime.sendMessage({ action: 'toggleAdTrackers', enabled: isEnabled });

    // Save the state
    chrome.storage.sync.set({ adTrackerEnabled: isEnabled });
});


const RULESET_ID = 'ruleset_1';

// Function to block ads and trackers by enabling the ruleset
function blockAds() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: [RULESET_ID] },
    () => {
      console.log("Ads and trackers have been blocked.");
    }
  );
}

// Function to unblock ads and trackers by disabling the ruleset
function unblockAds() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: [RULESET_ID] },
    () => {
      console.log("Ads and trackers have been unblocked.");
    }
  );
}

// Function to block ad trackers using specific URL patterns
function blockTrackers() {
  // Enable the ad/tracker blocking rules from the rules.json file
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ['ruleset_1'], // 'ruleset_1' is defined in rules.json
    disableRulesetIds: [] // No rulesets to disable
  }, () => {
    console.log('Tracking/ad blocking rules from rules.json enabled.');
  });
}

// Function to unblock ad trackers
function unblockTrackers() {
  // Disable the ad/tracker blocking rules from the rules.json file
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: [], // No rulesets to enable
    disableRulesetIds: ['ruleset_1'] // 'ruleset_1' is the ID for the rules defined in rules.json
  }, () => {
    console.log('Tracking/ad blocking rules from rules.json disabled.');
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
    'expiry', 
    'message', 
    'issuer' 
  ];
  
  const keysToDisplay1 = [
    'isExpired', // critical: is the certificate expired?
    'isvalidCertificate', // critical: is the certificate valid?
    'daysLeft', // important: how many days are left until expiration?
    'lifespanInDays', // important: what is the certificate's lifespan?
    'isWildCard', // informative: is the certificate a wildcard certificate?
    'canBeSelfSigned', // informative: can the certificate be self-signed?
    'certDetails', // detailed information about the certificate
    'name', // certificate name
    'CN', // common name
    'hash', // certificate hash
    'C', // country
    'O', // organization
    'version', // certificate version
    'serialNumber', // serial number
    'serialNumberHex', // serial number in hexadecimal
    'validFrom', // when the certificate is valid from
    'validTo', // when the certificate is valid to
    'validFrom_time_t', // valid from timestamp
    'validTo_time_t', // valid to timestamp
    'signatureTypeSN', // signature type short name
    'signatureTypeLN', // signature type long name
    'signatureTypeNID', // signature type NID
    'validLeft', // number of days left until expiration (alternative to daysLeft)
    'apiVersion', // API version
    'error' // error message (if any)
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