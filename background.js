// Function that enables ad blocking
function enableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { enableRulesetIds: ["block_ads_ruleset"] },
    () => {
      console.log("Ad-blocking enabled");
    }
  );
}

function disableAdBlocking() {
  chrome.declarativeNetRequest.updateEnabledRulesets(
    { disableRulesetIds: ["block_ads_ruleset"] },
    () => {
      console.log("Ad-blocking disabled");
    }
  );
}

// Initialize ad-blocking based on stored settings
chrome.storage.sync.get(['adBlockEnabled'], (result) => {
  if (result.adBlockEnabled) {
    enableAdBlocking();
  }
});

// Listen for messages from popup to toggle ad-blocking
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAdBlock') {
    if (request.enabled) {
      enableAdBlocking();
    } else {
      disableAdBlocking();
    }
    sendResponse({ status: 'success' });
  }

  // Handle phishing detection requests
  if (request.action === 'checkPhishing') {
    checkPhishing(request.url)
      .then(isPhishing => {
        sendResponse({ isPhishing });
      })
      .catch(error => {
        console.error('Error checking phishing status:', error);
        sendResponse({ isPhishing: false, error: error.message });
      });

    // Required to allow async response
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
