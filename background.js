console.log('Background JS is running');

// Basic setup to test if the script runs without issues
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
  
  // Initialize default storage values
  chrome.storage.sync.get(['adBlockEnabled', 'trackerBlockEnabled'], (result) => {
    if (result.adBlockEnabled === undefined) {
      chrome.storage.sync.set({ adBlockEnabled: false });
    }
    if (result.trackerBlockEnabled === undefined) {
      chrome.storage.sync.set({ trackerBlockEnabled: false });
    }

    // Enable or disable blocking based on stored values
    updateBlockingRules(result.adBlockEnabled, result.trackerBlockEnabled);
  });
});

// Function to enable or disable blocking based on the states
function updateBlockingRules(adEnabled, trackerEnabled) {
  if (adEnabled) {
    enableAdBlocking();
  } else {
    disableAdBlocking();
  }

  if (trackerEnabled) {
    enableTrackerBlocking();
  } else {
    disableTrackerBlocking();
  }
}

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
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["ruleset_1"] }, 
    () => console.log("Ad tracker blocking enabled.")
  );
}

// Function to disable ad tracker blocking
function disableTrackerBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["ruleset_1"] }, 
    () => console.log("Ad tracker blocking disabled.")
  );
}

// Initialize ad-blocking and tracker-blocking based on stored settings
chrome.storage.sync.get(['adBlockEnabled', 'trackerBlockEnabled'], (result) => {
  console.log('Initialized Ad Block Enabled:', result.adBlockEnabled);
  console.log('Initialized Tracker Block Enabled:', result.trackerBlockEnabled);
  
  updateBlockingRules(result.adBlockEnabled, result.trackerBlockEnabled);
});

// Listen for messages from popup or other parts of the extension to toggle ad-blocking and tracker blocking
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAdBlock') {
    const adEnabled = request.enabled;
    console.log("Ad block toggle:", adEnabled);
    
    // Enable or disable tracker blocking based on the ad block toggle
    if (adEnabled) {
      enableTrackerBlocking();  // **Automatically enable tracker blocking**
      chrome.storage.sync.set({ trackerBlockEnabled: true });
    } else {
      disableTrackerBlocking(); // **Automatically disable tracker blocking**
      chrome.storage.sync.set({ trackerBlockEnabled: false });
    }
    
    updateBlockingRules(adEnabled, adEnabled); // **Sync states**
    chrome.storage.sync.set({ adBlockEnabled: adEnabled });
    
    sendResponse({ status: 'success' });
  }

  if (request.action === 'toggleAdTrackers') {
    const trackerEnabled = request.enabled;
    console.log("Tracker block toggle:", trackerEnabled);
    
    // Enable or disable ad blocking based on the tracker block toggle
    if (trackerEnabled) {
      enableAdBlocking();  // **Automatically enable ad blocking**
      chrome.storage.sync.set({ adBlockEnabled: true });
    } else {
      disableAdBlocking(); // **Automatically disable ad blocking**
      chrome.storage.sync.set({ adBlockEnabled: false });
    }
    
    updateBlockingRules(trackerEnabled, trackerEnabled); // **Sync states**
    chrome.storage.sync.set({ trackerBlockEnabled: trackerEnabled });
    
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

    return true; // Indicate that the response is sent asynchronously
  }
});

// Function to check a URL against Google Safe Browsing API
async function checkPhishing(url) {
  const apiKey = 'AIzaSyD6pJ_-v9cFVDkuIvMJsiZk2nlYRF98bOM'; // Replace with your actual API key
  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
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

// Listen for action button click to toggle ad blocking and tracker blocking
chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get(['adBlockEnabled', 'trackerBlockEnabled'], (result) => {
    const adEnabled = result.adBlockEnabled;
    const trackerEnabled = result.trackerBlockEnabled;

    // Toggle ad blocking and tracker blocking
    if (adEnabled) {
      disableAdBlocking();
      disableTrackerBlocking(); // **Disable tracker blocking as well**
      chrome.storage.sync.set({ adBlockEnabled: false, trackerBlockEnabled: false }); // **Sync both states**
      console.log("Ad blocking and tracker blocking disabled.");
    } else {
      enableAdBlocking();
      enableTrackerBlocking(); // **Enable tracker blocking as well**
      chrome.storage.sync.set({ adBlockEnabled: true, trackerBlockEnabled: true }); // **Sync both states**
      console.log("Ad blocking and tracker blocking enabled.");
    }
  });
});
