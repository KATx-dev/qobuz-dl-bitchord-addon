import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../src/server.js';

let ready: Promise<void> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  ready ??= app.ready();
  await ready;
  app.server.emit('request', req, res);
}
