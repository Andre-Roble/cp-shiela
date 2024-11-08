// warning.js

// Get query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const threatType = urlParams.get('threatType');
const siteUrl = urlParams.get('url');

// Display the appropriate warning message based on the threatType
const alertMessage = document.getElementById('alert-message');
if (threatType === 'MALWARE') {
  alertMessage.textContent = `Warning! This site (${siteUrl}) contains MALWARE. It is highly dangerous!`;
} else if (threatType === 'SOCIAL_ENGINEERING') {
  alertMessage.textContent = `Caution! This site (${siteUrl}) is involved in SOCIAL ENGINEERING. Be careful with your personal information.`;
} else {
  alertMessage.textContent = `This site (${siteUrl}) poses a security risk.`;
}

// Get the "Go Back" button by its ID and add event listener for "Go Back" functionality
const goBackButton = document.getElementById('go-back-button');
goBackButton.addEventListener('click', () => {
  if (siteUrl) {
    // Get the currently active tab and navigate back to the original URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      chrome.tabs.update(currentTab.id, { url: siteUrl });
    });
  }
});
