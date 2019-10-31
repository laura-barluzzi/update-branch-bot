const process = require('process')
const Git = require('../lib/git').Git
const Github = require('../lib/github')
const Main = require('../lib/main')
const Slack = require('../lib/slack')
const users = require('../lib/users')

/**
 * @param {object} pubsubMessage
 * @param {string} pubsubMessage.data
 */
module.exports = pubsubMessage => {
  const message = Buffer.from(pubsubMessage.data, 'base64').toString()
  const queueItem = JSON.parse(message)
  const log = console.log
  const authToken = process.env.GITHUB_TOKEN
  const slackAuthToken = process.env.SLACK_TOKEN
  const webhookURL = process.env.SLACK_WEBHOOK_URL

  const main = new Main({
    git: new Git({ log }),
    github: new Github({ authToken, log }),
    slack: new Slack({ slackAuthToken, webhookURL, log }),
    users,
    log
  })

  main.run(queueItem)
}
