const github = require('@actions/github')
const core = require('@actions/core')
const { Octokit } = require('@octokit/rest')
const { context } = require('@actions/github');

async function main() {


  // const octokit = new Octokit({
  //   auth: core.getInput('github-token')
  // })
  try {

    const currentRepo = github.context.payload.repository.full_name.split('/')[1];
    const branchOrTagName = github.context.payload.ref.replace('refs/heads/', '').replace('refs/tags/', '');
    const env = branchOrTagName.startsWith('v') ? 'prod' : branchOrTagName;
    const imageTag = core.getInput('imageTag', { required: true })


    console.log("branch: ", branch);

    try {
      const gh = github.getOctokit(core.getInput('github-token'))

      const owner = core.getInput('owner', { required: true })
      const repo = core.getInput('repo', { required: true })

      const branchNameOnGitOpsRepo = `update-${currentRepo}-${env}`; // update-dms-dev

      await gh.rest.repos.getBranch({
        owner,
        repo,
        branch: branchNameOnGitOpsRepo
      })

      core.setFailed(`Branch ${branchNameOnGitOpsRepo} already exists on ${owner}/${repo}`)
      return;
    } catch (error) {
      // do nothing
    }

    core.info(`Branch ${branchNameOnGitOpsRepo} does not exist on ${owner}/${repo}`)
    core.info(`Creating branch ${branchNameOnGitOpsRepo} on ${owner}/${repo}`)
    core.info(`Owner: ${owner}`)
    core.info(`Repo: ${repo}`)
    core.info(`Branch: ${branchNameOnGitOpsRepo}`)
    core.info(`Commit: ${context.sha}`)

    await gh.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchNameOnGitOpsRepo}`,

      sha: context.sha
    })



    // Create a PR to merge the branch into main
    const pr = await gh.rest.pulls.create({
      owner,
      repo,
      title: `Update ${currentRepo}'s image tag to ${imageTag}`,
      head: branchNameOnGitOpsRepo,
      base: 'main',
      body: `Update ${currentRepo}'s image tag to ${imageTag}`
    })

    core.setOutput('prUrl', pr.data.html_url)
    core.setOutput('branchName', branchNameOnGitOpsRepo)
    core.setOutput('branchUrl', `https://github.com/${owner}/${repo}/tree/${branchNameOnGitOpsRepo}`)

  } catch (error) {
    core.setFailed(error.message)
  }

}
main();
