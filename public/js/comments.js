function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    
    const perspectiveSpan = document.createElement('span');
    perspectiveSpan.className = 'perspective-badge';
    // Now includes the value in the display
    perspectiveSpan.textContent = `${comment.perspective.perspectiveName}: ${comment.perspective.value}`;
    
    const contentP = document.createElement('p');
    contentP.textContent = comment.content;
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'comment-meta';
    metaDiv.textContent = `Posted ${new Date(comment.createdAt).toLocaleDateString()}`;
    
    if (comment.perspective.verificationStatus === 'verified') {
        const verifiedBadge = document.createElement('span');
        verifiedBadge.className = 'verified-badge';
        verifiedBadge.textContent = '✓ Verified';
        perspectiveSpan.appendChild(verifiedBadge);
    }
    
    commentDiv.appendChild(perspectiveSpan);
    commentDiv.appendChild(contentP);
    commentDiv.appendChild(metaDiv);
    
    return commentDiv;
} 