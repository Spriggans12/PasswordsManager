module.exports = {

	loadAllPasswords: function(db, callback) {
		db.any("SELECT * FROM passwords ORDER BY name")
			.then(function(data) {
				// null => ''
				data.forEach(d => {
					for(var key in d) {
						if (d.hasOwnProperty(key)) {
							if(d[key] == null) {
								d[key] = '';
							}
						}
					}
				});
				callback(data); 
			})
			.catch(function(error) {
				console.log("ERROR IN QUERY", error);
			});
	},
	
	createPassword: function(db, password, callback) {
		db.none("INSERT INTO passwords(id, name, salt, hash, username, notes) " +
				"VALUES (nextval('sq_pwd'), ${name}, ${salt}, ${hash}, ${username}, ${notes})"
				, password)
			.then(function() {
				callback();
			})
			.catch(function(error) {
				console.log("ERROR IN INSERT", error);
			});
	},
	
	deletePassword: function(db, id, callback) {
		db.none("DELETE FROM passwords WHERE id = $1", id)
			.then(function() {
				callback();
			})
			.catch(function(error) {
				console.log("ERROR IN DELETE", error);
			});
	},
	
	updatePassword: function(db, password, updateSaltAndHash, callback) {
		db.none("UPDATE passwords SET " +
		"name=${name}, username=${username}, notes=${notes}" +
		(updateSaltAndHash?", salt=${salt}, hash=${hash}" :"") +
		" WHERE id=${id}", password)
			.then(function() {
				callback();
			})
			.catch(function(error) {
				console.log("ERROR IN UPDATE", error);
			});
	}
}