// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var async = require('async');
var fs = require('fs');
var path = require('path');
var origin = require('./application')();
var schedule = require('node-schedule');
var util = require('util');

// private
var pluginsLoc = path.posix.join(__dirname,'../plugins/scheduler');
var jobs = [];

// event handlers
function handleRun() {
  // console.log('run:', this.id);
};
function handleScheduled() {
  // console.log('scheduled:', this.id);
};
function handleCanceled() {
  // console.log('cancelled:', this.id);
};

// public
var scheduler = exports = module.exports = {
  init: function() { },

  schedule: function(criteria, callback) {
    console.log('Scheduler: scheduling job for', criteria);

    var job = schedule.scheduleJob(criteria, handleScheduled);
    job.id = Date.now();
    job.callback = callback;
    jobs.push(job);

    job.on('run', handleRun);
    job.on('canceled', handleCanceled);
  },

  cancelAll: function() {
    while(jobs.length !== 0) jobs.pop().cancel();
  }
};

function loadSchedulerPlugins() {
    console.log(__dirname, pluginsLoc);
    fs.readdir(pluginsLoc, function dirRead(error, files) {
        if(error) return console.log(error);
        async.each(files, function iterator(file, done) {
            var base = path.basename(file,path.extname(file));
            var pluginLoc = path.join(pluginsLoc, base);
            try {
                var plugin = require(pluginLoc);
            }
            catch(e) {
                return console.log(e);
            }
            plugin.init(scheduler);
        }, function doneEach(error) {
            if(error) return console.log(error);
            console.log('loaded all');
        });
    });
};

// init on serverStarted
origin.on('serverStarted', function onServerStarted(server) {
    loadSchedulerPlugins();
});
