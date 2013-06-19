define([
	"dojo/_base/declare",
	"dijit/_Widget",
	"dojo/request/script",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/store/Memory",
	"dojo/Evented",
	"dojo/request",
	//"dojo/store/Observable",
	"dojo/Deferred"
], function (
	declare,
	_Widget,
	script,
	on,
	lang,
	Memory,
	Evented,
	request,
	//Observable,
	Deferred
) {
	return declare("app.JobsModel", [_Widget, Evented], {

		tree: "jobs[name,color,builds[timestamp,result,culprits[fullName]]]",
		suffix: "api/json",
		jsonpCallback: "jobsModelJsonpCallback",

		store : null,

		url: "",

		_ticker: null,

		constructor: function (args) {
			lang.mixin(this, args);
		},

		destroy: function () {
			delete window[this.jsonpCallback];
			this.inherited(arguments);
		},

		fetch: function () {
			if (!this.url) {
				console.error("No URL has been set");
				return false;
			}

			var self = this;

			//setup a jsonpCallbackFunc
			//because this jsonp is a bitch
			//for some reason!
			//window[this.jsonpCallback] = lang.hitch(this, "_fetchResponse", def);

			request.get(this.url + this.suffix, {
				handleAs: "json",
				preventCache: true,
				query: {
					tree: this.tree
				}
			}).then(function (response) {
				self.emit("fetchResponse", response.jobs);
			});

			/*script.get(this.url + this.suffix, {
				query: {
					tree: this.tree,
					time: (new Date()).getTime()
				}
			});*/
		},

		startTicker: function (interval) {
			var self = this;
			this._ticker = setInterval(lang.hitch(this, "fetch"), interval);
		},

		stopTicker: function () {
			clearInterval(this._ticker);
		}
	});
});