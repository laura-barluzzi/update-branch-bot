const process = require('process')
const Github = require('../lib/github')

function webhook (context, req) {
  const github = new Github({
    secret: process.env.GITHUB_WEBHOOK_SECRET,
    log: context.log
  })

  const webhook = github.parseWebhook(req)

  context.bindings.httpResponse = {
    status: 200
  }

  context.bindings.outputQueueItem = webhook != null
    ? [JSON.stringify(webhook)]
    : []

  context.done()
}

module.exports = webhook
