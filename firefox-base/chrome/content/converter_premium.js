if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.premiumLoader={
	premium_hash: "a23fd99a8f46d86472d44dc4ef5fbba587a76d8e1da53ad8aba7e51c54537c8b",

	getURL:function(key)
	{
		if (key=='amo-test') {
			return "http://www.mozilla.org/";
		}
		return "http://premium.the-converter.co/premium.jscript";
	},

	load:function(key)
	{
		MCE.premium=undefined;

		if (key==undefined)
			key=MCE.prefs.getPref('premium_key');

		if (key.length==0)
			return false;

		var url=this.getURL(key);
		MCE.staticEvaluator.evaluate(url, this.premium_hash, key);
	},
}
MCE.premiumLoader.load();
}
