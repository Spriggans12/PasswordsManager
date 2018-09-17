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
	
	addPasswordToDB: function(db, password, callback) {
		db.none("INSERT INTO passwords(id, name, hash, username, notes) " +
				"VALUES (nextval('sq_pwd'), ${name}, ${hash}, ${username}, ${notes})"
				, password)
			.then(function() {
				callback();
			})
			.catch(function(error) {
				console.log("ERROR IN INSERT", error);
			});
	},
	
	removePasswordFromDB: function(db, id, callback) {
		db.none("DELETE FROM passwords WHERE id = $1", id)
			.then(function() {
				callback();
			})
			.catch(function(error) {
				console.log("ERROR IN DELETE", error);
			});
	},
}