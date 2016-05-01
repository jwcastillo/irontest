'use strict';

angular.module('iron-test').controller('TeststepsController', ['$scope', 'Teststeps', '$stateParams', '$timeout',
    '$uibModal', 'IronTestUtils', '$http', 'Environments',
  function($scope, Teststeps, $stateParams, $timeout, $uibModal, IronTestUtils, $http, Environments) {
    $scope.teststep = {};

    var timer;
    //  use object instead of primitives, so that child scope can update the values
    $scope.savingStatus = {
      saveSuccessful: null,
    };

    $scope.autoSave = function(isValid) {
      if (timer) $timeout.cancel(timer);
      timer = $timeout(function() {
        $scope.update(isValid);
      }, 2000);
    };

    $scope.update = function(isValid) {
      if (isValid) {
        $scope.teststep.$update(function(response) {
          $scope.savingStatus.saveSuccessful = true;
          $scope.teststep = response;
        }, function(response) {
          IronTestUtils.openErrorHTTPResponseModal(response);
        });
      } else {
        $scope.savingStatus.submitted = true;
      }
    };

    $scope.findOne = function() {
      Teststeps.get({
        testcaseId: $stateParams.testcaseId,
        teststepId: $stateParams.teststepId
      }, function (response) {
        $scope.teststep = response;
      }, function(response) {
        IronTestUtils.openErrorHTTPResponseModal(response);
      });
    };

    $scope.selectManagedEndpoint = function() {
      //  find managed endpoints by type
      var url = 'api/jsonservice/findManagedEndpointsByType?type=' + $scope.teststep.endpoint.type;
      $http
        .get(url)
        .then(function successCallback(response) {
          //  open modal dialog
          var modalInstance = $uibModal.open({
            templateUrl: '/ui/views/endpoints/list-modal.html',
            controller: 'SelectManagedEndpointModalController',
            size: 'lg',
            windowClass: 'select-managed-endpoint-modal',
            resolve: {
              endpoints: function () {
                return response.data;
              }
            }
          });

          //  handle result from modal dialog
          modalInstance.result.then(function (selectedEndpoint) {
            $scope.teststep.endpoint = selectedEndpoint;
            $scope.update(true);  //  save immediately (no timeout)
          }, function () {
            //  Modal dismissed
          });
        }, function errorCallback(response) {
          IronTestUtils.openErrorHTTPResponseModal(response);
        });
    };

    $scope.enterShareEndpointMode = function() {
      //  find all environments
      Environments.query(function(environments) {
        if (environments && environments.length > 0) {
          $scope.environments = environments;
          $scope.teststep.endpoint.environment = environments[0];
        } else {
          IronTestUtils.openErrorMessageModal('No environment yet.',
              'To share the endpoint, please create an environment first.');
        }
      }, function(response) {
        IronTestUtils.openErrorHTTPResponseModal(response);
      });
    };

    $scope.isInShareEndpointMode = function() {
      return typeof $scope.environments !== 'undefined';
    };

    $scope.shareEndpoint = function(isValid) {
      //  this will reload the whole test step
      $scope.update(isValid);

      //  exit share-endpoint mode
      delete $scope.environments;
    };

    $scope.cancelShareEndpoint = function() {
      //  reload the whole test step
      $scope.findOne();

      //  exit share-endpoint mode
      delete $scope.environments;
    };
  }
]);
