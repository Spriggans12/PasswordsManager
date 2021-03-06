var socket = io.connect('//localhost:8000');
var allPasswords = [];
var QUESTION_MARKS = '??????????';
var connected = false;
var FORM_IDS = ['f_name', 'f_pass', 'f_confPass', 'f_username', 'f_notes'];

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
	document.activeElement.blur();
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
socket.on('tocli_encryptStringTestResult', function(response) {
	console.log('SALT : ', response.salt);
	console.log('HASH : ', response.hash);
});

// Server response about invalid form
socket.on('tocli_invalidForm', function(errors) {
	// Cleanup previous errors
	$('input').removeClass('invalid');
	$('invalid').remove();
	// Add new errors
	errors.forEach(error => {
		
		$('#f_' + error.field).addClass('invalid');
		if(error.cause) {
			$('#f_' + error.field).parent().append('<invalid>' + error.cause + '</invalid>');
		}
	});
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
	var crypted = $('#key' + id).attr('crypted');
	if(crypted === "true") {
		$('#key' + id).attr('crypted', "false");
		$('#key' + id).attr('title', "Re-encrypt");
		socket.emit('toserv_decryptPass', id, $("#adminPasswordTextfield").val());
	} else {
		$('#key' + id).attr('crypted', "true");
		$('#key' + id).attr('title', "Decrypt");
		$("#pwd" + id).val(QUESTION_MARKS);
		$("#pwd" + id).get(0).type = 'text';
	}
};

// encryption string test
function encryptStringTest(masterPassword) {
	socket.emit('toserv_encryptStringTest', masterPassword);
};

function askDeletePassword(id) {
	socket.emit('toserv_deletePassword', id);
};

function askPasswordCreation(data) {
	socket.emit('toserv_createPassword', data, $("#adminPasswordTextfield").val());
};

function askPasswordUpdate(data) {
	socket.emit('toserv_updatePassword', data, $("#adminPasswordTextfield").val());
};

/////////////////////////////////
/////////// FUNCTIONS ///////////
/////////////////////////////////

// Make escape button press close the popin
$(document).keypress(function(e) {
	if (e.keyCode == 27) {
		clearAndHidePopin();
	}
});

// Detect enter button presses
$(document).keypress(function(e) {
    if (e.keyCode == 13) {
		// If there is a #closeButton button, trigger it
		if($('#closeButton').length > 0) {
			$('#closeButton').trigger('click');
			e.stopPropagation();
			return;
		}
		// Otherwize, trigger Connection button or Upsert button
		var active = $(document.activeElement);
		if(active.hasClass('triggerConnect')) {
			$('#btnConnect').trigger('click');
			e.stopPropagation();
		} else if(active.hasClass('triggerUpsert')) {
			$('#confirmUpsert').trigger('click');
			e.stopPropagation();
		}
    }
});

function resetPwdList() {
	// Passwords list
	$('#pwdTableBody').empty();
	allPasswords.forEach(item => {
		$('#pwdTableBody').append('<tr>' +
			'<td id="pwdname' + item.id + '">' + item.name + '</td>' +
			'<td id="pwdUser' + item.id + '">' + item.username + '</td>' +
			tdPassword(item.id, QUESTION_MARKS) +
			'<td id="pwdNotes' + item.id + '">' + item.notes + '</td>' +
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
		'<key id="key' + id + '" crypted="true" onclick="askDecryptOnePassword(' + id + ');" title="Decrypt">&#x1f511;</key>' +
		'<eye onclick="toggleVisibility(' + id + ');" title="Toggle visibility">&#x1f441;</eye>' +
		'</td>';
};

function tdActions(id) {
	return '<td class="centeredTD">' + 
		'<modify onclick="popInModification(' + id + ');" title="Change this password">&#x1F58A;</modify>' +
		'<delete onclick="popInConfirmDeletion(' + id + ');" title="Delete this password">&#x1F5D1;</delete>' +
		'</td>';
};

function toggleVisibility(id) {
	var crypted = $('#key' + id).attr('crypted');
	if(crypted === "true") {
		// Don't toggle if password is '??????'
		return;
	}
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
			clearAndHidePopin();
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
	$('#popin-close').click(function() {
		clearAndHidePopin();
	});
	// When the user clicks anywhere outside of the popin, close it	
	$("body").click(function(event) {
		if (event.target.id == popIn.attr('id')) {
			clearAndHidePopin();
		}
	});
};

// Clear the popin's content and hides it
function clearAndHidePopin() {
	$('#popin-content').empty();
	$('#popin').hide();
}

// Confirmation popin of password deletion
function popInConfirmDeletion(id) {
	var pwdName = $('#pwdname' + id).text();
	var title = 'Confirm deletion';
	var bodyHtml = '<p>Are you sure you want to delete this password ?<br/><br/>' +
			'<b>' + pwdName + '</b><br/><br/>' + 
			'You will not be able to recover the password once deleted !</p>'
	var footerHtml = '<button class="button buttonPopin" id="abortDeletion">Abort</button><button class="button buttonPopin" id="deletePassword">Delete</button>'
	var initialization = function() {
		$('#abortDeletion').click(function() {
			clearAndHidePopin();
		});
		// Send deletion request
		$('#deletePassword').click(function() {
			askDeletePassword(id);
		});
	};
	createAndShowPopin(title, bodyHtml, footerHtml, initialization);
}

function popInCreation() {
	var title = 'Create a new password';
	var bodyHtml = makeFormBody();
	var footerHtml = '<button class="button buttonPopin" id="abortCreation">Abort</button><button class="button buttonPopin" id="confirmUpsert">Create</button>'
	var initialization = function() {
		$('#abortCreation').click(function() {
			clearAndHidePopin();
		});
		// Send creation request
		$('#confirmUpsert').click(function() {
			var data = getDataFromForm();
			askPasswordCreation(data);
		});
	};
	createAndShowPopin(title, bodyHtml, footerHtml, initialization);
}

function popInModification(id) {
	var title = 'Update this password';
	var current = {
		id: id,
		name: $('#pwdname' + id).text(),
		user: $('#pwdUser' + id).text(),
		notes: $('#pwdNotes' + id).text()
	};
	var bodyHtml = makeFormBody(current);
	var footerHtml = '<button class="button buttonPopin" id="abortUpdate">Abort</button><button class="button buttonPopin" id="confirmUpsert">Update</button>'
	var initialization = function() {
		$('#abortUpdate').click(function() {
			clearAndHidePopin();
		});
		// Send update request
		$('#confirmUpsert').click(function() {
			var data = getDataFromForm(id);
			askPasswordUpdate(data);
		});
	};
	createAndShowPopin(title, bodyHtml, footerHtml, initialization);
}

function makeFormBody(currentPassword) {
	var formForUpdate = true;
	if(!currentPassword) {
		currentPassword = {};
		formForUpdate = false;
	}
	return '<div id="formUpsert">' +
			labelAndInput('Name : ', FORM_IDS[0], 'text', currentPassword.name) +
			labelAndInput('Username : ', FORM_IDS[3], 'text', currentPassword.user) +
			(formForUpdate?'<div class="updatePasswordDiv"><b>Fill these to specify a new password</b>' :'') +
			labelAndInput(formForUpdate? 'New password : ' :'Password : ', FORM_IDS[1], 'password') +
			labelAndInput('Confirm password : ', FORM_IDS[2], 'password') +
			(formForUpdate?'</div>' :'') +
			labelAndInput('Notes : ', FORM_IDS[4], 'text', currentPassword.notes) +
		'</div>';
}

function labelAndInput(label, inputId, inputType, value) {
	return '<div class="block">' +
		'<label>' + label + '</label>' +
		'<input id="' + inputId + '" type="' + inputType + '"' + (value?'value="' + value + '"' :'') + ' class="triggerUpsert"/>' +
		'</div>';
}

function getDataFromForm(id) {
	return {
		id: id,
		name: $('#' + FORM_IDS[0]).val(),
		pass: $('#' + FORM_IDS[1]).val(),
		confPass: $('#' + FORM_IDS[2]).val(),
		username: $('#' + FORM_IDS[3]).val(),
		notes: $('#' + FORM_IDS[4]).val()
	};
}
