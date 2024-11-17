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
    spotifyApi.setAccessToken(accessToken);
    
    // Get all time data
    const topArtists = await spotifyApi.getMyTopArtists({ 
      limit: 50, 
      time_range: 'long_term'  // This gets "all time" data
    });

    // Get recently played to calculate minutes
    const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
    
    // Calculate average listening time per track
    const avgMinutesPerTrack = recentlyPlayed.body.items.reduce((acc, item) => {
      return acc + (item.track.duration_ms / 60000); // Convert ms to minutes
    }, 0) / recentlyPlayed.body.items.length;

    // Get user's total "scrobbles" (play count)
    const playHistory = await spotifyApi.getMe();
    const totalScrobbles = playHistory.body.followers.total; // This is an approximation

    // Estimate total minutes per artist
    const artistPerspectives = topArtists.body.items.map(artist => {
      const estimatedMinutes = (totalScrobbles / topArtists.body.items.length) * avgMinutesPerTrack;
      return {
        name: artist.name,
        minutes: estimatedMinutes,
        genres: artist.genres
      };
    });

    // Filter for artists with >10000 minutes
    const dedicatedArtists = artistPerspectives.filter(artist => artist.minutes > 10000);

    // Create perspectives for these artists
    const perspectives = dedicatedArtists.map(artist => ({
      perspectiveName: `${artist.name} Super Fan`,
      type: 'spotify',
      userId,
      options: {
        minutes: Math.floor(artist.minutes),
        genres: artist.genres
      }
    }));

    // Save to database
    for (const perspectiveData of perspectives) {
      const [perspective, created] = await Perspective.findOrCreate({
        where: { 
          userId,
          perspectiveName: perspectiveData.perspectiveName 
        },
        defaults: perspectiveData
      });

      if (!created) {
        await perspective.update(perspectiveData);
      }

      await UserPerspective.findOrCreate({
        where: { 
          userId, 
          perspectiveId: perspective.perspectiveId 
        }
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