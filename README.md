# Update GitOps Image GitHub Action

The Update GitOps GitHub Action is a custom composite Action designed to automate the process of updating an image tag in a GitOps repository. It streamlines the following tasks:

1. Creating a new branch.
2. Updating the image tag in the specified GitOps manifest file.
3. Creating a pull request for the changes.
4. Automatically merging the pull request into the configured branch.

## Description

This Action simplifies the process of updating an image tag in a GitOps repository. It's designed to be used in conjunction with a GitOps workflow to automate image tag updates.

## Inputs

This Action accepts the following inputs:

1. `owner` (required)
   - Description: The owner of the repository if it is not the current one.
   - Default: The owner of the current repository (`${{ github.repository_owner }}`).

2. `repo` (required)
   - Description: The name of the repository on which to update the image tag.

3. `image-tag` (required)
   - Description: The tag of the image to be updated.

4. `app-id` (required)
   - Description: The ID of the GitHub App.

5. `private-key` (required)
   - Description: The private key of the GitHub App.

6. `component-name` (required)
   - Description: The directory where the component manifests are located.

## Example Usage

Here's an example of how to include this Action in your GitHub Actions workflow:

```yaml
name: GitOps Image Tag Update

on:
  push:
    branches:
      - dev

jobs:
  update-image-tag:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Update image tag in GitOps
      id: update-gitops-image
      uses: ditkrg/update-gitops-image@v1
      with:
        owner: ${{ github.repository_owner }}
        repo: my-repo
        image-tag: latest
        app-id: ${{ secrets.GITOPS_RUNNER_APP_ID }}
        private-key: ${{ secrets.GITOPS_RUNNER_PRIVATE_KEY }}
        component-name: my-component

    # Add more steps as needed for your workflow
```

This example runs the Update GitOps Action when there is a push to the `dev` branch, allowing you to automate the process of updating image tags in a GitOps repository and creating pull requests for the changes.
