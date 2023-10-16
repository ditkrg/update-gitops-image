const github = require('@actions/github')
const core = require('@actions/core')
const { Octokit } = require('@octokit/rest')
const { context } = require('@actions/github');
const exec = require('@actions/exec')

async function main() {
  try {

    const owner = core.getInput('owner', { required: true }) //5h4k4r
    const repo = core.getInput('repo', { required: true }) //pilgrimage-gitops-shakar
    const currentRepo = 'pilgrimage-processing-api' // context.payload.repository.full_name.split('/')[1]; //pilgrimage-processing-api
    const branchOrTagName = 'main' // context.payload.ref.replace('refs/heads/', '').replace('refs/tags/', ''); // main,dev,v1.2.3
    const env = 'main' // branchOrTagName.startsWith('v') ? 'prod' : branchOrTagName; // prod, dev, main
    const imageTag = core.getInput('imageTag', { required: true }) //v1.2.3

    const branchSuffix = env === 'prod' ? `prod-to-${branchOrTagName}` : env; // possible outcomes: to-v1.2.3, dev, main
    const branchNameOnGitOpsRepo = `update-${repo}-${branchSuffix}`.replace('-gitops', ''); // update-dms-dev
    const gh = github.getOctokit(core.getInput('githubToken'))

    try {

      const branchResponse = await gh.rest.repos.getBranch({
        owner,
        repo,
        branch: branchNameOnGitOpsRepo
      })

      core.info(`branchResponse: ${branchResponse}`)
    } catch (error) {
      // core.setFailed(error)
      core.info(`Branch ${branchNameOnGitOpsRepo} does not exist on ${owner}/${repo}`)

    }

    core.info(`Creating branch ${branchNameOnGitOpsRepo} on ${owner}/${repo}`)
    core.info(`Owner: ${owner}`)
    core.info(`Repo: ${repo}`)
    core.info(`Branch: ${branchNameOnGitOpsRepo}`)

    // change the values file in uploads/base/values.yaml in the gitops repo and create a PR to merge it into main

    const blob = await gh.rest.git.createBlob({
      owner,
      repo,
      content: `Updated file with image tag ${imageTag}`,
      encoding: 'utf-8'
    })

    // get the last commit sha
    const lastCommit = await gh.rest.repos.getCommit({
      owner,
      repo,
      ref: branchOrTagName
    })

    core.info(`blob: ${JSON.stringify(blob)}`)

    const reference = await gh.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchNameOnGitOpsRepo}`,
      sha: lastCommit.data.sha
    })
    core.info(`Reference: ${JSON.stringify(reference)}`)

    const tree = await gh.rest.git.createTree({
      owner,
      repo,
      base_tree: reference.data.object.sha,
      tree: [
        {
          path: `${owner}/${repo}/uploads/base/values.yaml`,
          mode: '100644',
          type: 'blob',
          sha: blob.data.sha
        }
      ]
    })

    core.info(`tree: ${JSON.stringify(tree)}`)

    const commit = exec.exec('git', ['commit', '-S', '-m', `Update ${currentRepo}'s image tag to ${imageTag}`])

    // const commit = await gh.rest.git.createCommit({
    //   owner,
    //   repo,
    //   message: `Update ${currentRepo}'s image tag to ${imageTag}`,
    //   tree: tree.data.sha,
    //   parents: [reference.data.object.sha],
    //   committer: {
    //     name: 'github-actions[bot]',
    //     email: 'github-actions[bot]@users.noreply.github.com'
    //   },
    //   author: {
    //     name: 'github-actions[bot]',
    //     email: 'github-actions[bot]@users.noreply.github.com'
    //   },
    // })

    // core.info(`commit: ${JSON.stringify(commit)}`)


    // get the last commit sha
    const lastCommit2 = await gh.rest.repos.getCommit({
      owner,
      repo,
      ref: branchOrTagName
    })

    const updateRef = await gh.rest.git.updateRef({
      owner,
      repo,
      ref: reference.data.ref.replace('refs/', ''),
      sha: lastCommit2.data.sha
    })

    core.info(`updateRef: ${updateRef}`)

    // Create a PR to merge the branch into main
    core.info(`head: ${owner}:${branchNameOnGitOpsRepo}`)
    const pr = await gh.rest.pulls.create({
      owner,
      repo,
      title: `Update ${currentRepo}'s image tag to ${imageTag}`,
      head: `${owner}:${branchNameOnGitOpsRepo}`,
      base: 'main',
      body: `Update ${currentRepo}'s image tag to ${imageTag}`
    })

    core.setOutput('pullRequestUrl', pr.data.html_url)
    core.setOutput('branchName', branchNameOnGitOpsRepo)
    core.setOutput('branchUrl', `https://github.com/${owner}/${repo}/tree/${branchNameOnGitOpsRepo}`)

  } catch (error) {
    core.info(`error: ${error.message}`)
    core.setFailed(error)
  }

}
main();
