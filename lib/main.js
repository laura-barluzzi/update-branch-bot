/**
 * @typedef {import('./git').Git} Git
 * @typedef {import('./git').Repo} Repo
 * @typedef {import('./github')} Github
 * @typedef {import('./slack')} Slack
 * @typedef {import('./users')} Users
 * @typedef {import('./types').Branch} Branch
 * @typedef {import('./types').Logger} Logger
 * @typedef {import('./types').PullRequest} PullRequest
 */

class Main {
  /**
   * @constructor
   * @param {object} args
   * @param {Git} args.git
   * @param {Github} args.github
   * @param {Slack} args.slack
   * @param {Users} args.users
   * @param {Logger} args.log
   */
  constructor ({ git, github, slack, users, log }) {
    this.git = git
    this.github = github
    this.slack = slack
    this.log = log
    this.users = users
  }

  /**
   * @param {Branch} args
   * @returns {Promise<void>}
   */
  async run ({ organization, repository, branch }) {
    const pullRequests = await this.github.listPullRequests({ organization, repository })

    const pullRequestsTargetingBranch = pullRequests.filter(pullRequest => pullRequest.baseBranch === branch)
    const pullRequestsOriginatingFromBranch = pullRequests.filter(pullRequest => pullRequest.branch === branch)

    if (pullRequestsTargetingBranch.length === 0 && pullRequestsOriginatingFromBranch.length === 0) {
      this.log(`Nothing to do: no pull requests associated with ${branch}`)
      return
    }

    const repo = await this.git.checkout({
      url: this.github.formatRepositoryUrl({ organization, repository })
    })

    for (const pullRequest of pullRequestsTargetingBranch) {
      this.log(`Got PR#${pullRequest.number} merging into ${branch}, checking if ${branch} is ahead of ${pullRequest.branch}`)
      await this.commentIfOutOfDate({ repo, pullRequest, compare: branch, to: pullRequest.branch })
    }

    for (const pullRequest of pullRequestsOriginatingFromBranch) {
      this.log(`Got PR#${pullRequest.number} opened from ${branch}, checking if ${branch} is ahead of ${pullRequest.baseBranch}`)
      await this.commentIfOutOfDate({ repo, pullRequest, compare: branch, to: pullRequest.baseBranch })
    }
  }

  /**
   * @param {object} args
   * @param {Repo} args.repo
   * @param {PullRequest} args.pullRequest
   * @param {string} args.compare
   * @param {string} args.to
   * @returns {Promise<void>}
   */
  async commentIfOutOfDate ({ repo, pullRequest, compare, to }) {
    const branchIsAhead = await repo.isAhead({ compare, to })

    if (branchIsAhead) {
      this.log(`Nothing to do for PR#${pullRequest.number}: ${compare} is ahead of ${to}`)
      return
    }

    await this.github.commentOnPullRequest({
      pullRequestId: pullRequest.id,
      message: `@${pullRequest.author}: this branch is out of date with ${pullRequest.baseBranch}`
    })

    await this.slack.commentOnSlackChannel({
      message: `🔥🔥🔥🔥🔥🔥\nFor GitHub user *@${pullRequest.author}*:\nyour PR ${pullRequest.url} is out of date with *${pullRequest.baseBranch}* branch`
    })

    const authorEmail = this.users[pullRequest.author]

    if (authorEmail) {
      const userId = await this.slack.getUserId({ email: authorEmail })
      if (userId) {
        const channelId = await this.slack.getChannelId({ userId })
        if (channelId) {
          this.slack.sendDirectMessage({
            channelId,
            message: `🔥🔥🔥🔥🔥🔥\nYour PR ${pullRequest.url} is out of date with *${pullRequest.baseBranch}* branch\n🔥🔥🔥🔥🔥🔥`
          })
          this.log(`Sent direct message on Slack to user with email: ${authorEmail}`)
        }
      }
    }
  }
}

module.exports = Main
