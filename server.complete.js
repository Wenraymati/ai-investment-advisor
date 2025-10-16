// Railway Start Command Redirect
// Este archivo es un wrapper que ejecuta server.nodb.js
// Railway tiene configurado `node server.complete.js` y no podemos cambiarlo desde la API

require('./server.nodb.js');
