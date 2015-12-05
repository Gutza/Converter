if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.currency.iface={
	cacheExpiration:24*3600000, // on a daily basis
	pO:false,

	// is the cache expired for this currency?
	cacheExpired: function(curr)
	{
		var d=new Date();
		var pref='date_'+curr;
		if (this.pO.getPrefType(pref)==this.pO.PREF_INVALID) {
			// not available, ergo "expired"
			return true;
		}

		var expirationDate=Number(this.pO.getCharPref(pref))+this.cacheExpiration;
		var currentDate=d.getTime();
		return (currentDate>expirationDate);
	},

	// get this rate from cache, if available (no expiration test)
	retrieveCache:function(from,to)
	{
		var pref='rate_'+from+'_'+to;
		if (this.pO.getPrefType(pref)==this.pO.PREF_INVALID) {
			// not available
			return false;
		}
		return this.pO.getCharPref(pref);
	},

	// try getting this rate from cache, if available and not expired
	getCache:function(from,to)
	{
		if (this.cacheExpired(to)) {
			return false;
		}
		return this.retrieveCache(from,to);
	},

	// This saves the ENTIRE cache at once (all rates)
	saveCache:function(base, rates)
	{
		var d=new Date();
		this.pO.setCharPref('date_'+base, d.getTime());
		for (var curr in rates)
			this.pO.setCharPref('rate_'+curr+'_'+base, rates[curr]);
		return true;
	},

        init:function()
        {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
			getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.converter.currency_data.");
		this.pO=prefs;

		// timedRefreshRates needs currency.iface
		MCE.currency.timedRefreshRates();
        }
}

MCE.currency.iface.init();

}
