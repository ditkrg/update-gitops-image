const github = require('@actions/github')
const core = require('@actions/core')
const { Octokit } = require('@octokit/rest')


const octokit = new Octokit({
  auth: core.getInput('github-token')
})

// Get the branch name from
const branch = github.context.payload.ref.replace('refs/heads/', '')
console.log("branch: ", branch)
// if branch is equal to main log a message else if it's dev log another message. if it's from a tag log a third message
if (branch === 'main') {
  console.log('This is the main branch')
}
else if (branch === 'dev') {
  console.log('This is the dev branch')
}
else if (branch.startsWith('v')) {
  console.log('This is a tag')
}
