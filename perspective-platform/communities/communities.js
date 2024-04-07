document.addEventListener('DOMContentLoaded', async () => {
    const userId = await fetchCurrentUserId();
    await fetchAndDisplayPerspectives(userId); // Fetches perspectives for "My Communities"

    // Show "My Communities" by default
    document.getElementById('myCommunitiesBody').style.display = "block";
    // Hide "All Communities" by default
    document.getElementById('allCommunitiesBody').style.display = "none";

    // Optionally preload data for "All Communities"
    await fetchAndDisplayAllCommunities();
});

async function fetchCurrentUserId() {
    try {
        const response = await fetch('/account/current', {
            credentials: 'include' // include credentials to send the session cookie
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const user = await response.json();
        return user.id; // Assuming the user object has an id field
    } catch (error) {
        console.error('Error:', error);
        return null; // Handle error appropriately in your application context
    }
}

async function fetchAndDisplayPerspectives(userId) {
    try {
        const response = await fetch(`/UserPerspective/get_user_perspectives/${userId}`, {
            credentials: 'include'
        });
        const userPerspectives = await response.json();
        const perspectivesBody = document.getElementById('myCommunitiesTable');
        const perspectiveDropdown = document.getElementById('perspectiveId');

        // Clear existing options
        perspectiveDropdown.innerHTML = '';

        userPerspectives.forEach(userPerspective => {
            // Populate the table
            perspectivesBody.innerHTML += `
                <tr>
                    <td>${userPerspective.perspectiveName}</td>
                </tr>
            `;

            // Populate the dropdown
            const option = document.createElement('option');
            option.value = userPerspective.id;
            option.textContent = userPerspective.perspectiveName;
            perspectiveDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchAndDisplayAllCommunities() {
    try {
        const response = await fetch('/perspectives/get_all_perspectives', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allPerspectives = await response.json();
        const perspectivesBody = document.getElementById('allCommunitiesTable');
        perspectivesBody.innerHTML = allPerspectives.map(perspective => `
            <tr>
                <td>${perspective.perspectiveName}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

let currentIndex = 0; // Reset index when changing sort criteria

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



document.addEventListener('DOMContentLoaded', fetchAndDisplayPosts);


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

    // Upvote button with count
    const upvoteButton = document.createElement('button');
    upvoteButton.id = `upvoteButton-${postId}`;
    upvoteButton.addEventListener('click', async () => {
        event.stopPropagation(); // Prevent the click event from bubbling up to the parent container
        await upvoteArticle(postId);
        fetchAndDisplayVoteCounts(postId);
    });

    // Downvote button with count
    const downvoteButton = document.createElement('button');
    downvoteButton.id = `downvoteButton-${postId}`;
    downvoteButton.addEventListener('click', async () => {
        event.stopPropagation(); // Prevent the click event from bubbling up to the parent container
        await downvoteArticle(postId);
        fetchAndDisplayVoteCounts(postId);
    });

    voteContainer.appendChild(upvoteButton);
    voteContainer.appendChild(downvoteButton);

    fetchAndDisplayVoteCounts(postId); // Initial fetch for the current vote counts

    return voteContainer;
}

async function fetchAndDisplayVoteCounts(postId) {
    const response = await fetch(`/articles/voteCounts/${postId}`);
    const data = await response.json();
    if (data.success) {
        const upvoteButton = document.getElementById(`upvoteButton-${postId}`);
        const downvoteButton = document.getElementById(`downvoteButton-${postId}`);
        upvoteButton.textContent = `↑ ${data.upvotes}`;
        downvoteButton.textContent = `↓ ${data.downvotes}`;
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
        const response = await fetch(`/comments/comments/${postId}`);
        const comments = await response.json();
        const commentsContainer = document.getElementById('commentsContainer');
        commentsContainer.innerHTML = ''; // Clear existing comments

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');

            const commentContent = document.createElement('p');
            commentContent.textContent = comment.text;
            commentElement.appendChild(commentContent);

            const commentAuthor = document.createElement('p');
            commentAuthor.textContent = `By: ${comment.userId}`;
            commentElement.appendChild(commentAuthor);

            commentsContainer.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

