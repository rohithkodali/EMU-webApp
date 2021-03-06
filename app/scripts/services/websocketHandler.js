'use strict';

angular.module('emuwebApp')
	.service('Websockethandler', function Websockethandler($q, $rootScope, $location, $timeout, HistoryService, Ssffparserservice, ConfigProviderService, viewState, Wavparserservice, Soundhandlerservice, Espsparserservice, uuid, Binarydatamaniphelper, Ssffdataservice, modalService) {
		// shared service object
		var sServObj = {};

		// Keep all pending requests here until they get responses
		var callbacks = {};

		// Create our websocket object with the address to the websocket
		sServObj.ws = {};

		// empty promise object to be resolved when connection is up
		var conPromise = {};

		var connected = false;


		////////////////////////////
		// ws function

		// broadcast on open
		function wsonopen(message) {
			connected = true;
			$rootScope.$apply(conPromise.resolve(message));
		}

		function wsonmessage(message) {
			try{
				var jsonMessage = angular.fromJson(message.data);
				listener(jsonMessage);
			}catch(e){
				modalService.open('views/error.html', 'Got non-JSON string as message from server! This is not allowed! The message was: ' + message.data + ' which caused the angular.fromJson error: ' + e).then(function () {
					sServObj.closeConnect();
					$rootScope.$broadcast('resetToInitState');
				});

			}
		}

		function wsonerror(message) {
			console.error('WEBSOCKET ERROR!!!!!');
			$rootScope.$apply(conPromise.resolve(message));
		}

		function wsonclose(message) {
			if (!message.wasClean && connected) {
				modalService.open('views/error.html', 'A non clean disconnect to the server occurred! This probably means that the server is down. Please check the server and reconnect!').then(function () {
					$rootScope.$broadcast('connectionDisrupted');
				});
			}
			connected = false;
			// console.log('WEBSOCKET closed!!!!!');
		}

		function sendRequest(request) {
			var defer = $q.defer();
			var callbackId = getCallbackId();
			callbacks[callbackId] = {
				time: new Date(),
				cb: defer
			};
			request.callbackID = callbackId;
			sServObj.ws.send(angular.toJson(request));
			// timeout request if not answered
			$timeout(function () {
				var tOutResp = {
					'callbackID': callbackId,
					'status': {
						'type': 'ERROR:TIMEOUT',
						'message': 'Sent request of type: ' + request.type + ' timed out after ' + ConfigProviderService.vals.main.serverTimeoutInterval + 'ms!  Please check the server...'
					}
				};
				listener(tOutResp);
			}, ConfigProviderService.vals.main.serverTimeoutInterval);

			return defer.promise;
		}

		function listener(data) {
			var messageObj = data;
			// console.log('Received data from websocket: ', messageObj);
			// If an object exists with callbackID in our callbacks object, resolve it
			if (callbacks.hasOwnProperty(messageObj.callbackID)) {
				// console.log(callbacks[messageObj.callbackID]);
				// console.log('resolving callback: ' + messageObj.type + ' Nr.: ' + messageObj.callbackID);
				switch (messageObj.type) {
					case 'getESPSfile':
						alert('espsfile');
						//handleReceivedESPS(messageObj.fileName, messageObj.data);
						break;
					case 'getSSFFfile':
						alert('ssfffile');
						//handleReceivedSSFF(messageObj.fileName, messageObj.data);
						break;
				}

				// resolve promise with data only
				if (messageObj.status.type === 'SUCCESS') {
					$rootScope.$apply(callbacks[messageObj.callbackID].cb.resolve(messageObj.data));
				} else {
					// show protocol error and disconnect from server
					sServObj.closeConnect();
					$rootScope.$broadcast('resetToInitState');
					$rootScope.$apply(modalService.open('views/error.html', 'Communication error with server! Error message is: ' + messageObj.status.message));
				}

				delete callbacks[messageObj.callbackID];
			} else {
				if(typeof messageObj.status === 'undefined'){
					modalService.open('views/error.html', 'Just got JSON message from server that the EMU-webApp does not know how to deal with! This is not allowed!');
				}
				else if (messageObj.status.type === 'ERROR:TIMEOUT') {
					// do nothing
				} else {
					modalService.open('views/error.html', 'Received invalid messageObj.callbackID that could not be resolved to a request! This should not happen and indicates a bad server response! The invalid callbackID was: ' + messageObj.callbackID);
				}
			}
		}

		// This creates a new callback ID for a request
		function getCallbackId() {
			var newUUID = uuid.new();
			return newUUID;
		}

		///////////////////////////////////////////
		// public api
		sServObj.initConnect = function (url) {
			var defer = $q.defer();
			try{
				sServObj.ws = new WebSocket(url);
				sServObj.ws.onopen = wsonopen;
				sServObj.ws.onmessage = wsonmessage;
				sServObj.ws.onerror = wsonerror;
				sServObj.ws.onclose = wsonclose;
			}catch (err){
				return $q.reject('A malformed websocket URL that does not start with ws:// or wss:// was provided.');
			}

			conPromise = defer;
			return defer.promise;
		};

		//
		sServObj.isConnected = function () {
			return connected;
		};

		// close connection with ws
		sServObj.closeConnect = function () {
			if (sServObj.isConnected()) {
				sServObj.ws.onclose = function () {
				};
				sServObj.ws.close();
			}
			else {
				// console.log('WEBSOCKET ERROR: was not connected!');
			}
		};

		////////////////////////////
		// EMU-webApp protocol begins here
		//

		// ws getProtocol
		sServObj.getProtocol = function () {
			var request = {
				type: 'GETPROTOCOL'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getProtocol
		sServObj.getDoUserManagement = function () {
			var request = {
				type: 'GETDOUSERMANAGEMENT'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws logOnUser
		sServObj.logOnUser = function (name, pwd) {
			var request = {
				type: 'LOGONUSER',
				userName: name,
				pwd: pwd
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getConfigFile
		sServObj.getDBconfigFile = function () {
			var request = {
				type: 'GETGLOBALDBCONFIG'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws getBundleList
		sServObj.getBundleList = function () {
			var request = {
				type: 'GETBUNDLELIST'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws  getBundle
		sServObj.getBundle = function (name, session) {

			var request = {
				type: 'GETBUNDLE',
				name: name,
				session: session
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		// ws  saveBundle
		sServObj.saveBundle = function (bundleData) {

			var request = {
				type: 'SAVEBUNDLE',
				data: bundleData
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};
		
		// ws  saveConfiguration
		sServObj.saveConfiguration = function (configData) {

			var request = {
				type: 'SAVEDBCONFIG',
				data: configData
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};		


		// ws  disconnecting
		sServObj.disconnectWarning = function () {
			var request = {
				type: 'DISCONNECTWARNING'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};


		// ws  GetDoEditDBConfig
		sServObj.getDoEditDBConfig = function () {
			var request = {
				type: 'GETDOEDITDBCONFIG'
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};


		// ws  editDBConfig with subtype and data
		sServObj.editDBConfig = function (subtype, data) {
			var request = {
				type: 'EDITDBCONFIG',
				subtype: subtype,
				data: data
			};
			// Storing in a variable for clarity on what sendRequest returns
			var promise = sendRequest(request);
			return promise;
		};

		//
		// EMU-webApp protocol ends here
		////////////////////////////


		return sServObj;
	});