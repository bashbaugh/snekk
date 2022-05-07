module.exports = {
  apps: [
    {
      name: 'snekk-server',
      script: 'yarn server:start',
      watch: false,
      force: true,
      env: {
        PORT: 3001,
        NODE_ENV: 'production',
      },
    },
  ],
}
