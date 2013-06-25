define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/text!./resources/JobView.html"
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	template
) {
	return declare("app.JobView", [_WidgetBase, _TemplatedMixin], {
		templateString: template,

		data: null
	});
});