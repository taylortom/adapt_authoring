// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var database = require('../../lib/database');
var origin = require('../../lib/application')();

// TODO do this another way
var tenantId = '565f3042dca12e4b3702e578';
var superUserId = '';

exports = module.exports = {
    init: function(scheduler) {
        scheduler.schedule('0 * * * * *', function onScheduled() {
          database.getDatabase(function gotDb(error, db) {
              db.retrieve('course', {}, function gotCourses(error, courses) {
                  async.each(courses, function iterator(course, done) {
                      console.log(course.title, course.createdBy);
                  });
              });
            // delete course
            // delete assets (and local files)
          }, tenantId);
        });
    }
}
