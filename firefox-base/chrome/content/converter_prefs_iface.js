if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.prefs.iface={
	// Our very own nsIPrefBranch object; it gets destroyed after each operation
	pO:false,
	lastCache:0,
	
	// public; direct use discouraged
	buildCache:function()
	{
		var dateObject=new Date();
		if (MCE.prefs.prefs_cached && this.lastCache+500>dateObject.getTime()) {
			return true;
		}
		for(var pref in MCE.prefs.pref_descriptor) {
			if (this.pO.getPrefType(pref)==this.pO.PREF_INVALID) {
				MCE.prefs.setPref(pref,MCE.prefs.getPrefDefault(pref));
			}
			MCE.prefs.prefs[pref]=this._readPref(pref);
		}
		MCE.prefs.prefs_cached=true;
		this.lastCache=dateObject.getTime();
		return true;
	},
	
	// public; direct use discouraged
	clearCache:function()
	{
		MCE.prefs.prefs_cached=false;
	},

	init:function()
	{
		this.pO = Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefService);
		this.pO = this.pO.getBranch("extensions.converter.preferences.");
	},
	
	// private
	_readPref:function(pref)
	{
		var prefType=MCE.prefs.getPrefType(pref);
		var prefValue=null;
		try {
			switch(prefType) {
				case 'boolean':
					prefValue=this.pO.getBoolPref(pref);
					break;
				case 'string':
					prefValue=this.pO.getCharPref(pref);
					break;
				case 'integer':
					prefValue=this.pO.getIntPref(pref);
					break;
				default:
					throw new String("Unknown preference type: "+prefType);
			}
		} catch(e) {
			MCE.iface.log("Converter: problem reading preference "+pref+": "+e);
			return null;
		}

		return prefValue;
	},
	
	// private
	_writePref:function(pref,val)
	{
		var prefType=MCE.prefs.getPrefType(pref);
		var result;
		try {
			switch(prefType) {
				case 'boolean':
					if(typeof(val)!='boolean')
						throw new String("Boolean preference "+pref+" can't be set to another type ("+typeof(val)+")");
					this.pO.setBoolPref(pref, val);
					return true;
				case 'string':
					// Rely on type casting for integers and whatnot
					this.pO.setCharPref(pref, val);
					return true;
				case 'integer':
					if(typeof(val)!='number')
							throw new String("Integer preference "+pref+" can't be set to another type ("+typeof(val)+")");
				this.pO.setIntPref(pref, val);
					return true;
				default:
					throw new String("Unknown preference type: "+prefType);
			}
		} catch(e) {
			MCE.iface.log("Converter: problem saving preference "+pref+": "+e);
			return false;
		}
	}
}

MCE.prefs.iface.init();

}
