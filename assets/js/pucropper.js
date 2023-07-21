
  var version = 2;
  var images = [];
  var label = "";
  var metadata = [];

  
  
  

  /************************************
  * 
  *************************************/
  function load(manifest_uri) {
  
    jQuery("#gallery").empty();

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
            } else {
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
  function parsev2Collection (manifest) {
     for(const man of manifest.manifests) {
       var service = man['@id'];
       load(service);
     }
  }
  
  
  /************************************
  * 
  *************************************/
  function parsev2 (manifest) {
  
      metadata = manifest.metadata;
      console.log(metadata);

      if(manifest.label && Array.isArray(manifest.label)) { 
         var label = manifest.label[0];
       }
      else if(typeof manifest.label != 'undefined' && typeof manifest.label === "string") { 
         var label = manifest.label;
      }
      parseMetadata(manifest);
      
      console.log(label);
      
      // thumbnail
      
      if(manifest.thumbnail && typeof manifest.thumbnail === 'object') { 
         var thumbnail = manifest.thumbnail['@id'];
       }
      else if(manifest.thumbnail && typeof manifest.thumbnail === "string") { var thumbnail = manifest.thumbnail; }      
      else {
        var firstcanvas = manifest.sequences[0].canvases[0];
        var thumbnail = getCanvasThumbnail(firstcanvas, 150,150);
      }      

      if(manifest.sequences) {
        var sequences = manifest.sequences;
        for (const sequence of sequences) {
          if ('canvases' in sequence) {
            for (const canvas of sequence.canvases) {
              var thumb = getCanvasThumbnail(canvas, 150,150);
              if(thumb !== false) {
                var label = canvas.label;
              
                //var thumb = canvas.thumbnail['@id'];

                var url = canvas.images[0].resource.service["@id"];
                var o = {}
                o.label = label;
                o.thumb = thumb;
                o.url = url;
                images.push(o);
              }
            }
          }
        }
      }      
      buildGallery();
  }


  /************************************
  * 
  *************************************/
  function parsev3 (manifest) {
  
      metadata = manifest.metadata;
      console.log(metadata);
  
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
      parseMetadata(manifest);
      
      console.log(label);
      
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
            var o = {}
            o.label = label;
            o.thumb = thumb;
            o.url = url;
            images.push(o);
        }
      }      
      buildGallery();
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
   
   
   

  
  function buildGallery() {
    //jQuery("#gallery").empty();
    jQuery.each(images, function(i,v){ 
      jQuery("#gallery").append("<div class='gallery-item' data-service='"+v.url+"'><img src='"+v.thumb+"'/></div>");
    });
    images = [];
  }
  
  
  
  
  
  
  
  function getLabel(manifest) {
    if(typeof manifest.label === "object") { return manifest.label[0]; }
    else if(typeof manifest.label === "array") { return manifest.label[0]; }
    else if(typeof manifest.label === "string") { console.log(manifest.label); }
    else { return "";}
  }
  
  
  
  
  
  function parseMetadata(manifest) {
  
    // first get the label
    if(typeof manifest.label === "object") { label = manifest.label.toString(); }
    else if(typeof manifest.label === "array") { label = manifest.label[0]; }
    else if(typeof manifest.label === "string") { label = manifest.label; }
    
    // then get the metadata
    jQuery.each(manifest.metadata, function(i,v){
	//metadata[v.label.none.toString()] = v.value.none.toString();
    });
    jQuery("#modal").html("<p>"+label+"</p>");
  }
