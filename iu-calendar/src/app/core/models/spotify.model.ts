// Spotify API Response Models

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // 秒數，通常是 3600
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  type: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  album_group: 'album' | 'single' | 'compilation' | 'appears_on';
  total_tracks: number;
  release_date: string; // YYYY-MM-DD or YYYY-MM or YYYY
  release_date_precision: 'year' | 'month' | 'day';
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  external_urls: {
    spotify: string;
  };
  uri: string;
  available_markets: string[];
}

export interface SpotifyArtistAlbumsResponse {
  href: string;
  items: SpotifyAlbum[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  uri: string;
  artists: SpotifyArtist[];
}

export interface SpotifyAlbumTracksResponse {
  href: string;
  items: SpotifyTrack[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

// 轉換為應用程式使用的格式
export interface AlbumRelease {
  id: string;
  name: string;
  type: 'album' | 'single' | 'compilation';
  releaseDate: Date;
  releaseDatePrecision: 'year' | 'month' | 'day';
  imageUrl: string | null;
  spotifyUrl: string;
  totalTracks: number;
  artists: string[];
}
