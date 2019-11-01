const git = require('isomorphic-git')
const fs = require('fs')
const os = require('os')
const path = require('path')
const util = require('util')

const mkdir = util.promisify(fs.mkdir)

git.plugins.set('fs', fs)

/**
 * @typedef {import('./types').Logger} Logger
 */

class Repo {
  /**
   * @constructor
   * @param {object} args
   * @param {Logger} args.log
   * @param {string} args.dir
   * @param {string} args.remote
   */
  constructor ({ log, dir, remote }) {
    this.log = log
    this.dir = dir
    this.remote = remote
  }

  /**
   * @param {object} args
   * @param {string} args.compare
   * @param {string} args.to
   * @returns {Promise<boolean>}
   */
  async isAhead ({ compare, to }) {
    const [oid, ancestor] = await Promise.all([compare, to].map(async branch => {
      this.log(`git fetch ${this.remote}/${branch}`)
      await git.fetch({ dir: this.dir, singleBranch: true, ref: branch })
      this.log(`git rev-parse ${this.remote}/${branch}`)
      return git.resolveRef({ dir: this.dir, ref: `${this.remote}/${branch}` })
    }))

    return git.isDescendent({ dir: this.dir, ancestor, oid })
  }
}

class Git {
  /**
  * @constructor
   * @param {object} args
   * @param {Logger} args.log
   * @param {string=} args.rootDir
   */
  constructor ({ log, rootDir }) {
    this.log = log
    this.rootDir = rootDir || os.tmpdir()
  }

  /**
   * @param {object} args
   * @param {string} args.url
   * @param {string=} args.remote
   * @returns {Promise<Repo>}
   */
  async checkout ({ url, remote = 'origin' }) {
    const repoPath = new URL(url).pathname
    const repoName = repoPath.substring(repoPath.lastIndexOf('/') + 1)

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

module.exports.Git = Git
module.exports.Repo = Repo
