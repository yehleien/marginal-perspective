document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    if (postId) {
        await fetchAndDisplayPostDetails(postId);
        await fetchAndDisplayComments(postId);
        await fetchAndDisplayPerspectives();
    }

    document.getElementById('commentForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const commentText = document.getElementById('commentText').value;
        const perspectiveId = document.getElementById('perspectiveDropdown').value;
        const parentID = document.getElementById('parentIDInput').value || null;
        await submitComment(commentText, perspectiveId, parentID, postId);
        fetchAndDisplayComments(postId);
    });

    const user = await getCurrentUser();
    const perspectivesResponse = await fetch(`/perspectives/get_perspectives/${user.id}`);
    const perspectives = await perspectivesResponse.json();
    const perspectiveDropdown = document.getElementById('perspectiveDropdown');    perspectives.forEach(perspective => {
        const option = document.createElement('option');
        option.value = perspective.perspectiveId;
        option.textContent = perspective.perspectiveName;
        perspectiveDropdown.appendChild(option);
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
        document.getElementById('perspectiveDropdown').value = '';
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

    // Fetch all unique perspective IDs from comments
    const perspectiveIds = [...new Set(comments.map(comment => comment.perspectiveId))];    
    // Fetch perspective names
    const perspectivesResponse = await fetch('/perspectives/get_perspectives_by_ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perspectiveIds }),
        credentials: 'include'
    });
    const perspectives = await perspectivesResponse.json();

    // Create a map of perspective IDs to names
    const perspectiveMap = new Map(perspectives.map(p => [p.perspectiveId.toString(), p.perspectiveName]));

    console.log('Perspective Map:', perspectiveMap);

    // Fetch user's perspectives
    const userPerspectivesResponse = await fetch(`/UserPerspective/get_user_perspectives/${user.id}`);
    const userPerspectives = await userPerspectivesResponse.json();

    // Create a nested structure for comments
    const nestedComments = createNestedComments(comments);

    nestedComments.forEach(comment => {
        const commentElement = createCommentElement(comment, user.id, postId, perspectiveMap, userPerspectives);
        commentsContainer.appendChild(commentElement);
    });
}

function createNestedComments(comments) {
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
        if (comment.parentID) {
            const parentComment = commentMap.get(comment.parentID);
            if (parentComment) {
                parentComment.replies.push(commentMap.get(comment.id));
            }
        } else {
            rootComments.push(commentMap.get(comment.id));
        }
    });

    return rootComments;
}

