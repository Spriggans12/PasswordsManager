var http = require('http');
var path = require("path");
var express = require("express");
var app = express();
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(__dirname + '/config/config.properties');
var pgp = require("pg-promise")({});
// TODO : Sécuriser cette connexion
const cn = {
	host: 'localhost',
	port: 5432,
	database: 'passwords',
	user: 'passwd',
	password: 'passwd'
};
var db = pgp(cn);
var server = http.createServer(app);
var io = require('socket.io').listen(server);
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});


// Local files includes
var database = require('./server/database');
var security = require('./server/security');
var pbkdf2 = require('./server/pbkdf2');

// Logic variables
var allPasswordsList = [];

// Init all the passwords
database.loadAllPasswords(db, data => { allPasswordsList = data; });

var serverSalt = properties.get('server.salt')
var decryptedDummyText = properties.get('security.dummyText');
var encryptedDummyText = properties.get('security.dummyTextEncrypted');

io.sockets.on('connection', function (socket) {
	initializeSocket(socket);
	
	// Admin connection ask
	socket.on('toserv_askConnection', function(providedPassword) {
		// Test the providedPassword
		decrypt(encryptedDummyText, providedPassword, (decryptedData) => {
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
		socket.emit('tocli_success', 'You are no longer connected.');
		socket.emit('tocli_onDisconnectionOK');
	});
	
	// Decrypt one password ask
	socket.on('toserv_decryptPass', function(id, providedPassword) {
		decryptTextIfSocketConnected(getEncryptedDataOfPasswordById(id), socket, providedPassword, (decryptedData) => {
			var data = {
				id: id,
				clearValue: decryptedData
			};
			socket.emit('tocli_decryptedPass', data);
		});
	});
	
	// Encrypts decryptedDummyText using the server salt and the providedPassword. Gives it back to client for console.logging
	socket.on('toserv_encryptStringTest', function(providedPassword) {
		encrypt(decryptedDummyText, providedPassword, (encryptedData) => {
			socket.emit('tocli_encryptStringTestResult', encryptedData);
		});
	});
	
	// Delete one password ask
	socket.on('toserv_deletePassword', function(id) {
		if(socket.status == 'disconnected') {
			socket.emit('tocli_error', 'You are not connected !');
		} else {
			database.removePasswordFromDB(db, id, () => {
				// Reload passwords list
				database.loadAllPasswords(db, data => {
					allPasswordsList = data;
					// Send new password list to client
					socket.emit('tocli_allPasswords', allPasswordsList);
				});
			});
		}
	});
});

server.listen(8080);

function initializeSocket(socket) {
	socket.status = 'disconnected';
	
	// On connection, give client the passwords list
    socket.emit('tocli_allPasswords', allPasswordsList);
}

function getEncryptedDataOfPasswordById(id) {
	var res;
	allPasswordsList.forEach(pass => {
		if(pass.id == id) {
			res = pass.hash;
		}
	});
	return res;
}

function decryptTextIfSocketConnected(encryptedData, socket, providedPassword, callback) {
	if(socket.status == 'disconnected') {
		socket.emit('tocli_error', 'You are not connected !');
		callback();
	} else {
		decrypt(encryptedData, providedPassword, callback);
	}
}

function decrypt(encryptedData, password, callback) {
	pbkdf2(password, serverSalt, 10000, 32, 'sha256').then(function(hash2) {
		var decryptedData = security.decrypt(encryptedData, hash2)
		callback(decryptedData);
	}).catch(function(err) {
		// Wrong password
		callback();
	});
}

function encrypt(plainData, password, callback) {
	pbkdf2(password, serverSalt, 10000, 32, 'sha256').then(function(hash2) {
		var encryptedData = security.encrypt(plainData, hash2);
		callback(encryptedData);
	});
}