module.exports = {
  apps: [
    {
      name: 'jthub-api',
      script: './backend/dist/app.js',
      cwd: '/var/www/jthub',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/jthub/error.log',
      out_file: '/var/log/jthub/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
