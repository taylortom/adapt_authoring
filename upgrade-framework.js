var app = require('./lib/application')();
var exec = require('child_process').exec;
var fs = require('fs-extra');

var config = require('./conf/config.json');

app.run({
  skipVersionCheck: true,
  skipStartLog: true
});

app.on('serverStarted', function () {
  getLatestGitVersion('temp/' + config.masterTenantID + '/adapt_framework', function(error, version) {
    console.log(error, version);
  });
});

function getLatestGitVersion(dir, callback) {
  var opts = {
    cwd: dir,
    stdio: [0, 'pipe', 'pipe']
  };
  var c1 = exec('git fetch --tags origin', opts);
  c1.stdout.on('data', console.log);
  c1.on('exit', function (error, stdout, stderr) {
    if (error) return callback(error);
    var tags = "";
    var c2 = exec('git tag', opts);
    c2.stdout.on('data', function(data) {
      tags += data;
    });
    c2.stderr.on('data', console.log);
    c2.on('exit', function (error) {
      if (error) return callback(error);
      var tagsArr = tags.split('\n');
      callback(null, tagsArr[tagsArr.length-2]);
    });
  });
}

function installGitTag(dir, tag, callback) {
  var child = exec('git reset --hard ' + latestFramework + ' && npm install', opts);
  child.stdout.on('data', console.log);
  child.on('exit', function (error, stdout, stderr) {
    if (error) return exitUpgrade(error);
  });
}

function exitUpgrade(error, code) {
  console.log(error || 'Framework upgraded successfully!');
  process.exit(code || 0);
}
