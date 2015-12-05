/*

TO DO:
 - metric weights => imperial weights
 - surfaces
 - volumes
 - update example page with speeds plus everything above
 - example page: adaptive results -- in2m, m2in, kmph2miph, miph2kmph, lb2kg
*/

/*

= Entry points =

== doConversion ==
./chrome/content/converter_iface.chrome.js:313:                 var cr=MCE.core.doConversion(sel,false);
./chrome/content/converter_iface.chrome.js:320:                                         cr=MCE.core.doConversion(match[0]+' '+MCE.prefs.getPref("pref_default_unit"));
./chrome/content/converter_iface.chrome.js:440:                 var cr=opener.MCE.core.doConversion(window.document.getElementById('beef').value,false);
./chrome/content/converter_regression.js:69:        var cr=MCE.core.doConversion(test,false);
./chrome/content/converter_iface.js:302:            var cr=MCE.core.doConversion(sel,false);
./chrome/content/converter_iface.js:309:                  cr=MCE.core.doConversion(match[0]+' '+MCE.prefs.getPref("pref_default_unit"));
./chrome/content/converter_iface.js:429:                        var cr=opener.MCE.core.doConversion(window.document.getElementById('beef').value,false);
./chrome/content/converter_iface.chrome_background.js:311:                      var cr=MCE.core.doConversion(sel,false);
./chrome/content/converter_iface.chrome_background.js:318:                                              cr=MCE.core.doConversion(match[0]+' '+MCE.prefs.getPref("pref_default_unit"));
./chrome/content/converter_iface.chrome_background.js:438:                      var cr=opener.MCE.core.doConversion(window.document.getElementById('beef').value,false);
./premium_1.0.9.js:152:                 var cr=MCE.core.doConversion(outValue+" "+u.dst,false);
./premium_1.0.0.js:146:                 var cr=MCE.core.doConversion(outValue+" "+u.dst,false);

== convertPage ==
./chrome/chrome_background.html:20:                     "MCE.core.convertPage(window);"
./chrome/content/converter_iface.chrome_content.js:105:                         MCE.core.convertPage(win);
./chrome/content/converter_iface.chrome.js:357:                         MCE.core.convertPage(win);
./chrome/content/converter_iface.chrome_background.js:355:                              MCE.core.convertPage(win);
./chrome/content/converter_iface.js:346:              MCE.core.convertPage(win);

== convertText ==
./chrome/content/converter_iface.js:446:                        window.document.getElementById('hamburger').value=opener.MCE.core.convertText(window.document.getElementById('beef').value);
./chrome/content/converter_iface.chrome_background.js:455:                      window.document.getElementById('hamburger').value=opener.MCE.core.convertText(window.document.getElementById('beef').value);
./chrome/content/converter_iface.chrome.js:457:                 window.document.getElementById('hamburger').value=opener.MCE.core.convertText(window.document.getElementById('beef').value);

== convertElement ==
./chrome/content/converter_regression.js:103:       MCE.core.convertElement(tests[i], true);

*/


