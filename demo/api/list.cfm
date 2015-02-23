<cfscript>

	// Set up the response structure.
	response.data = [];

	// Add each image to the response.
	for ( image in application.images.getImages() ) {

		// NOTE: While we are always generating a URL to the image, it doesn't necessarily
		// mean that the image can be reached; availability is determined by isFileAvailable.
		arrayAppend(
			response.data,
			{
				"id" = image.id,
				"clientFilename" = image.clientFilename,
				"fileExtension" = image.fileExtension,
				"mimeType" = image.mimeType,
				"isFileAvailable" = image.isFileAvailable,
				"createdAt" = image.createdAt,
				"updatedAt" = image.updatedAt,
				"imageUrl" = application.storageService.getImageUrl( image )
			}
		);

	}

</cfscript>