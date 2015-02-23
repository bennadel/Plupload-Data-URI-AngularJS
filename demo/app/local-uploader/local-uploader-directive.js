app.directive(
	"bnLocalUploader",
	function( $q, mOxie, naturalSort ) {

		"use strict";

		// Return the directive configuration.
		return({
			link: link,
			resitrct: "A"
		});


		// I bind the JavaScript events to the local scope.
		function link( scope, element, attributes ) {
			
			// Wiki: https://github.com/moxiecode/moxie/wiki/FileDrop
			var dropzone = new mOxie.FileDrop({
				drop_zone: element[ 0 ]
			});

			// Initialize the dropzone events.
			dropzone.bind( "drop", handleFileDropEvent );
			dropzone.init();

			// When the scope is destroyed, clean up all the bindings.
			scope.$on( "$destroy", handleDestroyEvent );


			// ---
			// PRIVATE METHODS.
			// ---


			// I teardown the dropzone.
			function handleDestroyEvent() {

				// CAUTION: We need these here to prevent memory leaks in Plupload.
				dropzone.removeAllEventListeners();
				dropzone.destroy();
				
				// Clear closed-over variables.
				scope = element = attributes = dropzone = null;

				// Clear closed-over functions.
				handleDestroyEvent = handleFileDropEvent = null;

			}


			// I handle the file-drop event, passing it to the linked handler.
			function handleFileDropEvent( event ) {

				// If the user dropped multiple files, try to order the files using a 
				// natural sort that treats embedded numbers like actual numbers. This 
				// will allow the sort of the overall list to make more sense to the user.
				naturalSort( dropzone.files, "name" );

				// While the calling context is processing the files, we need to indicate
				// that the system is busy.
				element.addClass( "busy" );
				
				// Update the view-model. If successful, returns the promise returned by the
				// file processing method.
				var promise = scope.$apply(
					function updateViewModel() {

						return(
							scope.$eval( 
								attributes.bnLocalUploader,
								{
									files: dropzone.files 
								}
							)
						);

					}
				);

				// When request is finished, reset the state.
				$q.when( promise ).finally(
					function handleFinally() {

						element.removeClass( "busy" );

						// Clear closed-over variables.
						event = promise = null;

					}
				);

			}

		}

	}
);