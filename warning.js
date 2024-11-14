// warning.js

// Get query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const threatType = urlParams.get('threatType');
const siteUrl = urlParams.get('url');
const threatDetails = JSON.parse(urlParams.get('details') || '{}'); // Optional additional data

// Display the appropriate warning message based on the threatType
const alertMessage = document.getElementById('alert-message');
if (threatType === 'MALWARE') {
  alertMessage.textContent = `Warning! This site (${siteUrl}) contains MALWARE. It is highly dangerous!`;
} else if (threatType === 'SOCIAL_ENGINEERING') {
  alertMessage.textContent = `Caution! This site (${siteUrl}) is involved in SOCIAL ENGINEERING. Be careful with your personal information.`;
} else {
  alertMessage.textContent = `This site (${siteUrl}) poses a security risk.`;
}

// Display the severity
const severityMessage = document.createElement('p');
severityMessage.textContent = `Severity: ${threatDetails.severity}`;
alertMessage.appendChild(severityMessage);

// Get the "Go Back" button by its ID and add event listener for "Go Back" functionality
const goBackButton = document.getElementById('back-button');
goBackButton.addEventListener('click', () => {
  if (siteUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      chrome.tabs.update(currentTab.id, { url: siteUrl });
    });
  }
});

// Add the severity to the HTML
const severityLabel = document.getElementById('severity-label');
severityLabel.textContent = `Severity Level: ${threatDetails.severity}`;

// Add event listener for "More Details" button
const detailsButton = document.getElementById('details-button');
detailsButton.addEventListener('click', () => {
  const detailsContainer = document.getElementById('details-container');
  if (detailsContainer.style.display === 'none') {
    // Populate the details table
    const detailsTable = document.getElementById('details-table');
    detailsTable.innerHTML = '<tr><th>Detail</th><th>Value</th></tr>'; // Reset table headers

    for (const [key, value] of Object.entries(threatDetails)) {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      const valueCell = document.createElement('td');

      keyCell.textContent = key;
      valueCell.textContent = value;

      row.appendChild(keyCell);
      row.appendChild(valueCell);
      detailsTable.appendChild(row);
    }

    detailsContainer.style.display = 'block';
    detailsButton.textContent = 'Hide Details';
  } else {
    detailsContainer.style.display = 'none';
    detailsButton.textContent = 'More Details';
  }
});
