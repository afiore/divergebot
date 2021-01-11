# Divergebot-action

A Github action that nags your colleagues about diverging branches and unmerged commits.

Given a list of head...base branches to compare, Divergebot notifies a Slack webhook with a breakdown
of the umerged commit counts whenever it detect that the two branches have diverged. 
In projects where multiple, long-lived branches (e.g. `release/2.3`, `release/2.4`) exist, this can be 
an effective mechanism to encourage contributors to merge their commits across all the relevant branches
in a timely and proactive fashion.

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
      - uses: afiore/divergebot@v0.9.0
        with:
          branches_to_compare: '["main...release/2.0.x", "main...release/3.0.x"]'
          github_api_token: ${{ secrets.GITHUB_TOKEN }}
          github_owner_repo: ${{ env.GITHUB_REPOSITORY }}
          slack_webhook_url: ${{ secret.DIVERGEBOT_SLACK_WEBHOOK_URL }}
          slack_user_ids: '{"bob-github-login": "UP9ZKK410", "jane-github-login": "UB1ZGG221", ...}'
```

Here we configure the action to be run as part of a workflow scheduled daily a 8am, comparing the `main` branch with two release branches of the current repository.
We add the `workflow_dispatch` event, we will also be able to trigger this workflow manually from the Github UI.
### Inputs

##### branches_to_compare

This is a json encoded list of branches to be compared. Each list item is a string representing a pair of branches separated by `...`.

##### slack_webhook_url

This the a Slack webhook URL that the action will hit should the compared branches 
have diverged.

##### github_api_token

The Github API token to be used in order to compare the two branches.

##### github_owner_repo

A string identifying the Github owner and repository, separated by a slash (e.g. `afiore/divergebot`).

##### slack_user_ids

A json object allowing to resolve Slack user/member ids by their Github login. If supplied, this optional input will be used to enhance the generated slack message
with an explicit mention of the user associated to the commit. 

## Local development

Github action inputs are implemented as environment variables, so it is possible to test this action locally as follows:

```bash
INPUT_BRANCHES_TO_COMPARE='["release/other...main"]' INPUT_GITHUB_API_TOKEN=$MY_TOKEN INPUT_SLACK_WEBHOOK_URL=$MY_WEBHOOK_URL INPUT_GITHUB_OWNER_REPO=owner/repo node index.js
```
