// Helper function to determine severity based on reportStats (for VirusTotal scanning only)
function determineSeverity(reportStats = null) {
  if (reportStats) {
    if (reportStats.malicious > 10) {
      return 'Critical';
    } else if (reportStats.malicious > 0 || reportStats.suspicious > 10) {
      return 'High';
    } else if (reportStats.suspicious > 0) {
      return 'Moderate';
    }
  }
  return 'Low'; // Default severity if no VirusTotal data
}

// Submit a URL to VirusTotal for scanning
async function submitUrlForScanning(url) {
  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/urls`, {
      method: 'POST',
      headers: {
        'x-apikey': '8b0a9c775f34a845c45da5db3136ecf80e8ef7b093d4c345e2329127f1c585f8', // Replace with your VirusTotal API key
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.id; // Return the URL ID for fetching analysis
    } else {
      console.error("Error submitting URL to VirusTotal:", await response.text());
      return null;
    }
  } catch (err) {
    console.error("Error in submitUrlForScanning:", err);
    return null;
  }
}

// Get the analysis report from VirusTotal
async function getUrlAnalysisReport(urlId) {
  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/analyses/${urlId}`, {
      headers: {
        'x-apikey': '8b0a9c775f34a845c45da5db3136ecf80e8ef7b093d4c345e2329127f1c585f8', // Replace with your VirusTotal API key
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Check stats for phishing indicators
      const stats = data.data.attributes.stats;
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const undetected = stats.undetected || 0;

      const isPhishing = malicious > 0 || suspicious > 0;

      // Return detailed report
      return {
        isPhishing,
        threatLevel: malicious > 0 ? 'High' : 'Medium',
        stats: {
          malicious: malicious,
          suspicious: suspicious,
          undetected: undetected,
        },
      };
    } else {
      console.error("Error fetching VirusTotal analysis report:", await response.text());
      return null;
    }
  } catch (err) {
    console.error("Error in getUrlAnalysisReport:", err);
    return null;
  }
}

// Fetch VirusTotal data and render it
async function fetchVirusTotalData(siteUrl) {
  console.log(`Starting VirusTotal scan for URL: ${siteUrl}`); // Log the URL being scanned

  // Ensure the URL flagged as phishing is being scanned
  const urlId = await submitUrlForScanning(siteUrl);
  if (!urlId) {
    alert('Failed to submit URL for scanning.');
    return;
  }

  const report = await getUrlAnalysisReport(urlId);
  if (!report) {
    alert('Failed to fetch VirusTotal analysis.');
    return;
  }

  // Determine severity based on report stats
  const severity = determineSeverity(report.stats);

  // Update the warning message with the new severity
  const severityMessage = document.getElementById('severity-message');
  if (severityMessage) {
    severityMessage.textContent = `Severity Level: ${severity}`; // Update existing severity message
  } else {
    const newSeverityMessage = document.createElement('p');
    newSeverityMessage.id = 'severity-message'; // Set an ID for easy updates
    newSeverityMessage.textContent = `Severity Level: ${severity}`;
    alertMessage.appendChild(newSeverityMessage);
  }

  // Render the scan data in the details table
  const virusTotalStats = {
    'VirusTotal Scan Result': `${report.stats.malicious} security vendors flagged this URL`, 
    'Malicious Detections': report.stats.malicious, 
    'Suspicious Detections': report.stats.suspicious, 
    'Undetected Detections': report.stats.undetected, 
    'Phishing Detected': report.isPhishing ? 'Yes' : 'No',
    'Threat Level': report.threatLevel,
    'Severity': severity,
  };

  renderDetails(virusTotalStats);
}


// Get query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const threatType = urlParams.get('threatType');
const siteUrl = urlParams.get('url');  // The siteUrl here should be the one detected as phishing

// Display threat type and severity
const alertMessage = document.getElementById('alert-message');
alertMessage.textContent = `Warning! The site (${siteUrl}) has been flagged for ${threatType}.`;

// Fetch stats from the URL or pass null if stats are unavailable
const stats = JSON.parse(urlParams.get('details') || '{}').stats || null;

// Dynamically determine the severity using the helper function
const severity = stats ? determineSeverity(stats) : 'Fetching...';

// Display the severity level dynamically
const severityMessage = document.createElement('p');
severityMessage.id = 'severity-message';
severityMessage.textContent = `Severity Level: ${severity}`; // Use recalculated or placeholder severity
alertMessage.appendChild(severityMessage);


// Display additional details in the table
const detailsContainer = document.getElementById('details-container');
const detailsTable = document.getElementById('details-table');
detailsTable.innerHTML = '<tr><th>Detail</th><th>Value</th></tr>'; // Reset table headers

// Track if the flagged phishing URL has been scanned
let hasScanned = false;

function renderDetails(details, parentKey = '') {
  // Clear previous table content
  detailsTable.innerHTML = '<tr><th>Detail</th><th>Value</th></tr>';

  for (const [key, value] of Object.entries(details)) {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    const valueCell = document.createElement('td');

    const displayKey = parentKey ? `${parentKey}.${key}` : key;
    keyCell.textContent = displayKey;

    if (typeof value === 'object' && value !== null) {
      // Render nested details
      valueCell.textContent = JSON.stringify(value, null, 2); // Format nested objects as JSON
    } else {
      valueCell.textContent = value;
    }

    row.appendChild(keyCell);
    row.appendChild(valueCell);
    detailsTable.appendChild(row);
  }
}

// Show/Hide additional details
const detailsButton = document.getElementById('details-button');
detailsButton.addEventListener('click', () => {
  if (detailsContainer.style.display === 'none') {
    detailsContainer.style.display = 'block';
    detailsButton.textContent = 'Hide Details';

    // Only trigger the scan if the URL is flagged as phishing and has not been scanned yet
    if (threatType === 'Phishing' && !hasScanned) {
      fetchVirusTotalData(siteUrl);  // Ensure we're scanning the correct siteUrl
      hasScanned = true; // Mark as scanned so it doesn't scan again
    }

  } else {
    detailsContainer.style.display = 'none';
    detailsButton.textContent = 'More Details';
  }
});

// Get the previous safe URL from the URL parameters
const previousSafeUrl = urlParams.get('previousSafeUrl');

// Handle "Return to Safety" button click
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
  if (previousSafeUrl) {
    // Redirect to the previous safe URL
    window.location.href = previousSafeUrl;
  } else {
    // No previous safe URL available; redirect to a default safe page (e.g., homepage)
    window.location.href = 'https://www.google.com'; // Change to your preferred safe page
  }
});
