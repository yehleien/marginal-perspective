document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    if (postId) {
        await fetchAndDisplayPostDetails(postId);
        await fetchAndDisplayComments(postId);
    }

    document.getElementById('commentForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const commentText = document.getElementById('commentText').value;
        const perspectiveId = document.getElementById('perspectiveSelect').value;
        const parentID = document.getElementById('parentIDInput').value || null; // Ensure parentID can be null
        await submitComment(commentText, perspectiveId, parentID, postId);
    });

    const user = await getCurrentUser();
    const perspectivesResponse = await fetch(`/perspectives/get_perspectives/${user.id}`);
    const perspectives = await perspectivesResponse.json();
    const perspectiveSelect = document.getElementById('perspectiveSelect');
    perspectives.forEach(perspective => {
        const option = document.createElement('option');
        option.value = perspective.perspectiveId;
        option.textContent = perspective.perspectiveName;
        perspectiveSelect.appendChild(option);
    });
});

async function getCurrentUser() {
    const response = await fetch('/account/current', { credentials: 'include' });
    return response.json();
}

async function submitComment(commentText, perspectiveId, parentID, postId) {
    const user = await getCurrentUser();
    const response = await fetch('/comments/submit_comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: postId, commentText, userId: user.id, perspectiveId, parentID }),
    });

    if (response.ok) {
        await fetchAndDisplayComments(postId);
        document.getElementById('commentText').value = '';
        document.getElementById('parentIDInput').value = '';
        document.getElementById('perspectiveSelect').value = '';
    } else {
        console.error('Error submitting comment:', await response.text());
    }
}

async function fetchAndDisplayComments(postId) {
    const response = await fetch(`/comments/comments/${postId}`, { credentials: 'include' });
    if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return;
    }
    const comments = await response.json();
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = '';

    const user = await getCurrentUser();

    comments.forEach(comment => {
        const commentElement = createCommentElement(comment, user.id);
        commentsContainer.appendChild(commentElement);
    });
}

function createCommentElement(comment, currentUserId) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.style.display = 'grid';
    commentElement.style.gridTemplateColumns = 'auto 1fr';
    commentElement.style.gap = '16px';
    commentElement.style.border = '1px solid #d7dadc';
    commentElement.style.padding = '16px';
    commentElement.style.marginBottom = '12px';
    commentElement.style.backgroundColor = '#ffffff';
    commentElement.style.position = 'relative';

    // Create vote container
    const voteContainer = document.createElement('div');
    voteContainer.className = 'vote-container';
    voteContainer.style.display = 'flex';
    voteContainer.style.flexDirection = 'column';
    voteContainer.style.alignItems = 'center';
    voteContainer.style.justifyContent = 'center';

    // Upvote button
    const upvoteButton = document.createElement('button');
    upvoteButton.id = `upvoteComment-${comment.id}`;
    upvoteButton.className = comment.userHasUpvoted ? 'upvoted' : '';
    upvoteButton.innerHTML = `&#x25B2; (${comment.upvotes})`;
    upvoteButton.addEventListener('click', async () => {
        await upvoteComment(comment.id);
        fetchAndDisplayComments(currentUserId); // Make sure this function is correctly implemented
    });

    // Downvote button
    const downvoteButton = document.createElement('button');
    downvoteButton.id = `downvoteComment-${comment.id}`;
    downvoteButton.className = comment.userHasDownvoted ? 'downvoted' : '';
    downvoteButton.innerHTML = `&#x25BC; (${comment.downvotes})`;
    downvoteButton.addEventListener('click', async () => {
        await downvoteComment(comment.id);
        fetchAndDisplayComments(currentUserId); // Make sure this function is correctly implemented
    });

    // Append buttons to vote container
    voteContainer.appendChild(upvoteButton);
    voteContainer.appendChild(downvoteButton);

    // Append vote container to comment element
    commentElement.appendChild(voteContainer);

    // Comment content
    const commentContent = document.createElement('div');
    commentContent.className = 'comment-content';
    commentContent.textContent = comment.text;
    commentElement.appendChild(commentContent);

    // Info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'info-container';
    infoContainer.style.display = 'flex';
    infoContainer.style.justifyContent = 'space-between';
    infoContainer.style.alignItems = 'center';
    infoContainer.style.fontSize = '0.8em';
    infoContainer.style.color = '#787c7e';
    // Assuming commentCount or similar data is available; adjust as necessary
    const commentCountSpan = document.createElement('span');
    commentCountSpan.textContent = `Comments: ${comment.commentCount || 0}`;
    infoContainer.appendChild(commentCountSpan);

    // Append info container to comment element
    commentElement.appendChild(infoContainer);

    return commentElement;
}

async function fetchAndDisplayPostDetails(postId) {
    const response = await fetch(`/articles/api/posts/${postId}`, { credentials: 'include' });
    if (!response.ok) {
        console.error('Error fetching post details:', await response.text());
        document.getElementById('postTitle').textContent = 'Error loading post';
        return;
    }
    const postDetails = await response.json();
    document.getElementById('postTitle').textContent = postDetails.title;
    document.getElementById('postContent').textContent = postDetails.content;
    document.getElementById('postDate').textContent = `Submitted on: ${new Date(postDetails.submitDate).toLocaleDateString()}`;
    document.getElementById('postPerspective').textContent = `Perspective: ${postDetails.Perspective ? postDetails.Perspective.perspectiveName : 'N/A'}`;
}

async function upvoteComment(commentId) {
    // Implement the fetch request to upvote a comment
    const response = await fetch(`/comments/upvote/${commentId}`, {
        method: 'POST',
        credentials: 'include'
    });
}

async function downvoteComment(commentId) {
    // Implement the fetch request to downvote a comment
    const response = await fetch(`/comments/downvote/${commentId}`, {
        method: 'POST',
        credentials: 'include'
    });
}