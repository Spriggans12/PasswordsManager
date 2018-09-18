
HOW ENCRYPTION WORKS :

1/ The Client provides a master password (MP) to the Server through https.
2/ The Client also provides plain data to encrypt (PD).
3/ The Server generates a random salt (S).
4/ The Server encrypts the MP using the S. It gives it a Hash of the MP (Hmp). The algorithm used here is PBKDF2 with sha256.
	At this point, Hmp is unique (two seperate calls won't give the same result), unpredictable, irreversible.
5/ The Server uses a AES-256-GCM hashing algorithm to encrypt PD using Hmp as a key. This gives it an encrypted data (ED) of the plain data.
6/ The Server keeps ED and S (store it in DB).


HOW DECRYPTION WORKS :

1/ The Client provides a master password (MP) to the Server through https. It asks to decrypt one password (PWD).
2/ The Server fetches data matching PWD from the DB. It gets the encrypted data (ED) and the salt (S) of PWD.
3/ The Server encrypts the MP using the S. It gives it a Hash of the MP (Hmp). The algorithm used here is PBKDF2 with sha256.
4/ The Server uses a AES-256-GCM hashing algorithm to decrypt ED using Hmp as a key. This gives it the plain data (PD).
5/ PD is passed back to the Client using https.


CONNEXION PROCEDURE :

1/ The Server is initialized with a Dummy Text (DT) (ex: "IamADummyText"), an encrypted version of this Dummy Text (EDT), and a salt (S). EDT has been computed using the agreed master password before making the application public.
2/ Client types in the master password (MP).
3/ MP is passed to the Server through https.
4/ The Server encrypts the MP using the S. It gives it a Hash of the MP (Hmp). The algorithm used here is PBKDF2 with sha256.
5/ The Server uses a AES-256-GCM hashing algorithm to decrypt EDT using Hmp as a key. This gives it a decrypted dummy text (DDT).
6/ The Server compares DDT and DT. If they match, connexion is granted.



References :
https://crackstation.net/hashing-security.htm

https://gist.github.com/AndiDittrich/4629e7db04819244e843