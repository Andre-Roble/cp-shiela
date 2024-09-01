// function that enables ad blocking
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
  });
  