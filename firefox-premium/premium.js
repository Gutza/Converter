if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.premium={
	init:function()
	{
		this.processPrefs();
		this.custom_units.gui.load_custom();
		return true;
	},

	premiumRound:function(v,unit)
	{
		if (unit=='internal_currency') {
			var enable_pref="pref_enable_precision_currency";
			var precision_pref="pref_precision_currency";
		} else {
			var enable_pref="pref_enable_precision_units";
			var precision_pref="pref_precision_units";
		}
		if (!MCE.prefs.getPref(enable_pref)) {
			return undefined; // default
		}
		var precision=MCE.prefs.getPref(precision_pref);
		return new Number(v).toFixed(precision);
	},

	processPrefs:function()
	{
		var xHours=MCE.prefs.getPref("pref_exchange_hours");
		if ((xHours>0) && (xHours!=NaN)) {
			MCE.currency.iface.cacheExpiration=MCE.prefs.getPref("pref_exchange_hours")*3600000;
		}
		return true;
	},

	savePrefs:function(doc)
	{
		if (!MCE.premium.custom_units.gui.save_custom(doc)) {
			return false;
		}
		return true;
	},

	getMyCurrency:function(thisCurrency)
	{
		var myCurrency=MCE.prefs.getPref('pref_myCurrency');
		var my2nd=MCE.prefs.getPref('pref_foreignCurrency');
		if (thisCurrency==myCurrency && my2nd!='') {
			return my2nd;
	  	}
		return myCurrency;
	},
}

// -------------------------------------------

MCE.premium.custom_units={
	fields:[
		'src',
		'dst',
		'ratio',
		'regular',
		'src_type',
		'dst_type',
		'daisy',
		'reverse',
		'src_name',
	],

	current:[
	],

	unit_regexps:[],

	getWord:function(word)
	{
		var results=new Array();
		if (!MCE.prefs.getPref('pref_custom_enabled')) {
			return results;
		}
		for(var index in MCE.premium.custom_units.unit_regexps) {
			var raw="("+MCE.premium.custom_units.unit_regexps[index]+")";
			var re=new RegExp(MCE.core.number_regexp+"[\\s]*"+raw,"i");
			try {
				var result = re.exec(word);
			} catch(e) {
				MCE.iface.log(
					"Problem with custom unit "+
					MCE.premium.custom_units.fields[index].src+
					": "+e
				);
				continue; // No sense to try this again
			}
			if (result) {
				var tmp={
					parser: 'custom, right',
					value: result[1],
					unit: 'internal_custom',
					match: result[0],
					index: word.indexOf(result[0]),
					unit_index: index,
				};
				results.push(tmp);
			}

			if (MCE.premium.custom_units.current[index].src_type!='C') {
				continue;
			}

			re=new RegExp(raw+"[\\s]*"+MCE.core.number_regexp,"i");
			result = re.exec(word);
			if (result) {
				re=new RegExp(MCE.core.number_regexp+"$");
				var num_result=re.exec(result[0]);
				var tmp={
					parser: 'custom, left',
					value: num_result[0],
					unit: 'internal_custom',
					match: result[0],
					index: word.indexOf(result[0]),
					unit_index: index,
				};
				results.push(tmp);
			}
		}
		return results;
	},

	convert:function(v)
	{
		if (v.unit_index==undefined) {
			MCE.iface.log("Custom unit without custom index!");
			return {inhibit:true};
		}
		var u=MCE.premium.custom_units.current[v.unit_index];
		var outValue=0;
		if (u.reverse=="0") {
			outValue=v.value*u.ratio;
		} else {
			outValue=v.value/u.ratio;
		}
		var inUnit=u.src;
		if (u.regular && u.src_name!="") {
			inUnit=u.src_name;
		}
		var result={
			inValue: v.value,
			inUnit: inUnit,
			outValue: outValue,
			outUnit: u.dst
		};
		if (u.daisy=="1") {
			var cr=MCE.core.doConversion(outValue+" "+u.dst,false);
			if (!cr.inhibit && cr.outCustom!=undefined) {
				cr.inUnit=result.inUnit;
				cr.inValue=result.inValue;
				return cr;
			}
		}
		return result;
	},

	parse_to_regexp:function()
	{
		MCE.premium.custom_units.unit_regexps=[];
		for(var index in MCE.premium.custom_units.current) {
			var u=MCE.premium.custom_units.current[index];
			if (u.regular) {
				MCE.premium.custom_units.unit_regexps.push(u.src);
			} else {
				MCE.premium.custom_units.unit_regexps.push(MCE.core.regexpise(u.src));
			}
		}
		return true;
	},

};

