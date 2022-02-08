/**
 * detect IEEdge
 * returns version of IE/Edge or false, if browser is not a Microsoft browser
 */
function detectIEEdge() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    /*var edge = ua.indexOf('Edge/');
    if (edge > 0) {
       // Edge => return version number
       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }*/

    // other browser
    return false;
}

// added for handling IE browser use (or any other error occurred when rendering the DOM)
function checkBrowser() {
    var containing_div = $("#wrapper");
    if (detectIEEdge()){
        var p = document.createElement("p");
        p.setAttribute('style', 'white-space: pre;');
        p.innerHTML = "IE is not supported. Please, try on different browser.\r\n";
        p.innerHTML += "If you encounter any difficulties, feel free to contact <a href='https://www.certora.com'>Certora</a>.";
        p.className = "text-center text-info";
        containing_div.children().not( "h2" ).remove();
    containing_div.append(p);
    }
}
checkBrowser();


function validate_ip(ip){
    // Regex expression for validating IPv4
    let pattern = "(([0-9]|[1-9][0-9]|1[0-9][0-9]|"+
                  "2[0-4][0-9]|25[0-5])\\.){3}"+
                  "([0-9]|[1-9][0-9]|1[0-9][0-9]|"+
                  "2[0-4][0-9]|25[0-5])";
    let regex = new RegExp(pattern);
    if (regex.test(ip)){
        return ip;
    }
    return "";
}

function validate_compiler(compiler){
    if( compiler === "-1")
        return "0.8.4"; // default compiler
    let pattern = "\\d+.\\d+.\\d+";
    let regex = new RegExp(pattern);
    if (regex.test(compiler)){
        return compiler;
    }
    return "";
}

function validate_contract_name(name){
    let pattern = /^[a-z\d_]+$/i;
    let regex = new RegExp(pattern);
    if (regex.test(name)){
        return name;
    }
    return "";
}

/********************************/
/******* Ace editor setUp *******/
/********************************/
function setupEditor(editorID, editorMode, theme) {
    editorID.setTheme("ace/theme/"+theme);
    editorID.session.setMode("ace/mode/"+editorMode);
    editorID.session.setUseWrapMode(true);
    editorID.setShowPrintMargin(false);
}
var solEditor = ace.edit("solidity_editor");
var specEditor = ace.edit("spec_editor");
var specUpdated = false;


setupEditor(solEditor, "solidity", "chrome");
solEditor.insert("// Pick any of the examples from the sidebar or start from scratch\n");
solEditor.insert("// pragma solidity ^0.8.4;\n// contract A {}\n")
setupEditor(specEditor, "spec", "specchrome");
specEditor.insert("// Pick any of the examples from the sidebar or start from scratch\n");
specEditor.insert("// myFirstRule{\n// \tassert false;\n// }");

specEditor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true
});

solEditor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});



/********************************/
/******** Verification **********/
/********************************/
var submittedFormData;
var activatedSol = "";
var activatedSpec = "";
var requestedSpec = null;
var confirmed = false;
var current_ip = "";

var editMessageModal = $('#editMessageModal');
var verifyMessageModal = $('#verifyMessageModal');
var verifyMessageModalContent = $('#verifyMessageModal .modal-content');
var verifyModalTitle = $('#verifyMessageModalLabel');
var verifyMessageText = $('#verifyMessageText');
var queryResultCycleMs = 1000;

var fileTypes = {
    SOL: 'sol',
    SPEC: 'spec'
}

var jobStatusMap = {}

function getIp(){
    $.getJSON("https://api.ipify.org?format=json", function(json) {
        current_ip = json.ip;
    }).fail(function() {
        console.log( "error" );
    });
}
getIp();

var clipboard = new ClipboardJS("#copySpec",{
  text: function() {
      return specEditor.getValue();
  }
});

clipboard.on('success', function(e) {
    console.log("copied to clipboard");
});

clipboard.on('error', function(e) {
    console.log("Could not copy to clipboard");
});


editMessageModal.on('hidden.bs.modal', function (e) {
  if(confirmed && requestedSpec != null){
    $('.examples[data-spec="'+requestedSpec+'"]').trigger("click");
  }
})

$("#discard").click(function (e) {
  e.preventDefault();
  confirmed = true;
  editMessageModal.modal('hide');
});

$("#copySpec").click(function (e) {
  if( ! confirmed){
    e.preventDefault();
    confirmed = true;
    $(this).trigger("click");
  }else{
    editMessageModal.modal('hide');
  }
});


$("#contract").change(function(){
    $(this).removeClass("invalid");
});

