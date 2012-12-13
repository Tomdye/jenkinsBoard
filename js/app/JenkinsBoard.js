define(["dojo/_base/declare", "dojo/request/script", "dojo/on", "dojo/_base/lang"], function (declare, script, on, lang) {
	return declare("app.JenkinsBoard", [], {
		
		tree: "jobs[name,color,builds[timestamp,result,culprits[fullName]]]",
		suffix: "api/json",
		jsonpCallback: "jenkinsBoardJsonpCallback",

		constructor: function () {
			//setup a jsonpCallbackFunc
			//because this jsonp is a bitch
			//for some reason!
			window[this.jsonpCallback] = lang.hitch(this, "_callback");
		},

		destroy: function () {
			delete window[this.jsonpCallback];
			this.inherited(arguments);
		},

		get: function (url) {			
			script.get(url + this.suffix, {
				query: {
					jsonp: this.jsonpCallback,
					tree: this.tree
				}
			});
		},

		_callback: function (response) {
			debugger;
		}
	});
});