// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var EventEmitter = require('events');
var schedule = require('node-schedule');
var util = require('util');

var instance = new Scheduler();

function Scheduler() {
  console.log('Scheduler');
  EventEmitter.call(this);

  this.jobs = [];

  this.add = function(criteria, callback) {
    var job = schedule.scheduleJob(criteria, arguments);

    job.on('scheduled', function() {
      console.log('hi Chucck - how you doiiin');
    });

    this.jobs.push(job);

    return job;
  };

  this.cancelAll = function() {
    for(var i = 0, count = this.jobs.length; i < count; i++) {
      this.jobs[i].cancel();
    }
  };
}
util.inherits(Scheduler, EventEmitter);

/**
 * Module exports
 */
exports = module.exports = instance;
