document.addEventListener('DOMContentLoaded', async () => {
    // Fetch the docs structure from the server
    const response = await fetch('/api/docs/structure');
    const docsStructure = await response.json();
    
    // Populate the sidebar menu
    const docsMenu = document.getElementById('docsMenu');
    docsStructure.forEach(doc => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${doc.slug}`;
        a.textContent = doc.title;
        a.onclick = async (e) => {
            e.preventDefault();
            // Remove active class from all links
            document.querySelectorAll('.docs-nav a').forEach(link => link.classList.remove('active'));
            // Add active class to clicked link
            a.classList.add('active');
            // Load the content
            await loadDocContent(doc.slug);
        };
        li.appendChild(a);
        docsMenu.appendChild(li);
    });

    // Load initial content if hash exists
    const initialSlug = window.location.hash.slice(1) || docsStructure[0]?.slug;
    if (initialSlug) {
        await loadDocContent(initialSlug);
        document.querySelector(`a[href="#${initialSlug}"]`)?.classList.add('active');
    }
});

async function loadDocContent(slug) {
    const contentDiv = document.getElementById('docsContent');
    try {
        const response = await fetch(`/api/docs/content/${slug}`);
        const html = await response.text();
        contentDiv.innerHTML = `<div class="markdown-content">${html}</div>`;
    } catch (error) {
        console.error('Error loading doc content:', error);
        contentDiv.innerHTML = '<p>Error loading content</p>';
    }
} 