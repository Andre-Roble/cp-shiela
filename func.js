document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('myCheck');
  const statusElement = document.getElementById('status');

  if (toggleSwitch) {
    toggleSwitch.addEventListener('change', () => {
      if (toggleSwitch.checked) {
        statusElement.textContent = 'Checking site for phishing...';

        // Send a message to background.js to check the current URL for phishing
        chrome.runtime.sendMessage({ action: 'checkPhishing', url: window.location.href }, (response) => {
          if (response.isPhishing) {
            statusElement.textContent = 'Warning: Phishing site detected!';
            alert('Warning: This site may be a phishing site!');
          } else if (response.error) {
            console.error('Phishing check failed:', response.error);
            statusElement.textContent = 'Error checking site.';
          } else {
            statusElement.textContent = 'Site is safe.';
          }
        });
      } else {
        statusElement.textContent = ''; // Clear status when phishing check is turned off
      }
    });
  } else {
    console.error('Element with id "myCheck" not found.');
  }
});



// document.addEventListener('DOMContentLoaded', () => {
//   const toggleSwitch = document.getElementById('myCheck');
//   const statusDiv = document.getElementById('status');

//   const apiKey = 'AIzaSyBckeSQ9srPnJkdbk46miUCdT8C7Xs1sZ0'; // Replace with your actual API key

//   toggleSwitch.addEventListener('change', () => {
//     if (toggleSwitch.checked) {
//       // Add a delay for smooth animation 
//       setTimeout(() => {
//         window.location.href = 'sub.html';
//       }, 400); // Adjust delay

//       // Enable threat detection logic
//       // ...
//     } else {
//       // Disable threat detection logic
//       // ...
//     }
//   });

//   // Example of checking a URL when a link is clicked
//   document.addEventListener('click', (event) => {
//     if (event.target.tagName === 'A') {
//       const url = event.target.href;
//       checkUrl(url);
//     }
//   });

//   function checkUrl(url) {
//     // Make API call to Safe Browsing Lookup API
//     fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${AIzaSyBckeSQ9srPnJkdbk46miUCdT8C7Xs1sZ0}...`, {
//       // API request body
//     })
//       .then(response => response.json())
//       .then(data => {
//         // Process API response
//         if (data.matches) {
//           statusDiv.textContent = 'Threat detected!';
//           // Take appropriate actions (e.g., block the URL, warn the user)
//         } else {
//           statusDiv.textContent = 'Safe';
//         }
//       })
//       .catch(error => {
//         console.error('Error checking URL:', error);
//         statusDiv.textContent = 'Error checking URL';
//       });
//   }
// });

