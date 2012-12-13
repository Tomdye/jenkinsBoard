/*globals JenkinsBoard */
var j = new JenkinsBoard({
    url : 'http://buildbot.complinet.local/hudson/view/All/',
    title : 'GRC STATUS BOARD',
    global : 'j', // corresponds to the assignment at the top - needed for JSONP
    ignores : ['etl-service-c4']
});
