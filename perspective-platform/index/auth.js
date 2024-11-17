// auth.js

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = '/home';
        } else {
            alert('Login failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Login failed');
    }
});

// Only add logout listener if the button exists
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', function() {
        fetch('/account/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(() => {
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Error during logout:', error);
        });
    });
}

// Only add signup listener if the form exists
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(event) {
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
                window.location.href = '/home';
            }
        })
        .catch(error => {
            console.error('Error during signup:', error);
        });
    });
}
