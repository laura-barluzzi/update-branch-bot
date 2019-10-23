class Main {
  constructor ({ git, github, log = console.log }) {
    this.git = git
    this.github = github
    this.log = log
  }

  async run ({ organization, repository, branch, baseBranch = 'master' }) {
    let pullRequests = await this.github.listPullRequests({ organization, repository })

    if (branch !== baseBranch) {
      pullRequests = pullRequests.filter(pullRequest => pullRequest.branch === branch)
    }

    if (pullRequests.length === 0) {
      this.log(`Nothing to do: no pull requests associated with ${branch}`)
      return
    }

    const repo = await this.git.checkout({
      url: this.github.formatRepositoryUrl({ organization, repository })
    })

    for (const pullRequest of pullRequests) {
      await this.commentIfOutOfDate({ repo, pullRequest, baseBranch })
    }
  }

  async commentIfOutOfDate ({ repo, pullRequest, baseBranch }) {
    const branchIsAhead = await repo.isAhead({
      compare: pullRequest.branch,
      to: baseBranch
    })

    if (branchIsAhead) {
      this.log(`Nothing to do: ${pullRequest.branch} is ahead of ${baseBranch}`)
      return
    }

    await this.github.commentOnPullRequest({
      pullRequestId: pullRequest.id,
      message: `@${pullRequest.author}: this branch is out of date with ${baseBranch}`
    })
  }
}

module.exports = Main
