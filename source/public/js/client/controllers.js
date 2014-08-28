/* global pryv, angular, _ */


'use strict';

/* Controllers */
angular.module('pryvBridge.controllers', []).
  controller('AppCtrl', [function () {
    console.log('AppCtrl');
  }]).
  controller('SigninPryvCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {
      console.log('SigninPryvCtrl');




      // Pryv Login dialog configuration //
      var settings = {
        requestedPermissions: null,
        returnURL: '', // set this if you don't want a popup
        spanButtonID: 'loginWithPryv', // (optional)
        callbacks: {
          initialization: function () {
          },
          needSignin: function () {
          },
          needValidation: function () {
          },
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
              .success(function () {
                _.defer(function ($rs, $l) {
                  $l.path('/overview');
                  $rs.$apply();
                }, $rootScope, $location);
              })
              .error(function () {
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
          $rootScope.requestedPermissions = data.permissions;
          settings.requestedPermissions = data.permissions;
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
            $scope.serviceName = data.name;
            $scope.appId = data.appId;
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
                url: '/api/config/' + aid
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
    }]).
  controller('ConfigureCtrl', ['$scope', '$rootScope',
    '$location', '$http', '$routeParams',
    function ($scope, $rootScope, $location, $http, $routeParams) {
      if ($rootScope.pryv) {
        $scope.useSiUnits = false;
        $scope.siUnitsAvailable = false;
        $scope.errors = [];
        $scope.loading = {
          running: true,
          error: null
        };

        $scope.showErrorList = function () {
          return $scope.errors.length !== 0 && !$scope.loading.running;
        };

        var pushDetails = function () {
          $http({
            method: 'POST',
            url: '/api/config/' + $routeParams.aid,
            data: JSON.stringify({
              aid: $scope.aid,
              mapping: $scope.mapping,
              enabled: $scope.enabled
            })
          }).
            success(function (data, status, headers, config) {
              console.log('ConfigureCtrl.success', data, status, headers, config);
            }).
            error(function (data, status, headers, config) {
              console.log('ConfigureCtrl.error', data, status, headers, config);
            });
        };

        var pullDetails = function () {
          $scope.loading.running = true;
          $http({
            method: 'GET',
            url: '/api/config/' + $routeParams.aid
          }).
            success(function (data, status, headers, config) {
              $scope.loading.running = false;
              console.log('ConfigureCtrl.success', data, status, headers, config);
              $scope.aid = data.aid;
              $scope.mapping = data.mapping;
              $scope.enabled = data.enabled;
              $scope.critical = data.critical;
              $scope.message = data.message;
              $scope.profile = data.profile;
              extractErrors();
              detectSiUsage();
              console.log('$scope.useSiUnits', $scope.useSiUnits, $scope.siUnitsAvailable);
            }).
            error(function (data, status, headers, config) {
              $scope.loading.error = 'There was an error loading the account details';
              console.log('ConfigureCtrl.error', data, status, headers, config);
              $scope.name = 'Error!';
            });
        };

        $scope.switchToSI = function () {
          bfTraversal($scope.mapping, function (node) {
            if (node.events) {
              for (var i = 0, l = node.events.length; i < l; ++i) {
                if (node.events[i].availableTypes &&
                  node.events[i].availableTypes.length >= 0) {
                  for (var j = 0; j < node.events[i].availableTypes.length; ++j) {
                    if ($scope.useSiUnits && unitIsSi(node.events[i].availableTypes[j])) {
                      node.events[i].type = node.events[i].availableTypes[j];
                      console.log('useSi && unitIsSi');
                      break;
                    } else if (!$scope.useSiUnits && !unitIsSi(node.events[i].availableTypes[j])) {
                      node.events[i].type = node.events[i].availableTypes[j];
                      console.log('!useSi && !unitIsSi');

                      break;
                    }
                  }
                }
              }
            }
            return true;
          });
        };

        var extractErrors = function () {
          bfTraversal($scope.mapping, function (node) {
            if (node.error && node.error.id) {
              $scope.errors.push({
                uid: node.uid,
                error: node.error
              });
            }
            return true;
          });
        };

        var detectSiUsage = function () {
          bfTraversal($scope.mapping, function (node) {
            if (node.events) {
              for (var i = 0, l = node.events.length; i < l; ++i) {
                if (unitIsSi(node.events[i].type)) {
                  $scope.useSiUnits = true;
                }
                if (node.events[i].availableTypes &&
                  node.events[i].availableTypes.length >= 0) {
                  for (var j = 0; j < node.events[i].availableTypes.length; ++j) {
                    if (unitIsSi(node.events[i].availableTypes[j])) {
                      $scope.siUnitsAvailable = true;
                      node.events[i].type = node.events[i].availableTypes[j];
                      break;
                    }
                  }
                }
              }
            }
            return true;
          });
        };

        $scope.clearErrorInNode = function (error) {
          var uid = error.uid;
          bfTraversal($scope.mapping, function (node) {
            if (node.uid === uid) {
              if (node.error.id === 'unknown-referenced-resource') {
                node.id = '';
                node.error = {
                  id: null,
                  message: null
                };
              }
              return false;
            }
            return true;
          });
          pushDetails();
        };


        /*
         * Button functions
         */
        $scope.buttonConfirm = function () {
          pushDetails();
        };
        $scope.buttonCancel = function () {
          _.defer(function ($rs, $l) {
            $l.path('/overview');
            $rs.$apply();
          }, $rootScope, $location);
        };


        pullDetails();
        console.log('Configure Controller loaded!');
      } else {
        _.defer(function ($rs, $l) {
          $l.path('/signin-pryv/');
          $rs.$apply();
        }, $rootScope, $location);
      }
    }]);


var bfTraversal = function (tree, fn) {

  var bfs = function (node) {
    if (node) {
      if (fn(node)) {
        if (node.streams && node.streams.length) {
          for (var i = 0, l = node.streams.length; i < l; ++i) {
            bfs(node.streams[i]);
          }
        }
      }
    }
  };

  if (tree instanceof Array) {
    for (var i = 0, l = tree.length; i < l; ++i) {
      bfs(tree[i]);
    }
  } else {
    return bfs(tree);
  }
};


var unitIsSi = function (type) {
  switch (type) {
    case 'length/km':
      return true;
    default:
      return false;
  }
};
