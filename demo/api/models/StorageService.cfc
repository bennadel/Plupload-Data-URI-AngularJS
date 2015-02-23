component
	output = false
	hint = "I faciliate storage and access of physical image binaries."
	{

	/**
	* I facilitate storage and access of the physical image binaries associated with the
	* ImageCollection. The images are stored on Amazon S3. 
	* 
	* @aS3Lite I am the S3 gateway.
	* @aAccessID I am the Amazon S3 access ID (need for form settings).
	* @aKeyPrefix I define the sub-path at which S3 objects should be stored.
	* @output false
	*/
	public any function init( 
		required any aS3Lite,
		required string aAccessID,
		required string aKeyPrefix
		) {

		// Store private properties.
		s3Lite = aS3Lite;
		accessID = aAccessID;
		keyPrefix = aKeyPrefix;

		return( this );

	}


	// ---
	// PULIC METHODS.
	// ---


	/**
	* I get the pre-signed S3 url for the given Image. The expiration of the URLs is "bucketed"
	* so that not every request for a URL generates a unique URI. This will facilitate caching
	* on the client.
	* 
	* @image I am the Image object for which we are getting a URL.
	* @output false
	*/
	public string function getImageUrl( required struct image ){

		// Get the bucketed date for which URL will be valid.
		var nextYear = createDate( ( year( now() ) + 1 ) , 1, 1 );

		return( s3Lite.getPreSignedUrl( "#keyPrefix#/#image.id#.#image.fileExtension#", nextYear ) );

	}


	/**
	* I get the Form Post upload settings that will enable the client to post the file 
	* directly to Amazon S3 without using our server as a proxy. 
	* 
	* Returns the following data:
	* - url : String. The URL of the form post action.
	* - data : Struct. The data that can be safely appended to the HTTP form data.
	* 
	* CAUTION: Since the upload policy is very tightly coupled to the data that the form
	* post contains, it is necessarily very tightly coupled to Plupload and the idiosyncrasies
	* of the Plupload runtime. This means that we have to remove the generic nature of the 
	* concept and hard-code values that we know Plupload will be sending.
	* 
	* @image I am the Image object whose binary is going to be uploaded.
	* @output false
	*/
	public struct function getUploadSettings( required struct image ) {

		var key = "#keyPrefix#/#image.id#.#image.fileExtension#";

		var formPostSettings = s3Lite.getFormPostSettings(
			dateConvert( "local2utc", dateAdd( "h", 1, now() ) ),
			[
				{
					"acl" = "private"
				},
				{
					"success_action_status" = 201
				},

				// By omitting the "starts-with", we are completely locking down the target
				// S3 location to exactly the defined key. This cuts down on all shenanigans
				// that can possibly be perpetrated on the upload data.
				// --
				// More flexible version: [ "starts-with", "$key", key ]
				[ "eq", "$key", key ], 
				[ "eq", "$Content-Type", image.mimeType ],
				[ "content-length-range", 0, 10485760 ], // 10mb

				// The following keys are ones that Plupload will inject into the form-post
				// across the various environments. As such, we have to account for them in
				// the policy conditions (but keeping the matching very loose).
				[ "starts-with", "$Filename", key ],
				[ "starts-with", "$name", "" ]
			]
		);

		// NOTE: We are quoting the keys here because we know that this data will have to be
		// serialized in the HTTP response. 
		var settings = {
			"url" = formPostSettings.url,
			"data" = {
				"acl" = "private",
				"success_action_status" = 201,
				"key" = key,
				"Filename" = key,
				"Content-Type" = image.mimeType,
				"AWSAccessKeyId"  = accessID,
				"policy" = formPostSettings.policy,
				"signature" = formPostSettings.signature
			}
		};

		return( settings );

	}

}