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

// private
// HACK
var tenantId = '565f3042dca12e4b3702e578';
var pluginsLoc = path.resolve('./scheduler');
var pluginStore = [];
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

/*
* Public exorts
*/

var Scheduler = exports = module.exports = function() {
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
          // cache data
          pluginStore.push(json);
          db.retrieve('task', { name: json.name }, function onRetrieved(error, docs) {
            if(docs.length !== 0) return done();
            db.create('task', json, done);
          });
        });
      }, cb);
    }
  ]);
};

Scheduler.prototype.schedule = function(criteria, callback) {
  console.log('Scheduler: scheduling job for', criteria);

  var job = schedule.scheduleJob(criteria, handleScheduled);
  job.id = Date.now();
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
  var responseData = [];
  database.getDatabase(function gotDb(error, db) {
    if(error) return handleErrorResponse(error,res);
    async.each(pluginStore, function iterator(plugin, done) {
      // TODO check permissions
      db.retrieve('task', { name: plugin.name }, function gotDoc(error, docs) {
        if(error) return handleErrorResponse(error,res);
        if(docs.length > 1) return handleErrorResponse(new Error('Multiple plugins with the name "' + plugin.name + '" found'),res);
        responseData.push(docs[0]);
        done();
      });
    }, function doneEach(error) {
      if(error) return handleErrorResponse(error,res);
      res.status(200).json(responseData);
    });
  }, tenantId);
});

rest.put('/scheduler/enable/:id', function (req, res, next) {
  var id = req.params.id;
  var userId = usermanager.getCurrentUser()._id;
  database.getDatabase(function gotDb(error, db) {
    if(error) return handleErrorResponse(error,res);
    // TODO check permissions
    db.update('task', { _id:id }, { enabled:true, enabledBy:userId }, function updatedDoc(error, doc) {
      if(error) return handleErrorResponse(error,res);
      res.status(200).send('Successfully enabled ' + doc.name);
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
      res.status(200).send('Successfully disabled ' + doc.name);
    });
  }, tenantId);
});

function handleErrorResponse(error, data, response) {
  if(response === null) response = data;
  response.status(500).send(error.toString() + '\n' + JSON.stringify(data,null,' '));
}
