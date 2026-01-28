module.exports = {
  apps: [
    {
      name: "prospectpi-api",
      script: "npx",
      args: "ts-node -r tsconfig-paths/register src/server.ts",
      interpreter: "none",
      cwd: ".",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,  // Disabled watch to prevent restart loops
      max_memory_restart: "1G",
      kill_timeout: 15000,
      listen_timeout: 30000,
      shutdown_with_message: true,
      merge_logs: false,
      env: {
        NODE_ENV: "development",
        PORT: 3001,
        TS_NODE_TRANSPILE_ONLY: "true",
        DB_CONNECTION_POOL_SIZE: "20",
        DB_CONNECTION_TIMEOUT: "30000",
        DB_IDLE_TIMEOUT: "900000",
        PERSISTENCE_ENABLED: "true",
        SESSION_STORE: "memory",
        WEBSOCKET_RECONNECT_ATTEMPTS: "5",
        WEBSOCKET_RECONNECT_INTERVAL: "3000"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        DB_CONNECTION_POOL_SIZE: "30",
        DB_CONNECTION_TIMEOUT: "30000",
        DB_IDLE_TIMEOUT: "600000"
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_file: "./logs/api-combined.log",
      time: true,
      restart_delay: 2000,
      max_restarts: 100,
      min_uptime: "5s",
      exp_backoff_restart_delay: 100,
      // Enhanced persistence settings
      node_args: "--max-old-space-size=1024 --enable-source-maps",
      events: {
        restart: "echo 'API Server restarted'",
        reload: "echo 'API Server gracefully reloaded'",
        stop: "echo 'API Server stopped'",
        exit: "echo 'API Server exited'",
        "restart overlimit": "echo 'API Server hit restart limit'"
      }
    },
    {
      name: "prospectpi-frontend",
      script: "npm.cmd",
      args: ["run", "dev"],
      interpreter: "none",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "768M",
      kill_timeout: 15000,
      shutdown_with_message: true,
      merge_logs: false,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        BROWSER: "none",
        FORCE_COLOR: "0",
        NEXT_TELEMETRY_DISABLED: "1",
        PERSISTENCE_ENABLED: "true"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
      time: true,
      restart_delay: 3000,
      max_restarts: 50,
      min_uptime: "10s",
      exp_backoff_restart_delay: 100,
      node_args: "--max-old-space-size=768",
      events: {
        restart: "echo 'Frontend Server restarted'",
        reload: "echo 'Frontend Server gracefully reloaded'",
        stop: "echo 'Frontend Server stopped'",
        exit: "echo 'Frontend Server exited'",
        "restart overlimit": "echo 'Frontend Server hit restart limit'"
      }
    }
  ]
};
