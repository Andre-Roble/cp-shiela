// Get query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const threatType = urlParams.get('threatType');
const siteUrl = urlParams.get('url');
const details = JSON.parse(urlParams.get('details') || '{}'); // Parse additional details

// Display threat type and severity
const alertMessage = document.getElementById('alert-message');
alertMessage.textContent = `Warning! The site (${siteUrl}) has been flagged for ${threatType}.`;

// Display severity
const severityMessage = document.createElement('p');
severityMessage.textContent = `Severity Level: ${urlParams.get('severity') || 'Unknown'}`;
alertMessage.appendChild(severityMessage);

// Display additional details in the table
const detailsContainer = document.getElementById('details-container');
const detailsTable = document.getElementById('details-table');
detailsTable.innerHTML = '<tr><th>Detail</th><th>Value</th></tr>'; // Reset table headers

for (const [key, value] of Object.entries(details)) {
  const row = document.createElement('tr');
  const keyCell = document.createElement('td');
  const valueCell = document.createElement('td');

  keyCell.textContent = key;
  valueCell.textContent = value;

  row.appendChild(keyCell);
  row.appendChild(valueCell);
  detailsTable.appendChild(row);
}

// Show/Hide additional details
const detailsButton = document.getElementById('details-button');
detailsButton.addEventListener('click', () => {
  if (detailsContainer.style.display === 'none') {
    detailsContainer.style.display = 'block';
    detailsButton.textContent = 'Hide Details';
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
