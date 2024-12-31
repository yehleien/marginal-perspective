async function initIdMeAuth() {
  try {
    const response = await fetch('/idme/auth-params');
    const { clientId, redirectUri, scope } = await response.json();
    
    console.log('Initiating ID.me auth with params:', { clientId, redirectUri, scope });
    
    const idmeUrl = `https://groups.id.me/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    console.log('Redirecting to:', idmeUrl);
    window.location.href = idmeUrl;
  } catch (error) {
    console.error('Error initializing ID.me auth:', error);
  }
}

async function checkIdMeStatus() {
  try {
    const response = await fetch('/idme/status');
    const { connected } = await response.json();
    return connected;
  } catch (error) {
    console.error('Error checking ID.me status:', error);
    return false;
  }
} 