mydeploy
======

## step 1

```
npm install -g mydeploy
```

## step 2

at project root, create config

```
{
  "name": "project_name",
  "deploy": {
    "dev": {
      "branch": "master",
      "ssh": ["ssh dest_host $cmd", "ssh username@host $cmd", "ssh dest_host2 \"sudo -u user2 $cmd\""],
      "path": "/etc/projects",
      "before": "echo hello world",
      "after": "echo hello world"
    }
  }
}
```

## step 3

at project root, run

```
mydeploy dev
```

if you want to run cmd
```
mydeploy dev ls
```
