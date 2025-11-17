export const environment = {
  production: false,
  spotify: {
    // API 請求現在通過後端代理服務，不再需要 Client Secret
    proxyBaseUrl: 'http://localhost:3000/api/spotify',
    artistId: '3HqSLMAZ3g3d5poNaI7GOU' // IU's Spotify Artist ID
  }
};
