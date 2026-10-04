import type { Config } from '../config.js';
import type { QobuzProvider } from '../types.js';
import { StubQobuzProvider } from './stub.js';
import { HttpQobuzProvider } from './http.js';
import { QobuzDlProvider } from './qobuzdl.js';

export function createProvider(config: Config): QobuzProvider {
  if (config.provider === 'qobuzdl') return new QobuzDlProvider(config);
  if (config.provider === 'http') return new HttpQobuzProvider(config);
  return new StubQobuzProvider();
}
