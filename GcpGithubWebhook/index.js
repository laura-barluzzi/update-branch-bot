const process = require('process')
const Github = require('../lib/github')
const { PubSub } = require('@google-cloud/pubsub')

/**
 * @typedef {import('express').Request} HttpRequest
 * @typedef {import('express').Response} HttpResponse
 */

/**
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 */
module.exports = (req, res) => {
  const outputTopic = process.env.TOPIC_NAME
  if (outputTopic == null) {
    res.status(500).send('Missing configuration: TOPIC_NAME')
    return
  }

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

  if (!webhook) {
    res.status(200).send('OK')
    return
  }

  const pubsub = new PubSub()
  const topic = pubsub.topic(outputTopic)
  topic.publish(Buffer.from(JSON.stringify(webhook), 'utf8'))
    .then(() => res.status(200).send('OK'))
}
