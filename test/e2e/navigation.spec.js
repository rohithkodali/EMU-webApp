// tests for Utterence filter 
describe('navigation', function () {

	var ptor;

	browser.get('http://127.0.0.1:9000/');
	
	// beforeEach it
	beforeEach(function () {
		ptor = protractor.getInstance();
	});	
	

	// afterEach it
	afterEach(function () {
		element(by.id('zoomAllBtn')).click();
	});	
	

	it('should have 2 bundles', function() {
	    var elems = element.all(by.repeater('bundle in bundleList | regex:filterText'));
	    expect(elems.count()).toBe(2);
	});
	
	it('should close submenu', function() {
	    element(by.id('submenuOpen')).click();
	});	
	
	it('should select a range in the viewport', function() {
	   var elem = element.all(by.css('.emuwebapp-timelineCanvasMarkup')).get(0);
	   ptor.actions().mouseMove(elem).mouseMove({ x: -250, y: 0 }).mouseDown().mouseMove({ x: 250, y: 0 }).mouseUp().perform();
	   ptor.sleep(800);
	});	
	
	it('should play sound in selected viewport', function() {
	   var elem = element.all(by.css('.emuwebapp-timelineCanvasMarkup')).get(0);
	   ptor.actions().mouseMove(elem).mouseMove({ x: -250, y: 0 }).mouseDown().mouseMove({ x: 250, y: 0 }).mouseUp().perform();
	   element(by.id('playSelBtn')).click();
	   ptor.sleep(900);
	});	
	
	it('should play sound in zoomed viewport', function() {
	   element(by.id('zoomInBtn')).click();	
	   element(by.id('zoomInBtn')).click();	
	   element(by.id('zoomLeftBtn')).click();	
	   element(by.id('playViewBtn')).click();
	   ptor.sleep(1000);
	});		

	it('should play complete sound', function () {
		element(by.id('playAllBtn')).click();
		ptor.sleep(2950);
	});		
	
	it('should open, rename and save a label', function() {
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomInBtn')).click();
		};
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomRightBtn')).click();
		};		
	    ptor.sleep(800);
	    ptor.actions().mouseMove(element(by.id('Phonetic'))).mouseMove( { x: -200, y: 0 }).doubleClick().perform();
	    var area = by.css('.emuwebapp-labelEdit'); 
	    expect(ptor.isElementPresent(area)).toBe(true);
	    element(by.css('.emuwebapp-labelEdit')).sendKeys('TEST');
	    ptor.actions().sendKeys(protractor.Key.ENTER).perform();
	    ptor.sleep(1000);
	});	
	
	it('should tab', function() {
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomInBtn')).click();
		};
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomRightBtn')).click();
		};		
	    ptor.actions().mouseMove(element(by.id('Phonetic'))).mouseMove( { x: -200, y: 0 }).click().perform();
	    ptor.actions().sendKeys(protractor.Key.TAB).perform();
	    ptor.sleep(200);
	    ptor.actions().sendKeys(protractor.Key.TAB).perform();
	    ptor.sleep(200);
	    ptor.actions().sendKeys(protractor.Key.TAB).perform();
	    ptor.sleep(200);
	    ptor.actions().sendKeys(protractor.Key.TAB).perform();	    
	    ptor.sleep(200);
	    ptor.actions().keyDown(protractor.Key.SHIFT).sendKeys(protractor.Key.TAB).keyUp(protractor.Key.SHIFT).perform();
	    ptor.sleep(200);
	    ptor.actions().keyDown(protractor.Key.SHIFT).sendKeys(protractor.Key.TAB).keyUp(protractor.Key.SHIFT).perform();
	    ptor.sleep(200);
	    ptor.actions().keyDown(protractor.Key.SHIFT).sendKeys(protractor.Key.TAB).keyUp(protractor.Key.SHIFT).perform();
	    ptor.sleep(200);
	    ptor.actions().keyDown(protractor.Key.SHIFT).sendKeys(protractor.Key.TAB).keyUp(protractor.Key.SHIFT).perform();
	});	
						
	
	it('should move a boundary', function() {
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomInBtn')).click();
		};
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomRightBtn')).click();
		};		
	    ptor.sleep(1000);
	    ptor.actions().mouseMove(element(by.id('Phonetic'))).mouseMove( { x: -200, y: 0 }).mouseDown().mouseMove( { x: -200, y: 0 }).mouseUp().perform();
	    ptor.sleep(1000);
	});	
	it('should zoom in to the selected viewing range', function() {
	   element(by.id('zoomSelBtn')).click();
	});		

	it('should zoom out to default view', function() {
	   element(by.id('zoomAllBtn')).click();
	});	

	it('should overzoom to check boundaries for in and out', function () {
		for (var i = 0; i < 30; i++) {
			element(by.id('zoomInBtn')).click();
		};

		for (var i = 0; i < 30; i++) {
			element(by.id('zoomOutBtn')).click();
		};
	});

	it('should overzoom to check boundaries for left and right', function () {
		for (var i = 0; i < 3; i++) {
			element(by.id('zoomInBtn')).click();
		};

		for (var i = 0; i < 30; i++) {
			element(by.id('zoomLeftBtn')).click();
		};
		
		for (var i = 0; i < 40; i++) {
			element(by.id('zoomRightBtn')).click();
		};

		element(by.id('zoomAllBtn')).click();
	});



	it('should move around with zoom', function () {
		for (var i = 0; i < 5; i++) {
			element(by.id('zoomInBtn')).click();
		}

		for (var i = 0; i < 5; i++) {
			element(by.id('zoomLeftBtn')).click();
		}

		for (var i = 0; i < 5; i++) {
			element(by.id('zoomRightBtn')).click();
		}

		for (var i = 0; i < 5; i++) {
			element(by.id('zoomOutBtn')).click();
		}
	});

	
	

});