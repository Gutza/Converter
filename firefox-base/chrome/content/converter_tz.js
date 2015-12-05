if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.tzUtil = {
  tzLegitRegexp: '',

  timezones : {
    "IDLW":-12,
    "NT":-11,
    "HST":-10,
    "AKST":-9,
    "PST":-8,"AKDT":-8,
    "MST":-7,"PDT":-7,
    "CST":-6,"MDT":-6,
    "EST":-5,"CDT":-5,
    "EDT":-4,"AST":-4,
    "GUY":-3,"ADT":-3,
    "AT":-2,
    "UTC":0,"GMT":0,"Z":0,"WET":0,
    "WEST":1,"CET":1,"BST":1,"IST":1,
    "CEST":2,"EET":2,
    "EEST":3,"MSK":3,
    "MSD":4,"ZP4":4,
    "ZP5":5,
    "ZP6":6,
    "WAST":7,
    "AWST":8,"WST":8,
    "JST":9,
    "ACST":9.5,
    "ACDT":10.5,
    "AEST":10,
    "AEDT":11,
    "NZST":12,"IDLE":12,
    "NZDT":13
  },
  
  // returns an offset in hours
  get_local_offset:function()
  {
    var D=new Date();
    return -D.getTimezoneOffset()/60;
  },
  
  // tz is a timezone of the form +/-xxxx or DST, CET, GMT, etc
  // returns an offset in hours
  get_tz_offset:function(tz)
  {
    // Is it +xxxx or -xxxx?
    /*
	Note: tightened from /^([+-])([0-9]{2})([0-9]{2})$/
	to /^([+-])(0[0-9]|1[0-2])([03]0)$/
	because we want to reduce false positives on innocent
	ranges such as "1000-1024".
	We can afford doing that because there are no legitimate
	timezones fractioned below half hours.
    */
    var re = /^([+-])(0[0-9]|1[0-2])([03]0)$/;
    var ree=re.exec(tz);
    if (ree && ree[0]) {
      var sgn=new Number(ree[1]+'1');
      if (ree[2].substr(0,0)=='0') {
        ree[2]=ree[2].substr(1);
      }
      var h=new Number(ree[2]);
      var m=new Number(ree[3]);
      return sgn*(h+m/60);
    }
    
    if (tz in this.timezones) {
      return this.timezones[tz];
    }
    return undefined;
  },

  validate_hour:function(hour)
  {
    if (hour===undefined || hour==='' || hour>23) {
      return false;
    }
    return true;
  },

  validate_minute:function(minutes)
  {
    if (minutes===undefined || minutes==='' || minutes>59) {
      return false;
    }
    return true;
  },

  init:function()
  {
    var tzLegit=new Array();
    var tzTmp;
    for(tzTmp in MCE.tzUtil.timezones) {
      tzLegit.push(tzTmp);
    }
    MCE.tzUtil.tzLegitRegexp=tzLegit.join('|');
  }

};

MCE.tzUtil.init();

}
