define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dojo/request/script",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/store/Memory",
	"dojo/Evented",
	"dojo/request",
	"dojo/store/Observable",
	"dojo/Deferred",
	"dijit/layout/BorderContainer"
], function (
	declare,
	_WidgetBase,
	script,
	on,
	lang,
	arrayUtil,
	Memory,
	Evented,
	request,
	Observable,
	Deferred
) {
	return declare("app.JobsModel", [_WidgetBase, Evented], {

		tree: "jobs[name,color,builds[actions[causes[shortDescription]],timestamp,result,culprits[fullName]]]",
		suffix: "api/json",
		jsonpCallback: "jobsModelJsonpCallback",

		store : null,

		config: null,

		url: "",

		_ticker: null,

		_causeMatchString: "Started by GitHub push by ",

		constructor: function (args) {
			//lang.mixin(this, args);
			//this.config = JSON.parse(config);
			this.store = new Observable(new Memory({
				"idProperty": "name"
			}));
		},

		destroy: function () {
			//delete window[this.jsonpCallback];
			this.inherited(arguments);
		},

		start: function () {
			return this._fetch().then(lang.hitch(this, function (response) {
				this.store.setData(response);
			}));
		},

		query: function (queryObj) {
			queryObj = queryObj || {};

			return this.store.query(queryObj);
		},

		_fetch: function () {
			if (!this.config) {
				console.error("No URL has been set");
				return false;
			}

			//setup a jsonpCallbackFunc
			//because this jsonp is a bitch
			//for some reason!
			//window[this.jsonpCallback] = lang.hitch(this, "_fetchResponse", def);

			return request.get(this.config.jenkinsUrl + this.suffix, {
				handleAs: "json",
				preventCache: true,
				query: {
					tree: this.tree
				}
			}).then(lang.hitch(this, function (response) {
				//debugger;
				//self.emit("fetchResponse", response.jobs);
				return this._marshallResponse(response.jobs);
			}));

			/*script.get(this.url + this.suffix, {
				query: {
					tree: this.tree,
					time: (new Date()).getTime()
				}
			});*/
		},

		_marshallResponse: function (data) {
			return arrayUtil.map(data, lang.hitch(this, "_marshallJob"));
		},

		_marshallJob: function (job) {
			var obj = {
				"name": job.name,
				"color": job.color
			};

			obj.culprits = this._findCulprits(job.builds);

			return obj;
		},

		_findCulprits: function (builds) {
			var obj = {};

			if (builds.length > 0) {
				obj.culprits = arrayUtil.map(builds[0].culprits, function (culprit) {
					return culprit.fullName;
				});
				obj.label = builds[0].result === "SUCCESS" ? "Developers" : "Cowboys";

				if (builds[0].actions[0] &&
					builds[0].actions[0].causes[0] &&
					builds[0].actions[0].causes[0].shortDescription) {
					var desc = builds[0].actions[0].causes[0].shortDescription;
					if (desc.match(this._causeMatchString)) {
						obj.reviewer = desc.replace(this._causeMatchString, "");
					}
				}
			}

			return obj;
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