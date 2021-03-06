define([ "require" ], function (require) {
	/**
	 * This main.js file conditionally executes different code depending upon the host environment it is loaded in.
	 * This is an increasingly common pattern when dealing with applications that run in different environments that
	 * require different functionality (i.e. client/server or desktop/tablet/phone).
	 */
require([ 
	"app/JobsModel",
	"app/JenkinsBoard",
	"dojo/text!app/config.json",
	"dojo/domReady!"
], function (
	JobsModel,
	JenkinsBoard,
	config
) {
	config = JSON.parse(config);
	
	var jobsModel = new JobsModel({"config": config}),
		jb = new JenkinsBoard({"model": jobsModel}).placeAt(document.body);

	jb.resize();

		//jb.startup();

	//jb.layout();
});
});