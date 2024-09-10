const blockAdsCheckbox = document.getElementById('ad-block-toggle');
const blockAdTrackersCheckbox = document.querySelector('.block-ad-trackers input[type="checkbox"]');
const blockAdsButton = document.querySelector('.block-ads span');
const blockAdTrackersButton = document.querySelector('.block-ad-trackers span');

chrome.storage.sync.get(['adBlockEnabled'], (result) => {
  blockAdsCheckbox.checked = result.adBlockEnabled || false;
  blockAdsButton.textContent = blockAdsCheckbox.checked ? 'Ads Blocked' : 'Block Ads';
});

// listen for checkbox if toggled or not
blockAdsCheckbox.addEventListener('change', () => {
  const isEnabled = blockAdsCheckbox.checked;
  
  blockAdsButton.textContent = isEnabled ? 'Ads Blocked' : 'Block Ads';

  // send message to background script to enable/disable ad blocking
  chrome.runtime.sendMessage({ action: 'toggleAdBlock', enabled: isEnabled });

  // save the state
  chrome.storage.sync.set({ adBlockEnabled: isEnabled });
});

blockAdTrackersCheckbox.addEventListener('change', () => {
  if (blockAdTrackersCheckbox.checked) {
    blockAdTrackersButton.textContent = 'Ad Trackers Blocked';
    // logic for blocking ad trackers
  } else {
    blockAdTrackersButton.textContent = 'Block Ad Trackers';
    // Logic for unblocking ad trackers
  }
});

//back button

document.querySelector('.back-button').addEventListener('click', () => {
  // Add your logic here to go back to the previous page
  window.history.back();
});

const checkButton = document.querySelector('.check-btn');
checkButton.addEventListener('click', fetchData);


chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  var currentTab = tabs[0];
  var url = currentTab.url;
  var domain = url.replace(/https?:\/\//, ''); // for auto
  document.getElementById('textInput').value = domain;
});

async function fetchData() {
  const textInput = document.getElementById('textInput').value.trim();
  if (!textInput) {
    alert('Please enter a valid domain');
    return;
  }

  const domain = textInput.replace(/https?:\/\//, ''); // for input
  const parts = domain.split('.');
  if (parts.length < 2) {
    alert('Invalid input. Please enter a valid domain (e.g. example.com, etc.)');
    return;
  }

  try {
    const response = await fetch(`https://check-ssl.p.rapidapi.com/sslcheck?domain=${domain}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '745c95af6bmshe6b922b175f24bdp1921e4jsn7694b614c269',
        'x-rapidapi-host': 'check-ssl.p.rapidapi.com'
      }
    });
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error(error);
    displayError('Failed to fetch data. Please try again later.');
  }
}


function displayResults(data) {
  const resultElement = document.getElementById('ssl-result');
  const keysToDisplay = [
    'isvalidCertificate',
    'canBeSelfSigned',
    'isWildCard',
    'isExpired',
    'message',
    'expiry',
    'daysLeft',
    'lifespanInDays',
    'issuer',
  ];

  const keysToDisplay1 = [
    'certDetails',
    'name',
    'CN',
    'hash',
    'issuer',
    'C',
    'O',
    'version',
    'serialNumber',
    'serialNumberHex',
    'validFrom',
    'validTo',
    'validFrom_time_t',
    'validTo_time_t',
    'signatureTypeSN',
    'signatureTypeLN',
    'signatureTypeNID',
    'validLeft',
    'apiVersion',
    'error'
  ];

  const displayData = (data, keys) => {
    return keys.map(key => {
      if (keysToDisplay.includes(key) || keysToDisplay1.includes(key)) {
        if (typeof data[key] === 'object') {
          return `<tr><td colspan="2">${key}</td></tr>${displayData(data[key], Object.keys(data[key]))}`;
        } else if (data[key] !== undefined) {
          return `<tr><td>${key}</td><td>${data[key]}</td></tr>`;
        } else {
          return '';
        }
      }
      return '';
    }).join('');
  };

  const tableTemplate = (data, keys) => {
    return `
      <table class="ssl-result-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${displayData(data, keys)}
        </tbody>
      </table>
    `;
  };

  const showMoreButton = document.createElement('button');
  showMoreButton.textContent = '--Show more--';
  showMoreButton.classList.add('show-more-button'); // add a class to the button
  showMoreButton.onclick = () => {
    resultElement.innerHTML = tableTemplate(data, [...keysToDisplay, ...keysToDisplay1]);
    const showLessButton = document.createElement('button');
    showLessButton.textContent = '--Show less--';
    showLessButton.classList.add('show-less-button'); // add a class to the button
    showLessButton.onclick = () => {
      resultElement.innerHTML = tableTemplate(data, keysToDisplay);
      resultElement.appendChild(showMoreButton);
    };
    resultElement.appendChild(showLessButton);
  };

  resultElement.innerHTML = tableTemplate(data, keysToDisplay);
  resultElement.appendChild(showMoreButton);
}