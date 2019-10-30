const got = require('got')

/**
 * @typedef {import('./types').Logger} Logger
 */

class Slack {
  /**
   * @param {object} args
   * @param {Logger} args.log
   * @param {string=} args.webhookURL
   */
  constructor ({ log, webhookURL }) {
    this.log = log
    this.webhookURL = webhookURL
  }

  /**
   * @param {object} args
   * @param {string} args.message
   */
  async commentOnSlackChannel ({ message }) {
    if (this.webhookURL) {
      await got.post(this.webhookURL, {
        json: true,
        body: { text: message }
      })
    }
  }
}

module.exports = Slack
