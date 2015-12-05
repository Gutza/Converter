if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.staticEvaluator={
	url: '',
	static_hash: '',

	evaluate:function(url, static_hash, key)
	{
		this.static_hash=static_hash;
		this.url=url;
		MCE.iface.retrieveURL(url, key, this.onRetrieve);
	},

	onRetrieve:function(event)
	{
		MCE.staticEvaluator.finishEvaluating(event);
	},

	finishEvaluating:function(result)
	{
		var success=this._doFinishEvaluating(result);

		if (MCE.prefsWindow==undefined)
			return;

		MCE.prefsWindow.MCE.prefs.gui.onActivationFinished(success);
	},

	_doFinishEvaluating: function(result)
	{
		if (!result.clean) {
			this.log("Fatal exception thrown when retrieving Premium code: "+result.exception);
			return false;
		}
		if (result.status!=200) {
			if (result.status!=402) {
				this.log("Unexpected status when retrieving Premium code: "+result.status);
			}
			return false;
		}
		var javascript=result.responseText;
		
		if (!this.validateChecksum(javascript, this.static_hash))
			return false;

		eval(javascript); // AMO reviewers: see http://www.the-converter.co/AMO.php
		MCE.iface.initPremiumControls();
		return true;
	},

	validateChecksum:function(js, static_hash)
	{
		var converter =  
			Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].  
			createInstance(Components.interfaces.nsIScriptableUnicodeConverter);  
  
		converter.charset = "UTF-8";  

		// result is an out parameter,  
		// result.value will contain the array length  
		var result = {};  

		// data is an array of bytes  
		var data = converter.convertToByteArray(js, result);  
		var ch = Components.classes["@mozilla.org/security/hash;1"]  
			.createInstance(Components.interfaces.nsICryptoHash);  
		ch.init(ch.SHA256);
		ch.update(data, data.length);  
		var hash = ch.finish(false);  
 
		var s='';
		for (var i=0;i<hash.length;i++) {
			s+=("0"+hash.charCodeAt(i).toString(16)).slice(-2);
		}

		if (s!=static_hash) {
			// This is shown in the error console
			this.log(
				"Hash verification failed: expected "+
				static_hash+"; received "+s
			);
			return false;
		}
		return true;
	},

	log:function(message)
	{
		return MCE.iface.log("Static evaluator ["+this.url+"]: "+message);
	}
};

}
