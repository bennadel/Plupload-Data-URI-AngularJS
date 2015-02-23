<cfscript>
	
	// Require the form fields.
	param name="form.clientFilename" type="string";

	// ------------------------------------------------------------------------------- //
	// ------------------------------------------------------------------------------- //
	
	// This is simply for internal testing so that I could see what would happen when
	// our save-request would fail.
	if ( reFind( "fail", form.clientFilename ) ) {

		throw( type = "App.Forbidden" );

	}

	// ------------------------------------------------------------------------------- //
	// ------------------------------------------------------------------------------- //

	// Create the image record. This does not save the binary file - this only prepares the
	// record that the binary will be associated with. The file will ultimately be uploaded
	// by the client, directly to S3.
	imageID = application.images.addImage( form.clientFilename );

	// Get the new image record.
	image = application.images.getImage( imageID );

	// Now that we have the image record, we have to prepare the upload policy, signature, 
	// and data that will allow the client (Plupload in this case) do upload the file 
	// directly to Amazon S3 without using our server as a proxy.
	// --
	// Returns:
	// - url : String. I am the form post action.
	// - data : Struct. I am the form data (that can be safely appended to the form post).
	// --
	// CAUTION: The upload policy is tightly coupled to Plupload and includes the allowance
	// of form entries that we know Plupload is going to include. This method cannot be used
	// to generate a "generic" policy.
	uploadSettings = application.storageService.getUploadSettings( image );

	// Prepare API response.
	// --
	// NOTE: We are providing an imageUrl, but the binary has not yet been uploaded and therefore
	// not yet available. However, after the client uploads it, the imageUrl should be accessible.
	response.data = {
		"image" = {
			"id" = image.id,
			"clientFilename" = image.clientFilename,
			"fileExtension" = image.fileExtension,
			"mimeType" = image.mimeType,
			"isFileAvailable" = image.isFileAvailable,
			"updatedAt" = image.updatedAt,
			"imageUrl" = application.storageService.getImageUrl( image )
		},
		"uploadSettings" = uploadSettings
	};

</cfscript>