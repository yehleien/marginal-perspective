let currentIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    setupScopeFilters();
    fetchAndDisplayPosts();
});

function setupScopeFilters() {
    const validScopes = ['All', 'News', 'Politics', 'Healthcare', 'Sports', 'Technology', 'Entertainment', 'Business', 'Science'];
    const filtersContainer = document.getElementById('trendingNametagsBody');
    filtersContainer.innerHTML = '';

    validScopes.forEach(scope => {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'scope-filter-button' + (scope === 'All' ? ' active' : '');
        button.textContent = scope;
        button.onclick = () => {
            document.querySelectorAll('.scope-filter-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentIndex = 0;
            fetchAndDisplayPosts(scope.toLowerCase());
        };
        cell.appendChild(button);
        row.appendChild(cell);
        filtersContainer.appendChild(row);
    });
}

function fetchAndDisplayPosts(scope = 'all') {
    const url = scope === 'all' 
        ? `/articles/get_latest?index=${currentIndex}` 
        : `/articles/get_latest?index=${currentIndex}&scope=${scope}`;

    fetch(url)
        .then(response => response.json())
        .then(articles => {
            if (articles.length === 0) {
                alert('No more posts to load.');
                return;
            }
            const mainContainer = document.getElementById('mainContainer');
            mainContainer.innerHTML = '';
            articles.forEach(article => {
                const postElement = createPostElement(article);
                mainContainer.appendChild(postElement);
            });
            currentIndex += articles.length;
        })
        .catch(error => console.error('Error fetching posts:', error));
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');

    const voteContainer = createVoteButtons(post.id);
    voteContainer.classList.add('vote-container');
    postElement.appendChild(voteContainer);

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');

    // Post metadata line
    const metaContainer = document.createElement('div');
    metaContainer.classList.add('post-meta');
    
    if (post.scope) {
        const scope = document.createElement('span');
        scope.classList.add('post-scope');
        scope.textContent = post.scope.charAt(0).toUpperCase() + post.scope.slice(1);
        metaContainer.appendChild(scope);
    }

    const postInfo = document.createElement('span');
    postInfo.classList.add('post-info');
    const date = new Date(post.submitDate).toLocaleDateString();
    postInfo.textContent = `Posted ${date}`;
    metaContainer.appendChild(postInfo);

    // Add source info if URL exists
    if (post.url) {
        const sourceContainer = document.createElement('div');
        sourceContainer.classList.add('source-info');
        
        try {
            const url = new URL(post.url);
            const domain = url.hostname.replace('www.', '');
            
            const favicon = document.createElement('img');
            favicon.className = 'source-favicon';
            favicon.src = `https://www.google.com/s2/favicons?domain=${domain}`;
            favicon.alt = domain;
            sourceContainer.appendChild(favicon);

            const sourceText = document.createElement('span');
            sourceText.className = 'source-domain';
            sourceText.textContent = domain;
            sourceContainer.appendChild(sourceText);

            // Add media bias info
            fetch(`/articles/media_bias/${domain}`)
                .then(response => response.json())
                .then(biasInfo => {
                    if (biasInfo.bias !== 'Unknown') {
                        const biasContainer = document.createElement('div');
                        biasContainer.className = 'bias-info';
                        
                        const biasIndicator = document.createElement('span');
                        biasIndicator.className = `bias-indicator bias-${biasInfo.bias.toLowerCase().replace(/\s+/g, '-')}`;
                        biasIndicator.title = `Bias: ${biasInfo.bias}, Fact Rating: ${biasInfo.factRating}`;
                        biasIndicator.textContent = '•';
                        biasContainer.appendChild(biasIndicator);

                        sourceContainer.appendChild(biasContainer);
                    }
                })
                .catch(error => console.error('Error fetching bias info:', error));

            metaContainer.appendChild(sourceContainer);
        } catch (e) {
            console.error('Invalid URL:', post.url);
        }
    }

    contentContainer.appendChild(metaContainer);

    // Title
    const title = document.createElement('h3');
    title.classList.add('post-title');
    title.textContent = post.title;
    contentContainer.appendChild(title);

    // Content preview
    if (post.content) {
        const content = document.createElement('p');
        content.classList.add('post-content-preview');
        content.textContent = post.content;
        contentContainer.appendChild(content);
    }

    // Bottom metadata (comments count)
    const bottomMeta = document.createElement('div');
    bottomMeta.classList.add('post-bottom-meta');

    // Create container for comment count and perspectives
    const commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-info');

    // Fetch and add comment count
    fetch(`/comments/commentCount/${post.id}`)
        .then(response => response.json())
        .then(data => {
            const commentCount = document.createElement('span');
            commentCount.classList.add('comment-count');
            commentCount.textContent = `${data.commentCount} comments`;
            commentContainer.appendChild(commentCount);
        })
        .catch(error => console.error('Error fetching comment count:', error));

    // Fetch and add top perspectives
    fetch(`/articles/top_perspectives/${post.id}`)
        .then(response => response.json())
        .then(perspectives => {
            if (perspectives.length > 0) {
                const perspectivesContainer = document.createElement('div');
                perspectivesContainer.classList.add('top-perspectives');
                
                perspectives.forEach(p => {
                    const badge = document.createElement('span');
                    badge.classList.add('perspective-badge');
                    badge.textContent = `${p.perspectiveName} (${p.count})`;
                    perspectivesContainer.appendChild(badge);
                });
                
                commentContainer.appendChild(perspectivesContainer);
            }
        })
        .catch(error => console.error('Error fetching perspectives:', error));

    bottomMeta.appendChild(commentContainer);
    contentContainer.appendChild(bottomMeta);
    postElement.appendChild(contentContainer);

    postElement.addEventListener('click', () => {
        window.location.href = `/postDetails.html?postId=${post.id}`;
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

