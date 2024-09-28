const styles = `
  /* Hide known analytics and tracking services */
  iframe[src*="hotjar.com"], iframe[src*="yandex.ru"], iframe[src*="yandex.net"], 
  iframe[src*="googletagmanager.com"], iframe[src*="doubleclick.net"], 
  iframe[src*="adsafeprotected.com"], iframe[src*="track.adform.net"], 
  iframe[src*="data.ampproject.org"], iframe[src*="safeframe.googlesyndication.com"], 
  iframe[src*="www.googletagmanager.com"], iframe[src*="www.google-analytics.com"],
  iframe[src*="www.hotjar.com"], iframe[src*="static.hotjar.com"], 
  iframe[src*="static.yandex.net"], iframe[src*="cdn.jsdelivr.net"] {
    display: none !important;
  }
  img[src*="hotjar.com"], img[src*="yandex.ru"], img[src*="yandex.net"], 
  img[src*="googletagmanager.com"], img[src*="doubleclick.net"], 
  img[src*="adsafeprotected.com"], img[src*="track.adform.net"], 
  img[src*="static.hotjar.com"], img[src*="static.yandex.net"] {
    display: none !important;
  }
  script[src*="hotjar.com"], script[src*="yandex.ru"], script[src*="yandex.net"], 
  script[src*="googletagmanager.com"], script[src*="doubleclick.net"], 
  script[src*="adsafeprotected.com"], script[src*="track.adform.net"], 
  script[src*="static.hotjar.com"], script[src*="static.yandex.net"] {
    display: none !important;
  }
  /* Hide common ad containers */
  .ad-banner, .ad-container, .adsbygoogle, .sponsored, .ad, .advertisement {
    display: none !important;
  }

  /* Hide Flash banners */
  embed[type="application/x-shockwave-flash"],
  object[data$=".swf"] {
    display: none !important;
  }

  /* Hide GIF images */
  img[src$=".gif"] {
    display: none !important;
  }

  /* Hide static images from known ad servers */
  img[src*="banner"],
  img[src*="advert"],
  img[src*="ad"],
  img[src*="ad-image"],
  img[src*="advertisement"],
  img[src*="promotion"] {
    display: none !important;
  }
`;

function addStyles() {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

function init() {
  addStyles();
  removeAdElements();
  removeAnalyticsElements();

  // Optionally, observe changes to handle dynamic content
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      removeAdElements();
      removeAnalyticsElements();
    });
  });

  // Observe the entire document for changes
  observer.observe(document.body, { childList: true, subtree: true });
}

// Wait for the DOM to load before executing the script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Function to remove specific ad elements
function removeAdElements() {
  const adSelectors = [
    'iframe[src*="ads"]',
    'iframe[src*="ad"]',
    'iframe[src*="banner"]',
    'iframe[src*="advert"]',
    'iframe[src*="ad-image"]',
    'img[src*="ads"]',
    'img[src*="ad"]',
    'img[src*="banner"]',
    'img[src*="advert"]',
    'img[src*="ad-image"]'
  ];

  adSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });
}

function removeAnalyticsElements() {
  const analyticsDomains = [
    "hotjar.com",
    "yandex.ru",
    "yandex.net",
    "googletagmanager.com",
    "doubleclick.net",
    "adsafeprotected.com",
    "track.adform.net",
    "data.ampproject.org",
    "safeframe.googlesyndication.com",
    "www.googletagmanager.com",
    "www.google-analytics.com",
    "static.hotjar.com",
    "static.yandex.net",
    "cdn.jsdelivr.net"
  ];

  document.querySelectorAll('iframe, img, script').forEach(el => {
    if (analyticsDomains.some(domain => (el.src && el.src.includes(domain)) ||
                                         (el.href && el.href.includes(domain)))) {
      el.style.display = 'none';
    }
  });
}
