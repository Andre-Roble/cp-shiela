console.log('Background JS is running');

//----------AD BLOCKING / AD TRACKER BLOCKING--------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

//----------PHISHING DETECTION-----------------------------------------------------------------------------------------------------------------------------------------------

// Function to check a URL against Google Safe Browsing API
async function checkPhishing(url) {
  const apiKey = 'AIzaSyD6pJ_-v9cFVDkuIvMJsiZk2nlYRF98bOM';  // Your actual API key
  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    client: { clientId: 'SHIELA', clientVersion: '1.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: url }],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("API response data:", data);

    if (data && data.matches && data.matches.length > 0) {
      console.log("Threat detected:", data.matches[0]);
      const threatType = data.matches[0].threatType;
      return { isPhishing: true, threatType };
    } else {
      console.log("No phishing detected for this URL");
      return { isPhishing: false };
    }
  } catch (error) {
    console.error('Error during API request:', error);
    return { isPhishing: false };
  }
}

// Helper function to determine severity based on threatType
function determineSeverity(threatType) {
  if (threatType === 'MALWARE') {
    return 'Critical';
  } else if (threatType === 'SOCIAL_ENGINEERING') {
    return 'Risky';
  } else {
    return 'Low';
  }
}

// Add webNavigation listener to check each URL
if (chrome.webNavigation && chrome.webNavigation.onCompleted) {
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    const url = details.url;

    chrome.storage.sync.get('phishingDetectionEnabled', async (data) => {
      if (data.phishingDetectionEnabled) {
        console.log("Phishing detection enabled, checking URL:", url);

        // Check for phishing first
        const phishingResult = await checkPhishing(url);
        if (phishingResult.isPhishing) {
          // Determine severity if phishing is detected
          const severity = determineSeverity(phishingResult.threatType);

          // Redirect to warning page with severity and threatType information
          const warningUrl = chrome.runtime.getURL(
            `warning.html?threatType=${phishingResult.threatType}&severity=${severity}&url=${encodeURIComponent(url)}`
          );
          chrome.tabs.update(details.tabId, { url: warningUrl });
          return;
        }

        // If no phishing detected, proceed with VirusTotal scanning
        const urlId = await submitUrlForScanning(url);
        if (urlId) {
          const report = await getUrlAnalysisReport(urlId);
          if (report && report.data && report.data.attributes && report.data.attributes.last_analysis_stats) {
            const stats = report.data.attributes.last_analysis_stats;
            if (stats.malicious > 0 || stats.suspicious > 0) {
              console.log("Threat detected by VirusTotal:", report);

              const severity = determineSeverity("VirusTotalDetected");
              const warningUrl = chrome.runtime.getURL(
                `warning.html?threatType=VirusTotalDetected&severity=${severity}&url=${encodeURIComponent(url)}`
              );
              chrome.tabs.update(details.tabId, { url: warningUrl });
            } else {
              console.log("No threats detected by VirusTotal.");
            }
          } else {
            console.log("No detailed report found for URL on VirusTotal.");
          }
        } else {
          console.log("Failed to submit URL to VirusTotal.");
        }
      } else {
        console.log("Phishing detection is not enabled.");
      }
    });
  }, { url: [{ schemes: ["http", "https"] }] });
} else {
  console.warn('chrome.webNavigation API is not available.');
}

// Listen for messages from func1.js to check phishing on demand
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkPhishing') {
    checkPhishing(message.url).then(result => {
      if (result.isPhishing) {
        const severity = determineSeverity(result.threatType);

        const warningUrl = chrome.runtime.getURL(
          `warning.html?threatType=${result.threatType}&severity=${severity}&url=${encodeURIComponent(message.url)}`
        );
        sendResponse({ warningUrl });
      } else {
        sendResponse({ message: 'No phishing detected.' });
      }
    }).catch(error => {
      console.error('Phishing check failed:', error);
      sendResponse({ error: error.message });
    });

    return true; // Ensure asynchronous response
  }
});

//----------HTTPS ENFORCEMENT-----------------------------------------------------------------------------------------------------------------------------------------------
function notification(url) {
  if (url.includes('/search') || url.includes('?q=')) {
    return;
  }

  if (url.startsWith('http://')) {
    chrome.notifications.create({
      title: 'SHIELA',
      message: `You are visiting an unsecure site: ${url}`,
      iconUrl: 'src/bs-img.png',
      type: 'basic'
    });
  }
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    notification(tab.url);
  }
});
