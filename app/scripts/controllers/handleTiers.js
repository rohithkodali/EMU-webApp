'use strict';

angular.module('emulvcApp')
	.controller('HandletiersCtrl', function($scope, $http, viewState) {
	
		$scope.viewState = viewState;
		$scope.testValue = '';
		$scope.message = '';
		$scope.myHistory = [];
		$scope.myHistoryCounter = 0;

		$http.get('testData/PhoneticTier.json').success(function(data) {
			$scope.viewState.eS = data.events[data.events.length-1].startSample + data.events[data.events.length-1].sampleDur;
			$scope.viewState.bufferLength = $scope.viewState.eS;
			$scope.tierDetails = data;
		});
		
		$scope.updateAllLabels = function() {
		    if ($scope.testValue !== '') {
		        angular.forEach($scope.tierDetails.events, function(evt) {
		            evt.label = $scope.testValue;
		        });
		    }
		};
		
		$scope.history = function() {
		    $scope.myHistory[$scope.myHistoryCounter] = jQuery.extend(true, {}, $scope.tierDetails);
		    ++$scope.myHistoryCounter;
	    };
	    
	    $scope.goBackHistory = function() {
		    if (($scope.myHistoryCounter - 1) > 0) {
			    delete $scope.tierDetails;
    			$scope.tierDetails = jQuery.extend(true, {}, $scope.myHistory[$scope.myHistoryCounter - 2]);
	    		--$scope.myHistoryCounter;
		    } else {
		        alert("no more history!");
    		}
	    };
		
		$scope.$on('renameLabel', function(e) {
		    if(viewState.isEditing()) {
		        $scope.renameLabel(viewState.getcurClickTierName(),viewState.getlastID(),$("."+viewState.getlasteditArea()).val());
		        viewState.deleteEditArea();
		    }
		    else {
		        if(viewState.getcurClickSegmentSize()==0) {
		            alert("please select a segement first!");
		        }
		        else {
    		        viewState.setEditing(true);
	    	        $scope.openEditArea();
	    	    }
		    }
		});
		
		$scope.$on('history', function(e) {
		    $scope.goBackHistory();
		});	
		
		$scope.$on('deleteEditArea', function(e) {
		    viewState.deleteEditArea();
		});	
		
		
		$scope.$on('tab-next', function(e) {
		    if(viewState.isEditing()) {
		        $scope.renameLabel(viewState.getcurClickTierName(),viewState.getlastID(),$("."+viewState.getlasteditArea()).val());
		        viewState.deleteEditArea();
		    }
		    var now = parseInt(viewState.getcurClickSegment()[0],10);
		    if(now<$scope.tierDetails.events.length-1) ++now;
		    else now = 0;
		    viewState.setlasteditArea("_"+now);
		    viewState.setcurClickSegment($scope.tierDetails.events[now],now);
		});				

		$scope.$on('tab-prev', function(e) {
		    if(viewState.isEditing()) {
		        $scope.renameLabel(viewState.getcurClickTierName(),viewState.getlastID(),$("."+viewState.getlasteditArea()).val());
		        viewState.deleteEditArea();
		    }
		    var now = parseInt(viewState.getcurClickSegment()[0],10);
		    if(now>0) --now;
		    else now = $scope.tierDetails.events.length-1;
		    viewState.setlasteditArea("_"+now);
		    viewState.setcurClickSegment($scope.tierDetails.events[now],now);
		});				

		
	    $scope.renameLabel = function(tier,id,name) {
	        var i = 0;
            angular.forEach($scope.tierDetails.events, function(evt) {
                if(id==i) {
		            evt.label = name;
		        }
		        ++i;
		    });      
        };
        
        $scope.getPCMpp = function(event) {
            var start = parseInt($scope.viewState.sS,10);
            var end = parseInt($scope.viewState.eS,10);
            return (end-start)/event.originalEvent.srcElement.width;      
        }
        
        $scope.getEventId = function(x,event) {
            var pcm = parseInt($scope.viewState.sS,10)+x; 
            var id = 0;
            var ret = 0;
            angular.forEach($scope.tierDetails.events, function(evt) {
                if(pcm>=evt.startSample && pcm <= (evt.startSample+evt.sampleDur)) {
		            ret=id;
		        }
		        ++id;
		    });      
		    return ret;
        }
         
        $scope.getEvent = function(x) {
            var pcm = parseInt($scope.viewState.sS,10)+x; 
            var evtr = null;
		    angular.forEach($scope.tierDetails.events, function(evt) {
		        if(pcm>=evt.startSample && pcm <= (evt.startSample+evt.sampleDur)) {
		            evtr=evt;
		        }
		    });      
            return evtr;
        } 
        
        $scope.openEditArea = function() {
            var lastEventClick = viewState.getlastClickSegment();
            console.log(lastEventClick);
            var lastEventClickId = viewState.getlastID();
            var elem = $("#"+viewState.getcurClickTierName()).find("canvas")[0];
            var start = viewState.getPos(elem.clientWidth,lastEventClick.startSample) + elem.offsetLeft;
            var end = viewState.getPos(elem.clientWidth,(lastEventClick.startSample+lastEventClick.sampleDur)) + elem.offsetLeft;
            var top = elem.offsetTop;
            var height = elem.clientHeight;
            var myid = $scope.createEditArea(viewState.getcurClickTierName(), start,top,end-start,height,lastEventClick.label,lastEventClickId);
            $scope.createSelection($("#"+myid)[0], 0, $("#"+myid).val().length);
        }            
             
        $scope.createSelection = function(field, start, end) {
		    if (field.createTextRange) {
			    var selRange = field.createTextRange();
    			selRange.collapse(true);
	    		selRange.moveStart('character', start);
		    	selRange.moveEnd('character', end);
			    selRange.select();
    		} else if (field.setSelectionRange) {
	    		field.setSelectionRange(start, end);
		    } else if (field.selectionStart) {
    			field.selectionStart = start;
	    		field.selectionEnd = end;
		    }
    		field.focus();
        }       	
		
        $scope.createEditArea = function(id, x,y,width,height,label,labelid) {
            var textid = "_"+labelid;
            $("#"+id).append($("<textarea>").attr({
	    		id: textid,
		    	"autofocus":"true",
			    "class": textid + " Label_Edit",
    			"ng-model":"message"
	       }).css({
		       "position": "absolute",
		       "top": y+1 + "px",
		       "left": x+2 + "px",
		       "width": width-1 + "px",
		       "height": height + "px",
		       "max-height": height-(height/3) + "px",
		       "padding-top": (height/3) + "px"
            }).text(label));
		    return textid;
        }	
        

        $scope.moveBorder = function(changeTime) {
		    var t = $scope.tierDetails;
		    if (null != t) {
			    var seg = viewState.getcurMouseSegmentId();
			    if((t.events[seg-1].sampleDur + changeTime ) >= 1 && ( t.events[seg].sampleDur - changeTime ) >= 1) {
			        t.events[seg-1].sampleDur += changeTime;
			        t.events[seg].startSample += changeTime;
			        t.events[seg].sampleDur -= changeTime;
    			}
		    }
    	};
    	    
        $scope.moveSegment = function(changeTime) {
		    var t = $scope.tierDetails;
		    if (null != t) {
			    var selected = viewState.getcurClickSegment();
			    if((t.events[selected[0]-1].sampleDur + changeTime ) >= 1 && ( t.events[selected[selected.length-1]+1].sampleDur - changeTime ) >= 1) {
			        t.events[selected[0]-1].sampleDur += changeTime;
        			for (var i = 0; i < selected.length; i++) {
	        			t.events[selected[i]].startSample += changeTime;
    	    		}
    		    	t.events[selected[selected.length-1]+1].startSample += changeTime;
    			    t.events[selected[selected.length-1]+1].sampleDur -= changeTime;
    			}
		    }
    	};
});
