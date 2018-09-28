// var http = require('http');
var https = require('https');
var path = require("path");
var fs = require("fs");
var express = require("express");
var app = express();
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(__dirname + '/config/config.properties');
var pgp = require("pg-promise")({});
const cn = {
	host: properties.get('database.host'),
	port: properties.get('database.port'),
	database: properties.get('database.database'),
	user: properties.get('database.user'),
	password: properties.get('database.password')
};
var db = pgp(cn);
var server = https.createServer({
		key: fs.readFileSync('key.pem'),
		cert: fs.readFileSync('cert.pem')
	}, app);
var io = require('socket.io').listen(server);
app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});


// Local files includes
var database = require('./server/database');
var security = require('./server/security');
var pbkdf2 = require('./server/pbkdf2');

// Constants
var NOT_CONNECTED = 'You are not connected !';
var FIELD_MANDATORY = 'This field is mandatory';
var FIELD_TOO_LONG = 'This field is too long';

// Logic variables
var allPasswordsList = [];

// Init all the passwords
database.loadAllPasswords(db, data => { allPasswordsList = data; });

var adminSalt = properties.get('admin.salt')
// TODO : make these roll ?
var decryptedDummyText = properties.get('security.dummyText');
var encryptedDummyText = properties.get('security.dummyTextEncrypted');


///////////////////////////////////
// Requests received from client //
///////////////////////////////////

io.sockets.on('connection', function (socket) {
	initializeSocket(socket);
	
	// Admin connection ask
	socket.on('toserv_askConnection', function(providedPassword) {
		// Test the providedPassword
		decrypt(encryptedDummyText, providedPassword, adminSalt, (decryptedData) => {
			var correctPassword = (decryptedData == decryptedDummyText);
			if(correctPassword) {
				socket.status = 'connected';
				socket.emit('tocli_success', 'You are now connected.');
				socket.emit('tocli_onConnectionOK');
			} else {
				socket.emit('tocli_error', 'The provided password is wrong.');
			}
		});
	});
	
	// Admin disconnection ask
	socket.on('toserv_askDisconnection', function() {
		socket.status = 'disconnected';
		socket.emit('tocli_message', 'You are no longer connected.');
		socket.emit('tocli_onDisconnectionOK');
	});
	
	// Decrypt one password ask
	socket.on('toserv_decryptPass', function(id, providedPassword) {
		decryptTextIfSocketConnected(getEncryptedDataAndSaltOfPasswordById(id), socket, providedPassword, (decryptedData) => {
			var data = {
				id: id,
				clearValue: decryptedData
			};
			socket.emit('tocli_decryptedPass', data);
		});
	});
	
	// Encrypts decryptedDummyText using a random salt and the providedPassword
	// Gives back to the client for console.logging the generated salt and the encryptedDummyText
	socket.on('toserv_encryptStringTest', function(providedPassword) {
		var salt = security.randomBytes();
		encrypt(decryptedDummyText, providedPassword, salt, (encryptedData) => {
			socket.emit('tocli_encryptStringTestResult', { hash: encryptedData, salt: salt });
		});
	});
	
	// Delete one password ask
	socket.on('toserv_deletePassword', function(id) {
		if(socket.status == 'disconnected') {
			socket.emit('tocli_error', NOT_CONNECTED);
		} else {
			database.deletePassword(db, id, () => {
				// Reload passwords list
				database.loadAllPasswords(db, data => {
					allPasswordsList = data;
					// Send new password list to client
					socket.emit('tocli_allPasswords', allPasswordsList);
				});
				socket.emit('tocli_success', 'The password has been removed.');
			});
		}
	});
	
	// Password creation ask
	socket.on('toserv_createPassword', function(data, masterPassword) {
		if(socket.status == 'disconnected') {
			socket.emit('tocli_error', NOT_CONNECTED);
		} else {
			// Test if provided data are correct
			var validation = validatePasswordUpsert(data, true);
			
			if(validation.valid) {
				// Create a random salt and encrypts the pass
				var salt = security.randomBytes();
				encrypt(data.pass, masterPassword, salt, (encryptedPass) => {
					var passwordToCreate = {
						name: data.name,
						salt: salt,
						hash: encryptedPass,
						username: data.username,
						notes: data.notes
					};
					// Persists password to DB
					database.createPassword(db, passwordToCreate, () => {
						// Reload passwords list
						database.loadAllPasswords(db, data => {
							allPasswordsList = data;
							// Send new password list to client
							socket.emit('tocli_allPasswords', allPasswordsList);
						});
						socket.emit('tocli_success', 'The password has been succesfully created.');
					});
				});
			} else {
				socket.emit('tocli_invalidForm', validation.errors);
			}
		}
	});
	
	// Password update ask
	socket.on('toserv_updatePassword', function(data, masterPassword) {
		if(socket.status == 'disconnected') {
			socket.emit('tocli_error', NOT_CONNECTED);
		} else {
			// Test if provided data are correct
			var validation = validatePasswordUpsert(data, false);
			if(validation.valid) {
				var callbackAfterUpdate = function() {
					// Reload passwords list
					database.loadAllPasswords(db, data => {
						allPasswordsList = data;
						// Send new password list to client
						socket.emit('tocli_allPasswords', allPasswordsList);
					});
					socket.emit('tocli_success', 'The password has been succesfully updated.');
				};
				var passwordToUpdate = {
					id: data.id,
					name: data.name,
					username: data.username,
					notes: data.notes
				};
				if(data.pass) {
					// Update the salt and hash as well as password fields
					// Create a random salt and encrypts the pass
					var salt = security.randomBytes();
					encrypt(data.pass, masterPassword, salt, (encryptedPass) => {
						passwordToUpdate.salt = salt;
						passwordToUpdate.hash = encryptedPass;
						// Updates password in DB
						database.updatePassword(db, passwordToUpdate, true, callbackAfterUpdate);
					});
				} else {
					// Only update password fields
					// Updates password in DB
					database.updatePassword(db, passwordToUpdate, false, callbackAfterUpdate);
				}
			} else {
				socket.emit('tocli_invalidForm', validation.errors);
			}
		}
	});
});

