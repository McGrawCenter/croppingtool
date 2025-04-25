class AnnotationPage {

  constructor(items) {
    this.items = items;
  }
  
  
  create() {
  
       var annotationPage = {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "http://example.org/page1",
        "type": "AnnotationPage",
        "items": []
       };  
       
    for (let item in this.items) {
       
       var coords = this.items[item].region.split(",");
       var box = [
    	     coords[0]+","+coords[1],
    	     (parseInt(coords[0])+parseInt(coords[2]))+","+coords[1],
    	     (parseInt(coords[0])+parseInt(coords[2]))+","+(parseInt(coords[1])+parseInt(coords[3])),
    	     coords[0]+","+(parseInt(coords[1])+parseInt(coords[3]))
       ]

       var path = "M"+box[0]+"L"+box[1]+"L"+box[2]+"L"+box[3]+"Z";
          
     
       var annotation = {
	  "id": "9879sd87f-s9d87fs9d6f-s96dfs96d",
	  "type": "Annotation",
	  "body": [
	  {
	    "type": "Image",
	    "value": this.items[item].large
	  },
	  {
	    "type": "TextualBody",
	    "value": ""
	  }],
	  "motivation": "commenting",
	  "target": {
	    "source": {
	      "id": this.items[item].canvas,
	      "type": "Canvas",
	      "partOf": {
		"id": this.items[item].manifest,
		"type": "Manifest"
	      }
	    },
	    "selector": [
	      {
		"type": "FragmentSelector",
		"value": "xywh="+this.items[item].region
	      },
	      {
		"type": "SvgSelector",
		"value": "<svg xmlns='http://www.w3.org/2000/svg'><path xmlns='http:www.w3.org/2000/svg' d='"+path+"' fill='none' stroke='#00bfff' stroke-width='10'/></svg>"
	      }
	    ]
	  }
	};
       
       annotationPage.items.push(annotation);
       
    }

      console.log(annotationPage);
  }
  
  convertRegionToSVGPath(region) {
       var coords = region.split(",");
       var box = [
    	     coords[0]+","+coords[1],
    	     (parseInt(coords[0])+parseInt(coords[2]))+","+coords[1],
    	     (parseInt(coords[0])+parseInt(coords[2]))+","+(parseInt(coords[1])+parseInt(coords[3])),
    	     coords[0]+","+(parseInt(coords[1])+parseInt(coords[3]))
       ]

       return path = "M"+box[0]+"L"+box[1]+"L"+box[2]+"L"+box[3]+"Z";  
  }
  
}
