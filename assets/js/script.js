  
  jQuery(document).ready(function(){
  
  
    	var overlay = false;
    	var selectionMode = false;	
    	var crop_url = "";
  	var current_image = "";
  	var manifest_url = "";
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
	    minZoomLevel: 0.1    
	});
	
	

	
	
	// select a gallery item
	jQuery(document).on("click",".gallery-item",function(e){
	
	  // highlight this gallery item
	  jQuery(".gallery-item").removeClass('gallery-item-active');
	  jQuery(this).addClass('gallery-item-active');
	  
	  jQuery(".preview-item").removeClass('active-item');
	  
	  jQuery("#crop").removeClass("activated");
	  selectionMode = false;
	  viewer.setMouseNavEnabled(true);	  
	  
	  
	  current_image = jQuery(this).attr('data-service');
	  
	  // i had orignally populate the output textarea with the full url when one clicked on the gallery item
	  //var full_size = current_image+"/full/1200,/0/default.jpg";
	  //jQuery("#output").val(full_size);
	  
	  jQuery("#image").prop("checked", true);
	  
	  var url = current_image+"/info.json";
	  jQuery.get(url, function(data){
	    viewer.open(data);
	    viewer.tileSources.unshift(data);
	  });	  
	  e.preventDefault();
	});
	
	
	// submit a url
	jQuery("#submit").click(function(){
	  var url = jQuery("#url").val();
	  manifest_url = url;
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
		    console.log('removing overlay');
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
      
		var p = [
		    Math.floor(location.x * w),
		    Math.floor(location.y * w),
		    Math.floor(location.width * w),
		    Math.floor(location.height * w)
		]
	      	
	      	jQuery.each(p,function(i,v){ if(v < 0) { p[i] = 0; } });
	      		      
		viewer.updateOverlay(drag.overlayElement, location);
		
		crop_url = current_image+"/"+p[0]+","+p[1]+","+p[2]+","+p[3]+"/"+overlayHeight+",/0/default.jpg";
		uncropped_url = current_image+"/"+p[0]+","+p[1]+","+p[2]+","+p[3]+"/full/0/default.jpg"
		
		jQuery("#output").val(crop_url);
		jQuery("#copy").show();
	      
	    },
	    releaseHandler: function(event) {

		if(selectionMode==true) { 
		
		    manifest_url = jQuery("#url").val();
		    var img_html = "<img src='"+crop_url+"' data-manifest='"+manifest_url+"'/>";
		    
		    // add info to the selections array
		    var selection_index = selections.push({"manifest":manifest_url,"detail":crop_url,"html":img_html, "full":uncropped_url })-1;
		    jQuery("#preview").find('.preview-tray').prepend("<div class='preview-item' data-num='"+selections.length+"' data-selection='"+selection_index+"'>\
		    <a href='#' class='selectcrop'>"+img_html+"</a>\
		    <span class='preview-item-tools'>\
		    <a href='#'><img src='assets/images/info-circle-white.svg' height='15'/></a>\
		    <a href='"+crop_url+"' target='_blank'><img src='assets/images/external-white.svg' height='15'/></a>\
		    <a href='#' class='preview-item-close'><img src='assets/images/x-white.svg' height='15'/></a></span></div>");
		    jQuery("#preview").addClass('shown').show();	    

		    

		    jQuery("#crop").removeClass("activated");
		    selectionMode = false;
		    viewer.setMouseNavEnabled(true);
		    if (overlay) {
			    viewer.removeOverlay("overlay");
		    }	     
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
	  
	  var num = jQuery(this).attr('data-num');
	  
	  //re-populate the url text field with the manifest url for this detail
	  var previous_manifest_url = jQuery("#url").val();
	  var selection_index = jQuery(this).attr('data-selection');
	  var current_manifest_url = selections[selection_index].manifest;
	  jQuery("#url").val(current_manifest_url);
	  // if we are changing to a different manifest, reload the gallery of thumbs
	  if(previous_manifest_url != current_manifest_url) {
	      load(current_manifest_url);
	  }
	  
	  //populate the output textarea with whatever mode is currently selected
	  var mode = jQuery("#output").attr('data-mode');
	  jQuery("#output").val(selections[selection_index][mode]);
	  
	  jQuery("#output").attr('data-current',selection_index);
	});
	

	
	/******************************
	*  The three output textarea modes
	********************************/

	jQuery("#html").click(function(e){
	  var current = jQuery("#output").attr('data-current');
	  jQuery("#output").attr('data-mode','html');
	  if(typeof(selections) != 'undefined') { 
	    jQuery("#output").val(selections[current].html);
	  }
	});
	
	
	jQuery("#full").click(function(e){
	  var current = jQuery("#output").attr('data-current');
	  jQuery("#output").attr('data-mode','full');
	  if(typeof(selections) != 'undefined') { 
	    jQuery("#output").val(selections[current].full);
	    console.log(selections);
	  }
	});
	
	
	
	jQuery("#detail").click(function(e){
	  var current = jQuery("#output").attr('data-current');
	  jQuery("#output").attr('data-mode','detail');
	  if(typeof(selections) !== 'undefined') { 
	    jQuery("#output").val(selections[current].detail);
	    console.log(selections);
	  }
	});			
	
	
	/****************************
	* remove item from preview bar
	*****************************************/
	
	jQuery(document).on("click", ".preview-item-close", function(e) {
	  jQuery(this).parent().parent().remove();
	  e.preventDefault();
	});	 
    
  
  });
  
  
	
	


