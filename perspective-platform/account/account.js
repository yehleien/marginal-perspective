// perspective-platform/account.js
const perspectiveTypes = ['Default', 'Custom', 'AnotherType', 'custom'];

async function fetchAndDisplayUsername() {
    try {
        const response = await fetch('/account/current', {
            credentials: 'include' // include credentials to send the session cookie
        });
        const user = await response.json();
        const welcomeMessage = document.getElementById('welcomeMessage');
        welcomeMessage.textContent = 'Welcome, ' + user.username + '!';
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchAndDisplayPerspectives() {
    try {
        // Fetch the current user to get the userId
        const userResponse = await fetch('/account/current', {
            credentials: 'include' // include credentials to send the session cookie
        });
        const user = await userResponse.json();
        const userId = user.id;

        // Fetch the user's perspectives by matching UserPerspective with Perspective
        const response = await fetch(`/UserPerspective/get_user_perspectives/${userId}`, {
            credentials: 'include' // include credentials to send the session cookie
        });
        const userPerspectives = await response.json();
        const perspectivesBody = document.getElementById('perspectivesBody');
        perspectivesBody.innerHTML = userPerspectives.map(userPerspective => `
            <tr>
                <td>${userPerspective.perspectiveName}</td>
                <td>${new Date(userPerspective.updatedAt).toLocaleString()}</td>
                <td>${userPerspective.type}</td>
                <td>
                    <button onclick="showUpdateForm(${userPerspective.perspectiveId}, '${userPerspective.perspectiveName}', '${userPerspective.type}')">Update</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

const integrations = [
    {
        name: 'LinkedIn',
        icon: '../assets/integrations/linkedin.svg',
        description: 'Connect your professional network',
        connectFunction: 'connectLinkedIn',
        status: 'disconnected'
    },
    {
        name: 'Spotify',
        icon: '../assets/integrations/spotify.svg',
        description: 'Connect your music preferences',
        connectFunction: 'connectSpotify',
        status: 'disconnected'
    },
    {
        name: 'Gmail',
        icon: '../assets/integrations/gmail.svg',
        description: 'Connect your email activity',
        connectFunction: 'connectGmail',
        status: 'disconnected'
    },
    {
        name: 'GitHub',
        icon: '../assets/integrations/github.svg',
        description: 'Connect your development activity',
        connectFunction: 'connectGithub',
        status: 'coming_soon'
    },
    {
        name: 'Twitter',
        icon: '../assets/integrations/twitter.svg',
        description: 'Connect your social presence',
        connectFunction: 'connectTwitter',
        status: 'coming_soon'
    },
    {
        name: 'Stripe',
        icon: '../assets/integrations/stripe.svg',
        description: 'Connect your payment history',
        connectFunction: 'connectStripe',
        status: 'coming_soon'
    }
];

function renderIntegrations() {
    const container = document.querySelector('.integrations-grid');
    container.innerHTML = integrations.map(integration => `
        <div class="integration-card ${integration.status === 'connected' ? 'connected' : ''}">
            <img src="${integration.icon}" alt="${integration.name}">
            <h3>${integration.name}</h3>
            <p>${integration.description}</p>
            <button 
                onclick="${integration.status !== 'coming_soon' ? integration.connectFunction + '()' : ''}"
                ${integration.status === 'coming_soon' ? 'disabled' : ''}
            >
                ${integration.status === 'coming_soon' ? 'Coming Soon' : 
                  integration.status === 'connected' ? 'Connected' : 'Connect'}
            </button>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', async function() {
    await fetchAndDisplayUsername();
    await fetchAndDisplayPerspectives();
    
    const perspectivesTab = document.getElementById('perspectivesTab');
    const integrationsTab = document.getElementById('integrationsTab');
    const activityTab = document.getElementById('activityTab');
    
    const perspectivesContent = document.getElementById('perspectivesContent');
    const integrationsContent = document.getElementById('integrationsContent');
    const activityContent = document.getElementById('activityContent');

    function switchTab(activeTab, activeContent) {
        // Remove active class from all tabs and content
        [perspectivesTab, integrationsTab, activityTab].forEach(tab => 
            tab.classList.remove('active'));
        [perspectivesContent, integrationsContent, activityContent].forEach(content => 
            content.classList.remove('active'));
        
        // Add active class to selected tab and content
        activeTab.classList.add('active');
        activeContent.classList.add('active');
    }

    perspectivesTab.addEventListener('click', () => {
        switchTab(perspectivesTab, perspectivesContent);
    });

    integrationsTab.addEventListener('click', () => {
        switchTab(integrationsTab, integrationsContent);
        renderIntegrations();
    });

    activityTab.addEventListener('click', () => {
        switchTab(activityTab, activityContent);
        loadUserContent();
    });

    // Initial render of integrations
    renderIntegrations();
});

// Function to update a perspective with type
async function updatePerspective(perspectiveId, perspectiveName, perspectiveType) {
    try {
        const response = await fetch('/perspectives/update_perspective/' + perspectiveId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ perspectiveName, perspectiveType }) // Ensure both name and type are included in the body
        });
        const data = await response.json();
        if (data.success) {
            // Refresh the perspectives list
            fetchAndDisplayPerspectives();
        } else {
            // Display an error message
            console.error('Error:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadUserContent() {
    try {
        const activityContent = document.getElementById('activityContent');
        const postsSection = document.createElement('div');
        postsSection.className = 'posts-section';
        postsSection.innerHTML = `
            <h2>Your Posts</h2>
            <div class="posts-container"></div>
            <button class="load-more-btn" id="loadMorePosts">Load More Posts</button>
        `;

        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments-section';
        commentsSection.innerHTML = `
            <h2>Your Comments</h2>
            <div class="comments-container"></div>
            <button class="load-more-btn" id="loadMoreComments">Load More Comments</button>
        `;

        // Clear existing content and append new sections
        activityContent.querySelector('.activity-section').innerHTML = '';
        activityContent.querySelector('.activity-section').appendChild(postsSection);
        activityContent.querySelector('.activity-section').appendChild(commentsSection);

        // Load both posts and comments initially
        await Promise.all([
            loadUserPosts(0),
            loadUserComments(0)
        ]);

        // Add event listeners for load more buttons
        document.getElementById('loadMorePosts').addEventListener('click', () => {
            const currentPosts = document.querySelectorAll('.posts-container .profile-post').length;
            loadUserPosts(currentPosts);
        });

        document.getElementById('loadMoreComments').addEventListener('click', () => {
            const currentComments = document.querySelectorAll('.comments-container .profile-comment').length;
            loadUserComments(currentComments);
        });
    } catch (error) {
        console.error('Error loading user content:', error);
    }
}

async function loadUserPosts(offset) {
    const response = await fetch(`/articles/user_posts?offset=${offset}`, {
        credentials: 'include'
    });
    const posts = await response.json();
    const container = document.querySelector('.posts-container');
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'profile-post';
        postElement.innerHTML = `
            <div class="post-content">
                <div class="post-metadata">
                    <span class="post-perspective">${post.perspectiveName}</span>
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 class="post-title">
                    <a href="/post/${post.id}">${post.title}</a>
                </h3>
                <p>${post.content}</p>
            </div>
        `;
        container.appendChild(postElement);
    });
}

async function loadUserComments(offset) {
    const response = await fetch(`/comments/get_user_comments?offset=${offset}&limit=10`, {
        credentials: 'include'
    });
    const comments = await response.json();
    const container = document.querySelector('.comments-container');
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'profile-comment';
        commentElement.innerHTML = `
            <div class="comment-content">
                <div class="comment-metadata">
                    <span class="comment-perspective">${comment.Perspective?.perspectiveName || 'Unknown'}</span>
                    <span>${new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p>${comment.text}</p>
                <a href="/post/${comment.article?.id || '#'}">View Post</a>
            </div>
        `;
        container.appendChild(commentElement);
    });
}

