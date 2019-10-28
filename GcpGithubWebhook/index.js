const process = require('process')
const Github = require('../lib/github')

/**
 * @typedef {import('express').Request} HttpRequest
 * @typedef {import('express').Response} HttpResponse
 */

/**
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 */
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send(`Method ${req.method} is not supported`)
    return
  }

  const github = new Github({
    secret: process.env.GITHUB_WEBHOOK_SECRET,
    log: console.log
  })

  const webhook = github.parseWebhook({
    body: req.body || {},
    headers: req.headers || {}
  })

  res.status(200).send('OK')
  /*
  context.bindings.outputQueueItem = webhook != null
    ? [JSON.stringify(webhook)]
    : []
  */
}
