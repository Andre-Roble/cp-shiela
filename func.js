document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('myCheck');

  if (toggleSwitch) {
    toggleSwitch.addEventListener('change', () => {
      if (toggleSwitch.checked) {
        // Add a delay for smooth animation 
        setTimeout(() => {
          window.location.href = 'sub.html';
        }, 400); // Adjust delay
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

