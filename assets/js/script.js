	var CT = {
	    'manifests': [],
	    'metadata': [],
	    'selections': {},
	    'outputs': {},
	    'gallery': {},
	    'mode': 'full', // full or crop
	    'overlayOn': false,
	    'selectionMode': false,
	    'current': {
	        'manifest': '',
	        'thumbnail': '',
	        'canvas': '',
	        'service': '',
	        'version': 2,
	        'rotation': 0,
	        'region': "full",
	        'size': 'full'
	    }
	}




	function init() {


	    /*************************
	     * get the url vars
	     ***********************************/

	    function getURLValues() {

	        var search = window.location.search.replace(/^\?/, '').replace(/\+/g, ' ');
	        var values = {};

	        if (search.length) {
	            var part, parts = search.split('&');

	            for (var i = 0, iLen = parts.length; i < iLen; i++) {
	                part = parts[i].split('=');
	                values[part[0]] = window.decodeURIComponent(part[1]);
	            }
	        }
	        return values;
	    }

	    /**************************
	     * if there is a manifest url var, load it
	     *************************************************/
	    var vars = getURLValues();
	    if (typeof vars.manifest !== 'undefined') {
	        var url = vars.manifest;
	        jQuery("#url").val(url);
	        jQuery("#gallery").empty();
	        //current.manifest = url;
	        load(url);
	    }



	    /**************************
	     * tooltip
	     *************************************************/

	    tippy('#copy', {
	        trigger: "click",
	        content: "Copied",
	        onShow(instance) {
	            setTimeout(() => {
	                instance.hide();
	            }, 2000);
	        }
	    });

	    tippy('.copyable', {
	        trigger: "click",
	        content: "Copied",
	        onShow(instance) {
	            setTimeout(() => {
	                instance.hide();
	            }, 2000);
	        }
	    });


	    /**************************
	     * adjust the height of the gallery to the size of the screen
	     *************************************************/
	    var h = jQuery(window).height();
	    jQuery("#viewer").css("height", h);
	    var e1 = jQuery(".url-element").height();
	    var e2 = jQuery(".output-element").height();

	    jQuery("#gallery").css("max-height", (h - 190));
	    jQuery(window).resize(function() {
	        jQuery("#viewer").css("height", jQuery(window).height());
	    });












	} // end init()



	    /**************************
	     * initialize OSD
	     ********************/
	    var viewer = OpenSeadragon({
	        id: "viewer",
	        prefixUrl: "assets/js/openseadragon/images/",
	        tileSources: [],
	        showFullPageControl: false,
	        showRotationControl: true,
	        minZoomLevel: 0.1
	    });

	    viewer.addHandler('rotate', function() {
	        CT.current.rotation = viewer.viewport.getRotation();

	        if (CT.current.rotation < 0) {
	            CT.current.rotation = 360 + rotation;
	        }
	        if (CT.current.rotation == 360) {
	            CT.current.rotation = 0;
	        }

	    });


	    // draw overlays

	    new OpenSeadragon.MouseTracker({

	        element: viewer.element,
	        pressHandler: function(event) {

	            if (!CT.selectionMode) {
	                return;
	            }

	            if (CT.overlayOn) {
	                viewer.removeOverlay("overlay");
	            }
	            var overlayElement = document.createElement("div");
	            overlayElement.id = "overlay";
	            overlayElement.className = "highlight";

	            var viewportPos = viewer.viewport.pointFromPixel(event.position);
	            viewer.addOverlay({
	                element: overlayElement,
	                location: new OpenSeadragon.Rect(viewportPos.x, viewportPos.y, 0, 0)
	            });
	            CT.overlayOn = true;
	            drag = {
	                overlayElement: overlayElement,
	                startPos: viewportPos
	            };


	        },
	        dragHandler: function(event) {

	            if (typeof drag === 'undefined') {
	                return;
	            }

	            var viewportPos = viewer.viewport.pointFromPixel(event.position);

	            var diffX = viewportPos.x - drag.startPos.x;
	            var diffY = viewportPos.y - drag.startPos.y;

	            var location = new OpenSeadragon.Rect(
	                Math.min(drag.startPos.x, drag.startPos.x + diffX),
	                Math.min(drag.startPos.y, drag.startPos.y + diffY),
	                Math.abs(diffX),
	                Math.abs(diffY)
	            );

	            var overlayHeight = jQuery("#overlay")[0].clientWidth;

	            var w = viewer.tileSources[0].width;
	            var h = viewer.tileSources[0].height;

	            region = [
	                Math.floor(location.x * w),
	                Math.floor(location.y * w),
	                Math.floor(location.width * w),
	                Math.floor(location.height * w)
	            ]
	           

	            // if the box goes outside the boundaries of the image

	                if (region[0] < 0) { region[0] = 0;  }
	                if (region[1] < 0) { region[1] = 0;  }
	                if (region[0]+region[2] > w) { region[2] = w - region[0]; }
	                if (region[1]+region[3] > h) { region[3] = h - region[1]; }


	            // update the box    
	            viewer.updateOverlay(drag.overlayElement, location);

	            // get the outputs
	            
	            CT.outputs = {
	                "manifest": CT.current.manifest,
	                "canvas": CT.current.canvas,
	                "service": CT.current.service,
	                "version": CT.current.version,
	                "large": CT.current.service + "/" + region.join(',') + "/1200,/" + CT.current.rotation + "/default.jpg",
	                "small": CT.current.service + "/" + region.join(',') + "/300,/" + CT.current.rotation + "/default.jpg",
	                "actual": CT.current.service + "/" + region.join(',') + "/" + overlayHeight + ",/" + CT.current.rotation + "/default.jpg",
	                "html": ""
	            }
	            if (CT.current.version == 3) {
	                CT.outputs.actual = CT.current.service + "/" + region.join(',') + "/max/" + CT.current.rotation + "/default.jpg";
	            } else {
	                CT.outputs.actual = CT.current.service + "/" + region.join(',') + "/full/" + CT.current.rotation + "/default.jpg";
	            }
	            CT.outputs.html = "<img alt='detail' src='" + CT.outputs.actual + "' data-manifest='" + CT.current.manifest + "'/>";

	            updateOutputURLs();
	        },
	        releaseHandler: function(event) {

	            if (CT.selectionMode == true) {

	                var id = makeid();

	                manifest_url = jQuery("#url").val();

	                // add info to the selections array
	                // creating an id would probably be good
	                CT.selections[id] = CT.outputs;
	                //var selection_index = CT.selections.push(CT.outputs)-1;

	                // if any items in the tray are currently active, remove active class
	                jQuery(".preview-item.active-item").removeClass('active-item');


	                //construct html of thumbnail in bottom tray

	                var mirador_link = "https://mcgrawcenter.github.io/mirador/?manifest=" + manifest_url + "&canvas=" + CT.outputs.canvas;

	                var preview_item = "<div id='" + id + "' class='preview-item active-item' data-service='" + CT.outputs.service + "' data-canvas='" + CT.outputs.canvas + "' data-manifest='" + manifest_url + "'>\
		    <div>" + CT.outputs.html + "</div>\
		    <div class='selectcrop copyable' style='position:absolute;top:0px;left:0px;z-index:-100'>\
		    <a href='" + CT.current.manifest + "' title='detail image' target='_blank'>" + CT.outputs.html + "</a>\
		    </div>\
		    <span class='preview-item-tools'>\
		     <a href='#' class='copyable'><img src='assets/images/copy.svg' class='icon-sm'/></a>\
		     <a href='#' class='preview-item-metadata'><img src='assets/images/info-circle-white.svg' class='icon-sm'/></a>\
		     <a href='" + CT.outputs.actual + "' class='preview-item-external' target='_blank'><img src='assets/images/external-white.svg' class='icon-sm'/></a>\
		     <a href='#' class='preview-item-close'><img src='assets/images/x-white.svg' class='icon-sm'/></a></span></div>";

	                jQuery("#preview").find('.preview-tray').prepend(preview_item);


	                tippy('.copyable', {
	                    trigger: "click",
	                    content: "Copied",
	                    placement: "left",
	                    onShow(instance) {
	                        setTimeout(() => {
	                            instance.hide();
	                        }, 2000);
	                    }
	                });

	                jQuery("#preview").addClass('shown').show();

	                // revert output mode back to actual
	                jQuery("#actual").prop("checked", true);
	                jQuery("#output").attr('data-mode', 'actual');

	                jQuery("#crop").removeClass("activated");
	                CT.selectionMode = false;
	                viewer.setMouseNavEnabled(true);
	                if (overlay) {
	                    viewer.removeOverlay("overlay");
	                }

	                jQuery("#output").attr('data-mode', 'actual');
	                setMode('large');
	                updateOutputURLs();
	            }

	            drag = null;

	        }
	    });


	/*************************
	 * activate or de-activate crop mode
	 ***********************************/

	jQuery('#crop').click(function() {

	    if (jQuery("#crop").hasClass("activated")) {
	        jQuery("#crop").removeClass("activated");
	        CT.selectionMode = false;
	        viewer.setMouseNavEnabled(true);
	    } else {
	        jQuery("#crop").addClass("activated");
	        CT.selectionMode = true;
	        viewer.setMouseNavEnabled(false);
	    }

	});



	/******************************
	 *  The three output textarea modes
	 ********************************/

	jQuery(".setmode").click(function(e) {
	    var mode = jQuery(this).attr("data-mode");
	    setMode(mode);
	});




	/******************
	 * select a gallery item
	 ***********************************************************/

	jQuery(document).on("click", ".gallery-item", function(e) {

	    CT.current.manifest = jQuery(this).attr('data-manifest');
	    CT.current.canvas = jQuery(this).attr('data-canvas');
	    CT.current.service = jQuery(this).attr('data-service');
	    CT.current.version = jQuery(this).attr('data-version');

	    // highlight this gallery item
	    jQuery(".gallery-item").removeClass('gallery-item-active');
	    jQuery(this).addClass('gallery-item-active');

	    // un-hilight any tray thumbs that might be highlighted
	    jQuery(".preview-item").removeClass('active-item');


	    jQuery("#crop").removeClass("activated");
	    CT.selectionMode = false;
	    viewer.setMouseNavEnabled(true);


	    jQuery("#image").prop("checked", true);

	    jQuery.get(CT.current.service + "/info.json", function(data) {

	        viewer.open(data);
	        viewer.tileSources.unshift(data);

	        // find out if this is a v2 or v3 image server
	        // to determine whether we should use 'full' or 'max'
	        if (typeof data['@context'] != 'undefined') {
	            if (data['@context'] == 'http://iiif.io/api/image/3/context.json') {
	                CT.current.version = 3;
	            } else {
	                CT.current.version = 2;
	            }
	        } else {
	            CT.current.version = 2;
	        }


	        // i had orignally populate the output textarea with the full url when one clicked on the gallery item
	        //if(CT.max_or_full == 'max') { var full_size = CT.current.service+"/full/max/0/default.jpg"; }
	        //else { var full_size = CT.current.service+"/full/full/0/default.jpg"; }

	        var zoom = viewer.viewport.getZoom();
	        var width = viewer.tileSources[0].width;
	        var adjustedwidth = parseInt((width * zoom) * 0.18);
	        var actual_size = CT.current.service + "/full/" + adjustedwidth + ",/0/default.jpg";


	        CT.current.rotation = 0;
	        CT.current.region = "full",
	            CT.current.size = adjustedwidth + ",";


	        // update the urls that appear in the output textarea
	        CT.outputs = {
	            "manifest": CT.current.manifest,
	            "canvas": CT.current.canvas,
	            "service": CT.current.service,
	            "large": CT.current.service + "/full/1200,/0/default.jpg",
	            "small": CT.current.service + "/full/300,/0/default.jpg",
	            "actual": CT.current.service + "/full/full/0/default.jpg",
	            "html": ""
	        }
	        if (CT.current.version == 3) {
	            CT.outputs.actual = CT.current.service + "/full/max/0/default.jpg";
	        }

	        setMode('large');
	        
	        CT.outputs.html = "<img alt='detail' src='" + CT.outputs.actual + "' data-manifest='" + CT.current.manifest + "'/>";
	        
	        updateOutputURLs();


	    });

	    CT.mode = 'large';
	    e.preventDefault();
	});







	/*********************************
	 * ACTIONS
	 *******************************/

	// submit a url
	jQuery("#submit").click(function() {
	    var url = jQuery("#url").val();
	    CT.current.manifest = url;
	    jQuery("#gallery").empty();
	    load(url);
	});
	
	
	
	/******************************
	 *  Set the mode
	 ********************************/
	function setMode(mode) {
	    jQuery("input[id='" + mode + "']").prop("checked", true);
	    jQuery("#output").attr("data-mode", mode);
	    updateOutputURLs();
	    jQuery(".preview-item.active-item").find(".preview-item-external").attr('href', CT.outputs[mode]);
	}	




	/*************************
	 * show / hide preview bar
	 ***********************************/

	jQuery(".preview-hide").click(function() {
	    if (jQuery("#preview").hasClass('shown')) {
	        jQuery("#preview").removeClass('shown');
	        jQuery("#preview-tray-icon").removeClass('shown');
	    } else {
	        jQuery("#preview").addClass('shown');
	        jQuery(".preview-hide svg").addClass('shown');
	        jQuery("#preview-tray-icon").addClass('shown');
	    }
	});

	/************************************
	 * 
	 *************************************/
	function updateOutputURLs() {
	    var mode = jQuery("#output").attr("data-mode");
	    jQuery("#output").val(CT.outputs[mode]);
	    jQuery("#copy").show();
	}

	/************************************
	* Load a manifest
	* to do: if a manifest uses static images, we cannot use this tool
	* we need to alert the user
	* an example manifest with static jpgs at https://discover.york.ac.uk/ark:/36941/13192/presentation/3/manifest 
	*************************************/
	function load(url) {


	    // UCLA has an 'ark:' in their urls that need to be encoded
	    url = url.replace(/ark:\/(.*?)\//, function(r, a) {
	        return "ark%3A%2F" + a + "%2F"
	    });

	    // if this is an Internet Archive URL
	    // convert it to a manifest
	    if (url.indexOf("archive.org") > 0 && url.indexOf("details") > 0) {
	        url = internetArchive2Manifest(url);
	    }


	    // if this is a IIIF image url, parse it
	    if (url.search(/\/([0-9]{1,3})\/(color|gray|bitonal|default)\.(png|jpg)/) > 0) {
	        parseSingleImage(url);
	    } else {
	    
	    
		   const cp = document.getElementById("cp");
		   cp.vault.loadManifest(url).then(manifest => {

			    var label = getFirstValue(manifest.label);

			    var metadata = [];
			    if (typeof manifest.metadata != undefined) {
				manifest.metadata.forEach(function(meta) {
				    var meta_label = getFirstValue(meta.label);
				    var meta_value = getFirstValue(meta.value);
				    CT.metadata.push({
				        'label': meta_label,
				        'value': meta_value
				    });
				});
			    }

			    var o = { 'label': label,'metadata': metadata,'items': [] }
			    CT.manifests[url] = o;
			    
			    var type = manifest.type;
			    var items = cp.vault.get(manifest.items);

			    switch (type) {

				case 'Collection':
				    items.forEach(function(item) {
				        load(item.id);
				    });
				break;
				
				case 'Manifest':
				
				    //console.log(url);
				
				    items.forEach((item)=>{   
				     
				       var canvas = item.id;
				       var label = getFirstValue(item.label);
				       var service = "error";
				       var version = 2;
				                              
					var annoPage = cp.vault.get(item.items);
					annoPage.forEach((annoPage)=>{
					  var annotation = cp.vault.get(annoPage.items[0]);
					  var body = cp.vault.get(annotation.body[0]);
					  if(typeof body.service != undefined) {
					        service = parseService(body.service).replace(/\/$/, "");
					  }  
		      
					}); // end annoPage.forEach
					
				        var x = {
				            'manifest': manifest,
				            'service': service,
				            'canvas': canvas,
				            'label': label,
				            'version': version
				        }
console.log(x);
				        
				        CT.manifests[url].items.push(x);

				    });   // end items.forEach         
				    buildGallery(url);
				break;				
			    
			    }
			    
			    
			    
			    
		   });  

	    } // end if/else

	}
	
	function parseService(serviceObj) {

	   if(Array.isArray(serviceObj)) {
	   
	        if(serviceObj[0]['@id']) {  return serviceObj[0]['@id']; }
	        else { return serviceObj[0].id; }

	   }
	   else {
	        if(serviceObj['@id']) {  return serviceObj['@id']; }
	        else { return serviceObj.id; }
	   }
	
	}
	
	
	
	/****************************
	* remove item from preview bar
	*****************************************/
	
	jQuery(document).on("click", ".preview-item-close", function(e) {
	  jQuery(this).parent().parent().remove();
	  e.preventDefault();
	});
	
	/****************************
	* click on info icon in preview item
	*****************************************/
	
	jQuery(document).on("click", ".preview-item-metadata", function(e) {
	
	  var manifest = jQuery(this).parent().parent().attr('data-manifest');
	  var canvas = jQuery(this).parent().parent().attr('data-canvas');


	   // update the urls that go in the 'copy' textarea
	   updateOutputURLs();

	   var o = CT.manifests[manifest];

	   var html = "";
	   html += "<p><label for='title'>Title:</label> <span id='title'>"+o.label+"</span></p>";
	   html += "<p><label for='descr'>Description:</label> <span id='descr'>"+o.description+"</span></p>";
	   
	   jQuery.each(o.metadata, function(i,v) {
	     html += "<p><label for='"+v.label+"'>"+v.label+":</label> <span id='"+v.label+"'>"+v.value+"</span></p>";
	   });
	   html += "<p><a href='"+manifest+"' target='_blank'><img src='assets/images/iiif.svg' class='icon'/></a></p>";
	   
	   html += "<p><strong>Manifest</strong>: "+manifest+"</p>";
	   html += "<p><strong>Canvas</strong>: "+canvas+"</p>";
	   html += "<p><strong>Region</strong>: "+region.join(',')+"</p>";
	   
	   
	   
	   jQuery('#modal_content').html(html);
	   jQuery('#modal').modal();

	  e.preventDefault();
	});		


	/******************
	 * click on a preview item in the tray
	 *************************************************/

	jQuery(document).on("click", ".preview-item", function(e) {

	    // highlight this gallery item
	    jQuery(".preview-item").removeClass('active-item');
	    jQuery(this).addClass("active-item");

	    var id = jQuery(this).attr('id');

	    jQuery(".gallery-item").removeClass('gallery-item-active');
	    jQuery(".gallery-item[data-service='" + CT.selections[id].service + "']").addClass('gallery-item-active');

	    //re-populate the url text field with the manifest url for this detail
	    var previous_manifest_url = jQuery("#url").val();

	    jQuery("#url").val(CT.selections[id].manifest);

	    // if we are changing to a different manifest, reload the gallery of thumbs

	    if (previous_manifest_url != CT.selections[id].manifest) {
	        load(CT.selections[id].manifest);
	    }

	    //populate the output textarea with whatever mode is currently selected
	    CT.outputs = CT.selections[id];
	    updateOutputURLs();
	    //buildGallery(CT.selections[id].manifest);
	});



	/************************************
	 * 
	 *********************************/

	function parseMetadata(metadata) {

	    var a = [];

	    // then get the metadata
	    jQuery.each(metadata, function(i, v) {
	        var label = getFirstValue(v.label);
	        var value = getFirstValue(v.value);
	        var r = {
	            "label": label,
	            "value": value
	        }
	        a.push(r);
	    });
	    return a;

	}


	/************************************
	 * 
	 *********************************/

	function getFirstValue(o) {
	    
	    if(Array.isArray(o)) {
	      return o.label[0];
	    }
	    else if(typeof o === 'object'  && o !== null) {
	        var x = Object.values(o)[0];
	        if (typeof x == 'object') {
	            return Object.values(x)[0];
	        } else {
	            return x;
	        }
	    }
	    else if (typeof o === "string") {
	      return o;
	    }
	    else {
	      return "";
	    }
	}


	/************************************
	 * 
	 *********************************/

	function buildGallery(id) {



	    var html = "<div>";
	    html += "<p class='gallery-manifest-label'>" + CT.manifests[id].label + "</p>";
	    html += "<ul>";
	    
	    

	    jQuery.each(CT.manifests[id].items, function(i, v) {
	        if (v.service != 'error') {
	            html += "<li class='gallery-item' data-manifest='" + v.manifest + "' data-canvas='" + v.canvas + "' data-service='" + v.service + "' data-version='" + v.version + "' alt='image " + i + "'><img alt='" + v.label + "' src='" + v.service + "/full/,200/0/default.jpg'/><div class='gallery-item-label'>" + v.label + " </div></li>";
	        } else {
	            html += "<li class='gallery-item' data-manifest='" + v.manifest + "' data-canvas='" + v.canvas + "' data-service='" + v.service + "' data-version='" + v.version + "' alt='image " + i + "'><div class='gallery-item-label'>" + v.label + " </div></li>";
	        }
	    });
	    html += "</ul>";
	    html += "</div>";
	    jQuery("#gallery").append(html);
	}







	function makeid() {
	    let result = '';
	    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	    const charactersLength = characters.length;
	    let counter = 0;
	    while (counter < 12) {
	        result += characters.charAt(Math.floor(Math.random() * charactersLength));
	        counter += 1;
	    }
	    return result;
	}




	function copytext() {
	    var copytext = document.getElementById("output");
	    copytext.select();
	    copytext.setSelectionRange(0, 99999); // For mobile devices
	    navigator.clipboard.writeText(copytext.value);
	}



	//https://stackoverflow.com/questions/33175909/copy-image-to-clipboard
	//Cross-browser function to select content

	function SelectText(element) {
	    var doc = document;
	    if (doc.body.createTextRange) {
	        var range = document.body.createTextRange();
	        range.moveToElementText(element);
	        range.select();
	    } else if (window.getSelection) {
	        var selection = window.getSelection();
	        var range = document.createRange();
	        range.selectNodeContents(element);
	        selection.removeAllRanges();
	        selection.addRange(range);
	    }
	}
	jQuery(document).on("click", ".copyable", function(e) {
	    var containerDiv = jQuery(this).parent().parent().find(".selectcrop");
	    //Make the container Div contenteditable
	    containerDiv.attr("contenteditable", true);
	    //Select the image
	    SelectText(containerDiv.get(0));
	    //Execute copy Command
	    //Note: This will ONLY work directly inside a click listener
	    document.execCommand('copy');
	    //Unselect the content
	    window.getSelection().removeAllRanges();
	    //Make the container Div uneditable again
	    containerDiv.removeAttr("contenteditable");
	    //Success!!
	    console.log("image copied!");
	});
	
  /************************************
  * 
  *************************************/
  function internetArchive2Manifest (url) {
     var parts = url.split("/");
     for(var x=0;x<=parts.length;x++) { 
       if(parts[x] == 'details') { 
         var ia_id = parts[x+1];
         return "https://iiif.archive.org/iiif/"+ia_id+"/manifest.json";
       }
     }     
  }

  /************************************
  * 
  *************************************/
  function wikimediaCommons2Manifest (url) {  
    var parts = url.split("File:");
    return "https://iiif.juncture-digital.org/wc:"+parts[1]+"/manifest.json";  
  }
  	
