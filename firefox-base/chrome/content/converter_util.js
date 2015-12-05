if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {

MCE.util={
	/*
	  This function swiped from http://www.mredkj.com/javascript/nfbasic.html
	*/
	addSeparators:function(nStr)
	{
	  var thou_sep=MCE.prefs.getPref('pref_thou_sep');
	  var dec_sep=MCE.prefs.getPref('pref_dec_sep');
	  nStr += '';
	  var x = nStr.split('.'); /* originally that's how it is */
	  var x1 = x[0];
	  var x2 = x.length > 1 ? dec_sep + x[1] : '';
	  var rgx = /(\d+)(\d{3})/;
	  while (rgx.test(x1)) {
	    x1 = x1.replace(rgx, '$1' + thou_sep + '$2');
	  }
	  return x1 + x2;
	},

	smartRound:function(v,unit)
	{
	  if (MCE.premium!=undefined) {
	    var premiumRound=MCE.premium.premiumRound(v,unit);
	    if (premiumRound!=undefined) {
	      return premiumRound;
	    }
	  }

	  var vStr=new String(v);

	  // no decimals -- return as such
	  if (vStr.indexOf('.')==-1)
	    return this.addSeparators(vStr);

	  // value larger than 100 -- return without decimals
	  if (v>100) {
	    return this.addSeparators(Math.round(v));
	  }

	  var log=this.floorLog10(vStr);
	  var out=new String(new Number(v).toFixed(2-log));
	  return this.addSeparators(out.replace(/[.]?[0]+$/,''));
	},

	/*
	  Basically returns floor(log10(s)) -- it does it the cheap way, with strings.
	*/
	floorLog10:function(s)
	{
	  var x = s.replace(/^-/,'').split('.'); /* Math.abs() for strings; split around decimal point */

	  if (Number(x[0]!='0')) { /* integer part significant */
	    return x[0].length-1; /* "1" => 0; "10" => 1; "100" => 2; ... */
	  }

	  // it must be 0.(something); we count the zeroes in (something)
	  var zeroes=/^([0]*)/.exec(x[1]);
	  return -zeroes[1].length-1; /* "0.1" => -1; "0.01" => -2; ... */
	},

	/**
	* This function receives a string which presumably contains a number.
	* The number may be formatted with either comma or period as decimal separator,
	* and the other one as thousands separator. This function tries to determine
	* which way it is, defaulting to English format if ambiguous.
	* It returns a proper number.
	*/
	determine_separators:function(s)
	{
	  // Manage prices of the form 3,- or 3.-
	  var re=/[.,]-$/;
	  if (re.exec(s)) {
	    s=s.substr(0,s.length-1)+'0';
	  }
	    
	  // We need to get a string, otherwise we don't care at all
	  if (!isNaN(s)) {
	    return s;
	  }

	  try {
	    var tmp=s.indexOf(",");
	  }
	  catch(e) {
	    return s;
	  }
	    
	  /*

	  We used to execute the code below -- which worked well for legitimate
	  numerical situations like "6.382.866 miles", but it was quite lousy
	  at detecting sillier stuff such as <<disable that "version 6.2.2" crap>>,
	  which it ended up converting as "622 inches".

	  So this was replaced with the block of code just below the comment.

	  // Ok, first we'll take the default out of the way
	  if (tmp==-1) {
	    s=s.replace(/\./g,"");
	    return(s);
	  }
	  */

	  // Even here, we need to check whether this makes any sense. Or not.
	  if (tmp==-1) {
	    // check whether we have a properly formatted number
	    var re = /^[\d]{1,3}(\.[\d]{3})*(\.[\d]+)$/;
	    if (re.exec(s)) {
	      s=s.replace(/\./g,"");
	      return s;
	    } else {
	      return false;
	    }
	  }

	  // Now we're sure we have a comma in there somewhere. Let's dissect this:
	  if (s.indexOf(".")!=-1) {
	    // Good, we also have a period, this makes it easy to determine which case
	    // it is: the last one is the decimal separator.
	    if (s.lastIndexOf(".")>s.lastIndexOf(",")) {
	      // If it's the period, we just remove the commas and return the string
	      s=s.replace(/,/g,"");
	    } else {
	      // If it's the comma, we remove the periods, change the comma into a
	      // period and return the string.
	      s=s.replace(/\./g,"");
	      s=s.replace(/,/g,".");
	    }
	  } else {
	    // Ewww, this is nasty, we positively have a comma, but we have no
	    // period to serve as a witness. We'll branch in two once again:
	    if (s.indexOf(",")!=s.lastIndexOf(",")) {
	      // Either there's more than one comma, in which case the period would
	      // be the decimal separator...
	      s=s.replace(/,/g,"");
	    } else {
	      // ...or there's a single comma. If there's only one comma, then the
	      // number has only ony chance to be suspected of using comma as a
	      // thousands separator: it MUST be in the proper position for it to be a
	      // thousands separator AND the number must be no larger than 100,000.
	      // In which case we'll ASSUME the default case (period is assumed to be
	      // the decimal separator). This is not perfect, but it's the safest bet.
	      // If either of the conditions above is not met, we'll use the comma
	      // as decimal separator.
	      if ((s.length<=7) && (s.indexOf(",")==s.length-4)) {
		s=s.replace(/,/g,"");
	      } else {
		s=s.replace(/\./g,"");
		s=s.replace(/,/g,".");
	      }
	    }
	  }
	  return s;
	},

	/**
	* A simple function to emulate indexOf() for arrays. Returns the position
	* of the needle in the haystack array, or -1 if not found. Used by
	* onConverterPopup() to determine the units in the selection by matching
	* the 2nd result of MCE.core.getSelectedWord() below against the second array
	* returned by MCE.core.registerConverters() above.
	*/
	inArray:function(needle, haystack)
	{
	  var i=0;
	  for(i=0;i<haystack.length;i++) {
	    var hayAtom=haystack[i];
	    if(needle==hayAtom) {
	      return i;
	    }
	  }
	  return -1;
	},

	/*
	* Just a debug function which is not usually needed
	*/
	toASCII:function(str)
	{
	  var dumpData=new String();
	  for(var i=0;i<str.length;i++) {
	    dumpData=dumpData+str.charCodeAt(i)+', ';
	  }
	  return dumpData;
	},

	simplify:function(word)
	{
	  while(word.substr(word.length-1)=='.') {
	    word=word.substr(0,word.length-1);
	  }
	  return word;
	}
};

}
