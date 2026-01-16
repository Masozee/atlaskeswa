// PM2 Ecosystem Configuration for Atlas Keswa
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'atlas-keswa',
      script: 'server.js',
      cwd: '/var/www/atlaskeswa',  // Change this to your deployment path
      instances: 'max',             // Use all available CPU cores
      exec_mode: 'cluster',         // Enable cluster mode for load balancing
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'https://api.atlaskeswa.id'
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      // Watch settings (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
    }
  ]
};
