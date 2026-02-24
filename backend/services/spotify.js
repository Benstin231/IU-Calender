const axios = require('axios');

// IU's Spotify Artist ID
const IU_ARTIST_ID = '3HqSLMAZ3g3d5poNaI7GOU';

// Token cache
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

/**
 * 取得 Spotify Access Token (Client Credentials Flow)
 */
async function getToken() {
  // Check cache
  if (tokenCache.accessToken && tokenCache.expiresAt) {
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    if (Date.now() < tokenCache.expiresAt - bufferTime) {
      return tokenCache.accessToken;
    }
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

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

  tokenCache.accessToken = response.data.access_token;
  tokenCache.expiresAt = Date.now() + (response.data.expires_in * 1000);

  return tokenCache.accessToken;
}

/**
 * 從 Spotify API 獲取 IU 所有專輯
 */
async function fetchAlbums() {
  const token = await getToken();
  const albums = [];
  let offset = 0;
  const limit = 50;

  // Paginate through all albums
  while (true) {
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${IU_ARTIST_ID}/albums`,
      {
        params: {
          include_groups: 'album,single,compilation',
          market: 'TW',
          limit,
          offset
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    albums.push(...response.data.items);

    if (!response.data.next) break;
    offset += limit;
  }

  return albums;
}

/**
 * 同步 Spotify 專輯資料到資料庫
 */
async function syncAlbums(prisma) {
  console.log('[Spotify] Fetching albums from Spotify API...');

  const albums = await fetchAlbums();
  console.log(`[Spotify] Found ${albums.length} albums`);

  let syncedCount = 0;
  let errors = [];

  for (const album of albums) {
    try {
      // 轉換為統一的事件格式
      const releaseDate = new Date(album.release_date);
      const eventData = {
        title: album.name,
        description: `${album.album_type} - ${album.total_tracks} tracks`,
        date: album.release_date,
        year: releaseDate.getFullYear(),
        month: releaseDate.getMonth() + 1,
        day: releaseDate.getDate(),
        type: mapAlbumType(album.album_type),
        source: 'spotify',
        sourceId: album.id,
        sourceUrl: album.external_urls.spotify,
        imageUrl: album.images[0]?.url || null,
        metadata: {
          albumType: album.album_type,
          totalTracks: album.total_tracks,
          artists: album.artists.map(a => a.name),
          uri: album.uri
        }
      };

      // Upsert - 存在則更新，不存在則建立
      await prisma.event.upsert({
        where: {
          source_sourceId: {
            source: 'spotify',
            sourceId: album.id
          }
        },
        update: {
          title: eventData.title,
          description: eventData.description,
          imageUrl: eventData.imageUrl,
          metadata: eventData.metadata
        },
        create: eventData
      });

      syncedCount++;
    } catch (error) {
      errors.push({ album: album.name, error: error.message });
      console.error(`[Spotify] Error syncing ${album.name}:`, error.message);
    }
  }

  // 記錄同步結果
  await prisma.syncLog.create({
    data: {
      source: 'spotify',
      status: errors.length === 0 ? 'success' : 'partial',
      error: errors.length > 0 ? `${errors.length} errors occurred` : null,
      itemsProcessed: syncedCount
    }
  });

  console.log(`[Spotify] Sync completed: ${syncedCount}/${albums.length} albums`);

  return {
    count: syncedCount,
    total: albums.length,
    errors
  };
}

/**
 * 將 Spotify album_type 對應到事件類型
 */
function mapAlbumType(albumType) {
  switch (albumType) {
    case 'album':
      return 'album';
    case 'single':
      return 'single';
    case 'compilation':
      return 'compilation';
    default:
      return 'album';
  }
}

module.exports = {
  syncAlbums,
  fetchAlbums,
  getToken
};
