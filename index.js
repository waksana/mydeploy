#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const config = require(path.resolve('.', '.deploy.js'));
const cp = require('child_process');

const env = process.argv[2];
const run = process.argv.slice(3);

const sh = (cmd, stdin, opts) => new Promise((res, rej) => {
    console.log('>', cmd);
    var child = cp.exec(cmd, opts, err => {
        if(err) rej(err);
        else res();
    });

    if(util.isBuffer(stdin) || util.isString(stdin)) {
        console.log('>>>', stdin.toString());
        child.stdin.end(stdin);
    }
    else if(stdin && util.isFunction(stdin.pipe)) {
        process.stdout.write('>>> ');
        stdin.pipe(process.stdout);
        stdin.pipe(child.stdin);
    }

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
});

const ssht = templ => cmd => templ.replace('$cmd', cmd);

const replace = (str, obj) =>
['env', 'name', 'path', 'branch']
.filter(key => obj[key])
.reduce((res, key) => res.replace('$' + key, obj[key]), str);

const wrapArr = val => (val instanceof Array) ? val: [val];

async function task(deploy) {
    const tmpdir = `${os.homedir()}/.deploy/${deploy.name}`;
    const deployPath = path.resolve(deploy.path, deploy.name);
    const before = replace(deploy.before || config.before || '', deploy);
    const after = replace(deploy.after || config.after || '', deploy);

    if(fs.existsSync(tmpdir))
        return console.error(tmpdir, 'existed');

    await sh(`mkdir -p ${tmpdir}`);
    await sh(`git archive --format=tar ${deploy.branch} | tar x -C ${tmpdir}`);
    await sh(`git submodule foreach 'git archive --format=tar HEAD | tar x -C ${tmpdir}/$path'`);
    if(before.trim() != '') await sh(before, null, {cwd: tmpdir});
    for(let ssh of deploy.ssh) {
        await sh(ssh(`rm -rf ${deployPath}`));
        await sh(ssh(`mkdir -p ${deployPath}`));
        await sh(`tar cC ${tmpdir} . | ` + ssh(`tar xC ${deployPath}`));
        if(after.trim() != '')
            await sh(ssh(''), `cd ${deployPath} && ${after}`)
        await sh(`rm -rf ${tmpdir}`);
    }
}

const deploy = config.deploy[env];

if(!deploy) {
  console.log(Object.keys(config.deploy).toString());
  process.exit(1);
}

deploy.env = env;
deploy.name = `${config.name}_${env}`;
deploy.ssh = wrapArr(deploy.ssh).map(ssht);

process.stdin.once('readable', async function() {
  const chunk = process.stdin.read();
  if(chunk) {
      let cmd = run.join(' ');
      process.stdin.unshift(chunk);
      for(let ssh of deploy.ssh) {
          await sh(ssh(cmd), process.stdin);
      }
  }
  else {
    if(run.length > 0) {
      let cmd = run.join(' ');
      for(let ssh of deploy.ssh) {
          await sh(ssh(''), cmd);
      }
    }
    else {
      await task(deploy);
    }
    process.exit();
  }
});
