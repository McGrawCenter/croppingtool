

var lastTarget = null;

/************************************
* manifest is contained in url string as 
* a query var. We need to extract it
************************************/

function getQueryVariable(urlstr) {
    if(urlstr.includes('?')) {
       var parts = urlstr.split('?');
       var vars = parts[1].split('&');
       for (var i = 0; i < vars.length; i++) {
           var pair = vars[i].split('=');
           if (decodeURIComponent(pair[0]) == 'manifest') {
               return decodeURIComponent(pair[1]);
           }
       }
    }
   
    return urlstr;
}




window.addEventListener("dragenter", function (e) {
    //document.querySelector("#dropzone").style.display = "block";
    e.preventDefault();
});


window.addEventListener("dragover", function (e) {
    //document.querySelector("#dropzone").style.display = "block";
    e.preventDefault();
});


window.addEventListener("dragleave", function (e) {
    //document.querySelector("#dropzone").style.display = "none";
    e.preventDefault();
});

window.addEventListener("drop", function (e) {

    e.preventDefault();
    //document.querySelector("#dropzone").style.display = "none";
    var d = e.dataTransfer;
    var url_str = getQueryVariable(d.getData("text"));
    jQuery("#url").val(url_str);
    load(url_str);
});

