// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var SchedulerView = require('./views/schedulerView.js');
  var SchedulerSidebarView = require('./views/schedulerSidebarView.js');

  var featurePermissions = ["*/*:create","*/*:read","*/*:update","*/*:delete"];
  var isReady = false;
  var tasksModel = new Backbone.Model({
    enabledTasks: [],
    disabledTasks: []
  });

  Origin.on('app:dataReady login:changed', function() {
  	if (Origin.permissions.hasPermissions(featurePermissions)) {
      preloadData();
  		Origin.globalMenu.addItem({
        "location": "global",
        "text": "Scheduler",
        "icon": "fa-clock-o",
        "callbackEvent": "scheduler:open"
      });
  	}
  });

  Origin.on('globalMenu:scheduler:open', function() {
    Origin.router.navigate('#/scheduler', {trigger: true});
  });

  Origin.on('router:scheduler', function(location, subLocation, action) {
    // unauthorised users can turn back around
    if (!Origin.permissions.hasPermissions(featurePermissions)) {
      Origin.Notify.alert({
        type: 'warning',
        title: "No tresspassing",
        text: "You aren't authorised to view this area."
      });
      Origin.router.navigate('#/dashboard');
      return;
    }
    if(isReady) route();
    else Origin.on('scheduler:dataReady', route);
  });

  Origin.on('scheduler:tasksUpdated', storeTasks);

  function preloadData() {
    Origin.trigger('scheduler:dataReady');
    $.ajax('api/scheduler/tasks')
      .done(function(data, textStatus, jqXHR) {
        storeTasks(data);
        isReady = true;
        Origin.trigger('scheduler:dataReady');
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        Origin.Notify.alert({
          type: "error",
          text: errorThrown
        });
      });
  };

  function storeTasks(taskData) {
    var split = _.partition(taskData, function(item) { return (item.enabled === true); });
    tasksModel.set({
      enabledTasks: split[0],
      disabledTasks: split[1]
    });
  };

  function route() {
    Origin.router.createView(SchedulerView, { model: tasksModel });
    Origin.sidebar.addView(new SchedulerSidebarView().$el, {
        "backButtonText": "Back to dashboard",
        "backButtonRoute": "/#/dashboard"
    });
  }
});
