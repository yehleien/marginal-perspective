// auth.js

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/communities'; // Redirect to home page
        } else {
            console.error(data.error); // Display an error message
        }
    })
    .catch(error => {
        console.error('Error during login:', error);
    });
});

// Add a logout functionality to redirect the user to the login page
document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/account/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(() => {
        window.location.href = '/login'; // Redirect to the login page after logout
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
});

document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    fetch('/account/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/home'; // Redirect to home page after successful signup
               } else {
            // Display an error message
        }
    })
    .catch(error => {
        console.error('Error during signup:', error);
    });
});
