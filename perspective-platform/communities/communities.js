document.addEventListener('DOMContentLoaded', async () => {
    await loadUserPerspectives();
    setupEventListeners();
});

async function loadUserPerspectives() {
    try {
        const userResponse = await fetch('/account/current', {
            credentials: 'include'
        });
        const user = await userResponse.json();
        console.log('Current user:', user);
        
        const response = await fetch(`/UserPerspective/get_user_perspectives/${user.id}`, {
            credentials: 'include'
        });
        const perspectives = await response.json();
        console.log('Loaded perspectives:', perspectives);
        
        const selector = document.getElementById('communitySelector');
        selector.innerHTML = '<option value="">Select a Community</option>';
        
        perspectives.forEach(perspective => {
            const option = document.createElement('option');
            option.value = perspective.perspectiveId;
            option.textContent = perspective.perspectiveName;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading perspectives:', error);
    }
}

function setupEventListeners() {
    const selector = document.getElementById('communitySelector');
    selector.addEventListener('change', async (e) => {
        console.log('Selected perspective:', e.target.value);
        const perspectiveId = selector.value;
        if (perspectiveId) {
            await Promise.all([
                loadCommunityStats(perspectiveId),
                loadCommunityPosts(perspectiveId)
            ]);
        }
    });

    const submitButton = document.getElementById('submitPost');
    submitButton.addEventListener('click', createPost);
}

async function loadCommunityStats(perspectiveId) {
    try {
        const response = await fetch(`/communities/stats/${perspectiveId}`, {
            credentials: 'include'
        });
        const stats = await response.json();
        
        document.getElementById('memberCount').textContent = stats.memberCount;
        document.getElementById('postCount').textContent = stats.postCount;
        document.getElementById('activeToday').textContent = stats.activeToday;
    } catch (error) {
        console.error('Error loading community stats:', error);
    }
}

async function loadCommunityPosts(perspectiveId) {
    try {
        const response = await fetch(`/communities/posts/${perspectiveId}`, {
            credentials: 'include'
        });
        const posts = await response.json();
        
        const postsContainer = document.getElementById('communityPosts');
        postsContainer.innerHTML = posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <span class="post-date">${formatDate(post.createdAt)}</span>
                </div>
                <div class="post-content">${escapeHtml(post.content)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading community posts:', error);
    }
}

async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const perspectiveId = document.getElementById('communitySelector').value;
    
    if (!content) {
        alert('Please enter some content for your post.');
        return;
    }
    
    if (!perspectiveId) {
        alert('Please select a community first.');
        return;
    }
    
    try {
        const response = await fetch('/communities/create_post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content,
                perspectiveId
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            document.getElementById('postContent').value = '';
            await Promise.all([
                loadCommunityStats(perspectiveId),
                loadCommunityPosts(perspectiveId)
            ]);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
} 