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
      $.ajax('api/scheduler/enable/' + $(event.currentTarget).attr('data-id'), { method: 'PUT' })
        .done(function(data, textStatus, jqXHR) {
          // TODO add to this.model.enabledTasks
          // TODO remove from this.model.disabledTasks
          Origin.router.navigate('#/scheduler', {trigger: true});
          alert('great success');
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
          // TODO remove from this.model.enabledTasks
          // TODO add to this.model.disabledTasks
          Origin.router.navigate('#/scheduler', {trigger: true});
          alert('great success');
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
