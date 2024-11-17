document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/perspectives/insights', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch insights');
        const insights = await response.json();
        
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = insights.map(p => `
            <div class="perspective-card">
                <div class="perspective-name">${p.perspectiveName}</div>
                <div class="stat-item">
                    <span>Users:</span>
                    <span>${p.userCount || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Comments:</span>
                    <span>${p.commentCount || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Total Votes:</span>
                    <span>${p.totalVotes || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Type:</span>
                    <span>${p.type}</span>
                </div>
                <div class="stat-item">
                    <span>Created:</span>
                    <span>${new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('statsGrid').innerHTML = `
            <div class="error-message">Failed to load insights: ${error.message}</div>
        `;
    }
}); 