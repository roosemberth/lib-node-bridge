'use strict';

// Declare app level module which depends on filters, and services

angular.module('pryvBridge', [
  'pryvBridge.controllers',
  'pryvBridge.filters',
  'pryvBridge.services',
  'pryvBridge.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/signin-pryv', {
      templateUrl: '/views/signin-pryv.html',
      controller: 'SigninPryvCtrl'
    }).
    when('/signin-service', {
      templateUrl: '/views/signin-service.html',
      controller: 'SigninServiceCtrl'
    }).
    when('/overview', {
      templateUrl: '/views/overview.html',
      controller: 'OverviewCtrl'
    }).
    when('/configure/:aid', {
      templateUrl: '/views/configure.html',
      controller: 'ConfigureCtrl'
    }).
    otherwise({
      redirectTo: '/signin-pryv' + location.search
    });

  $locationProvider.html5Mode(true);
});
