"use strict";

var FileCtrl = angular.module("emulvcApp")
	.controller("FileCtrl", function($rootScope, $scope,
		viewState, Iohandlerservice, Soundhandlerservice, ConfigProviderService) {

    var dropbox = document.getElementById("dropbox");
    var droptext1 = "Drop your files here";
    var droptext2 = "File is not allowed";
    var droptext3 = "Parsing started";
    var parsingFile;
    var parsingFileType;
    
    $scope.dropText = droptext1;   
    
    function dragEnterLeave(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $scope.$apply(function(){
            $scope.dropText = droptext1;
            $scope.dropClass = "";
        })
    }
    dropbox.addEventListener("dragenter", dragEnterLeave, false);
    dropbox.addEventListener("dragleave", dragEnterLeave, false);
    dropbox.addEventListener("dragover", function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var clazz = "not-available";
        var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf("Files") >= 0;
        $scope.$apply(function(){
            $scope.dropText = ok ? droptext1 : droptext2;
            $scope.dropClass = ok ? "over" : "not-available";
        })
    }, false);
    
    dropbox.addEventListener("drop", function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $scope.$apply(function(){
            $scope.dropText = droptext3;
            $scope.dropClass = "";
        });
        var items = evt.dataTransfer.items;
        for (var i=0; i<items.length; i++) {
            var item = items[i].webkitGetAsEntry();
            if (item) {
                traverseFileTree(item);
            }
        }        
    }, false);
    
    function traverseFileTree(item, path) {
        path = path || "";
        if (item.isFile) {
            item.file(function(file) {
                var extension = file.name.substr(file.name.lastIndexOf(".")+1).toUpperCase();
            	if(extension=="WAV") {
            		$rootScope.$broadcast('fileLoaded', fileType.WAV, file);
            	}
        	    if(extension=="TEXTGRID") {
        		    $rootScope.$broadcast('fileLoaded', fileType.TEXTGRID, file);
            	}        			
            });
        } else if (item.isDirectory) {
            var dirReader = item.createReader();
            dirReader.readEntries(function(entries) {
                for (var i=0; i<entries.length; i++) {
                    traverseFileTree(entries[i], path + item.name + "/");
                }
            });
        }
    }
});