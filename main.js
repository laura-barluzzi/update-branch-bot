const git = require('isomorphic-git');
const tmp = require('tmp-promise');
const fs = require('fs');

git.plugins.set('fs', fs);

async function isAhead({ repoUrl, compare, to, remote='origin', log=console.log }) {
  log('mktemp -d');
  const tmpDir = await tmp.dir({ unsafeCleanup: true });
  const dir = tmpDir.path;

  log(`git init ${dir}`);
  await git.init({ dir });

  log(`git remote add ${remote}`);
  await git.addRemote({ dir, remote, url: repoUrl });

  const [oid, ancestor] = await Promise.all([compare, to].map(async branch => {
    log(`git fetch ${remote}/${branch}`)
    await git.fetch({ dir, singleBranch: true, ref: branch });
    return await git.resolveRef({ dir, ref: `${remote}/${branch}` });
  }));

  return await git.isDescendent({ dir, ancestor, oid, depth: -1 });
}

module.exports = {
  isAhead,
};
