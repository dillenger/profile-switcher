var profileSwitcherUtils = {
	
	os : function() {
		return navigator.platform.toLowerCase();
	},

	openFPsync : function(fp) {
		let done = false;	
		let rv, result;
		fp.open(result => {
			rv = result;
			done = true;
		});
		let thread = Components.classes["@mozilla.org/thread-manager;1"].getService().currentThread;
		while (!done) {
			thread.processNextEvent(true);
		}
		return rv;
	}

};


