const Github = require('../lib/github')

function webhook (context, req) {
  const github = new Github({ log: context.log })

  const webhook = github.parseWebhook({ payload: req.body })

  context.bindings.httpResponse = {
    status: 200
  }

  context.bindings.outputQueueItem = webhook != null
    ? [JSON.stringify(webhook)]
    : []

  context.done()
}

module.exports = webhook
