app.controller(
	"DetailController",	
	function( $scope, $exceptionHandler, imageService, dataUriCache ) {

		// I am the image object that is being viewed.
		$scope.image = null;

		// Load the image data from the server.
		loadRemoteData();


		// ---
		// PRIVATE METHODS.
		// ---


		// I apply the remote data to the local view-model.
		function applyRemoteData( image ) {

			$scope.image = augmentImage( image );

			// Just because we have the image, it doesn't mean that remote image binary
			// is actually available. But, we may have a data-uri version of it cached 
			// locally. In that case, let's consume the data-uri as the imageUrl, which
			// will allow us to render the image immediately.
			if ( dataUriCache.has( image.imageUrl ) ) {

				// The data-uri cache has two modes of access: either you get the data-
				// uri; or, you get the data-uri and the remote object is loaded in the
				// background. We only want to use "replace" if we know that the remote
				// image is available; otherwise, we run the risk of caching the wrong
				// binary in the browser's cache.
				if ( image.isFileAvailable ) {

					// Get the data-uri and try to load the remote object in parallel.
					// --
					// NOTE: Once the remote object is loaded, the data-uri cache is
					// automatically flushed.
					image.imageUrl = dataUriCache.replace( image.imageUrl );

				} else {

					// Just get the data-uri - don't try to load the remote binary; this
					// will allow the data-uri to stay in-memory for a bit longer.
					image.imageUrl = dataUriCache.get( image.imageUrl );

					// Since we're using the data-uri in lieu of the remote image, we can
					// flag the file as available.
					image.isFileAvailable = true;

				}				

			}

		}


		// I add the additional view-specific data to the image object.
		function augmentImage( image ) {

			var createdAt = new Date( image.createdAt );

			// Add a user-friendly data label for the created timestamp.
			image.dateLabel = ( 
				createdAt.toDateString().replace( /^(Sun|Mon|Tue|Wen|Thr|Fri|Sat)/i, "$1," ) +
				" at " +
				createdAt.toTimeString().replace( / GMT.+/i, "" )
			);

			return( image );

		}


		// I load the selected image from the remote resource.
		function loadRemoteData() {

			// CAUTION: Inherited property - selectedImageID.
			imageService.getImage( $scope.selectedImageID )
				.then(
					function handleGetImagesResolve( response ) {

						applyRemoteData( response );

					},
					function handleGetImagesReject( error ) {

						console.warn( "Image data could not be loaded." );

						// CAUTION: Inherited method.
						$scope.closeImage();

					}
				)
			;

		}

	}
);
