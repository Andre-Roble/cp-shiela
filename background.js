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

// Helper function to determine if a URL is valid for scanning
async function isValidUrlForScanning(url) {
  const validSchemes = ['http:', 'https:'];
  try {
    const parsedUrl = new URL(url);
    return validSchemes.includes(parsedUrl.protocol);
  } catch (error) {
    console.warn("Invalid URL:", url, error);
    return false;
  }
}

// Function to check a URL against Google Safe Browsing API
async function checkPhishing(url) {
  // Skip phishing check for internal extension URLs
  if (url.startsWith('chrome-extension://')) {
    console.log("Skipping phishing check for extension URL:", url);
    return { isPhishing: false };
  }

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
    console.log("Google Safe Browsing API response:", JSON.stringify(data));

    if (data?.matches?.length > 0) {
      console.log("Threat detected:", data.matches[0]);
      return { isPhishing: true, threatType: data.matches[0].threatType };
  } else {
      console.log("No phishing detected for this URL.");
      return { isPhishing: false };
  }
} catch (error) {
  console.error('Error during Google Safe Browsing API request:', error);
  return { isPhishing: false };
}
}

// Helper function to determine severity based on threatType
// Updated determineSeverity function
function determineSeverity(threatType, reportStats = null) {
  if (threatType === 'MALWARE') {
    return 'Critical';
  } else if (threatType === 'SOCIAL_ENGINEERING') {
    return 'Risky';
  } else if (threatType === 'Phishing') {
    return 'High'; // Assign a severity for OpenPhish detections
  } else if (threatType === 'VirusTotalDetected' && reportStats) {
    if (reportStats.malicious > 5) {
      return 'Critical';
    } else if (reportStats.malicious > 0 || reportStats.suspicious > 5) {
      return 'High';
    } else if (reportStats.suspicious > 0) {
      return 'Moderate';
    }
  }
  return 'Low'; // Default severity
}


//URL Analysis of Virus Total API
async function submitUrlForScanning(url) {
  const apiKey = '5d144ad5977e929150dba0645fc87033c22bb6a708f69ec3b8062bf7bb9a16f7'; // Replace with your actual VirusTotal API key
  const endpoint = 'https://www.virustotal.com/api/v3/urls';

  const base64Url = btoa(url)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // URL-safe Base64 encoding

    // Debug logs
  // console.log("Headers for VirusTotal URL submission:", {
  //   'Content-Type': 'application/x-www-form-urlencoded',
  //   'x-apikey': apiKey,
  // });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-apikey': apiKey, // Ensure this header is present
      },
      body: `url=${encodeURIComponent(url)}`,
    });

    const data = await response.json();
    console.log("VirusTotal URL submission response:", JSON.stringify(data));

    if (data?.data?.id) {
      return data.data.id;
    } else {
      console.error("Failed to submit URL to VirusTotal:", data);
      return null;
    }
  } catch (error) {
    console.error("Error during VirusTotal submission:", error);
    return null;
  }
}

//URL Analysis Report of Virus Total API
async function getUrlAnalysisReport(urlId) {
  const apiKey = '5d144ad5977e929150dba0645fc87033c22bb6a708f69ec3b8062bf7bb9a16f7'; // Replace with your actual VirusTotal API key
  const endpoint = `https://www.virustotal.com/api/v3/analyses/${urlId}`;

  // Debug logs
  // console.log("Headers for VirusTotal analysis report retrieval:", {
  //   'x-apikey': apiKey,
  // });

  try {
    // Make a GET request to retrieve the URL analysis report
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey, // Ensure this header is present
      },
    });

    const data = await response.json();
    console.log("VirusTotal analysis report:", JSON.stringify(data));

    if (data?.data?.attributes?.last_analysis_stats) {
      return data.data.attributes.last_analysis_stats;
    } else {
      console.error("No analysis stats found in VirusTotal report.");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving VirusTotal analysis report:", error);
    return null;
  }
  
}

