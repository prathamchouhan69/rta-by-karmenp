module.exports = {
  apps: [
    {
      name: 'rta-flux',
      cwd: './apps/flux',
      script: 'node',
      args: '--env-file=.env src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 8788
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/rta-flux-error.log',
      out_file: './logs/rta-flux-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'rta-gateway',
      cwd: './apps/gateway',
      script: 'node',
      args: '--env-file-if-exists=../../.env src/server.mjs',
      env: {
        NODE_ENV: 'development',
        PORT: 8787,
        APP_ORIGIN: 'http://localhost:3000'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/rta-gateway-error.log',
      out_file: './logs/rta-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'rta-web',
      cwd: './apps/web',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/rta-web-error.log',
      out_file: './logs/rta-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};