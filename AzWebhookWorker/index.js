const process = require('process')
const Git = require('../lib/git').Git
const Github = require('../lib/github')
const Main = require('../lib/main')
const Slack = require('../lib/slack')

/**
 * @typedef {import('@azure/functions').Context} Context
 * @typedef {import('../lib/types').Branch} Branch
 */

/**
 * @param {Context} context
 * @param {Branch} queueItem
 */
async function worker (context, queueItem) {
  const log = context.log
  const authToken = process.env.GITHUB_TOKEN
  const slackAuthToken = process.env.SLACK_TOKEN
  const webhookURL = process.env.SLACK_WEBHOOK_URL

  const main = new Main({
    git: new Git({ log }),
    github: new Github({ authToken, log }),
    slack: new Slack({ slackAuthToken, webhookURL, log }),
    log
  })

  await main.run(queueItem)
}

module.exports = worker
