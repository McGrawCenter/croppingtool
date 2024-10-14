  
  
  

  	var current_id = "";
  	
  	// outputs is an object that holds the current output urls that will
  	// be displayed in the output window for whatever is currently selected
  	var outputs = {'manifest':'', 'service':'','detail':'','full':'','html':''};

  	
    	var overlay = false;
    	var selectionMode = false;	
    	var crop_url = "";
    	var region = [];
  	var current_image = "";
  	var manifest_url = "";
  	var rotation = 0;
  	
  	
       /****************
       * masterlist contains records of each manifest that is added to the tool
       * with title, descr, metadata, and images
       ***********************************/
  	var masterlist = {};	
  	
  	/****************
  	* selections is a list of the crops
  	**********************************/
  	var selections = []; 
  	
  	
  	//var minThumbWidth = 500;
  
  
  	// adjust the height of the gallery to the size of the screen
	var h = jQuery(window).height();
	jQuery("#viewer").css("height", h);
       var e1 = jQuery(".url-element").height();
       var e2 = jQuery(".output-element").height();
      
       jQuery("#gallery").css("max-height",(h-190));
       jQuery( window ).resize(function() {
	  jQuery("#viewer").css("height",jQuery(window).height());
       });
       
       
       
	
	// initialize OSD
	var viewer = OpenSeadragon({
	    id: "viewer",
	    prefixUrl: "assets/js/openseadragon/images/",
	    tileSources:[],
	    showFullPageControl:false,
	    showRotationControl: true,
	    minZoomLevel: 0.1    
	});
	
	
	viewer.addHandler('rotate', function(){
	  rotation = viewer.viewport.getRotation();
	  console.log(rotation);
	  if(rotation < 0) { rotation = 360 + rotation; }
	  console.log(rotation);
	});
	
	
	/******************
	* select a gallery item
	***********************************************************/
	
	jQuery(document).on("click",".gallery-item",function(e){
	
	  
	  var manifest_url = jQuery(this).attr('data-manifest');
	  var canvas = jQuery(this).attr('data-canvas');
	  
	  service = jQuery(this).attr('data-service');
	  
	  //current = {'service':service, 'manifest': manifest_url, 'label': '', 'rotation': 0}

	
	  // highlight this gallery item
	  jQuery(".gallery-item").removeClass('gallery-item-active');
	  jQuery(this).addClass('gallery-item-active');
	  
	  // un-hilight any tray thumbs that might be highlighted
	  jQuery(".preview-item").removeClass('active-item');
	  
	  
	  jQuery("#crop").removeClass("activated");
	  selectionMode = false;
	  viewer.setMouseNavEnabled(true);	  
	  
	  
	  // i had orignally populate the output textarea with the full url when one clicked on the gallery item
	  if(max_or_full == 'max') { var full_size = service+"/full/max/0/default.jpg"; }
	  else { var full_size = service+"/full/full/0/default.jpg"; }

	  outputs = {
	    'manifest':manifest_url,
	    'canvas': canvas,
	    'service': service,
	    'detail':full_size,
	    'full':full_size,
	    'html':"<img alt='' src='"+full_size+"' data-manifest='"+manifest_url+"'/>"
	  }
	  
	  console.log(outputs);
	  
	  // update the urls that appear in the output textarea
	  updateOutputURLs();
	  
	  jQuery("#image").prop("checked", true);
	  

	  jQuery.get(outputs.service+"/info.json", function(data){
	    viewer.open(data);
	    viewer.tileSources.unshift(data);
	  });	  
	  e.preventDefault();
	});
	
	
	// submit a url
	jQuery("#submit").click(function(){
	  var url = jQuery("#url").val();
	  manifest_url = url;
	  submitted = 1;
	  load(url);
	});
	
	
	
	
	    	
    	// draw overlays

	new OpenSeadragon.MouseTracker({
			  
	    element: viewer.element,
	    pressHandler: function(event) {

		if (!selectionMode) {
		    return;
		}
	      
		if (overlay) {
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
		overlay = true;  
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
		//if(overlayHeight < minThumbWidth) { overlayHeight = minThumbWidth; }

		var w = viewer.tileSources[0].width;
      
		region = [
		    Math.floor(location.x * w),
		    Math.floor(location.y * w),
		    Math.floor(location.width * w),
		    Math.floor(location.height * w)
		]
		
	      	// if the box goes outside the boundaries of the image
	      	jQuery.each(region,function(i,v){ if(v < 0) { region[i] = 0; } });
	      		      
		viewer.updateOverlay(drag.overlayElement, location);
		
		// crop url is the image that is currently selected
		crop_url = outputs.service+"/"+region[0]+","+region[1]+","+region[2]+","+region[3]+"/"+overlayHeight+",/"+rotation+"/default.jpg";
		
		// thumbnail url is always 300 pixels width. It is just for display
		thumbnail_url = outputs.service+"/"+region[0]+","+region[1]+","+region[2]+","+region[3]+"/,300/"+rotation+"/default.jpg";
		
	        if(max_or_full == 'max') { 
	          uncropped_url = outputs.service+"/"+region[0]+","+region[1]+","+region[2]+","+region[3]+"/max/"+rotation+"/default.jpg";
	        }
	        else { 
	          uncropped_url = outputs.service+"/"+region[0]+","+region[1]+","+region[2]+","+region[3]+"/full/"+rotation+"/default.jpg";
	        }		
		
			
		
			
		updateOutputURLs();
	    },
	    releaseHandler: function(event) {

		if(selectionMode==true) { 
		
		    manifest_url = jQuery("#url").val();
		    
		    var label = manifests[manifest_url].label.replace("'","&apos;").replace('"','&apos;');
		    console.log(label);

		    var img_html = "<img alt='detail' src='"+thumbnail_url+"' data-manifest='"+manifest_url+"'/>";
	    
		    // add info to the selections array
		    // creating an id would probably be good
		    var selection_index = selections.push({"id":"", "manifest":manifest_url,"detail":crop_url,"html":img_html, "full":uncropped_url, "mode": "detail"})-1;
		    
		    //console.log(selections);
		    
		    // if any items in the tray are currently active, remove active class
		    jQuery(".preview-item.active-item").removeClass('active-item'); 		    


		    //construct html of thumbnail in bottom tray
    		    console.log(manifests);
    		    
    		    

		    var preview_item = "<div class='preview-item active-item' data-service='"+outputs.service+"' data-canvas='"+outputs.canvas+"' data-manifest='"+manifest_url+"' data-selection='"+selection_index+"'>\
		    <div class='selectcrop copyable' data-tippy-content='Tooltip'>\
		    <a href='?manifest="+manifest_url+"' title='detail image' target='_blank'>"+img_html+"</a>\
		    </div>\
		    <span class='preview-item-tools'>\
		     <a href='#' class='copyable'><img src='assets/images/copy.svg' class='icon-sm'/></a>\
		     <a href='#' class='preview-item-metadata'><img src='assets/images/info-circle-white.svg' class='icon-sm'/></a>\
		     <a href='"+crop_url+"' class='preview-item-external' target='_blank'><img src='assets/images/external-white.svg' class='icon-sm'/></a>\
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
		    
		    // revert output mode back to detail
		    jQuery("#detail").prop("checked", true);
		    jQuery("#output").attr('data-mode','detail');
	  	    //jQuery("#output").val(selections[0].detail);

		    jQuery("#crop").removeClass("activated");
		    selectionMode = false;
		    viewer.setMouseNavEnabled(true);
		    if (overlay) {
			    viewer.removeOverlay("overlay");
		    }
		    
		    outputs = { 
		      'manifest':manifest_url,
		      'service': service,
		      'detail':crop_url,
		      'full':uncropped_url,
		      'html':img_html
		    }
		    jQuery("#output").attr('data-mode','detail');
		    	    
		    updateOutputURLs();
		    //console.log(outputs);
		} 

		drag = null;

	    }
	});



    
	/*************************
	* activate or de-activate crop mode
	***********************************/
	
	jQuery('#crop').click( function() {  

	  if(jQuery("#crop").hasClass("activated")) { 
	    jQuery("#crop").removeClass("activated");
	    selectionMode = false;
	    viewer.setMouseNavEnabled(true);
	  }
	  else { 
	    jQuery("#crop").addClass("activated");
	    selectionMode = true;
	    viewer.setMouseNavEnabled(false);
	  }
	  
	}); 	
    
    
    
    
	/*************************
	* get the url vars
	***********************************/

	function getURLValues() {

	  var search = window.location.search.replace(/^\?/,'').replace(/\+/g,' ');
	  var values = {};

	  if (search.length) {
	    var part, parts = search.split('&');

	    for (var i=0, iLen=parts.length; i<iLen; i++ ) {
	      part = parts[i].split('=');
	      values[part[0]] = window.decodeURIComponent(part[1]);
	    }
	  }
	  return values;
	}


	// if there is a manifest url var, load it

	var vars = getURLValues();
	if(typeof vars.manifest  !== 'undefined') { 
	  var url = vars.manifest;
	  jQuery("#url").val(url);
	  manifest_url = url;
          load(url);
	 }
	
	
	
	
	
	
	

	
		 
	 
	/*************************
	* show / hide preview bar
	***********************************/
	
	jQuery(".preview-hide").click(function() {
	  if(jQuery("#preview").hasClass('shown')) { 
	     jQuery("#preview").removeClass('shown');
	     jQuery(".preview-hide svg").removeClass('shown');
	   }
	  else {
	    jQuery("#preview").addClass('shown');
	    jQuery(".preview-hide svg").addClass('shown');
	  }
	});
	
	
	/******************
	* click on a preview item in the tray
	*************************************************/
	
	jQuery(document).on("click",".preview-item",function(e){

	  // highlight this gallery item
	  jQuery(".preview-item").removeClass('active-item');
	  jQuery(this).addClass("active-item");
	    
	  var manifest_url = jQuery(this).attr('data-manifest');

	  var selection_index = jQuery(this).attr('data-selection');
	  var service = jQuery(this).attr('data-service');
	  
	  jQuery(".gallery-item").removeClass('gallery-item-active');
	  jQuery(".gallery-item[data-service='"+service+"']").addClass('gallery-item-active');

	  outputs = { 
	    'manifest':manifest_url,
	    'service':service,
	    'detail':selections[selection_index]['detail'],
	    'full':selections[selection_index]['full'],
	    'html':selections[selection_index]['html']
	  }
	  
	  //re-populate the url text field with the manifest url for this detail
	  var previous_manifest_url = jQuery("#url").val();
	  
	  //var selection_index = jQuery(this).attr('data-selection');
	  //var current_manifest_url = selections[selection_index].manifest;
	  jQuery("#url").val(manifest_url);
	  // if we are changing to a different manifest, reload the gallery of thumbs
	  if(previous_manifest_url != manifest_url) {
	      load(manifest_url);
	  }
	  
	  //populate the output textarea with whatever mode is currently selected
	  //var mode = jQuery("#output").attr('data-mode');
	  updateOutputURLs();
	  
	});
	

	
	/******************************
	*  The three output textarea modes
	********************************/


	
	jQuery("#detail").click(function(e){
	   //set the val of the output texarea
	   jQuery("#output").val(outputs.detail).attr('data-mode','detail');
	   //set the href of the external link if there is a highlighted crop item
	   jQuery(".preview-item.active-item").find(".preview-item-external").attr('href',outputs.detail);
	});	
	
	jQuery("#full").click(function(e){
	  jQuery("#output").val(outputs.full).attr('data-mode','full');
	  jQuery(".preview-item.active-item").find(".preview-item-external").attr('href',outputs.full);
	});


	jQuery("#html").click(function(e){
	  jQuery("#output").val(outputs.html).attr('data-mode','html');
	  jQuery(".preview-item.active-item").find(".preview-item-external").attr('href',outputs.detail);
	});
	
	
	
	
	function updateOutputURLs() {
	  var mode = jQuery("#output").attr("data-mode");
	  jQuery("#output").val(outputs[mode]);
	  jQuery("#copy").show();  
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
	  
	  //console.log("Manifest: "+manifest);
	  //console.log("Canvas: "+canvas);
	  //console.log("Region: "+region.join(','));
	  
	  
	   // update the urls that go in the 'copy' textarea
	   updateOutputURLs();

	   var  o = manifests[manifest];

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

