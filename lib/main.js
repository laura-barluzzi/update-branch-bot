const Git = require('./git')
const Github = require('./github')

async function main ({ authToken, organization, repository, branch, baseBranch = 'master', log = console.log }) {
  if (branch === baseBranch) {
    return
  }

  const github = new Github({ log, authToken })
  const git = new Git({ log })

  const pullRequest = await github.fetchPullRequest({ organization, repository, branch })

  if (pullRequest == null) {
    return
  }

  const branchIsAhead = await git.isAhead({
    repoUrl: github.formatRepositoryUrl({ organization, repository }),
    compare: branch,
    to: baseBranch
  })

  if (branchIsAhead) {
    return
  }

  await github.commentOnPullRequest({
    pullRequestId: pullRequest.id,
    message: `@${pullRequest.author}: this branch is out of date with ${baseBranch}`
  })
}

module.exports = main
