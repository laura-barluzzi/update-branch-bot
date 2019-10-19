import { post } from 'got'

class Github {
  constructor ({ log = console.log, refPrefix = 'refs/heads/', authToken = null }) {
    this.log = log
    this.refPrefix = refPrefix
    this.authToken = authToken
  }

  async fetchPullRequest ({ organization, repository, branch }) {
    if (this.authToken == null) {
      throw new Error('this.authToken must not be null')
    }

    const response = await post('https://api.github.com/graphql', {
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

    const response = await post('https://api.github.com/graphql', {
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

  parseWebhook ({ payload }) {
    if (!payload.ref.startsWith(this.refPrefix)) {
      return null
    }

    return {
      repository: payload.repository.name,
      organization: payload.repository.owner.name,
      branch: payload.ref.replace(this.refPrefix, '')
    }
  }

  formatRepositoryUrl ({ organization, repository }) {
    const token = this.authToken == null ? '' : `${this.authToken}@`
    return `https://${token}github.com/${organization}/${repository}.git`
  }
}

export default Github
