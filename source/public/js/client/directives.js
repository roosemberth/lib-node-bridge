'use strict';

/* Directives */

angular.module('pryvBridge.directives', []).
  directive('appVersion', function (version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  });
