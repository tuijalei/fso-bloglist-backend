const app = require('./app')
const http = require('http')
const config = require('./utils/config')
const logger = require('./utils/logger')

const server = http.createServer(app)

logger.info(`Something happening on port ${config.PORT}`)

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`)
})