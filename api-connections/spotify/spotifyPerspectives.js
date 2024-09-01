require('dotenv').config({ path: '../../spotify.env' });

const SpotifyWebApi = require('spotify-web-api-node');
const { Perspective, UserPerspective } = require('../../models');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

async function generateSpotifyPerspectives(userId, accessToken) {
  try {
    const topArtists = await spotifyApi.getMyTopArtists({ limit: 50, time_range: 'long_term' });
    const topTracks = await spotifyApi.getMyTopTracks({ limit: 50, time_range: 'long_term' });
    const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });

    const perspectives = [];

    // Generate artist-based perspectives
    topArtists.body.items.forEach(artist => {
      perspectives.push(`${artist.name} Fan`);
    });

    // Generate genre-based perspectives
    const genres = topArtists.body.items.flatMap(artist => artist.genres);
    const topGenres = [...new Set(genres)].slice(0, 10);
    topGenres.forEach(genre => {
      perspectives.push(`${genre.charAt(0).toUpperCase() + genre.slice(1)} Enthusiast`);
    });

    // Generate decade-based perspectives
    const decades = topTracks.body.items.map(track => Math.floor(track.album.release_date.slice(0, 4) / 10) * 10);
    const topDecades = [...new Set(decades)];
    topDecades.forEach(decade => {
      perspectives.push(`${decade}s Music Fan`);
    });

    // Generate mood-based perspectives
    const recentMoods = await analyzeTrackMoods(recentlyPlayed.body.items.map(item => item.track.id));
    const topMoods = getTopMoods(recentMoods);
    topMoods.forEach(mood => {
      perspectives.push(`${mood} Music Listener`);
    });

    const perspectiveData = {
      userId,
      perspectiveName: 'Brain Waves Therapy Fan',
      type: 'Custom', // Changed from 'spotify' to 'Custom'
      options: {
        // ... your options ...
      }
    };

    const [perspective, created] = await Perspective.findOrCreate({
      where: { userId, perspectiveName: perspectiveData.perspectiveName },
      defaults: perspectiveData
    });

    if (!created) {
      await perspective.update(perspectiveData);
    }

    // Save perspectives to database
    for (const perspectiveName of perspectives) {
      let perspective = await Perspective.findOne({ 
        where: { perspectiveName, type: 'spotify' }
      });
      if (!perspective) {
        perspective = await Perspective.create({ 
          perspectiveName, 
          type: 'spotify',
          userId // Associate with user
        });
      }
      await UserPerspective.findOrCreate({
        where: { userId, perspectiveId: perspective.id }
      });
    }

    return perspectives;
  } catch (error) {
    console.error('Error generating Spotify perspectives:', error);
    throw error;
  }
}

async function analyzeTrackMoods(trackIds) {
  const audioFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);
  return audioFeatures.body.audio_features.map(feature => {
    if (feature.valence > 0.6 && feature.energy > 0.6) return 'Happy';
    if (feature.valence < 0.4 && feature.energy < 0.4) return 'Melancholic';
    if (feature.danceability > 0.7) return 'Danceable';
    if (feature.acousticness > 0.7) return 'Acoustic';
    return 'Neutral';
  });
}

function getTopMoods(moods) {
  const moodCounts = moods.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood);
}

module.exports = { generateSpotifyPerspectives };