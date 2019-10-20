const process = require('process')
const main = require('../lib/main')

async function worker (context, queueItem) {
  await main({
    authToken: process.env.GITHUB_TOKEN,
    log: context.log,
    ...queueItem
  })

  context.done()
}

module.exports = worker
