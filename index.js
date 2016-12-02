require('shelljs/global');
const path = require('path');
const config = require(path.resolve('.', 'deploy.json'));
const cp = require('child_process');
const env = process.argv[2];
const run = process.argv.slice(3);
const deploy = config.deploy[env];

const ssht = templ => cmd => templ.replace('$cmd', cmd);
const silent = {silent: true};

if(deploy) {
  if(!(deploy.ssh instanceof Array)) deploy.ssh = [deploy.ssh];
  if(run.length > 0) {
    deploy.ssh.forEach(templ => {
      const ssh = ssht(templ);
      echo(run.join(' ')).exec(ssh(''));
    });
  }
  else {
    const tmpdir = `~/.deploy/${config.name}_${env}`;
    const deployPath = path.resolve(deploy.path, `${config.name}_${env}`);

    if(exec(`stat ${tmpdir}`, silent).code == 1) {
      mkdir('-p', tmpdir);
      exec(`git archive --format=tar ${deploy.branch}`, silent).exec(`tar x -C ${tmpdir}`);
      exec(deploy.before);
      deploy.ssh.forEach(templ => {
        const ssh = ssht(templ);
        exec(ssh(`rm -rf ${deployPath}`));
        exec(ssh(`mkdir -p ${deployPath}`));
        exec(`tar cC ${tmpdir} .`, silent).exec(ssh(`tar xC ${deployPath}`));
        echo(`cd ${deployPath} && ${deploy.after}`).exec(ssh(''));
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
