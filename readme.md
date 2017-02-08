mydeploy
======

## step 1

```
npm install -g mydeploy
```

## step 2

at project root, create config

.deploy.js
```
module.exports = {
  "name": "project_name",
  "before": "echo hello world",
  "after": "echo hello world $env$name$branch$path",
  "deploy": {
    "dev": {
      "branch": "master",
      "ssh": ["ssh dest_host $cmd", "ssh username@host $cmd", "ssh dest_host2 \"sudo -u user2 $cmd\""],
      "path": "/etc/projects"
    }
  }
}
```

the config is js so you can add logic

## step 3

at project root, run

```
de dev
```

if you want to run cmd
```
de dev ls
```
