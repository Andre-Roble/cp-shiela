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

// Function to enable http detection
function enableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["ruleset_2"] },
    () => console.log("http on")
  );
}

// Function to disable http detection
function disableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["ruleset_2"] },
    () => console.log("http off")
  );
}

// Function to enable allowing HTTP without redirect
function enableAllowHTTP() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["ruleset_3"] },
    () => console.log("Allow HTTP on")
  );
}

// Function to disable allowing HTTP without redirect
function disableAllowHTTP() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["ruleset_3"] },
    () => console.log("Allow HTTP off")
  );
}

// Function to enable ad tracker blocking
function enableTrackerBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["ruleset_1"] },
    () => console.log("Ads & tracker blocking on")
  );
}

// Function to disable ad tracker blocking
function disableTrackerBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["ruleset_1"] },
    () => console.log("Ads & tracker blocking off")
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

    if (adEnabled) {
      enableAdBlocking();
    } else {
      disableAdBlocking();
    }

    chrome.storage.sync.set({ adBlockEnabled: adEnabled });

    sendResponse({ status: 'success' });
  }

  if (request.action === 'toggleAdTrackers') {
    const trackerEnabled = request.enabled;
    console.log("Tracker block toggle:", trackerEnabled);

    if (trackerEnabled) {
      enableTrackerBlocking();
    } else {
      disableTrackerBlocking();
    }

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

//----------PHISHING DETECTION-----------------------------------------------------------------------------------------------------------------------------------------------

// Helper function to normalize the URL (convert http to https)
function normalizeURL(url) {
  try {
    const parsedUrl = new URL(url);

    // Convert http to https for consistency
    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:'; // Convert 'http' to 'https'
      console.log(`URL converted to secure format: ${parsedUrl.href}`);
    }

    return parsedUrl.href;
  } catch (error) {
    console.warn("Invalid URL during normalization:", url, error);
    return url; // Return the original URL if normalization fails
  }
}

// Helper function to determine if a URL is valid for scanning
async function isValidUrlForScanning(url) {
  const validSchemes = ['http:', 'https:'];
  try {
    const parsedUrl = new URL(url);

    // Normalize URL (http to https)
    const normalizedUrl = normalizeURL(url);
    console.log(`Normalized URL for scanning: ${normalizedUrl}`);

    return validSchemes.includes(parsedUrl.protocol); // Validate the scheme (http or https)
  } catch (error) {
    console.warn("Invalid URL:", url, error);
    return false;
  }
}

// Function to check a URL against Google Safe Browsing API
async function checkPhishing(url) {
  console.log("checkPhishing function called with URL:", url);

  // Skip phishing check for internal extension URLs
  if (url.startsWith('chrome-extension://')) {
    console.log("Skipping phishing check for extension URL:", url);
    return { isPhishing: false };
  }

  const apiKey = 'AIzaSyD6pJ_-v9cFVDkuIvMJsiZk2nlYRF98bOM'; // Replace with your actual API key
  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    client: { clientId: 'SHIELA', clientVersion: '1.0' },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION'
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: url }],
    },
  };

  console.log('Request Payload:', JSON.stringify(body));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify([...response.headers]));

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}`);
      console.error(`Error Details: ${errorData}`);
      return { isPhishing: false, error: errorData };
    }

    const data = await response.json();
    console.log("Google Safe Browsing API response:", JSON.stringify(data));

    if (data && data.matches && data.matches.length > 0) {
      console.log("Threat detected:", data.matches[0]);
      return { isPhishing: true, threatType: data.matches[0].threatType };
    } else {
      console.log("No phishing detected for this URL.");
      return { isPhishing: false };
    }
  } catch (error) {
    console.error('Network or Parsing Error:', error);
    return { isPhishing: false, error: error.message };
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
      const openPhishUrls = data.openPhishUrls || [];

      // Generate both the http and https versions of the URL
      const parsedUrl = new URL(url);
      const httpVersion = `http://${parsedUrl.host}${parsedUrl.pathname}`;
      const httpsVersion = `https://${parsedUrl.host}${parsedUrl.pathname}`;

      // Check both versions in the OpenPhish feed
      if (openPhishUrls.includes(httpVersion) || openPhishUrls.includes(httpsVersion)) {
        resolve({ isPhishing: true, threatType: 'Phishing' });
      } else {
        resolve({ isPhishing: false });
      }
    });
  });
}

