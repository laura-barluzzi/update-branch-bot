const process = require('process')
const Git = require('../lib/git')
const Github = require('../lib/github')
const Main = require('../lib/main')

async function worker (context, queueItem) {
  const log = context.log
  const authToken = process.env.GITHUB_TOKEN

  const main = new Main({
    git: new Git({ log }),
    github: new Github({ authToken, log }),
    log
  })

  await main.run(queueItem)

  context.done()
}

module.exports = worker