// Show the update form with the current perspective name and type
function showUpdateForm(perspectiveId, name, type) {
    const updateIdElement = document.getElementById('updatePerspectiveId');
    const updateNameElement = document.getElementById('updatePerspectiveName');
    const typeDropdown = document.getElementById('updatePerspectiveType');

    if (updateIdElement && updateNameElement && typeDropdown) {
        updateIdElement.value = perspectiveId;
        updateNameElement.value = name;
        // Ensure the dropdown is set to the correct value
        typeDropdown.value = type; // This should correctly set the dropdown to the current type

        document.getElementById('updatePerspectiveForm').style.display = 'block';
    } else {
        console.error('One or more elements do not exist in the DOM.');
    }
}

// Create perspective Dropdown menu
function createDropdown(options, dropdownId) {
    const select = document.createElement('select');
    select.id = dropdownId;
    select.name = dropdownId;
  
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option.charAt(0).toUpperCase() + option.slice(1); // Capitalize the first letter
      select.appendChild(optionElement);
    });
  
    return select;
  }
  
  // Assuming 'perspectiveTypes' is an array of perspective types and 'perspectiveTypeDropdown' is the ID of the div where the dropdown should be appended
  document.addEventListener('DOMContentLoaded', () => {
    const dropdown = createDropdown(perspectiveTypes, 'updatePerspectiveType');
    document.getElementById('perspectiveTypeDropdown').appendChild(dropdown);
  });