// Phishunt Free Phish Feed/Database
async function fetchPhishuntFeed() {
  const phishuntFeedUrl = 'https://phishunt.io/feed.txt';
  try {
    const response = await fetch(phishuntFeedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Phishunt feed: ${response.statusText}`);
    }
    const text = await response.text();
    const urls = text.split('\n').filter(url => url.trim() !== ''); // Don't normalize URLs here
    chrome.storage.local.set({ phishuntUrls: urls }, () => {
      console.log('Phishunt feed updated with', urls.length, 'URLs');
    });
  } catch (error) {
    console.error('Error fetching Phishunt feed:', error);
  }
}

// Update the Phish Feed every 1 hour
chrome.runtime.onInstalled.addListener(() => {
  fetchPhishuntFeed(); // Initial fetch
  chrome.alarms.create('updatePhishuntFeed', { periodInMinutes: 60 }); // Schedule updates
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updatePhishuntFeed') {
    fetchPhishuntFeed(); // Fetch the feed again
  }
});

// Compare the URL against Phishunt data
async function checkAgainstPhishunt(url) {
  return new Promise((resolve) => {
    chrome.storage.local.get('phishuntUrls', (data) => {
      const phishuntUrls = data.phishuntUrls || [];

      // Normalize the input URL for comparison
      const normalizedUrl = normalizeURL(url);

      // Check if the normalized URL exists in the Phishunt feed
      const isPhishing = phishuntUrls.some(phishuntUrl => {
        const normalizedPhishuntUrl = normalizeURL(phishuntUrl);
        return normalizedPhishuntUrl === normalizedUrl;
      });

      if (isPhishing) {
        resolve({ isPhishing: true, threatType: 'Phishing' });
      } else {
        resolve({ isPhishing: false });
      }
    });
  });
}

// Normalize URL function with error handling for invalid URLs
function normalizeURL(url) {
  try {
    // Ensure the URL is valid
    const parsedUrl = new URL(url);

    // Convert http to https for consistency
    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:'; // Convert 'http' to 'https'
      console.log(`URL converted to secure format: ${parsedUrl.href}`);
    }

    return parsedUrl.href;
  } catch (error) {
    console.warn("Invalid URL during normalization:", url, error);
    return ''; // Return empty string for invalid URLs
  }
}

// At the top of background.js
const lastSafeUrls = {};     // Stores the last safe URL per tab
const previousSafeUrls = {}; // Stores the previous safe URL per tab
const originalUrls = {}; // Store original URLs before redirects

// Inside your chrome.webNavigation.onCompleted listener
if (chrome.webNavigation && chrome.webNavigation.onCompleted) {
  chrome.webNavigation.onCompleted.addListener(
    async (details) => {
      const url = details.url;

      // Exclude special internal URLs
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url === "about:blank") {
        console.log("Ignoring internal browser page or blank tab:", url);
        return;
      }

      // Normalize URL before checking
      const normalizedUrl = normalizeURL(url);

      // Check if phishing detection is enabled
      chrome.storage.sync.get('phishingDetectionEnabled', async (data) => {
        if (!data.phishingDetectionEnabled) {
          console.log("Phishing detection is disabled.");
          return;
        }

        console.log("Checking URL:", url);

        let warningDetails = { url }; // Start with the current URL

        // Step 1: Check OpenPhish feed
        console.log("Step 1: Checking OpenPhish feed...");
        const openPhishResult = await checkAgainstOpenPhish(url);
        if (openPhishResult.isPhishing) {
          console.log("OpenPhish detected a threat:", openPhishResult);
          warningDetails = {
            ...warningDetails,
            threatType: openPhishResult.threatType,
          };

          // Retrieve the previous safe URL for this tab
          const previousSafeUrl = previousSafeUrls[details.tabId] || '';
          const warningUrl = chrome.runtime.getURL(
            `warning.html?threatType=${warningDetails.threatType}&url=${encodeURIComponent(warningDetails.url)}&details=${encodeURIComponent(JSON.stringify(warningDetails))}&previousSafeUrl=${encodeURIComponent(previousSafeUrl)}`
          );
          chrome.tabs.update(details.tabId, { url: warningUrl });
          return;
        }

        // Step 2: Check Phishunt feed
        console.log("Step 2: Checking Phishunt feed...");
        const phishuntResult = await checkAgainstPhishunt(url);
        if (phishuntResult.isPhishing) {
          console.log("Phishunt detected a threat:", phishuntResult);
          warningDetails = {
            ...warningDetails, 
            threatType: phishuntResult.threatType,
          };

          // Retrieve the previous safe URL for this tab
          const previousSafeUrl = previousSafeUrls[details.tabId] || '';
          const warningUrl = chrome.runtime.getURL(
            `warning.html?threatType=${warningDetails.threatType}&url=${encodeURIComponent(warningDetails.url)}&details=${encodeURIComponent(JSON.stringify(warningDetails))}&previousSafeUrl=${encodeURIComponent(previousSafeUrl)}`
          );
          chrome.tabs.update(details.tabId, { url: warningUrl });
          return;
        }

        console.log("No threats detected by OpenPhish or Phishunt.");

        // Step 3: Check Google Safe Browsing
        console.log("Step 2: Checking Google Safe Browsing...");
        const safeBrowsingResult = await checkPhishing(url);
        if (safeBrowsingResult.isPhishing) {
          console.log("Google Safe Browsing detected a threat:", safeBrowsingResult);
          warningDetails = {
            ...warningDetails,
            threatType: safeBrowsingResult.threatType,
          };

          // Retrieve the previous safe URL for this tab
          const previousSafeUrl = previousSafeUrls[details.tabId] || '';
          const warningUrl = chrome.runtime.getURL(
            `warning.html?threatType=${warningDetails.threatType}&url=${encodeURIComponent(warningDetails.url)}&details=${encodeURIComponent(JSON.stringify(warningDetails))}&previousSafeUrl=${encodeURIComponent(previousSafeUrl)}`
          );
          chrome.tabs.update(details.tabId, { url: warningUrl });
          return;
        }
        console.log("No threats detected by Google Safe Browsing.");
      });
    },
    { url: [{ hostContains: '' }] }
  );
} else {
  console.warn("chrome.webNavigation API is not available.");
}

// Listen for messages from func1.js to check phishing on demand
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkURLWithVirusTotal') {
    const url = message.url;
    // Call the correct checkPhishing function
    checkPhishing(url)
      .then(result => {
        sendResponse({ isPhishing: result.isPhishing, threatType: result.threatType });
      })
      .catch(err => {
        console.error("Phishing check failed:", err);
        sendResponse({ error: err.message });
      });
    return true; // Ensure asynchronous response
  }
}); 

//----------HTTPS ENFORCEMENT-----------------------------------------------------------------------------------------------------------------------------------------------

// Notification function will only be triggered on HTTP sites when SSL errors are detected
function notification(url) {
  if (url.includes('/search') || url.includes('?q=')) {
    return;
  }

  // Only notify if the site starts with "http://" and there's no SSL error flag
  if (url.startsWith('http://')) {
    chrome.notifications.create({
      title: 'SHIELA',
      message: `You are visiting an unsecure site: ${url}`,
      iconUrl: 'src/bs-img.png',
      type: 'basic'
    });
  }
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
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

      // Get the ad-blocking state from storage
      chrome.storage.sync.get('adBlockEnabled', (data) => {
        const isAdBlockEnabled = data.adBlockEnabled;

        if (isAdBlockEnabled) {
          // If ad-blocking is enabled, process the SSL error
          console.log("Ad-blocking is enabled, handling SSL error.");

          // Disable the automatic HTTP-to-HTTPS redirection when SSL errors occur
          disableAdBlocking();

          // Enable the new ruleset that allows HTTP without redirection
          enableAllowHTTP();

          // Ensure we're not redirecting to error.html if we're already there
          const errorPageUrl = chrome.runtime.getURL("error.html");
          if (details.url.startsWith(errorPageUrl)) {
            console.log("Already on the error page. Skipping redirection.");
            return; // Skip redirecting to error.html again
          }

          // Skip redirect if the URL contains skipError=true (user has bypassed the error)
          if (details.url.includes("skipError=true")) {
            console.log("Skipping redirection for:", details.url);
            return;
          }

          // Redirect to the error page with the original site URL as a parameter
          chrome.tabs.get(details.tabId, (tab) => {
            if (chrome.runtime.lastError) {
              console.error(`Error fetching tab: ${chrome.runtime.lastError.message}`);
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
        } else {
          console.log("Ad-blocking is disabled, skipping SSL error handling.");
        }
      });
    }
  },
  { urls: ["<all_urls>"] }
);

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enableAllowHTTP") {
    enableAllowHTTP();
  }
});
// working continue to site button