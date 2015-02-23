// While the Global Uploader directive manages the view, it also provides the actual file
// transfer logic using the Plupload HTML5 runtime. Since the HTTP transfer is something 
// that should normally be part of the "service layer", we have to think about this 
// directive much like an extension of the service. Plupload requires the DOM to generate
// the runtime, which is why we can't stuff more of this in the service. Communication 
// with the  globalUploader service takes place using events emitted on the $rootScope.
// --
// Emits: globalUploader.fileUploaded
// Emits: globalUploader.fileFailed
// Expects: globalUploader.fileReadyForUpload
// --
// NOTE: We're using $emit() instead of $broadcast() as there is no need for the event to
// travel down through the Scope tree - only the uploader needs to know about it.
app.directive(
	"bnGlobalUploader",
	function( $rootScope, plupload, globalUploader ) {

		"use strict";

		// I return the directive configuration.
		// --
		// We are creating a child-scope since we are exposing the Plupload uploader 
		// queue on the scope to help render the UI.
		return({
			link: link,
			resitrct: "A",
			scope: true
		});


		// I bind the JavaScript events to the local scope.
		function link( scope, element, attributes ) {

			// These are not actually used by the UI - we just need the container and 
			// button to be able to fully initialize the runtime. All interaction will
			// actually be done through the dropzones distributed throughout the 
			/// application (which announce file-events).
			element.append(
				"<div id='m-global-uploader-container'>\
					<div id='m-global-uploader-button'>\
						<br />\
					</div>\
				</div>"
			);
			
			// Instantiate the Plupload uploader.
			var uploader = new plupload.Uploader({

				// For this demo, we're only going to use the html5 runtime. I don't 
				// want to have to deal with people who require flash - not this time, 
				// I'm tired of it; plus, much of the point of this demo is to work with
				// the drag-n-drop, which isn't available in Flash.
				runtimes: "html5",

				// Upload the image to the remote end-point - this will be defined on a 
				// per-file basis as files are added to the globalUploader service. But,
				// we have to provide something now or the uploader won't initialize properly.
				// --
				// NOTE: The uploader needs to be defined with a non-empty string.
				url: "about:blank",

				// Set the name of file field (that contains the upload).
				file_data_name: "file",

				// The container, into which to inject the Input shim.
				// --
				// NOTE: For this demo, these are throw-away items just needed to get the
				// uploader to initialize. All interaction will be performed programmtically.
				container: "m-global-uploader-container",

				// The ID of the drop-zone element.
				// --
				// NOTE: For this demo, these are throw-away items just needed to get the
				// uploader to initialize. All interaction will be performed programmtically.
				drop_element: "m-global-uploader-button",

				// To enable click-to-select-files, you can provide a browse button. We
				// don't actually use the button in this demo; but, the uploader won't 
				// initialize properly unless there is a button. For us, we're delegating
				// it to a 1x1 pixel offscreen.
				browse_button: "m-global-uploader-button",

				// We don't have any parameters yet; they will be provided on a per-file
				// basis, in the BeforeUpload event.
				multipart_params: {}

			});

			// Set up the higher-precedence event handlers and initialize the plupload 
			// runtime. By binding these prior to .init(), it means that our event handlers
			// will execute before the internal event handlers. This is critical for 
			// BeforeUpload as we need a chance to update settings and [possibly] cancel 
			// the upload.
			uploader.bind( "PostInit", handleInitEvent );
			uploader.bind( "BeforeUpload", handleBeforeUploadEvent );
			uploader.init();
			
			// Bind the lower-precedence event handlers - for these, we want the internal 
			// event handlers to fire first.
			uploader.bind( "FilesAdded", handleFilesAddedEvent );
			uploader.bind( "FilesRemoved", handleFilesRemovedEvent );
			uploader.bind( "UploadProgress", handleUploadProgressEvent );
			uploader.bind( "FileUploaded", handleFileUploadedEvent );

			// CAUTION: We have to bind our error handler AFTER the .init() method so that
			// Plupload has a chance to bind its own error handler. If we bind ours first, 
			// and then we remove the file from the queue within our own error handler, it
			// causes the internal error handler to inappropriately cancel the upload of 
			// the last file. The race condition is that when we explicitly remove the file
			// from the queue, it synchronously makes a call to upload the NEXT file before 
			// the internal error handler has had a chance to execute. As such, when the 
			// internal error handler does execute (after ours), and triggers a 
			// "CancelUpload" event, the XHR object actually points to the "next" file 
			// upload, not the error file upload.
			uploader.bind( "Error", handleErrorEvent );

			// Expose the Plupload uploader queue on the scope. This way, the queue can be
			// rendered by the view. For now, we just going to pass-through the queue; 
			// this can always be refactored later but, for now, it's easy.
			scope.queue = uploader.files;

			// Start watching the for file-ready events (emitted by the globalUploader).
			// --
			// CAUTION: Since this is VIEW is registering event-listeners on the 
			// $rootScope, not on the current scope, it won't get automatically cleaned-
			// up when the scope is destroyed. As such, when this local scope receives 
			// the $destroy event, we need to de-register this handler (not shown in 
			// this demo, though, since the View never disappears).
			var stopWatchingRootScope = $rootScope.$on( "globalUploader.fileReadyForUpload", handleFileReadyForUploadEvent );


			// ---
			// PRIVATE METHODS.
			// ---


			// I update the uploader settings for each file before the file is uploaded.
			// This allows each HTTP request to be hand-crafted for the current file.
			function handleBeforeUploadEvent( uploader, file ) {

				// Get the settings from the file object (which we injected before adding 
				// the file to the uploader queue).
				var settings = file.uploadSettings;
				
				// Prepare the uploader configuration for this specific file.
				uploader.settings.url = settings.url;
				uploader.settings.multipart_params = settings.multipart_params;
				
			}


			// I handle any errors during the initialization or uploading process.
			function handleErrorEvent( uploader, event ) {

				// If the "file" property exists, the error is related to a file. Since
				// we don't have any file filters, we'll just assume the error is do to
				// and upload issue - and we'll remove the file from the uploader.
				if ( event.file ) {

					// We're going to tell the globalUploader about the failure, so we
					// need to get the underlying file that the globalUploader will have
					// a reference to.
					var source = event.file.getSource();

					scope.$evalAsync(
						function updateViewModel() {

							$rootScope.$emit( "globalUploader.fileFailed", source );

							// Clear the closed-over variables.
							uploader = event = source = null;

						}
					);

					uploader.removeFile( event.file );

				}

			}


			// I handle files that have been added to the uploader.
			function handleFilesAddedEvent( uploader, files ) {

				// NOTE: Since the queue is exposed on the scope, all we have to do is
				// trigger a digest so that the view-model changes will take effect.
				scope.$evalAsync();

				// Start the uploader to process the new files.
				// --
				// NOTE: We can call this multiple times without a problem. Internally,
				// the uploader will ignore this request if the uploader is already 
				// in an uploading state.
				uploader.start();

			}


			// I handle file-ready events emitted by the globalUploader service - the 
			// file is queued up in Plupload.
			function handleFileReadyForUploadEvent( event, file, url, data ) {

				// To make the settings easier to reference during the upload life-cycle,
				// wrap the file in a Plupload file (which is what Plupload uses, 
				// internally, when we add it to the queue) and then tack them on to the 
				// result file. This way, we can read them right no the file later on.
				var wrappedFile = new plupload.File( file );

				// Attach settings.
				wrappedFile.uploadSettings = {
					url: url,
					multipart_params: angular.copy( data )
				};

				// Add the wrapped file to the uploader.
				uploader.addFile( wrappedFile );

			}


			// I handle files that have been removed from the uploader.
			function handleFilesRemovedEvent( uploader, files ) {

				// We need to let the view know that the queue has been updated.
				scope.$evalAsync();
				
			}


			// I handle a file that has been successfully uploaded to the remote end-point.
			function handleFileUploadedEvent( uploader, file, response ) {

				// Get the original, underlying file associated with the file-ready event.
				var source = file.getSource();

				// Once the file has been uploaded, we have to explicitly remove it from 
				// the uploader queue, otherwise it will be "re-queued" after the entire
				// queue has been processed.
				uploader.removeFile( file );

				// Update the view-model.
				scope.$evalAsync(
					function updateViewModel() {

						// Tell the globalUploader that the file upload has completed.
						$rootScope.$emit( "globalUploader.fileUploaded", source );

						// Clear the closed-over variables.
						uploader = file = response = source = null;

					}
				);

			}


			// I handle the uploader after it has been initialized.
			function handleInitEvent( uploader ) {

				console.info( "Global uploader initialized." );

			}


			// I handle the file progress events during the upload process.
			function handleUploadProgressEvent( uploader, file ) {

				// NOTE: Since the queue is exposed on the scope, all we have to do is
				// trigger a digest so that the view-model changes will take effect.
				scope.$evalAsync();

			}

		}

	}
);