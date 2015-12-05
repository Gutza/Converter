if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.prefs.gui={
	currencyControlsInitialized: false,

	browserWindow: null,

	lastKey: null,
	previousPremium: null,

	updateInterface:function()
	{
		var info=[{
			type:"INFO",
			desc:"Previous conversions will not be affected by changes in the preferences."
		}];
		document.getElementById('pref_custom_convert_selection').disabled=!document.getElementById('pref_selection_menu').checked;
		if (
			document.getElementById('pref_only_show_converted').checked || 
			document.getElementById("pref_replace_original").checked
		) {
			info.push({
				type:"WARNING",
				desc:"You have chosen to disable some of the Converter's default provisions "+
				"meant to ensure visual confirmation for conversions. Please be advised the Converter has "+
				"known limitations regarding the number of formats it is able to process, and disabling any "+
				"of the default provisions will result in ambiguity in specific cases."
			});
			if (document.getElementById('pref_auto_convert').checked) {
				info.push({
					type:'WARNING',
					desc:"In addition, you have chosen to auto-convert all pages. This option is "+
					"perfectly safe on its own, but since you have also disabled some of the "+
					"Converter's default confirmation provisions, the results can be particularly "+
					"misleading!"
				});
			}
		}
		if (
			document.getElementById('pref_currency_enabled').checked &&
			!document.getElementById('pref_myCurrency').value
		) {
			info.push({
				type:'WARNING',
				desc:"You have enabled currency conversions, but you haven't selected a preferred currency. "+
				"Please choose your currency if you want to use this functionality."
			});
		}
		if (document.getElementById('pref_thou_sep').value==document.getElementById('pref_dec_sep').value) {
			info.push({
				type:"WARNING",
				desc:"You have selected the same thousands separator and decimal separator; "+
				"this will result in ambiguous values."
			});
		}

		var contextualEnabled=document.getElementById('pref_selection_menu').checked;
		document.getElementById('label_default_unit').disabled=!contextualEnabled;
		document.getElementById('pref_default_unit').disabled=!contextualEnabled;
		
		document.getElementById('pref_in_fract').disabled=(
			document.getElementById('pref_metric').value==1 &&
			document.getElementById('pref_one_way').checked
		);

		document.getElementById('pref_in_fract').disabled|=
		document.getElementById('pref_metric').disabled=
		document.getElementById('pref_celsius').disabled=
		document.getElementById('pref_one_way').disabled=
			!document.getElementById('pref_unit_enabled').checked;

		document.getElementById('pref_24h').disabled=
			!document.getElementById('pref_time_enabled').checked;

		// Buy/activate
		switch(this.getActivationAction()) {
			case "ACTIVATED INFO":
				MCE.prefs.gui.setLicenseLabel("Activated");
			case "INACTIVATED INFO":
				document.getElementById('button_buy_activate').label="What's this?";
				break;
			case "REACTIVATE":
				document.getElementById('button_buy_activate').label="Change key";
				MCE.prefs.gui.setLicenseLabel("Already activated with a different key!");
				info.push({
					type:"WARNING",
					desc:"You're changing a valid key, only proceed if you know what you're doing! Click Cancel to keep the current key."
				});
				break;
			case "ACTIVATE":
				document.getElementById('button_buy_activate').label="Activate";
				break;
		}

		var activated=(this.browserWindow.MCE.premium!=undefined);
		document.getElementById('pref_enable_precision_units').disabled=
		document.getElementById('pref_precision_units').disabled=
		document.getElementById('pref_enable_precision_currency').disabled=
		document.getElementById('pref_precision_currency').disabled=
		document.getElementById('pref_exchange_hours').disabled=
		document.getElementById('button_switch_currency').disabled=
		document.getElementById('pref_foreignCurrency').disabled=
		document.getElementById('add-custom').disabled=
		document.getElementById('save-custom').disabled=
			!activated;

		document.getElementById('custom-premium').hidden=
			activated;

		var custom0=document.getElementById('custom0');
		if (activated) {
			document.getElementById('pref_precision_units').disabled=
				!document.getElementById('pref_enable_precision_units').checked;
			document.getElementById('pref_precision_currency').disabled=
				!document.getElementById('pref_enable_precision_currency').checked;
			document.getElementById('button_switch_currency').disabled=(
				(document.getElementById('pref_foreignCurrency').value=='') ||
				(document.getElementById('pref_myCurrency').value=='')
			);
		} else {
			this.recursiveSetDisable(document.getElementById('custom0'),true);
		}

		this.showInfo(info);
	},

	recursiveSetDisable:function(dad,value)
	{
		if (dad.disabled!=undefined) {
			dad.disabled=value;
		}
		var kids=dad.childNodes;
		if (kids.length==0) {
			return dad;
		}
		for(var i=0;i<kids.length;i++) {
			this.recursiveSetDisable(kids[i],value);
		}
		return dad;
	},

	switchCurrencies:function()
	{
		var my=document.getElementById('pref_myCurrency').value;
		var foreign=document.getElementById('pref_foreignCurrency').value;
		if ((my=='') || (foreign=='')) return;
		document.getElementById('pref_myCurrency').value=foreign;
		document.getElementById('pref_myCurrency_basic').value=foreign;
		document.getElementById('pref_foreignCurrency').value=my;
	},

	isBasicInterface: function()
	{
		return !document.getElementById('tab-basic-tab').hidden;
	},

	switchExpert: function()
	{
		var basic=this.isBasicInterface();

		// We alter the hidden attribute, which is a negation in itself
		document.getElementById("tab-basic-tab").hidden=basic;
		document.getElementById("tab-generic-tab").hidden=
		document.getElementById("tab-display-tab").hidden=
		document.getElementById("tab-iface-tab").hidden=
			!basic;

		var defaultTab, buttonLabel;
		// remember, basic is whether is WAS basic before the switch
		if (basic) {
			defaultTab=1;
			buttonLabel="Switch to basic preferences";
		} else {
			defaultTab=0;
			buttonLabel="Switch to advanced preferences";
		}
		document.getElementById("tab-holder").selectedIndex=defaultTab;
		this.tabSwitched();

		document.getElementById("but-switch-expert").label=buttonLabel;
	},

	doPreset: function(preset)
	{
		if (MCE.prefs.getPref('configured') && !confirm("Are you sure you want to reset to preset "+preset+"?"))
			return;

		switch(preset) {
			case "EU":
				this.applyPreset_EU();
				break;
			case "USA":
				this.applyPreset_USA();
				break;
			default:
				throw new String("Unknown preset: "+preset);
		}
	},

	applyPreset_EU: function()
	{
		this.applyGenericPreset({
			currency: "EUR",
			time: 1,
			metric: 1,
			thou_sep: ".",
			dec_sep: ",",
		});
	},

	applyPreset_USA: function()
	{
		this.applyGenericPreset({
			currency: "USD",
			time: 0,
			metric: 0,
			thou_sep: ",",
			dec_sep: ".",
		});
	},

	applyGenericPreset: function(meta)
	{
		// Currency
		document.getElementById("pref_currency_enabled_basic").checked=true;
		var listIndex=MCE.util.inArray(meta.currency, MCE.currency.currencies);
		document.getElementById("pref_myCurrency_basic").selectedItem=
			document.getElementById("curr_"+meta.currency+"_basic");
		// YES, we need to also set this explicitly, otherwise
		// we have a problem when pref_myCurrency isn't set
		// because of the way we eliminate "please select your currency"
		document.getElementById("pref_myCurrency").selectedItem=
			document.getElementById("curr_"+meta.currency);

		// Units
		document.getElementById("pref_unit_enabled").checked=true;
		document.getElementById("pref_metric").value=meta.metric;
		document.getElementById("pref_celsius").value=meta.metric;
		document.getElementById("pref_one_way").checked=true;

		// 12h/24h
		document.getElementById("pref_time_enabled").checked=true;
		document.getElementById("pref_24h").value=meta.time;

		// Separators
		document.getElementById("pref_thou_sep").value=meta.thou_sep;
		document.getElementById("pref_dec_sep").value=meta.dec_sep;

		this.initCurrencyControls();
	},

	syncBasicOther: function()
	{
		var autoconvertId;
		if (this.isBasicInterface()) {
			autoconvertId="pref_auto_convert_basic";
		} else {
			autoconvertId="pref_auto_convert";
		}

		document.getElementById("pref_auto_convert_basic").checked=
			document.getElementById("pref_auto_convert").checked=
			document.getElementById(autoconvertId).checked;

		this.updateInterface();
	},

	getActivationAction:function()
	{
		if (
			(this.browserWindow.MCE.premium!=undefined) &&
			(document.getElementById('premium_key').value==MCE.prefs.getPref('premium_key'))
		) { // Premium already activated, key unchanged
			return "ACTIVATED INFO";
		} else if (this.browserWindow.MCE.premium!=undefined) { // Activated, key changed
			return "REACTIVATE";
		} else if (document.getElementById('premium_key').value.length>0) { // Inactivated, key typed in
			return "ACTIVATE";
		} else { // Not activated, no key typed in
			return "INACTIVATED INFO";
		}
	},

	showInfo:function(info)
	{
		// Update warnings/info
		var ib=document.getElementById('infobox');
		while(ib.firstChild!=undefined) {
			ib.removeChild(ib.firstChild);
		}
		var i;
		var aLabel;
		var aDesc;
		for(i=0;i<info.length;i++) {
			aLabel=document.createElement("description");
			aDesc=document.createTextNode('* '+info[i].type+': '+info[i].desc);
			aLabel.appendChild(aDesc);
			if (info[i].type=='WARNING') {
				aLabel.style.color='#ff0000';
			} else if (info[i].type=='SUGGESTION') {
				aLabel.style.color='#009000';
			}
			aLabel.style.fontSize='90%';
			ib.appendChild(aLabel);
		}
	},

	findOpener:function(o)
	{

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		return wm.getMostRecentWindow("navigator:browser");
	},

	loadAutoPrefs:function()
	{
		for(var pref in MCE.prefs.pref_descriptor) {
			if (MCE.prefs.isPrefManual(pref)) {
				continue;
			}
			
			var gui=document.getElementById(pref);
			if (gui==undefined) {
				alert("No GUI element found for "+pref);
				continue;
			}
			var prefType=MCE.prefs.getPrefType(pref);
			if (prefType=='boolean')
				gui.checked=MCE.prefs.getPref(pref);
			if (prefType=='string')
				gui.value=MCE.prefs.getPref(pref);
		}
	},

	saveAutoPrefs:function()
	{
		for(var pref in MCE.prefs.pref_descriptor) {
			if (MCE.prefs.isPrefManual(pref)) {
				continue;
			}
			
			var gui=document.getElementById(pref);
			if (gui==undefined) {
				alert("No GUI element found for "+pref);
				continue;
			}
			var prefType=MCE.prefs.getPrefType(pref);
			if (prefType=='boolean')
				var value=gui.checked;
			if (prefType=='string')
				var value=gui.value;
			MCE.prefs.setPref(pref,value);
		}
	},

	prefsOnLoad:function()
	{
		if (MCE.prefs.getPref("pref_expert_config"))
			this.switchExpert();

		this.browserWindow=this.findOpener();

		this.loadAutoPrefs();

		// Replicate auto-prefs in basic interface
		document.getElementById("pref_auto_convert_basic").checked=
			document.getElementById("pref_auto_convert").checked;
		
		// Manual prefs
		document.getElementById("pref_24h").value=MCE.prefs.getPref('pref_24h')?'1':'0';
		document.getElementById("pref_metric").value=MCE.prefs.getPref('pref_metric')?'1':'0';
		document.getElementById("pref_celsius").value=MCE.prefs.getPref('pref_celsius')?'1':'0';
		document.getElementById("pref_in_fract").value=MCE.prefs.getPref('pref_in_fract')?'1':'0';

		// Currency
		document.getElementById("pref_currency_enabled").checked=
			document.getElementById("pref_currency_enabled_basic").checked=
			MCE.prefs.getPref('pref_currency_enabled');
		this.initCurrencyControls();
		
                document.addEventListener('keyup',MCE.prefs.gui.keyPressed,false);

		// Last tab
		document.getElementById("tab-holder").selectedIndex=MCE.prefs.getPref("last_prefs_tab");
		this.tabSwitched();

		// Custom conversions
		if (this.browserWindow.MCE.premium!=undefined) {
			this.recursiveSetDisable(document.getElementById('custom0'),false);
			this.browserWindow.MCE.premium.custom_units.gui.populate_custom(document);
		}
	},
	
	prefsOnResize:function()
	{
		this.updateInterface();
	},

	keyPressed:function(e)
	{
		if (e.keyCode==27) {
			MCE.prefs.gui.close_cancel();
		}
		if (e.keyCode==13) {
			MCE.prefs.gui.close_ok();
		}
	},

	initCurrencyControls: function()
	{
		if (this.isBasicInterface()) {
			var enabled=document.getElementById("pref_currency_enabled_basic").checked;
			var currLabel=document.getElementById("pref_myCurrencyLabel_basic");
			var visiList=document.getElementById("pref_myCurrency_basic");
			var invisiList=document.getElementById("pref_myCurrency");
		} else {
			var enabled=document.getElementById("pref_currency_enabled").checked;
			var currLabel=document.getElementById("pref_myCurrencyLabel");
			var visiList=document.getElementById("pref_myCurrency");
			var invisiList=document.getElementById("pref_myCurrency_basic");
		}
		var list1=document.getElementById("pref_myCurrency_basic");
		var list2=document.getElementById("pref_myCurrency");
		var cb1=document.getElementById("pref_currency_enabled_basic");
		var cb2=document.getElementById("pref_currency_enabled");

		// There must be only one
		var fList=document.getElementById("pref_foreignCurrency");

		document.getElementById("pref_myCurrencyLabel").disabled=
			document.getElementById("pref_myCurrencyLabel_basic").disabled=
			!enabled;

		list1.disabled=list2.disabled=!enabled;
		cb1.checked=cb2.checked=enabled;

		if (this.currencyControlsInitialized) {
			if (list1.value && list1.getItemAtIndex(0).value=='') {
				list1.removeItemAt(0);
			}
			if (list2.value && list2.getItemAtIndex(0).value=='') {
				list2.removeItemAt(0);
			}
			invisiList.selectedIndex=visiList.selectedIndex;
			this.updateInterface();
			return true;
		}

		this.currencyControlsInitialized=true;

		fList.appendItem("(None)","","Disable foreign currency");
		var listIndex=MCE.util.inArray(MCE.prefs.getPref('pref_myCurrency'), MCE.currency.currencies);
		var fListIndex=MCE.util.inArray(MCE.prefs.getPref('pref_foreignCurrency'), MCE.currency.currencies);
		if (listIndex==-1) {
			listIndex=0;
			list1.appendItem("(select your currency)",'');
			list2.appendItem("(select your currency)",'');
		}
		if (fListIndex==-1) {
			fListIndex=0;
		} else {
			fListIndex++;
		}
		var cc; // Currency code
		var cn; // Currency name
		var itm;
		for(var i=0;i<MCE.currency.currencies.length;i++) {
			cc=MCE.currency.currencies[i];
			if (cc in MCE.currency.currency_names) {
				cn=' ('+MCE.currency.currency_names[cc]+')';
			} else {
				cn='';
			}
			list1.appendItem(
				cc, /* label */
				cc, /* value */
				cn /* description */
			).id="curr_"+cc+"_basic";
			
			list2.appendItem(
				cc, /* label */
				cc, /* value */
				cn /* description */
			).id="curr_"+cc;

			fList.appendItem(cc,cc,cn).id="curr_"+cc+"_foreign";
		}
		list1.selectedIndex=list2.selectedIndex=listIndex;
		fList.selectedIndex=fListIndex;
		return true;
	},

	close_ok:function()
	{
		var old_curr_enabled=MCE.prefs.getPref("pref_currency_enabled");
		var old_curr_primary=MCE.prefs.getPref("pref_myCurrency");
		var old_curr_secondary=MCE.prefs.getPref("pref_foreignCurrency");

		if (
			document.getElementById("pref_currency_enabled").checked &&
			!document.getElementById("pref_myCurrency").value
		) {
			alert(
				"If you want to use the currency conversion features\n"+
				"you have to select the target currency."
			);
			return false;
		}
		MCE.prefs.setPref("pref_24h",document.getElementById("pref_24h").value=="1");
		MCE.prefs.setPref("pref_metric",document.getElementById("pref_metric").value=="1");
		MCE.prefs.setPref("pref_celsius",document.getElementById("pref_celsius").value=="1");
		MCE.prefs.setPref("pref_in_fract",document.getElementById("pref_in_fract").value=="1");
		MCE.prefs.setPref("pref_myCurrency",document.getElementById("pref_myCurrency").value); // NOT automatic!
		MCE.prefs.setPref("pref_foreignCurrency",document.getElementById("pref_foreignCurrency").value); // NOT automatic!

		if (MCE.prefs.getPref("premium_key")!=document.getElementById("premium_key").value) {
			if (this.browserWindow.MCE.premiumLoader.load(document.getElementById("premium_key").value)) {
				this.browserWindow.MCE.premium.custom_units.gui.populate_custom(document);
			} else {
				document.getElementById("premium_key").value='';
			}
		}
		this.saveAutoPrefs(); // KEEP THIS AFTER THE PREMIUM KEY TEST ABOVE!

		if (this.browserWindow.MCE.premium!=undefined) {
			this.browserWindow.MCE.premium.processPrefs();
			this.browserWindow.MCE.premium.savePrefs(document);
		}
		var new_curr_enabled=MCE.prefs.getPref("pref_currency_enabled");
		var new_curr_primary=MCE.prefs.getPref("pref_myCurrency");
		var new_curr_secondary=MCE.prefs.getPref("pref_foreignCurrency");

		// Refresh conversion rates, if required
		if (
			old_curr_enabled != new_curr_enabled ||
			old_curr_primary != new_curr_primary ||
			old_curr_secondary != new_curr_secondary
		)
			this.browserWindow.MCE.currency.timedRefreshRates();

		MCE.prefs.setPref('configured', true);

		this.close_common();
	},

	close_cancel:function()
	{
		if (
			MCE.prefs.getPref("pref_currency_enabled") &&
			!MCE.prefs.getPref("pref_myCurrency")
		) {
			document.getElementById("pref_currency_enabled").checked=false;
			MCE.prefs.setPref("pref_currency_enabled",false);
			this.initCurrencyControls();

			alert(
				"Currency conversions have been disabled.\n"+
				"You can enable them at any time in the options dialog."
			);
		}
		/*
			Sometimes this is opened as modal. In that case, event listeners seem to
			be inherited by the opener. Failing to remove them causes the opener
			to misbehave (i.e. events still get captured by the modal window's listeners
			even after it gets closed, although that happens in a sick and twisted way
			which doesn't allow the listeners to actually perform; probably a bad case
			of good practice plus security concerns mangling this up).
		*/
		document.removeEventListener('keyup',MCE.prefs.gui.keyPressed,false);
		this.close_common();
	},

	close_common:function()
	{
		if (typeof this.browserWindow != "undefined") {
			MCE.prefs.setPref("last_prefs_tab", document.getElementById("tab-holder").selectedIndex);
			MCE.prefs.setPref("pref_expert_config", !this.isBasicInterface());
		}
		window.close();
	},

	setLicenseLabel:function(label)
	{
		document.getElementById('label_activate').label="("+label+")";
	},

	buyActivate:function()
	{
		var key=document.getElementById("premium_key").value;
		switch(this.getActivationAction()) {
			case "ACTIVATED INFO":
			case "INACTIVATED INFO":
				this.browserWindow.MCE.iface.showLocation("http://www.the-converter.co/premium_version.php");
				break;
			case "REACTIVATE":
			case "ACTIVATE":
				this.previousPremium=this.browserWindow.MCE.premium;
				MCE.prefs.gui.setLicenseLabel("Activating...");
				this.lastKey=key;
				this.browserWindow.MCE.premiumLoader.load(key);
		}
	},

	onActivationFinished: function(success)
	{
		var key=this.lastKey;
		if (success && (this.browserWindow.MCE.premium!=undefined)) {
			MCE.prefs.setPref("premium_key",document.getElementById("premium_key").value);
			this.recursiveSetDisable(document.getElementById('custom0'),false);
			this.browserWindow.MCE.premium.custom_units.gui.populate_custom(document);
			this.updateInterface();
			this.previousPremium=null;
		} else {
			MCE.prefs.gui.setLicenseLabel("Activation failed");
			this.browserWindow.MCE.premium=this.previousPremium;
		}
	},

	tabSwitched:function()
	{
		var cid=document.getElementById("tabs-holder").selectedItem.id;
		var ic=document.getElementById("info_container");
		var hc=document.getElementById("help_container");
		
		if (cid=="tab-custom-tab") {
			ic.hidden=true;
			hc.hidden=false;
		} else {
			ic.hidden=false;
			hc.hidden=true;
		}
	},

	customHelp:function()
	{
		this.browserWindow.MCE.iface.showLocation("http://www.the-converter.co/custom_units_help.php");
	},

}

}
