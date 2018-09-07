var http = require('http');
var fs = require('fs');
var pgp = require("pg-promise")({});
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
var functions = require('./functions');

// Logic variables
var allPasswordsList = [];

// Init all the passwords
functions.loadAllPasswords(db, (data) => { allPasswordsList = data; });

io.sockets.on('connection', function (socket) {
	initializeSocket(socket);
	
	
	
	socket.on('toserv_askConnection', function(providedPassword) {
		console.log(providedPassword);
		
		// TODO change this
		correctPassword = (providedPassword == '12345');
		
		if(correctPassword) {
			socket.status = 'connected';
			socket.emit('tocli_success', 'You are now connected and can edit passwords.');
			socket.emit('tocli_onConnectionSuccess');
		} else {
			socket.emit('tocli_error', 'The provided password is wrong.');
		}

	});
});

server.listen(8080);


function initializeSocket(socket) {
	socket.status = 'disconnected';
	
	// On connection, give client the passwords list
    socket.emit('tocli_allPasswords', allPasswordsList);
}