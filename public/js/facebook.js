// Initialize the Facebook SDK
window.fbAsyncInit = function() {
    FB.init({
        appId: process.env.FACEBOOK_CLIENT_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
    });
};

// Load the SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Handle login status
function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        // User is logged into Facebook and has authorized your app
        handleConnected(response.authResponse);
    } else if (response.status === 'not_authorized') {
        // User is logged into Facebook but hasn't authorized your app
        document.getElementById('facebookStatus').textContent = 'Please authorize the app';
    } else {
        // User isn't logged into Facebook
        document.getElementById('facebookStatus').textContent = 'Please log into Facebook';
    }
}

async function handleConnected(authResponse) {
    try {
        // Update UI immediately
        document.getElementById('facebookStatus').textContent = 'Connected';
        document.getElementById('facebookLastSynced').textContent = new Date().toLocaleString();

        // Send token to server
        const response = await fetch('/facebook/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: authResponse.accessToken,
                userID: authResponse.userID,
                expiresIn: authResponse.expiresIn
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save Facebook token');
        }

        // Refresh perspectives after successful connection
        await fetch('/UserPerspective/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error handling Facebook connection:', error);
        document.getElementById('facebookStatus').textContent = 'Connection Failed';
    }
} 