function getSolFile(sol_file_path, compiler_version, sol){
    return $.ajax({
       url: sol_file_path,
       data:{},
    //    headers: {"X-Test-Header": "test-value"},
       crossDomain: true,

       type: 'get'
   }).fail( function( xhr,status,error ){
       handleFileAccessError(xhr, status, error, sol, ext="sol")
   }).done( function(data, status, xhr){
       console.log("status", status, "xhr", xhr);
       silent = true;
       solEditor.setValue(data);
       silent = false;
       solEditor.clearSelection();
       $('#compiler').val(compiler_version);
       $('#contract').val(sol);
       $("#contract").removeClass("invalid");
   })
}

function getSpecFile(spec_file_path){
    return $.ajax({
        url: spec_file_path,
        data:{},
        type: 'get'
    }).fail( function( xhr,status,error ){
        handleFileAccessError(xhr, status, error, spec)
    }).done( function(data, status, xhr){
        console.log("status", status, "xhr", xhr);
        silent = true;
        specEditor.setValue(data);
        silent = false;
        specEditor.clearSelection();
        specUpdated = false;
        specEditor.session.on('change', function() {
            specUpdated = true;
            confirmed = false;
        });
    })
}

function handleFileAccessError(xhr, status, error, filename, ext="spec"){
    console.log("error occurred","status", status, "xhr", xhr, "err", error);
    if (xhr.status == 404){
        showErrorWarn("Couldn't locate " + filename + "." + ext + " file.", isWarn=false, title="File not found");
    }else{
        showErrorWarn(xhr.responseJSON.error, isWarn=false, title="An error occurred while retrieving the requested file");
    }
}

// add event listener to sol and spec files links
function setupOnClick(linkCls){
    $(linkCls).click(function(e) {
        e.preventDefault();
        var level = $(this).attr("data-level");
        var folder = $(this).attr("data-folder");
        var sol = $(this).attr("data-sol");
        var spec = $(this).attr("data-spec");
        var compiler_version = $(this).attr("data-compiler");

        // filepath: {level}/{folder}/{sol}.sol or {level}/{folder}/{spec}.spec
        var sol_file_path = file_path = "../static/" + level + "/" + folder + "/" + sol + ".sol";

        var spec_file_path = file_path = "../static/" + level + "/" + folder + "/" + spec + ".spec";
        requestedSpec = spec;
        // the spec file was updated
        if (specUpdated && !confirmed){
            editMessageModal.modal();
        }else{
            $.when(
                getSolFile(sol_file_path, compiler_version, sol),
                getSpecFile(spec_file_path)
            ).then(function() {
                // Both ajax requests have been resolved (or rejected)
                console.log("done");
            });
        }
    });
}
setupOnClick(".examples");



function showErrorWarn(msg, isWarn=false, title="Failed to send contract for verification"){
    if (isWarn){
        verifyModalTitle.text("Server is currently overloaded");
    }else{
        verifyModalTitle.text(title);
    }
    verifyMessageText.html( msg );
    verifyMessageModal.modal();
}

function arrayToPar(arr){
    var out = "";
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].startsWith("Checking") || arr[i].startsWith("Info from parser")){
            continue;
        }

        out += "<p>"+arr[i] +"</p>";
    }
    return out;
}

function getOutputLink(data){
    console.log("getOutputLink", data.fileURLs);
    var arrLength = data.fileURLs.length;
    var dataUrl = "";
    for (var i = 0; i < arrLength; i++) {
        if (data.fileURLs[i].endsWith("data.json")){
            dataUrl = data.fileURLs[i];
            $.get( dataUrl, function( jsonData ) {
               triggerReact(jsonData);
               $('#main_table').css("padding-top", "80px");
               $('#available_contract_table').css("padding-top", "80px"); // it's better to set style in a different way because this section can be empty
               $('#resultsContainer')[0].scrollIntoView();
            }).fail(function(s) {
               console.log( "error", s );
               showErrorWarn("Could not get data.json file.");
            });
            break;
        }
    }
    if (!dataUrl){
        console.log("data.json was not found.");
        if (data.stdErr.length > 0){ // get at most 8 error messages
            out = arrayToPar(data.stdErr.slice(0,8));
        }else{
            out = arrayToPar(data.stdOut.slice(2));
        }
        showErrorWarn(out);
    }
}


function prepareOutput( run ) {
     $.ajax({
        url: '/job/' + user + '/' + run,
        method: "GET",
        data: { },
        cache: false
     }).done(function (data){
        console.log("prepareOutput", data);
        if (data.finishTime != null){
            getOutputLink(data);
        }else{
            setTimeout(prepareOutput, queryResultCycleMs, run);
        }
     }).fail(function (jqXHR, textStatus) {
         
      console.log("There was an error", jqXHR, textStatus);
      showErrorWarn("Please, try again.");
     });
}

