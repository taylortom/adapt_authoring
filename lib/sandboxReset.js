// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var database = require('./database');
var origin = require('./application')();
var scheduler = require('./scheduler');

origin.on('serverStarted', function onServerStarted(server) {
  setTimeout(function() {
    scheduler.schedule('0-59 * * * * *', function onScheduled() {
      console.log('clean sandpit');
    });
  });
});
