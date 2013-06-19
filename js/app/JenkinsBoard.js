define([
	"dojo/_base/declare",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/_base/array",
	"dojo/dom-geometry",
	"dojo/_base/array",
	"dojo/dom",
	"dojo/text!./resources/JenkinsBoard.html"	
], function (
	declare,
	_Widget,
	_TemplatedMixin,
	lang,
	on,
	arrayUtils,
	domGeom,
	arrayUtil,
	dom,
	template
) {
	 function pluck(v) {
      var args = [].slice.call(arguments,1);
      return function(d) {
        return typeof(d[v]) === "function" ? d[v].apply(d,args) : d[v];
      }
    }

	return declare("app.JenkinsBoard", [_Widget, _TemplatedMixin], {
		templateString: template,
		model: null,
		daysThreshold: 5,
		jobWidth: 330,
		//_observer: null,
		
		_getWindowSize: function () {
			var list = dom.byId("list");
			return domGeom.getContentBox(list);
		},

		_setModelAttr: function (model) {
			this.model = model;

			on(window, "resize", function () {
				model.fetch();
			});

			on(model, "fetchResponse", lang.hitch(this, "_onFetchEvent"));

			model.fetch();

			model.startTicker(10000);
		},

		_render: function (items) {
			var size = this._getWindowSize();
			var numAccross = Math.floor(size.w / this.jobWidth);

			items = arrayUtils.filter(items, lang.hitch(this, function (job) {
				var compareDate = new Date();
				compareDate.setDate(compareDate.getDate() - this.daysThreshold);

				if (job.builds[0] && job.builds[0].timestamp) {
					var lastBuildDate = new Date(job.builds[0].timestamp);
					return lastBuildDate > compareDate;
				} else {
					return false;
				}
			}));

			items.sort(function (a,b) {
				if (a.color === "blue_anime" || a.color === "red_anime")
					return -1;
				else if (b.color === "blue_anime" || b.color === "red_anime")
					return 1;
				else if (a.color < b.color)
					return -1;
				else if(a.color > b.color)
					return 1;
				return 0;
			});

			var getDomContents = function (job) {
				var str = "";

					str += "<h1>" + job.name + "</h1>";
					str += "<h2>Colour: " + job.color + "</h2>";
					if (job.builds && job.builds.length > 0) {
						var build = job.builds[0];

						if (build.culprits && build.culprits.length > 0) {
							str += "<h3>Culprits</h3>";
							arrayUtil.forEach(build.culprits, function (culprit, index) {
								if (culprit.fullName) {
									str += "<div>" + (index + 1) + ": ";
									str += culprit.fullName;
									str += "</div>";
								}								
							});
						}
					}

					return str;
			};

			// Update…
			var p = d3.select("#list").selectAll("li")
				.data(items, pluck("name"))
				.html(getDomContents)
				.attr("class", function (job) {
					return (job.color === "blue_anime" || job.color === "red_anime") ? "job building" : "job";
				})
				.style("background", function (job) {
					return (job.color === "blue") ? "green" : "red";
				})
				.style("left", lang.hitch(this, function (job, index) {
					var i = index%numAccross;
					return (i * (this.jobWidth)) + "px";
				}))
				.style("top", lang.hitch(this, function (job, index) {
					var i = Math.floor(index / numAccross);
					return (i * this.jobWidth) + "px";
				}));

				p.enter().append("li")
				.html(getDomContents)
				.attr("class", function (job) {
					return (job.color === "blue_anime" || job.color === "red_anime") ? "job building" : "job";
				})
				.style("background", function (job) {
					return (job.color === "blue") ? "green" : "red";
				})
				.style("left", lang.hitch(this, function (job, index) {
					var i = index%numAccross;
					return (i * (this.jobWidth)) + "px";
				}))
				.style("top", lang.hitch(this, function (job, index) {
					var i = Math.floor(index / numAccross);
					return (i * this.jobWidth) + "px";
				}));
				
				p.exit().remove();
		},

		_onFetchEvent: function (response) {
			this._render(response);
		}
	});
});