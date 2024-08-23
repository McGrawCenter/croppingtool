


class Gallery {

  constructor(manifest_url, gallery) {
    this.id = "";
    this.gallery = gallery;
    this.url = manifest_url;
    this.version = 2;
    this.label = "";
    this.description = "";
    this.metadata = []
    this.images = [] // label,thumb,url
    this.crops = []
  }
  
  /************************************
  * 
  *************************************/
  load() {
 
  
    fetch(this.url)
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
	            this.version = 2;
	            this.parsev2Collection(data);
	        }
	        
	        else if (data["@type"] == 'sc:Manifest') {
	            this.version = 2;
	            this.parsev2(data);
	            this.buildGallery();	            
	        }
	        
	        else {
		   console.log( 'Manifest Format Error', 'The JSON for this Manifest doesnt look like a Manifest. It should have either a @type of sc:Manifest but has a type of: ' + data["@type"]);
	        }
	    } 
	    // version 3
	    else if ("type" in data) {
	        if (data["type"] == 'Collection') {
	            this.version = 3;
	            this.parsev3Collection(data);
	        }
	        else if (data["type"] != 'Manifest') {
	            this.version = 3;
	            this.parsev3(data);
	            this.buildGallery();

	        } else {
	            console.log( 'Manifest Format Error', 'The JSON for this Manifest doesnt look like a Manifest. It should have either a type of Manifest but has a type of: ' + data["type"]);
	        }
	    } 
	    else {
	        console.log( 'Manifest Format Error', 'The JSON for this Manifest doesnt look like a Manifest. It should have either a @type or type value of Manifest');
	    }

	    
	  })
	  .catch(error => {
	        console.log( 'Manifest retrieval error', 'I was unable to get the Manifest you supplied due to: ' + error);
      }); // end fetch
	
  }


 
  /************************************
  * 
  *************************************/
  parsev2Collection (manifest) {

     for(const man of manifest.manifests) {
       var service = man['@id'];
       load(service);
     }
 
  }

 
  /************************************
  * 
  *************************************/
  parsev3Collection (collection) {

     for(const item of collection.items) {
       var manifest = item['id'];
       this.load(manifest);
     }

  }

  /************************************
  * 
  *************************************/
  parseSingleImage(url) {
  
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
  * Parse a version 2 manifest
  *************************************/
  parsev2 (manifest) {

      this.id = this.getFirstValue(manifest['@id']);
      this.label = this.getFirstValue(manifest.label);
      this.description = this.getFirstValue(manifest.description);
      this.metadata = this.parseMetadata(manifest.metadata); 

      
      if(manifest.sequences[0].canvases[0].images[0].resource.service['@context'] !== "http://iiif.io/api/image/2/context.json") { console.log('this does not use image api version 2'); } 
      
      if(manifest.sequences) {
      
        var sequences = manifest.sequences;
        for (const sequence of sequences) {

          if ('canvases' in sequence) {

          
            for (const canvas of sequence.canvases) {
            
              // sometimes canvases don't have images
              if(canvas.images) { 
                 var imageobj = {"label":"","service":"","type": 2,"thumb":""}
		  var thumb = this.getCanvasThumbnail(canvas, 150,150);
		  if(thumb !== false) { imageobj.thumb = thumb; } else { imageobj.thumb = ""; }
		  imageobj.label = canvas.label;
		  imageobj.service = canvas.images[0].resource.service["@id"];
		  if(canvas.images[0].resource.service["@context"] !== "http://iiif.io/api/image/2/context.json") { imageobj.type = 3; }
		  // add this to the images array
                  this.images.push(imageobj);
              } // end if canvas.images
            

            }
          }
        }
      }
  }


  /************************************
  * Parse a version 3 manifest
  *************************************/
  parsev3 (manifest) {
  
  
      this.id = this.getFirstValue(manifest['id']);  
      this.label = this.getFirstValue(manifest.label);
      this.description = this.getFirstValue(manifest.description);
      this.metadata = this.parseMetadata(manifest.metadata); 
      


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
        for (const item of items) {

              var imageobj = {"label":"","service":"","type":"","thumb":""}


	      // label
	      if(item.label) {
		switch(typeof item.label) {
		  case 'object':
		    // get the first value
		    imageobj.label = Object.values(item.label)[0][0];
		    break;
		  case 'array':
		    imageobj.label = item.label[0];
		    break;
		  default: //string
		    imageobj.label = item.label;
		} 
	      }
	      else {
		imageobj.label = "";
	      }	        
	    // end label --------------------------
	    
	    
	    
	    // service
            var service = item.items[0].items[0].body.service;

            
            if(service[0].type == 'ImageService3') { imageobj.type = 3; } else { imageobj.type = 2; }
            

            if(typeof service === 'array') {
	      imageobj.service = service['@id'];
            }
            else if(typeof service === 'object') {
              if(service[0]) {
		 // sometimes v3 service ids have an @ sign, sometimes not 
		 if(service[0]['id'] == null) { imageobj.service = service[0]['@id']; } else { imageobj.service = service[0]['id'] }
              }
              else {
                imageobj.service = service.id;
              }
              
            } 
	     // end service ------------------------------
	     
	     
	      // thumb
	     if(item.thumbnail) {
		switch(typeof item.thumbnail) {
		  case 'object':
		    //console.log('object');
		    if(item.thumbnail[0]) { imageobj.thumb = item.thumbnail[0].id }
		    else { imageobj.thumb = item.thumbnail.id; }
		    break;
		  case 'array':
		    //console.log('array');
		    imageobj.thumb = item.thumbnail[0];
		    break;
		  default: //string
		    imageobj.thumb = item.thumbnail;
		} 
	     }
	     else {
		imageobj.thumb = imageobj.service+"/full/!150,150/0/default.jpg";
	     }              
            // end thumb ------------------------------

	    // add this image to the images array
            this.images.push(imageobj);
        }
      } 

  }
  

   
   /************************************
   * this is used to get metadata regardless of whether the
   * metadata is stored in objects, arrays, or strings
   ************************************/   
   getFirstValue(o) {
      if(typeof o === "object") { 
         var x = Object.values(o)[0];
         if(typeof x == 'object') { return Object.values(x)[0]; }
         else{ return x; }
      }
      else if(typeof o === "array") { return o.label[0]; }
      else if(typeof o === "string") { return o; }
      else { return ""; }
    }




  parseMetadata(metadata) {
  
      var a = [];

      jQuery.each(metadata, function(i,v){

	  var label = "";
	  var value = "";

	  if(typeof v.label === "object") { 
	     var x = Object.values(v.label)[0];
	     if(typeof x == 'object') { label = Object.values(x)[0]; }
	     else{ label = x; }
	  }
	  else if(typeof v.label === "array") { label = v.label[0]; }
	  else if(typeof v.label === "string") { label = v.label; }
	  else { label = ""; }

	  if(typeof v.value === "object") { 
	     var x = Object.values(v.value)[0];
	     if(typeof x == 'object') { value = Object.values(x)[0]; }
	     else{ value = x; }
	  }
	  else if(typeof v.value === "array") { value = v.value[0]; }
	  else if(typeof v.value === "string") { value = v.value; }
	  else { value = ""; }
          
          
          var r = { "label": label, "value": value }
  	  a.push(r);
      });

      return a;
  }
  
  
  /************************************
  * 
  *************************************/
  getCanvasThumbnail (canvas, width, height) {
    if(canvas.thumbnail == null) {
      if(canvas.images == null) { 
         return "/assets/images/placeholder.jpg";
      }
      else {
         var thumbnail = canvas.images[0].resource.service['@id']+"/full/150,/0/default.jpg";
      }
    }
    else {
         if (typeof canvas.thumbnail === "string") { var thumbnail = canvas.thumbnail; }
		 
         else if (typeof canvas.thumbnail === "object") {
             if(this.version==2) {
	       var thumbnail = canvas.thumbnail["@id"];
	      }
	      else {
	       var thumbnail = canvas.thumbnail[0]["id"]+"/full/!"+width+", "+height+"/0/default.jpg";
	      }
         }  
    }
   return thumbnail;   
   } 
   




   buildGallery() {
      jQuery("#gallery").empty();
   
      for (const image of this.images) {
	var item = document.createElement('li');
	item.className = "gallery-item";
	item.setAttribute("data-manifest", this.url);
	item.setAttribute("data-service", image.service);
	item.setAttribute("data-type", image.type);
	var html = "";
	html += "  <img alt='"+image.label+"' src='"+image.thumb+"'/>";
	html += "  <div class='gallery-item-label'>"+image.label+"</div>";
	item.innerHTML = html;
	this.gallery.appendChild(item);
    }
   }
  
}
