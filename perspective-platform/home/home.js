document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndDisplayTrendingNametags();
    fetchAndDisplayPosts();
});

async function fetchAndDisplayTrendingNametags() {
    try {
        const response = await fetch('/perspectives/get_random_perspectives?limit=5', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const randomPerspectives = await response.json();
        const nametagsBody = document.getElementById('trendingNametagsBody');
        nametagsBody.innerHTML = randomPerspectives.map(perspective => `
            <tr>
                <td>${perspective.perspectiveName}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

let currentIndex = 0;

function fetchAndDisplayPosts(sort = 'top') {
    fetch(`/articles/get_latest?index=${currentIndex}&sort=${sort}`)
        .then(response => response.json())
        .then(articles => {
            if (articles.length === 0) {
                alert('No more posts to load.');
                return;
            }
            const mainContainer = document.getElementById('mainContainer');
            mainContainer.innerHTML = ''; // Clear previous posts
            articles.forEach(article => {
                const postElement = createPostElement(article);
                mainContainer.appendChild(postElement);
            });
            currentIndex += articles.length; // Prepare for the next load
        })
        .catch(error => console.error('Error fetching posts:', error));
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');

    const voteContainer = createVoteButtons(post.id);
    voteContainer.classList.add('vote-container');
    postElement.appendChild(voteContainer);

    // Remove event listener from the parent container
    postElement.addEventListener('click', () => {
        // Handle post click event
    });

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');

    const title = document.createElement('h3');
    title.textContent = post.title;
    contentContainer.appendChild(title);

    const content = document.createElement('p');
    content.textContent = post.content;
    contentContainer.appendChild(content);

    postElement.appendChild(contentContainer);

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    // Fetch comment count and append to infoContainer as before
    fetch(`/comments/commentCount/${post.id}`)
        .then(response => response.json())
        .then(data => {
            const commentCount = document.createElement('span');
            commentCount.textContent = `Comments: ${data.commentCount}`;
            infoContainer.appendChild(commentCount);
        })
        .catch(error => console.error('Error fetching comment count:', error));

    const submitDate = document.createElement('span');
    submitDate.textContent = ` ${new Date(post.submitDate).toLocaleDateString()}`;
    infoContainer.appendChild(submitDate);

    postElement.appendChild(infoContainer);

    postElement.addEventListener('click', () => {
        window.location.href = `/postDetails.html?postId=${post.id}`; // Navigate to post details page
    });

    return postElement;
}

function createVoteButtons(postId) {
    const voteContainer = document.createElement('div');
    voteContainer.className = 'vote-container';

    const upvoteButton = document.createElement('button');
    upvoteButton.className = 'vote-button';
    upvoteButton.innerHTML = '▲';
    upvoteButton.id = `upvoteButton-${postId}`;
    upvoteButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        await upvoteArticle(postId);
        fetchAndDisplayVoteCounts(postId);
    });

    const voteCount = document.createElement('div');
    voteCount.className = 'vote-count';
    voteCount.id = `voteCount-${postId}`;
    voteCount.textContent = '0';

    const downvoteButton = document.createElement('button');
    downvoteButton.className = 'vote-button';
    downvoteButton.innerHTML = '▼';
    downvoteButton.id = `downvoteButton-${postId}`;
    downvoteButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        await downvoteArticle(postId);
        fetchAndDisplayVoteCounts(postId);
    });

    voteContainer.appendChild(upvoteButton);
    voteContainer.appendChild(voteCount);
    voteContainer.appendChild(downvoteButton);

    fetchAndDisplayVoteCounts(postId);
    return voteContainer;
}

async function fetchAndDisplayVoteCounts(postId) {
    const response = await fetch(`/articles/voteCounts/${postId}`);
    const data = await response.json();
    if (data.success) {
        const voteCount = document.getElementById(`voteCount-${postId}`);
        if (voteCount) {
            voteCount.textContent = data.upvotes - data.downvotes;
        }
    }
}

async function upvoteArticle(articleId) {
    // Implement the fetch request to upvote an article
    const response = await fetch(`/articles/upvote/${articleId}`, {
        method: 'POST',
        credentials: 'include'
    });
    fetchAndDisplayVoteCounts(articleId); // Refresh vote counts
}

async function downvoteArticle(articleId) {
    // Implement the fetch request to downvote an article
    const response = await fetch(`/articles/downvote/${articleId}`, {
        method: 'POST',
        credentials: 'include'
    });
    fetchAndDisplayVoteCounts(articleId); // Refresh vote counts
}

async function fetchAndDisplayComments(postId) {
    try {
        console.log('Fetching comments for post:', postId);
        const response = await fetch(`/comments/comments/${postId}`);
        const comments = await response.json();
        console.log('Received comments:', comments);
        
        const commentsContainer = document.getElementById('commentsContainer');
        if (!commentsContainer) {
            console.error('Comments container not found');
            return;
        }
        
        commentsContainer.innerHTML = '';
        
        if (comments.length === 0) {
            console.log('No comments received');
            commentsContainer.innerHTML = '<p>No comments yet.</p>';
            return;
        }

        comments.forEach(comment => {
            console.log('Creating element for comment:', comment);
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');

            const commentContent = document.createElement('p');
            commentContent.textContent = comment.text;
            commentElement.appendChild(commentContent);

            const perspectiveTag = document.createElement('span');
            perspectiveTag.classList.add('perspective');
            perspectiveTag.textContent = comment.Perspective?.perspectiveName || 'Unknown Perspective';
            commentElement.appendChild(perspectiveTag);

            commentsContainer.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error in fetchAndDisplayComments:', error);
    }
}

