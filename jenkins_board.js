/*globals document, console, XMLHttpRequest, setInterval, setTimeout*/
var JenkinsBoard = (function () {
    var undef, C,
        Detail, Total,
        $, handleTransitions;

    $ = function (id) {
        return document.getElementById(id);
    };

    handleTransitions = function (div) {
        var updateTransition = function () {
            if (this.className.indexOf('x_on') !== -1) {
                this.className = this.className.replace(/x_on/, '');
            }
            else {
                this.className = this.className + ' x_on';
            }
        };
    
        div.addEventListener('transitionend', updateTransition, true);
        div.addEventListener('webkitTransitionEnd', updateTransition, true);
    };


    Total = (function () {
        var undef, C,
            formatTime;

        formatTime = function (date) {
            var x = [date.getHours(), date.getMinutes(), date.getSeconds()],
                ii;
            
            for (ii = 0; ii < x.length; ii += 1) {
                if (x[ii] < 10) {
                    x[ii] = '0' + x[ii];
                }
            }

            x.pop(); // remove seconds

            return x.join(':');
        };

        C = function (config) {
            var div;

            this.title = config.title;
            this.id = 'jb_overall_status';

            handleTransitions($(this.id));
        };

        C.prototype.update = function (jobStatus) {
            var div = $(this.id);
            if (!div) {
                console.warn('could not find div to update general status');
                return;
            }
            div.innerHTML = this.title + ' - ' + formatTime(jobStatus.updatedAt);

            if (jobStatus.failed) {
                div.className = 'red';
            }
            else {
                div.className = 'blue';
            }
            if (jobStatus.building) {
                setTimeout(function () { 
                    div.className += ' anime'; 
                }, 1);
            }
        };

        return C;
    }());

    Detail = (function () {
        var C, undef;

        C = function (config) {
            var div;
            this.id = config.id;
            this.title = this.id.replace(/__/g, ' ');
            this.parentId = 'jb_detailed_status';
            
            div = document.createElement('div');
            div.id = this.id;
            $(this.parentId).appendChild(div);
            handleTransitions(div);
        };

        C.prototype.update = function (overallJobStatus) {
            var jobStatus = overallJobStatus.jobs[this.id],
                div = $(this.id);

            if (!div) {
                console.warn('could not find div to update general status');
                return;
            }
            if (!jobStatus) {
                console.warn('could not find my job status: ' + this.id);
                return;
            }

            div.innerHTML = "<h2>" + this.title + "</h2><ul><li>" + new Date(jobStatus.buildDate) 
            + "</li><li> culprit: " + jobStatus.buildCulprits + "</li></ul>";

            if (jobStatus.failed) {
                div.className = 'red';
            }
            else {
                div.className = 'blue';
            }
            if (jobStatus.building) {
                setTimeout(function () { 
                    div.className += ' anime'; 
                }, 1);
            }
        };

        C.prototype.cleanup = function () {
            var div = $(this.id);
            
            div.parentNode.removeChild(div);
        };
        
        return C;
    }());


    C = function (config) {
        this.url = config.url;
        this.title = config.title;
        this.global = config.global;
        this.ignores = config.ignores || [];

        this.init();
    };


    C.prototype.init = function () {
        this.total = new Total({title : this.title});
        this.details = {};

        var self = this;
        setInterval(function () { 
            self.getStatus();
        }, 15000);
        self.getStatus();
    };

    C.prototype.getStatus = function () {
        var node,
            xhr, url = this.url + 'api/json/', self;

        if (this.global) {
            node = $('jb_jsonp');

            if (node) {
                node.parentNode.removeChild(node);
            }

            node = document.createElement('script');
            node.id = 'jb_jsonp';
            node.src = url + '?tree=jobs[name,color,builds[timestamp,result,culprits[fullName]]]&jsonp=' + this.global + '.onStatusReceived' + '&' + (new Date()).getTime();
            document.body.appendChild(node);
        }
        else {
            xhr = new XMLHttpRequest();
            self = this;

            xhr.open('GET', url);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    self.onStatusReceived(JSON.parse(xhr.responseText));
                }
            };
            xhr.send();
        }
    };

    C.prototype.onStatusReceived = function (response) {
        var jobStatus,
            ii, job;

        jobStatus = {
            updatedAt : new Date(),
            building : false,
            failed : false,
            jobs : {}
        };

        

        for (ii = 0; ii < response.jobs.length; ii += 1) {
            job = response.jobs[ii];
            if (this.ignores.indexOf(job.name) !== -1) {
                continue;
            }
            if (/trigger/i.test(job.name) || /template/i.test(job.name)) {
                continue;
            }

            if (job.color !== "red" && job.color !== "red_anime" && job.color !== "blue_anime") {
                continue;
            }
            var compareDate = new Date();
            compareDate.setDate(compareDate.getDate() - 3);

            var lastBuildDate = new Date(job.builds[0].timestamp);
            
            if (lastBuildDate < compareDate) {
                continue;
            }

            jobStatus.jobs[job.name] = {
                updatedAt : jobStatus.updatedAt,
                building : false,
                failed : false
            };
            if (job.builds.length > 0) {
                jobStatus.jobs[job.name].buildDate = job.builds[0].timestamp;

                jobStatus.jobs[job.name].buildCulprits = job.builds[0].culprits[0] ? job.builds[0].culprits[0].fullName : "Chuck Norris";
                jobStatus.jobs[job.name].buildResult = job.builds[0].result;
            }

            switch (job.color) {
            case 'red':
            case 'aborted':
                jobStatus.failed = true;
                jobStatus.jobs[job.name].failed = true;
                break;
            case 'red_anime':
                jobStatus.failed = true;
                jobStatus.building = true;
                jobStatus.jobs[job.name].failed = true;
                jobStatus.jobs[job.name].building = true;
                break;
            case 'blue_anime':
                jobStatus.building = true;
                jobStatus.jobs[job.name].building = true;
                break;
            }
        }
        this.updateStatus(jobStatus);
    };

    C.prototype.updateStatus = function (jobStatus) {
        var ii;

        this.total.update(jobStatus);
        for (ii in jobStatus.jobs) {
            if (this.details[ii]) {
                this.details[ii].update(jobStatus);
            }
            else {
                this.details[ii] = new Detail({id : ii});
                this.details[ii].update(jobStatus);
            }
        }
        // Remove old details
        for (ii in this.details) {
            if (!jobStatus.jobs.hasOwnProperty(ii)) {
                this.details[ii].cleanup();
                delete this.details[ii];
            }
        }
    };
    
    return C;
}());
