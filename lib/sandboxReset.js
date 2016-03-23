// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var database = require('./database');
var origin = require('./application')();
var scheduler = require('./scheduler');

// HACK
var tenantId = '565f3042dca12e4b3702e578';

origin.on('serverStarted', function onServerStarted(server) {
  setTimeout(function() {
    scheduler.schedule('0-59 * * * * *', function onScheduled() {
      console.log('clean sandpit');
      database.getDatabase(function gotDb(error, db) {
        // delete course
        // delete assets (and local files)
      }, tenantId);
    });
  });
});
