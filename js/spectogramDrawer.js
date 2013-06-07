



var spectogramDrawer = {

    init: function (params) {
        var my = this;
        my.myWindow = {
                BARTLETT:       1,
                BARTLETTHANN:   2,
                BLACKMAN:       3,
                COSINE:         4,
                GAUSS:          5,
                HAMMING:        6,
                HANN:           7,
                LANCZOS:        8,
                RECTANGULAR:    9,
                TRIANGULAR:     10
        } 
        // various mathematical vars
        my.PI = 3.141592653589793;                        // value : Math.PI
        my.TWO_PI = 6.283185307179586;                    // value : 2 * Math.PI
        my.OCTAVE_FACTOR=3.321928094887363;               // value : 1.0/log10(2)	
        my.emphasisPerOctave=3.9810717055349722;          // value : toLinearLevel(6);		
        my.dynamicRange=5000;                             // value : toLinearLevel(50);
        my.dynRangeInDB=50;                               // value : toLevelInDB(dynamicRange);    

        // FFT default vars
        my.N = 512;                                       // default FFT Window Size
        my.alpha = 0.16;                                  // default alpha for Window Function
        my.windowFunction = my.myWindow.BARTLETTHANN;     // default Window Function
        my.sampleRate = 44100;                            // default sample rate
        my.channels = 1;                                  // default number of channels
        my.freq_lower = 0;                                // default upper Frequency
        my.freq = 8000;                                   // default upper Frequency
		my.sampleRate = 44100;                            // default sample Rate
        my.pixel_height = 1;                             // default pixel height per value
        my.renderingCanvas = false;
        // plain old version load from script file
        //my.primeWorkerFile = 'js/spectrogram.js';
        //my.primeWorker = new Worker(my.primeWorkerFile);
        my.primeWorker= new Worker(URL.createObjectURL(blob));
		my.setupEvent();
		my.clearImageCache();
        
        my.offline = params.specCanvas;
        my.context = my.offline.getContext("2d");     
        my.pcmperpixel = 0; 
        my.myImage = new Image();
        my.tempDraw = new Image();
        my.font = "10px Helvetica";
        my.fontColor = "#000";
        my.loadingText = "calculating ...";
        },
        
        setupEvent: function () {
            var my = this;
            my.primeWorker.addEventListener('message', function(event){
            
            	var imgsrc = event.data.img;
            	var cstart = event.data.start;
            	var cend = event.data.end;
            	var cwidth = event.data.width;
            	var cheight = event.data.height;
            
                my.myImage.src = imgsrc;
                
                my.myImage.onload = function() {
    	    	    my.context.drawImage(my.myImage, 0, 0);
    	    	    my.toRetinaRatio(my.offline,my.context);

    	            if(my.imageCache[my.pcmperpixel]==null) 
    	    	        my.imageCache[my.pcmperpixel] = new Array();
    	    	        
    	            if(my.imageCacheCounter[my.pcmperpixel]==null)
    	            	my.imageCacheCounter[my.pcmperpixel] = 0;
    	            
    	            if(my.imageCache[my.pcmperpixel][my.imageCacheCounter[my.pcmperpixel]]==null) { 
    	    	        my.imageCache[my.pcmperpixel][my.imageCacheCounter[my.pcmperpixel]] = new Array();
    	    	        my.imageCache[my.pcmperpixel][my.imageCacheCounter[my.pcmperpixel]][0] = my.sStart;
    	    	        my.imageCache[my.pcmperpixel][my.imageCacheCounter[my.pcmperpixel]][1] = my.sEnd;
    	    	        my.imageCache[my.pcmperpixel][my.imageCacheCounter[my.pcmperpixel]][2] = my.myImage.src;
    	    	        ++my.imageCacheCounter[my.pcmperpixel];
    	    	    }
    	    	        
                }
            });        
        },
        
        killSpectroRenderingThread: function () {
            var my = this;
            my.context.fillStyle = "rgb(255,255,255)";
        	my.context.fillRect(0,0,my.offline.width,my.offline.height);    
        	my.context.fillStyle = my.fontColor;
        	my.context.font = my.font;
        	my.context.fillText(my.loadingText, 2, 10); 
        	my.toRetinaRatio(my.offline,my.context);   
            if(my.primeWorker!=null) {
            	my.primeWorker.terminate();
        		my.primeWorker = null;
        	}
        },
        
        clearImageCache: function () {
            var my = this;
            my.imageCache = null;
            my.imageCacheCounter = null;
            my.imageCache = new Array();            
            my.imageCacheCounter = new Array();            
        },        
        
        toRetinaRatio: function (canvas, context) {
            var backingStoreRatio, ratio;
            var devicePixelRatio = window.devicePixelRatio || 1, backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1, ratio = devicePixelRatio / backingStoreRatio;

            if (devicePixelRatio !== backingStoreRatio) {
                //waveCanvas
                var oldWidth = canvas.clientWidth;
                var oldHeight = canvas.clientHeight;
                canvas.width = oldWidth * ratio;
                canvas.height = oldHeight * ratio;
                canvas.style.width = oldWidth + 'px';
                canvas.style.height = oldHeight + 'px';

                // now scale the context to counter
                // the fact that we've manually scaled
                // our canvas element
                context.scale(ratio, ratio);
            }
        }, 
        
        drawImage: function(mybuf,mystart,myend) {
            var my = this;
            var newpcmperpixel = Math.round((myend-mystart)/my.offline.width);
            if(my.imageCache!=null) {
                
                if(my.imageCache[newpcmperpixel]!=null) {
					var found_complete = false;
					var found_parts = false;
					var pixel_covering = 0;
					var pixel_cache_selected = 0;
					
                    for (var i = 0; i < my.imageCache[newpcmperpixel].length; ++i) {
                        
                    	if(my.imageCache[newpcmperpixel][i][0]==mystart) {
                            my.killSpectroRenderingThread();
                            my.myImage.src = my.imageCache[newpcmperpixel][i][2];
                            my.myImage.onload = function() {
    	    	                my.context.drawImage(my.myImage, 0, 0);
    	    	                my.toRetinaRatio(my.offline,my.context);
    	    	            };
    	    	            found_complete = true;
    	    	            break;
                    	}
                    	if(my.imageCache[newpcmperpixel][i][0] > mystart && 
                    	   my.imageCache[newpcmperpixel][i][1] <= myend) {
                    		var pixel_cover = 0;
                    		if(pixel_cover > pixel_covering ) {
                    			pixel_covering = pixel_cover;
                    		    pixel_cache_selected = i;
                    		    found_parts = true;	
                    		}
                    	}
                    }
                    if(!found_complete) {    // image has to be rendered completely
                    	if(found_parts) {
                    	    console.log(pixel_cache_selected+" is covering "+pixel_covering+ " pixels");
            	            my.killSpectroRenderingThread();
                            my.startSpectroRenderingThread(mybuf,mystart,myend,my.offline.width,my.offline.height,0,my.offline.width);	            	
                    	
                    	}
                    	else {    // image has to be rendered completely
            	            my.killSpectroRenderingThread();
                            my.startSpectroRenderingThread(mybuf,mystart,myend,my.offline.width,my.offline.height,0,my.offline.width);	            	
                        }
                    }
                }
                else {    // image has to be rendered completely
                    my.killSpectroRenderingThread();
                    my.startSpectroRenderingThread(mybuf,mystart,myend,my.offline.width,my.offline.height,0,my.offline.width);				
                }
            }
      			
        },    
         
        
        startSpectroRenderingThread: function (current_buffer,pcm_start,pcm_end,part_width,part_height,part_offset,part_length) {
            var my = this;
            var newFloat32Array = current_buffer.getChannelData(0).subarray(pcm_start, pcm_end+2*my.N);			
            var data_conf = JSON.stringify(current_buffer);
            my.sStart = Math.round(pcm_start);		
            my.sEnd = Math.round(pcm_end);
            my.pcmperpixel = Math.round((my.sEnd-my.sStart)/my.offline.width);
            my.primeWorker = new Worker(URL.createObjectURL(blob));
            my.setupEvent();
            
            my.primeWorker.postMessage({'cmd': 'config', 'N': my.N});
            my.primeWorker.postMessage({'cmd': 'config', 'alpha': my.alpha});
            my.primeWorker.postMessage({'cmd': 'config', 'freq': my.freq});
            my.primeWorker.postMessage({'cmd': 'config', 'freq_low': my.freq_lower});
            my.primeWorker.postMessage({'cmd': 'config', 'start': my.sStart});
            my.primeWorker.postMessage({'cmd': 'config', 'end': my.sEnd});
            my.primeWorker.postMessage({'cmd': 'config', 'myStep': my.pcmperpixel});
            my.primeWorker.postMessage({'cmd': 'config', 'window': my.windowFunction});
            my.primeWorker.postMessage({'cmd': 'config', 'width': part_width});
            my.primeWorker.postMessage({'cmd': 'config', 'height': part_height});
            my.primeWorker.postMessage({'cmd': 'config', 'offset': part_offset}); 
            my.primeWorker.postMessage({'cmd': 'config', 'length': part_length});     
            my.primeWorker.postMessage({'cmd': 'config', 'dynRangeInDB': my.dynRangeInDB});     
            my.primeWorker.postMessage({'cmd': 'pcm', 'config': data_conf});		
            my.primeWorker.postMessage({'cmd': 'pcm', 'stream': newFloat32Array});		
            my.primeWorker.postMessage({'cmd': 'render'});
        }    
};


// URL.createObjectURL
window.URL = window.URL || window.webkitURL;

// "Server response", used in all examples
var response = document.querySelector('#spectroworker').textContent;

var blob;
try {
    blob = new Blob([response], { "type" : "text\/javascript" });
} catch (e) { // Backwards-compatibility
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
    blob = new BlobBuilder();
    blob.append(response);
    blob = blob.getBlob();
}

