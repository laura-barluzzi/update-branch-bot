const got = require('got')

/**
 * @typedef {import('./types').Logger} Logger
 */

class Slack {
  /**
   * @param {object} args
   * @param {Logger} args.log
   * @param {string=} args.webhookURL
   * @param {string=} args.authToken
   */
  constructor ({ log, webhookURL, authToken }) {
    this.log = log
    this.webhookURL = webhookURL
    this.authToken = authToken
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
      body: {
        user: userId
      },
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })

    const channelId = JSON.parse(response.channel.id)
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
      body: {
        channel: channelId,
        text: message
      },
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
  }
}

module.exports = Slack
