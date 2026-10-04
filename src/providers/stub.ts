import type { QobuzProvider, QobuzStream, QobuzTrack, Quality } from '../types.js';

/** No public, documented Qobuz API was verified for qobuz.vercel.app. */
export class StubQobuzProvider implements QobuzProvider {
  async search(_query: string, _quality: Quality, _atmos: string): Promise<QobuzTrack[]> { return []; }
  async getStream(_trackId: string, _quality: Quality, _atmos: string): Promise<QobuzStream | null> { return null; }
}