$('#run_btn').click(function(e) {
    e.preventDefault();
    currentSpec = specEditor.getValue();
    if (!activatedSol){
        showErrorWarn("Please choose solidity file from the sidebar.");
    }else if(!activatedSpec && currentSpec.length == 0){
        showErrorWarn("Please choose spec file from the sidebar or create a new one.");
    }else {
      $(this).addClass("disabled");
      $('.spin').spin('show');
      $('#spinWrapper').removeClass("d-none").addClass("d-flex");
      $('#spinWrapper').css("z-index","10");
      // Let's try to create a cvl file
      var blob = new Blob([currentSpec], {type : "application/octet-stream"});

      var specSizeInBytes = blob.size
      if (specSizeInBytes > 5*1024){
          showErrorWarn("Maximum allowed file length exceeded.");
      } else {
          var filename = "";
          if(activatedSpec){
             filename = $('a[href="'+activatedSpec+'"]').text();
          }else{
             solName = $('a[href="'+activatedSol+'"]').text();
             filename = solName.substring(0,solName.lastIndexOf("."))+".spec";
          }

          timestamp = Date.now();
          runName = filename.split(".")[0]+"_"+timestamp;//+"_"+seqNum
          submittedFormData = new FormData(); // create object containing all the form(#verify_form) data
          submittedFormData.append("runName", runName);
          submittedFormData.append("main_solidity_file",activatedSol);
          submittedFormData.append("cvl_file",blob, filename);
              $.ajax({
                url: 'https://demo.certora.com/demo/new/verify',
                type: "POST",
                data: submittedFormData,
                contentType: false,
                cache: false,
                processData:false
              }).done(function ( data, textStatus ){
                  console.log("runName", runName, "d:", data, textStatus);
                  if (data.success) {
                      if( data.jobCounter > 10 ){
                          showErrorWarn("Our server is busy right now. Please, try again later.", true);
                      }else{
                          splitNameIfCached = data.name.split("/");
                          if (splitNameIfCached.length > 1) {
                            prepareOutput(splitNameIfCached[1]);
                          } else {
                            showErrorWarn("Problem parsing output.")
                          }
                      }
                  } else {
                    showErrorWarn(data.errorString);
                  }
              }).fail(function (jqXHR, textStatus){
                console.log("ajax fail", textStatus);
                showErrorWarn(textStatus);
              });
      }
  }
});


// Set font size
$('#font_size').change(function(){
    let s = parseInt($(this).val());
    console.log(s);
    solEditor.setFontSize(s);
    specEditor.setFontSize(s);
});

function presentOutputLink(outputUrl){
    console.log("presentOutputLink", outputUrl);
    resultsCounter.href = outputUrl.replace("data.json", "")
    // $.get( outputUrl, function( jsonData ) {
    $.get( "https://arcane-mountain-01867.herokuapp.com/"+outputUrl, function( jsonData ) {
        console.log(jsonData);
       triggerReact(jsonData);
       $('#main_table').css("padding-top", "80px");
       $('#available_contract_table').css("padding-top", "80px"); // it's better to set style in a different way because this section can be empty
       $('#resultsContainer')[0].scrollIntoView();
    }).fail(function(s) {
       console.log( "error", s );
       showErrorWarn("Could not get data.json file.");
    });
}


function pingOutput(checkJobStatusUrl, outputUrl, anonymousKey, jobId, data) {
    let passedData = data;
         if(!data){
            passedData = { "attr": "jobStatus",
            "anonymousKey": anonymousKey}
         }
     $.ajax({

        // url: checkJobStatusUrl,
        url: "https://arcane-mountain-01867.herokuapp.com/"+checkJobStatusUrl,
        method: "GET",
        data: passedData,
        cache: false
     }).done(function (data){
        console.log("pingOutput", data);
        btnStatusUpdate();
        // present a new status on change
        if (jobId in jobStatusMap){
            if (jobStatusMap[jobId] != data.jobStatus){
                jobStatusMap[jobId] = data.jobStatus;
                $('#verification-toast .toast-body').text('Verification status was updated to '+ data.jobStatus);
                $('#verification-toast').toast('show');
            }
        }

        if (data.jobStatus == "FAILED" || data.jobStatus == "SUCCEEDED" || data.jobStatus == "ERROR" ||
            data.jobStatus == "LAMBDA_ERROR" || data.jobStatus == "NOT_FOUND"){
            let dataJsonUrl = outputUrl + "data.json?anonymousKey=" + anonymousKey;

            if(data.jobStatus == "FAILED"){
                console.log("testing failed")
            }
            presentOutputLink(dataJsonUrl);
            delete jobStatusMap[jobId];
        }else{
            if(data.jobStatus === "RUNNING"){
                let updatedBtn = 0
                
        // check how many rules are still running
        
        if(is_data_from_progress){
           
            let running_res = JSON.parse(data.verificationProgress)
            if(running_res.rules){
                running_res.rules.forEach(rule => {
                    if(rule.status !== "RUNNING")
                    updatedBtn++
                  });
                  console.log(running_res)
                  btnStatusUpdate(updatedBtn, running_res.rules.length)
            }


    }
                let progressStatusUrl = checkJobStatusUrl.replace("/jobData/", "/progress/")
                is_data_from_progress = true
                setTimeout(pingOutput, queryResultCycleMs, progressStatusUrl, outputUrl, anonymousKey, jobId ,{"anonymousKey": anonymousKey});
                return
            }
            setTimeout(pingOutput, queryResultCycleMs, checkJobStatusUrl, outputUrl, anonymousKey, jobId);
        }
     }).fail(function (jqXHR, textStatus) {
         
      console.log("There was an error", jqXHR, textStatus);
      showErrorWarn("Please, try again.");
     });
}