server.listen(8000);


/////////////////////////////////
/////////// FUNCTIONS ///////////
/////////////////////////////////

function initializeSocket(socket) {
	socket.status = 'disconnected';
	// On connection, give client the passwords list
    socket.emit('tocli_allPasswords', allPasswordsList);
}

function getEncryptedDataAndSaltOfPasswordById(id) {
	var res;
	allPasswordsList.forEach(pass => {
		if(pass.id == id) {
			res = {
				hash: pass.hash,
				salt: pass.salt
			};
		}
	});
	return res;
}

function decryptTextIfSocketConnected(encryptedDataAndSalt, socket, providedPassword, callback) {
	if(socket.status == 'disconnected') {
		socket.emit('tocli_error', NOT_CONNECTED);
		callback();
	} else {
		decrypt(encryptedDataAndSalt.hash, providedPassword, encryptedDataAndSalt.salt, callback);
	}
}

function decrypt(encryptedData, password, salt, callback) {
	pbkdf2(password, salt, 10000, 32, 'sha256').then(function(hash2) {
		var decryptedData = security.decrypt(encryptedData, hash2)
		callback(decryptedData);
	}).catch(function(err) {
		// Wrong password
		callback();
	});
}

function encrypt(plainData, password, salt, callback) {
	pbkdf2(password, salt, 10000, 32, 'sha256').then(function(hash2) {
		var encryptedData = security.encrypt(plainData, hash2);
		callback(encryptedData);
	});
}

function validatePasswordUpsert(data, creation) {
	var valid = true;
	var errors = [];
	var checkPasswords = creation;
	
	// Update mode : only check passwords if they are provided
	if(!creation) {
		checkPasswords = (data.pass || data.confPass);
	}
	
	// Check mandatory fields
	if(creation && !data.name) {
		valid = pushErrorInvalid(errors, 'name', FIELD_MANDATORY);
	}
	if(checkPasswords) {
		if(!data.pass) {
			valid = pushErrorInvalid(errors, 'pass', FIELD_MANDATORY);
		}
		if(!data.confPass) {
			valid = pushErrorInvalid(errors, 'confPass', FIELD_MANDATORY);
		}
	}
	
	// Check if the two provided passwords match
	if(valid && checkPasswords) {
		if(!(data.pass == data.confPass)) {
			pushErrorInvalid(errors, 'pass');
			valid = pushErrorInvalid(errors, 'confPass', 'The passwords don\'t match');
		}
	}
	
	// Check max Size
	if(data.name.length > 255) {
		valid = pushErrorInvalid(errors, 'name', FIELD_TOO_LONG);
	}
	if(data.username.length > 255) {
		valid = pushErrorInvalid(errors, 'username', FIELD_TOO_LONG);
	}
	if(data.notes.length > 255) {
		valid = pushErrorInvalid(errors, 'notes', FIELD_TOO_LONG);
	}
	
	return {
		valid: valid,
		errors: errors
	};
}

function pushErrorInvalid(errors, name, cause) {
	errors.push({ field: name, cause: cause });
	return false;
}