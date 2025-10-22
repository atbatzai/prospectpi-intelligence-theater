module.exports = {
  apps: [
    {
      name: "prospectpi-api",
      script: "ts-node",
      args: "-r tsconfig-paths/register src/server.ts",
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: ["src"],
      ignore_watch: ["node_modules", "dist", "logs", "frontend", "tests"],
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3001
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_file: "./logs/api-combined.log",
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s"
    },
    {
      name: "prospectpi-frontend",
      script: "npm",
      args: "run dev",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 3000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
      time: true,
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: "20s"
    }
  ]
};
