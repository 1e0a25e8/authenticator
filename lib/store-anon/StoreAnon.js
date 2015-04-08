define(['store-anon-config', 'jQuery'], function(config, $) {
	return {
		storeObject: function(lookupKey, newObject, encryptionPassphrase) {
			var storeThisObject = {
				storeAnonSecret: this.createSecret(),
				data: newObject
			};

			if (encryptionPassphrase) {
				storeThisObject = this.encryptCleartext(storeThisObject, encryptionPassphrase);
			}

			return this.postNewObject(lookupKey, storeThisObject);
		},

		createSecret: function() {
			return Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
		},

		encryptCleartext: function(clearText, encryptionPassphrase) {
			//put it in a JSON wrapper.
			throw 'bbb todo';
		},

		postNewObject: function(lookupKey, storeThisObject) {
			var deferredResult = $.Deferred();

			var fd = new FormData();
            fd.append('key', lookupKey);
            fd.append('success_action_status', 201);
            fd.append('Content-Type', 'text/json');
            fd.append('file', JSON.stringify(storeThisObject));

			var xhr = new XMLHttpRequest;
            xhr.open('POST', config.s3url);
            xhr.onreadystatechange = function(event) {
                if (event.target.readyState === 4) {
	                if (event.target.status !== 201) {
	                	deferredResult.reject("Unsuccessful file upload: " + event.target.status);
	                } else {
	                	var url = (config.readUrl || config.s3url) + lookupKey
	                	deferredResult.resolve(url)
	                }
                }
            }
            var rr = xhr.send(fd);

            console.log("ok, i sent it? %o", rr)

            return deferredResult.promise();
		}
	};
});