$('#save_btn').click(function(e) {
    // Get the solidity and the spec files
    // send them as blobs to the server
    e.preventDefault();
    console.log("clicked");
    let ip = validate_ip(current_ip);
    let current_example = "Bank";
    let contract_name = validate_contract_name($("#contract").val());
    if (!contract_name){
        showErrorWarn("Please, type the contract name");
        $("#contract").addClass("invalid");
        return;
    }
    let compiler = validate_compiler($("#compiler").val());
    $(this).addClass("disabled");
    $('#spinWrapper').removeClass("d-none").addClass("spin_bg");
    $('#spinWrapper').css("z-index","10");
    var formData = new FormData();
    var jobId = randomHexNumber();
    formData.append('ip', ip);
    formData.append('example', current_example);
    formData.append('solc', compiler);
    formData.append('contractName', contract_name);
    formData.append('jobId', jobId);
    jobStatusMap[jobId] = "";
    var currentSpec = specEditor.getValue();
    // Let's try to create a spec file
    var specBlob = new Blob([currentSpec], {type : "application/octet-stream"});
    var specSizeInBytes = specBlob.size
    if (specSizeInBytes > 5*1024){
        showErrorWarn("Maximum allowed file length exceeded.");
        return;
    } else {
        formData.append('specFile', specBlob, current_example + ".spec");
    }

    var currentSpec = solEditor.getValue();
    // Let's try to create solidity file
    var solBlob = new Blob([currentSpec], {type : "application/octet-stream"});
    var solSizeInBytes = solBlob.size
    if (solSizeInBytes > 5*1024){
        showErrorWarn("Maximum allowed file length exceeded.");
        return;
    } else {
        formData.append('solFile', solBlob, current_example + ".sol");
    }

    $.ajax({
        // url: 'https://demo.certora.com/save',
        url: 'https://arcane-mountain-01867.herokuapp.com/https://demo.certora.com/save',
        method: "POST",
        data: formData,
        cache: false,
        enctype: 'multipart/form-data',
        processData: false,
        contentType: false
     }).done(function (data){
        console.log("save", data);
        if (data.errorMessages){
            newErrorHandaling()
            // let errorsList = "<ul>";
            // for (var i=0; i< data.errorMessages.length; i++){
            //     if (data.errorMessages[i])
            //         errorsList += "<li>" + data.errorMessages[i] + "</li>";
            // }
            // errorsList += "</ul>";
            // showErrorWarn(errorsList);

        } else if (data.outputUrl && data.anonymousKey){
            console.log("The compilation completed");
            $('#compile-toast').toast('show');
            let checkJobStatusUrl = data.outputUrl.replace("/output/", "/jobData/");
            setTimeout(pingOutput, queryResultCycleMs, checkJobStatusUrl, data.outputUrl, data.anonymousKey, jobId);
        } else {
            showErrorWarn("Got unknown response... Please, contact Certora");
        }
     }).fail(function (jqXHR, textStatus) {
          console.log("There was an error", jqXHR, textStatus);
          if (jqXHR.responseJSON) {
            showErrorWarn(jqXHR.responseJSON.message)
          } else {
            showErrorWarn("Please, try again.");
          }
     });
});



// testing editor things
document.addEventListener('dblclick', ()=> solEditor.moveCursorToPosition({'row':"93","column":"0"}))
// let testing = document.querySelector(".ace_content")
// document.addEventListener('click', ()=> testing.mouseDown())

