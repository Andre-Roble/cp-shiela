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

