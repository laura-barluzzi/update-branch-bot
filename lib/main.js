class Main {
  constructor ({ git, github, log = console.log }) {
    this.git = git
    this.github = github
    this.log = log
  }

  async run ({ organization, repository, branch, baseBranch = 'master' }) {
    if (branch === baseBranch) {
      this.log(`Nothing to do: branch is ${baseBranch}`)
      return
    }

    const pullRequest = await this.github.fetchPullRequest({ organization, repository, branch })

    if (pullRequest == null) {
      this.log(`Nothing to do: no pull request associated with ${branch}`)
      return
    }

    const repo = await this.git.checkout({
      url: this.github.formatRepositoryUrl({ organization, repository })
    })

    const branchIsAhead = await repo.isAhead({
      compare: branch,
      to: baseBranch
    })

    if (branchIsAhead) {
      this.log(`Nothing to do: ${branch} is ahead of ${baseBranch}`)
      return
    }

    await this.github.commentOnPullRequest({
      pullRequestId: pullRequest.id,
      message: `@${pullRequest.author}: this branch is out of date with ${baseBranch}`
    })
  }
}

module.exports = Main
