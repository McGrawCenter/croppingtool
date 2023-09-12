
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
  
  

  /************************************
  * 
  *************************************/
  function load(manifest_uri) {
  
    jQuery("#gallery").empty();
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
  function parsev2Collection (manifest) {
     for(const man of manifest.manifests) {
       var service = man['@id'];
       load(service);
     }
  }
  
  function parseSingleImage(url) {
  
      var s = url.split("/").slice(0,-4);
      console.log(s);
      var id = s.join("/");
      console.log(id);
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
      
  
  /*
      if(manifest.label && typeof manifest.label === "object") { 
         var label = Object.values(manifest.label)[0][0];
       }    
      else if(manifest.label && Array.isArray(manifest.label)) { 

         var label = manifest.label[0][0];
       }
      else if(manifest.label && typeof manifest.label === "string") { 
         var label = manifest.label;
      }
      else { 
      
      }
      // metadata
      parseMetadata(manifest.metadata);
      
      //console.log(label);
      */
      
      // thumbnail
      if(manifest.thumbnail && typeof manifest.thumbnail === 'object') {  var thumbnail = manifest.thumbnail[0].id; }      
      else if(manifest.thumbnail && typeof manifest.thumbnail === 'array') { var thumbnail = manifest.thumbnail['id']; }
      else if(manifest.thumbnail && typeof manifest.thumbnail === "string") { var thumbnail = manifest.thumbnail; }  
      else {
        var firstcanvas = manifest.items[0];
        var thumbnail = getCanvasThumbnail(firstcanvas, 150,150);
      }      
      
      if(manifest.items) {
        var items = manifest.items;
        for (const item of items) {
            var label = Object.values(item.label)[0][0];
            //var thumb = getCanvasThumbnail(item, 150,150);
            var thumb = item.thumbnail[0]['id'];
            var url = item.items[0].items[0].body.service[0]['@id'];
            var r = {}
            r.label = label;
            r.thumb = thumb;
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
    console.log(masterlist);
    var para = jQuery("<ul></ul>");

    jQuery.each(images, function(i,v){ 
      para.append("<li class='gallery-item' data-manifest='"+id+"' data-service='"+v.url+"' alt='image "+i+"'><img src='"+v.thumb+"'/></li>");
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
  
  
  
