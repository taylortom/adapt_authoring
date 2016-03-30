// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var database = require('../../lib/database');
var fs = require('fs');
var logger = require('../../lib/logger');
var origin = require('../../lib/application')();
var path = require('path');
var tenantmanager = require('../../lib/tenantmanager');
var usermanager = require('../../lib/usermanager');

var user;
var tenantName;
var assetPrefix;

exports = module.exports = {
	init: function(enabledBy, cb) {
		usermanager.retrieveUser({ _id: enabledBy }, function gotUser(error, result) {
			if(error) return cb(error);
			user = result;
			tenantmanager.retrieveTenant({ _id: user._tenantId }, function gotTenant(error, doc) {
				if(error) return cb(error);
				tenantName = doc.name;
				assetPrefix = path.join('data', doc.name);
				cb();
			});
		});
	},
	task: function() {
		/*
		logoutUsers(function usersLoggedOut(error) {
			if(error) return console.log(error);
			deleteData(function dataDeleted(error) {
				logger.log('info', 'Sandpit environment reset');
			});
		});
		*/
		deleteData(function dataDeleted(error) {
			if(error) return logger.log('error', error);
			logger.log('info', 'Sandpit environment reset');
		});
	}
};

function logoutUsers(cb) {
	var today = new Date();
	var yday = new Date(today.getUTCFullYear(), today.getUTCMonth(), (today.getUTCDate()-1));
	var query = {
		_tenantId: user._tenantId,
		lastAccess: { $gte: yday.toISOString() }
	}
	usermanager.retrieveUsers(query, function usersRetrieved(error, docs) {
		console.log("Log out:");
		for (var i = 0; i < docs.length; i++) {
			console.log(' ', docs[i].email, '(' + docs[i].lastAccess.toDateString() + ')');
		}
		cb();
	});
};

function deleteData(dataDeleted) {
	database.getDatabase(function gotDb(error, db) {
			if(error) return dataDeleted(error);
			async.parallel([
				function deleteCourses(cb) {
					db.retrieve('course', {}, function gotDocs(error, docs) {
						if(error) return cb(error);
						async.each(docs, function iterator(doc, done) {
							if(doc.createdBy.toString() != user._id.toString()) {
								var courseId = doc._id;
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
									logger.log('info', '  Deleted course', doc.title, '(' + doc.createdBy + ')');
								});
							}
						}, cb);
					});
				},
				function deleteAssets(cb) {
					db.retrieve('asset', {}, function gotDocs(error, docs) {
						if(error) return cb(error);
						async.each(docs, function iterator(doc, done) {
							if(doc.createdBy.toString() != user._id.toString()) {
								async.parallel([
									function deleteFile(deleted) {
										fs.unlink(path.join(assetPrefix, doc.path), deleted);
									},
									function deleteDoc(deleted) {
										db.destroy('asset', { _id:doc._id }, deleted);
									}
								], function doneParallel(error) {
									if(error) return done(error);
									logger.log('info', '  Deleted asset', doc._id, '(' + doc.createdBy + ')');
									done();
								});
							} else {
								done();
							}
						}, cb);
					});
				},
			], dataDeleted);
	}, user._tenantId);
};
