
  var images = [];
  var label = "";
  var metadata = [];
  var manifests = {};
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
  function load(url) {

    //jQuery("#gallery").empty();
    images = [];

    // UCLA has an 'ark:' in their urls that need to be encoded
    url = url.replace(/ark:\/(.*?)\//,function(r,a){ return "ark%3A%2F"+a+"%2F"});

    // if this is an Internet Archive URL
    // convert it to a manifest
    if(url.indexOf("archive.org") > 0 && url.indexOf("details") > 0) { url = internetArchive2Manifest(url);   }    

    // if this is a Wikimedia Commons URL
    // convert it to a manifest
    if(url.indexOf("commons.wikimedia.org") > 0 && url.indexOf("File:") > 0) { url = wikimediaCommons2Manifest(url);   }   

    // if this is a IIIF image url, parse it
    console.log(url.search(/\/([0-9]{1,3})\/(color|gray|bitonal|default)\.(png|jpg)/));
    if(url.search(/\/([0-9]{1,3})\/(color|gray|bitonal|default)\.(png|jpg)/) > 0) { console.log("here"); parseSingleImage(url);  }
    else {

			    const vault = new IIIFVault.Vault();
			    vault.loadManifest(url).then(async (manifest) => {

			      var label = getFirstValue(manifest.label);


			      if(typeof manifest.metadata != undefined) {
			      manifest.metadata.forEach(function(meta){
			        var meta_label = getFirstValue(meta.label);
			        var meta_value = getFirstValue(meta.value);
			        metadata.push({'label':meta_label, 'value': meta_value });
			      });
			      }
			      
			      var o = {'label':label,'metadata':metadata}
			      manifests[url] = o;

			      
			      var items = vault.get(manifest.items);

			      var type = manifest.type;
			      
			      switch(type){
			      
			        case 'Collection':
			        items.forEach(function(item) {
				    load(item.id);
				});
			        break;
			        
			        case 'Manifest':

			          var items = vault.get(items);

			          items.forEach((it) => {
			            var canvas = it.id;
			            var label = getFirstValue(it.label);
			            var service = "error";
			            if(it.items[0]) {
			              var i = vault.get(it.items[0]);
			              if(i.items[0]) {
			                var j = vault.get(i.items[0]);
			                if(j.body[0]) {
			                  var k = vault.get(j.body[0]);
			                  if(k.service != undefined) {
			                     service = k.service[0]['@id'];
			                     if(!service) {
			                         service = k.service[0]['id'];
			                     }
			                  }
			                  console.log(k);
			                }
			              }
			            }
			            // remove trailing slash from service url if necessary
			            service = service.replace(/\/$/, "");
			            var x = {'service':service, 'manifest': url, 'canvas': canvas, 'label': label}
			            images.push(x);

			          });

				  buildGallery(url);
			        break;
			      
			      }
			      
			      });
     
          submitted = 1;
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
  
  

  /************************************
  * 
  *************************************/
  function parseSingleImage(url) {
    
      // image parse
      var s = url.split("/").slice(0,-4);
      
      var id = s.join("/");
      // initialize an object that will contain info
      var o = {'label':'', 'metadata':[], 'images':[] }
      o.label = "No title";
      var i = {'manifest':'','canvas':'','service':id,'label':''}
      images.push(i);
      manifests[id] = o;
      current_id = id;
      buildGallery(id);
  }
  



   

  
  function buildGallery(id) {
  
    if(submitted == 1) {
       jQuery("#gallery").empty();
       submitted = 0;
    }
    
    var html = "<div>";
    html += "<p class='gallery-manifest-label'>"+manifests[id].label+"</p>";
    html += "<ul>";

    jQuery.each(images, function(i,v){ 
      if(v.service != 'error') {
         html += "<li class='gallery-item' data-manifest='"+v.manifest+"' data-canvas='"+v.canvas+"' data-service='"+v.service+"' alt='image "+i+"'><img alt='"+v.label+"' src='"+v.service+"/full/,200/0/default.jpg'/><div class='gallery-item-label'>"+v.label+" </div></li>";
      }
      else {
         html += "<li class='gallery-item' data-manifest='"+v.manifest+"' data-canvas='"+v.canvas+"' data-service='"+v.service+"' alt='image "+i+"'><div class='gallery-item-label'>"+v.label+" </div></li>";
      }
    }); 
    html += "</ul>";
    html += "</div>";
    jQuery("#gallery").append(html);
    images = [];
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
  
  
  
