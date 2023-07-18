  
  jQuery(document).ready(function(){
  
  
    	var overlay = false;
    	var selectionMode = false;	
    	var crop_url = "";
  	var current_image = "";
  	var manifest_url = "";
  	var selections = []; 
  	//var minThumbWidth = 500;
  
  
       var h = jQuery(window).height();
       jQuery("#viewer").css("height", h);
       
       
       var e1 = jQuery(".url-element").height();
       var e2 = jQuery(".output-element").height();
       
       
       jQuery("#gallery").css("max-height",(h-190));
       jQuery( window ).resize(function() {
	  jQuery("#viewer").css("height",jQuery(window).height());
       });
	
	// init OSD
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
	  jQuery(".gallery-item").removeClass('active-item');
	  jQuery(this).addClass('active-item');
	  
	  jQuery("#crop").removeClass("activated");
	  selectionMode = false;
	  viewer.setMouseNavEnabled(true);	  
	  
	  current_image = jQuery(this).attr('data-service');
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
		
		jQuery("#output").val(crop_url);
		jQuery("#copy").show();
	      
	    },
	    releaseHandler: function(event) {

		if(selectionMode==true) { 
		
		    manifest_url = jQuery("#url").val();
		    var img_html = "<img src='"+crop_url+"' data-manifest='"+manifest_url+"'/>";

		    jQuery("#preview").find('.preview-tray').prepend("<div class='preview-item' data-num='"+selections.length+"'>\
		    <a href='#' class='selectcrop'>"+img_html+"</a>\
		    <span class='preview-item-tools'>\
		    <a href='"+crop_url+"' target='_blank'><img src='assets/images/external-white.svg' height='12'/></a>\
		    <a href='#' class='preview-item-close'>&times;</a></span></div>");
		    jQuery("#preview").addClass('shown').show();	    

		    selections.push({"image":crop_url,"html":img_html}); 

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





	// this is here to prevent a new preview thumbnail
	// from being created when the user turns off the 
	// cropping tool by clicking the icon
	/*
	function existsInPreview(crop_url) {
	  if(selections.indexOf(crop_url) != -1) {
	     return true;
	  }
	  else { return false; }
	}
	*/

  	// activate or de-activate crop mode
	
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
    
    
    	// get the url vars

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
	
	
	
	
	
	
	

	
		 
	 
	// show / hide preview bar
	
	jQuery(".preview-hide").click(function() {
	  if(jQuery("#preview").hasClass('shown')) { jQuery("#preview").removeClass('shown'); }
	  else {
	    jQuery("#preview").addClass('shown');
	  }
	});
	
	
	/******************
	* 
	*************************************************/
	
	jQuery(document).on("click",".preview-item",function(e){
	  // highlight this gallery item
	  jQuery(".preview-item").removeClass('active-item');
	  jQuery(this).addClass("active-item");
	  var num = jQuery(this).attr('data-num');
	  var mode = jQuery("#output").attr('data-mode');
	  jQuery("#output").val(selections[num][mode]);
	  jQuery("#output").attr('data-current',num);
	});
	
	/*
	jQuery(document).on("mouseover",".preview-item",function(e){
	  var num = jQuery(this).attr('data-num');
	  var mode = jQuery("#output").attr('data-mode');
	  jQuery("#output").val(selections[num][mode]);
	  jQuery("#output").attr('data-current',num);
	});
	*/
	
	
	
	
	jQuery("#html").click(function(e){
	  var current = jQuery("#output").attr('data-current');
	  jQuery("#output").attr('data-mode','html');
	  jQuery("#output").val(selections[current].html);
	});
	
	jQuery("#image").click(function(e){
	  var current = jQuery("#output").attr('data-current');
	  jQuery("#output").attr('data-mode','image');
	  jQuery("#output").val(selections[current].image);
	});			
	
	
	// remove item from preview bar
	
	jQuery(document).on("click", ".preview-item-close", function(e) {
	  jQuery(this).parent().parent().remove();
	  e.preventDefault();
	});	 
    
  
  });
  
  
	
	


