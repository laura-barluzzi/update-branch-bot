const git = require('isomorphic-git')
const fs = require('fs')
const os = require('os')
const path = require('path')
const util = require('util')

const mkdir = util.promisify(fs.mkdir)

git.plugins.set('fs', fs)

class Repo {
  constructor ({ log, dir, remote }) {
    this.log = log
    this.dir = dir
    this.remote = remote
  }

  async isAhead ({ compare, to }) {
    const [oid, ancestor] = await Promise.all([compare, to].map(async branch => {
      this.log(`git fetch ${this.remote}/${branch}`)
      await git.fetch({ dir: this.dir, singleBranch: true, ref: branch })
      return git.resolveRef({ dir: this.dir, ref: `${this.remote}/${branch}` })
    }))

    return git.isDescendent({ dir: this.dir, ancestor, oid, depth: -1 })
  }
}

class Git {
  constructor ({ log, rootDir = os.tmpdir() }) {
    this.log = log
    this.rootDir = rootDir
  }

  async checkout ({ url, remote = 'origin' }) {
    const repoName = new URL(url).pathname.split('/').pop()
    const dir = path.join(this.rootDir, repoName)
    const repo = new Repo({ log: this.log, dir, remote })

    try {
      await mkdir(dir)
    } catch (error) {
      if (error.code === 'EEXIST') {
        this.log(`${dir} already exists`)
        return repo
      }

      throw error
    }

    this.log(`git init ${dir}`)
    await git.init({ dir })

    this.log(`git remote add ${remote}`)
    await git.addRemote({ dir, remote, url })

    return repo
  }
}

module.exports = Git
