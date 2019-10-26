/**
 * @typedef {import("./git").Git} Git
 * @typedef {import("./git").Repo} Repo
 * @typedef {import("./github")} Github
 * @typedef {import("./types").Branch} Branch
 * @typedef {import("./types").Logger} Logger
 * @typedef {import("./types").PullRequest} PullRequest
 */

class Main {
  /**
   * @param {object} args
   * @param {Git} args.git
   * @param {Github} args.github
   * @param {Logger} args.log
   */
  constructor ({ git, github, log }) {
    this.git = git
    this.github = github
    this.log = log
  }

  /**
   * @param {Branch} args
   * @returns {Promise<void>}
   */
  async run ({ organization, repository, branch }) {
    const pullRequests = await this.github.listPullRequests({ organization, repository })

    const toBranch = pullRequests.filter(pullRequest => pullRequest.baseBranch === branch)
    const fromBranch = pullRequests.filter(pullRequest => pullRequest.branch === branch)

    if (toBranch.length === 0 && fromBranch.length === 0) {
      this.log(`Nothing to do: no pull requests associated with ${branch}`)
      return
    }

    const repo = await this.git.checkout({
      url: this.github.formatRepositoryUrl({ organization, repository })
    })

    this.log(`Processing ${toBranch.length} pull requests targeting ${branch}`)
    for (const pullRequest of toBranch) {
      await this.commentIfOutOfDate({ repo, pullRequest, compare: pullRequest.baseBranch, to: pullRequest.branch })
    }

    this.log(`Processing ${fromBranch.length} pull requests originating from ${branch}`)
    for (const pullRequest of fromBranch) {
      await this.commentIfOutOfDate({ repo, pullRequest, compare: pullRequest.branch, to: pullRequest.baseBranch })
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
      this.log(`Nothing to do: ${pullRequest.branch} is ahead of ${pullRequest.baseBranch}`)
      return
    }

    await this.github.commentOnPullRequest({
      pullRequestId: pullRequest.id,
      message: `@${pullRequest.author}: this branch is out of date with ${pullRequest.baseBranch}`
    })
  }
}

module.exports = Main
