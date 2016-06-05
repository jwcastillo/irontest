'use strict';

//  NOTICE:
//    The $scope here prototypically inherits from the $scope of teststeps-controller.js.
//    ng-include also creates a scope.
angular.module('iron-test').controller('MQTeststepController', ['$scope', 'Testruns', 'IronTestUtils', '$timeout',
    '$http',
  function($scope, Testruns, IronTestUtils, $timeout, $http) {
    var timer;
    $scope.testrun = {};

    $scope.actionChanged = function(isValid) {
      //  clear previous action data
      $scope.testrun = {};
      $scope.assertionVerificationResult = null;
      $scope.teststep.assertions = [];

      //  setup new action assertion
      if ($scope.teststep.otherProperties.action === 'CheckDepth') {
        $scope.teststep.assertions[0] = {
          name: 'MQ queue depth equals',
          type: 'IntegerEqual',
          otherProperties: {
            number: 0
          }
        };
      } else if ($scope.teststep.otherProperties.action === 'Dequeue') {
        $scope.teststep.assertions[0] = {
          name: 'Dequeue XML equals',
          type: 'XMLEqual',
          otherProperties: {
            expectedXML: null
          }
        };
      }

      //  save test step
      $scope.autoSave(isValid);
    };

    $scope.doAction = function() {
      //  clear previous run or assertion verification status
      $scope.testrun = {};
      $scope.assertionVerificationResult = null;
      if (timer) $timeout.cancel(timer);

      var testrun = {
        teststep: $scope.teststep
      };
      var testrunRes = new Testruns(testrun);
      $scope.testrun.status = 'ongoing';
      testrunRes.$save(function(response) {
        $scope.testrun.response = response.response;
        $scope.testrun.status = 'finished';
        $timeout(function() {
          $scope.testrun.status = null;
        }, 15000);
      }, function(response) {
        $scope.testrun.status = 'failed';
        IronTestUtils.openErrorHTTPResponseModal(response);
      });
    };

    $scope.verifyXMLEqualAssertion = function() {
      var url = 'api/jsonservice/verifyassertion';
      var assertionVerification = {
        input: $scope.testrun.response,
        assertion: $scope.teststep.assertions[0]
      };
      $http
        .post(url, assertionVerification)
        .then(function successCallback(response) {
          $scope.assertionVerificationResult = response.data;
          $scope.assertionVerificationResult.display =
            response.data.error ? response.data.error : response.data.differences;
        }, function errorCallback(response) {
          IronTestUtils.openErrorHTTPResponseModal(response);
        });
    };
  }
]);