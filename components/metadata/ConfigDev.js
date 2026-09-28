/**
 * @module ConfigDev
 * @description
 * Contains global variables used in test environment
 */
(function () {

    var configDev = {
        // dati per login e utente già registrato
        userName: "seg_fcaprilli",
		password: "",
        email : 'info@tempo.it',
        codiceFiscale : 'cf',
        partitaIva :  '000000961',
        cognome :  'riccardotest',
        nome: 'riccardotestNome',
        dataNascita:  '02/10/1980',

        // dati per login e utente per reset passoword
        userNameResetPassword: '',
        passwordResetPassword: '',
        emailResetPassword: '',


        userName2: "riccardotest",
        password2:"",
        email2 : 'info@xxxx.it',
        codiceFiscale2 : 'cf',
        partitaIva2 :  '000000961',
        cognome2 :  'riccardotest',
        nome2: 'riccardotestNome',
        dataNascita2:  '02/10/1980',

        datacontabile : new Date()

    };

    // Le password degli utenti di test non stanno nel repository: le mette ConfigDev.local.js,
    // escluso da git e caricato prima di questo file (modello: ConfigDev.local.example.js).
    if (typeof window !== "undefined" && window.configDevLocal) {
        Object.assign(configDev, window.configDevLocal);
    } else {
        console.warn("ConfigDev.local.js mancante: copia components/metadata/ConfigDev.local.example.js in ConfigDev.local.js e mettici le password degli utenti di test");
    }

    appMeta.configDev = configDev;
}());


