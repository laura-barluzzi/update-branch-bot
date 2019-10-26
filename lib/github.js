const crypto = require('crypto')
const got = require('got')

/**
 * @typedef {import('./types').Branch} Branch
 * @typedef {import('./types').Logger} Logger
 * @typedef {import('./types').PullRequest} PullRequest
 */

class Github {
  /**
   * @param {object} args
   * @param {Logger} args.log
   * @param {string=} args.refPrefix
   * @param {string=} args.authToken
   * @param {string=} args.secret
   */
  constructor ({ log, refPrefix, authToken, secret }) {
    this.log = log
    this.refPrefix = refPrefix || 'refs/heads/'
    this.authToken = authToken
    this.secret = secret
  }

  /**
   * @param {object} args
   * @param {string} args.organization
   * @param {string} args.repository
   * @param {number=} args.pageSize
   * @returns {Promise<PullRequest[]>}
   */
  async listPullRequests ({ organization, repository, pageSize = 50 }) {
    if (this.authToken == null) {
      throw new Error('this.authToken must not be null')
    }

    /** @type {PullRequest[]} */
    const pullRequests = []
    let cursor = null
    let hasNextPage = true

    while (hasNextPage) {
      const response = await got.post('https://api.github.com/graphql', {
        json: true,
        body: {
          query: `
            query($organization:String!, $repository:String!, $cursor:String, $pageSize:Int!) {
              repository(owner:$organization, name:$repository) {
                pullRequests(states:OPEN, first:$pageSize, after:$cursor, orderBy:{ field:CREATED_AT, direction:DESC }) {
                  edges {
                    cursor
                  }
                  nodes {
                    id
                    number
                    baseRefName
                    headRefName
                    author {
                      login
                    }
                  }
                }
              }
            }
          `,
          variables: {
            cursor,
            pageSize,
            organization,
            repository
          }
        },
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      })

      /** @type {{edges: object[], nodes: object[]}} */
      const { edges, nodes } = response.body.data.repository.pullRequests

      nodes.forEach(node => pullRequests.push({
        author: node.author.login,
        baseBranch: node.baseRefName,
        branch: node.headRefName,
        number: node.number,
        id: node.id
      }))

      cursor = edges.length > 0 ? edges[edges.length - 1].cursor : null
      hasNextPage = nodes.length > 0 ? nodes.length === pageSize : false
    }

    return pullRequests
  }

  /**
   * @param {object} args
   * @param {string} args.pullRequestId
   * @param {string} args.message
   * @returns {Promise<void>}
   */
  async commentOnPullRequest ({ pullRequestId, message }) {
    if (this.authToken == null) {
      throw new Error('this.authToken must not be null')
    }

    const response = await got.post('https://api.github.com/graphql', {
      json: true,
      body: {
        query: `
          mutation($pullRequestId:ID!, $message:String!) {
            addComment(input:{ subjectId:$pullRequestId, body:$message }) {
              commentEdge {
                node {
                  createdAt
                  pullRequest {
                    number
                  }
                }
              }
            }
          }
        `,
        variables: {
          pullRequestId,
          message
        }
      },
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })

    const comment = response.body.data.addComment.commentEdge.node

    this.log(`Created comment on PR#${comment.pullRequest.number} at ${comment.createdAt}`)
  }

  /**
   * @param {object} args
   * @param {object} args.body
   * @param {object} args.headers
   * @returns {Branch=}
   */
  parseWebhook ({ body, headers }) {
    if (this.secret) {
      const signature = crypto.createHmac('sha1', this.secret)
        .update(JSON.stringify(body), 'utf8')
        .digest('hex')

      const signatureIsValid = crypto.timingSafeEqual(
        Buffer.from(`sha1=${signature}`, 'utf8'),
        Buffer.from(headers['x-hub-signature'], 'utf8'))

      if (!signatureIsValid) {
        this.log('Webhook is invalid: signature verification failed')
        return undefined
      }
    }

    const webhookIsPush = body.ref && body.ref.startsWith(this.refPrefix)

    const webhookIsPullRequest =
      (body.action === 'opened' || body.action === 'reopened') &&
      body.pull_request && body.pull_request.head && body.pull_request.head.ref

    let branch = null

    if (webhookIsPush) {
      branch = body.ref.replace(this.refPrefix, '')
      this.log(`Webhook parsed: push to branch ${branch}`)
    } else if (webhookIsPullRequest) {
      branch = body.pull_request.head.ref
      this.log(`Webhook parsed: pullrequest from branch ${branch}`)
    } else {
      this.log(`Webhook is invalid: unknown payload ${JSON.stringify(body)}`)
      return undefined
    }

    return {
      repository: body.repository.name,
      organization: body.repository.owner.login,
      branch
    }
  }

  /**
   * @param {object} args
   * @param {string} args.organization
   * @param {string} args.repository
   * @returns {string}
   */
  formatRepositoryUrl ({ organization, repository }) {
    const token = this.authToken == null ? '' : `${this.authToken}@`
    return `https://${token}github.com/${organization}/${repository}.git`
  }
}

module.exports = Github
