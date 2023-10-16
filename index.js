const core = require('@actions/core');
const { exec } = require('@actions/exec');
const github = require('@actions/github');

async function main() {
  try {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const imageTag = core.getInput('imageTag', { required: true });

    // Get the current branch name using GitHub Actions
    const branchOrTagName = await getBranch();


    const branchSuffix = branchOrTagName.startsWith('v') ? 'prod' : branchOrTagName;
    const branchNameOnGitOpsRepo = `update-${repo}-${branchSuffix}`;

    core.info(`Current branch/tag name: ${branchOrTagName}`);
    core.info(`New branch name: update-${repo}-${branchOrTagName}`);

    // Create a branch using GitHub Actions
    await createBranch(owner, repo, branchNameOnGitOpsRepo, branchOrTagName);

    core.info(`Created a branch with name ${branchNameOnGitOpsRepo}`);

    // print something in uploads/base/values.yaml
    await exec('echo', [`imageTag: ${imageTag}`], { cwd: 'uploads/base/values.yaml' });

    core.info(`Updated image tag to ${imageTag}`);

    // Make changes to the file and create a commit using GitHub Actions
    await createCommit(owner, repo, branchNameOnGitOpsRepo, imageTag);

    core.info(`Created a commit with message "Update image tag to ${imageTag}"`);

    // Create a pull request using GitHub Actions
    await createPullRequest(owner, repo, branchNameOnGitOpsRepo, branchOrTagName, imageTag);

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getBranch() {
  let branchName;
  const options = {};
  options.listeners = {
    stdout: (data) => {
      branchName = data.toString().trim();
    },
  };

  await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], options);
  return branchName;
}

async function createBranch(owner, repo, branchName, baseBranch) {
  await exec('git', ['checkout', '-b', branchName, baseBranch]);
}

async function createCommit(owner, repo, branchName, imageTag) {
  await exec('git', ['add', '.']);
  await exec('git', ['commit', '-m', `Update image tag to ${imageTag}`]);
}

async function createPullRequest(owner, repo, branchName, baseBranch, imageTag) {
  const octokit = github.getOctokit(core.getInput('githubToken'));

  const response = await octokit.pulls.create({
    owner,
    repo,
    title: `Update image tag to ${imageTag}`,
    head: branchName,
    base: baseBranch,
    body: `Update image tag to ${imageTag}`,
  });

  core.setOutput('pullRequestUrl', response.data.html_url);
  core.setOutput('branchName', branchName);
}

main();
