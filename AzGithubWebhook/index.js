import Github from '../lib/github'

function webhook (context, req) {
  const github = new Github({ log: context.log })

  const webhook = github.parseWebhook(req.body)

  context.bindings.httpResponse = {
    status: 200
  }

  context.bindings.outputQueueItem = webhook != null
    ? [JSON.stringify(webhook)]
    : []

  context.done()
}

export default webhook
