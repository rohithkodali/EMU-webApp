'use strict';

angular.module('emulvcApp')
  .directive('save', function (dialogService, Espsparserservice) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        var id = scope.this.tier.TierName;

        element.bind('click', function () {
          scope.vs.setcurClickTierName(id);
          dialogService.openExport('views/export.html', 'ExportCtrl', Espsparserservice.toESPS(scope.this.tier),'tier.txt');
        });

      }
    };
  });