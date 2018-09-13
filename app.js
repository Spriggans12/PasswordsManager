var http = require('http');
var fs = require('fs');
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
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});
var io = require('socket.io').listen(server);

// Local files includes
var database = require('./database');
var security = require('./security');
var pbkdf2 = require('./pbkdf2');

// Logic variables
var allPasswordsList = [];

// Init all the passwords
database.loadAllPasswords(db, data => { allPasswordsList = data; });

// TODO get that from DB ?
var serverSalt = 'agrklrgargjklragbjgrb';



// TEST
var encryptedTest;

// TODO encrypt on client side : '12345' here should be HASH_1
pbkdf2('12345', serverSalt, 10000, 32, 'sha256').then(function(hash2) {
	console.log('hash2 : ' + hash2);
	encryptedTest = security.encrypt('contenu secret', hash2);
	console.log('Encrypted value ' + encryptedTest);
});
// FIN TEST



io.sockets.on('connection', function (socket) {
	initializeSocket(socket);
	
	// Admin connection ask
	socket.on('toserv_askConnection', function(providedPassword) {
		
		// TODO change this
		correctPassword = (providedPassword == '12345');
		
		console.log(decrypt(encryptedTest, providedPassword));
		
		if(correctPassword) {
			socket.status = 'connected';
			socket.emit('tocli_success', 'You are now connected and can edit passwords.');
			socket.emit('tocli_onConnectionOK');
		} else {
			socket.emit('tocli_error', 'The provided password is wrong.');
		}
	});
	
	// Admin disconnection ask
	socket.on('toserv_askDisconnection', function() {
		socket.status = 'disconnected';
		socket.emit('tocli_success', 'You are no longer connected.');
		socket.emit('tocli_onDisconnectionOK');
	});
});






server.listen(8080);

function initializeSocket(socket) {
	socket.status = 'disconnected';
	
	// On connection, give client the passwords list
    socket.emit('tocli_allPasswords', allPasswordsList);
}

// TODO
function decrypt(encryptedData, password) {
	pbkdf2(password, serverSalt, 10000, 32, 'sha256').then(function(hash2) {
		console.log(password + ' HASH2 => ' + hash2);
		console.log(security.decrypt(encryptedData, hash2));
	}).catch(function(err) {
		console.log('not able to connect');
	});
}

function encrypt(plainData) {
	
}