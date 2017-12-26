'use strict';

angular.module('irontest').controller('UserLoginModalController', ['$scope', '$rootScope', '$uibModalInstance',
    '$window', '$http',
  function($scope, $rootScope, $uibModalInstance, $window, $http) {
    $scope.authenticationFailed = null;

    $scope.login = function() {
      var authHeaderValue = 'Basic ' + $window.btoa($scope.username + ':' + $scope.password);
      $http
        .get('api/authenticated', {headers: {'Authorization': authHeaderValue}})
        .then(function successCallback(response) {
          var userInfo = {
            authHeaderValue: authHeaderValue,
            username: $scope.username,
            roles: response.data
          }
          $window.localStorage.userInfo = angular.toJson(userInfo);
          $rootScope.appStatus.userInfo = userInfo;
          $http.defaults.headers.common.Authorization = authHeaderValue;

          $scope.$emit('userLoggedIn');

          $uibModalInstance.dismiss();
        }, function errorCallback(response) {
          $scope.authenticationFailed = true;
        });
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);