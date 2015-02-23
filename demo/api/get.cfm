<cfscript>
	
	// I am the ID of the image being retrieved.
	param name="url.id" type="numeric";

	image = application.images.getImage( url.id );

	// Prepare API response.
	// --
	// NOTE: While we are always generating a URL to the image, it doesn't necessarily
	// mean that the image can be reached; availability is determined by isFileAvailable.
	response.data = {
		"id" = image.id,
		"clientFilename" = image.clientFilename,
		"fileExtension" = image.fileExtension,
		"mimeType" = image.mimeType,
		"isFileAvailable" = image.isFileAvailable,
		"createdAt" = image.createdAt,
		"updatedAt" = image.updatedAt,
		"imageUrl" = application.storageService.getImageUrl( image )
	};

</cfscript>