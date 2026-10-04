export type Quality = 'LOSSLESS' | 'HIGH' | 'LOW';

export interface QobuzTrack {
  upstreamId: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  artworkURL?: string;
  format?: string;
  audioQuality?: string;
  audioModes?: string[];
  atmos?: boolean;
}

export interface QobuzStream {
  url: string;
  format?: string;
  quality?: string;
  codec?: string;
  container?: string;
  manifest?: 'none' | 'hls' | 'dash';
  encrypted?: boolean;
  sampleRate?: number;
  bitDepth?: number;
  bitrate?: number;
  audioMode?: string;
}

export interface QobuzProvider {
  search(query: string, quality: Quality, atmos: string): Promise<QobuzTrack[]>;
  getStream(trackId: string, quality: Quality, atmos: string): Promise<QobuzStream | null>;
}

export interface PublicTrack extends Omit<QobuzTrack, 'upstreamId'> {
  id: string;
}
