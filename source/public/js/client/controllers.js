/* global pryv, angular, _ */


'use strict';

/* Controllers */

var i = 0;

angular.module('pryvBridge.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

  }).
  controller('SigninPryvCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {


      var requestedPermissions = [{
          'streamId': '*',
          'level': 'manage'
      }];

      // Pryv Login dialog configuration //
      var settings = {
        requestedPermissions: requestedPermissions,
        returnURL: '', // set this if you don't want a popup
        spanButtonID: 'loginWithPryv', // (optional)
        callbacks: {
          initialization: function () {},
          needSignin: function () {},
          needValidation: function () {},
          accepted: function (username, appToken, languageCode) {
            console.log('** SUCCESS! username:' + username +
              ' appToken:' + appToken +
              ' lang:' + languageCode);

            $rootScope.pryv = {
              token: appToken,
              username: username
            };

            $http.post('/login/pryv', $rootScope.pryv)
              .success(function() {
                _.defer(function ($rs, $l) {
                  $l.path('/overview');
                  $rs.$apply();
                }, $rootScope, $location);
              })
              .error(function() {
                _.defer(function ($rs, $l) {
                  $l.path('/signin-pryv');
                  $rs.$apply();
                }, $rootScope, $location);
              });


          }.bind(this),
          refused: function (reason) {
            console.log('** REFUSED! ' + reason);
          },
          error: function (code, message) {
            console.log('** ERROR! ' + code + ' ' + message);
          }
        }
      };

      // Get the current configuration
      $http({
        method: 'GET',
        url: '/api/domain'
      }).
        success(function (data, status, headers, config) {
          console.log('SigninPryvCtrl.success', data, status, headers, config);
          $rootScope.pryvDomain = data.pryvDomain;
          $rootScope.pryvStaging = data.pryvStaging;
          $rootScope.appId = data.appId;

          if ($rootScope.pryvDomain === 'rec.la' ||
            $rootScope.pryvDomain === 'pryv.in') {
            pryv.Auth.config.registerURL = { host: 'reg.pryv.in', 'ssl': true};
          }

          settings.requestingAppId = $rootScope.appId;

          console.log( pryv.Auth.config);
          pryv.Auth.setup(settings);

        }).
        error(function (data, status, headers, config) {
          console.log('SigninPryvCtrl.error', data, status, headers, config);
          $scope.name = 'Error!';
        });




  }]).
  controller('OverviewCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {
    $http({
      method: 'GET',
      url: '/api/overview'
    }).
      success(function (data, status, headers, config) {
        console.log('OverviewCtrl.success', data, status, headers, config);
        $scope.name = data.name;
        $scope.accounts = data.accounts;
      }).
      error(function (data, status, headers, config) {
        console.log('OverviewCtrl.error', data, status, headers, config);
        $scope.name = 'Error!';
      });


      $scope.addAccount = function() {
        _.defer(function ($rs, $l) {
          $l.path('/signin-service');
          $rs.$apply();
        }, $rootScope, $location);
      };

      $scope.editAccount = function(aid) {
        _.defer(function ($rs, $l) {
          $l.path('/configure/' + aid);
          $rs.$apply();
        }, $rootScope, $location);
      };

  }]);
