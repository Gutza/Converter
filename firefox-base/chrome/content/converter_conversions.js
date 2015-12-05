/*

  This file contains three things:
  * MCE.conv_table (variable)
  * MCE.converters (object, contains in2m(), etc)
  * MCE.adjusters (object, contains unit adjuster functions)

*/

/*

TO DO:
 - metric weights => imperial weights
 - surfaces
 - volumes
 - update example page with speeds plus everything above
 - example page: adaptive results -- in2m, m2in, kmph2miph, miph2kmph, lb2kg
*/

if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {

/*
  This string defines which unit is parsed by what converter.
  
  Notes:
  1. Since we separate units when parsing the selection by spaces,
     it is safe to also separate them by spaces here. Therefore the format
     of this string is ((unit)(<space>)*(converter)(<space>)*)*
  2. The converters are functions, defined in MCE.converters.
  3. Make sure there is a backslash at the end of every line in this string.
     A backslash tells the JavaScript interpreter the line is *continued*
     on the next line (i.e. the lines are simply concatenated in the final
     string, no line breaks result in the end). Please note this behaviour is
     variable in JavaScript depending on the browser; luckily we don't have to
     worry about that in this environment. :)
  4. The selection parser is case-insensitive, so all units in here *MUST* be
     in small letters. For instance (deg)C as a unit in the string below
     would NOT match 15 (deg)C in the selection, but (deg)c does.
*/

MCE.conv_table=new String("\
  \"               in2m\tmetric \
  in               in2m\tmetric \
  inch             in2m\tmetric \
  inches           in2m\tmetric \
  \u2033           in2m\tmetric \
  \
  mil              mil2m\tmetric \
  \
  mi               mi2m\tmetric \
  mile             mi2m\tmetric \
  miles            mi2m\tmetric \
  \
  ft               ft2m\tmetric \
  foot             ft2m\tmetric \
  feet             ft2m\tmetric \
  \
  yard             yd2m\tmetric \
  yards            yd2m\tmetric \
  yd               yd2m\tmetric \
  \
  ounce            oz2kg\tmetric \
  oz               oz2kg\tmetric \
  ounces           oz2kg\tmetric \
  \
  pound            lb2kg\tmetric \
  pounds           lb2kg\tmetric \
  lb               lb2kg\tmetric \
  lbs              lb2kg\tmetric \
  \
  stone            stone2all \
  stones           stone2all \
  st               stone2all \
  st.              stone2all \
  \
  kg               kg2lb\tImperial \
  kgs              kg2lb\tImperial \
  kilogram         kg2lb\tImperial \
  kilograms        kg2lb\tImperial \
  \
  g                g2oz\tImperial \
  gram             g2oz\tImperial \
  grams            g2oz\tImperial \
  \
  m                m2in\tImperial \
  meter            m2in\tImperial \
  meters           m2in\tImperial \
  metre            m2in\tImperial \
  metres           m2in\tImperial \
  \
  mm               mm2in\tImperial \
  millimetre       mm2in\tImperial \
  millimetres      mm2in\tImperial \
  millimeter       mm2in\tImperial \
  millimeters      mm2in\tImperial \
  \
  km               km2in\tImperial \
  kilometre        km2in\tImperial \
  kilometres       km2in\tImperial \
  kilometer        km2in\tImperial \
  kilometers       km2in\tImperial \
  \
  "+String.fromCharCode(181)+"m               microm2in\tImperial \
  micrometre       microm2in\tImperial \
  micrometres      microm2in\tImperial \
  micrometer       microm2in\tImperial \
  micrometers      microm2in\tImperial \
  micron           microm2in\tImperial \
  microns          microm2in\tImperial \
  \
  cm               cm2in\tImperial \
  centimetre       cm2in\tImperial \
  centimetres      cm2in\tImperial \
  centimeter       cm2in\tImperial \
  centimeters      cm2in\tImperial \
  \
  "+String.fromCharCode(176)+"celsius         c2f\tFahrenheit \
  "+String.fromCharCode(176)+"celcius         c2f\tFahrenheit \
  "+String.fromCharCode(176)+"c               c2f\tFahrenheit \
  "+String.fromCharCode(176)+"_celsius        c2f\tFahrenheit \
  "+String.fromCharCode(176)+"_celcius        c2f\tFahrenheit \
  "+String.fromCharCode(176)+"_c              c2f\tFahrenheit \
  \u00BAcelsius         c2f\tFahrenheit \
  \u00BAcelcius         c2f\tFahrenheit \
  \u00BAc               c2f\tFahrenheit \
  \u00BA_celsius        c2f\tFahrenheit \
  \u00BA_celcius        c2f\tFahrenheit \
  \u00BA_c              c2f\tFahrenheit \
  "+
  // DO NOT change the order here! Moving 'degree_c' up will kill the other matches!
  "\
  c                c2f\tFahrenheit \
  celsius          c2f\tFahrenheit \
  celcius          c2f\tFahrenheit \
  centigrade       c2f\tFahrenheit \
  centigrades      c2f\tFahrenheit \
  degree_celsius   c2f\tFahrenheit \
  degrees_celsius  c2f\tFahrenheit \
  degree_centigrade  c2f\tFahrenheit \
  degrees_centigrade c2f\tFahrenheit \
  degree_c         c2f\tFahrenheit \
  degrees_c        c2f\tFahrenheit \
  \
  "+String.fromCharCode(176)+"f               f2c\tCelsius \
  "+String.fromCharCode(176)+"fahrenheit      f2c\tCelsius \
  "+String.fromCharCode(176)+"_fahrenheit     f2c\tCelsius \
  "+String.fromCharCode(176)+"_f              f2c\tCelsius \
  \u00BAf               f2c\tCelsius \
  \u00BAfahrenheit      f2c\tCelsius \
  \u00BA_fahrenheit     f2c\tCelsius \
  \u00BA_f              f2c\tCelsius \
  f                  f2c\tCelsius \
  fahrenheit         f2c\tCelsius \
  degree_fahrenheit  f2c\tCelsius \
  degrees_fahrenheit f2c\tCelsius \
  degree_f           f2c\tCelsius \
  degrees_f          f2c\tCelsius \
  \
  mph              miph2kmph\tmetric \
  mi/h             miph2kmph\tmetric \
  mile/h           miph2kmph\tmetric \
  miles/h          miph2kmph\tmetric \
  mile/hour        miph2kmph\tmetric \
  miles/hour       miph2kmph\tmetric \
  miles_per_hour   miph2kmph\tmetric \
  mile_per_hour    miph2kmph\tmetric \
  mile_an_hour     miph2kmph\tmetric \
  miles_an_hour    miph2kmph\tmetric \
  \
  nmi              nmi2all \
  nautical_miles   nmi2all \
  nautical_mile    nmi2all \
  \
  knot             knot2all \
  knots            knot2all \
  kt               knot2all \
  kts              knot2all \
  \
  km/h             kmph2miph\tImperial \
  kmph             kmph2miph\tImperial \
  kilometers/hour  kmph2miph\tImperial \
  kilometres/hour  kmph2miph\tImperial \
  kilometers_per_hour kmph2miph\tImperial \
  kilometres_per_hour kmph2miph\tImperial \
  kilometer_per_hour kmph2miph\tImperial \
  kilometre_per_hour kmph2miph\tImperial \
  \
  degree           deg2all \
  degrees          deg2all \
  deg              deg2all \
  "+String.fromCharCode(176)+"            deg2all \
  \
  m/s              mps2all \
  mps              mps2all \
  meters_per_second mps2all \
  metres_per_second mps2all \
  meter_per_second mps2all \
  metre_per_second mps2all \
  \
  km/s              kmps2all \
  kmps              kmps2all \
  kilometers_per_second kmps2all \
  kilometres_per_second kmps2all \
  kilometer_per_second kmps2all \
  kilometre_per_second kmps2all \
  \
  l                litre2gallon\tImperial \
  liter            litre2gallon\tImperial \
  liters           litre2gallon\tImperial \
  litre            litre2gallon\tImperial \
  litres           litre2gallon\tImperial \
  \
  gallon           gallon2litre\tmetric \
  gallons          gallon2litre\tmetric \
  gal              gallon2litre\tmetric \
  \
  fluid_ounces     floz2ml\tmetric \
  fluid_ounce      floz2ml\tmetric \
  fl._oz.          floz2ml\tmetric \
  fl._oz           floz2ml\tmetric \
  fl_oz.           floz2ml\tmetric \
  fl.oz.           floz2ml\tmetric \
  fl.oz            floz2ml\tmetric \
  fl_oz            floz2ml\tmetric \
  floz             floz2ml\tmetric \
  fluidounce       floz2ml\tmetric \
  fluidounces      floz2ml\tmetric \
  \
  ml               ml2floz\tImperial \
  milliliter       ml2floz\tImperial \
  milliliters      ml2floz\tImperial \
  mililiter        ml2floz\tImperial \
  mililiters       ml2floz\tImperial \
  \
  pa               pa2psi\tImperial \
  pascal           pa2psi\tImperial \
  pascals          pa2psi\tImperial \
  kpa              kpa2psi\tImperial \
  psi              psi2kpa\tmetric \
  \
  internal_time    internal_time \
  internal_currency internal_currency \
  internal_custom  internal_custom \
  \
  square_foot      sqft2sqm\tmetric \
  square_feet      sqft2sqm\tmetric \
  square-foot      sqft2sqm\tmetric \
  square-feet      sqft2sqm\tmetric \
  square_ft        sqft2sqm\tmetric \
  sq_ft            sqft2sqm\tmetric \
  sq._ft.          sqft2sqm\tmetric \
  sq_ft.           sqft2sqm\tmetric \
  sq._ft           sqft2sqm\tmetric \
  sq_feet          sqft2sqm\tmetric \
  sq_foot          sqft2sqm\tmetric \
  sf               sqft2sqm\tmetric \
  foot"+String.fromCharCode(178)+" sqft2sqm\tmetric \
  feet"+String.fromCharCode(178)+" sqft2sqm\tmetric \
  ft"+String.fromCharCode(178)+" sqft2sqm\tmetric \
  ft^2             sqft2sqm\tmetric \
  foot^2           sqft2sqm\tmetric \
  feet^2           sqft2sqm\tmetric \
  \
  square_meters    sqm2sqft\tImperial \
  square_metres    sqm2sqft\tImperial \
  square_meter     sqm2sqft\tImperial \
  square_metre     sqm2sqft\tImperial \
  m"+String.fromCharCode(178)+" sqm2sqft\tImperial \
  meter"+String.fromCharCode(178)+" sqm2sqft\tImperial \
  metre"+String.fromCharCode(178)+" sqm2sqft\tImperial \
  meters"+String.fromCharCode(178)+" sqm2sqft\tImperial \
  metres"+String.fromCharCode(178)+" sqm2sqft\tImperial \
  m^2              sqm2sqft\tImperial \
  meter^2          sqm2sqft\tImperial \
  metre^2          sqm2sqft\tImperial \
  meters^2         sqm2sqft\tImperial \
  metres^2         sqm2sqft\tImperial \
  \
  cc               cc2cuin\tImperial \
  cm^3             cc2cuin\tImperial \
  cm"+String.fromCharCode(179)+" cc2cuin\tImperial \
  cu_in            cuin2cc\tmetric \
  in^3             cuin2cc\tmetric \
  in"+String.fromCharCode(179)+" cuin2cc\tmetric \
  \
  mpg              mpg2lptm\tmetric \
  miles_per_gallon mpg2lptm\tmetric \
  \
  nm               nm2ftlb\tImperial \
  newton_metres    nm2ftlb\tImperial \
  newton_metre     nm2ftlb\tImperial \
  newton_meters    nm2ftlb\tImperial \
  newton_meter     nm2ftlb\tImperial \
");
/*

  ====================================================================
                          THE CONVERTERS
  ====================================================================
  
  Ok, now that we know which unit is parsed with what converter, let's
  define the converters themselves. If you add extra converters, please
  make sure the order of the functions below is the same as in the string
  above.
  
*/

MCE.converters={
	in2m:function(v)
	{
		return {
			inValue:v.value,
			outValue:v.value*0.0254,
			inUnit:'in',
			outUnit: 'm'
		};
	},
	
	mil2m:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*0.0000254,
			inUnit: 'mil',
			outUnit: 'm'
		};
	},

	mi2m:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*1609.344,
			inUnit: 'miles',
			outUnit: 'm'
		};
	},

	ft2m:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*0.3048,
			inUnit: 'ft',
			outUnit: 'm'
		};
	},

	yd2m:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*0.9144,
			inUnit: 'yd',
			outUnit: 'm'
		};
	},

	oz2kg:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*0.0283,
			inUnit: 'oz',
			outUnit: 'kg'
		};
	},

	lb2kg:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*0.45359237,
			inUnit: 'lbs',
			outUnit: 'kg'
		};
	},

	stone2all:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		result.inUnit="stone";
		if (MCE.prefs.getPref('pref_metric')) {
			result.outValue=v.value*6.35029318;
			result.outUnit="kg";
		} else {
			result.outValue=v.value*14;
			result.outUnit="lbs";
		}
		return result;
	},

	kg2lb:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/0.45359237,
			inUnit: 'kg',
			outUnit: 'lbs'
		};
	},

	g2oz:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/28.3,
			inUnit: 'g',
			outUnit: 'oz'
		};
	},

	m2in:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*1000/25.4,
			inUnit: 'm',
			outUnit: 'in'
		};
	},

	mm2in:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/25.4,
			inUnit: 'mm',
			outUnit: 'in'
		};
	},

	km2in:function(v)
	{
		return {
			inValue: v.value,
			outValue: (v.value/0.0254)*1000,
			inUnit: 'km',
			outUnit: 'in'
		};
	},

	microm2in:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/25400,
			inUnit: String.fromCharCode(181)+"m",
			outUnit: 'in'
		};
	},

	cm2in:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/2.54,
			inUnit: 'cm',
			outUnit: 'in'
		};
	},

	c2f:function(v)
	{
		return {
			inValue: v.value,
			outValue: Math.round((v.value*1.8+32)*10)/10,
			inUnit: String.fromCharCode(176)+"C",
			outUnit: String.fromCharCode(176)+"F"
		};
	},

	f2c:function(v)
	{
		return {
			inValue: v.value,
			outValue: Math.round(10*(v.value-32)/1.8)/10,
			inUnit: String.fromCharCode(176)+"F",
			outUnit: String.fromCharCode(176)+"C"
		};
	},

	miph2kmph:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		if (v.value<2) {
			result.outValue=Math.round(v.value*16093.44)/10000;
		} else if (v.value < 10) {
			result.outValue=Math.round(v.value*160.9344)/100;
		} else {
			result.outValue=Math.round(v.value*1.609344);
		}
		result.inUnit="mph";
		result.outUnit="km/h";
		return result;
	},

	kmph2miph:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		if (v.value<3) {
			result.outValue=Math.round(v.value/0.0001609344)/10000;
		} else if (v.value<15) {
			result.outValue=Math.round(v.value/0.01609344)/100;
		} else {
			result.outValue=Math.round(v.value/1.609344);
		}
		result.inUnit="km/h";
		result.outUnit="mph";
		return result;
	},

	deg2all:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		if (MCE.prefs.getPref('pref_celsius')) {
			result.inUnit=String.fromCharCode(176)+"F";
			result.outUnit=String.fromCharCode(176)+"C";
			result.outValue=(v.value-32)/1.8;
		} else {
			result.inUnit=String.fromCharCode(176)+"C";
			result.outUnit=String.fromCharCode(176)+"F";
			result.outValue=v.value*1.8+32;
		}
		return result;
	},

	mps2all:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		result.inUnit="m/s";
		if (MCE.prefs.getPref('pref_metric')) {
			result.outUnit="km/h";
			result.outValue=v.value * 18 / 5;
		} else {
			result.outUnit="mph";
			result.outValue=v.value * 3600 / 1610.3;
		}
		return result;
	},

	kmps2all:function(v)
	{
		var result=MCE.converters.mps2all(v);
		result.outValue*=1000;
		result.inUnit='km/s';
		return result;
	},

	litre2gallon:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/3.785411784,
			inUnit: 'L',
			outUnit: 'gal'
		};
	},

	gallon2litre:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*3.785411784,
			inUnit: 'gal',
			outUnit: 'L'
		};
	},

	ml2floz:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/29.5735295625,
			inUnit: 'ml',
			outUnit: 'fl oz'
		};
	},

	floz2ml:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*29.5735295625,
			inUnit: 'fl oz',
			outUnit: 'ml'
		};
	},

	pa2psi:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/6894.75729,
			inUnit: 'Pa',
			outUnit: 'psi'
		};
	},

	kpa2psi:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/6.89475729,
			inUnit: 'KPa',
			outUnit: 'psi'
		};
	},

	psi2kpa:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*6.89475729,
			inUnit: 'psi',
			outUnit: 'KPa'
		};
	},

	cc2cuin:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/16.387064,
			inUnit: "cm"+String.fromCharCode(179),
			outUnit: "in"+String.fromCharCode(179)
		};
	},

	cuin2cc:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*16.387064,
			inUnit: "in"+String.fromCharCode(179),
			outUnit: "cm"+String.fromCharCode(179)
		};
	},

	mpg2lptm:function(v)
	{
		var oU=new Number(235.2/v.value);
		var oI=new Number(282.5/v.value);
		return {
			only_show_converted: true,
			not_numerical: true,
			inValue: v.value,
			inUnit: 'mpg',
			outCustom: v.value+"mp(US)g = "+oU.toFixed(2)+" L/100 km; "+v.value+" mp(Imp)g = "+oI.toFixed(2)+" L/100 km"
		};
	},

	/*

	This needs to be streamlined!

	We're currently performing an unconditional 12h <--> 24h conversion,
	and THEN we check if we need to perform a timezone conversion as well;
	in that case we simply dump the 12h<-->24h conversion we just performed and
	perform a timezone conversion, which produces the proper output depending
	on the user's preferred format.

	Instead, the timezone conversion should go first. The method should
	also be broken down into two distinct methods, as to properly outline
	the underlying logic.

	*/
	internal_time:function(v)
	{
	  var result=new Object();
	  result.inValue=v.value;
	  // Removing the final "?" kills "7:00 pm"
	  // The last atom used to be ([+\-0-9A-Z]{3,5}); changed it to
	  // ([+\-0-9A-Z]{1,5}) in order to accomodate timezones Z and NT
	  var re = /([0-9]{1,2})(:?([0-9]{2}))?(:[0-9]{2})?(\.[0-9]+)?[\s]*(am|pm|AM|PM|a\.m\.|p\.m\.|A\.M\.|P\.M\.)?[\s]*([+\-0-9A-Z]{1,5})?/;
	  var regexp_result = re.exec(v.value);
	  if (regexp_result[3]==undefined) {
	    regexp_result[3]="00";
	  }
	  if (regexp_result[4]==undefined) {
	    regexp_result[4]='';
	  }
	  if (regexp_result[6]) { /* 12h -> 24h */
	    if (regexp_result[1]=='12') {
	      regexp_result[1]=0;
	    }
	    if (regexp_result[6].toLowerCase().match(/pm|p\.m\./)) {
	      regexp_result[1]=String(Math.abs(regexp_result[1])+12);
	    }
	    var end_result=regexp_result[1]+':'+regexp_result[3]+regexp_result[4];
	    result.inUnit='12h';
	    result.outUnit='24h';
	  } else { /* 24h -> 12h */
	    if (regexp_result[1]=='00' || regexp_result[1]=='0') {
	      regexp_result[1]=12;
	    }
	    if (regexp_result[1]>12) {
	      end_result=String(Math.abs(regexp_result[1])-12)+':'+regexp_result[3]+regexp_result[4]+' PM';
	    } else {
	      end_result=regexp_result[1]+':'+regexp_result[3]+regexp_result[4]+' AM';
	    }
	    result.inUnit='24h';
	    result.outUnit='12h';
	  }
	  result.outValue=end_result;
	  result.not_numerical=true;
	  result.only_show_converted=true;
	  var local_tz=MCE.tzUtil.get_local_offset();
	  var orig_tz;
          if (v.orig_tz!=undefined) {
	    orig_tz=v.orig_tz;
	  } else {
	    orig_tz=MCE.tzUtil.get_tz_offset(regexp_result[7]);
	  }
	  if (isNaN(orig_tz) || orig_tz==local_tz) {
	    // No timezone spec, or same timezone -- returning converted, if applicable
	    if (
	      (result.outUnit=='24h' && MCE.prefs.getPref('pref_24h')) ||
	      (result.outUnit=='12h' && !MCE.prefs.getPref('pref_24h'))
	    ) {
	      return result;
	    } else {
	      return {inhibit:true};
	    }
	  }
	  var hh=regexp_result[1]; /* regexp_result[1] is ALWAYS 24h, see above */
	  var mm=regexp_result[3];
	  var ss=regexp_result[4];
	  //var tz=regexp_result[5];
	  var delta_tz=local_tz-orig_tz; /* to be added to the orig time in order to get local time */
	  var delta_tz_hh=Math.floor(delta_tz);
	  var delta_tz_mm=(delta_tz-delta_tz_hh)*60;
	  var local_hh=1*hh;
	  var local_mm=1*delta_tz_mm+1*mm;
	  if (local_mm>59) {
	    local_hh++;
	    local_mm-=60;
	  }
	  if (local_mm<0) {
	    local_hh--;
	    local_mm+=60;
	  }
	  if (local_mm<10) {
	    local_mm="0"+local_mm;
	  }
	  local_hh+=delta_tz_hh;
	  var local_dd=0;
	  if (local_hh>23) {
	    local_dd++;
	    local_hh-=24;
	  }
	  if (local_hh<0) {
	    local_dd--;
	    local_hh+=24;
	  }
	  if (local_dd==0) {
	    local_dd='';
	  } else if (local_dd==1) {
	    local_dd='/+1';
	  } else {
	    local_dd='/-1';
	  }
	  result.inUnit='';
	  result.outUnit='local TZ';
	  if (MCE.prefs.getPref('pref_24h')) {
	    result.outValue=local_hh+':'+local_mm+ss+local_dd;
	    return result;
	  } else {
	    if (local_hh==0) {
	      local_hh=12;
	    }
	    if (local_hh>12) {
	      local_hh-=12;
	      var local_ampm=' PM';
	    } else {
	      var local_ampm=' AM';
	    }
	    result.outValue=local_hh+':'+local_mm+ss+local_dd+local_ampm;
	    return result;
	  }
	},

	sqft2sqm:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value*0.09290304,
			inUnit: 'sq ft',
			outUnit: "m"+String.fromCharCode(178)
		};
	},

	sqm2sqft:function(v)
	{
		return {
			inValue: v.value,
			outValue: v.value/0.09290304,
			inUnit: "m"+String.fromCharCode(178),
			outUnit: 'sq ft'
		};
	},

	nm2ftlb:function(v)
	{
	  var result=new Object();
	  result.inUnit="Nm";
	  result.inValue=v.value;
	  result.outUnit='ft-lb';
	  result.outValue=v.value*0.7375621;
	  if (result.outValue<1) {
	    result.outUnit='in-lb';
	    result.outValue=result.outValue*12;
	  }
	  return result;
	},

	internal_currency:function(v)
	{
	  var myCurrency=MCE.prefs.getPref('pref_myCurrency');
	  var thisCurrency=v.currency;
	  if (thisCurrency=='$') {
	    thisCurrency=this.ISOfromDollars();
	    if (!thisCurrency) {
	      return {inhibit:true};
	    }
	  }
	  var myCurrency;
	  if (MCE.premium==undefined) {
	    myCurrency=MCE.prefs.getPref('pref_myCurrency');
	  } else {
	    myCurrency=MCE.premium.getMyCurrency(thisCurrency);
	  }
	  if (!myCurrency || thisCurrency==myCurrency) {
	    return {inhibit:true};
	  }
	  var rate=MCE.currency.getRate(thisCurrency,myCurrency);
	  if (!rate) {
	    return {inhibit:true};
	  }
	  return {
	    inValue: v.value,
	    inUnit: thisCurrency,
	    outValue: v.value*rate,
	    outUnit: myCurrency
	  };
	},

	ISOfromKR:function()
	{
	},

	ISOfromDollars:function()
	{
	  if (!MCE.current_URI) {
	    // default
	    return 'USD';
	  }
	  var re = new RegExp("^[a-z]+://([^/]+)");
	  var result=re.exec(MCE.current_URI);
	  if (!result) {
	    // default
	    return 'USD';
	  }
	  var tld=result[1].split('.').pop().toLowerCase();
	  if (MCE.currency.TLD_currency[tld]) {
	    return MCE.currency.TLD_currency[tld];
	  }
	  // default
	  return 'USD';
	},

	knot2all:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		result.inUnit="knot";
		if (MCE.prefs.getPref('pref_metric')) {
			result.outUnit="km/h";
			result.outValue=v.value * 1.852;
		} else {
			result.outUnit="mph";
			result.outValue=v.value * 1.852 / 1.609344;
		}
		return result;
	},

	nmi2all:function(v)
	{
		var result=new Object();
		result.inValue=v.value;
		result.inUnit="nmi";
		if (MCE.prefs.getPref('pref_metric')) {
			result.outUnit="km";
			result.outValue=v.value * 1.852;
		} else {
			result.outUnit="mi";
			result.outValue=v.value * 1.852 / 1.609344;
		}
		return result;
	},

	internal_custom:function(v)
	{
		if (MCE.premium==undefined) {
			// WTF?
			return {inhibit:true};
		}
		return MCE.premium.custom_units.convert(v);
	},
};

