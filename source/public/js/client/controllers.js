/* global pryv, angular, _ */


'use strict';

/* Controllers */
var i = 0;

angular.module('pryvBridge.controllers', []).
  controller('AppCtrl', function ($scope, $http) {
    console.log('AppCtrl');
  }).
  controller('SigninPryvCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {
      console.log('SigninPryvCtrl');


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
          signedIn: function (connection, languageCode) {
            var username = connection.username;
            var appToken = connection.auth;
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
          signedOut: function () {
            $rootScope.pryv = null;
            _.defer(function ($rs, $l) {
              $l.path('/signin-pryv');
              $rs.$apply();
            }, $rootScope, $location);
          },
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
          loadAppData(data.appId, data.pryvStaging);
          if ($rootScope.pryvDomain === 'rec.la' ||
            $rootScope.pryvDomain === 'pryv.in') {
            pryv.Auth.config.registerURL = { host: 'reg.pryv.in', 'ssl': true};
          }

          settings.requestingAppId = $rootScope.appId;
          if (!$rootScope.pryv) {
            console.log(pryv.Auth.config);
            pryv.Auth.setup(settings);
          }

        }).
        error(function (data, status, headers, config) {
          console.log('SigninPryvCtrl.error', data, status, headers, config);
          $scope.name = 'Error!';
        });



      var loadAppData = function (appId, staging) {
        var url;
        if (staging) {
          url = 'https://reg.pryv.in/apps/';
        } else {
          url = 'https://reg.pryv.io/apps/';
        }
        $http({
          method: 'GET',
          url: url
        }).success(function (data) {
          if (data && data.apps && data.apps.length) {
            for (var i in data.apps) {
              var app = data.apps[i];
              if (app.id === appId) {
                $rootScope.appName = app.displayName;
                $rootScope.appIconUrl = app.iconURL;
                break;
              }
            }
          }
        });
      };

  }]).
  controller('OverviewCtrl', ['$scope', '$rootScope', '$http', '$location', '$window',
    function ($scope, $rootScope, $http, $location, $window) {
    // $rootScope.pryv mean loggedIn
    if ($rootScope.pryv) {
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


      $scope.addAccount = function () {
        $window.location.href = '/auth/service';
      };

      $scope.editAccount = function (aid) {
        _.defer(function ($rs, $l) {
          $l.path('/configure/' + aid);
          $rs.$apply();
        }, $rootScope, $location);
      };
      $scope.removeAccount = function (aid) {
        if (aid) {
          var confirmRemove = $window.confirm('Are you sure you want to remove this account?');
          if (confirmRemove) {
            $http({ method: 'DELETE',
                    url : '/api/config/' + aid
            }).success(function () {
                $scope.accounts = _.filter($scope.accounts, function (account) {
                  return account.aid !== aid;
                });
              });
          }
        }
      };
    } else {
      _.defer(function ($rs, $l) {
        $l.path('/signin-pryv/');
        $rs.$apply();
      }, $rootScope, $location);
    }
  }]);
