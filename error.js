// Retrieve the original site URL from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const originalSite = decodeURIComponent(urlParams.get("site"));

if (!originalSite || !/^https?:\/\//.test(originalSite)) {
  console.error("Original site URL is missing or invalid.");
  document.body.innerHTML = 
    `<h1>Error</h1>
    <p>Unable to retrieve the original site URL. Please try again later.</p>`;
} else {
  console.log("Ready to redirect to:", originalSite);

  // Handle the "Continue to Site" button
  const continueButton = document.getElementById("cont-button");
  continueButton.addEventListener("click", async () => {
    console.log("Attempting to redirect to:", originalSite);

    try {
      // Clear ruleset_2 and set ruleset_3
      sessionStorage.removeItem('ruleset_2');
      localStorage.removeItem('ruleset_2');
      
      // Set ruleset_3 (activate it)
      sessionStorage.setItem('ruleset_3', 'active');
      localStorage.setItem('ruleset_3', 'active');
      
      // Enable the new ruleset that allows HTTP without redirection
      chrome.runtime.sendMessage({ action: "enableAllowHTTP" });

      // Modify the URL to allow HTTP and strip 'https://'
      const safeUrl = originalSite.replace(/^https:\/\//, 'http://');
      console.log("Redirecting to:", safeUrl);

      // Find the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        console.error("No active tabs found. Cannot redirect.");
        return;
      }

      const currentTab = tabs[0];
      console.log("Redirecting tab ID:", currentTab.id, "to URL:", safeUrl);

      // Redirect the current tab to the safe URL
      chrome.tabs.update(currentTab.id, { url: safeUrl }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error during redirection:", chrome.runtime.lastError.message);
        } else {
          console.log("Successfully redirected to:", safeUrl);
        }
      });
    } catch (error) {
      console.error("Error during redirection attempt:", error.message);
    }
  });

  // Handle the "Return to Safety" button
  const goBackButton = document.getElementById("back-button");
  goBackButton.addEventListener("click", async () => {
    try {
      // Find the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        console.error("No active tabs found to go back.");
        return;
      }

      const currentTab = tabs[0];
      console.log("Redirecting tab ID:", currentTab.id, "to the new tab page.");

      // Redirect the current tab to the Chrome new tab page
      chrome.tabs.update(currentTab.id, { url: "chrome://newtab/" }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error while returning to safety:", chrome.runtime.lastError.message);
        } else {
          console.log("Redirected to the new tab page.");
        }
      });
    } catch (error) {
      console.error("Error while returning to safety:", error.message);
    }
  });
}
// working continue to site button