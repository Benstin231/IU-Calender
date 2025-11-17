require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Token cache
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

// Validate environment variables
function validateConfig() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('ERROR: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env file');
    process.exit(1);
  }
}

// Get Spotify access token using Client Credentials Flow
async function getSpotifyToken() {
  // Check if cached token is still valid (with 5 minute buffer)
  if (tokenCache.accessToken && tokenCache.expiresAt) {
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (now < tokenCache.expiresAt - bufferTime) {
      return tokenCache.accessToken;
    }
  }

  // Request new token
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    // Cache the token
    tokenCache.accessToken = response.data.access_token;
    tokenCache.expiresAt = Date.now() + (response.data.expires_in * 1000);

    console.log('New Spotify token obtained, expires in:', response.data.expires_in, 'seconds');
    return tokenCache.accessToken;
  } catch (error) {
    console.error('Failed to get Spotify token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get IU's albums
app.get('/api/spotify/artists/:artistId/albums', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const { artistId } = req.params;
    const { include_groups, market, limit, offset } = req.query;

    const params = new URLSearchParams();
    if (include_groups) params.append('include_groups', include_groups);
    if (market) params.append('market', market);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/albums?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching albums:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch albums from Spotify',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
validateConfig();
app.listen(PORT, () => {
  console.log(`Spotify Proxy Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/spotify/artists/:artistId/albums`);
});
