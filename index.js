const github = require('@actions/github')
const core = require('@actions/core')
const { Octokit } = require('@octokit/rest')
const { context } = require('@actions/github');

async function main() {
  try {
    const owner = core.getInput('owner', { required: true }) //ditkrg
    const repo = core.getInput('repo', { required: true }) //pilgrimage-gitops
    const currentRepo = context.payload.repository.full_name.split('/')[1]; //pilgrimage-processing-api
    const branchOrTagName = context.payload.ref.replace('refs/heads/', '').replace('refs/tags/', ''); //main,dev,v1.2.3
    const env = branchOrTagName.startsWith('v') ? 'prod' : branchOrTagName; // prod, dev, main
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
    core.info(`Commit: ${context.sha}`)

    // change the values file in uploads/base/values.yaml in the gitops repo and create a PR to merge it into main



    const reference = await gh.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/static`,
      sha: context.sha
    })

    core.info(`Reference: ${reference}`)

    //     const tree = await gh.rest.git.createTree({
    //       owner,
    //       repo,
    //       base_tree: reference.data.object.sha,
    //       tree: [
    //         {
    //           path: `${owner}/${repo}/uploads/base/values.yaml`,
    //           mode: '100644',
    //           type: 'blob',
    //           content: `apiVersion: apps/v1
    // kind: Deployment
    // metadata:
    //   name: ${currentRepo}
    //   namespace: ${currentRepo}
    //   labels:
    //     app: ${currentRepo}
    // spec:
    //   replicas: 1
    //   selector:
    //     matchLabels:
    //       app: ${currentRepo}
    //   template:
    //     metadata:
    //       labels:
    //         app: ${currentRepo}
    //     spec:

    //       containers:

    //       - name: ${currentRepo}

    //         image: ${currentRepo}:${imageTag}

    //         imagePullPolicy: Always

    //         ports:

    //         - containerPort: 8080
    // `
    //         }
    //       ]
    //     })
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
    core.setFailed(error)
  }

}
main();
