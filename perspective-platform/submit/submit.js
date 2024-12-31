document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndDisplayPerspectives();

    const submitForm = document.getElementById('submitForm');
    if (submitForm) {
        submitForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const title = document.getElementById('title').value;
            const url = document.getElementById('url').value;
            const content = document.getElementById('content').value;
            const scope = document.getElementById('scope').value;
            const perspectiveId = document.getElementById('perspectiveDropdown').value;

            try {
                const response = await fetch('/articles/submit_article', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        url,
                        content,
                        scope,
                        perspectiveId: perspectiveId || null
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to submit article');
                }

                window.location.href = '/home';
            } catch (error) {
                alert(error.message);
            }
        });
    }
});

async function fetchAndDisplayPerspectives() {
    try {
        const userResponse = await fetch('/account/current', {
            credentials: 'include'
        });
        const user = await userResponse.json();
        
        const response = await fetch(`/perspectives/get_perspectives/${user.id}`, {
            credentials: 'include'
        });
        const perspectives = await response.json();
        
        const perspectivesDropdown = document.getElementById('perspectiveDropdown');
        perspectivesDropdown.innerHTML = '<option value="">Select a Perspective</option>';
        
        perspectives.forEach(perspective => {
            const option = document.createElement('option');
            option.value = perspective.perspectiveId;
            option.textContent = perspective.perspectiveName;
            perspectivesDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}