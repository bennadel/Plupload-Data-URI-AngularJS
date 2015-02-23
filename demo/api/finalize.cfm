<cfscript>
	
	// I am the ID of the image being finalized.
	param name="form.id" type="numeric";

	// Flag the image as having a persisted image file. This means that the client-side
	// code can start to access the imageUrl without fear of 400 Not Found errors.
	// --
	// NOTE: Will throw an error if the image cannot be found.
	application.images.setFileAvailability( form.id, application.images.AVAILABLE );

	// Prepare API response.
	response.data = true;

</cfscript>