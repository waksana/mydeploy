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
{
  "name": "project_name",
  "before": "echo hello world",
  "after": "echo hello world $env$name$branch",
  "deploy": {
    "dev": {
      "branch": "master",
      "ssh": ["ssh dest_host $cmd", "ssh username@host $cmd", "ssh dest_host2 \"sudo -u user2 $cmd\""],
      "path": "/etc/projects"
    }
  }
}
```

## step 3

at project root, run

```
mdp dev
```

if you want to run cmd
```
mdp dev ls
```
