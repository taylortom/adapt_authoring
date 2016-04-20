var app = require('./lib/application')();
var async = require('async');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var glob = require('glob');
var semver = require('semver');

var config = require('./conf/config.json');

var AUTO_RETRIES = 5;

app.run({
  skipVersionCheck: true,
  skipStartLog: true
});

app.on('serverStarted', upgrade);

function upgrade() {
  console.log('Starting upgrade');
  var frameworkDir = 'temp/' + config.masterTenantID + '/adapt_framework';
  getLatestGitVersion(frameworkDir, function(error, latestFrameworkVersion) {
    if(error) return exitUpgrade(error);
    console.log('Attempting to upgrade framework to', latestFrameworkVersion + '...');
    var opts = {
      cwd: frameworkDir,
      stdio: [0, 'pipe', 'pipe']
    };
    var child = exec('git reset --hard ' + latestFrameworkVersion + ' && npm install', opts);
    child.on('exit', function (error, stdout, stderr) {
      if (error) return exitUpgrade(error);
      console.log('  Successfully upgraded framework.');
      console.log('Attempting to upgrade plugins...');
      var child = exec('adapt install', opts);
      child.on('exit', function (error, stdout, stderr) {
        if (error) {
          if(AUTO_RETRIES > 0) {
            AUTO_RETRIES--;
            console.log('Plugin upgrade failed. Reattempting...');
            setTimeout(upgrade, 1000);
          } return exitUpgrade(error);
        }
        console.log('  Successfully upgraded plugins.');
        exitUpgrade();
      });
    });
  });
}

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

function exitUpgrade(error, code) {
  console.log(error || 'Framework upgraded successfully!');
  process.exit(code || 0);
}
