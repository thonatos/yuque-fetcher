## workflow
workflow "Push" {
  on = "push"
  resolves = ["npm release"]
}

workflow "Pull Request" {
  on = "pull_request"
  resolves = ["npm check"]
}

## actions
action "npm install" {
  uses = "docker://node:lts-slim"
  args = "npm install"
}

action "npm ci" {
  uses = "docker://node:lts-slim"
  needs = ["npm install"]
  env = {
    YUQUE_ENDPOINT = "https://www.yuque.com/api/v2/"
    YUQUE_GROUP = "eggjs-dev"
  }
  secrets = [
    "YUQUE_TOKEN"
  ]
  args = "npm run ci"
}

action "npm build" {
  uses = "docker://node:lts-slim"
  needs = ["npm ci"]
  args = "npm run build"
}

## target
action "npm check" {
  uses = "thonatos/github-actions-workman@1.4.0-Marketplace"
  needs = ["npm ci"]
  args = "workman check"
  secrets = [
    "GITHUB_TOKEN",
    "NPM_TOKEN"
  ]
}

action "npm release" {
  uses = "thonatos/github-actions-workman@1.4.0-Marketplace"
  needs = ["filter master", "npm build"]
  args = "workman release"
  secrets = [
    "GITHUB_TOKEN",
    "NPM_TOKEN"
  ]
}

## filter
action "filter master" {
  uses = "actions/bin/filter@3c0b4f0e63ea54ea5df2914b4fabf383368cd0da"
  secrets = ["GITHUB_TOKEN"]
  args = "branch master"
}
