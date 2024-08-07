
  var version = 2;
  var images = [];
  var label = "";
  var metadata = [];
  // this is so that we only empty the gallery
  // when someone adds a new manifest url
  // (a collection manifest contains multiple manifests
  //  and we don't want to empty the gallery after each one. 
  //  But if someone added a different manifest, we want to empty it)
  var submitted = 0;
  // some manifests use 'max' for size rather than full (internet archive)
  // we need to detect it to generate our 'full' version
  var max_or_full = "full";
  

  /************************************
  * 
  *************************************/
  function load(manifest_uri) {
    

    jQuery("#gallery").empty();
    
    // if this is an Internet Archive URL
    // convert it to a manifest
    if(manifest_uri.indexOf("archive.org") > 0) {
      manifest_uri = internetArchive2Manifest(manifest_uri);
      
    }    
    console.log(manifest_uri);
    
    //console.log(manifest_uri.search(/\/([0-9]{1,3})\/(color|gray|bitonal|default)\.(png|jpg)/));
    if(manifest_uri.search(/\/([0-9]{1,3})\/(color|gray|bitonal|default)\.(png|jpg)/) > 0) { 
        parseSingleImage(manifest_uri)
    }
    else {
	    fetch(manifest_uri)
		  .then(response => {
		          if (!response.ok) {
		              throw new Error(response.statusText);
		          }
		          return response.json();
		  })
		  .then(data => {
		    // version 2
		    if ("@type" in data) {

		        if (data["@type"] == 'sc:Collection') {
		            version = 2;
		            parsev2Collection(data);
		        }
		        
		        else if (data["@type"] == 'sc:Manifest') {
		            version = 2;
		            parsev2(data);
		        }
		        
		        else {
			   console.log( 'Manifest Format Error', 'The JSON for this Manifest doesnt look like a Manifest. It should have either a @type of sc:Manifest but has a type of: ' + data["@type"]);
		        }
		    } 
		    // version 3
		    else if ("type" in data) {
		        if (data["type"] != 'Manifest') {
		            console.log( 'Manifest Format Error', 'The JSON for this Manifest doesnt look like a Manifest. It should have either a type of Manifest but has a type of: ' + data["type"]);
		        } else {
		            version = 3;
		            parsev3(data);
		        }
		    } 
		    else {
		        console.log( 'Manifest Format Error', 'The JSON for this Manifest doesnt look like a Manifest. It should have either a @type or type value of Manifest');
		    }

		    
		  })
		  .catch(error => {
		        console.log( 'Manifest retrieval error', 'I was unable to get the Manifest you supplied due to: ' + error);
	      }); // end fetch
	}  // end if/else
	
  }


  /************************************
  * 
  *************************************/
  function internetArchive2Manifest (url) {
     var parts = url.split("/");
     for(var x=0;x<=parts.length;x++) { 
       if(parts[x] == 'details') { 
         var ia_id = parts[x+1];
         return "https://iiif.archivelab.org/iiif/"+ia_id+"/manifest.json";
       }
     }     
  }



  /************************************
  * 
  *************************************/
  function parsev2Collection (manifest) {
     for(const man of manifest.manifests) {
       var service = man['@id'];
       load(service);
     }
  }
  
  function parseSingleImage(url) {
  
      var s = url.split("/").slice(0,-4);
      //console.log(s);
      var id = s.join("/");
      //console.log(id);
      // initialize an object that will contain info
      var o = {'label':'', 'metadata':[], images:[]}
      o.label = "No title";
      o.description = "No description";
      var r = {}
      r.label = "";
      r.thumb = url;
      r.url = id;
      o.images.push(r);      
      masterlist[id] = o;
      current_id = id;
      buildGallery(id);
  }
  
  
  /************************************
  * Prase a version 2 manifest
  *************************************/
  function parsev2 (manifest) {

      var id = getFirstValue(manifest['@id']);
      
      // initialize an object that will contain info
      var o = {'label':'', 'metadata':[], images:[]}
      
      o.label = getFirstValue(manifest.label);
      o.description = getFirstValue(manifest.description);
      o.metadata = parseMetadata(manifest.metadata);    
      
      if(manifest.sequences) {
        var sequences = manifest.sequences;
        for (const sequence of sequences) {
          if ('canvases' in sequence) {
            for (const canvas of sequence.canvases) {
              var thumb = getCanvasThumbnail(canvas, 150,150);
              
              if(thumb !== false) {
                var label = canvas.label;
                var url = canvas.images[0].resource.service["@id"];
                var r = {}
                r.label = label;
                r.thumb = thumb;
                r.url = url;
                o.images.push(r);
              }
            }
          }
        }
      }    
      masterlist[id] = o;
      current_id = id;
      buildGallery(id);
  }


  /************************************
  * Parse a version 3 manifest
  *************************************/
  function parsev3 (manifest) {
  
      var id = getFirstValue(manifest['id']);  
      
      
      // initialize an object that will contain info
      var o = {'label':'', 'metadata':[], images:[]}
      
      o.label = getFirstValue(manifest.label);
      o.description = getFirstValue(manifest.description);
      o.metadata = parseMetadata(manifest.metadata); 
      
      
      // thumbnail
      if(manifest.thumbnail) {
	switch(typeof manifest.thumbnail) {
	  case 'object':
	    var thumbnail = manifest.thumbnail.id;
	    break;
	  case 'array':
	    var thumbnail = manifest.thumbnail['id'];
	    break;
	  default: //string
	    var thumbnail = manifest.thumbnail;
	} 
      }
      else {
        var thumbnail = manifest.items[0].items[0].items[0].body.service[0]['@id']+"/full/!150,150/0/default.jpg";
      }
     
    
      
      if(manifest.items) {
        var items = manifest.items;
        
        // check if manifest uses full or max for the size in image urls
        // checking the id of the first 'item'
        if(items[0].items[0].items[0].body.id.includes("/max/")) { max_or_full = "max"; }
        
        for (const item of items) {

	      // label
	      if(item.label) {
		switch(typeof item.label) {
		  case 'object':
		    // get the first value
		    var label = Object.values(item.label)[0][0];
		    break;
		  case 'array':
		    var label = item.label[0];
		    break;
		  default: //string
		    var label = item.label;
		} 
	      }
	      else {
		var label = "";
	      }	        
	    // end label --------------------------
	    
	    // service
            var service = item.items[0].items[0].body.service;

            if(typeof service === 'array') {
              //console.log('array');
              //console.log(service);
            }
            else if(typeof service === 'object') {
              //console.log('object');
              if(service[0]) {
		 // sometimes v3 service ids have an @ sign, sometimes not 
		 if(service[0]['id'] == null) { service = service[0]['@id'] }
		 else { service = service[0]['id'] }
                //service = service[0]['id'];
              }
              else {
                service = service.id;
              }
            } 
	     // end service ------------------------------
	     
	     
	     
	      // thumb
	     if(item.thumbnail) {
		switch(typeof item.thumbnail) {
		  case 'object':
		    //console.log('object');
		    if(item.thumbnail[0]) { var thumb = item.thumbnail[0].id }
		    else { var thumb = item.thumbnail.id; }
		    break;
		  case 'array':
		    //console.log('array');
		    var thumb = item.thumbnail[0];
		    break;
		  default: //string
		    var thumb = item.thumbnail;
		} 
	     }
	     else {
		var thumb = service+"/full/!150,150/0/default.jpg";
	     }              
            // end thumb ------------------------------

            //var url = item.items[0].items[0].body.service[0]['@id'];
            
            var url = service;
            
            var r = {}
            r.label = label;
            r.thumb = thumb;
            r.label = label.replace(/"/g,'');
            r.url = url;
            o.images.push(r);
        }
      } 
      masterlist[id] = o;
      current_id = id; 
      buildGallery(id);
  }
  
  /************************************
  * 
  *************************************/
  function getCanvasThumbnail (canvas, width, height) {
  
    if(canvas.thumbnail === undefined) {
      if(typeof canvas.images !== 'undefined') { 
         var thumbnail = canvas.images[0].resource.service['@id']+"/full/150,/0/default.jpg";
      }
      else {
         return false;
         //var thumbnail = "images/placeholder.jpg";
      }
    }
    else {
         if (typeof canvas.thumbnail === "string") { console.log("tres"); var thumbnail = canvas.thumbnail; }
		 
         else if (typeof canvas.thumbnail === "object") {
             if(version==2) {
	       //var thumbnail = canvas.thumbnail["@id"]+"/full/!"+width+", "+height+"/0/default.jpg";
	       var thumbnail = canvas.thumbnail["@id"];
	      }
	      else {
	       var thumbnail = canvas.thumbnail[0]["id"]+"/full/!"+width+", "+height+"/0/default.jpg";
	      }
	     
         }  
    }
  
   return thumbnail;   
   }
   
   
   

  
  function buildGallery(id) {

    var images = masterlist[id].images;
    if(submitted == 1) {
       jQuery("#gallery").empty();
       submitted = 0;
    }
    //console.log(masterlist);
    var para = jQuery("<ul></ul>");

    jQuery.each(images, function(i,v){ 
      para.append("<li class='gallery-item' data-manifest='"+id+"' data-service='"+v.url+"' alt='image "+i+"'><img alt='"+v.label+"' src='"+v.thumb+"'/><div class='gallery-item-label'>"+v.label+"</div></li>");
      //jQuery("#gallery ul").append();
    });
    jQuery("#gallery").append(para);
    images = [];
  }
  
  
  
  
  
  
  
  function getLabel(manifest) {
    if(typeof manifest.label === "object") { return manifest.label[0]; }
    else if(typeof manifest.label === "array") { return manifest.label[0]; }
    else if(typeof manifest.label === "string") { console.log(manifest.label); }
    else { return "";}
  }
  
  
  
  
  
  function parseMetadata(metadata) {
  
    var a = [];
   
    // then get the metadata
    jQuery.each(metadata, function(i,v){
        var label = getFirstValue(v.label);
        var value = getFirstValue(v.value);
        var r = { "label": label, "value": value }
	a.push(r);
    });
    return a;
    
  }
  
  
  
  
  function getFirstValue(o) {
    if(typeof o === "object") { 
       var x = Object.values(o)[0];
       if(typeof x == 'object') { return Object.values(x)[0]; }
       else{ return x; }
    }
    else if(typeof o === "array") { return o.label[0]; }
    else if(typeof o === "string") { return o; }
    else { return ""; }
  }
  
  
  