function createCommentElement(comment, currentUserId, postId, perspectiveMap, userPerspectives, depth = 0) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.id = `comment-${comment.id}`;

    // Check if the user has the required perspective
    const userHasPerspective = userPerspectives.some(up => up.perspectiveId === comment.perspectiveId);

    // Vote container
    const voteContainer = document.createElement('div');
    voteContainer.className = 'vote-container';

    const upvoteButton = document.createElement('button');
    upvoteButton.innerHTML = '▲';
    upvoteButton.className = comment.userHasUpvoted ? 'upvoted' : '';
    upvoteButton.disabled = !userHasPerspective;
    upvoteButton.addEventListener('click', async () => {
        if (userHasPerspective) {
            const result = await upvoteComment(comment.id);
            if (result.success) {
                updateCommentVotes(comment, result, upvoteButton, downvoteButton);
            }
        }
    });

    const voteCount = document.createElement('span');
    voteCount.textContent = comment.upvotes - comment.downvotes;

    const downvoteButton = document.createElement('button');
    downvoteButton.innerHTML = '▼';
    downvoteButton.className = comment.userHasDownvoted ? 'downvoted' : '';
    downvoteButton.disabled = !userHasPerspective;
    downvoteButton.addEventListener('click', async () => {
        if (userHasPerspective) {
            const result = await downvoteComment(comment.id);
            if (result.success) {
                updateCommentVotes(comment, result, upvoteButton, downvoteButton);
            }
        }
    });

    voteContainer.appendChild(upvoteButton);
    voteContainer.appendChild(voteCount);
    voteContainer.appendChild(downvoteButton);

    // Comment content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'comment-content';

    const commentHeader = document.createElement('div');
    commentHeader.className = 'comment-header';

    const perspectiveName = perspectiveMap.get(comment.perspectiveId.toString()) || 'Unknown Perspective';
    const perspectiveTag = document.createElement('span');
    perspectiveTag.className = 'perspective-tag';
    perspectiveTag.textContent = perspectiveName;
    perspectiveTag.setAttribute('data-perspective', perspectiveName);
    commentHeader.appendChild(perspectiveTag);

    const commentText = document.createElement('div');
    commentText.className = 'comment-text';
    commentText.textContent = comment.text;

    const commentFooter = document.createElement('div');
    commentFooter.className = 'comment-footer';

    const replyButton = document.createElement('button');
    replyButton.className = 'reply-button';
    replyButton.textContent = 'Reply';
    replyButton.addEventListener('click', () => showReplyForm(comment, currentUserId, postId, perspectiveMap, userPerspectives, depth + 1));

    commentFooter.appendChild(replyButton);

    contentContainer.appendChild(commentHeader);
    contentContainer.appendChild(commentText);
    contentContainer.appendChild(commentFooter);

    commentElement.appendChild(voteContainer);
    commentElement.appendChild(contentContainer);

    // Nested comments
    if (comment.replies && comment.replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'comment-thread';
        comment.replies.forEach(reply => {
            const replyElement = createCommentElement(reply, currentUserId, postId, perspectiveMap, userPerspectives, depth + 1);
            repliesContainer.appendChild(replyElement);
        });
        contentContainer.appendChild(repliesContainer);
    }

    return commentElement;
}

function updateCommentVotes(comment, result, upvoteButton, downvoteButton) {
    comment.upvotes = result.upvotes;
    comment.downvotes = result.downvotes;
    comment.userHasUpvoted = result.userHasUpvoted;
    comment.userHasDownvoted = result.userHasDownvoted;
    
    const voteCount = upvoteButton.nextElementSibling;
    voteCount.textContent = comment.upvotes - comment.downvotes;
    
    upvoteButton.className = comment.userHasUpvoted ? 'upvoted' : '';
    downvoteButton.className = comment.userHasDownvoted ? 'downvoted' : '';
}

function showReplyForm(parentComment, currentUserId, postId, perspectiveMap, userPerspectives, depth) {
    // Remove any existing reply form
    const existingForm = document.querySelector('.reply-form');
    if (existingForm) {
        existingForm.remove();
    }

    const replyForm = document.createElement('form');
    replyForm.className = 'reply-form';
    replyForm.style.marginLeft = `${depth * 20}px`;
    replyForm.style.marginTop = '10px';

    const textarea = document.createElement('textarea');
    textarea.required = true;
    replyForm.appendChild(textarea);

    const perspectiveDropdown = document.createElement('select');
    perspectiveDropdown.required = true;
    userPerspectives.forEach(perspective => {
        if (perspective.perspectiveId === parentComment.perspectiveId) {
            const option = document.createElement('option');
            option.value = perspective.perspectiveId;
            option.textContent = perspectiveMap.get(perspective.perspectiveId.toString()) || 'Unknown Perspective';
            perspectiveDropdown.appendChild(option);
        }
    });
    replyForm.appendChild(perspectiveDropdown);

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Reply';
    submitButton.type = 'submit';
    replyForm.appendChild(submitButton);

    replyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const replyText = textarea.value;
        const perspectiveId = perspectiveDropdown.value;
        await submitComment(replyText, perspectiveId, parentComment.id, postId);
        replyForm.remove();
        await fetchAndDisplayComments(postId);
    });

    // Insert the reply form after the parent comment
    const parentCommentElement = document.getElementById(`comment-${parentComment.id}`);
    if (parentCommentElement) {
        parentCommentElement.insertAdjacentElement('afterend', replyForm);
    }
}

