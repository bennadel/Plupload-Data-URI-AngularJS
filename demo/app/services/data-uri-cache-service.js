app.factory(
	"dataUriCache",
	function( $timeout ) {

		// I store the cached data-uri values. Each value is intended to be cached at a
		// key that represents the remote URL for the data item. 
		var cache = {};

		// I define the time (in milliseconds) that a cached data-uri before it is 
		// automatically flushed from the memory.
		var cacheDuration = ( 120 * 1000 );

		// I store the eviction timers for the cached data-uri. 
		var timers = {};

		// Return the public API.
		return({
			set: set,
			get: get,
			has: has,
			remove: remove,
			replace: replace
		});


		// ---
		// PUBLIC METHODS.
		// ---


		// I cache the given data-uri under the given key (which is intended to be a URL
		// that represents the remote version of the data).
		// --
		// CAUTION: The data is not kept around indefinitely; once cached, it will be 
		// flushed from the cache within a relatively short time period. This way, the 
		// browser doesn't get bloated with data that is not going to be accessed.
		function set( key, dataUri ) {
			
			// Normalize the key so we don't accidentally conflict with built-in object
			// prototype methods and properties.
			cache[ key = normalizeKey( key ) ] = dataUri;

			$timeout.cancel( timers[ key ] );

			timers[ key ] = $timeout(
				function clearCache() {

					console.warn( "Expiring data-uri for %s", key );

					delete( cache[ key ] );

					// Clear the closed-over variables.
					key = dataUri = null;

				},
				cacheDuration,

				// Don't trigger digest - the application doesn't need to know about
				// this change to the data-model.
				false
			);

			return( dataUri );

		}


		// I get the data-uri cached at the given key.
		// --
		// NOTE: Returns NULL if not defined.
		function get( key ) {

			return( cache[ normalizeKey( key ) ] || null );

		}


		// I determine if a data-uri is cached at the given key.
		function has( key ) {

			return( normalizeKey( key ) in cache );

		}


		// I remove the data-uri cached at the given key.
		function remove( key ) {

			console.warn( "Evicting data-uri for %s", key );

			$timeout.cancel( timers[ key = normalizeKey( key ) ] );

			delete( cache[ key ] );

		}


		// I return the data-uri cached at the given key. But, the remote object, 
		// represented by the cache-key (which is intended to be a URL) is loaded in the
		// background. When (and if) the remote image is loaded, the cached data-uri is
		// evicted from the cache.
		function replace( key ) {

			loadRemoteObject( key );

			return( get( key ) );

		}


		// ---
		// PRIVATE METHODS.
		// ---


		// I load the remote object represented by the given key (which is intended to be
		// a URL). This will cache the object in the local browser cache, at which point
		// the data-uri is evicted from the cache.
		function loadRemoteObject( key ) {

			angular.element( new Image() )
				.on(
					"load",
					function handleLoadEvent() {

						console.info( "Remote object loaded at %s", key );

						// Now that the image has loaded, and is cached in the browser's
						// local memory, we can evict the data-uri.
						remove( key );

						// Clear the closed-cover variables.
						key = null;

					}
				)
				.on(
					"error",
					function handleErrorEvent() {
						
						// Clear the closed-cover variables.
						key = null;

					}
				)
				.prop( "src", key )
			;

		}


		// I normalize the given key for use as cache or timer key.
		function normalizeKey( key ) {

			return( "url:" + key );

		}

	}
);