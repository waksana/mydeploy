#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require(path.resolve('.', '.deploy.js'));
const cp = require('child_process');

const env = process.argv[2];
const run = process.argv.slice(3);

const sh = (...param) => {
  console.log(...param);
  console.log(cp.execSync(...param).toString());
}

const ssht = templ => cmd => templ.replace('$cmd', cmd);

const replace = (str, obj) =>
['env', 'name', 'path', 'branch']
.filter(key => obj[key])
.reduce((res, key) => res.replace('$' + key, obj[key]), str);

const wrapArr = val => (val instanceof Array) ? val: [val];

const task = deploy => {
  const tmpdir = `${os.homedir()}/.deploy/${deploy.name}`;
  const deployPath = path.resolve(deploy.path, deploy.name);
  const before = replace(config.before || '', deploy);
  const after = replace(config.after || '', deploy);

  if(!fs.existsSync(tmpdir)) {
    sh(`mkdir -p ${tmpdir}`);
    sh(`git archive --format=tar ${deploy.branch} | tar x -C ${tmpdir}`);
    sh(`git submodule foreach 'git archive --format=tar HEAD | tar x -C ${tmpdir}/$path'`);
    if(before.trim() != '') sh(before, {cwd: tmpdir});
    deploy.ssh.forEach(ssh => {
      sh(ssh(`rm -rf ${deployPath}`));
      sh(ssh(`mkdir -p ${deployPath}`));
      sh(`tar cC ${tmpdir} . | ` + ssh(`tar xC ${deployPath}`));
      if(after.trim() != '')
        sh(ssh(''), {input: `cd ${deployPath} && ${after}`})
      sh(`rm -rf ${tmpdir}`);
    });
  }
  else {
    sh(`echo ${tmpdir} existed`);
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

process.stdin.once('readable', () => {
  const chunk = process.stdin.read();
  if(chunk) {
    let cmd = run.join(' ');
    process.stdin.unshift(chunk);
    deploy.ssh.map(ssh => {
      const {stdin, stdout, stderr} = cp.exec(ssh(cmd));
      process.stdin.pipe(stdin);
      stdout.pipe(process.stdout);
      stderr.pipe(process.stderr);
    });
  }
  else {
    if(run.length > 0) {
      let cmd = run.join(' ');
      deploy.ssh.map(ssh => sh(ssh(''), {input: cmd}));
    }
    else {
      task(deploy);
    }
    process.exit();
  }
});
