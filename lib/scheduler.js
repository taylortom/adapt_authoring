// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var async = require('async');
var schedule = require('node-schedule');
var util = require('util');

// private
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
exports = module.exports = {
  init: function() {
    // nothing to do really...
  },

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

// HACK until I figure out how to load this
var sandboxReset = require('./sandboxReset');
