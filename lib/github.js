const crypto = require('crypto')
const got = require('got')

class Github {
  constructor ({ log = console.log, refPrefix = 'refs/heads/', authToken = null, secret = null }) {
    this.log = log
    this.refPrefix = refPrefix
    this.authToken = authToken
    this.secret = secret
  }

  async listPullRequests ({ organization, repository, pageSize = 50 }) {
    if (this.authToken == null) {
      throw new Error('this.authToken must not be null')
    }

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

      const { edges, nodes } = response.body.data.repository.pullRequests

      nodes.forEach(node => pullRequests.push({
        author: node.author.login,
        branch: node.headRefName,
        id: node.id
      }))

      cursor = edges.length > 0 ? edges[edges.length - 1].cursor : null
      hasNextPage = nodes.length > 0 ? nodes.length === pageSize : false
    }

    return pullRequests
  }

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

    this.log(`Created comment at ${response.body.data.addComment.commentEdge.node.createdAt}`)
  }

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
        return null
      }
    }

    if (!body.ref || !body.ref.startsWith(this.refPrefix)) {
      // TODO: implement parsing of pull-request-created webhooks
      this.log(`Webhook is invalid: ref ${body.ref} does not match ${this.refPrefix}`)
      return null
    }

    return {
      repository: body.repository.name,
      organization: body.repository.owner.name,
      branch: body.ref.replace(this.refPrefix, '')
    }
  }

  formatRepositoryUrl ({ organization, repository }) {
    const token = this.authToken == null ? '' : `${this.authToken}@`
    return `https://${token}github.com/${organization}/${repository}.git`
  }
}

module.exports = Github