// Handle the update form submission
document.getElementById('updatePerspectiveForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const perspectiveId = document.getElementById('updatePerspectiveId').value;
    const name = document.getElementById('updatePerspectiveName').value;
    const type = document.getElementById('updatePerspectiveType').value; // Get the selected type from the dropdown

    if (!perspectiveId) {
        console.error('Error: Perspective ID is undefined');
        return;
    }

    updatePerspective(perspectiveId, name, type); // Pass the type to the update function
});
document.getElementById('addPerspectiveButton').addEventListener('click', async function() {
    const perspectivesTable = document.getElementById('perspectivesTable');
    const row = perspectivesTable.insertRow();

    // Create a cell for the perspective type dropdown
    const typeCell = row.insertCell();
    const typeSelect = document.createElement('select');
    typeCell.appendChild(typeSelect);

    // Fetch and populate perspective types
    try {
        const response = await fetch('/perspectives/get_all_perspectives');
        const perspectiveTypes = await response.json();
        perspectiveTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.perspectiveId; // Assuming each type has a unique ID
            option.textContent = type.perspectiveName; // Assuming the name of the perspective type is what you want to display
            typeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching perspective types:', error);
    }

    // Create a cell for the "Save" button
    const saveCell = row.insertCell();
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', async function() {
        const selectedPerspectiveId = typeSelect.value; // Get the selected perspective type

        // Fetch the current user to get the userId
        const userResponse = await fetch('/account/current', {
            credentials: 'include' // include credentials to send the session cookie
        });
        const user = await userResponse.json();
        const userId = user.id;

        // Add the new perspective to the database
        const response = await fetch('/UserPerspective/add_user_perspective', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ perspectiveId: selectedPerspectiveId, userId }) // Include userId and selected perspective type here
        });

        const data = await response.json();

        if (data.success) {
            // Refresh the perspectives list
            fetchAndDisplayPerspectives();
        } else {
            // Display an error message
            console.error('Error:', data.error);
        }
    });
    saveCell.appendChild(saveButton);
});

async function connectSpotify() {
    try {
        // Get Spotify auth parameters
        const response = await fetch('/spotify/auth-params');
        const { clientId, redirectUri, scope } = await response.json();
        
        // Generate random state
        const state = Math.random().toString(36).substring(7);
        
        // Build authorization URL
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('response_type', 'token');
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('scope', scope);
        authUrl.searchParams.append('state', state);
        
        // Open Spotify auth in popup
        const width = 450;
        const height = 730;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        window.open(
            authUrl.toString(),
            'Spotify Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Handle the callback
        window.spotifyCallback = async (hash) => {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            
            if (accessToken) {
                const userId = await getCurrentUserId();
                const response = await fetch('/spotify/generate-perspectives', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId, accessToken }),
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        alert('Spotify perspectives generated successfully!');
                        loadUserPerspectives();
                    }
                }
            }
        };
    } catch (error) {
        console.error('Error connecting to Spotify:', error);
        alert('Failed to connect to Spotify');
    }
}

async function getCurrentUserId() {
    const response = await fetch('/account/current', {
        credentials: 'include'
    });
    const user = await response.json();
    return user.id;
}

async function connectGmail() {
    try {
        const response = await fetch('/gmail/auth-params');
        const { clientId, redirectUri, scope } = await response.json();
        
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        const params = {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scope,
            access_type: 'offline',
            prompt: 'consent'
        };

        Object.keys(params).forEach(key => 
            authUrl.searchParams.append(key, params[key])
        );

        // Open in popup
        const width = 600;
        const height = 700;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        window.open(
            authUrl.toString(),
            'Gmail Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    } catch (error) {
        console.error('Error connecting to Gmail:', error);
        alert('Failed to connect to Gmail: ' + error.message);
    }
}

window.gmailCallback = async (searchParams) => {
    const params = new URLSearchParams(searchParams);
    const code = params.get('code');
    
    if (code) {
        try {
            console.log('Exchanging code for token...');
            const response = await fetch('/gmail/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code }),
                credentials: 'include'
            });

            const data = await response.json();
            console.log('Token exchange response:', data);

            if (response.ok && data.success) {
                // Verify connection before redirecting
                const statusCheck = await fetch('/gmail/status', {
                    credentials: 'include'
                });
                const { connected } = await statusCheck.json();

                if (connected) {
                    window.location.href = '/account/gmail-manager.html';
                } else {
                    throw new Error('Failed to verify Gmail connection');
                }
            } else {
                throw new Error(data.error || 'Failed to connect Gmail');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect Gmail: ' + error.message);
        }
    }
};

async function loadUserPosts(offset) {
    const response = await fetch(`/articles/user_posts?offset=${offset}&limit=10`, {
        credentials: 'include'
    });
    const posts = await response.json();
    const container = document.querySelector('.posts-container');
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'profile-post';
        postElement.innerHTML = `
            <div class="post-content">
                <div class="post-metadata">
                    <span class="post-perspective">${post.Perspective?.perspectiveName || 'Unknown'}</span>
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 class="post-title">
                    <a href="/post/${post.id}">${post.title}</a>
                </h3>
                <p>${post.content || ''}</p>
            </div>
        `;
        container.appendChild(postElement);
    });
}

async function connectLinkedIn() {
    try {
        const width = 450;
        const height = 730;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        window.open(
            '/auth/linkedin',
            'LinkedIn Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    } catch (error) {
        console.error('Error connecting to LinkedIn:', error);
        alert('Failed to connect to LinkedIn');
    }
}

