const got = require('got')

/**
 * @typedef {import('./types').Logger} Logger
 */

class Slack {
  /**
   * @param {object} args
   * @param {string=} args.slackAuthToken
   * @param {string=} args.webhookURL
   * @param {Logger} args.log
   */
  constructor ({ slackAuthToken, webhookURL, log }) {
    this.log = log
    this.webhookURL = webhookURL
    this.authToken = slackAuthToken
  }

  /**
   * @param {object} args
   * @param {string} args.message
   * @returns {Promise<void>}
   */
  async commentOnSlackChannel ({ message }) {
    if (this.webhookURL) {
      await got.post(this.webhookURL, {
        body: JSON.stringify({ text: message }),
        headers: {
          'Content-type': 'application/json'
        }
      })
    }
    this.log(`Posted comment on Slack channel using URL: ${this.webhookURL}`)
  }

  /**
   * @param {object} args
   * @param {string} args.email
   * @returns {Promise<string|undefined>}
   */
  async getUserId ({ email }) {
    if (!this.authToken) {
      this.log('No given Slack authentication token')
      return
    }

    const response = await got.get('https://slack.com/api/users.list', {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })

    /** @type {{members: object[]}} */
    const { members } = JSON.parse(response.body)

    for (const member of members) {
      if (member.profile.email === email) {
        return member.id
      }
    }
  }

  /**
   * @param {object} args
   * @param {string} args.userId
   * @returns {Promise<string|undefined>}
   */
  async getChannelId ({ userId }) {
    if (!this.authToken) {
      this.log('No given Slack authentication token')
      return
    }

    const response = await got.post('https://slack.com/api/im.open', {
      json: true,
      body: { user: userId },
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
    const channelId = response.body.channel.id
    return channelId
  }

  /**
   * @param {object} args
   * @param {string} args.channelId
   * @param {string} args.message
   * @returns {Promise<string|undefined>}
   */
  async sendDirectMessage ({ channelId, message }) {
    if (!this.authToken) {
      this.log('No given Slack authentication token')
      return
    }

    await got.post('https://slack.com/api/chat.postMessage', {
      json: true,
      body: { channel: channelId, text: message },
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
  }
}

module.exports = Slack
