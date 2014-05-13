'use strict';

angular.module('emuwebApp')
	.controller('HandleLevelsCtrl', function ($scope, $http, $injector, Drawhelperservice, Levelservice) {

		$scope.dhs = Drawhelperservice;

		$scope.$on('loadingNewUtt', function () {
			Levelservice.data = {};
		});

		$scope.$on('errorMessage', function (evt, data) {
			dialogService.open('views/error.html', 'ModalCtrl', data);
		});

		$scope.cursorInTextField = function () {
			$scope.vs.focusInTextField = true;
		};

		$scope.cursorOutOfTextField = function () {
			$scope.vs.focusInTextField = false;
		};

	});