# Divergebot-action

A Github action to nag your colleagues about diverging branches and unmerged commits.

Given a list of head...base branches to compare, Divergebot notifies a slack webhook with a breakdown
of the umerged commit counts, grouped by author whenever it detect that the two branches have diverged. 
In projects where multiple, long-lived branches (e.g. `release/2.3`, `release/2.4`) exist, this can be 
an effective mechanism to encourage contributors to merge their commits across all the relevant branches.

## Usage

```yaml

name: Run Divergebot
on:
  schedule:
    - cron: 0 8 * * *
  workflow_dispatch:
jobs:
  divergebot:
    runs-on: ubuntu-latest
    steps:
      - run: echo "running divergebot"
      - uses: afiore/divergebot@v0.3.0
        with:
          branches_to_compare: '["main...release/2.0.x", "main...release/3.0.x"]'
          slack_webhook_url: ${{ secret.DIVERGEBOT_SLACK_WEBHOOK_URL }}
          github_api_token: ${{ secrets.GITHUB_TOKEN }}
          github_owner_repo: ${{ env.GITHUB_REPOSITORY }}
```

Here we configure the action to be run as part of a workflow scheduled daily a 8am, comparing the `main` branch with two release branches of the current repository.
 As we add the `workflow_dispatch` event, we will also be able to trigger this workflow manually from the Github UI.

### Inputs

##### branches_to_compare

This is a json encoded list of branches to be compared. Each list item is a string representing a pair of branches separated by `...`.

##### slack_webhook_url

This the a Slack webhook URL that the action will hit should the compared branches 
have diverged.

##### github_api_token

The Github API token to be used in order to compare the two branches

##### github_owner_repo

A string identifying the Github owner and repository, separated by a slash (e.g. `afiore/divergebot`).

## Local development

Github action inputs are implemented as environment variables, so it is possible to test this action locally as follows:

```bash
INPUT_BRANCHES_TO_COMPARE='["release/other...main"]' INPUT_GITHUB_API_TOKEN=$MY_TOKEN INPUT_SLACK_WEBHOOK_URL=$MY_WEBHOOK_URL INPUT_GITHUB_OWNER_REPO=owner/repo node index.js
```