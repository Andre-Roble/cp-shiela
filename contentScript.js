// Function to fetch the rules from rules.json
async function fetchRules() {
  const rulesUrl = chrome.runtime.getURL('rules.json');
  console.log('Fetching rules from:', rulesUrl);

  try {
      const response = await fetch(rulesUrl);
      if (!response.ok) {
          throw new Error('Network response was not ok, status: ' + response.status);
      }
      
      const rules = await response.json();
      console.log('Fetched rules:', rules); // Log the fetched rules

      // Check if rules is an array and map urlFilter
      if (Array.isArray(rules)) {
          return rules.map(rule => rule.condition.urlFilter); // Extracting the urlFilter values
      } else {
          console.error("Invalid rules structure:", rules);
          return []; // Return an empty array if structure is invalid
      }
  } catch (error) {
      console.error("Failed to fetch rules:", error);
      return [];
  }
}

// Function to check if a URL matches any of the blocked URLs
function isBlockedUrl(url, blockedUrls) {
  return blockedUrls.some(blockedUrl => url.includes(blockedUrl));
}

// Function to hide blocked ad elements
function hideBlockedAds(blockedUrls) {
  const elements = document.querySelectorAll('a, img, iframe, div'); // Customize selectors as needed

  elements.forEach(element => {
      if (
          (element.src && isBlockedUrl(element.src, blockedUrls)) || 
          (element.href && isBlockedUrl(element.href, blockedUrls)) ||
          (element.dataset && Object.values(element.dataset).some(val => isBlockedUrl(val, blockedUrls))) || 
          (element.className && isBlockedUrl(element.className, blockedUrls))
      ) {
          console.log(`Hiding element: ${element.outerHTML}`); // Log the hidden element
          element.style.display = 'none'; // Hide the element
      }
  });
}

// Main execution using an Immediately Invoked Function Expression (IIFE)
(async () => {
  const blockedUrls = await fetchRules(); // Fetch the blocked URLs
  hideBlockedAds(blockedUrls); // Hide ads initially

  // Observe changes in the DOM to catch dynamically loaded ads
  const observer = new MutationObserver(() => hideBlockedAds(blockedUrls));
  observer.observe(document.body, { childList: true, subtree: true });
})();