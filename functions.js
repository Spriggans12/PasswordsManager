// functions.js

module.exports = {

	loadAllPasswords: function(db, callback) {
		doQuery("SELECT * FROM passwords ORDER BY name", db, callback);
	}
	
}


/* Executes query, then do callback */
function doQuery(query, db, callback) {
	db.any(query)
		.then( function(data) {
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
		} )
		.catch(function (error) {
			console.log("ERROR IN QUERY", error);
		});
}