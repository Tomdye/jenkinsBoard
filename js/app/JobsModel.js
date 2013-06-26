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

		tree: "jobs[name,color,lastBuild[result,culprits[fullName],actions[causes[shortDescription]],building,estimatedDuration,timestamp],lastSuccessfulBuild[timestamp]]",
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
			this.startTicker();

			return this._fetch().then(lang.hitch(this, function (response) {
				this.store.setData(response);
			}));
		},

		query: function (queryObj) {
			queryObj = queryObj || {};

			return this.store.query(queryObj);
		},

		_onTick: function () {
			this._fetch().then(lang.hitch(this, function (response) {
				arrayUtil.forEach(response, lang.hitch(this, function (item, index) {
					
					if (index === 3) {
						debugger;
						item.color = "PINK";
					}
					this.store.put(item);
				}));
			}));
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
					//depth: 3
				}
			}).then(lang.hitch(this, function (response) {
				debugger;
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
			var lastBuild = job.lastBuild;

			job.building = lastBuild.building;
			job.lastBuild.reviewer = this._findReviewer(lastBuild);
			job.timeSinceBuild = this._getTimeSinceBuild(lastBuild);
			job.timeSinceSuccessfulBuild = this._getTimeSinceBuild(job.lastSuccessfulBuild);

			if (job.building) {
				job.percentBuilt = this._getPercentBuilt(lastBuild, job.timeSinceBuild);
			} else {
				job.percentBuilt = 100;
			}
debugger;
			return job;
		},

		_findReviewer: function (build) {
			var reviewer = false;

			if (build.actions[0] &&
				build.actions[0].causes[0] &&
				build.actions[0].causes[0].shortDescription) {
				var desc = build.actions[0].causes[0].shortDescription;
					if (desc.match(this._causeMatchString)) {
						reviewer = desc.replace(this._causeMatchString, "");
					}
			}

			return reviewer;
		},

		_getPercentBuilt: function (build, timeSinceBuild) {
			return Math.floor(((timeSinceBuild / build.estimatedDuration) * 100));
		},

		_getTimeSinceBuild: function (build) {
			var timeNow = new Date().getTime();
			return timeNow - build.timestamp;
		},


		/*_findCulprits: function (builds) {
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
		},*/

		startTicker: function () {
			this._ticker = setInterval(lang.hitch(this, "_onTick"), this.config.interval);
		},

		stopTicker: function () {
			clearInterval(this._ticker);
		}
	});
});