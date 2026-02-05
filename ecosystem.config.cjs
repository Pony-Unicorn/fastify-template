module.exports = {
  apps: [
    {
      name: 'fastify-template',
      script: 'npm',
      args: 'run start',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: '/dev/null',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Graceful shutdown
      kill_timeout: 5000
    }
  ]
}
