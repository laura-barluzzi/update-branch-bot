const process = require('process')
const Git = require('../lib/git').Git
const Github = require('../lib/github')
const Main = require('../lib/main')

/**
 * @param {object} pubsubMessage
 * @param {string} pubsubMessage.data
 */
module.exports = pubsubMessage => {
  const message = Buffer.from(pubsubMessage.data, 'base64').toString();
  const branch = JSON.parse(message)
  console.log(branch);
  const log = console.log;
  const authToken = process.env.GITHUB_TOKEN

  const main = new Main({
    git: new Git({ log }),
    github: new Github({ authToken, log }),
    log
  })

  main.run(branch)
};
