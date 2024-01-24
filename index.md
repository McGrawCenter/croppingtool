---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default
---


<div class="container-fluid">
      <!-- Example row of columns -->
      <div class="row">
        <div class="col-md-3">
          
          	<h2>Exhibits</h2>
          
		<ul class='exhibit-list'>
		{% for exhibit in site.data.exhibits %}
		  <li>
		    <a href="exhibit.html?">{{ exhibit.Title }}</a><div style='font-size:0.8em;'>{{ exhibit.Author }}</div>
		  </li>
		{% endfor %}
		</ul>          
          
        </div>
        <div class="col-md-9">

		{% for exhibit in site.data.exhibits %}
		
			{% assign mod = forloop.index | modulo: 12 %}
			{% assign leftright = forloop.index | modulo: 2 %}
			{% if leftright == 1 %}
			<section class='tile color{{ mod }}' id='exhibit{{ exhibit.ID }}'>
			   <div class='tile-right'><a href="exhibit.html">{{ exhibit.Title }}</a><div style='font-size:0.8em;'>{{ exhibit.Author }}</div></div>
			   <div class='tile-left'><img src='{{site.url}}/assets/images/placeholder.jpg' style='width:100%'/></div>
			</section> 
			{% endif %} 
			{% if leftright == 0 %}
			<section class='tile color{{ mod }}' id='exhibit{{ exhibit.ID }}'>
			   <div class='tile-left'><img src='{{site.url}}/assets/images/placeholder.jpg' style='width:100%'/></div>
			   <div class='tile-right'><a href="exhibit.html">{{ exhibit.Title }}</a><div style='font-size:0.8em;'>{{ exhibit.Author }}</div></div>
			</section> 
			{% endif %} 			
		{% endfor %}
		   
       </div>
      
</div>
