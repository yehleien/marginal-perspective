document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/perspectives/insights', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch insights');
        const insights = await response.json();
        
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = insights.map(p => `
            <div class="perspective-card" data-perspective-id="${p.perspectiveId}">
                <div class="perspective-name">${p.perspectiveName}</div>
                <div class="stat-item">
                    <span>Users:</span>
                    <span>${p.userCount || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Comments:</span>
                    <span>${p.commentCount || 0}</span>
                </div>
                <div class="vote-stats">
                    <div class="vote-item upvotes">
                        <div class="vote-label">Upvotes</div>
                        <div class="vote-value">+${p.upvotes || 0}</div>
                    </div>
                    <div class="vote-item downvotes">
                        <div class="vote-label">Downvotes</div>
                        <div class="vote-value">-${p.downvotes || 0}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers for perspective cards
        document.querySelectorAll('.perspective-card').forEach(card => {
            card.addEventListener('click', async () => {
                const perspectiveId = card.dataset.perspectiveId;
                await loadPerspectiveDetails(perspectiveId);
            });
        });

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('statsGrid').innerHTML = `
            <div class="error-message">Failed to load insights: ${error.message}</div>
        `;
    }
});

async function loadPerspectiveDetails(perspectiveId) {
    const detailsPanel = document.getElementById('detailsPanel');
    detailsPanel.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading perspective details...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/perspectives/details/${perspectiveId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch perspective details');
        const perspective = await response.json();

        // Update selected state of cards
        document.querySelectorAll('.perspective-card').forEach(card => {
            card.classList.toggle('selected', 
                card.dataset.perspectiveId === perspectiveId);
        });

        detailsPanel.innerHTML = `
            <div class="perspective-details-content">
                <h3>
                    ${perspective.perspectiveName}
                    ${perspective.verificationStatus === 'verified' ? 
                        '<span class="verified-badge">✓ Verified</span>' : ''}
                </h3>
                
                <div class="verification-info">
                    <div class="detail-item">
                        <span class="detail-label">Verification Status</span>
                        <span class="detail-value ${getVerificationStatusClass(perspective.verificationStatus)}">
                            ${(perspective.verificationStatus || 'pending').charAt(0).toUpperCase() + 
                              (perspective.verificationStatus || 'pending').slice(1)}
                        </span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Verification Method</span>
                        <span class="detail-value">
                            ${getVerificationMethodLabel(perspective.verificationMethod || 'unverified')}
                        </span>
                    </div>

                    ${perspective.verificationDate ? `
                        <div class="detail-item">
                            <span class="detail-label">Last Verified</span>
                            <span class="detail-value">
                                ${new Date(perspective.verificationDate).toLocaleDateString()}
                            </span>
                        </div>
                    ` : ''}

                    <div class="detail-item">
                        <span class="detail-label">Activity Score</span>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${
                                Math.min((perspective.activityScore || 0) * 10, 100)}%">
                            </div>
                            <span class="score-text">${
                                (perspective.activityScore || 0).toFixed(1)}</span>
                        </div>
                    </div>

                    ${perspective.expertiseYears ? `
                        <div class="detail-item">
                            <span class="detail-label">Years of Expertise</span>
                            <span class="detail-value">${perspective.expertiseYears} years</span>
                        </div>
                    ` : ''}

                    ${perspective.organization ? `
                        <div class="detail-item">
                            <span class="detail-label">Organization</span>
                            <span class="detail-value">${perspective.organization}</span>
                        </div>
                    ` : ''}

                    <div class="detail-item">
                        <span class="detail-label">Community Stats</span>
                        <div class="stats-grid">
                            <div>
                                <span class="stat-label">Users</span>
                                <span class="stat-value">${perspective.userCount || 0}</span>
                            </div>
                            <div>
                                <span class="stat-label">Comments</span>
                                <span class="stat-value">${perspective.commentCount || 0}</span>
                            </div>
                            <div>
                                <span class="stat-label">Avg. Upvotes</span>
                                <span class="stat-value">${
                                    typeof perspective.avgUpvotes === 'number' ? 
                                    perspective.avgUpvotes.toFixed(1) : 
                                    '0.0'
                                }</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        detailsPanel.innerHTML = `
            <div class="error-message">
                Failed to load perspective details: ${error.message}
            </div>
        `;
    }
}

function getVerificationMethodLabel(method) {
    const labels = {
        document: 'Document Verification',
        professional_network: 'Professional Network',
        organization: 'Organization Affiliation',
        education: 'Educational Background',
        unverified: 'Not Yet Verified'
    };
    return labels[method] || method;
}

function getVerificationStatusClass(status) {
    const classes = {
        verified: 'verified',
        pending: 'pending',
        rejected: 'rejected'
    };
    return classes[status] || '';
} 