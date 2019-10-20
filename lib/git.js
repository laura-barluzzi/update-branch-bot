const git = require('isomorphic-git')
const tmp = require('tmp-promise')
const fs = require('fs')

git.plugins.set('fs', fs)

class Git {
  constructor ({ log }) {
    this.log = log
  }

  async isAhead ({ repoUrl, compare, to, remote = 'origin' }) {
    this.log('mktemp -d')
    const tmpDir = await tmp.dir({ unsafeCleanup: true })
    const dir = tmpDir.path

    this.log(`git init ${dir}`)
    await git.init({ dir })

    this.log(`git remote add ${remote}`)
    await git.addRemote({ dir, remote, url: repoUrl })

    const [oid, ancestor] = await Promise.all([compare, to].map(async branch => {
      this.log(`git fetch ${remote}/${branch}`)
      await git.fetch({ dir, singleBranch: true, ref: branch })
      return git.resolveRef({ dir, ref: `${remote}/${branch}` })
    }))

    return git.isDescendent({ dir, ancestor, oid, depth: -1 })
  }
}

module.exports = Git