// -------------------------------------------

MCE.premium.custom_units.gui={

	add_unit:function(doc)
	{
		var template=doc.getElementById("custom0");
		var clone=template.cloneNode(true);
		var count=this.get_count(doc);
		var container=doc.getElementById("custom-container");
		container.appendChild(clone);

		// This *MUST* live below appendChild(), or caption updates will fail
		this.set_ids(clone,count);

		doc.getElementById('remove0').hidden=false;
		doc.getElementById('remove'+count).hidden=false;

		this.default_units(doc,count);
		doc.defaultView.MCE.prefs.gui.recursiveSetDisable(clone,false);
		return count;
	},

	regular:function(doc,source)
	{
		var index=this.get_index(source.id);
		var r=doc.getElementById('regular'+index).checked;
		doc.getElementById("src-name-box"+index).hidden=!r;
		return true;
	},

	set_ids:function(dad,idx)
	{
		if (dad.id.indexOf("custom-label")==0) {
			dad.label="Custom unit #"+(new Number(idx)+1);
			dad.style.fontWeight=(idx%2)?"bold":"normal";
		}
		if (dad.id) {
			dad.id=dad.id.replace(this.get_index(dad.id),idx);
		}
		var kids=dad.childNodes;
		if (kids.length==0) {
			return dad;
		}
		for(var i=0;i<kids.length;i++) {
			this.set_ids(kids[i],idx);
		}
		return dad;
	},

	remove_unit:function(doc,source)
	{
		var index=this.get_index(source.id);
		if (!index) {
			return false;
		}
		var unit=doc.getElementById("custom"+index);
		if (unit==undefined) {
			return false;
		}
		if (this.get_count(doc)==1) {
			// Not removing the last one
			return false;
		}
		if (this.gui_custom_pref_valid(doc,index)) {
			var ok=confirm("Really delete this unit?")
			doc.defaultView.focus();
			if (!ok)
				return null;
		}

		var count=this.get_count(doc);
		unit.parentNode.removeChild(unit);
		var i;
		for(i=new Number(index)+1;i<count;i++) {
			var dad=doc.getElementById("custom"+i);
			this.set_ids(dad,i-1);
		}
		if (count==2) {
			doc.getElementById('remove0').hidden=true;
		}
		return true;
	},

	get_index:function(id)
	{
		var re = new RegExp("[0-9]+$");
		var result=re.exec(id);
		if (!result) {
			return false;
		}
		return result[0];
	},

	get_count:function(doc)
	{
		for(i=0;doc.getElementById("custom"+i)!=undefined;i++);
		return i;
	},

	reverse:function(doc,source)
	{
		var index=this.get_index(source.id);
		var s1="1 source unit = ";
		var s2="1 destination unit = ";
		var d1="destination units";
		var d2="source units";
		var t1=doc.getElementById("src-text"+index);
		var t2=doc.getElementById("dst-text"+index);
		if (source.checked) {
			t1.value=s2;
			t2.value=d2;
		} else {
			t1.value=s1;
			t2.value=d1;
		}
		return true;
	},

	default_units:function(doc,index)
	{
		if (index==undefined) {
			index=0;
		}
		var src=doc.getElementById('src_type'+index);
		var dst=doc.getElementById('dst_type'+index);
		if (MCE.prefs.getPref('pref_metric')) {
			src.value='I';
			dst.value='S';
		} else {
			src.value='S';
			dst.value='I';
		}
		this.reset_checkboxes(doc.getElementById('custom'+index));
		this.regular(doc,doc.getElementById('custom'+index));
		return true;
	},

	reset_checkboxes:function(dad)
	{
		if (dad.nodeName=='checkbox') {
			dad.checked=false;
			return dad;
		}
		var kids=dad.childNodes;
		if (kids.length==0) {
			return dad;
		}
		for(var i=0;i<kids.length;i++) {
			this.reset_checkboxes(kids[i]);
		}
		return dad;
	},

	ratio_change:function(doc,source)
	{
		return true;
		var re=new RegExp("[0-9]+(\\.[0-9]*)?");
		var result=re.exec(source.value);
		if (!result) {
			source.value="";
		}
		source.value=result[0];
		return true;
	},

	dropdown_change:function(doc,source)
	{
		var index=this.get_index(source.parentNode.parentNode.id);
		var srcDown=doc.getElementById("src_type"+index);
		var dstDown=doc.getElementById("dst_type"+index);
		var daisy=doc.getElementById("daisy"+index);
		var previouslyChecked=daisy.checked;
		if (source.value=="C") {
			srcDown.value="C";
			dstDown.value="C";
			dstDown.disabled=true;
		}
		if (srcDown.value==dstDown.value || dstDown.value=='A') {
			daisy.checked=true;
		}
		if (srcDown.value==dstDown.value) {
			return true;
		}
		if (previouslyChecked) {
			daisy.checked=false;
			var myId="src_type"+index;
			var otherId="dst_type"+index;
			if (source.id=="dst_type"+index) {
				myId="dst_type"+index;
				otherId="src_type"+index;
			}
			var me=doc.getElementById(myId);
			var other=doc.getElementById(otherId);
			switch(me.value) {
				case 'I':
					other.value='S';
					break;
				case 'S':
					other.value='I';
					break;
				case 'A':
					if (doc.getElementById('pref_metric').value==1) {
						other.value='S';
					} else {
						other.value='I';
					}
			}
		}
		return true;
	},

	gui_custom_pref_valid:function(doc,index)
	{
		return (
			doc.getElementById("src"+index).value &&
			doc.getElementById("dst"+index).value &&
			doc.getElementById("ratio"+index).value!="0"
		);
	},

	get_post_credentials: function()
	{
		var creds = "";
		creds += "key=" + encodeURIComponent(MCE.prefs.getPref('premium_key')) + "&";
		creds += "ver=" + encodeURIComponent(MCE.applicationVersion);
		return creds;
	},

	save_custom:function(doc)
	{
		MCE.premium.custom_units.current=new Array();
		var data="";
		var count=this.get_count(doc);
		for(var index=0;index<count;index++) {
			if (!this.gui_custom_pref_valid(doc,index)) {
				continue;
			}
			var ccustom={};
			for(var fid in MCE.premium.custom_units.fields) {
				var field=MCE.premium.custom_units.fields[fid];
				var fname=field+String(index);
				var node=doc.getElementById(field+index);
				var value;
				if(node.nodeName=='checkbox') {
					value=node.checked?"1":"0";
				} else {
					value=node.value;
				}
				ccustom[field]=value;
				data=data+field+"%5B%5D="+encodeURIComponent(value)+"&";
			}
			MCE.premium.custom_units.current.push(ccustom);
		}
		MCE.premium.custom_units.parse_to_regexp();
		if (data=="") {
			return true;
		}
		data += this.get_post_credentials();
		try {
			var request = new XMLHttpRequest();
			request.open("POST", "http://premium.the-converter.co/premium/put_units.php", false); /* blocking */
			request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			request.setRequestHeader("Content-length", data.length);
			request.setRequestHeader("Connection", "close");
			request.send(data);
			if (request.status != 200) {
				return false;
			}
			if (request.responseText!='1') {
				this.log("Failed saving custom units: "+request.responseText);
				return false;
			}
		} catch (e) {
			this.log("Failed saving custom units: "+e);
			return false;
		}
		return true;
		
	},

	load_custom:function()
	{
		var data = this.get_post_credentials();
		try {
			var request = new XMLHttpRequest();
			request.open("POST", "http://premium.the-converter.co/premium/get_units.json", false); /* blocking */
			request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			request.setRequestHeader("Content-length", data.length);
			request.setRequestHeader("Connection", "close");
			request.send(data);
			if (request.status != 200) {
				return false;
			}
			MCE.premium.custom_units.current=JSON.parse(request.responseText);
		} catch(e) {
			this.log("Failed loading custom units: "+e);
			return false;
		}
		MCE.premium.custom_units.parse_to_regexp();
		return true;
	},

	populate_custom:function(doc)
	{
		if (MCE.premium.custom_units.current.length==0) {
			this.default_units(doc,0);
			return true;
		}
		for(var index=0;index<MCE.premium.custom_units.current.length;index++) {
			var gui_idx=this.add_unit(doc);
			for(var fid in MCE.premium.custom_units.fields) {
				var fname=MCE.premium.custom_units.fields[fid];
				var node=doc.getElementById(fname+gui_idx);
				var value=MCE.premium.custom_units.current[index][fname];
				if (node.nodeName=='checkbox') {
					node.checked=(value=="1");
					if (fname=='reverse' && node.checked) {
						this.reverse(doc,node);
					}
					if (fname=='regular' && node.checked) {
						this.regular(doc,node);
					}
				} else {
					node.value=value;
					if (node.id.indexOf("dst_type")==0) {
						this.dropdown_change(doc,node);
					}
				}
			}
		}
		this.remove_unit(doc,doc.getElementById('remove0'));
		return true;
	},

	log:function(message)
	{
		MCE.iface.log("Premium: "+message);
	},
};

// -------------------------------------------

MCE.premium.init();
}
