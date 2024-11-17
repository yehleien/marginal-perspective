let accessToken = null;

// Listen for the auth response from the popup
window.addEventListener('message', async (event) => {
    if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
        try {
            const response = await fetch('/gmail/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: event.data.code }),
                credentials: 'include'
            });
            
            const data = await response.json();
            if (data.success) {
                // Refresh the page to show scan controls
                window.location.reload();
            } else {
                throw new Error(data.error || 'Failed to exchange token');
            }
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            alert('Failed to connect Gmail: ' + error.message);
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check Gmail connection status
        const statusResponse = await fetch('/gmail/status', {
            credentials: 'include'
        });
        const { connected } = await statusResponse.json();
        
        if (!connected) {
            // Show connection required message
            document.querySelector('.scan-controls').innerHTML = `
                <div class="connection-required">
                    <p>Gmail is not connected. Please connect Gmail from the account page.</p>
                    <a href="/account" class="btn">Return to Account</a>
                </div>
            `;
        } else {
            // Enable scan controls
            document.getElementById('scanButton').disabled = false;
        }
    } catch (error) {
        console.error('Error checking Gmail status:', error);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanButton');
    const scanTypeSelect = document.getElementById('scanTypeSelect');
    const resultsContainer = document.getElementById('resultsContainer');
    const disconnectButton = document.getElementById('disconnectGmail');

    scanButton.addEventListener('click', async () => {
        const scanType = scanTypeSelect.value;
        if (!scanType) {
            alert('Please select what to scan for');
            return;
        }

        try {
            scanButton.disabled = true;
            scanButton.textContent = 'Scanning...';
            resultsContainer.innerHTML = '<p>Scanning emails...</p>';

            const response = await fetch('/gmail/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ scanType }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to scan emails');
            }

            displayResults(data.results);

        } catch (error) {
            console.error('Error:', error);
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            scanButton.disabled = false;
            scanButton.textContent = 'Scan Emails';
        }
    });

    disconnectButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to disconnect Gmail? This will not remove any existing perspectives.')) {
            try {
                const response = await fetch('/gmail/disconnect', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    window.location.href = '/account';
                } else {
                    throw new Error('Failed to disconnect Gmail');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to disconnect Gmail: ' + error.message);
            }
        }
    });

    function displayResults(results) {
        if (!results.length) {
            resultsContainer.innerHTML = '<p>No matching emails found.</p>';
            return;
        }

        resultsContainer.innerHTML = results.map(result => `
            <div class="perspective-result">
                <h4>${result.perspectiveName}</h4>
                <p>Found in email dated: ${new Date(result.date).toLocaleDateString()}</p>
                <button onclick="addPerspective('${result.perspectiveName}')" class="add-perspective-btn">
                    Add Perspective
                </button>
            </div>
        `).join('');
    }
});

async function addPerspective(perspectiveName) {
    try {
        const response = await fetch('/perspectives/add_perspective', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                perspectiveName,
                type: 'gmail'
            }),
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            alert('Perspective added successfully!');
        }
    } catch (error) {
        console.error('Error adding perspective:', error);
        alert('Error adding perspective: ' + error.message);
    }
} 