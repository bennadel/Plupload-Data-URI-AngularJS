app.controller(
	"HomeController",	
	function( $scope, $rootScope, $q, imageService, globalUploader, dataUriCache, _ ) {

		// I hold the list of images to render.
		$scope.images = [];

		// I am the ID of the currently-selected image.
		$scope.selectedImageID = null;

		// Pull the list of images from the remote repository.
		loadRemoteData();


		// ---
		// PUBLIC METHODS.
		// ---


		// I close the current image detail.
		$scope.closeImage = function() {

			$scope.selectedImageID = null;

		};


		// I delete the given image.
		$scope.deleteImage = function( image ) {

			$scope.images = _.without( $scope.images, image );

			// NOTE: Assuming no errors for this demo - not waiting for response.
			imageService.deleteImage( image.id );

		};


		// I process the given files. These are expected to be mOxie file objects. I 
		// return a promise that will be done when all the files have been processed.
		$scope.saveFiles = function( files ) {

			var promises = _.map( files, saveFile );

			return( $q.all( promises ) );

		};


		// I open the detail view for the given image.
		$scope.openImage = function( image ) {

			$scope.selectedImageID = image.id;
			
		};


		// ---
		// PRIVATE METHODS.
		// ---


		// I apply the remote data to the local view-model.
		function applyRemoteData( images ) {

			$scope.images = augmentImages( images );

		}


		// I augment the image for use in the local view-model.
		function augmentImage( image ) {

			return( image );

		}


		// I aument the images for use in the local view-model.
		function augmentImages( images ) {

			return( _.each( images, augmentImage ) );

		}


		// I load the images from the remote resource.
		function loadRemoteData() {

			imageService.getImages()
				.then(
					function handleGetImagesResolve( response ) {

						applyRemoteData( response );

					},
					function handleGetImagesReject( error ) {

						console.warn( "Error loading remote data." );

					}
				)
			;

		}


		// I save a file-record with the same name as the given file, then pass the file 
		// on to the application to be uploaded asynchronously.
		function saveFile( file ) {

			var image = null;

			// We need to separate our promise chain a bit - the local uploader only cares 
			// about the image RECORDS that need to be "saved." The local uploader doesn't
			// actually care about the global uploader, as this doesn't pertain to it's
			// view-model / rendered state.
			var savePromise = imageService.saveImage( file.name )
				.then(
					function handleSaveResolve( response ) {

						$scope.images.push( image = augmentImage( response.image ) );

						// NOTE: Pass response through chain so next promise can get at it.
						return( response );

					},
					function handleSaveReject( error ) {

						alert( "For some reason we couldn't save the file, %s.", file.name );

					}
				)
			;

			// Now that we have our "save promise", we can't hook into the global uploader
			// workflow - sending the file to the uploader and then waiting for it to be 
			// done uploading. The global uploader doesn't know files from Adam; as such, 
			// we have to tell what the app to do when the global uploader has finished
			// uploading a file.
			savePromise
				.then(
					function handleSaveResolve( response ) {

						return(
							globalUploader.uploadFile( 
								file,
								response.uploadSettings.url,
								response.uploadSettings.data,

								// Have the uploader extract the data-uri for the image. This
								// will be made avialable in the .notify() handler. If this 
								// is omitted, only the resolve/reject handlers will be called.
								true
							)
						);

					}
				)
				.then(
					function handleUploadResolve() {

						// Once the file has been uploaded, we know that the remote binary 
						// can be reached at the known imageUrl; but, we need to let the 
						// server know that.
						// --
						// NOTE: This could probably be replaced with some sort of t S3 /
						// Simple Queue Service (SQS) integration.
						imageService.finalizeImage( image.id );

						image.isFileAvailable = true;

					},
					function handleUploadReject() {
						
						alert( "For some reason we couldn't upload one of your files." );

					},
					function handleUploadNotify( dataUri ) {

						// The notify event means that the uploader has extracted the image
						// binary as a base64-encoded data-uri. We can use that in lieu of 
						// a remote image while the file is still being uploaded. By sticking
						// this in the dataUriCache() service, we can also use it in the 
						// detail view, if the file still has yet to be uploaded.
						image.imageUrl = dataUriCache.set( image.imageUrl, dataUri );

						// Since we're using the data-uri instead of the imageUrl, we can
						// think of the image as being "available" for our intents and purposes.
						image.isFileAvailable = true;

					}
				)
				.finally(
					function handleFinally() {

						// Clear closed-over variables.
						file = image = promise = null;

					}
				)
			;

			// Return the promise for the initial save - does not include the physical file
			// upload to Amazon S3.
			return( savePromise );

		}

	}
);
