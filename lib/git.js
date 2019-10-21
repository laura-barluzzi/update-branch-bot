const git = require('isomorphic-git')
const fs = require('fs')
const os = require('os')
const path = require('path')
const util = require('util')

const mkdir = util.promisify(fs.mkdir)

git.plugins.set('fs', fs)

class Git {
  constructor ({ log, rootDir = os.tmpdir() }) {
    this.log = log
    this.rootDir = rootDir
  }

  async isAhead ({ repoUrl, compare, to, remote = 'origin' }) {
    const dir = await this.checkout({ repoUrl, remote })

    const [oid, ancestor] = await Promise.all([compare, to].map(async branch => {
      this.log(`git fetch ${remote}/${branch}`)
      await git.fetch({ dir, singleBranch: true, ref: branch })
      return git.resolveRef({ dir, ref: `${remote}/${branch}` })
    }))

    return git.isDescendent({ dir, ancestor, oid, depth: -1 })
  }

  async checkout ({ repoUrl, remote }) {
    const repoName = new URL(repoUrl).pathname.split('/').pop()
    const dir = path.join(this.rootDir, repoName)

    try {
      await mkdir(dir)
    } catch (error) {
      if (error.code === 'EEXIST') {
        this.log(`${dir} already exists`)
        return dir
      }

      throw error
    }

    this.log(`git init ${dir}`)
    await git.init({ dir })

    this.log(`git remote add ${remote}`)
    await git.addRemote({ dir, remote, url: repoUrl })

    return dir
  }
}

module.exports = Git
