import type { QobuzProvider, QobuzStream, QobuzTrack, Quality } from '../types.js';

/** Fallback provider for contract-only local testing. */
export class StubQobuzProvider implements QobuzProvider {
  async search(_query: string, _quality: Quality, _atmos: string): Promise<QobuzTrack[]> { return []; }
  async getStream(_trackId: string, _quality: Quality, _atmos: string): Promise<QobuzStream | null> { return null; }
}
