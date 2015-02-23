component
	output = false
	hint = "I model the collection of images. NOTE: Image storage and URLs are managed outside of this model."
	{

	// I provide constants that allow the calling context to be more readable (instead 
	// of just having true / false in the method invocation).
	this.AVAILABLE = true;
	this.UNAVAILABLE = false;


	/**
	* I manage the collection of images in the repository. When an image is added to 
	* the collection, it is assumed by default that the physical file storage of said
	* image is an asynchronous process. Once the physical file has been stored, you need
	* to explicitly set the file-availability.
	* 
	* CAUTION: Since we are dealing with an in-memory repository, as opposed to an 
	* interface to a database, all objects are returned as deep-copies so that the 
	* calling code cannot accidentally mutate the image cache without going through the
	* image service.
	* 
	* @output false
	*/
	public any function init() {

		// I keep track of the unique IDs of the image records.
		autoIncrementer = 0;

		// I hold the images, in ascending upload order.
		images = [];

		return( this );

	}


	// ---
	// PULIC METHODS.
	// ---


	/**
	* I add the given image to the collection. I return the ID of the image. If the mime-
	* type is omitted, it will be calculated based on the filename. If the file availability
	* is omitted, it will be assumed to be false until explicitly toggled.
	*  
	* @clientFilename I am the filename as it appeared on the user's computer.
	* @mimeType I am the mime-type of the file.
	* @isFileAvailable I determine if the physical file is accessible to the application.
	* @output false
	*/
	public numeric function addImage( 
		required string clientFilename,
		string mimeType = "",
		boolean isFileAvailable = false
		) {

		// Extract meta data from filename. 
		var fileExtension = getFileExtension( clientFilename );

		// If the mime-type was omitted, calculate it (best guess from filename).
		if ( ! len( mimeType ) ) {

			mimeType = getMimeType( fileExtension );

		}

		var image = {
			id = ++autoIncrementer,
			clientFilename = clientFilename,
			fileExtension = fileExtension,
			mimeType = mimeType,
			isFileAvailable = isFileAvailable,
			createdAt = getTickCount(),
			updatedAt = getTickCount()
		};

		arrayAppend( images, image );

		return( image.id );

	}


	/**
	* I delete the image with the given ID. If the image could not be found, an error
	* is thrown.
	* 
	* @id I am the unique ID of the image to delete.
	* @output false
	*/
	public void function deleteImage( required numeric id ) {
		
		for ( var i = 1 ; i <= arrayLen( images ) ; i++ ) {

			if ( images[ i ].id == id ) {

				arrayDeleteAt( images, i );

				// The image has been deleted - nothing more to do.
				return;

			}

		}

		// If we made it this far, the image could not be found.
		throw( type = "App.NotFound" );

	}


	/**
	* I get the image with the given ID. If the image cannot be found, an error 
	* is thrown.
	* 
	* @id I am the unique ID of the image.
	* @output false
	*/
	public struct function getImage( required numeric id ) {

		for ( var image in images ) {

			if ( image.id == id ) {

				// Return a copy of the image so as not to break encapsulation.
				return( duplicate( image ) );

			}

		}

		// If we made it this far, the image couldn't be found.
		throw( type = "App.NotFound" );

	}


	/**
	* I get all of the image (in uploaded order).
	* 
	* @output false
	*/
	public array function getImages() {

		// Return a copy of the images so as not to break encapsulation.
		return( duplicate( images ) );

	}


	/**
	* I set the file availability of the physical file associated with the given image.
	* 
	* @id I am the unique ID of the image to update.
	* @isFileAvailable I flag whether or not the physical file is available.
	* @output false
	*/
	public void function setFileAvailability( 
		required numeric id,
		required boolean isFileAvailable
		) {

		for ( var image in images ) {

			if ( image.id == id ) {

				image.isFileAvailable = isFileAvailable;
				image.updatedAt = getTickCount();
				return;

			}

		}

		// If we made it this far, the image couldn't be found.
		throw( type = "App.NotFound" );

	}


	// ---
	// PRIVATE METHODS.
	// ---


	/**
	* I extract the file extension from the given filename. The file extensions is
	* always returned in lowercase.
	* 
	* @filename I am the filename for the image.
	* @output false
	*/
	private string function getFileExtension( required string filename ) {

		return( lcase( listLast( filename, "." ) ) );

	}


	/**
	* I return the best-guess mime-type associated with the given file extension.
	* 
	* @fileExtension I am the file extension used to calculate the mime-type.
	* @output false
	*/
	private string function getMimeType( required string fileExtension ) {

		switch ( fileExtension ) {
			case "jpg":
				return( "image/jpeg" );
			break;
			case "gif":
			case "jpeg":
				return( "image/#fileExtension#" );
			break;
			default:
				return( "application/octet-stream" );
			break;
		}

	}

}