//Open Phish Free Phish Feed/Database
async function fetchOpenPhishFeed() {
  const openPhishFeedUrl = 'https://openphish.com/feed.txt'; // Replace with the actual OpenPhish feed URL

  try {
    const response = await fetch(openPhishFeedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenPhish feed: ${response.statusText}`);
    }

    const text = await response.text();
    const urls = text.split('\n').filter(url => url.trim().length > 0);

    chrome.storage.local.set({ openPhishUrls: urls }, () => {
      console.log('OpenPhish feed updated with', urls.length, 'URLs');
    });
  } catch (error) {
    console.error('Error fetching OpenPhish feed:', error);
  }
}


//Update the Phish Feed every 1 hour
chrome.runtime.onInstalled.addListener(() => {
  fetchOpenPhishFeed(); // Initial fetch
  chrome.alarms.create('updateOpenPhishFeed', { periodInMinutes: 60 }); // Schedule updates
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateOpenPhishFeed') {
    fetchOpenPhishFeed(); // Fetch the feed again
  }
});

//Compare the Phishing urls to check against Open Phish data
async function checkAgainstOpenPhish(url) {
  return new Promise((resolve) => {
    chrome.storage.local.get('openPhishUrls', (data) => {
      if (data.openPhishUrls && data.openPhishUrls.includes(url)) {
        resolve({ isPhishing: true, threatType: 'Phishing' });
      } else {
        resolve({ isPhishing: false });
      }
    });
  });
}



// Add webNavigation listener to check each URL
if (chrome.webNavigation && chrome.webNavigation.onCompleted) {
  chrome.webNavigation.onCompleted.addListener(
    async (details) => {
      const url = details.url;

      // Check if phishing detection is enabled
      chrome.storage.sync.get('phishingDetectionEnabled', async (data) => {
        if (!data.phishingDetectionEnabled) {
          console.log("Phishing detection is disabled.");
          return;
        }

        console.log("Checking URL:", url);

        let warningDetails = { url }; // Initialize warning details

        // Step 1: Check OpenPhish feed
        console.log("Step 1: Checking OpenPhish feed...");
        const openPhishResult = await checkAgainstOpenPhish(url);
        if (openPhishResult.isPhishing) {
          console.log("OpenPhish detected a threat:", openPhishResult);
          warningDetails = {
            ...warningDetails,
            threatType: openPhishResult.threatType,
            severity: determineSeverity(openPhishResult.threatType),
          };

          // Redirect immediately if a threat is found
          const warningUrl = chrome.runtime.getURL(
            `warning.html?threatType=${warningDetails.threatType}&severity=${warningDetails.severity}&url=${encodeURIComponent(
              warningDetails.url
            )}&details=${encodeURIComponent(JSON.stringify(warningDetails))}`
          );
          chrome.tabs.update(details.tabId, { url: warningUrl });
          return;
        }
        console.log("No threats detected by OpenPhish.");

        // Step 2: Check Google Safe Browsing
        console.log("Step 2: Checking Google Safe Browsing...");
        const safeBrowsingResult = await checkPhishing(url);
        if (safeBrowsingResult.isPhishing) {
          console.log("Google Safe Browsing detected a threat:", safeBrowsingResult);
          warningDetails = {
            ...warningDetails,
            threatType: safeBrowsingResult.threatType,
            severity: determineSeverity(safeBrowsingResult.threatType),
          };

          // Redirect immediately if a threat is found
          const warningUrl = chrome.runtime.getURL(
            `warning.html?threatType=${warningDetails.threatType}&severity=${warningDetails.severity}&url=${encodeURIComponent(
              warningDetails.url
            )}&details=${encodeURIComponent(JSON.stringify(warningDetails))}`
          );
          chrome.tabs.update(details.tabId, { url: warningUrl });
          return;
        }
        console.log("No threats detected by Google Safe Browsing.");

        // Step 3: Check VirusTotal
        console.log("Step 3: Submitting URL to VirusTotal...");
        const urlId = await submitUrlForScanning(url);
        if (urlId) {
          console.log("VirusTotal URL submitted. Fetching analysis report...");
          const report = await getUrlAnalysisReport(urlId);
          if (report?.malicious > 0 || report?.suspicious > 0) {
            console.log("VirusTotal detected a threat:", report);
            warningDetails = {
              ...warningDetails,
              threatType: "VirusTotalDetected",
              severity: determineSeverity("VirusTotalDetected", report),
              details: report, // Include VirusTotal analysis stats
            };

            // Redirect if a threat is detected
            const warningUrl = chrome.runtime.getURL(
              `warning.html?threatType=${warningDetails.threatType}&severity=${warningDetails.severity}&url=${encodeURIComponent(
                warningDetails.url
              )}&details=${encodeURIComponent(JSON.stringify(warningDetails))}`
            );
            chrome.tabs.update(details.tabId, { url: warningUrl });
            return;
          }
          console.log("No threats detected by VirusTotal.");
        } else {
          console.log("VirusTotal did not return a valid URL ID.");
        }
      });
    },
    { url: [{ schemes: ["http", "https"] }] }
  );
} else {
  console.warn("chrome.webNavigation API is not available.");
}



// Listen for messages from func1.js to check phishing on demand
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkURLWithVirusTotal') {
    const url = message.url;
    // Simulate an asynchronous request to check for phishing (replace with actual logic)
    checkPhishing(url)
      .then(result => {
        sendResponse({ isThreat: result.isThreat, threatLevel: result.threatLevel });
      })
      .catch(err => {
        console.error("Phishing check failed:", err);  // Log the error to the console
        sendResponse({ error: err.message });
      });
    return true; // Ensure asynchronous response
  }
});

    // Example of the checkPhishing function, which should return a Promise
    function checkPhishing(url) {
      return new Promise((resolve, reject) => {
        // Simulate an asynchronous check (replace with actual phishing detection logic)
        setTimeout(() => {
          if (url.includes('phishing')) {
            resolve({
              isThreat: true,
              threatLevel: 'High'
            });
          } else {
            resolve({
              isThreat: false,
              threatLevel: 'Low'
            });
          }
        }, 1000);  // Simulating async delay of 1 second
      });
    }


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



// Listen for SSL-related errors on web requests
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const sslErrors = [
      "net::ERR_CERT_DATE_INVALID",
      "net::ERR_CERT_AUTHORITY_INVALID",
      "net::ERR_CERT_COMMON_NAME_INVALID"
    ];

    // Check if the error is SSL-related
    if (sslErrors.includes(details.error)) {
      console.log(`SSL Error detected on: ${details.url}`);

      // Ensure we're not redirecting the error page itself
      const errorPageUrl = chrome.runtime.getURL("error.html");
      if (details.url.startsWith(errorPageUrl)) {
        console.log("Already on the error page. Skipping redirection.");
        return;
      }

      // Skip redirect if the URL contains skipError=true
      if (details.url.includes("skipError=true")) {
        console.log("Skipping redirection for:", details.url);
        return;
      }

      // Redirect to the error page with the original site URL as a parameter
      chrome.tabs.get(details.tabId, (tab) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching tab:", chrome.runtime.lastError.message);
          return;
        }

        if (!tab) {
          console.error(`Tab not found for ID: ${details.tabId}`);
          return;
        }

        console.log(`Redirecting tab ${details.tabId} to error.html.`);
        chrome.tabs.update(details.tabId, {
          url: `${errorPageUrl}?site=${encodeURIComponent(details.url)}`,
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error during redirection:", chrome.runtime.lastError.message);
          } else {
            console.log(`Successfully redirected tab ${details.tabId} to error.html.`);
          }
        });
      });
    }
  },
  { urls: ["<all_urls>"] }
);