if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {

MCE.core={
	convertible_MIME_types: [
		"text/html",
		"text/plain",
	],

	isConvertibleMIME: function(mime)
	{
		return -1 != MCE.util.inArray(mime, this.convertible_MIME_types);
	},

	/*
	* This function is the conversion brain -- it takes in a string, checks for
	* ONE SINGLE VALUE to convert, converts it, executes the adjusters,
	* and if all goes well returns a SINGLE converter result object,
	* or false otherwise.
	*
	* We need sw because depending on the context we might have already
	* called getSelectedWord(), which is quite expensive -- so if its
	* result is already available, we don't call it again on the same text.
	*/
	doConversion:function(txt, sw)
	{
	  txt=this.preprocessRawText(txt);
	  if (sw) {
	    var temp = sw;
	  } else {
	    var temp = this.getSelectedWord(txt);
	    if (!temp) {
	      return false;
	    }
	  }
	  var pos=MCE.util.inArray(temp.unit,MCE.conversions[0]);
	  if (pos==-1) {
	    return false;
	  }

	  // Ok, it's legitimate, but let's check if we need to convert this at all
	  var target=MCE.conversions[2][pos];
	  if (MCE.prefs.getPref('pref_one_way') && target &&
	    (
		  (target=='metric' && !MCE.prefs.getPref('pref_metric')) ||
		  (target=='Imperial' && MCE.prefs.getPref('pref_metric')) ||
		  (target=='Celsius' && !MCE.prefs.getPref('pref_celsius')) ||
		  (target=='Fahrenheit' && MCE.prefs.getPref('pref_celsius'))
		)
	  ) {
	    return {inhibit:true};
	  }

	  if (temp.unit!='internal_time') {
	    temp.value=MCE.util.determine_separators(temp.value);
	  }
	  if (temp.value===false || temp.value===undefined) {
	    return false;
	  }

	  var converter=MCE.conversions[1][pos];
	  var cr=MCE.converters[converter](temp); /* conversion result */

	  if (temp.multiplier>1) {
	    cr.inValue*=temp.multiplier;
	    cr.outValue*=temp.multiplier;
	  }
	  // This is rather academic, since we're only using it once below, but hey!
	  // It's a hobby project!
	  if (cr.outUnit=="m") {
	    cr=MCE.adjusters.metricDistance(cr);
	  }
	  if (cr.outUnit=="kg") {
	    cr=MCE.adjusters.metricWeight(cr);
	  }
	  if (cr.outUnit=="in") {
	    cr=MCE.adjusters.imperialDistance(cr);
	  }
	  if ((cr.outUnit=='gal') || (cr.outUnit=='fl oz')) {
	    cr=MCE.adjusters.imperialVolume(cr);
	  }
	  if ((cr.outUnit=='ml') || (cr.outUnit=='L')) {
	    cr=MCE.adjusters.metricVolume(cr);
	  }
	  if (!cr.not_numerical) {
	    cr.inValue=MCE.util.smartRound(cr.inValue,temp.unit);
	    cr.outValue=MCE.util.smartRound(cr.outValue,temp.unit);
	  }
	  if (!cr.outCustom) {
	    cr.outCustom=cr.outValue+" "+cr.outUnit;
	  }
	  return cr;
	},

	/*
	* This function registers the converters defined at the beginning of this
	* file. What it basically does is split that string into items and builds
	* two arrays, one of which contains the units and the other the converters.
	* It then builds an array with two elements which are the arrays previously
	* described, and returns it. It is used by onConverterPopup().
	*/
	registerConverters:function()
	{
	  var conv_symbols=new Array();
	  var conv_functions=new Array();
	  var conv_targets=new Array();
	  
	  var atoms=MCE.conv_table.split(" ");
	  var conv_symbol=true;
	  var register_extended=true;
	  if (MCE.extended_symbols.length) {
	    register_extended=false;
	  }
	  
	  var i;
	  var a_converter_symbol_1=new Array();
	  var a_converter_symbol_2plus=new Array();
	  
	  for(i=0;i<atoms.length;i++) {
	    var atom=atoms[i];
	    if (!atom) {
	       continue;
	    }
	    if (conv_symbol) {
	      if (register_extended && (atom.indexOf('_')>-1)) {
		    MCE.extended_symbols_raw.push(atom.replace(/_/g,' '));
		    MCE.extended_symbols.push(atom.replace(/_/g,'[\\s]+'));
	      }
	      conv_symbols.push(atom);
	      var letter=atom.substring(0,1);
	      if (MCE.util.inArray(letter,a_converter_symbol_1)==-1) {
		    a_converter_symbol_1.push(letter);
		    MCE.symbol_1+=letter;
	      }
	      var j=0;
	      for(j=1;j<atom.length;j++) {
		    letter=atom.substring(j,j+1);
		    if (MCE.util.inArray(letter,a_converter_symbol_2plus)==-1) {
		      a_converter_symbol_2plus.push(letter);
		      MCE.symbol_2plus+=letter;
		    }
	      }
	    } else {
		  if (atom.indexOf("\t")==-1) {
			conv_functions.push(atom);
			conv_targets.push(false);
		  } else {
			var x=atom.split("\t");
			conv_functions.push(x[0]);
			conv_targets.push(x[1]);
		  }
	    }
	    conv_symbol=!conv_symbol;
	  }
	  MCE.symbol_1=this.regexpise(MCE.symbol_1);
	  MCE.symbol_2plus=this.regexpise(MCE.symbol_2plus);
	  
	  return new Array(conv_symbols,conv_functions,conv_targets);
	},

	/**
	* Transforms a string containing raw, individual characters to be matched
	* by regexp to a form which is actually understood by match()
	*/
	regexpise:function(in_s)
	{
	//  alert('in_s: '+in_s);
	  var i=0;
	  var result='';
	  var s=in_s;
	  var re_raw=/[0-9a-zA-Z !"#$%&'*+,.:;<=>?@_`{|}~]/;
	  var re_escape=/[\(\)\-\/\[\\\]\^]/;
	  for(i=0;i<s.length;i++) {
	    var letter=s.substring(i,i+1);
	    var replace=letter;
	    // don't forget about the underscore -- it's never matched here!
	    // standard stuff, goes as is
	    if (!re_raw.exec(letter)) {
	      // stuff that simply needs to be escaped with a backslash
	      if (re_escape.exec(letter)) {
		replace='\\'+replace;
	      } else {
		var hex=replace.charCodeAt(0).toString(16).toUpperCase();
		while(hex.length<4) {
		  hex='0'+hex;
		}
		replace='\\u'+hex;
	      }
	    }
	    result+=replace;
	  }
	  //alert('result: '+result);
	  return result;
	},

	convertPage:function(win)
	{
	  if (MCE.regression && MCE.regression.regressionTest(win))
	    return true;

	  var myDocs=MCE.iface.getAllDocuments(win);
	  var i;
	  for(i=0;i<myDocs.length;i++) {
	    this.convertDoc(myDocs[i]);
	  }
	  return true;
	},

	convertDoc:function(aDoc)
	{
		if (
			!aDoc.getElementsByTagName('BODY').length ||
			!this.isConvertibleMIME(aDoc.contentType)
		)
			return false;

		this.convertElement(aDoc.getElementsByTagName('BODY')[0], false);
		return true;
	},

	restorePage:function(win)
	{
          var myDocs=MCE.iface.getAllDocuments(win);
          var i;
          for(i=0;i<myDocs.length;i++) {
            this.restoreDoc(myDocs[i]);
          }
	  return true;
	},

	restoreDoc:function(aDoc)
	{
	  if (aDoc.getElementsByTagName('BODY').length) {
	    this.restoreElement(aDoc.getElementsByTagName('BODY')[0],'');
	    MCE.iface.setNewPage();
            return true;
          }
	  return false;
	},

	restoreElement:function(elem)
	{
	  do {
	    if (elem.converter_originalNode!=undefined) {
	      // Yes, this insanity really is needed, otherwise elem's nextSibling is messed up
	      var replacing=elem;
	      elem=elem.nextSibling;
	      replacing.parentNode.replaceChild(replacing.converter_originalNode,replacing);
	      continue;
	    }
	    if (elem.firstChild!=undefined) {
	      this.restoreElement(elem.firstChild);
	    }
	  } while ((elem!=undefined) && (elem=elem.nextSibling));
	  return true;
	},

	// single is only set for regression testing
	convertElement:function(docu, single)
	{
	  var d=docu;
	  if (d==undefined)
	    return false;

	  var myResult=false;
	  var d_original;
	  do {
	    if (
	      d.nodeType==9 &&
	      d.nodeName=="#document" &&
	      !this.isConvertibleMIME(d.contentType)
	    )
	        return false;
	    if (d.nodeType==1) {
	      if (d.nodeName!='SCRIPT' && d.nodeName!='STYLE') {
                d_original=d.cloneNode(true);
	        if (this.convertElement(d.firstChild, single)) {
                  // Not bubbling by default, that would cause all parents to get cached!
                  d.converter_originalNode=d_original;
	          // But we do want to bubble if the previous sibling's got it,
	          // or else its backup node will point to this node's original,
	          // which doesn't contain the backup. Hairy.
	          if (d.previousSibling!=undefined && d.previousSibling.converter_originalNode!=undefined) {
	            myResult=true;
	          }
                }
	      }
	    } else if (d.nodeType!=8) { /* not converting HTML comments */
	      var d_content=d.nodeValue;
	      var skip_sibling=false;
	      if (d.nextSibling!=undefined && d.nextSibling.nodeName=='SUP') {
	        var sup_index=d_content.length;
	        d_content=d_content+'^'+d.nextSibling.firstChild.nodeValue;
	        skip_sibling=true;
	      }
	      /*
	      Yes, we *do* need to call this both here and in convertText() because
	      convertText() is called directly in some contexts (e.g. custom conversions),
	      but we need to also call it here explicitly in order to avoid modifying
	      d.nodeValue when no conversions are performed (even though the current node
	      might contain 1/2, 1/4 or 3/4). See regression tests #65, #66.
	      */
	      d_content=this.preprocessRawText(d_content);
	      var re=/[0-9]/;
	      var result=re.exec(d.nodeValue);
	      if (!result) {
	        d=d.nextSibling;
	        if (skip_sibling) {
	        skip_sibling=false;
	          if (d!=undefined)
	            d=d.nextSibling;
	        }
	        continue;
	      }

	      //alert('Converting this: '+d.nodeValue);
	      var new_content=this.convertText(d_content);
	      //d.nodeValue=this.convertText(d_content);
	      if (new_content!=d_content) {
	        myResult=true;
	        var new_index=sup_index+new_content.length-d_content.length;
	        if (new_content.substring(new_index)!=d_content.substring(sup_index)) {
	          d.nodeValue=new_content;
	          if (skip_sibling) {
	            d.parentNode.removeChild(d.nextSibling);
	          }
	        }
	      }
	    };

	    d=d.nextSibling;
	    if (skip_sibling) {
	      skip_sibling=false;
	      if (d!=undefined)
	        d=d.nextSibling;
	    }
	    // debug: alert('d.nodeType='+d.nodeType+'; d.nodeName='+d.nodeName+'; d.nodeValue='+d.nodeValue);
	  } while (d!=undefined && !single);
	  return myResult;
	},

	preprocessRawText:function(txt)
	{
	  return String(txt).replace("¼"," 1/4").replace("½", " 1/2").replace("¾", " 3/4");
	},

	convertText:function(txt)
	{
	  txt=this.preprocessRawText(txt);
	  var rawText=txt; /* this is the original text which gets chopped */
	  var processText=txt; /* this is treated the same, but it's pre-processed for conversions */
	  //debug: alert('text before: |'+rawText+'|');
	  var re = /\r/g;
	  processText=processText.replace(re,' ');
	  re = /\n/g;
	  processText=processText.replace(re,' ');
	  //debug: alert('text after: |'+rawText+'|');
	  var convertedText=''; /* this is the converted text which grows */
	  var wordData=false; /* temporary var where we store the result of cGSW() */
	  var convertedTmp='';

	  while (wordData=this.getSelectedWord(processText)) {
	    var cr=this.doConversion(wordData.match,wordData);
	    if (MCE.prefs.getPref('pref_replace_original') && cr && !cr.inhibit) {
	      convertedText=convertedText+rawText.substring(0,wordData.index);
	    } else {
	      convertedText=convertedText+rawText.substring(0,wordData.index+wordData.match.length);
	    }
	    rawText=rawText.substring(wordData.index+wordData.match.length,rawText.length);
	    processText=processText.substring(wordData.index+wordData.match.length,processText.length);
	    if (cr && !cr.inhibit) {
	      if (cr.only_show_converted || MCE.prefs.getPref('pref_only_show_converted')) {
		    convertedTmp=cr.outCustom;
	      } else {
		    convertedTmp=cr.inValue + " " + cr.inUnit + " = " + cr.outCustom;
	      }
	      if (MCE.prefs.getPref('pref_replace_original')) {
		convertedText+=convertedTmp;
	      } else {
		convertedText+=" ("+convertedTmp+")";
	      }
	    }
	  }
	  return convertedText+rawText;
	},

	computeFraction:function(text)
	{
		var re = /([0-9]+)\/([0-9]+)/;
		var result=re.exec(text);
		if (!result) {
			// We assume we're receiving a number, at least
			return new Number(text);
		}
		var numr=new Number(result[1]);
		var numt=new Number(result[2]);
		if (!numr || !numt) {
			return 0;
		}
		return numr/numt;
		
	},

	getSelectedWord:function(word)
	{
	  var results=new Array();
	  var tmp;

	  // Custom must go first
	  results=results.concat(this.getCustomWord(word));

	  results=results.concat(this.getUnitWord(word));
	  results=results.concat(this.getTimeWord(word));
	  results=results.concat(this.getCurrencyWord(word));

	  return this.bestAmong(results);
	},

	getCustomWord:function(word)
	{
		if (MCE.premium==undefined) {
			return new Array();
		}
		return MCE.premium.custom_units.getWord(word);
	},

	getTimeWord:function(word)
	{
	  if (!MCE.prefs.getPref('pref_time_enabled')) {
	    return new Array();
	  }

	  var results=new Array();
	  var tmp;

	  // 12h/24h
	  //var re = /([0-9]{1,2})(:([0-9]{2}))?(:([0-9]{2}))?[\s]*(am|a\.m\.|pm|p\.m\.)?[\s]*([+\-0-9A-Z]{3,5})?/i;
	  /*
	    This needs to be broken down in two cases ("hh:mm" plus optional stuff, and
	    "hh AM/PM" plus optional stuff); making both ":mm" and "AM/PM" optional
	    results in messy matches which break the processing.
	    ----------
	    Update: the first case above needs to be broken down in two cases as well:
	    "<hh:mm> [am/pm] <TZ>" and "<hh:mm> [am|pm]" in order to properly parse
	    "abc 9:00 AM cba -- abc 9:00 AM cbaza" -- and in the first branch, the <TZ>
	    needs to actually be verified.
	    ----------
	    Update: in the TZ area, the [\s]* is included explicitly because it needs
	    to live in the TZ atom; otherwise "local 9:00 AM in Austria" is improperly
	    spaced.
	    ----------
	    Update: if/else doesn't work well when multiple time formats are shown
	    one after another -- "10 a.m. * 10 p.m. * 10 A.M. * 10 P.M. * 13:33:33 UTC"
	    ----------
	    Update: the military format (0800 GMT) is used more frequently than I
	    had assumed; made the colon optional in all formats in order to support it.
	    ----------
	    Update: the conditions for tmp used to be as follows:
	    if (result && result[1] && (!result[3] || (result[4] && MCE.tzUtil.get_tz_offset(result[4])!=undefined) || (result[5] && MCE.tzUtil.get_tz_offset(result[5])!=undefined))) 

	    I have removed the "!result[3]" condition because it didn't seem to make
	    sense -- result[3] is a blanket generalization and I can't currently
	    understand why it was there in the first place...
	    ---------
	    Update: I used to have "([a-z]{3,4}", but that didn't match Z and NT.
	    Changed to "([a-z]{1,4}", hope there aren't any side effects.
	  */
	  var re = new RegExp("([0-9]{1,2}):?([0-9]{2})(:([0-9]{2}))?(\\.[0-9]+)?[\\s]*(am|a\\.m\\.|pm|p\\.m\\.)?([\\s]*([+\\-][0-9]{4})|[\\s]*("+MCE.tzUtil.tzLegitRegexp+"))?","i");
	  var result = re.exec(word);
	  if (
	    result &&
	    MCE.tzUtil.validate_hour(result[1]) &&
	    MCE.tzUtil.validate_minute(result[2]) &&
	    (
	      (result[6] && !result[7]) ||
	      (
	        result[8] &&
	        MCE.tzUtil.get_tz_offset(result[8])!=undefined
	      ) ||
	      (
	        result[9] &&
	        MCE.tzUtil.get_tz_offset(result[9])!=undefined
	      )
	    )
	  ) {
	    tmp={
	      parser: 'TZ I'
	    };
	    tmp.value=result[0];
	    tmp.unit='internal_time';
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  // UTC+N, UTC-N, GMT+N, GMT-N
	  var re = /([0-9]{1,2}):([0-9]{2})(:([0-9]{2}))?(\.[0-9]{1,2})?[\s]*[\(]?(UTC|GMT)([+\-])([0-9]{1,2})[\)]?/;
	  var result = re.exec(word);
	  if (result) {
	    tmp={
	      parser: 'TZ UTC',
	      value: result[0],
	      unit: 'internal_time',
	      match: result[0],
	      index: word.indexOf(result[0]),
	      orig_tz: new Number(result[7]+result[8])
	    };
            results.push(tmp);
	  }

	  // Added version with mandatory colon, because there are some formats
	  // which were "tricking" the optional regexp
	  var re = new RegExp("([0-9]{1,2}):([0-9]{2})(:([0-9]{2}))?(\.[0-9]{1,2})?[\\s]*(am|a\\.m\\.|pm|p\\.m\\.)?([\\s]*([+\\-][0-9]{4})|[\\s]*("+MCE.tzUtil.tzLegitRegexp+"))?","i");
	  var result = re.exec(word);
	  if (
	    result &&
	    MCE.tzUtil.validate_hour(result[1]) &&
	    MCE.tzUtil.validate_minute(result[2]) &&
	   (
	     !result[7] ||
	     (
	       result[8] &&
	       MCE.tzUtil.get_tz_offset(result[8])!=undefined) ||
	       (
	         result[9] &&
	         MCE.tzUtil.get_tz_offset(result[9])!=undefined
	       )
	     )
	   ) {
	    tmp={
	      parser: 'TZ II'
	    };
	    tmp.value=result[0];
	    tmp.unit='internal_time';
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  // There used to be a question mark after the am/pm test, but I removed it
	  // because that was matching (and converting) "2009" and such.
	  var re = /([0-9]{1,2}):?([0-9]{2})(:([0-9]{2}))?[\s]*(am|a\.m\.|pm|p\.m\.)/i;
	  var result = re.exec(word);
	  if (
	    result &&
	    MCE.tzUtil.validate_hour(result[1]) &&
	    MCE.tzUtil.validate_minute(result[2])
	  ) {
	    tmp={
	      parser: 'TZ III'
	    };
	    tmp.value=result[0];
	    tmp.unit='internal_time';
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  var re = /([0-9]{1,2})[\s]*(am|a\.m\.|pm|p\.m\.)([\s]*([+\-][0-9]{4})|[\s]*([A-Z]{3,4}))?/i;
	  var result = re.exec(word);
	  if (
	    result &&
	    MCE.tzUtil.validate_hour(result[1]) &&
	    (
	      (
	        !result[4] &&
	        !result[5]
	      ) ||
	      (
	        result[4] &&
	        MCE.tzUtil.get_tz_offset(result[4])!=undefined
	      ) ||
	      (
	        result[5] &&
	        MCE.tzUtil.get_tz_offset(result[5])!=undefined
	      )
	    )
	  ) {
	    if (!result[3]) {
	      result[3]='';
	    } else {
	      result[3]=' '+result[3];
	    }
	    tmp={
	      parser: 'TZ IV'
	    };
	    tmp.value=result[1]+':00 '+result[2]+result[3];
	    tmp.unit='internal_time';
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  return results;
	},

	getUnitWord:function(word)
	{
	  if (!MCE.prefs.getPref('pref_unit_enabled')) {
	    return new Array();
	  }

	  var results=new Array();
	  var tmp;

	  // Let's start by checking for the awkward Imperial notations.
	  
	  // First checking for egineering format (1'2 1/32" or 1'2-1/32").
	  // If found, we convert the whole thing to inches and return as if we
	  // encountered the corresponding string in inches using decimal notation
	  // instead of fractions.
	  var re = /(([0-9]*)['′’])?([0-9]+)([\s]+|[\-])([0-9]+\/[0-9]+)[\s\-]?(″|"|inches|inch|in)/i;
	  var result = re.exec(word);
	  if (result) {
	    if (!result[1])
	      result[1]=0;
	    tmp={
	      parser: 'awkward Imperial'
	    };
	    tmp.value=new Number(0);
	    if (result[2]!=undefined) {
	      tmp.value+=new Number(12*result[2]);
	    }
	    tmp.value+=new Number(result[3]);
	    tmp.value+=this.computeFraction(result[5]);
	    tmp.unit="in";
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }
	  
	  var re = /([0-9]*)['′’]([0-9]+)([\s]+|[\-])([0-9\/]+)/;
	  var result = re.exec(word);
	  if (result) {
	    tmp={
	      parser: 'awkward Imperial II'
	    };
	    tmp.value=12*result[1]+1*result[2]+this.computeFraction(result[4]);
	    tmp.unit="in";
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }
	  
	  // And finally checking for informal format (5'10)
	  // We first try finding the full format (x'y"), and if that doesn't work,
	  // we look for the simplified format (x'y) -- unfortunately we can't append
	  // ["]? at the end of the first regexp, because it would never match the
	  // final double quote, even if it's there, since it's optional and there's
	  // nothing afterwards to force the regexp algorithm to use it.
	  var re = /([0-9]+)['′’][ ]*([0-9]{1,2})["″]/;
	  var result = re.exec(word);
	  if (result) {
	    tmp={
	      parser: 'informal Imperial'
	    };
	    tmp.value=12*result[1]+1*result[2];
	    tmp.unit="in";
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  } else {
	    var re = /([0-9]+)['′’][ ]*([0-9]{1,2})/;
	    var result = re.exec(word);
	    if (result) {
	      tmp={
	        parser: 'informal Imperial II'
	      };
	      tmp.value=12*result[1]+1*result[2];
	      tmp.unit="in";
	      tmp.match=result[0];
	      tmp.index=word.indexOf(result[0]);
	      results.push(tmp);
	    }
	  }

	  // Let's check for extended symbols
	  // Double backslashes below because we need to escape the backslash itself to
	  // get it across the string format. One hour of cursing; idiot, I should have known this.
	  // Changed
	  // ([\\-]?[0-9.][0-9.,\\/]*)[\\s]+
	  // to
	  // ([\\-]?[0-9.][0-9.,\\/]*)[\\s]*
	  // in order to accept "10&deg; F"
	  var re = new RegExp("([\\-]?[0-9.][0-9.,\\/]*)[\\s]*("+MCE.extended_symbols.join('|').replace(/\./g,"\\.")+")","i");
	  var result = re.exec(word);
	  if ((result) && (result[1]) && (result[2])) {
	    var pos=MCE.util.inArray(result[2].toLowerCase().replace(/[\s]+/g,' '),MCE.extended_symbols_raw);
	    if (pos>-1)
	    {
	      //debug: alert('extended match: '+result[1]+'--'+result[2]);
	      tmp={
	        parser: 'extended symbols'
	      };
	      tmp.value=result[1];
	      tmp.unit=MCE.extended_symbols_raw[pos].replace(/ /g,'_');
	      tmp.match=result[0];
	      tmp.index=word.indexOf(result[0]);
	      results.push(tmp);
	    }
	  }

	  // Ok, didn't find any of the wicked ones, let's check for
	  // some reasonable measurements AND fractions.
	  // --- NOTES ---
	  // The last bracket used to include "\-", but I removed it as to allow
	  // converting all of those Imperial idiots' "50-foot monster" and so on.
	  // Hope I didn't mess up, I can't remember whether there was a real reason
	  // for that in here, or whether it was simply a precaution.
	  // -------------
	  // Explicityly avoiding the "-" units because it used to match "2008-10-12" as
	  // "2008" with units "-".
	  // -------------
	  // Also, I replaced the second atom,
	  // ([^ .,!?;+\(\)0-9]+)
	  // with
	  // ([^ .,!?;+\(\)0-9][^ .,!?;+\(\)0-9'"]*)
	  // as to allow stuff in quotes -- e.g. "25 kg" -- without messing up the
	  // support for inches (") and feet (').
	  // -------------
	  // Disallowing numbers in the first position for units, because it was
	  // breaking dates
	  // ("Thu, 21 Dec 2000 16:59 -0030" --> it was catching "2000 1")
	  // -------------
	  // Added a "rough" regexp test before the actual test in order to rule out
	  // long strings made of numbers, which made the regexp freeze for way
	  // too long.
	  // -------------
	  // Changed exclusive tests ([^foo]+) with inclusive tests ([bar]+) in order
	  // to avoid various types of mishaps (I had to constantly adjust the
	  // restrictions, and I always failed making it work for all situations).
	  // The CVS version which still contains (imperfect) exclusive tests is 1.42.
	  // -------------
	  // The reason why I allow ([\\d]+[.]?)+ instead of ([\\d])+[.]? is that
	  // I have to account for "6.322.867 feet". Of course, that shouldn't
	  // interfere with 'disabling "Converter 0.6.2" stops FF from freezing',
	  // which used to happen (it used to converte "062 in" instead of "6.2 in").
	  // - END NOTES -

	  // Not using the "proper" stuff here, we just need a rough test (never tested
	  // this version, but it's most probably too strict to be useful, because we
	  // include restrictions based on units, but be DON'T allow stuff
	  // related to other considerations ("thousands", number formatting, etc)
	  //var re = new RegExp("([\\-]?)([\\d,.]+)[\\s]*(["+MCE.symbol_1+"]["+MCE.symbol_2plus+"]+)");
	  // ok, now that we have proper, identical rules for comma- and
	  // period-fractions, we need better safeguards too.
	  // var re = /([\-]?)([\d,.]+)[ ]*([^ .,!?;+\(\)0-9\s]+)/[ignore this bracket]

	  var re = /([\-]?)([\d]+\.|[\d]+|\.|[\d]+,)([\s]*|-)([\d]*)([^ .,!?;+\(\)0-9\s]+)/;
	  if (re.exec(word)) {
	    var re = new RegExp("([\\-]?)(((([\\d]+[.]?)+(,[0-9]+)?)|([\\d]*\\.[\\d]+))([/][0-9]+)?)[\\s]*(thousand|million)?[\\s\\-]*(["+MCE.symbol_1+"]["+MCE.symbol_2plus+"]*)","i");
	    var result = re.exec(word);
	    //debug: alert('Matching this: '+word);
	    // Must have the first (result), or the whole thing blows for null results
	    if ((result) && (result[2]) && (result[10]) && (result[10].substring(result[10].length-1)!='-')) {
	      //debug: alert('Match -- ['+result[1]+'] -- ['+result[2]+']');
	      var tmpTest=result[2];
	      var tmp_idx=result[2].indexOf("/");
	      if (tmp_idx!=-1 && tmp_idx!=result[2].length-1) {
		var resultMembers=result[2].split("/");
	        var i;
		for(i=0;i<resultMembers.length;i++) {
		  resultMembers[i]=MCE.util.determine_separators(resultMembers[i]);
		}
		result[2]=this.computeFraction(resultMembers.join("/"));
	      }
	      var multi=1;
	      if (result[9]) {
		if (result[9]=='million') {
		  multi=1000000;
		} else {
		  multi=1000;
		}
	      }
	      tmp={
	        parser: 'regular comma'
	      };
	      tmp.value=result[1]+result[2];
	      tmp.unit=MCE.util.simplify(result[10].toLowerCase());
	      tmp.match=MCE.util.simplify(result[0]);
	      tmp.index=word.indexOf(result[0]);
	      tmp.multiplier=multi;
	      results.push(tmp);
	    }

	    var re = new RegExp("([\\-]?)((([\\d]+[\\,]?)+(\\.[0-9]+)?)([/][0-9]+)?)[\\s]*(thousand|million)?[\\s]*(["+MCE.symbol_1+"]["+MCE.symbol_2plus+"]*)","i");
	    var result = re.exec(word);
	    //debug: alert('Matching this: '+word);
	    // Must have the first (result), or the whole thing blows for null results
	    if ((result) && (result[2]) && (result[8]) && (result[8].substring(result[8].length-1)!='-')) {
	      //debug: alert('Match -- ['+result[1]+'] -- ['+result[2]+']');
	      var tmpTest=result[2];
	      var tmp_idx=result[2].indexOf("/");
	      if (tmp_idx!=-1 && tmp_idx!=result[2].length-1) {
		var resultMembers=result[2].split("/");
		for(i=0;i<resultMembers.length;i++) {
		  resultMembers[i]=MCE.util.determine_separators(resultMembers[i]);
		}
		result[2]=this.computeFraction(resultMembers.join("/"));
	      }
	      var multi=1;
	      if (result[7]) {
		if (result[7]=='million') {
		  multi=1000000;
		} else {
		  multi=1000;
		}
	      }
	      tmp={
	        parser: 'regular period'
	      };
	      tmp.value=result[1]+result[2];
	      tmp.unit=MCE.util.simplify(result[8].toLowerCase());
	      tmp.match=MCE.util.simplify(result[0]);
	      tmp.index=word.indexOf(result[0]);
	      tmp.multiplier=multi;
	      results.push(tmp);
	    }
	  }

	  // Explicitly looking for 10 foot 5, 10-foot-6, "10 feet 5 inches", etc
	  // Note: I removed support for "10 feet, 5 inches" because it was messing
	  // up legitimate lists like "10 feet, 12 feet" -- if this is really needed
	  // it must be separated into a new test.
	  // Be advised that this is quite finely tuned, don't mess with it lightly.
	  re = /([0-9]+)[\s\-]*(foot|feet|ft|'|`)[\s\-]*([0-9]*(\.[0-9]+)?)[\s\-]*?(([0-9]+)\/([0-9]+)[\s\-]*)?([\s]*(inches|inch|in))?/i;
	  result = re.exec(word);
	  if (result) {
	    var fract=0;
	    if (result[5] && (result[7]>0)) {
	      fract=result[6]/result[7];
	    }
	    tmp={
	      parser: 'explicit 10 foot 5'
	    };
	    if (result[3] || fract) {
	      tmp.value=12*result[1]+1*result[3]+fract;
	      tmp.unit='in';
	    } else {
	      tmp.value=result[1];
	      tmp.unit='ft';
	    }
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  // Explicitly looking for 10 foot 1/5, 10-foot-1/6, etc
	  // This is an exact replica of the above, but without the integer part for inches
	  re = /([0-9]+)[\s\-]*(foot|feet|ft|'|`)[\s\-]*(([0-9]+)\/([0-9]+)[\s\-]*)([\s]*(inches|inch|in))?/i;
	  result = re.exec(word);
	  if (result && result[5]>0) {
	    tmp={
	      parser: 'explicit 10 foot 1/5'
	    };
	    tmp.value=12*result[1]+result[4]/result[5];
	    tmp.unit='in';
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  // Explicitly looking for 11 stone 4
	  re = /([0-9]+)[\s]+stone(s)?[\s]+([0-9]+)/;
	  result = re.exec(word);
	  if (result) {
	    tmp={
	      parser: 'explicit 11 stone 4'
	    };
	    tmp.value=Number(result[1])+Number(result[3])/14;
	    tmp.unit='stones';
	    tmp.match=result[0];
	    tmp.index=word.indexOf(result[0]);
	    results.push(tmp);
	  }

	  return results;
	},

	number_regexp_next:10,

	number_regexp:
	    "("+
	      "([\\d]+\\,)+[\\d]+\\.(-|[\\d]+)|"+ /* 123,123,123.123456 */
	      "([\\d]+\\.)+[\\d]+\\,(-|[\\d]+)|"+ /* 123.123.123,123456 */
	      "([\\d]+\\,)+[\\d]+|"+ /* 123,123,123 */
	      "([\\d]+\\.)+[\\d]+|"+ /* 123.123.123 */
	      "[\\d]+\\.(-|[\\d]+)|"+ /* 123.12 */
	      "[\\d]+\\,(-|[\\d]+)|"+ /* 123,12 */
	      "\\.[\\d]+|"+ /* .123456 */
	      "[\\d]+"+ /* 123456 */
	    ")",

	getCurrencyWord:function(word)
	{
	  if (!MCE.prefs.getPref('pref_currency_enabled')) {
	    return new Array();
	  }
	  var results=new Array();
	  var tmp;
	  var re;
	  var result;
	  var i;

	  // First, a rough test to exclude long strings of digits
	  if (/[\d.,\-]+[\s]*[a-z$]{3}/i.exec(word)) {
	    re = new RegExp(MCE.core.number_regexp+"[\\s]*(([a-z]{3})|([a-z]{2})[\\s]*\\$)([a-z]?)","i");
	    result = re.exec(word);
	    if (
	      result &&
	      !result[MCE.core.number_regexp_next+3] && /* We don't want to convert "3 cops" ("3 COP") */
	      (
	        (
	          result[MCE.core.number_regexp_next+1] &&
	          MCE.util.inArray(result[MCE.core.number_regexp_next+1].toUpperCase(),MCE.currency.currencies)>-1
	        ) || (
	          result[MCE.core.number_regexp_next+2] &&
	          MCE.currency.dollar_aliases[result[MCE.core.number_regexp_next+2].toUpperCase()]
	        )
	      )
	    ) {
	      tmp={
	        parser: 'currency, regular, right',
	        value: result[1],
	        unit: 'internal_currency',
	        match: result[0],
	        index: word.indexOf(result[0])
	      };
	      var alias;
	      if (result[MCE.core.number_regexp_next+2])
	        alias=MCE.currency.dollar_aliases[result[MCE.core.number_regexp_next+2].toUpperCase()];
	      if (alias) {
	        tmp.currency=alias;
	      } else {
	        tmp.currency=result[MCE.core.number_regexp_next+1].toUpperCase();
	      }
	      results.push(tmp);
	    }
	  }

	  re = new RegExp("([a-z]?)(([a-z]{3})|([a-z]{2})[\\s]*\\$)[\\s]*"+MCE.core.number_regexp,"i");
	  result = re.exec(word);
	  if (
	    result &&
	    !result[1] && /* We don't want to convert "fleur 3" ("EUR 3") */
	    (
	      (
	        result[3]&&
	        MCE.util.inArray(result[3].toUpperCase(),MCE.currency.currencies)>-1
	      ) || (
	        result[4] &&
	        MCE.currency.dollar_aliases[result[4].toUpperCase()]
	      )
	    )
	  ) {
	    tmp={
	      parser: 'currency, regular, left',
	      value: result[5],
	      unit: 'internal_currency',
	      match: result[0],
	      index: word.indexOf(result[0])
	    };
	    var alias;
	    if (result[4])
	      alias=MCE.currency.dollar_aliases[result[4].toUpperCase()];
	    if (alias) {
	      tmp.currency=alias;
	    } else {
	      tmp.currency=result[3].toUpperCase();
	    }
	    results.push(tmp);
	  }

	  // First, rough test to rule out long strings of digits
	  if (/[\d.,\-]+[\s]*[^\s\d.,\-]/.exec(word)) {
	    re = new RegExp(MCE.core.number_regexp+"[\\s]*((["+MCE.currency.unambiguous_regexp+"])|"+MCE.currency.unambiguous_notation.notation+")");
	    result=re.exec(word);
	    if (result) {
	      tmp={
	        parser: 'currency, unambiguous, right',
	        value: result[1],
	        unit: 'internal_currency',
	        match: result[0],
	        index: word.indexOf(result[0])
	      };
	      if (result[MCE.core.number_regexp_next+1]!=undefined) {
	        // Unambiguous symbol
	        for(i=0;i<MCE.currency.unambiguous_currency_symbols.length;i++) {
	          if(result[MCE.core.number_regexp_next]==MCE.currency.unambiguous_currency_symbols[i].symbol) {
	            tmp.currency=MCE.currency.unambiguous_currency_symbols[i].ISO;
	            break;
	          }
	        }
	      } else {
	        // Unambiguous notation
	        for(i=MCE.core.number_regexp_next+2;i<result.length;i++) {
	          if (result[i]==undefined) continue;
	          tmp.currency=MCE.currency.unambiguous_notation.ISO[i-MCE.core.number_regexp_next-2];
	        }
	      }
	      results.push(tmp);
	    }
	  }

	  re = new RegExp("((["+MCE.currency.unambiguous_regexp+"])|"+MCE.currency.unambiguous_notation.notation+")[\\s]*"+MCE.core.number_regexp);
	  result=re.exec(word);
	  if (result) {
	    var unCount=MCE.currency.unambiguous_notation.ISO.length;
	    tmp={
	      parser: 'currency, unambiguous, left',
	      value: result[unCount+3],
	      unit: 'internal_currency',
	      match: result[0],
	      index: word.indexOf(result[0])
	    };
	    if (result[2]!=undefined) {
	      // Unambiguous symbol
	      for(i=0;i<MCE.currency.unambiguous_currency_symbols.length;i++) {
	        if(result[1]==MCE.currency.unambiguous_currency_symbols[i].symbol) {
	          tmp.currency=MCE.currency.unambiguous_currency_symbols[i].ISO;
	          break;
	        }
	      }
	    } else {
	      // Unambiguous notation
	      for(i=3;i<unCount+3;i++) {
	        if (result[i]==undefined) continue;
	        tmp.currency=MCE.currency.unambiguous_notation.ISO[i-3];
	      }
	    }
	    results.push(tmp);
	  }

	  re = new RegExp("\\$[\s]*("+MCE.core.number_regexp+")");
	  result=re.exec(word);
	  if (result) {
	    tmp={
	      parser: 'currency, dollars, left',
	      value: result[1],
	      unit: 'internal_currency',
	      match:result[0],
	      index:word.indexOf(result[0]),
	      currency: '$'
	    };
	    results.push(tmp);
	  }

	  re = new RegExp("("+MCE.core.number_regexp+")[\s]*\\$");
	  result=re.exec(word);
	  if (result) {
	    tmp={
	      parser: 'currency, dollars, right',
	      value: result[1],
	      unit: 'internal_currency',
	      match:result[0],
	      index:word.indexOf(result[0]),
	      currency: '$'
	    };
	    results.push(tmp);
	  }

	  return results;
	},

	/*
	* This method compares any number of atoms.
	*/
	bestAmong:function(results)
	{
	  if (!results.length) {
	    return false;
	  }
	  var br=results[0];
	  // Trimming the fat at the end
	  br.match=br.match.replace(/[\s]+$/,'');

	  for(var i=1;i<results.length;i++) {
	    results[i].match=results[i].match.replace(/[\s]+$/,'');
	    br=this.bestBetween(br,results[i]);
	  }
	  return br;
	},

	/*
	* This method compares two atoms and returns the best fit.
	*
	* By "best fit" I understand applying the following criteria, in this
	* order (i.e. if all things are equal, go on; otherwise, make a decision):
	* 1. The other is no match or it's an all-numeric match (i.e. the matching
	*    string is either empty or only made of digits and spaces);
	* 2. The other shows up later in the original string;
	* 3. The other is shorter;
	* 4. The other's VALUE is smaller -- this is here in order to prevent
	*    Aresult3 (generic) from hijaking Aresult2 (e.g. "3'3"). Given that
	*    this is practically the last meaningful test -- all hh:mm and so on
	*    should have already been sorted out by now, and returing the first one
	*    randomly (as the next decision would) can't be worse than comparing
	*    their magnitudes.
	* 5. Everything's equal so far. But if one of them is currency then we give
	*    that one priority, because we make strict tests for currency validity
	*    on parsing, whereas other units are not so strictly controlled.
	* 6. Return the first one. Well, a decision needs to be made, after all.
	*    Thankfully this happens practically never, and when it does the results are
	*    typically identical anyway (i.e. the same conversion is triggered).
	*    TODO: I could study this in more depth though, maybe by phoning home when
	*    this happens and the units are not the same (with the user's permission,
	*    of course).
	*/
	bestBetween:function(res1,res2)
	{
	  var re=/^[0-9 ]+$/;
	  // (1)
	  if (!res1.match || re.exec(res1.match)) {
	    return res2;
	  }
	  if (!res2.match || re.exec(res2.match)) {
	    return res1;
	  }
	  // (2)
	  if (res1.index<res2.index) {
	    return res1;
	  }
	  if (res1.index>res2.index) {
	    return res2;
	  }
	  // (3)
	  if (res2.match.length>res1.match.length) {
	    return res2;
	  }
	  if (res2.match.length<res1.match.length) {
	    return res1;
	  }
	  // (4)
	  if (res2.value>res1.value) {
	    return res2;
	  }
	  // (5)
	  if (res1.currency!==undefined) {
	    return res1;
	  }
	  if (res2.currency!==undefined) {
	    return res2;
	  }
	  // (6)
	  return res1;
	},

	init:function()
	{
	  MCE.extended_symbols=new Array();
	  MCE.extended_symbols_raw=new Array();
	  MCE.symbol_1='';
	  MCE.symbol_2plus='';
	  MCE.conversions = MCE.core.registerConverters();
	}
};

MCE.core.init();
}
