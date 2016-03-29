// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var SchedulerView = OriginView.extend({
    tagName: 'div',
    className: 'scheduler',

    events: {
      'click .btn.enable': 'enableTask',
      'click .btn.disable': 'disableTask'
    },

    preRender: function() {
      Origin.trigger('location:title:update', { title: "Scheduler" });
    },

    postRender: function() {
      this.setViewToReady();
    },

    enableTask: function(event) {
      event && event.preventDefault();
      var taskId = $(event.currentTarget).attr('data-id');
      $.ajax('api/scheduler/enable/' + taskId, { method: 'PUT' })
        .done(function(data, textStatus, jqXHR) {
          Origin.trigger('scheduler:tasksUpdated', data);
          Origin.router.navigate('#/scheduler', {trigger: true});
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: "error",
            text: errorThrown
          });
        });
    },

    disableTask: function(event) {
      event && event.preventDefault();
      $.ajax('api/scheduler/disable/' + $(event.currentTarget).attr('data-id'), { method: 'PUT' })
        .done(function(data, textStatus, jqXHR) {
          Origin.trigger('scheduler:tasksUpdated', data);
          Origin.router.navigate('#/scheduler', {trigger: true});
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: "error",
            text: errorThrown
          });
        });
    }
  }, {
    template: 'scheduler'
  });

  return SchedulerView;
});
