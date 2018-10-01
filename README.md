# Password manager nodeJS 

A Node JS client/server app using socket.io that stores passwords.<br/>
Passwords' hashes are stored in a PostgreSQL database.<br/>
You need to provide a master password to retrieve your passwords.


## How to run

### Set-up

TODO


### Launching the server

Install dependencies using ```npm i <dependency_name>``` and start the server with ```node app.js```.


## Server API

This is the list of message that are sent through socket.io's messages.<br/>
The server will either send or receive messages. The client must adapt its UI to make good use of these messages.<br/>
<br/>
First thing to understand is that a socket is either ```connected``` or ```disconnected```.<br/>
Some server messages won't do much if the client socket is ```disconnected``` (only returning an error message).<br/>
In order to connect, a client must provide the right master password. The server will then acknowledge the socket as ```connected```.


### Messages received by the server (sent by clients)


* **_Admin connection request_** : ```toserv_askConnection```
	* __Description :__<br/>
	Evaluates the socket request of an admin connection.<br/>
	A password is provided and compared to the correct master password.
		
	* __Message parameter :__<br/>
	```providedPassword``` : the clear password the client wrote.
	
	* __Output scenarios :__<br/>
	A/ If the provided password is correct, the socket is flagged as ```connected```. Two messages are then sent to the client : ```tocli_success``` and ```tocli_onConnectionOK```.<br/>
	B/ If the provided password is wrong, an error message is sent to the client : ```tocli_error```.

* **_Admin disconnection request_** : ```toserv_askDisconnection```
	* __Description :__<br/>
	A connected client asks to be disconnected.
		
	* __Message parameters :__<br/>
	No parameters.
	
	* __Output scenario :__<br/>
	The socket is flagged as ```disconnected```. Two messages are then sent to the client : ```tocli_message``` and ```tocli_onDisconnectionOK```.
	
* **_Request for a password decryption_** : ```toserv_decryptPass```
	* __Description :__<br/>
	The client asks for a crypted password to be decrypted.
		
	* __Message parameters :__<br/>
	```id``` : the database id of the password to decrypt.<br/>
	```providedPassword``` : the master password the client wrote.
	
	* __Output scenarios :__<br/>
	A/ If the client's socket is ```disconnected```, an error message ```tocli_error``` is sent and nothing else happens.<br/>
	B/ Otherwise, using the ```providedPassword```, the encoded password referenced by ```id``` is decrypted, and sent through the ```tocli_decryptedPass``` message.

* **_Request for the deletion of a password_** : ```toserv_deletePassword```
	* __Description :__<br/>
	The client asks for a password to be deleted.
		
	* __Message parameter :__<br/>
	```id``` : the database id of the password to decrypt.
	
	* __Output scenarios :__<br/>
	A/ If the client's socket is ```disconnected```, an error message ```tocli_error``` is sent and nothing else happens.<br/>
	B/ Otherwise, the password referenced by ```id``` is deleted from the database. The client is then notified with two messages : ```tocli_success```, and ```tocli_allPasswords```. The later is used to refresh the existing passwords in the database on the client side.
	
* **_Request for the creation of a new password_** : ```toserv_createPassword```
	* __Description :__<br/>
	The client asks for a password to be created.
		
	* __Message parameters :__<br/>
	```data``` : A Json containing the password data. The expected fields are : ```name```, ```pass```, ```confPass```, ```username``` and ```notes```.<br/>
	```masterPassword``` : the master password the client wrote.
	
	* __Output scenarios :__<br/>
	A/ If the client's socket is ```disconnected```, an error message ```tocli_error``` is sent and nothing else happens.<br/>
	B/ Otherwise, the password to create is validated.<br/>
	B1/ If the validation fails (fields too large, ```pass != confPass```, mandatory field missing, ...), a message ```tocli_invalidForm``` is sent.<br/>
	B2/ If the validation succeeds. The new password is created and added to the database. The client is then notified with two messages : ```tocli_success```, and ```tocli_allPasswords```. The later is used to refresh the existing passwords in the database on the client side.

* **_Request for the update of an existing password_** : ```toserv_updatePassword```
	* __Description :__<br/>
	The client asks for a password to be created.
		
	* __Message parameters :__<br/>
	```data``` : A Json containing the password data. The expected fields are : ```id```, ```name```, ```pass```, ```confPass```, ```username``` and ```notes```.<br/>
	```masterPassword``` : the master password the client wrote.
	
	* __Output scenarios :__<br/>
	A/ If the client's socket is ```disconnected```, an error message ```tocli_error``` is sent and nothing else happens.<br/>
	B/ Otherwise, the password to create is validated.<br/>
	B1/ If the validation fails (fields too large, ```pass != confPass```, mandatory field missing, ...), a message ```tocli_invalidForm``` is sent.<br/>
	B2/ If the validation succeeds. The password is updated in the database. The client is then notified with two messages : ```tocli_success```, and ```tocli_allPasswords```. The later is used to refresh the existing passwords in the database on the client side. Note that if the ```id``` in the Json does not exist in the database, nothing will happen.
	
