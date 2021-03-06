'use strict';

//  For HTTP stub edit view.
angular.module('irontest').controller('HTTPStubController', ['$scope', 'HTTPStubs', 'IronTestUtils', '$stateParams',
    '$timeout', '$rootScope', 'uiGridConstants',
  function($scope, HTTPStubs, IronTestUtils, $stateParams, $timeout, $rootScope, uiGridConstants) {
    const SPEC_TAB_INDEX = 1;
    const HEADER_GRID_NAME_COLUMN_WIDTH = '30%';
    var timer;

    $scope.activeTabIndex = SPEC_TAB_INDEX;

    var resetRequestBodyMainPattern = function() {
      $scope.requestBodyMainPattern = IronTestUtils.getRequestBodyMainPattern();
    };
    resetRequestBodyMainPattern();

    $scope.autoSave = function(isValid) {
      if (timer) $timeout.cancel(timer);
      timer = $timeout(function() {
        $scope.update(isValid);
      }, 2000);
    };

    $scope.update = function(isValid, successCallback) {
      if (isValid) {
        $scope.httpStub.$update(function() {
          $scope.$broadcast('successfullySaved');
          if (successCallback) {
            successCallback();
          }
        }, function(response) {
          IronTestUtils.openErrorHTTPResponseModal(response);
        });
      } else {
        $scope.submitted = true;
      }
    };

    $scope.findOne = function() {
      HTTPStubs.get({
        testcaseId: $stateParams.testcaseId, httpStubId: $stateParams.httpStubId
      }, function(httpStub) {
        $scope.httpStub = httpStub;

        $scope.requestBodyMainPattern = IronTestUtils.getRequestBodyMainPattern(httpStub.spec.request.bodyPatterns);

        //  set request and response headers
        var requestHeaders = httpStub.spec.request.headers;
        if (requestHeaders) {
          $scope.requestHeaderGridOptions.data = Object.keys(requestHeaders).map(function(key) {
            return { name: key, value: requestHeaders[key].equalTo };
          });
        }
        var responseHeaders = httpStub.spec.response.headers;
        if (responseHeaders) {
          $scope.responseHeaderGridOptions.data = Object.keys(responseHeaders).map(function(key) {
            return { name: key, value: responseHeaders[key] };
          });
        }
      }, function(response) {
        IronTestUtils.openErrorHTTPResponseModal(response);
      });
    };

    $scope.requestBodyNotApplicable = function() {
      if ($scope.httpStub) {     //  when the view is on loading, there is no $scope.httpStub
        var requestMethod = $scope.httpStub.spec.request.method;
        return $rootScope.appStatus.isForbidden() || requestMethod === 'GET' || requestMethod === 'DELETE';
      } else {
        return true;
      }
    };

    $scope.methodChanged = function(isValid) {
      var request = $scope.httpStub.spec.request;
      if (request.bodyPatterns && $scope.requestBodyNotApplicable()) {
        delete request.bodyPatterns;
        resetRequestBodyMainPattern();
      }
      $scope.update(isValid);
    };

    $scope.toggleRestrictRequestBody = function(isValid) {
      var request = $scope.httpStub.spec.request;
      if (request.bodyPatterns) {
        delete request.bodyPatterns;
      } else {
        request.bodyPatterns = [];
      }
      resetRequestBodyMainPattern();
      $scope.update(isValid);
    };

    $scope.requestBodyMainPatternNameChanged = function(isValid) {
      var newMainPatternName = $scope.requestBodyMainPattern.name;
      var bodyPatterns = $scope.httpStub.spec.request.bodyPatterns;
      bodyPatterns.length = 0;    //  clear the bodyPatterns array
      var bodyPattern = new Object();
      var hiddenMainPatternValue;
      if (newMainPatternName === 'equalToXml') {
        hiddenMainPatternValue = '<IronTest_ToBeSubstitutedDuringStepRun/>';
      } else if (newMainPatternName === 'equalToJson') {
        hiddenMainPatternValue = "\"IronTest_ToBeSubstitutedDuringStepRun\"";
      }
      bodyPattern[newMainPatternName] = hiddenMainPatternValue;
      bodyPatterns.push(bodyPattern);
      $scope.update(isValid);
    };

    $scope.toggleDelayResponse = function(isValid) {
      var response = $scope.httpStub.spec.response;
      if (response.hasOwnProperty('fixedDelayMilliseconds')) {   //  can't use if (response.fixedDelayMilliseconds) here, as it will be true when fixedDelayMilliseconds exists with value 0
        delete response.fixedDelayMilliseconds;
      } else {
        response.fixedDelayMilliseconds = 0;
      }
      $scope.update(isValid);
    };

    var createRequestHeader = function(gridMenuEvent) {
      var headersInGrid = $scope.requestHeaderGridOptions.data;
      var request = $scope.httpStub.spec.request;
      if (!request.headers) {
        request.headers = {};
      }
      var headersObj = request.headers;
      var newHeaderName = IronTestUtils.getNextNameInSequence(headersInGrid, 'name');
      var newHeaderValue = '';
      headersObj[newHeaderName] = { equalTo: newHeaderValue };
      headersInGrid.push({ name: newHeaderName, value: newHeaderValue });
      $scope.update(true, function selectTheNewRow() {
        $scope.requestHeaderGridApi.grid.modifyRows(headersInGrid);
        $scope.requestHeaderGridApi.selection.selectRow(headersInGrid[headersInGrid.length - 1]);
      });
    };

    var deleteRequestHeader = function(gridMenuEvent) {
      var selectedRow = $scope.requestHeaderGridApi.selection.getSelectedRows()[0];
      var headersInGrid = $scope.requestHeaderGridOptions.data;
      var headersObj = $scope.httpStub.spec.request.headers;
      delete headersObj[selectedRow.name];
      IronTestUtils.deleteArrayElementByProperty(headersInGrid, '$$hashKey', selectedRow.$$hashKey);
      $scope.update(true);
    };

    var createResponseHeader = function(gridMenuEvent) {
      var headersInGrid = $scope.responseHeaderGridOptions.data;
      var response = $scope.httpStub.spec.response;
      if (!response.headers) {
        response.headers = {};
      }
      var headersObj = response.headers;
      var newHeaderName = IronTestUtils.getNextNameInSequence(headersInGrid, 'name');
      var newHeaderValue = '';
      headersObj[newHeaderName] = newHeaderValue;
      headersInGrid.push({ name: newHeaderName, value: newHeaderValue });
      $scope.update(true, function selectTheNewRow() {
        $scope.responseHeaderGridApi.grid.modifyRows(headersInGrid);
        $scope.responseHeaderGridApi.selection.selectRow(headersInGrid[headersInGrid.length - 1]);
      });
    };

    var deleteResponseHeader = function(gridMenuEvent) {
      var selectedRow = $scope.responseHeaderGridApi.selection.getSelectedRows()[0];
      var headersInGrid = $scope.responseHeaderGridOptions.data;
      var headersObj = $scope.httpStub.spec.response.headers;
      delete headersObj[selectedRow.name];
      IronTestUtils.deleteArrayElementByProperty(headersInGrid, '$$hashKey', selectedRow.$$hashKey);
      $scope.update(true);
    };

    var commonHeaderGridOptions = {
      enableSorting: false, enableRowHeaderSelection: false, multiSelect: false,
      enableGridMenu: true, enableColumnMenus: false, gridMenuShowHideColumns: false,
      rowHeight: 20, enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
      columnDefs: [
        { name: 'name', width: HEADER_GRID_NAME_COLUMN_WIDTH,
          headerTooltip: 'Double click to edit', enableCellEdit: true,
          editableCellTemplate: 'headerGridEditableCellTemplate.html' },
        { name: 'value', headerTooltip: 'Double click to edit', enableCellEdit: true, cellTooltip: true,
          editableCellTemplate: 'headerGridEditableCellTemplate.html' }
      ]
    };

    $scope.requestHeaderGridOptions = JSON.parse(JSON.stringify(commonHeaderGridOptions));
    $scope.requestHeaderGridOptions.gridMenuCustomItems = [
      { title: 'Create', order: 210, action: createRequestHeader,
        shown: function() {
          return !$rootScope.appStatus.isForbidden();
        }
      },
      { title: 'Delete', order: 220, action: deleteRequestHeader,
        shown: function() {
          return !$rootScope.appStatus.isForbidden() &&
            $scope.requestHeaderGridApi.selection.getSelectedRows().length === 1;
        }
      }
    ];
    $scope.requestHeaderGridOptions.onRegisterApi = function(gridApi) {
      $scope.requestHeaderGridApi = gridApi;
      gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
        if (newValue !== oldValue) {
          var request = $scope.httpStub.spec.request;
          var headersObj = request.headers;
          if (colDef.name === 'name') {       //  header name was changed
            //  to preserve the order of headers, can't just create new property and delete old property on headersObj
            request.headers = {};
            var headersInGrid = $scope.requestHeaderGridOptions.data;
            headersInGrid.forEach(headerInGrid => request.headers[headerInGrid.name] = { equalTo: headerInGrid.value });
          } else {                            //  header value was changed
            var headerName = rowEntity.name;
            headersObj[headerName].equalTo = newValue;
          }
          $scope.update(true);
        }
      });
    };

    $scope.responseHeaderGridOptions = JSON.parse(JSON.stringify(commonHeaderGridOptions));
    $scope.responseHeaderGridOptions.gridMenuCustomItems = [
      { title: 'Create', order: 210, action: createResponseHeader,
        shown: function() {
          return !$rootScope.appStatus.isForbidden();
        }
      },
      { title: 'Delete', order: 220, action: deleteResponseHeader,
        shown: function() {
          return !$rootScope.appStatus.isForbidden() &&
            $scope.responseHeaderGridApi.selection.getSelectedRows().length === 1;
        }
      }
    ];
    $scope.responseHeaderGridOptions.onRegisterApi = function(gridApi) {
      $scope.responseHeaderGridApi = gridApi;
      gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
        if (newValue !== oldValue) {
          var response = $scope.httpStub.spec.response;
          var headersObj = response.headers;
          if (colDef.name === 'name') {       //  header name was changed
            //  to preserve the order of headers, can't just create new property and delete old property on headersObj
            response.headers = {};
            var headersInGrid = $scope.responseHeaderGridOptions.data;
            headersInGrid.forEach(headerInGrid => response.headers[headerInGrid.name] = headerInGrid.value);
          } else {                            //  header value was changed
            var headerName = rowEntity.name;
            headersObj[headerName] = newValue;
          }
          $scope.update(true);
        }
      });
    };
  }
]);