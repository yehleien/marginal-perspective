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
    try {
        const user = await getCurrentUser();
        const response = await fetch('/comments/submit_comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                articleId: postId,
                commentText: commentText,
                userId: user.id,
                perspectiveId: perspectiveId,
                parentID: parentID || null
            }),
        });

        if (response.ok) {
            const newComment = await response.json();
            
            // Clear the form
            if (!parentID) {
                document.getElementById('commentText').value = '';
                document.getElementById('perspectiveDropdown').value = '';
            }

            // Directly call fetchAndDisplayComments instead of manual fetch
            await fetchAndDisplayComments(postId);

            // Scroll to new comment
            const newCommentElement = document.getElementById(`comment-${newComment.id}`);
            if (newCommentElement) {
                newCommentElement.scrollIntoView({ behavior: 'smooth' });
                newCommentElement.style.backgroundColor = '#ffffd9';
                setTimeout(() => {
                    newCommentElement.style.backgroundColor = '';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
    }
}

function updateCommentsDisplay(comments, container) {
    // Keep track of scroll position
    const scrollPosition = window.scrollY;
    
    // Update only the comments content
    container.innerHTML = '';
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment, currentUserId, postId, perspectiveMap, userPerspectives);
        container.appendChild(commentElement);
    });
    
    // Restore scroll position
    window.scrollTo(0, scrollPosition);
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

    const userHasPerspective = userPerspectives.some(up => up.perspectiveId === comment.perspectiveId);

    const votesElement = document.createElement('div');
    votesElement.className = 'comment-votes';

    const upvoteButton = document.createElement('button');
    upvoteButton.className = `vote-button ${comment.userHasUpvoted ? 'upvoted' : ''}`;
    upvoteButton.innerHTML = '▲';
    upvoteButton.disabled = !userHasPerspective;
    upvoteButton.onclick = async () => {
        if (userHasPerspective) {
            const result = await upvoteComment(comment.id);
            if (result.success) {
                updateCommentVotes(comment, result, votesElement);
            }
        }
    };

    const voteCounts = document.createElement('div');
    voteCounts.className = 'vote-counts';
    voteCounts.innerHTML = `
        <span class="upvotes">${comment.upvotes}</span>
        <span class="downvotes">${comment.downvotes}</span>
    `;

    const downvoteButton = document.createElement('button');
    downvoteButton.className = `vote-button ${comment.userHasDownvoted ? 'downvoted' : ''}`;
    downvoteButton.innerHTML = '▼';
    downvoteButton.disabled = !userHasPerspective;
    downvoteButton.onclick = async () => {
        if (userHasPerspective) {
            const result = await downvoteComment(comment.id);
            if (result.success) {
                updateCommentVotes(comment, result, votesElement);
            }
        }
    };

    votesElement.appendChild(upvoteButton);
    votesElement.appendChild(voteCounts);
    votesElement.appendChild(downvoteButton);

    const contentElement = document.createElement('div');
    contentElement.className = 'comment-content';

    const headerElement = document.createElement('div');
    headerElement.className = 'comment-header';
    headerElement.textContent = perspectiveMap.get(comment.perspectiveId.toString()) || 'Unknown Perspective';

    const textElement = document.createElement('div');
    textElement.className = 'comment-text';
    textElement.textContent = comment.text;

    const actionsElement = document.createElement('div');
    actionsElement.className = 'comment-actions';
    
    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.onclick = () => showReplyForm(comment, currentUserId, postId, perspectiveMap, userPerspectives, depth + 1);
    
    actionsElement.appendChild(replyButton);

    contentElement.appendChild(headerElement);
    contentElement.appendChild(textElement);
    contentElement.appendChild(actionsElement);

    commentElement.appendChild(votesElement);
    commentElement.appendChild(contentElement);

    if (comment.replies?.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'comment-replies';
        comment.replies.forEach(reply => {
            repliesContainer.appendChild(
                createCommentElement(reply, currentUserId, postId, perspectiveMap, userPerspectives, depth + 1)
            );
        });
        contentElement.appendChild(repliesContainer);
    }

    return commentElement;
}

function updateCommentVotes(comment, result, votesElement) {
    comment.upvotes = result.upvotes;
    comment.downvotes = result.downvotes;
    comment.userHasUpvoted = result.userHasUpvoted;
    comment.userHasDownvoted = result.userHasDownvoted;

    const upvoteButton = votesElement.querySelector('.vote-button:first-child');
    const downvoteButton = votesElement.querySelector('.vote-button:last-child');
    const voteCounts = votesElement.querySelector('.vote-counts');

    upvoteButton.className = `vote-button ${comment.userHasUpvoted ? 'upvoted' : ''}`;
    downvoteButton.className = `vote-button ${comment.userHasDownvoted ? 'downvoted' : ''}`;
    
    voteCounts.innerHTML = `
        <span class="upvotes">${comment.upvotes}</span>
        <span class="downvotes">${comment.downvotes}</span>
    `;
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

    // Important: Prevent default form behavior
    replyForm.setAttribute('onsubmit', 'return false;');

    const textarea = document.createElement('textarea');
    textarea.required = true;
    textarea.style.resize = 'none';
    textarea.placeholder = 'What are your thoughts?';
    replyForm.appendChild(textarea);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'reply-form-buttons';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Reply';
    submitButton.type = 'button'; // Changed from 'submit' to 'button'
    submitButton.className = 'submit-reply-button';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.type = 'button';
    cancelButton.className = 'cancel-reply-button';
    cancelButton.onclick = () => replyForm.remove();

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);
    replyForm.appendChild(buttonContainer);

    // Handle click instead of form submit
    submitButton.onclick = async () => {
        const replyText = textarea.value.trim();
        if (!replyText) return;

        try {
            const user = await getCurrentUser();
            const response = await fetch('/comments/submit_comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    articleId: postId,
                    commentText: replyText,
                    userId: user.id,
                    perspectiveId: parentComment.perspectiveId,
                    parentID: parentComment.id
                }),
            });

            if (response.ok) {
                const newComment = await response.json();
                replyForm.remove();
                
                // Store current scroll position
                const scrollPosition = window.scrollY;
                
                await fetchAndDisplayComments(postId);
                
                // Restore scroll position then smooth scroll to new comment
                window.scrollTo(0, scrollPosition);
                const newReplyElement = document.getElementById(`comment-${newComment.id}`);
                if (newReplyElement) {
                    newReplyElement.scrollIntoView({ behavior: 'smooth' });
                    newReplyElement.style.backgroundColor = '#ffffd9';
                    setTimeout(() => {
                        newReplyElement.style.backgroundColor = '';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const parentCommentElement = document.getElementById(`comment-${parentComment.id}`);
    if (parentCommentElement) {
        parentCommentElement.insertAdjacentElement('afterend', replyForm);
        textarea.focus();
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