MCE.adjusters={
	/*

	  ====================================================================
	                             ADJUSTERS
	  ====================================================================

	  These functions perform order of magnitude adjustments within the same
	  units system, trying to guess the most intuitive unit. For instance
	  it would be counter-intuitive to show a distance of the order of
	  hundreds of kilometers in millimeters.
	  
	*/

	prepareValue:function(o)
	{
	  if (o.outValue>=0) {
	    o.signChanged=false;
	    return o;
	  }
	  o.signChanged=true;
	  o.outValue=-o.outValue;
	  return o;
	},

	restoreValue:function(o)
	{
	  if (o.signChanged) {
	    o.signChanged=false;
	    o.outValue=-o.outValue;
	  }
	  return o;
	},

	metricWeight:function(o)
	{
	  if (o.outUnit!="kg") {
	    return o;
	  }
	  o=this.prepareValue(o);
	  var tv=o.outValue;
	  if ((tv>=1) && (tv<1000)) {
	    return this.restoreValue(o);
	  }
	  if (tv>=1000) {
	    o.outValue/=1000;
	    o.outUnit="t";
	    return this.restoreValue(o);
	  }
	  if (tv>=0.001) {
	    o.outValue*=1000;
	    o.outUnit="g";
	    return this.restoreValue(o);
	  }
	  o.outValue*=1000000;
	  o.outUnit="mg";
	  return this.restoreValue(o);
	},

	// I'm not familiar enough with the imperial units, these may not be the most
	// intuitive choices; I hope they're acceptable though -- if not, you're free
	// to send me a patch any time! :)
	imperialDistance:function(o)
	{
	  if (o.outUnit!="in") {
	    return o;
	  }
	  o=this.prepareValue(o);
	  var tv=o.outValue;
	  if (tv<0.03125) { /* < 1/32 in */
	    o.outValue=tv*100;
	    o.outUnit="mil";
	    return this.restoreValue(o);
	  }
	  if (tv>=42240) { /* > 0.66 miles */
	    o.outValue=tv/63360;
	    o.outUnit="mi";
	    return this.restoreValue(o);
	  }
	  if (tv>=108) { /* 3 yards ... 0.66 miles */
	    o.outValue=tv/36;
	    o.outUnit='yd';
	    return this.restoreValue(o);
	  }
	  if (tv>=36) { /* 3 feet ... 3 yards */
	    var fts=Math.floor(tv/12);
	    var ins=Math.round(tv-fts*12);
	    o.outCustom=fts+"'"+ins;
	    if (o.signChanged) {
	      o.outCustom='-'+o.outCustom;
	    }
	    return o;
	  }

	  // 1/32 in ... 3 feet
	  if (MCE.prefs.getPref('pref_in_fract')) {
	    var tv32=Math.round(tv*32) % 32;
	    if (tv32) {
	      if (tv32==16) {
		var fraction="1/2";
	      } else if (!tv32 % 8) {
		var fraction=(tv32/8)+"/4";
	      } else if (!tv32 % 4) {
		var fraction=(tv32/4)+"/8";
	      } else if (!tv32 % 2) {
		var fraction=(tv32/2)+"/16";
	      } else {
		var fraction=tv32+"/32";
	      }
	    }
	    tv=Math.floor(tv);
	    var inches=tv % 12;
	    tv=(tv-inches)/12;
	    o.outCustom=tv+"'"+inches;
	    if (fraction) {
	      o.outCustom=o.outCustom+"-"+fraction+"\"";
	    } else if (tv==0) {
	      o.outCustom=inches+"\"";
	    } else {
	      o.outCustom=o.outCustom+"\"";
	    }
	    if (o.signChanged) {
              o.outCustom='-'+o.outCustom;
            }
	    return o;
	  }
	  o.outValue=tv;
	  o.outUnit='in';
	  return this.restoreValue(o);
	},

	metricDistance:function(o)
	{
	  if (o.outUnit!="m") {
	    return o;
	  }
	  o=this.prepareValue(o);
	  var tv=o.outValue;
	  if ((tv>=1) && (tv<1000)) {
	    return this.restoreValue(o);
	  }
	  if (tv>=1000) {
	    o.outValue/=1000;
	    o.outUnit="km";
	    return this.restoreValue(o);
	  }
	  if (tv>=0.01) {
	    o.outValue*=100;
	    o.outUnit="cm";
	    return this.restoreValue(o);
	  }
	  if (tv>=0.0001) {
	    o.outValue*=1000;
	    o.outUnit="mm";
	    return this.restoreValue(o);
	  }
	  o.outValue*=1000000;
	  o.outUnit=String.fromCharCode(181)+"m";
	  return this.restoreValue(o);
	},

	imperialVolume:function(o)
	{
	  o=this.prepareValue(o);
	  if ((o.outUnit=='fl oz') && (o.outValue>80)) {
	    o.outUnit='gal';
	    o.outValue/=128;
	  }
	  if ((o.outUnit=='gal') && (o.outValue<0.625)) {
	    o.outUnit='fl oz';
	    o.outValue*=128;
	  }
	  return this.restoreValue(o);
	},

	metricVolume:function(o)
	{
	  o=this.prepareValue(o);
	  if ((o.outUnit=='ml') && (o.outValue>1000)) {
	    o.outUnit='L';
	    o.outValue/=1000;
	  }
	  if ((o.outUnit=='L') && (o.outValue<1)) {
	    o.outUnit='ml';
	    o.outValue*=1000;
	  }
	  return this.restoreValue(o);
	}
};

}