async function upvoteComment(commentId) {
    try {
        const response = await fetch(`/comments/upvote/${commentId}`, {
            method: 'POST',
            credentials: 'include'
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to upvote comment');
        }
        return result;
    } catch (error) {
        console.error('Error upvoting comment:', error);
        return { success: false, message: error.message };
    }
}

async function downvoteComment(commentId) {
    try {
        const response = await fetch(`/comments/downvote/${commentId}`, {
            method: 'POST',
            credentials: 'include'
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to downvote comment');
        }
        return result;
    } catch (error) {
        console.error('Error downvoting comment:', error);
        return { success: false, message: error.message };
    }
}

async function fetchAndDisplayPostDetails(postId) {
    try {
        console.log('Fetching post details for ID:', postId);
        const response = await fetch(`/articles/posts/${postId}`, { credentials: 'include' });
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const post = await response.json();
        console.log('Fetched post details:', post);

        const titleElement = document.getElementById('postTitle');
        titleElement.innerHTML = `<a href="${post.url}" target="_blank">${post.title}</a>`;
        
        const contentElement = document.getElementById('postContent');
        contentElement.textContent = post.content;
        
        document.getElementById('postDate').textContent = new Date(post.submitDate).toLocaleDateString();
        document.getElementById('postPerspective').textContent = post.Perspective ? post.Perspective.perspectiveName : 'Unknown';

        const expandButton = document.getElementById('expandButton');
        if (contentElement.scrollHeight > contentElement.clientHeight) {
            expandButton.style.display = 'block';
            expandButton.addEventListener('click', toggleContent);
        }

        // Fetch vote counts separately
        const voteCountsResponse = await fetch(`/articles/voteCounts/${postId}`, { credentials: 'include' });
        const voteCounts = await voteCountsResponse.json();

        // Set up vote buttons
        const upvoteButton = document.getElementById('upvoteButton');
        const downvoteButton = document.getElementById('downvoteButton');
        const voteCount = document.getElementById('voteCount');

        voteCount.textContent = voteCounts.upvotes - voteCounts.downvotes;

        upvoteButton.addEventListener('click', () => votePost(postId, 'upvote'));
        downvoteButton.addEventListener('click', () => votePost(postId, 'downvote'));

        updateVoteButtons(voteCounts);
    } catch (error) {
        console.error('Error fetching post details:', error);
    }
}

function toggleContent() {
    const contentElement = document.getElementById('postContent');
    const expandButton = document.getElementById('expandButton');
    
    if (contentElement.classList.contains('expanded')) {
        contentElement.classList.remove('expanded');
        expandButton.textContent = 'Show More';
    } else {
        contentElement.classList.add('expanded');
        expandButton.textContent = 'Show Less';
    }
}

async function votePost(postId, voteType) {
    try {
        const response = await fetch(`/articles/${voteType}/${postId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        updateVoteButtons(result);
    } catch (error) {
        console.error('Error voting on post:', error);
    }
}

function updateVoteButtons(voteCounts) {
    const upvoteButton = document.getElementById('upvoteButton');
    const downvoteButton = document.getElementById('downvoteButton');
    const voteCount = document.getElementById('voteCount');

    voteCount.textContent = voteCounts.upvotes - voteCounts.downvotes;
    // Note: We don't have user's vote information here, so we can't update button styles
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
        const perspectivesDropdown = document.getElementById('perspectiveDropdown');
        perspectivesDropdown.innerHTML = ''; // Clear existing options first
        userPerspectives.forEach(type => {
            const option = document.createElement('option');
            option.value = type.perspectiveId; // Assuming each type has a unique ID
            option.textContent = type.perspectiveName; // Assuming the name of the perspective type is what you want to display
            perspectivesDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}