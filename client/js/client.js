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
	logOnPopin(message, null, 'Message');
});
socket.on('tocli_error', function(message) {
	logOnPopin(message, 'redTextBold', 'Error');
});
socket.on('tocli_success', function(message) {
	logOnPopin(message, 'greenTextBold', 'Message');
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
			'<td id="pwdname' + item.id + '">' + item.name + '</td>' +
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

function logOnPopin(log, clazz, title) {
	if(!clazz) {
		clazz = "bold";
	}
	console.log(log);
	var bodyHtml = "<p class='" + clazz + "'>" + log + "</p>";
	var footerHtml = "<button class='button buttonPopin' id='closeButton'>OK</button>";
	var initialization = function() {
		$('#closeButton').click(function() {
			$('#popin').hide();
		});
	};
	createAndShowPopin(title, bodyHtml, footerHtml, initialization);
};

function createAndShowPopin(title, bodyHtml, footerHtml, initialization) {
	var popIn = $('#popin');
	var popInContent = $('#popin-content');
	initPopinComponents(popInContent, popIn);
	// Sets title
	$('#popin-title').text(title);
	// Sets body's content
	$('#popin-body').append(bodyHtml);
	// Sets footer's content
	$('#popin-footer').append(footerHtml);
	// Calls the passed-in initialization function
	initialization();
	// Shows
	popIn.show();
};

// Resets the popin divs. Initializes popin-header, popin-body and popin-footer with empty values.
function initPopinComponents(popInContent, popIn) {
	popInContent.empty();
	// Header
	popInContent.append('<div id="popin-header" class="popin-header"><span id="popin-close" title="Close" class="popin-close">&times;</span><h3 id="popin-title"></h3></div>');
	// Body
	popInContent.append('<div id="popin-body" class="popin-body"></div>');
	// Footer
	popInContent.append('<div id="popin-footer" class="popin-footer"></div>');
	// Makes clicking on X close the popin
	$('#popin-close').click(() => { popIn.hide(); });
	// When the user clicks anywhere outside of the popin, close it	
	$("body").click(function(event) {
		if (event.target.id == popIn.attr('id')) {
			popIn.hide();
		}
	});
};


// Confirmation popin of password deletion
function popUpConfirmDeletion(id) {
	var pwdName = $('#pwdname' + id).text();
	var title = 'Confirm deletion';
	var bodyHtml = '<p>Are you sure you want to delete this password ?<br/><br/>' +
			'<b>' + pwdName + '</b><br/><br/>' + 
			'You will not be able to recover the password once deleted !</p>'
	var footerHtml = '<button class="button buttonPopin" id="abortDeletion">Abort</button><button class="button buttonPopin" id="deletePassword">Delete</button>'
	var initialization = function() {
		$('#deletePassword').click(function() {
			askDeletePassword(id);
			$('#popin').hide();
		});
		$('#abortDeletion').click(function() {
			$('#popin').hide();
		});
	};
	createAndShowPopin(title, bodyHtml, footerHtml, initialization);
}