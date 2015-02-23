// The globalUploader works hand-in-hand with the global-uploader directive. We are using
// Plupload to handle the actual upload of the binaries (using the HTML5 runtime); and, 
// Plupload needs a DOM element in order to render the runtime. As such, we can't keep the
// entirety of the process inside the service (as we'd like) - it necessarily has to be 
// part in the service, part in the directive. In order to cross that divide, we'll be 
// using events emitted on the $rootScope.
// --
// Emits: globalUploader.fileReadyForUpload
// Expects: globalUploader.fileUploaded
// Expects: globalUploader.fileFailed
// --
// NOTE: We're using $emit() instead of $broadcast() as there is no need for the event to
// travel down through the Scope tree - only the uploader needs to know about it.
app.service(
	"globalUploader",
	function( $rootScope, $q, mOxie, _ ) {

		"use strict";

		// I maintain the collection of pending items, indexed by ID of the file.
		var pandingUploads = {};

		// When the directive has finished uploading the file, it will emit the fileUploaded
		// event, at which point we can remove the given file from our queue.
		$rootScope.$on( "globalUploader.fileUploaded", handleFileUploadedEvent );

		// If the file failed to uploaded, the uploader will emit the fileFailed event.
		$rootScope.$on( "globalUploader.fileFailed", handleFileFailedEvent );

		// Return the public API.
		return({
			uploadFile: uploadFile
		});


		// ---
		// PUBLIC METHODS.
		// ---


		// I upload the file to the given url using the given form data. I return a 
		// promise that will be resolved once the file is uploaded. If the "notifyOnDataUri"
		// parameter is provided, the base64-encoded data-uri will be extracted from the 
		// file and passed to the "notify" handler.
		function uploadFile( file, url, data, notifyOnDataUri ) {

			// Create the pending item.
			var item = pandingUploads[ file.uid ] = {
				file: file,
				url: url,
				data: data,
				deferred: $q.defer()
			};

			// Tell the directive (which manages the actual file transfer) that the file 
			// is ready for upload.
			$rootScope.$emit( "globalUploader.fileReadyForUpload", file, url, data );

			// If the calling context wants to get the data-uri, make it available as the
			// notify event on the deferred value.
			if ( notifyOnDataUri ) {

				extractDataUri( item.file, item.deferred.notify );
				
			}

			// Return the promise that will track the file during the upload process.
			return( item.deferred.promise );

		}


		// ---
		// PRIVATE METHODS.
		// ---


		// I extract the base64-encoded data-uri from the given file and pass it to the 
		// given callback. 
		// --
		// NOTE: This is intended to be used for Images only.
		function extractDataUri( file, callback ) {

			// Create an instance of the mOxie Image object. This utility object provides
			// several means of reading in and loading image data from various sources.
			// --
			// Wiki: https://github.com/moxiecode/moxie/wiki/Image
			var image = new mOxie.Image();
			
			// Define the onload BEFORE you execute the load() command as load() does not
			// execute asynchronously. 
			image.onload = function() {
			
				callback( image.getAsDataURL() );

				// Tear-down the image object to free up memory.
				image.destroy();

				// Clear the closed-over variables.
				file = callback = image = null;
			
			};
			
			image.load( file );

		}


		// I handle the upload-failure event emitted by the global uploader directive (and
		// Plupload). In this case, the promise associated with the upload is rejected.
		function handleFileFailedEvent( event, file ) {

			var item = pandingUploads[ file.uid ];

			item.deferred.reject();

			delete( pandingUploads[ file.uid ] );

		}


		// I handle the upload-completion event emitted by the global uploader directive 
		// (and Plupload). In this case, the promise associated with the upload is resolved.
		function handleFileUploadedEvent( event, file ) {

			var item = pandingUploads[ file.uid ];

			item.deferred.resolve();

			delete( pandingUploads[ file.uid ] );

		}

	}
);