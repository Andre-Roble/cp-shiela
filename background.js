console.log('Background JS is running');

// Basic setup to test if the script runs without issues
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// Basic listener example
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  sendResponse({ status: 'success' });
});

// Function to enable ad blocking
function enableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["ruleset_1"] },
    () => console.log("Ad blocking enabled.")
  );
}

// Function to disable ad blocking
function disableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["ruleset_1"] },
    () => console.log("Ad blocking disabled.")
  );
}

// Function to enable ad tracker blocking
function enableTrackerBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["ruleset_2"], // Assuming you have a separate ruleset for trackers
  }, () => console.log("Ad tracker blocking enabled."));
}

// Function to disable ad tracker blocking
function disableTrackerBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: ["ruleset_2"], // Disable the tracker ruleset
  }, () => console.log("Ad tracker blocking disabled."));
}

// Initialize ad-blocking based on stored settings
chrome.storage.sync.get(['adBlockEnabled'], (result) => {
  if (result.adBlockEnabled) {
    enableAdBlocking();
  }
});

// Initialize tracker-blocking based on stored settings
chrome.storage.sync.get(['trackerBlockEnabled'], (result) => {
  if (result.trackerBlockEnabled) {
    enableTrackerBlocking();
  }
});

// Listen for messages from popup or other parts of the extension to toggle ad-blocking
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAdBlock') {
    if (request.enabled) {
      enableAdBlocking();
    } else {
      disableAdBlocking();
    }
    sendResponse({ status: 'success' });
  }

  if (request.action === 'toggleAdTrackers') {
    if (request.enabled) {
      enableTrackerBlocking();
    } else {
      disableTrackerBlocking();
    }
    sendResponse({ status: 'success' });
  }

  if (request.action === 'checkPhishing') {
    checkPhishing(request.url)
      .then(isPhishing => {
        sendResponse({ isPhishing });
      })
      .catch(error => {
        console.error('Error checking phishing status:', error);
        sendResponse({ isPhishing: false, error: error.message });
      });

    return true;
  }
});

// Function to check a URL against Google Safe Browsing API
async function checkPhishing(url) {
  const apiKey = 'AIzaSyD6pJ_-v9cFVDkuIvMJsiZk2nlYRF98bOM'; // Replace with your actual API key
  const endpoint = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}';
  const body = {
    client: {
      clientId: 'SHIELA',
      clientVersion: '1.0',
    },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: url }],
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  // Return true if phishing is detected
  return data && data.matches && data.matches.length > 0;
}

// Listen for action button click to toggle ad blocking
chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get(['adBlockEnabled'], (result) => {
    const isEnabled = result.adBlockEnabled;

    if (isEnabled) {
      disableAdBlocking();
      chrome.storage.sync.set({ adBlockEnabled: false });
    } else {
      enableAdBlocking();
      chrome.storage.sync.set({ adBlockEnabled: true });
    }
  });
});

// Listen for action button click to toggle tracker blocking
chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get(['trackerBlockEnabled'], (result) => {
    const isEnabled = result.trackerBlockEnabled;

    if (isEnabled) {
      disableTrackerBlocking();
      chrome.storage.sync.set({ trackerBlockEnabled: false });
    } else {
      enableTrackerBlocking();
      chrome.storage.sync.set({ trackerBlockEnabled: true });
    }
  });
});