* **_Request to encrypt a string by generating a random salt_** : ```toserv_encryptStringTest```
	* __Description :__<br/>
	The client asks the server to encrypt a string.<br/>
	The server generates a random salt and encrypts this string.<br/>
	The string we're talking about is ```decryptedDummyText```. It is a server variable read from the property ```security.dummyText``` of the configuration file.<br/>
	This is used for the initial set-up only.
		
	* __Message parameter :__<br/>
	```providedPassword``` : the master password to use to encrypt the string.
	
	* __Output scenario :__<br/>
	The server generates a random salt. It uses this salt and the ```providedPassword``` to encrypt ```decryptedDummyText```. The salt and the encrypted string are then sent using the ```tocli_encryptStringTestResult``` message.
	

### Messages sent by the server to the client

* **_Server's notification_** : ```tocli_message```
	* __Description :__<br/>
	The server notifies the client of a message.
		
	* __Message parameter :__<br/>
	```message``` : The server's notification.

* **_Server's error message_** : ```tocli_error```
	* __Description :__<br/>
	The server notifies the client of an error.
		
	* __Message parameter :__<br/>
	```message``` : The server's error message.

* **_Server's success message_** : ```tocli_success```
	* __Description :__<br/>
	The server notifies the client that something worked.
		
	* __Message parameter :__<br/>
	```message``` : The server's success message.	
	
* **_Successful login_** : ```tocli_onConnectionOK```
	* __Description :__<br/>
	The server tells the client that it is now connected.
		
	* __Message parameters :__<br/>
	No parameters.
	
* **_Successful disconnection_** : ```tocli_onDisconnectionOK```
	* __Description :__<br/>
	The server tells the client that it has been disconnected.
		
	* __Message parameters :__<br/>
	No parameters.
	
* **_Passwords list recovery_** : ```tocli_allPasswords```
	* __Description :__<br/>
	The server sends the list of all the passwords in the database to the client.
		
	* __Message parameter :__<br/>
	```allPasswordsList``` : A Json list containing all the passwords of the database. The clear passwords are never provided. The fields in the list are : ```id```, ```name```, ```username``` and ```notes```.	
	
* **_Reception of the clear value of a password_** : ```tocli_decryptedPass```
	* __Description :__<br/>
	The server sends the decrypted value of a password.
		
	* __Message parameter :__<br/>
	```data``` : A Json containing the password data. The fields are : ```id``` and ```clearValue```.	
	
* **_A create or update request has failed because the provided data was invalid_** : ```tocli_invalidForm```
	* __Description :__<br/>
	The server could not insert or update a password because the form was invalid.<br/>
	The reasons are received by the client.
		
	* __Message parameter :__<br/>
	```errors``` : A Json list containing the causes of the invalidation. The fields in the list are : ```field``` and ```cause```.
	
* **_Reception of an encrypted string_** : ```tocli_encryptStringTestResult```
	* __Description :__<br/>
	The server sends the encrypted string of ```decryptedDummyText``` using a server-generated salt.
		
	* __Message parameter :__<br/>
	```response``` : A Json containing the encrypted string and the generated salt. The fields are : ```salt``` and ```hash```.
	

## How things work

### How encryption works

1. The Client provides a master password (MP) to the Server through https.
2. The Client also provides plain data to encrypt (PD).
3. The Server generates a random salt (S).
4. The Server encrypts the MP using the S. It gives it a Hash of the MP (Hmp). The algorithm used here is PBKDF2 with sha256.<br/>
At this point, Hmp is unique (two seperate calls won't give the same result), unpredictable, irreversible.
5. The Server uses a AES-256-GCM hashing algorithm to encrypt PD using Hmp as a key. This gives it an encrypted data (ED) of the plain data.
6. The Server keeps ED and S (store it in DB).


### How decryption works

1. The Client provides a master password (MP) to the Server through https. It asks to decrypt one password (PWD).
2. The Server fetches data matching PWD from the DB. It gets the encrypted data (ED) and the salt (S) of PWD.
3. The Server encrypts the MP using the S. It gives it a Hash of the MP (Hmp). The algorithm used here is PBKDF2 with sha256.
4. The Server uses a AES-256-GCM hashing algorithm to decrypt ED using Hmp as a key. This gives it the plain data (PD).
5. PD is passed back to the Client using https.


### Connexion procedure

1. The Server is initialized with a Dummy Text (DT) (ex: "IamADummyText"), an encrypted version of this Dummy Text (EDT), and a salt (S). EDT has been computed using the agreed master password before making the application public.
2. Client types in the master password (MP).
3. MP is passed to the Server through https.
4. The Server encrypts the MP using the S. It gives it a Hash of the MP (Hmp). The algorithm used here is PBKDF2 with sha256.
5. The Server uses a AES-256-GCM hashing algorithm to decrypt EDT using Hmp as a key. This gives it a decrypted dummy text (DDT).
6. The Server compares DDT and DT. If they match, connexion is granted.


## References and various notes

https://crackstation.net/hashing-security.htm

https://gist.github.com/AndiDittrich/4629e7db04819244e843

Log all things in the Console : ```localStorage.debug = '*'```

https://www.zem.fr/creer-un-serveur-https-nodejs-express/