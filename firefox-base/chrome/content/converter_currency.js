if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.currency={
	unambiguous_regexp:null,
	unambiguous_notation:null,

	timedRefreshRates: function()
	{
		MCE.currency.refreshRates();
		if (window==undefined)
			return;

		window.setTimeout(MCE.currency.timedRefreshRates, MCE.currency.iface.cacheExpiration);
	},

	refreshRates: function()
	{
		if (!MCE.prefs.getPref('pref_currency_enabled'))
			return;

		var myCurrency=MCE.prefs.getPref('pref_myCurrency');
		if (myCurrency && this.iface.cacheExpired(myCurrency)) {
			MCE.iface.log("Retrieving rates for primary currency ("+myCurrency+")");
			MCE.iface.retrieveURL(this.getRatesURL(myCurrency), "", this.onRetrieve);
		}

		var altCurrency = MCE.prefs.getPref('pref_foreignCurrency');
		if (altCurrency && this.iface.cacheExpired(altCurrency)) {
			MCE.iface.log("Retrieving rates for secondary currency ("+altCurrency+")");
			MCE.iface.retrieveURL(this.getRatesURL(altCurrency), "", this.onRetrieve);
		}
	},

	getRatesURL: function(curr)
	{
		return "http://xr.the-converter.co/rates/"+curr;
	},

	onRetrieve: function(event)
	{
		// "this" is whoever triggered the event,
		// and we want to go back to the home context.
		MCE.currency.finishRefreshingRates(event);
	},

	finishRefreshingRates: function(result)
	{
		if (!result.clean) {
			MCE.iface.log("Fatal exception thrown when retrieving exchange rates: "+result.exception);
			return;
		}
		if (result.status!=200) {
			MCE.iface.log("Bad request status while retrieving exchange rates ("+result.status+")");
			return;
		}
		var ratesData=JSON.parse(result.responseText);
		this.iface.saveCache(ratesData.base, ratesData.rates);
	},

	// Get rate from cache only; if that doesn't work,
	// the calling code must fail gracefully.
	getRate:function(from,to)
	{
		return this.iface.getCache(from,to);
	},

        init:function()
        {
		var uc1='';
		for(var i=0;i<this.unambiguous_currency_symbols.length;i++) {
			uc1+=this.unambiguous_currency_symbols[i].symbol;
		}
		this.unambiguous_regexp=MCE.core.regexpise(uc1);

		var ucn={
			notation:'',
			ISO:[]
		};
		for(var i=0;i<this.unambiguous_currency_notation.length;i++) {
			if (i>0) ucn.notation+='|';
			ucn.notation+='('+MCE.core.regexpise(this.unambiguous_currency_notation[i].notation)+')';
			ucn.ISO.push(this.unambiguous_currency_notation[i].ISO);
		}
		this.unambiguous_notation=ucn;

        },

	/*
	These are the currencies Google knows of as of 2009-04.
	2009-11: added RSD

	TODO: A process will be needed for updating this list.
	*/
	currencies:
	[
		'AED','ANG','ARS','AUD','BGN','BHD','BOB','BND','BRL','BWP','CAD','CHF',
		'CLP','CNY','COP','CSD','CRC','CZK','DKK','DOP','DZD','EEK','EGP','EUR',
		'FJD','GBP','HNL','HKD','HRK','HUF','IDR','ILS','INR','ISK','JMD','JOD',
		'JPY','KES','KRW','KWD','KYD','KZT','LBP','LKR','LTL','LVL','MAD','MDL',
		'MKD','MUR','MXN','MYR','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PEN',
		'PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','SAR','SCR','SEK','SGD',
		'SKK','SLL','SVC','THB','TND','TRY','TTD','TWD','TZS','UAH','UGX',
		'USD','UYU','UZS','VEB','VND','YER','ZAR','ZMK'
	],

	/*

	This is the list of unambiguous currency symbols.

	Notes:
	* ¥ is used for both the Japanese Yen (JPY) and the Chinese Yuan (CNY)
	* £ might be used for some Lira currencies according to Wikipedia, but
	  I doubt there's any significant ambiguity overall so I'll leave it here
	  for now.
	*/
	unambiguous_currency_symbols:
	[
		{
			symbol: '€',
			ISO: 'EUR'
		},
		{
			symbol: '£',
			ISO: 'GBP'
		},
		{
			symbol: '₤',
			ISO: 'GBP'
		},
		{
			symbol: '₪',
			ISO: 'ILS'
		},
		{
			symbol: '฿',
			ISO: 'THB'
		},
		{
			symbol: '₦',
			ISO: 'NGN'
		},
		{
			symbol: '₲',
			ISO: 'PYG'
		},
		{
			symbol: '₱',
			ISO: 'PHP'
		},
		{
			symbol: "円",
			ISO: 'JPY'
		},
		{
			symbol: "￥",
			ISO: 'JPY'
		}
	],

	unambiguous_currency_notation:
	[
		{
			notation: 'Kč',
			ISO: 'CZK'
		},
		{
			notation: 'lei',
			ISO: 'RON'
		},
		{
			notation: 'leu',
			ISO: 'RON'
		},
		{
			notation: 'Yen',
			ISO: 'JPY'
		},
		{
			notation: 'euro',
			ISO: 'EUR'
		},
		{
			notation: 'euros',
			ISO: 'EUR'
		},
		{
			notation: 'Sk',
			ISO: 'SKK'
		},
		{
			notation: "dollars",
			ISO: "$"
		},
		{
			notation: "dollar",
			ISO: "$"
		},
		{
			notation: "zł",
			ISO: "PLN"
		},
		{
			notation: "руб",
			ISO: 'RUB'
		}
	],

	/*
	This is the complete list of currencies from http://en.wikipedia.org/wiki/ISO_4217
	
	I didn't bother cleaning it up much because it's only used for labeling the
	preferences -- the Converter only uses MCE.currency.currencies on the business end.

	At the end there are a few extra currency names supported by Google
	but not listed in the ISO code.
	*/
	currency_names:
	{
		'AED': 'United Arab Emirates dirham',
		'AFN': 'Afghani',
		'ALL': 'Lek',
		'AMD': 'Armenian dram',
		'ANG': 'Netherlands Antillean guilder',
		'AOA': 'Kwanza',
		'ARS': 'Argentine peso',
		'AUD': 'Australian dollar',
		'AWG': 'Aruban guilder',
		'AZN': 'Azerbaijanian manat',
		'BAM': 'Convertible marks',
		'BBD': 'Barbados dollar',
		'BDT': 'Bangladeshi taka',
		'BGN': 'Bulgarian lev',
		'BHD': 'Bahraini dinar',
		'BIF': 'Burundian franc',
		'BMD': 'Bermudian dollar (customarily known as Bermuda dollar)',
		'BND': 'Brunei dollar',
		'BOB': 'Boliviano',
		'BOV': 'Bolivian Mvdol (funds code)',
		'BRL': 'Brazilian real',
		'BSD': 'Bahamian dollar',
		'BTN': 'Ngultrum',
		'BWP': 'Pula',
		'BYR': 'Belarussian ruble',
		'BZD': 'Belize dollar',
		'CAD': 'Canadian dollar',
		'CDF': 'Franc Congolais',
		'CHE': 'WIR euro (complementary currency)',
		'CHF': 'Swiss franc',
		'CHW': 'WIR franc (complementary currency)',
		'CLF': 'Unidad de Fomento (funds code)',
		'CLP': 'Chilean peso',
		'CNY': 'Renminbi',
		'COP': 'Colombian peso',
		'COU': 'Unidad de Valor Real',
		'CRC': 'Costa Rican colon',
		'CUP': 'Cuban peso',
		'CVE': 'Cape Verde escudo',
		'CZK': 'Czech Koruna',
		'DJF': 'Djibouti franc',
		'DKK': 'Danish krone',
		'DOP': 'Dominican peso',
		'DZD': 'Algerian dinar',
		'EEK': 'Kroon',
		'EGP': 'Egyptian pound',
		'ERN': 'Nakfa',
		'ETB': 'Ethiopian birr',
		'EUR': 'Euro',
		'FJD': 'Fiji dollar',
		'FKP': 'Falkland Islands pound',
		'GBP': 'Pound sterling',
		'GEL': 'Lari',
		'GHS': 'Cedi',
		'GIP': 'Gibraltar pound',
		'GMD': 'Dalasi',
		'GNF': 'Guinea franc',
		'GTQ': 'Quetzal',
		'GYD': 'Guyana dollar',
		'HKD': 'Hong Kong dollar',
		'HNL': 'Lempira',
		'HRK': 'Croatian kuna',
		'HTG': 'Haiti gourde',
		'HUF': 'Forint',
		'IDR': 'Rupiah',
		'ILS': 'Israeli new sheqel',
		'INR': 'Indian rupee',
		'IQD': 'Iraqi dinar',
		'IRR': 'Iranian rial',
		'ISK': 'Iceland krona',
		'JMD': 'Jamaican dollar',
		'JOD': 'Jordanian dinar',
		'JPY': 'Japanese yen',
		'KES': 'Kenyan shilling',
		'KGS': 'Som',
		'KHR': 'Riel',
		'KMF': 'Comoro franc',
		'KPW': 'North Korean won',
		'KRW': 'South Korean won',
		'KWD': 'Kuwaiti dinar',
		'KYD': 'Cayman Islands dollar',
		'KZT': 'Tenge',
		'LAK': 'Kip',
		'LBP': 'Lebanese pound',
		'LKR': 'Sri Lanka rupee',
		'LRD': 'Liberian dollar',
		'LSL': 'Lesotho loti',
		'LTL': 'Lithuanian litas',
		'LVL': 'Latvian lats',
		'LYD': 'Libyan dinar',
		'MAD': 'Moroccan dirham',
		'MDL': 'Moldovan leu',
		'MGA': 'Malagasy ariary',
		'MKD': 'Denar',
		'MMK': 'Kyat',
		'MNT': 'Tugrik',
		'MOP': 'Pataca',
		'MRO': 'Ouguiya',
		'MUR': 'Mauritius rupee',
		'MVR': 'Rufiyaa',
		'MWK': 'Kwacha',
		'MXN': 'Mexican peso',
		'MXV': 'Mexican Unidad de Inversion (UDI) (funds code)',
		'MYR': 'Malaysian ringgit',
		'MZN': 'Metical',
		'NAD': 'Namibian dollar',
		'NGN': 'Naira',
		'NIO': 'Cordoba oro',
		'NOK': 'Norwegian krone',
		'NPR': 'Nepalese rupee',
		'NZD': 'New Zealand dollar',
		'OMR': 'Rial Omani',
		'PAB': 'Balboa',
		'PEN': 'Nuevo sol',
		'PGK': 'Kina',
		'PHP': 'Philippine peso',
		'PKR': 'Pakistan rupee',
		'PLN': 'Złoty',
		'PYG': 'Guarani',
		'QAR': 'Qatari rial',
		'RON': 'Romanian new leu',
		'RSD': 'Serbian dinar',
		'RUB': 'Russian rouble',
		'RWF': 'Rwanda franc',
		'SAR': 'Saudi riyal',
		'SBD': 'Solomon Islands dollar',
		'SCR': 'Seychelles rupee',
		'SDG': 'Sudanese pound',
		'SEK': 'Swedish krona',
		'SGD': 'Singapore dollar',
		'SHP': 'Saint Helena pound',
		'SLL': 'Leone',
		'SOS': 'Somali shilling',
		'SRD': 'Surinam dollar',
		'STD': 'Dobra',
		'SYP': 'Syrian pound',
		'SZL': 'Lilangeni',
		'THB': 'Baht',
		'TJS': 'Somoni',
		'TMT': 'Manat',
		'TND': 'Tunisian dinar',
		'TOP': 'Pa\'anga',
		'TRY': 'Turkish lira',
		'TTD': 'Trinidad and Tobago dollar',
		'TWD': 'New Taiwan dollar',
		'TZS': 'Tanzanian shilling',
		'UAH': 'Hryvnia',
		'UGX': 'Uganda shilling',
		'USD': 'US dollar',
		'USN': 'United States dollar (next day) (funds code)',
		'USS': 'United States dollar (same day) (funds code) (one source claims it is no longer used, but it is still on the ISO 4217-MA list)',
		'UYU': 'Peso Uruguayo',
		'UZS': 'Uzbekistan som',
		'VEF': 'Venezuelan bolívar fuerte',
		'VND': 'Vietnamese đồng',
		'VUV': 'Vatu',
		'WST': 'Samoan tala',
		'XAF': 'CFA franc BEAC',
		'XAG': 'Silver (one troy ounce)',
		'XAU': 'Gold (one troy ounce)',
		'XBA': 'European Composite Unit (EURCO) (bond market unit)',
		'XBB': 'European Monetary Unit (E.M.U.-6) (bond market unit)',
		'XBC': 'European Unit of Account 9 (E.U.A.-9) (bond market unit)',
		'XBD': 'European Unit of Account 17 (E.U.A.-17) (bond market unit)',
		'XCD': 'East Caribbean dollar',
		'XDR': 'Special Drawing Rights',
		'XFU': 'UIC franc (special settlement currency)',
		'XOF': 'CFA Franc BCEAO',
		'XPD': 'Palladium (one troy ounce)',
		'XPF': 'CFP franc',
		'XPT': 'Platinum (one troy ounce)',
		'XTS': 'Code reserved for testing purposes',
		'XXX': 'No currency',
		'YER': 'Yemeni rial',
		'ZAR': 'South African rand',
		'ZMK': 'Kwacha',
		'ZWL': 'Zimbabwe dollar',
		'CSD': 'Serbian dinar',
		'SKK': 'Slovak koruna',
		'SVC': 'Salvadoran colon',
		'VEB': 'Venezuelan bolivar'
	},

	TLD_currency:
	{
		'com':	'USD',
		'au':	'AUD',
		'ca':	'CAD',
		'nz':	'NZD',
		'bn':	'BND',
		'fj':	'FJD',
		'hk':	'HKD',
		'jm':	'JMD',
		'ky':	'KYD',
		'na':	'NAD',
		'sg':	'SGD',
		'tt':	'TTD',
		'tw':	'TWD'
	},

	// These then get a "$" sign appended
	dollar_aliases:
	{
		'US':	'USD',
		'AU':	'AUD',
		'CA':	'CAD',
		'NZ':	'NZD',
		'BN':	'BND',
		'FJ':	'FJD',
		'HK':	'HKD',
		'JM':	'JMD',
		'KY':	'KYD',
		'NA':	'NAD',
		'SG':	'SGD',
		'TT':	'TTD',
		'TW':	'TWD'
	}

};

MCE.currency.init();

}
