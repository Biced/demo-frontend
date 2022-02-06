/* If we have form parameters (like login id), then we avoid resubmission during refresh */
if ( window.history.replaceState ) {
    window.history.replaceState( null, null, window.location.href );
}

function addSolidityFile() {
 	var div_external = document.createElement("div");
 	div_external.setAttribute("class", "form-group")

    var file = document.createElement("input");
    file.setAttribute("type", "file");
    file.setAttribute("name", "more_solidity_files");
    file.setAttribute("class", "form-control-file");
 	div_external.appendChild(file);
 	document.getElementById("solidity_uploads").appendChild(div_external);
}

var countAny = 0;

function addBrowse(isForDirectory) {

    /* divComplete includes browse control, folder/file icon and remove browse button */
    var divComplete = document.createElement("div");
    divComplete.setAttribute("class", "form-group");
    divComplete.setAttribute("style", "display: flex; align-items: center");

    var icon = document.createElement("div");
    var iconClass;
    if (isForDirectory) {
        iconClass = "fas fa-folder-open";
    } else {
        iconClass = "fas fa-file";
    }
    icon.setAttribute("class", iconClass);
    icon.setAttribute("style", "font-size: 1.5em; margin-right: 0.4em; margin-left: 0.4em");

    divComplete.appendChild(icon);

    /* Div browse wrap the input control and its label as silbings */
    var divBrowse = document.createElement("div");
    divBrowse.setAttribute("class", "custom-file");
    divBrowse.setAttribute("style", "flex-grow: 1");

    var file = document.createElement("input");
    file.setAttribute("type", "file");
    file.setAttribute("name", "any_files");
    var id = "any_browse" + countAny.toString();
    countAny++;
    file.setAttribute("id", id);
    file.setAttribute("class", "custom-file-input");
    if (isForDirectory) {
        file.setAttribute("webkitdirectory", "");
    }
    divBrowse.appendChild(file);

    var label = document.createElement("label");
    label.setAttribute("class", "custom-file-label");
    label.setAttribute("for", id);
    var text;
    if (isForDirectory) {
        text = "Upload a folder";
    } else {
        text = "Upload a file";
    }
    $(label).html(text);
    divBrowse.appendChild(label);

    divComplete.appendChild(divBrowse);


    var removeIcon = document.createElement("div");
    removeIcon.setAttribute("class", "fas fa-times");
    removeIcon.setAttribute("style", "font-size: 1.5em; margin-right: 0.4em; margin-left: 0.4em; cursor:pointer");
    divComplete.appendChild(removeIcon);

    document.getElementById("any_uploads").appendChild(divComplete);

    var changeHandler;
    if (isForDirectory) {
        changeHandler = updateDirName;
    } else {
        changeHandler = updateFileName;
    }
    $(file).on("change", changeHandler);
    $(removeIcon).click(removeBrowse);
}

function addAnyFile() {
    addBrowse(false);
}

function updateFileName(e) {
  var fileName = $(e.currentTarget).prop("files")[0].name;
  $(e.currentTarget).siblings(".custom-file-label").addClass("selected").html(fileName);
}

function updateDirName(e) {
  var files = $(e.currentTarget).prop("files");
  var fileName;
  if (files.length == 0) {
    fileName = "Empty folder";
  }  else {
    fileName = files[0].webkitRelativePath.split("/")[0];
  }
  $(e.currentTarget).siblings(".custom-file-label").addClass("selected").html(fileName);
}

function removeBrowse(e) {
    var removeIcon = $(e.currentTarget);
    removeIcon.parent().remove();
}


function addAnyDir() {
    addBrowse(true);
}

function updateEditorHeight(){
    if($(window).width() >= 768){
        let min_height = '30rem';
//        var sidebarHeight = $(".sidebar").prop("scrollHeight");
        $("#solidity_editor").height(min_height);
        $("#spec_editor").height(min_height);
    }
}

function randomHexNumber(length=10){
    // storing all letter and digit combinations
    // for html color code
    var letters = "0123456789abcdef";

    // html color code starts with #
    var number = '';

    // generating 6 times as HTML color code consist
    // of 6 letter or digits
    for (var i = 0; i < length; i++)
       number += letters[(Math.floor(Math.random() * 16))];

   return number;
}

$('.toast').toast({delay: 5000});
