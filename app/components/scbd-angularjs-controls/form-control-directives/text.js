define(['app', 'text!./text.html', 'jquery', 'angular-localizer','angular-sanitize'], function(app, template, $) {
  'use strict';
  app.directive('afcText', function() {
    return {
      restrict: 'EAC',
      scope: {
        binding: "=ngModel",
        title: '@',
        placeholder: '@',
        rows: '@',
        help: '@',
        name: '@?',
        preview: '@?',
      },
      templateUrl: '/text.html',
      controller: function($scope, $element, $attrs) {
        $('textarea', $element).each(function() {
          for (var i in $attrs)
            if (i.substr(0, 1) != '$' && !$scope[i] && i != 'ngModel')
              $(this).attr(i, $attrs[i]);
        });
      },
    };
  });
});
