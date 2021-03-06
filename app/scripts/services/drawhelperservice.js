'use strict';

angular.module('emuwebApp')
	.service('Drawhelperservice', function Drawhelperservice(viewState, ConfigProviderService, Soundhandlerservice, fontScaleService, Ssffdataservice, mathHelperService) {

		//shared service object to be returned
		var sServObj = {};

		function getScale(ctx, str, scale) {
			return ctx.measureText(str).width * scale;
		}

		function getScaleWidth(ctx, str1, str2, scaleX) {
			if (str1 !== undefined && str1.toString().length > str2.toString().length) {
				return getScale(ctx, str1, scaleX);
			} else {
				return getScale(ctx, str2, scaleX);
			}
		}


		/**
		 * drawing method to draw single line between two
		 * envelope points. Is used by drawOsciOnCanvas if
		 * envelope drawing is done
		 * @param index
		 * @param value
		 * @param max
		 * @param prevPeak
		 * @param canvas
		 */

		function drawFrame(viewState, index, value, min, max, prevPeak, canvas, config) {

			var ctx = canvas.getContext('2d');

			//cur
			var w = 1;

			// var h = Math.round(value * (canvas.height / max)); //rel to max
			var x = index * w;
			// var y = Math.round((canvas.height - h) / 2);
			var y = ((max - value) / (max - min)) * canvas.height;

			//prev
			// var prevH = Math.round(prevPeak * (canvas.height / max));
			var prevX = (index - 1) * w;
			// var prevY = Math.round((canvas.height - prevH) / 2);
			var prevY = ((max - prevPeak) / (max - min)) * canvas.height;

			ctx.strokeStyle = ConfigProviderService.design.color.black;
			ctx.moveTo(prevX, prevY);
			ctx.lineTo(x, y);
		}

		sServObj.osciPeaks = [];


		/**
		 * get current peaks to be drawn
		 * if drawing over sample exact -> samples
		 * if multiple samples per pixel -> calculate envelope points
		 */

		sServObj.calculatePeaks = function (viewState, canvas, data) {
			var samplePerPx = (viewState.curViewPort.eS + 1 - viewState.curViewPort.sS) / canvas.width; // PCM Samples per new pixel + one to correct for subtraction
			var numberOfChannels = 1; // hardcode for now...

			var peaks = [];
			var minPeak = Infinity;
			var maxPeak = -Infinity;

			var relData;

			if (samplePerPx <= 1) {
				// check if view at start
				if (viewState.curViewPort.sS === 0) {
					relData = data.subarray(viewState.curViewPort.sS, viewState.curViewPort.eS + 2); // +2 to compensate for length
				} else {
					relData = data.subarray(viewState.curViewPort.sS - 1, viewState.curViewPort.eS + 2); // +2 to compensate for length
				}

				minPeak = Math.min.apply(Math, relData);
				maxPeak = Math.max.apply(Math, relData);
				peaks = Array.prototype.slice.call(relData);

			} else {
				relData = data.subarray(viewState.curViewPort.sS, viewState.curViewPort.eS);

				for (var curPxIdx = 0; curPxIdx < canvas.width; curPxIdx++) {
					var avrVal = 0;
					for (var c = 0; c < numberOfChannels; c++) {

						var vals = relData.subarray(curPxIdx * samplePerPx, (curPxIdx + 1) * samplePerPx);
						// var peak = -Infinity;

						var sum = 0;
						for (var p = 0, l = vals.length; p < l; p++) {
							// if (vals[p] > peak) {
							// 	peak = vals[p];
							// }
							sum += vals[p];
						}
						avrVal += sum / vals.length;
					}

					peaks[curPxIdx] = avrVal;
					if (avrVal > maxPeak) {
						maxPeak = avrVal;
					}
					if (avrVal < minPeak) {
						minPeak = avrVal;
					}

				}
			} //else
			return {
				'peaks': peaks,
				'minPeak': minPeak,
				'maxPeak': maxPeak,
				'samplePerPx': samplePerPx
			};
		};


		/**
		 * @param cps color provider service
		 */

		sServObj.freshRedrawDrawOsciOnCanvas = function (viewState, canvas, allPeakVals, buffer, config) {

			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			//set font
			// ctx.font = (this.params.fontPxSize + "px" + " " + this.params.fontType);

			if (allPeakVals.peaks && allPeakVals.samplePerPx >= 1) {
				ctx.beginPath();
				allPeakVals.peaks.forEach(function (peak, index) {
					if (index !== 0) {
						drawFrame(viewState, index, peak, allPeakVals.minPeak, allPeakVals.maxPeak, allPeakVals.peaks[index - 1], canvas, config);
					}
				});
				ctx.stroke();

			} else if (allPeakVals.samplePerPx < 1) {
				// console.log("at 0 over sample exact")
				var hDbS = (1 / allPeakVals.samplePerPx) / 2; // half distance between samples
				var sNr = viewState.curViewPort.sS;
				// over sample exact
				ctx.strokeStyle = ConfigProviderService.design.color.black;
				ctx.fillStyle = ConfigProviderService.design.color.black;
				// ctx.beginPath();
				var i;
				if (viewState.curViewPort.sS === 0) {
					ctx.moveTo(hDbS, (allPeakVals.peaks[0] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height);
					for (i = 0; i < allPeakVals.peaks.length; i++) {
						ctx.lineTo(i / allPeakVals.samplePerPx + hDbS, (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height);
					}
					ctx.stroke();
					// draw sample dots
					for (i = 0; i < allPeakVals.peaks.length; i++) {
						ctx.beginPath();
						ctx.arc(i / allPeakVals.samplePerPx + hDbS, (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height - 3, 4, 0, 2 * Math.PI, false);
						ctx.stroke();
						ctx.fill();
						if (config.vals.restrictions.drawSampleNrs) {
							ctx.strokeText(sNr, i / allPeakVals.samplePerPx + hDbS, (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height - 10);
							sNr = sNr + 1;
						}
					}
				} else {
					//draw lines
					ctx.beginPath();
					ctx.moveTo(-hDbS, canvas.height - ((allPeakVals.peaks[0] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height));
					for (i = 1; i <= allPeakVals.peaks.length; i++) {
						ctx.lineTo(i / allPeakVals.samplePerPx - hDbS, canvas.height - ((allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height + 3));
					}
					ctx.stroke();
					// draw sample dots
					for (i = 1; i <= allPeakVals.peaks.length; i++) {
						ctx.beginPath();
						ctx.arc(i / allPeakVals.samplePerPx - hDbS, canvas.height - ((allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height) - 3, 4, 0, 2 * Math.PI, false);
						ctx.stroke();
						ctx.fill();
						if (config.vals.restrictions.drawSampleNrs) {
							ctx.fillText(sNr, i / allPeakVals.samplePerPx - hDbS, canvas.height - (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height - 10);
							sNr = sNr + 1;
						}
					}

				}
			}
			if (config.vals.restrictions.drawZeroLine) {
				// draw zero line
				ctx.strokeStyle = ConfigProviderService.design.color.blue;
				ctx.fillStyle = ConfigProviderService.design.color.blue;

				if (allPeakVals.samplePerPx >= 1) {
					var zeroLineY = canvas.height - ((0 - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height);
					ctx.beginPath();
					ctx.moveTo(0, zeroLineY);
					ctx.lineTo(canvas.width, zeroLineY);
					ctx.stroke();
					ctx.fillText('0', 5, canvas.height / 2 - 5, canvas.width);
				} else {
					var zeroLineY = canvas.height - ((0 - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height);
					ctx.beginPath();
					ctx.moveTo(0, zeroLineY);
					ctx.lineTo(canvas.width, zeroLineY);
					ctx.stroke();
					ctx.fill();
					ctx.fillText('0', 5, canvas.height - ((0 - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height) - 5, canvas.width);
				}
				// see if Chrome ->dashed line
				//if (navigator.vendor === 'Google Inc.') {
				//	ctx.setLineDash([0]);
				//}
			}
		};


		/**
		 * drawing method to drawMovingBoundaryLine
		 */

		sServObj.drawMovingBoundaryLine = function (ctx) {

			var xOffset, sDist;
			sDist = viewState.getSampleDist(ctx.canvas.width);

			// calc. offset dependant on type of level of mousemove  -> default is sample exact
			if (viewState.getcurMouseLevelType() === 'SEGMENT') {
				xOffset = 0;
			} else {
				xOffset = (sDist / 2);
			}

			if (viewState.movingBoundary) {
				ctx.fillStyle = ConfigProviderService.design.color.blue;
				var p = Math.round(viewState.getPos(ctx.canvas.width, viewState.movingBoundarySample));
				if (viewState.getcurMouseisLast()) {
					ctx.fillRect(p + sDist, 0, 1, ctx.canvas.height);
				} else {
					ctx.fillRect(p + xOffset, 0, 1, ctx.canvas.height);
				}
			}

		};


		/**
		 * drawing method to drawCurViewPortSelected
		 */

		sServObj.drawCurViewPortSelected = function (ctx, drawTimeAndSamples) {

			var fontSize = ConfigProviderService.design.font.small.size.slice(0, -2) * 1;
			var xOffset, sDist, space, horizontalText, scaleX;
			sDist = viewState.getSampleDist(ctx.canvas.width);

			// calc. offset dependant on type of level of mousemove  -> default is sample exact
			if (viewState.getcurMouseLevelType() === 'seg') {
				xOffset = 0;
			} else {
				xOffset = (sDist / 2);
			}

			var posS = viewState.getPos(ctx.canvas.width, viewState.curViewPort.selectS);
			var posE = viewState.getPos(ctx.canvas.width, viewState.curViewPort.selectE);

			if (posS === posE) {

				ctx.fillStyle = ConfigProviderService.design.color.transparent.black;
				ctx.fillRect(posS + xOffset, 0, 2, ctx.canvas.height);

				if (drawTimeAndSamples) {
					if (viewState.curViewPort.sS !== viewState.curViewPort.selectS && viewState.curViewPort.selectS !== -1) {
						scaleX = ctx.canvas.width / ctx.canvas.offsetWidth;
						space = getScaleWidth(ctx, viewState.curViewPort.selectS, mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.selectS / Soundhandlerservice.wavJSO.SampleRate, 6), scaleX);
						fontScaleService.drawUndistortedTextTwoLines(ctx, viewState.curViewPort.selectS, mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.selectS / Soundhandlerservice.wavJSO.SampleRate, 6), fontSize, ConfigProviderService.design.font.small.family, posE + 5, 0, ConfigProviderService.design.color.black, true);
					}
				}
			} else {
				ctx.fillStyle = ConfigProviderService.design.color.transparent.grey;
				ctx.fillRect(posS, 0, posE - posS, ctx.canvas.height);
				ctx.strokeStyle = ConfigProviderService.design.color.transparent.black;
				ctx.beginPath();
				ctx.moveTo(posS, 0);
				ctx.lineTo(posS, ctx.canvas.height);
				ctx.moveTo(posE, 0);
				ctx.lineTo(posE, ctx.canvas.height);
				ctx.closePath();
				ctx.stroke();

				if (drawTimeAndSamples) {
					// start values
					scaleX = ctx.canvas.width / ctx.canvas.offsetWidth;
					space = getScaleWidth(ctx, viewState.curViewPort.selectS, mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.selectS / Soundhandlerservice.wavJSO.SampleRate, 6), scaleX);
					fontScaleService.drawUndistortedTextTwoLines(ctx, viewState.curViewPort.selectS, mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.selectS / Soundhandlerservice.wavJSO.SampleRate, 6), fontSize, ConfigProviderService.design.font.small.family, posS - space - 5, 0, ConfigProviderService.design.color.black, false);

					// end values
					fontScaleService.drawUndistortedTextTwoLines(ctx, viewState.curViewPort.selectE, mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.selectE / Soundhandlerservice.wavJSO.SampleRate, 6), fontSize, ConfigProviderService.design.font.small.family, posE + 5, 0, ConfigProviderService.design.color.black, true);
					// dur values
					// check if space
					space = getScale(ctx, mathHelperService.roundToNdigitsAfterDecPoint((viewState.curViewPort.selectE - viewState.curViewPort.selectS) / Soundhandlerservice.wavJSO.SampleRate, 6), scaleX);

					if (posE - posS > space) {
						var str1 = viewState.curViewPort.selectE - viewState.curViewPort.selectS - 1;
						var str2 = mathHelperService.roundToNdigitsAfterDecPoint(((viewState.curViewPort.selectE - viewState.curViewPort.selectS) / Soundhandlerservice.wavJSO.SampleRate), 6);
						space = getScaleWidth(ctx, str1, str2, scaleX);
						fontScaleService.drawUndistortedTextTwoLines(ctx, str1, str2, fontSize, ConfigProviderService.design.font.small.family, posS + (posE - posS) / 2 - space / 2, 0, ConfigProviderService.design.color.black, false);
					}
				}

			}

		};

		/**
		 * drawing method to drawCrossHairs
		 */

		sServObj.drawCrossHairs = function (ctx, mouseEvt, min, max, unit, trackname) {
			// console.log(mathHelperService.roundToNdigitsAfterDecPoint(min, round))
			if (ConfigProviderService.vals.restrictions.drawCrossHairs) {

				var fontSize = ConfigProviderService.design.font.small.size.slice(0, -2) * 1;
				// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.strokeStyle = ConfigProviderService.design.color.transparent.red;
				ctx.fillStyle = ConfigProviderService.design.color.transparent.red;

				// see if Chrome -> dashed line
				//if (navigator.vendor === 'Google Inc.') {
				//	ctx.setLineDash([2]);
				//}

				// draw lines
				var mouseX = viewState.getX(mouseEvt);
				var mouseY = viewState.getY(mouseEvt);

				//if (navigator.vendor === 'Google Inc.') {
				//	ctx.setLineDash([0]);
				//}

				// draw frequency / sample / time
				ctx.font = (ConfigProviderService.design.font.small.size + 'px ' + ConfigProviderService.design.font.small.family);
				var mouseFreq = mathHelperService.roundToNdigitsAfterDecPoint(max - mouseY / ctx.canvas.height * max, 2); // SIC only uses max
				var tW = ctx.measureText(mouseFreq + unit).width * fontScaleService.scaleX;
				var s1 = Math.round(viewState.curViewPort.sS + mouseX / ctx.canvas.width * (viewState.curViewPort.eS - viewState.curViewPort.sS));
				var s2 = mathHelperService.roundToNdigitsAfterDecPoint(viewState.getViewPortStartTime() + mouseX / ctx.canvas.width * (viewState.getViewPortEndTime() - viewState.getViewPortStartTime()), 6);

				if (max !== undefined || min !== undefined) {
					if (trackname == "OSCI") {
						// no horizontal values
						ctx.beginPath();
						//ctx.moveTo(0, mouseY);
						//ctx.lineTo(5, mouseY + 5);
						//ctx.moveTo(0, mouseY);
						//ctx.lineTo(ctx.canvas.width, mouseY);
						//ctx.lineTo(ctx.canvas.width - 5, mouseY + 5);
						ctx.moveTo(mouseX, 0);
						ctx.lineTo(mouseX, ctx.canvas.height);
						ctx.stroke();
					} else if (trackname == "SPEC") {
						fontScaleService.drawUndistortedText(ctx, mouseFreq + unit, fontSize, ConfigProviderService.design.font.small.family, 5, mouseY, ConfigProviderService.design.color.transparent.red, true);
						fontScaleService.drawUndistortedText(ctx, mouseFreq + unit, fontSize, ConfigProviderService.design.font.small.family, (ctx.canvas.width - 5 - tW * (ctx.canvas.width / ctx.canvas.offsetWidth)), mouseY, ConfigProviderService.design.color.transparent.red, true);
						ctx.beginPath();
						ctx.moveTo(0, mouseY);
						ctx.lineTo(5, mouseY + 5);
						ctx.moveTo(0, mouseY);
						ctx.lineTo(ctx.canvas.width, mouseY);
						ctx.lineTo(ctx.canvas.width - 5, mouseY + 5);
						ctx.moveTo(mouseX, 0);
						ctx.lineTo(mouseX, ctx.canvas.height);
						ctx.stroke();
					} else {
						// draw min max an name of track
						var tr = ConfigProviderService.getSsffTrackConfig(trackname);
						var col = Ssffdataservice.getColumnOfTrack(tr.name, tr.columnName);
						mouseFreq = col._maxVal - (mouseY / ctx.canvas.height * (col._maxVal - col._minVal));
						mouseFreq = mathHelperService.roundToNdigitsAfterDecPoint(mouseFreq, 2); // crop
						fontScaleService.drawUndistortedText(ctx, mouseFreq, fontSize, ConfigProviderService.design.font.small.family, 5, mouseY, ConfigProviderService.design.color.transparent.red, true);
						fontScaleService.drawUndistortedText(ctx, mouseFreq, fontSize, ConfigProviderService.design.font.small.family, ctx.canvas.width - 5 - tW * (ctx.canvas.width / ctx.canvas.offsetWidth), mouseY, ConfigProviderService.design.color.transparent.red, true);
						ctx.beginPath();
						ctx.moveTo(0, mouseY);
						ctx.lineTo(5, mouseY + 5);
						ctx.moveTo(0, mouseY);
						ctx.lineTo(ctx.canvas.width, mouseY);
						ctx.lineTo(ctx.canvas.width - 5, mouseY + 5);
						ctx.moveTo(mouseX, 0);
						ctx.lineTo(mouseX, ctx.canvas.height);
						ctx.stroke();
					}
				}
				fontScaleService.drawUndistortedTextTwoLines(ctx, s1, s2, fontSize, ConfigProviderService.design.font.small.family, mouseX + 5, 0, ConfigProviderService.design.color.transparent.red, true);
			}
		};

		/**
		 * drawing method to drawMinMaxAndName
		 * @param ctx is context to be drawn on
		 * @param trackName name of track to be drawn in the center of the canvas (left aligned)
		 * @param min value to be drawn at the bottom of the canvas (left aligned)
		 * @param max value to be drawn at the top of the canvas (left aligned)
		 * @param round value to round to for min/max values (== digits after comma)
		 */

		sServObj.drawMinMaxAndName = function (ctx, trackName, min, max, round) {
			// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.strokeStyle = ConfigProviderService.design.color.black;
			ctx.fillStyle = ConfigProviderService.design.color.black;

			var fontSize = ConfigProviderService.design.font.small.size.slice(0, -2) * 1;

			// var scaleX = ctx.canvas.width / ctx.canvas.offsetWidth;
			var scaleY = ctx.canvas.height / ctx.canvas.offsetHeight;

			var smallFontSize = ConfigProviderService.design.font.small.size.slice(0, -2) * 3 / 4;
			var th = smallFontSize * scaleY;

			// draw corner pointers
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(5, 5);
			ctx.moveTo(0, ctx.canvas.height);
			ctx.lineTo(5, ctx.canvas.height - 5);
			ctx.stroke();
			ctx.closePath();

			// draw trackName
			if (trackName !== '') {
				fontScaleService.drawUndistortedText(ctx, trackName, fontSize, ConfigProviderService.design.font.small.family, 0, ctx.canvas.height / 2 - fontSize * scaleY / 2, ConfigProviderService.design.color.black);
			}

			// draw min/max vals
			if (max !== undefined) {
				fontScaleService.drawUndistortedText(ctx, 'max: ' + mathHelperService.roundToNdigitsAfterDecPoint(max, round), smallFontSize, ConfigProviderService.design.font.small.family, 5, 5, ConfigProviderService.design.color.grey);
			}
			// draw min/max vals
			if (min !== undefined) {
				fontScaleService.drawUndistortedText(ctx, 'min: ' + mathHelperService.roundToNdigitsAfterDecPoint(min, round), smallFontSize, ConfigProviderService.design.font.small.family, 5, ctx.canvas.height - th - 5, ConfigProviderService.design.color.grey);
			}
		};

		/**
		 *
		 */
		sServObj.drawViewPortTimes = function (ctx) {
			ctx.strokeStyle = ConfigProviderService.design.color.black;
			ctx.fillStyle = ConfigProviderService.design.color.black
			ctx.font = (ConfigProviderService.design.font.small.size + ' ' + ConfigProviderService.design.font.small.family);

			var fontSize = ConfigProviderService.design.font.small.size.slice(0, -2) * 1;

			// lines to corners
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(5, 5);
			ctx.moveTo(ctx.canvas.width, 0);
			ctx.lineTo(ctx.canvas.width - 5, 5);
			ctx.closePath();
			ctx.stroke();
			var scaleX = ctx.canvas.width / ctx.canvas.offsetWidth;
			var scaleY = ctx.canvas.height / ctx.canvas.offsetHeight;
			var sTime;
			var eTime;
			var horizontalText;
			var space;
			if (viewState.curViewPort) {
				//draw time and sample nr
				sTime = mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.sS / Soundhandlerservice.wavJSO.SampleRate, 6);
				eTime = mathHelperService.roundToNdigitsAfterDecPoint(viewState.curViewPort.eS / Soundhandlerservice.wavJSO.SampleRate, 6);
				fontScaleService.drawUndistortedTextTwoLines(ctx, viewState.curViewPort.sS, sTime, fontSize, ConfigProviderService.design.font.small.family, 5, 5, ConfigProviderService.design.color.black, true);
				space = getScaleWidth(ctx, viewState.curViewPort.eS, eTime, scaleX);
				fontScaleService.drawUndistortedTextTwoLines(ctx, viewState.curViewPort.eS, eTime, fontSize, ConfigProviderService.design.font.small.family, ctx.canvas.width - space - 5, 0, ConfigProviderService.design.color.black, false);
			}
		};
		return sServObj;
	});
