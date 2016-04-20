var app = require('./lib/application')();
var fs = require('fs-extra');

app.run({
  skipVersionCheck: true,
  skipStartLog: true
});

app.on('serverStarted', function () {
  var opts = {
    cwd: 'temp/' + configFile.masterTenantID + '/adapt_framework',
    stdio: [0, 'pipe', 'pipe']
  }
  exec('git fetch origin', opts)
    .stdout.on('data', console.log)
    .stderr.on('data', console.log)
    .on('exit', function (error, stdout, stderr) {
      if (error) return callback(error);
      exec('git reset --hard ' + tagName + ' && npm install', opts)
        .stdout.on('data', console.log)
        .stderr.on('data', console.log)
        .on('exit', function (error, stdout, stderr) {
          if (error) return exitUpgrade(error);
          rimraf(configFile.root + opts.cwd + '/src/course', callback);
        });
    });
});

function exitUpgrade(error, code) {
  console.log(error || 'Framework upgraded successfully!');
  process.exit(code || 0);
}
