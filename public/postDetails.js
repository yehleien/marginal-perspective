document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    if (postId) {
        await fetchAndDisplayPostDetails(postId);
        await fetchAndDisplayComments(postId);
        await fetchAndDisplayPerspectives();
        
        // Add click handlers for voting buttons
        document.getElementById('upvoteButton').addEventListener('click', () => votePost(postId, 'upvote'));
        document.getElementById('downvoteButton').addEventListener('click', () => votePost(postId, 'downvote'));
    }

    document.getElementById('commentForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const commentText = document.getElementById('commentText').value;
        const perspectiveSelect = document.getElementById('perspectiveDropdown');
        const selectedOption = perspectiveSelect.options[perspectiveSelect.selectedIndex];
        const perspectiveId = selectedOption.dataset.perspectiveId;
        const parentID = document.getElementById('parentIDInput').value || null;
        await submitComment(commentText, perspectiveId, parentID, postId);
        fetchAndDisplayComments(postId);
    });

    const user = await getCurrentUser();
    // Get user's perspectives from the perspectives endpoint instead
    const perspectivesResponse = await fetch(`/perspectives/get_perspectives/${user.id}`, { credentials: 'include' });
    const perspectives = await perspectivesResponse.json();
    const perspectiveDropdown = document.getElementById('perspectiveDropdown');
    
    // Clear any existing options
    perspectiveDropdown.innerHTML = '<option value="">Select a perspective...</option>';
    
    // Add perspectives with their values
    perspectives.forEach(perspective => {
        const option = document.createElement('option');
        option.dataset.perspectiveId = perspective.perspectiveId;
        option.value = perspective.perspectiveId;
        option.textContent = `${perspective.perspectiveName}`;
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

async function fetchAndDisplayComments(postId, filterOptions = {}) {
    try {
        const response = await fetch(`/comments/comments/${postId}`, { credentials: 'include' });
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }
        const comments = await response.json();
        const commentsContainer = document.getElementById('commentsContainer');
        commentsContainer.innerHTML = '';

        // Create filter UI if it doesn't exist
        createOrUpdateFilterUI(comments);

        // Apply filters
        let filteredComments = comments;
        
        // Filter by perspective
        if (filterOptions.perspectiveId) {
            filteredComments = filteredComments.filter(c => c.perspectiveId === filterOptions.perspectiveId);
        }

        // Sort comments
        switch(filterOptions.sort) {
            case 'new':
                filteredComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'top':
                filteredComments.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
                break;
            case 'controversial':
                filteredComments.sort((a, b) => (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes));
                break;
            default:
                // Default to new
                filteredComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const user = await getCurrentUser();
        const nestedComments = createNestedComments(filteredComments);

        // Update comment count in filter UI
        updateCommentCounts(comments);

        nestedComments.forEach(comment => {
            const commentElement = createCommentElement(comment, user.id, postId);
            commentsContainer.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function createOrUpdateFilterUI(comments) {
    let filterContainer = document.getElementById('commentFilters');
    if (!filterContainer) {
        filterContainer = document.createElement('div');
        filterContainer.id = 'commentFilters';
        filterContainer.className = 'comment-filters';
        document.getElementById('commentsContainer').insertAdjacentElement('beforebegin', filterContainer);
    }

    // Clear existing filters
    filterContainer.innerHTML = '';

    // Create perspective filters
    const perspectiveFilters = document.createElement('div');
    perspectiveFilters.className = 'perspective-filters';
    
    // Get unique perspectives and their values from comments
    const perspectives = new Map();
    comments.forEach(comment => {
        if (comment.Perspective) {
            const existing = perspectives.get(comment.perspectiveId) || {
                perspective: comment.Perspective,
                values: new Set(),
                count: 0
            };
            existing.values.add(comment.perspectiveValue);
            existing.count++;
            perspectives.set(comment.perspectiveId, existing);
        }
    });

    // Add "All Comments" button
    const allButton = document.createElement('button');
    allButton.className = 'filter-button active';
    allButton.textContent = `All Comments (${comments.length})`;
    allButton.onclick = () => {
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        allButton.classList.add('active');
        hideSubfilters();
        fetchAndDisplayComments(new URLSearchParams(window.location.search).get('postId'));
    };
    perspectiveFilters.appendChild(allButton);

    // Create subfilters container
    const subfiltersContainer = document.createElement('div');
    subfiltersContainer.id = 'subfiltersContainer';
    subfiltersContainer.className = 'subfilters-container';

    // Add perspective filter buttons
    perspectives.forEach(({ perspective, values, count }, perspectiveId) => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.dataset.perspectiveId = perspectiveId;
        button.dataset.perspectiveType = perspective.type;
        button.textContent = `${perspective.perspectiveName} (${count})`;
        button.style.backgroundColor = getColorForPerspective(perspectiveId);
        
        button.onclick = () => {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            showSubfilters(perspective, Array.from(values), comments);
        };
        
        perspectiveFilters.appendChild(button);
    });

    // Create sort options
    const sortOptions = document.createElement('div');
    sortOptions.className = 'sort-options';
    
    const sortSelect = document.createElement('select');
    sortSelect.className = 'sort-select';
    
    const sortTypes = [
        { value: 'new', label: 'Newest' },
        { value: 'top', label: 'Top Voted' },
        { value: 'controversial', label: 'Controversial' }
    ];

    sortTypes.forEach(sort => {
        const option = document.createElement('option');
        option.value = sort.value;
        option.textContent = sort.label;
        sortSelect.appendChild(option);
    });

    sortSelect.onchange = (e) => {
        const activeFilter = document.querySelector('.filter-button.active:not(:first-child)');
        const perspectiveId = activeFilter?.dataset?.perspectiveId;
        const subfilterValue = document.querySelector('.subfilter-button.active')?.dataset?.value;
        
        fetchAndDisplayComments(new URLSearchParams(window.location.search).get('postId'), {
            perspectiveId,
            subfilterValue,
            sort: e.target.value
        });
    };

    const sortLabel = document.createElement('label');
    sortLabel.textContent = 'Sort by: ';
    sortLabel.appendChild(sortSelect);
    sortOptions.appendChild(sortLabel);

    filterContainer.appendChild(perspectiveFilters);
    filterContainer.appendChild(subfiltersContainer);
    filterContainer.appendChild(sortOptions);
}

function getColorForPerspective(perspectiveId) {
    // Generate a consistent pastel color based on perspectiveId
    const hue = (parseInt(perspectiveId) * 137.508) % 360; // Golden angle approximation
    return `hsl(${hue}, 70%, 85%)`;
}

function updateCommentCounts(comments) {
    const perspectives = new Map();
    comments.forEach(comment => {
        if (comment.Perspective) {
            perspectives.set(comment.perspectiveId, (perspectives.get(comment.perspectiveId) || 0) + 1);
        }
    });

    document.querySelectorAll('.filter-button').forEach(button => {
        const perspectiveId = button.dataset.perspectiveId;
        if (perspectiveId) {
            const count = perspectives.get(parseInt(perspectiveId)) || 0;
            button.textContent = `${button.textContent.split('(')[0]}(${count})`;
        }
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

function createCommentElement(comment, currentUserId, postId, depth = 0) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.id = `comment-${comment.id}`;

    // Check if current user's perspective matches the comment's perspective
    const canVote = comment.perspectiveValue !== null;

    const votesElement = document.createElement('div');
    votesElement.className = 'comment-votes';

    const upvoteButton = document.createElement('button');
    upvoteButton.className = `vote-button ${comment.userHasUpvoted ? 'upvoted' : ''}`;
    upvoteButton.innerHTML = '▲';
    upvoteButton.disabled = !canVote;
    upvoteButton.onclick = async () => {
        if (canVote) {
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
    downvoteButton.disabled = !canVote;
    downvoteButton.onclick = async () => {
        if (canVote) {
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
    const perspectiveName = comment.Perspective ? comment.Perspective.perspectiveName : 'Unknown Perspective';
    const perspectiveValue = comment.perspectiveValue || '';
    headerElement.textContent = `${perspectiveName}: ${perspectiveValue}`;

    const textElement = document.createElement('div');
    textElement.className = 'comment-text';
    textElement.textContent = comment.text;

    const actionsElement = document.createElement('div');
    actionsElement.className = 'comment-actions';
    
    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.onclick = () => showReplyForm(comment, currentUserId, postId, depth + 1);
    
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
                createCommentElement(reply, currentUserId, postId, depth + 1)
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

function showReplyForm(parentComment, currentUserId, postId, depth) {
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
    submitButton.type = 'button';
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
        // Fetch post details
        const response = await fetch(`/articles/posts/${postId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch post details');
        }
        const post = await response.json();
        
        // Fetch vote counts
        const voteResponse = await fetch(`/articles/voteCounts/${postId}`);
        if (!voteResponse.ok) {
            throw new Error('Failed to fetch vote counts');
        }
        const voteCounts = await voteResponse.json();
        
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postContent').textContent = post.content;
        
        // Display scope
        const scopeElement = document.getElementById('postScope');
        if (post.scope) {
            scopeElement.textContent = post.scope.charAt(0).toUpperCase() + post.scope.slice(1);
            scopeElement.style.display = 'inline-block';
        } else {
            scopeElement.style.display = 'none';
        }
        
        const urlElement = document.getElementById('postUrl');
        if (post.url) {
            urlElement.href = post.url;
            urlElement.textContent = post.url;
            urlElement.style.display = 'block';
        } else {
            urlElement.style.display = 'none';
        }
        
        // Update vote count with the fetched data
        const voteCount = document.getElementById('voteCount');
        voteCount.textContent = voteCounts.upvotes - voteCounts.downvotes;
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load post details.');
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
        
        const voteCounts = await response.json();
        const voteCount = document.getElementById('voteCount');
        voteCount.textContent = voteCounts.upvotes - voteCounts.downvotes;
        
        updateVoteButtons(voteCounts);
    } catch (error) {
        console.error('Error voting:', error);
    }
}

function updateVoteButtons(voteCounts) {
    const upvoteButton = document.getElementById('upvoteButton');
    const downvoteButton = document.getElementById('downvoteButton');
    const voteCount = document.getElementById('voteCount');
    
    voteCount.textContent = voteCounts.upvotes - voteCounts.downvotes;
}

async function fetchAndDisplayPerspectives() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const response = await fetch(`/perspectives/get_perspectives/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch perspectives');
        
        const perspectives = await response.json();
        const perspectiveDropdown = document.getElementById('perspectiveDropdown');
        
        perspectives.forEach(perspective => {
            const option = document.createElement('option');
            option.value = perspective.perspectiveId;
            option.textContent = perspective.perspectiveName;
            perspectiveDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function showSubfilters(perspective, values, comments) {
    const container = document.getElementById('subfiltersContainer');
    container.innerHTML = '';
    container.style.display = 'flex';

    if (perspective.type === 'demographic' && perspective.perspectiveName.toLowerCase() === 'age') {
        // Create age range slider for demographic perspectives
        const ranges = calculateAgeRanges(values.map(Number));
        ranges.forEach(range => {
            const button = document.createElement('button');
            button.className = 'subfilter-button';
            button.dataset.value = `${range.min}-${range.max}`;
            const count = comments.filter(c => {
                const age = Number(c.perspectiveValue);
                return c.perspectiveId === perspective.perspectiveId && 
                       age >= range.min && age <= range.max;
            }).length;
            button.textContent = `${range.min}-${range.max} years (${count})`;
            
            button.onclick = () => handleSubfilterClick(button, perspective.perspectiveId, range);
            container.appendChild(button);
        });
    } else {
        // Create individual value buttons for other perspectives
        values.sort().forEach(value => {
            const button = document.createElement('button');
            button.className = 'subfilter-button';
            button.dataset.value = value;
            const count = comments.filter(c => 
                c.perspectiveId === perspective.perspectiveId && c.perspectiveValue === value
            ).length;
            button.textContent = `${value} (${count})`;
            
            button.onclick = () => handleSubfilterClick(button, perspective.perspectiveId, value);
            container.appendChild(button);
        });
    }
}

function handleSubfilterClick(button, perspectiveId, value) {
    document.querySelectorAll('.subfilter-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    let filterValue;
    if (typeof value === 'object') { // Age range
        filterValue = (comment) => {
            const age = Number(comment.perspectiveValue);
            return age >= value.min && age <= value.max;
        };
    } else {
        filterValue = value;
    }
    
    fetchAndDisplayComments(new URLSearchParams(window.location.search).get('postId'), {
        perspectiveId,
        subfilterValue: filterValue,
        sort: document.querySelector('.sort-select').value
    });
}

function hideSubfilters() {
    const container = document.getElementById('subfiltersContainer');
    container.style.display = 'none';
    container.innerHTML = '';
}

function calculateAgeRanges(ages) {
    const min = Math.min(...ages);
    const max = Math.max(...ages);
    const rangeSize = 10; // 10-year ranges
    const ranges = [];
    
    let start = Math.floor(min / rangeSize) * rangeSize;
    let end = Math.ceil(max / rangeSize) * rangeSize;
    
    for (let i = start; i < end; i += rangeSize) {
        ranges.push({
            min: i,
            max: i + rangeSize - 1
        });
    }
    
    return ranges;
}