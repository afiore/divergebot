const core = require('@actions/core');
const github = require('@actions/github');
const { IncomingWebhook } = require('@slack/webhook');

async function apiCall(apiToken, owner, repo, base, head) {
  const octokit = github.getOctokit(apiToken)
  return await octokit.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", {
    owner: owner,
    repo: repo,
    base: base,
    head: head,
  })
}

function commitCountsByLogin(result) {
  const commitCountsByLogin = result.data.commits.reduce((commitCounts, commit) => {
    if (commit.author !== null) {
      if (commitCounts[commit.author.login]) {
        commitCounts[commit.author.login].count += 1
      } else {
        commitCounts[commit.author.login] = {
          count: 1,
          avatar_url: commit.author.avatar_url
        }
      }
    }
    return commitCounts
  }, {})

  return Object.entries(commitCountsByLogin).map(x => {
    return {
      login: x[0],
      count: x[1].count,
      avatar_url: x[1].avatar_url
    }
  }).sort((a, b) => {
    if (a.count == b.count) { return 0 }
    else if (a.count < b.count) { return 1 }
    else return -1
  })
}

function buildMessage(owner, repo, base, head, commitCountsByLogin, slackUserIds) {
  const commitCount = commitCountsByLogin.reduce((count, c) => count + c.count, 0)
  const payload = {
    "text": `Branch ${head} of ${repo} has diverged from base branch ${base} of ${commitCount} commits`,
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `:warning: Branch ${head} of ${repo} has diverged from base branch ${base} of ${commitCount} commits`,
          "emoji": true
        }

      },
      {
        "type": "divider"
      }
    ]
  }

  commitCountsByLogin.forEach(c => {
    const slackHandleOrGHlogin = slackUserIds[c.login] ? `<@${slackUserIds[c.login]}>` : c.login
    console.log(`got ${slackHandleOrGHlogin} by looking up ${c.login} into ${slackUserIds}`)
    payload.blocks.push({
      "type": "context",
      "elements": [
        {
          "type": "image",
          "image_url": c.avatar_url,
          "alt_text": `${c.login} avatar`
        },
        {
          "type": "mrkdwn",
          "text": `*${c.login}* ${c.count} commits`
        }
      ]
    })
  })

  //Mention at most three committers, for better readability
  const mentions = commitCountsByLogin
    .flatMap(c => slackUserIds[c.login] ? [`<@${slackUserIds[c.login]}>`] : [])
    .slice(0, 3)
    .join(" ")

  payload.blocks.push({ "type": "divider" })
  payload.blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `${mentions} 👉 <https://github.com/${owner}/${repo}/compare/${head}...${base}|Compare branches on Github and open a PR!>`
    }
  })


  return payload
}

branchesToCompare = JSON.parse(core.getInput("branches_to_compare"))

branchesToCompare.forEach((toCompare) => {
  var slackUserIds
  const apiToken = core.getInput("github_api_token", { required: true })
  const ownerRepo = core.getInput("github_owner_repo", { required: true })

  const [head, base] = toCompare.split("...")
  const [owner, repo] = ownerRepo.split("/")

  const webhookUrl = core.getInput("slack_webhook_url", { required: true })
  if (core.getInput("slack_user_ids")) {
    slackUserIds = JSON.parse(core.getInput("slack_user_ids"))
  } else {
    slackUserIds = {}
  }

  apiCall(apiToken, owner, repo, base, head).then((response) => {
    const counts = commitCountsByLogin(response)
    if (counts.length > 0) {
      const slackMessage = buildMessage(owner, repo, base, head, counts, slackUserIds)

      const slack = new IncomingWebhook(webhookUrl)
      slack.send(slackMessage).catch(err => core.setFailed(err.message))
    }
  }, err => {
    console.error(err)
    core.setFailed(err.message)
  })
})