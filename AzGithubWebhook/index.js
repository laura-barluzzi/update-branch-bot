const process = require('process')
const Github = require('../lib/github')

/**
 * @typedef {import('@azure/functions').Context} Context
 * @typedef {import('@azure/functions').HttpRequest} HttpRequest
 */

/**
 * @param {Context} context
 * @param {HttpRequest} req
 */
function webhook (context, req) {
  const github = new Github({
    secret: process.env.GITHUB_WEBHOOK_SECRET,
    log: context.log
  })

  const webhook = github.parseWebhook({
    body: req.body || {},
    headers: req.headers || {}
  })

  context.bindings.httpResponse = {
    status: 200
  }

  context.bindings.outputQueueItem = webhook != null
    ? [JSON.stringify(webhook)]
    : []

  context.done()
}

module.exports = webhook
