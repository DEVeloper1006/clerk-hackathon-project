import Fastify from 'fastify';
import { env } from './config/env.js';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ success: true, data: { status: 'ok' } }));

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
