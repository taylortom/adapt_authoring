// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var database = require('../../lib/database');
var fs = require('fs');
var origin = require('../../lib/application')();
var usermanager = require('../../lib/usermanager');

var user;

exports = module.exports = {
	init: function(enabledBy, cb) {
		usermanager.retrieveUser({ _id: enabledBy }, function gotUser(error, result) {
			if(error) return cb(error);
			user = result;
			cb();
		});
	},
	task: function() {
		database.getDatabase(function gotDb(error, db) {
				if(error) return console.log(error);
			  async.parallel([
				  function deleteCourses(cb) {
					  db.retrieve('course', {}, function gotDocs(error, docs) {
						  async.each(docs, function iterator(doc, done) {
							  if(doc.createdBy != user._id) {
									var courseId = doc._id;
									// console.log('Delete course', doc.title, '(' + doc.createdBy + ')');
									// TODO do this using contentmanager
									async.parallel([
										function deleteArticles(deleted) {
											db.destroy('article', { _courseId:courseId }, deleted);
										},
										function deleteBlocks(deleted) {
											db.destroy('block', { _courseId:courseId }, deleted);
										},
										function deleteClipboards(deleted) {
											db.destroy('clipboard', { _courseId:courseId }, deleted);
										},
										function deleteComponents(deleted) {
											db.destroy('component', { _courseId:courseId }, deleted);
										},
										function deleteConfigs(deleted) {
											db.destroy('config', { _courseId:courseId }, deleted);
										},
										function deleteContentobjects(deleted) {
											db.destroy('contentobject', { _courseId:courseId }, deleted);
										},
										function deleteCourseassets(deleted) {
											db.destroy('courseasset', { _courseId:courseId }, deleted);
										},
										function deleteCourse(deleted) {
											db.destroy('course', { _id:courseId }, deleted);
										}
									], function doneParallel(error) {
										if(error) return done(error);
										console.log('Deleted course', doc.title, '(' + doc.createdBy + ')');
									});
							  }
						  }, cb);
					  });
				  },
				  function deleteAssets(cb) {
					  db.retrieve('asset', {}, function gotDocs(error, docs) {
						  async.each(docs, function iterator(doc, done) {
							  if(doc.createdBy != user._id) {
									// console.log('Delete asset', doc.title, '(' + doc.createdBy + ')');
									async.parallel([
										function deleteFile(deleted) {
											fs.unlink(doc.path, deleted);
										},
										function deleteDoc(deleted) {
											db.destroy('asset', { _id:doc._id }, deleted);
										}
									], function doneParallel(error) {
										if(error) return done(error);
										console.log('Deleted asset', doc._id, '(' + doc.createdBy + ')');
									});
							  }
						  }, cb);
					  });
				  },
			  ], function done(error) {
				  if(error) console.log(error);
			  });
		}, user._tenantId);
	}
};
