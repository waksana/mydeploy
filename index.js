require('shelljs/global');
const path = require('path');
const config = require(path.resolve('.', '.deploy.js'));
const cp = require('child_process');
const env = process.argv[2];
const run = process.argv.slice(3);
const deploy = config.deploy[env];

const ssht = templ => cmd => templ.replace('$cmd', cmd);
const silent = {silent: true};

const replace = (str, obj) => Object.keys(obj).reduce((r, c) => r.replace('$'+c, obj[c]), str);

if(deploy) {
  if(!(deploy.ssh instanceof Array)) deploy.ssh = [deploy.ssh];
  if(run.length > 0) {
    deploy.ssh.forEach(templ => {
      const ssh = ssht(templ);
      echo(run.join(' ')).exec(ssh(''));
    });
  }
  else {
    deploy.env = env;
    deploy.name = `${config.name}_${env}`;
    const tmpdir = `~/.deploy/${deploy.name}`;
    const deployPath = path.resolve(deploy.path, deploy.name);
    const before = replace(config.before || '', deploy);
    const after = replace(config.after || '', deploy);

    if(exec(`stat ${tmpdir}`, silent).code == 1) {
      mkdir('-p', tmpdir);
      exec(`git archive --format=tar ${deploy.branch} | tar x -C ${tmpdir}`);
      if(before.trim() != '') exec(before);
      deploy.ssh.forEach(templ => {
        const ssh = ssht(templ);
        exec(ssh(`rm -rf ${deployPath}`));
        exec(ssh(`mkdir -p ${deployPath}`));
        exec(`tar cC ${tmpdir} . | ` + ssh(`tar xC ${deployPath}`));
        if(after.trim() != '')
          echo(`cd ${deployPath} && ${after}`).exec(ssh(''));
        rm('-rf', tmpdir);
      });
    }
    else {
      echo(`${tmpdir} existed`);
    }
  }
}
else {
  echo(Object.keys(config.deploy).toString());
}
