A l'init, on checke le contenu de la table Authentification.

-> Si Authentification est vide, on fait un init : demande de password, puis :
   => SERVER_SALT est randomisé, persisté, et récupéré.

-> Sinon, on récupère le SERVER_SALT de la table.


On stocke en base des MDP cryptés par AES GCM avec une masterKey
https://gist.github.com/AndiDittrich/4629e7db04819244e843


La masterKey est extraite depuis le masterPassword entré sur l'IHM de la façon suivante :

- Coté client, on entre le masterPassword.

- masterPassword est donné au serveur.

- Coté serveur, on hashe masterPassword en HASH_1, par PBKDF2 en utilisant le sel SERVER_SALT.
- Le HASH_1 est la masterKey utilisée par AES GCM.

On tente alors de decrypter avec la masterKey.



References :
https://crackstation.net/hashing-security.htm
