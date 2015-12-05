// $Id: converter_async.js,v 1.1 2015/02/10 19:31:31 bogdan Exp $

if (MCE!=undefined && MCE.applicationName=='Converter' && !MCE.finishedLoading) {
MCE.async = function(props) {
	this.url = props.url;
	this.key = props.key;
	this.onFinish = props.eventHandler;

	this.onSuccess = function(handler) {
		var result = {
			'clean': true,
			'status': handler.status,
			'responseText': handler.responseText
		};
		this.onFinish(result);
	};

	this.onFailure = function(handler) {
		var result = {
			'clean': false,
			'status': handler.status,
			'statusText': handler.statusText
		};
		this.onFinish(result);
	};

	this.execute = function() {
		handler = new XMLHttpRequest();
		handler.open("POST", this.url, true);
		var params = "key="+encodeURIComponent(this.key)+"&ver="+MCE.applicationVersion;
		handler.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		handler.setRequestHeader("Content-length", params.length);
		handler.setRequestHeader("Connection", "close");
		self = this;
		handler.addEventListener("load", function(e) { self.onSuccess(handler); delete self; });
		handler.addEventListener("error", function(e) { self.onFailure(handler); delete self; });
		handler.send(params);
	};
}
}
