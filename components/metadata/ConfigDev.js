/**
 * @module ConfigDev
 * @description
 * Contains global variables used in test environment
 */
(function () {

    var configDev = {
        // dati per login e utente già registrato
        /*userName:"riccardo2",
        password:"000000000",
        email : 'riccardo@xxx.it',
        codiceFiscale : 'cf',
        partitaIva :  '000000961',
        cognome :  'proietti',
        nome: 'riccardo',
        dataNascita:  '02/10/1980',*/

        userName: "seg_fcaprilli",
		password: "seg_fcaprilli",
        email : 'info@tempo.it',
        codiceFiscale : 'cf',
        partitaIva :  '000000961',
        cognome :  'riccardotest',
        nome: 'riccardotestNome',
        dataNascita:  '02/10/1980',

        // dati per login e utente per reset passoword
        userNameResetPassword: 'riccardo2',
        passwordResetPassword: 'riccardo2',
        emailResetPassword: 'riccardo@xxx.it',


        userName2: "riccardotest",
        password2:"riccardotest",
        email2 : 'info@xxxx.it',
        codiceFiscale2 : 'cf',
        partitaIva2 :  '000000961',
        cognome2 :  'riccardotest',
        nome2: 'riccardotestNome',
        dataNascita2:  '02/10/1980',

        datacontabile : new Date()

    };

    appMeta.configDev = configDev;
}());


