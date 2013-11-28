'use strict';

angular.module('emulvcApp')
	.service('Websockethandler', function Websockethandler($q, $rootScope, $location, HistoryService, Ssffparserservice, ConfigProviderService, viewState, Wavparserservice, Soundhandlerservice, Espsparserservice, uuid) {
		// We return this object to anything injecting our service
		var Service = {};
		// Keep all pending requests here until they get responses
		var callbacks = {};
		// Create a unique callback ID to map requests to responses
		var currentCallbackId = 0;
		// Create our websocket object with the address to the websocket
		var ws = {};

		// empty promise object to be resolved when connection is up
		var conPromise = {};

		var promises = [];

		////////////////////////////
		// handle received functions

		function handleReceivedESPS(fileName, data) {
			var labelJSO = Espsparserservice.toJSO(data, fileName);
			$rootScope.$broadcast('newlyLoadedLabelJson', labelJSO);
		};

		function handleReceivedSSFF(fileName, data) {
			var arrBuff = stringToArrayBuffer(data);
			var ssffJso = Ssffparserservice.ssff2jso(arrBuff);
			ssffJso.fileURL = document.URL + fileName;
			$rootScope.$broadcast('newlyLoadedSSFFfile', ssffJso, fileName.replace(/^.*[\\\/]/, ''));
		};

		////////////////////////////
		// ws function

		// broadcast on open
		function wsonopen(message) {
			$rootScope.$broadcast('connectedToWSserver');
			$rootScope.$apply(conPromise.resolve(message));
		}

		function wsonmessage(message) {
			listener(JSON.parse(message.data));
		}

		function wsonerror(message) {
			console.log(message);
			console.log('WEBSOCKET ERROR!!!!!');
			$rootScope.$apply(conPromise.resolve(message));
		}

		function wsonclose(message) {
			alert('WEBSOCKET closed!!!!!');
		}

		function sendRequest(request) {
			var defer = $q.defer();
			var callbackId = getCallbackId();
			callbacks[callbackId] = {
				time: new Date(),
				cb: defer
			};
			request.callbackID = callbackId;
			// console.log('Sending request', request);
			ws.send(JSON.stringify(request));
			return defer.promise;
		}

		function listener(data) {
			var messageObj = data;
			// console.log("Received data from websocket: ", messageObj);
			// If an object exists with callbackID in our callbacks object, resolve it
			if (callbacks.hasOwnProperty(messageObj.callbackID)) {
				// console.log(callbacks[messageObj.callbackID]);
				console.log("resolving callback: " + messageObj.type + ' Nr.: ' + messageObj.callbackID);
				switch (messageObj.type) {
					case 'getESPSfile':
						handleReceivedESPS(messageObj.fileName, messageObj.data);
						break;
					case 'getSSFFfile':
						handleReceivedSSFF(messageObj.fileName, messageObj.data);
						break;
				}

				$rootScope.$apply(callbacks[messageObj.callbackID].cb.resolve(messageObj.data));

				delete callbacks[messageObj.callbackID];
			}
		}

		// This creates a new callback ID for a request
		function getCallbackId() {
			var newUUID = uuid.new();
			console.log(newUUID);

			// currentCallbackId += 1;
			// if (currentCallbackId > 10000) {
			// 	currentCallbackId = 0;
			// }
			// return currentCallbackId;
			return newUUID;
		}

		///////////////////////////////////////////
		// public api
		Service.initConnect = function(url) {
			var defer = $q.defer();
			ws = new WebSocket(url);
			ws.onopen = wsonopen;
			ws.onmessage = wsonmessage;
			ws.onerror = wsonerror;
			ws.onclose = wsonclose;

			conPromise = defer;
			return defer.promise;
		};
		// close connection with ws
		Service.closeConnect = function(url) {
			ws.onclose = function() {};
			ws.close();

		};

		// ws getProtocol
		Service.getProtocol = function() {
			var request = {
				type: 'getProtocol'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getDoUserManagement
		Service.getDoUserManagement = function() {
			var request = {
				type: 'getDoUserManagement'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getConfigFile
		Service.getConfigFile = function() {
			var request = {
				type: 'getConfigFile'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getUsrUttList
		Service.getUsrUttList = function(usrName) {
			var request = {
				type: 'getUttList',
				usrName: usrName
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getAudioFile
		Service.getSSFFfile = function(fileName) {
			var request = {
				type: 'getSSFFfile',
				fileName: fileName
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getAudioFile
		Service.getESPSfile = function(fileName) {
			var request = {
				type: 'getESPSfile',
				fileName: fileName
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getAudioFile
		Service.getAudioFile = function(fileName) {
			var request = {
				type: 'getAudioFile',
				fileName: fileName
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws request for saving uttList
		Service.saveUsrUttList = function(usrName, uttList) {
			var stripped = angular.toJson(uttList); // remove $$hash
			var request = {
				type: 'saveUttList',
				usrName: usrName,
				data: stripped // is sting!!!
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws request for saving ssff file
		Service.saveSSFFfile = function(usrName, ssffJSO) {
			var buf = Ssffparserservice.jso2ssff(ssffJSO);
			//console.log(usrName);
			//console.log(buf);
			var binary = '';
			var bytes = new Uint8Array(buf);
			var len = bytes.byteLength;
			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i])
			}
			var base64 = window.btoa(binary);
			//console.log(base64);

			var request = {
				type: 'saveSSFFfile',
				usrName: usrName,
				fileURL: ssffJSO.fileURL.split($location.absUrl())[1],
				data: base64
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws get Utt from ws server
		Service.getUtt = function(usrName, utt) {
			var curFile;

			// load audio file first
			curFile = Service.findFileInUtt(utt, ConfigProviderService.vals.signalsCanvasConfig.extensions.audio);
			//console.log(curFile)
			Service.getAudioFile(curFile).then(function(audioF) {
				var arrBuff = stringToArrayBuffer(audioF);
				var wavJSO = Wavparserservice.wav2jso(arrBuff);
				return wavJSO;
			}).then(function(wavJSO) {
				// set needed vals
				viewState.curViewPort.sS = 0;
				viewState.curViewPort.eS = wavJSO.Data.length;
				viewState.curViewPort.bufferLength = wavJSO.Data.length;
				viewState.setscrollOpen(0);
				viewState.resetSelect();
				Soundhandlerservice.wavJSO = wavJSO;
				$rootScope.$broadcast('cleanPreview');
			}).then(function() {
				ConfigProviderService.vals.signalsCanvasConfig.extensions.signals.forEach(function(ext) {
					curFile = Service.findFileInUtt(utt, ext);
					Service.getSSFFfile(curFile);
				});
			}).then(function() {
				// load label files
				ConfigProviderService.vals.labelCanvasConfig.order.forEach(function(ext) {
					var deferred = $q.defer();
					curFile = Service.findFileInUtt(utt, ext);
					var promise = Service.getESPSfile(curFile);
					//promises.push(promise);
					deferred.resolve(promise);

					//console.log(curFile);
				});
				//$q.all(promises).then(function () { HistoryService.history(); });
			});

		};

		// helper function to find file in utt
		Service.findFileInUtt = function(utt, fileExt) {
			var res;
			utt.files.forEach(function(f) {
				// do suffix check
				if (f.indexOf(fileExt, f.length - f.length) !== -1) {
					res = f;
				}
			})
			return (res);
		};

		// SIC... place all binary manip. functions in service
		function stringToArrayBuffer(str) {
			var ab = new ArrayBuffer(str.length);
			var view = new Uint8Array(ab);
			for (var i = 0; i < str.length; ++i) {
				view[i] = str.charCodeAt(i);
			}
			return ab;
		}

		return Service;
	});