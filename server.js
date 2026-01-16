// server.js - Atlas Keswa Production Server
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

// Configuration
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT, 10) || 3000

// Frontend directory (where the Next.js app is located)
const frontendDir = path.join(__dirname, 'frontend')

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Enhanced logging function
function logToFile(type, message, error = null) {
  const timestamp = new Date().toISOString()
  const logFile = path.join(logsDir, `${type}.log`)
  const logMessage = error
    ? `[${timestamp}] ${message}\n${error.stack || error}\n\n`
    : `[${timestamp}] ${message}\n`

  fs.appendFileSync(logFile, logMessage)

  // Also log to console
  if (error) {
    console.error(`[${timestamp}] ${message}`, error)
  } else {
    console.log(`[${timestamp}] ${message}`)
  }
}

// Graceful shutdown handler
function gracefulShutdown(signal) {
  logToFile('server', `Received ${signal}. Shutting down gracefully...`)
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Initialize Next.js app with the frontend directory
const app = next({
  dev,
  hostname,
  port,
  dir: frontendDir
})
const handle = app.getRequestHandler()

logToFile('server', `Starting Atlas Keswa server in ${dev ? 'development' : 'production'} mode`)
logToFile('server', `Node version: ${process.version}`)
logToFile('server', `Frontend directory: ${frontendDir}`)
logToFile('server', `Environment: ${JSON.stringify({
  NODE_ENV: process.env.NODE_ENV,
  PORT: port,
  HOSTNAME: hostname,
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set'
})}`)

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Log API requests
      if (req.url.startsWith('/api/')) {
        logToFile('api', `${req.method} ${req.url}`)
      }

      // Health check endpoint
      if (req.url === '/health' || req.url === '/health/') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          app: 'Atlas Keswa'
        }))
        return
      }

      // Parse URL and handle request
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      logToFile('error', `Error handling ${req.method} ${req.url}`, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      logToFile('error', 'Failed to start server', err)
      throw err
    }
    logToFile('server', `Atlas Keswa server ready on http://${hostname}:${port}`)
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Atlas Keswa Server                        ║
╠══════════════════════════════════════════════════════════════╣
║  Status:      Running                                        ║
║  Mode:        ${dev ? 'Development' : 'Production '}                                     ║
║  URL:         http://${hostname}:${port}                              ║
║  Health:      http://${hostname}:${port}/health                       ║
╚══════════════════════════════════════════════════════════════╝
    `)
  })
}).catch((err) => {
  logToFile('error', 'Failed to prepare Next.js app', err)
  console.error('Failed to start server:', err)
  process.exit(1)
})