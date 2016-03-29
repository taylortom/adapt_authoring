// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var async = require('async');
var database = require('./database');
var fs = require('fs-extra');
var klaw = require('klaw');
var path = require('path');
var permissions = require('./permissions');
var rest = require('./rest');
var schedule = require('node-schedule');
var usermanager = require('./usermanager');
var util = require('util');

/*
* Private parts
*/

var instance;

var pluginsLoc = path.resolve('./scheduler');
var pluginStore = [];
var jobs = [];

// HACK
var tenantId = '565f3042dca12e4b3702e578';

function getInstance() {
  if(!instance) {
    instance = new Scheduler();
  }
  return instance;
};

function getTasks(callback) {
  var tasks = [];
  database.getDatabase(function gotDb(error, db) {
    if(error) return callback(error);
    async.each(pluginStore, function iterator(plugin, done) {
      // TODO check permissions
      db.retrieve('task', { name: plugin.name }, function gotDoc(error, docs) {
        if(error) return callback(error);
        if(docs.length > 1) return callback(new Error('Multiple plugins with the name "' + plugin.name + '" found'));
        tasks.push(docs[0]);
        done();
      });
    }, function doneEach(error) {
      if(error) return callback(error);
      callback(null, tasks);
    });
  }, tenantId);
};

function enableTask(taskId) {
  async.each(pluginStore, function iterator(plugin, done) {
    if(taskId.toString() === plugin._id.toString()) {
      try {
        var taskFunc = require(plugin.dir, plugin.main);
        getInstance().schedule(plugin.interval, plugin._id, taskFunc);
      } catch(e) {
        console.log(e);
      }
      done();
    }
  });
};

function disableTask(taskId) {
  async.each(jobs, function iterator(job, done) {
    if(taskId.toString() === job.taskId.toString()) {
      job.cancel();
      done();
    }
  });
};

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



/*
* Public exports
*/

var Scheduler = function() {
  this.init();
};

Scheduler.prototype.init = function() {
  var db;
  async.waterfall([
    function getDb(cb) {
      database.getDatabase(cb, tenantId);
    },
    function loadTaskSchema(database, cb) {
      db = database;
      fs.readJson(path.join(pluginsLoc,'task.schema'), cb);
    },
    function addTaskModel(json, cb) {
      db.addModel('task', json, cb);
    },
    function getPluginDirs(schema, cb) {
      var dirs = [];
      klaw(pluginsLoc)
        .on('data', function(item) {
          if(item.path === pluginsLoc) return;
          if(item.stats.isDirectory()) dirs.push(item.path);
        })
        .on('end', function() {
          cb(null, dirs);
        });
    },
    function getPlugins(plugins, cb) {
      async.each(plugins, function iterator(plugin, done) {
        var packagePath = path.join(plugin, 'package.json');
        fs.readJson(packagePath, function jsonRead(error, json) {
          if(error) return done(error);
          json.dir = plugin;
          // cache data
          db.retrieve('task', { name: json.name }, function onRetrieved(error, docs) {
            if(docs.length !== 0) {
              // HACK assumption that length is 1
              pluginStore.push(docs[0]);
              return done();
            }
            db.create('task', json, function docCreated(error, doc) {
              if(error) return done(error);
              pluginStore.push(doc);
              done();
            });
          });
        });
      }, cb);
    },
    function startEnabledPlugins(cb) {
      async.each(pluginStore, function iterator(plugin, done) {
        if(plugin.enabled === true) enableTask(plugin._id);
      }, cb);
    }
  ]);
};

Scheduler.prototype.schedule = function(criteria, taskId, callback) {
  // console.log('Scheduler: scheduling job for', criteria, (taskId) ? taskId : '');
  if(!callback) {
    callback = taskId;
    taskId = undefined;
  }

  var job = schedule.scheduleJob(criteria, handleScheduled);
  job.id = Date.now();
  job.taskId = taskId;
  job.callback = callback;
  jobs.push(job);

  job.on('run', handleRun);
  job.on('canceled', handleCanceled);
};

Scheduler.prototype.cancelAll = function() {
  while(jobs.length !== 0) jobs.pop().cancel();
};

/**
* Routing
*/
permissions.ignoreRoute(/^\/api\/scheduler\/?.*$/);

rest.get('/scheduler/tasks', function (req, res, next) {
  getTasks(function gotTasks(error, tasks) {
    if(error) return handleErrorResponse(error,res);
    res.status(200).json(tasks);
  });
});

rest.put('/scheduler/enable/:id', function (req, res, next) {
  var id = req.params.id;
  var userId = usermanager.getCurrentUser()._id;
  database.getDatabase(function gotDb(error, db) {
    if(error) return handleErrorResponse(error,res);
    // TODO check permissions
    db.update('task', { _id:id }, { enabled:true, enabledBy:userId }, function updatedDoc(error, doc) {
      if(error) return handleErrorResponse(error,res);
      enableTask(doc._id);
      getTasks(function gotTasks(error, updatedTasks) {
        if(error) return handleErrorResponse(error,res);
        res.status(200).json(updatedTasks);
      });
    });
  }, tenantId);
});

rest.put('/scheduler/disable/:id', function (req, res, next) {
  var id = req.params.id;
  database.getDatabase(function gotDb(error, db) {
    if(error) return handleErrorResponse(error,res);
    // TODO check permissions
    db.update('task', { _id:id }, { enabled:false, enabledBy:"" }, function updatedDoc(error, doc) {
      if(error) return handleErrorResponse(error,res);
      disableTask(doc._id);
      getTasks(function gotTasks(error, updatedTasks) {
        if(error) return handleErrorResponse(error,res);
        res.status(200).json(updatedTasks);
      });
    });
  }, tenantId);
});

function handleErrorResponse(error, data, response) {
  if(response === null) response = data;
  response.status(500).send(error.toString() + '\n' + JSON.stringify(data,null,' '));
}

exports = module.exports = getInstance;
