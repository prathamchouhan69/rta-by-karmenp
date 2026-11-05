import { loadConfig } from './config.js';
import { createFlux } from './app.js';
import { createServer } from './http/server.js';
import { buildRoutes } from './http/routes.js';

const config = loadConfig();
const flux = createFlux({ config });
const { routes, authenticate } = buildRoutes(flux);
const server = createServer({ routes, authenticate, limiter: flux.limiter, allowedOrigins: config.allowedOrigins, log: (m) => console.error(m) });
server.listen(config.port, () => {
  console.log(`Flux backend listening on port ${config.port}`);
  flux.startBriefing();
  if (flux.users.count() === 0) console.log('No users yet. Create the owner: npm run user:add');
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flux.stop(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); });
