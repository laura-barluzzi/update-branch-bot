const Git = require('./git')
const Github = require('./github')

async function main ({ authToken, organization, repository, branch, baseBranch = 'master', log = console.log }) {
  if (branch === baseBranch) {
    log(`Nothing to do: ${branch} is ${baseBranch}`)
    return
  }

  const github = new Github({ log, authToken })
  const git = new Git({ log })

  const pullRequest = await github.fetchPullRequest({ organization, repository, branch })

  if (pullRequest == null) {
    log(`Nothing to do: no pull request associated with ${branch}`)
    return
  }

  const repo = await git.checkout({
    url: github.formatRepositoryUrl({ organization, repository })
  })

  const branchIsAhead = await repo.isAhead({
    compare: branch,
    to: baseBranch
  })

  if (branchIsAhead) {
    log(`Nothing to do: ${branch} is ahead of ${baseBranch}`)
    return
  }

  await github.commentOnPullRequest({
    pullRequestId: pullRequest.id,
    message: `@${pullRequest.author}: this branch is out of date with ${baseBranch}`
  })
}

module.exports = main
