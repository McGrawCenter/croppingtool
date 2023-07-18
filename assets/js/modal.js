
jQuery(document).ready(function(){

	var modal = document.getElementById("modal");

	var close = document.getElementsByClassName("modal-close")[0];
	
	

	close.onclick = function() {
	  modal.style.display = "none";
	}
	
	jQuery(".metadata").click(function(e){
	  jQuery("#modal").show();
	  e.preventDefault();
	});

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	  if (event.target == modal) {
	    modal.style.display = "none";
	  }
	} 

});

