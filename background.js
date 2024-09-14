console.log('Background JS is running');

// Function to enable ad and tracker blocking
function enableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["ruleset_1"] },
    () => 
      console.log("Ad and tracker blocking enabled.")
  );
}

// Function to disable ad and tracker blocking
function disableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["ruleset_1"] },
    () => 
      console.log("Ad and tracker blocking disabled.")
  );
}

// Initialize ad-blocking based on stored settings
chrome.storage.sync.get(['adBlockEnabled'], (result) => {
  if (result.adBlockEnabled) {
    enableAdBlocking();
  } else {
    disableAdBlocking();
  }
});

// Function to block requests based on patterns
function blockRequest(details) {
  return { cancel: true };
}

// Add listener to block Flash banners, GIF images, and static images
chrome.webRequest.onBeforeRequest.addListener(
  blockRequest,
  { urls: [
    "*://*/*flash*.swf",
    "*://*/*.gif",
    "*://*/*banner*",
    "*://*/*advert*",
    "*://*/*ad-image*",
    "*://*/*advertisement*",
    "*://*/*promotion*"
  ]},
  ["blocking"]
);

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
  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
  const body = {
    client: {
      clientId: 'SHIELA', // You can replace this with your own identifier
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

// Listen for action button click to toggle blocking
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
