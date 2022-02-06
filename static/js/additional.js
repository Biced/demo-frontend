    let lastDate = new Date();
    lastDate.setUTCHours(0,0,0,0);
    updatePeriod();
    var $table = $('.table');

    /**
     * Get duration
     *
     * @param {String} start - start date and time in ISO format.
     * @param {String} end - finish date and time in ISO format.
     * @return {String}      elapsed time between two dates (format - {}d {}h {}m {}s).
     */
    function getDuration(start, end = new Date().toISOString()){
        var date_end = Date.parse(end);
        var date_start = Date.parse(start);

        // get total seconds between the times
        var delta = Math.abs(date_end - date_start) / 1000;

        // calculate (and subtract) whole days
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;

        // calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;

        // calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;

        // what's left is seconds
        var seconds = Math.floor(delta); // delta % 60;

        var duration = "";

        if (days > 0)
            duration += days + "d ";
        if (hours > 0)
            duration += hours + "h ";
        duration += minutes + "m " + seconds + "s";

        return duration;
    }

    /**
     * Format 'started' cell
     *
     * @param {DOM element} value - cell inner html.
     * @param {Object} row - table row (data-fields used as Object keys).
     * @param {Number} index - row index (starts from 0)
     * @return {String}      cell inner html (or txt)
     */
    function startFormatter(value, row, index) {
        //console.log(value);
        if (value){
            value = value.endsWith("Z") ? value : value + 'Z';  /* For UTC time */
            var started_ago = getDuration(value);
            var tm_stamp = Date.parse(value);
            var d = new Date(tm_stamp);
            return '<span class="d-inline-block" data-toggle="tooltip" title="' + d.toString() + '">' +
                   started_ago + " ago" + '</span>';
        }
        return "";
    }

    /**
     * Format 'duration' cell
     *
     * @param {DOM element} value - cell inner html.
     * @param {Object} row - table row (data-fields used as Object keys).
     * @param {Number} index - row index (starts from 0)
     * @return {String}      cell inner html (or txt)
     */
    function durationFormatter(value, row, index) {
        // console.log(value);
        // expected cell format - {start}_{finish}
        var dates = value.split("_");
        var start = dates[0];
        var finish = dates[1];
        if (start && finish && finish != "null" && finish != "undefined"){
            /* For UTC time */
            start = start.endsWith("Z") ? start : start + 'Z';
            finish = finish.endsWith("Z") ? finish : finish + 'Z';

            var duration = getDuration(start, finish);
            var start_tm_stamp = Date.parse(start);
            var d_start = new Date(start_tm_stamp);
            var finish_tm_stamp = Date.parse(finish);
            var d_finish = new Date(finish_tm_stamp);
            return '<span class="d-inline-block" data-toggle="tooltip" title="' +
                   d_start.toString() + ' to '+ d_finish.toString() + '">' +
                   duration +'</span>';
        }
        return "";
    }

    /**
     * Format 'Actions' cell
     *
     * @param {DOM element} value - cell inner html.
     * @param {Object} row - table row (data-fields used as Object keys).
     * @param {Number} index - row index (starts from 0)
     * @return {String}      cell inner html (or txt)
     */
    function actionsFormatter(value, row, index) {
        let cancelBtn = '';
        cancelBtn = '<a href="javascript:void(0)" title="Cancel" class="cancel btn';
        if (row.jobStatus == "SUCCEEDED" || row.jobStatus == "FAILED"){
            cancelBtn += ' disabled" tabindex="-1';
        }
        cancelBtn += '"><i class="far fa-times-circle"></i></a>';

        return cancelBtn + value;
    }

    /**
     * Launch cancel (job) modal
     *
     * @param {Boolean} success - true for success modal.
     * @param {String} error_msg - error message to be presented.
     */
    function triggerCancelModal(success = true, error_msg = ''){
        let remove_cls = '';
        let add_cls = '';
        let modal_content = '';
        if (success){
            remove_cls = 'bg-danger';
            add_cls = 'bg-success';
            modal_content = "<p>The job was cancelled successfully.</p>" +
                            "<p>Please notice that the job Status will be set to FAILED.</p>";
        } else {
            remove_cls = 'bg-success';
            add_cls = 'bg-danger';
            modal_content = "<p>Couldn't cancel the job.</p>" +
                            (error_msg ? '<p>' + error_msg + '</p>' : '');
        }
        $('#cancelModal .modal-header').removeClass(remove_cls).addClass(add_cls);
        $('#cancelModal .modal-body').html(modal_content);
        $('#cancelModal').modal('show');
    }

    /**
    * global Object container - used for assigning event listeners to the 'Actions' cell icons
    */
    window.operateEvents = {
        'click .cancel': function (e, value, row, index) {
            const jobStatus = row.jobStatus;
            if (jobStatus != "SUCCEEDED" && jobStatus != "FAILED"){
                var cell_content = row.id;
                // console.log(cell_content);
                // cell_content can include a few html tags
                var div = document.createElement("div");
                div.innerHTML = cell_content;
                // get cell link (a) element */
                var a_tag = div.getElementsByTagName("a").length > 0 ? div.getElementsByTagName("a")[0] : null;
                var id = a_tag != null ? (a_tag.innerText || a_tag.textContent || "") : "";
                if (id == ""){
                    let error_msg = "Error occurred. Couldn't retrieve job id";
                    console.log(error_msg);
                    triggerCancelModal(false, error_msg);
                } else {
                    $.ajax( "/cancel/" + id).fail(function(d) {
                        console.log(d);
                        let error_msg = d.responseJSON.message;
                        console.log(error_msg);
                        triggerCancelModal(false, error_msg);
                    }).done(function(d) {
                        console.log(d);
                        if (d.success){
                            $table.bootstrapTable('updateCell', {
                                index: index,
                                field: 'jobStatus',
                                value: 'FAILED'
                            });
                            triggerCancelModal();
                        } else {
                            let error_msg = d.errorString;
                            if (error_msg.includes("(")){
                                // less is more
                                error_msg = error_msg.split("(")[0];
                            }
                            triggerCancelModal(false, error_msg);
                        }
                    });
                }
            }
            /*alert('You click cancel action, row: ' + JSON.stringify(row))*/
        },
        'click .ask': function (e, value, row, index) {
            console.log(index);
        }
    }

    $('#prev').click(function(e){
        e.preventDefault();
        $(this).addClass("disabled");
        $(this).attr({
          "aria-disabled": "true",
          tabindex: "-1"
        });
        $table.bootstrapTable('showLoading');
        let prevDate = $('#period span').text();
        if (!prevDate)
            prevDate = lastDate.toISOString().slice(0,10);

        $.ajax( "/previousResults?end=" + prevDate).fail(function(d) {
            console.log(d);
            let error_msg = d.responseJSON.message;
            console.log(error_msg);
            $('#errorModal .modal-body').html(error_msg);
            $('#errorModal').modal('show');
        }).done(function(d) {
            console.log(d);
            if (d.success){
                let userJobs = d.userJobsList;
                let data = [];

                if (userJobs){
                    userJobs.forEach(function (job, index) {
                        let id_cell_content = '<a target="_blank" class="job" id="'+ job.jobId + '" href="' +
                            job.outputUrl + '?anonymousKey=' + job.anonymousKey +'">'+
                            job.jobId + '</a>';
                        if (job.notifyMsg)
                            id_cell_content += '<p>' + job.notifyMsg + '</p>';
                        let operate_cell_content = '<a class="insights btn" href="';
                            if (job.outputUrl.endsWith("html")){
                                operate_cell_content += job.outputUrl.replace('FinalResults.html','');
                            } else {
                                operate_cell_content += job.outputUrl;
                            }

                            operate_cell_content += 'Results.txt?anonymousKey=' + job.anonymousKey + '" title="Insights" target="_blank">' +
                                                    '<i class="fas fa-clipboard-list"></i></a>' +
                                                    '<a class="btn" href="' + job.outputUrl.replace('FinalResults.html','').replace('/output/', '/jobStatus/') +
                                                    '?anonymousKey=' + job.anonymousKey + '" title="Status Page"><i class="fas fa-info-circle"></i></a>' +
                                                    '<a class="ask btn" href="mailto:ea@certora.com?subject=Question on job ' + job.jobId + '" title="Ask Certora">' +
                                                    '<i class="fas fa-question"></i></a>';
                        data.push({
                            id:  id_cell_content,
                            jobStatus: job.jobStatus,
                            started: job.postTime,
                            dur: job.postTime + '_' + job.finishTime,
                            operate:operate_cell_content
                        });
                    });

                    console.log(data);

                    $table.bootstrapTable('append', data);

                    let missing = d.missingOutput;
                    console.log(missing);
                    missing.forEach(function (item, index) {
                        $('#'+item).addClass('disabled').attr('tabindex', -1);
                    });
                } else {
                    console.log("userJobs is null or empty");
                }
                // update to one day ago
                lastDate.setDate(lastDate.getDate() - 1);
                updatePeriod();
            } else {
                let error_msg = d.errorString;
                console.log(error_msg);
                $('#errorModal .modal-body').html(error_msg);
                $('#errorModal').modal('show');
            }
        }).always(function(){
            $('#prev').removeClass("disabled");
            $('#prev').removeAttr("aria-disabled tabindex");
            $table.bootstrapTable('hideLoading');
        });
    });

    $('#refreshButton').click(function (e) {
        e.preventDefault();
        $(this).addClass("disabled");
        //$('.table thead th').on('click.specnamespace', function() { return false; });
        $table.bootstrapTable('showLoading');

        $.ajax( "/previousResults").fail(function(d) {
            console.log(d);
            let error_msg = d.responseJSON.message;
            console.log(error_msg);
            $('#errorModal .modal-body').html(error_msg);
            $('#errorModal').modal('show');
        }).done(function(d) {
            console.log(d);
            if (d.success){
                let userJobs = d.userJobsList;
                let data = [];

                if (userJobs){
                    userJobs.forEach(function (job, index) {
                        let id_cell_content = '<a target="_blank" class="job" id="'+ job.jobId + '" href="' +
                            job.outputUrl + '?anonymousKey=' + job.anonymousKey +'">'+
                            job.jobId + '</a>';
                        if (job.notifyMsg)
                            id_cell_content += '<p>' + job.notifyMsg + '</p>';
                        let operate_cell_content = '<a class="insights btn" href="';
                            if (job.outputUrl.endsWith("html")){
                                operate_cell_content += job.outputUrl.replace('FinalResults.html','');
                            } else {
                                operate_cell_content += job.outputUrl;
                            }

                            operate_cell_content += 'Results.txt?anonymousKey=' + job.anonymousKey + '" title="Insights" target="_blank">' +
                                                    '<i class="fas fa-clipboard-list"></i></a>' +
                                                    '<a class="btn" href="' + job.outputUrl.replace('FinalResults.html','').replace('/output/', '/jobStatus/') +
                                                    '?anonymousKey=' + job.anonymousKey + '" title="Status Page"><i class="fas fa-info-circle"></i></a>' +
                                                    '<a class="ask btn" href="mailto:ea@certora.com?subject=Question on job ' + job.jobId + '" title="Ask Certora">' +
                                                    '<i class="fas fa-question"></i></a>';
                        data.push({
                            id:  id_cell_content,
                            jobStatus: job.jobStatus,
                            started: job.postTime,
                            dur: job.postTime + '_' + job.finishTime,
                            operate:operate_cell_content
                        });
                    });

                    console.log(data);

                    $table.bootstrapTable('load', data);

                    let missing = d.missingOutput;
                    console.log(missing);
                    missing.forEach(function (item, index) {
                        $('#'+item).addClass('disabled').attr('tabindex', -1);
                    });
                } else {
                    console.log("userJobs is null or empty");
                }
            } else {
                let error_msg = d.errorString;
                console.log(error_msg);
                $('#errorModal .modal-body').html(error_msg);
                $('#errorModal').modal('show');
            }
            lastDate = new Date();
            lastDate.setUTCHours(0,0,0,0);
            updatePeriod();
        }).always(function(){
            $('#refreshButton').removeClass("disabled");
            $table.bootstrapTable('hideLoading');
        });
        // update started ago cells in all the other rows
        /*for  (let k = 0; k < rows.length; k++){
            if (!indices.includes(k)) { // update all the rows which jobStatus is FAILED || SUCCEEDED
                let started = rows[k].started;
                console.log(rows[k]);
                if (started){
                    let iso_date = stringToIso(started);
                    $table.bootstrapTable('updateCell', {
                        index: k,
                        field: 'started',
                        value: iso_date
                    });
                }
            }
        }*/
    });

    function stringToIso(str_date){
        if (str_date.endsWith("Z"))
            return str_date;
        return str_date + "Z";
    }

    function updatePeriod(){
        $('#period span').text(lastDate.toISOString().slice(0,10));
        $('#period span').prop('title', lastDate.toUTCString());
    }
