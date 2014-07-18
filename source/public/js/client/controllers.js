/* global pryv, angular, _ */


'use strict';

/* Controllers */

angular.module('pryvBridge.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
  /*
    $http({
      method: 'GET',
      url: '/api/name'
    }).
    success(function (data, status, headers, config) {
      $scope.name = data.name;
    }).
    error(function (data, status, headers, config) {
      $scope.name = 'Error!';
    });
  */

  }).
  controller('SigninPryvCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {
    var requestedPermissions = [
      {
        'streamId': '*',
        'level': 'manage'
      }
    ];
    //console.log(config, 'config');

// ----------------------- //
    var settings = {
      requestingAppId: 'pryv-csv-importer',
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
      //if($rootScope.pryv)
    pryv.Auth.setup(settings);

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
        $scope.acounnts = data.accounts;
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

  }]);
