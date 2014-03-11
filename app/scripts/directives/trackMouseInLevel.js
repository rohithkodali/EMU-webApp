'use strict';

angular.module('emulvcApp')
  .directive('trackmouseinlevel', function (ConfigProviderService, viewState, Levelservice) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {

        var lastEventClick;
        var lastEventClickId;
        var lastEventRightClick;
        var lastEventRightClickId;
        var lastEventMove;
        var lastEventMoveId;
        var lastNeighbours;
        var lastNeighboursMove;
        var lastPCM;
        var thisPCM;
        var levelID = scope.level.name;
        var levelType = scope.level.type;

        element.bind('click', function (event) {
          setLastMove(event, true);
          setLastClick(event);
        });

        element.bind('contextmenu', function (event) {
          event.preventDefault();
          setLastMove(event, true);
          setLastRightClick(event);

        });

        element.bind('dblclick', function (event) {
          setLastMove(event, true);
          if (ConfigProviderService.vals.restrictions.editItemName) {
            setLastDblClick(event);
          } else {
            setLastClick(event);
          }
        });

        element.bind('mousemove', function (event) {
          var moveLine = true;
          var zoom = viewState.getPCMpp(event);
          thisPCM = getX(event) * zoom;
          var moveBy = (thisPCM - lastPCM);

          if (zoom <= 1) {
            // ansolute movement in pcm below 1 pcm per pixel
            moveBy = Math.floor((thisPCM + scope.vs.curViewPort.sS) - Levelservice.getElementDetails(scope.this.level.name, viewState.getcurMouseSegment().id).sampleStart);
          } else {
            // relative movement in pcm above 1 pcm per pixel
            moveBy = Math.round(thisPCM - lastPCM);
          }
          switch (event.which) {
          case 1:
            //console.log('Left mouse button pressed');
            break;
          case 2:
            //console.log('Middle mouse button pressed');
            break;
          case 3:
            //console.log('Right mouse button pressed');
            break;
          default:
            if (viewState.getdragBarActive() === false) {
              if (ConfigProviderService.vals.restrictions.editItemSize && event.shiftKey) {
                viewState.deleteEditArea();
                if(viewState.getcurMouseSegment()!==undefined) {
                  viewState.movingBoundary = true;
                  if(scope.this.level.type == "SEGMENT") {
                    scope.levelDetails.moveBoundry(moveBy, scope.this.level.name, viewState.getcurMouseSegment(), viewState.getcurMouseNeighbours());
                    scope.hists.updateCurChangeObj({
                      'type': 'ESPS',
                      'action': 'moveBoundary',
                      'name': scope.this.level.name,
                      'neighbours': viewState.getcurMouseNeighbours(),
                      'itemIdx': viewState.getcurMouseSegment(),
                      'movedBy': moveBy
                    });
                  }
                  else {
                    scope.levelDetails.movePoint(moveBy, scope.this.level.name, viewState.getcurMouseSegment());
                    scope.hists.updateCurChangeObj({
                      'type': 'ESPS',
                      'action': 'movePoint',
                      'name': scope.this.level.name,
                      'itemIdx': viewState.getcurMouseSegment(),
                      'movedBy': moveBy
                    });                    
                  }                  
                  viewState.selectBoundry();
                  lastPCM = thisPCM;
                  scope.$apply();
                  moveLine = false;
                }
              } else if (ConfigProviderService.vals.restrictions.editItemSize && event.altKey) {
                viewState.deleteEditArea();
                if(scope.this.level.type == "SEGMENT") {
                  var neighbours = scope.levelDetails.getElementNeighbourDetails(scope.this.level.name, viewState.getcurClickSegments()[0].id, viewState.getcurClickSegments()[viewState.getcurClickSegments().length-1].id);
                  scope.levelDetails.moveSegment(moveBy, scope.this.level.name, viewState.getcurClickSegments(), neighbours);
                  scope.hists.updateCurChangeObj({
                    'type': 'ESPS',
                    'action': 'moveSegment',
                    'name': scope.this.level.name,
                    'neighbours': angular.copy(neighbours),
                    'itemIdx': angular.copy(viewState.getcurClickSegments()),
                    'movedBy': moveBy
                  });
                  
                  viewState.selectBoundry();  
                  lastPCM = thisPCM;                
                  scope.$apply();
                }
              } else {
                viewState.movingBoundary = false;
              }
            }
            break;
          }
          setLastMove(event, moveLine);
        });

        element.bind('mousedown', function (event) {
          setLastMove(event, true);
        });


        element.bind('mouseup', function (event) {
          setLastMove(event, true);
        });

        element.bind('mouseout', function (event) {
          viewState.movingBoundary = false;
          setLastMove(event, true);
        });
        //levelID

        function setLastClick(x) {
          thisPCM = getX(x) * viewState.getPCMpp(x);
          viewState.deleteEditArea();
          viewState.setEditing(false);
          viewState.focusInTextField = false;
          lastEventClick = Levelservice.getEvent(thisPCM + scope.vs.curViewPort.sS, scope.this.level, scope.vs.curViewPort.bufferLength);
          viewState.setlasteditArea('_' + lastEventClick.evtr.id);
          viewState.setcurClickLevel(levelID, levelType, scope.$index, scope.this.level.items.length);
          viewState.setcurClickSegment(lastEventClick.evtr);
          lastPCM = thisPCM;
          scope.$apply();
        }

        function setLastRightClick(x) {
          if (viewState.getcurClickLevelName() !== levelID) {
            setLastClick(x);
          }
          thisPCM = getX(x) * viewState.getPCMpp(x);
          viewState.deleteEditArea();
          lastEventClick = Levelservice.getEvent(thisPCM + scope.vs.curViewPort.sS, scope.this.level, scope.vs.curViewPort.bufferLength);
          viewState.setcurClickLevel(levelID, levelType, scope.$index, scope.this.level.items.length);
          viewState.setcurClickSegmentMultiple(lastEventClick.evtr);
          lastPCM = thisPCM;
          scope.$apply();
        }

        function setLastDblClick(x) {
          thisPCM = getX(x) * viewState.getPCMpp(x);
          lastEventClick = Levelservice.getEvent(thisPCM + scope.vs.curViewPort.sS, scope.this.level, scope.vs.curViewPort.bufferLength);
          viewState.setcurClickLevel(levelID, levelType, scope.$index, scope.this.level.items.length);
          viewState.setcurClickSegment(lastEventClick.evtr);
          viewState.setlasteditArea('_' + lastEventClick.evtr.id);
          viewState.setEditing(true);
          viewState.openEditArea(lastEventClick.evtr, levelType, element.parent());
          scope.cursorInTextField();
          lastPCM = thisPCM;
          scope.$apply();
        }

        function setLastMove(x, doChange) {
          thisPCM = getX(x) * viewState.getPCMpp(x);
          lastEventMove = Levelservice.getEvent(thisPCM + scope.vs.curViewPort.sS, scope.this.level, scope.vs.curViewPort.bufferLength);
          if (doChange && (lastEventMove.nearest != undefined)) {
            lastNeighboursMove = Levelservice.getElementNeighbourDetails(scope.this.level.name, lastEventMove.nearest.id, lastEventMove.nearest.id);
            viewState.setcurMouseSegment(lastEventMove.nearest, lastNeighboursMove);
          }
          viewState.setcurMouseLevelName(levelID);
          viewState.setcurMouseLevelType(levelType);
          lastPCM = thisPCM;
          scope.$apply();
        }

        function getX(e) {
          return e.offsetX * (e.originalEvent.srcElement.width / e.originalEvent.srcElement.clientWidth);
        }
      }
    };
  });