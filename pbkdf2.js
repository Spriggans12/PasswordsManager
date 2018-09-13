const crypto = require("crypto");

module.exports = function(password, salt, iterations, keylen, digest) {
	return new Promise(function(resolve, reject) {
		crypto.pbkdf2(password, salt, iterations, keylen, digest, function(error, key) {
			if (error) {
				reject("ERROR in pdkbf2");
			} else {
				resolve(key.toString("hex"));
			}
		});
	});
}