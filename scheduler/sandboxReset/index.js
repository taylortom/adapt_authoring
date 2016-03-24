// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var database = require('lib/database');
var origin = require('lib/application')();

// TODO do this another way
var tenantId = '565f3042dca12e4b3702e578';
var superUserId = '56cdbc8872dd928029cc5160';

exports = module.exports = function() {
	database.getDatabase(function gotDb(error, db) {
		  async.parallel([
			  function deleteCourses(cb) {
				  db.retrieve('course', {}, function gotDocs(error, docs) {
					  async.each(docs, function iterator(doc, done) {
						  if(doc.createdBy != superUserId) {
								console.log('Delete course', doc.title, '(' + doc.createdBy + ')');
								// db.destroy(type, { _id:doc._id }, done);
						  }
					  }, cb);
				  });
			  },
			  function deleteAssets(cb) {
				  db.retrieve('asset', {}, function gotDocs(error, docs) {
					  async.each(docs, function iterator(doc, done) {
						  if(doc.createdBy != superUserId) {
								async.parallel([
									function deleteFile(deleted) {
										console.log('Delete file', doc.path);
										// fs.unlink(doc.path, deleted);
									},
									function deleteDoc(deleted) {
										console.log('Delete asset', doc.title, '(' + doc.createdBy + ')');
										// db.destroy(type, { _id:doc._id }, deleted);
									}
								], done);
						  }
					  }, cb);
				  });
			  },
		  ], function done(error) {
			  console.log('done:', error);
		  });
	}, tenantId);
}
