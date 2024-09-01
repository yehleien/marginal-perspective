const express = require('express');
const router = express.Router();
const { generateSpotifyPerspectives } = require('./spotifyPerspectives');

router.post('/generate-perspectives', async (req, res) => {
  try {
    const { userId, accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'No access token provided' });
    }
    const perspectives = await generateSpotifyPerspectives(userId, accessToken);
    res.json({ success: true, perspectives });
  } catch (error) {
    console.error('Error generating Spotify perspectives:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/auth-params', (req, res) => {
  console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
  console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
  res.json({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    scope: 'user-read-private user-read-email user-top-read user-read-recently-played'
  });
});

router.get('/callback', (req, res) => {
  res.send(`
    <script>
      if (window.opener) {
        window.opener.spotifyCallback(window.location.hash);
      }
      window.close();
    </script>
  `);
});

module.exports = router;