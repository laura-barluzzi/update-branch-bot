const crypto = require('crypto')
const got = require('got')

class Github {
  constructor ({ log = console.log, refPrefix = 'refs/heads/', authToken = null, secret = null }) {
    this.log = log
    this.refPrefix = refPrefix
    this.authToken = authToken
    this.secret = secret
  }

  async fetchPullRequest ({ organization, repository, branch }) {
    if (this.authToken == null) {
      throw new Error('this.authToken must not be null')
    }

    const response = await got.post('https://api.github.com/graphql', {
      json: true,
      body: {
        query: `
          query($organization:String!, $repository:String!, $ref:String!) {
            repository(owner:$organization, name:$repository) {
              ref(qualifiedName:$ref) {
                associatedPullRequests(first:2) {
                  nodes {
                    id
                    number
                    repository {
                      name
                      owner {
                        login
                      }
                    }
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          organization,
          repository,
          ref: `${this.refPrefix}${branch}`
        }
      },
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })

    const { nodes } = response.body.data.repository.ref.associatedPullRequests
    if (nodes.length > 1) {
      throw new Error(`Got ${nodes.length} pull requests on ${organization}/${repository} ${branch}, expected 0 or 1`)
    }

    if (nodes.length === 0) {
      this.log(`${branch} does not have any open pull requests`)
      return null
    }

    this.log(`PR#${nodes[0].number} on ${nodes[0].repository.owner.login}/${nodes[0].repository.name} is open for ${branch}`)
    return {
      author: nodes[0].author.login,
      id: nodes[0].id
    }
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
    if (this.secret != null) {
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
