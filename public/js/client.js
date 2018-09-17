var socket = io.connect('http://localhost:8080');
var allPasswords = [];
var QUESTION_MARKS = '??????????';
var connected = false;


///////////////////////////////////
// Commands received from server //
///////////////////////////////////

// Update the allPasswords variable
socket.on('tocli_allPasswords', function(allPasswordsList) {
	allPasswords = allPasswordsList;
	resetPwdList();
});

// Messages from server
socket.on('tocli_message', function(message) {
	addLogToDiv(message);
});
socket.on('tocli_error', function(message) {
	addLogToDiv(message, 'redTextBold');
});
socket.on('tocli_success', function(message) {
	addLogToDiv(message, 'limeTextBold');
});

// On admin connection success
socket.on('tocli_onConnectionOK', function() {
	$('#divNotConnected').hide();
	$('#divConnected').show();
	showConnectedOnlyStuffs();
	connected = true;
});
// On admin disconnect success
socket.on('tocli_onDisconnectionOK', function() {
	connected = false;
	$('#divConnected').hide();
	$('#divNotConnected').show();
	$("#adminPasswordTextfield").val('');
	resetPwdList();
});

// On server sending decrypted password
socket.on('tocli_decryptedPass', function(data) {
	if(!data.clearValue) {
		data.clearValue = QUESTION_MARKS;
	}
	$("#pwd" + data.id).val(data.clearValue);
	$("#pwd" + data.id).get(0).type = 'password';
});

// Server response of encryption string test
socket.on('tocli_encryptStringTestResult', function(encryptedData) {
	console.log(encryptedData);
});


/////////////////////////////////
// Requests made to the server //
/////////////////////////////////

function askConnection() {
	socket.emit('toserv_askConnection', $("#adminPasswordTextfield").val());
};
function askDisconnection() {
	socket.emit('toserv_askDisconnection');
};

function askDecryptOnePassword(id) {
	socket.emit('toserv_decryptPass', id, $("#adminPasswordTextfield").val());
};

// encryption string test
function encryptStringTest(masterPassword) {
	socket.emit('toserv_encryptStringTest', masterPassword);
};

function askDeletePassword(id) {
	socket.emit('toserv_deletePassword', id);
};


/////////////////////////////////
/////////// FUNCTIONS ///////////
/////////////////////////////////

function resetPwdList() {
	// Passwords list
	$('#pwdTableBody').empty();
	allPasswords.forEach(item => {
		$('#pwdTableBody').append('<tr>' +
			'<td>' + item.name + '</td>' +
			tdPassword(item.id, QUESTION_MARKS) +
			'<td>' + item.username + '</td>' +
			'<td>' + item.notes + '</td>' +
			tdActions(item.id) +
			'</tr>');
	});
	
	if(connected) {
		showConnectedOnlyStuffs();
	}
};

function tdPassword(id, value) {
	return '<td>' + 
		'<input class="pwdInput" id="pwd' + id + '" value=' + value + ' readonly="true"></input>' +
		'<key onclick="askDecryptOnePassword(' + id + ');" title="Decrypt">&#x1f511;</key>' +
		'<eye onclick="toggleVisibility(' + id + ');" title="Toggle visibility">&#x1f441;</eye>' +
		'</td>';
};

function tdActions(id) {
	return '<td class="centeredTD">' + 
		'<modify onclick="popUpModification(' + id + ');" title="Change this password">&#x1F58A;</modify>' +
		'<delete onclick="popUpConfirmDeletion(' + id + ');" title="Delete this password">&#x1F5D1;</delete>' +
		'</td>';
};

function toggleVisibility(id) {
	var pwd = $("#pwd" + id);
	if(pwd.get(0).type == 'password') {
		pwd.get(0).type = 'text';
	} else {
		pwd.get(0).type = 'password';
	}
};

function showConnectedOnlyStuffs() {
	$('key').show();
	$('eye').show();
	$('modify').show();
	$('delete').show();
}

function addLogToDiv(log, clazz) {
	if(!clazz) {
		clazz = "";
	}
	console.log(log);
	$('#logsDiv').empty();
	$('#logsDiv').append("<p class='" + clazz + "'>" + log + "</p>");
};

