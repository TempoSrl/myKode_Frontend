/**
 * @module Connection
 * @description
 * Manages the connection with the backend
 */
(function () {

    /**
     * Enum of Backend type
     * @type {{WEB_SERVICE: string, WEB_SOCKET: string, MOCK_SERVER: string}}
     */
    var BackendTypeEnum = {
        WEB_SERVICE : "webservices",
        WEB_SOCKET : "websocket"
    };

    /**
     * Enum for the type of request. In case of multipleResult we can have notify and at the end the resolve
     * @type {{resolve: string, notify: string, reject: string}}
     */
    var RequestTypeEnum = {
        resolve : 'resolve',
        notify : 'notify',
        reject : 'reject'
    };
    
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var serverErrorTypeEnum = appMeta.routing.serverErrorTypeEnum;

    /**
     * @constructor Connection
     * @description
     * Initializes the type of backend. it can be webservices type or websocket
     */
    function Connection() {
        "use strict";

        this.backendType  = BackendTypeEnum.WEB_SERVICE;
        this.currentBackendManager = null;
        this.setCurrentBackend(this.backendType);
        this.context = {};

        this.requestIdCurrent = 0; // contatore delle richieste corrente
        this.testMode = false;
    };


    Connection.prototype = {
        setTestMode: function (value) {
            this.testMode = value;
        },
        constructor: Connection,

        /**
         * @method callGet
         * @public
         * @description ASYNC
         * It Calls a backend service. It can be webservice  or websocekt backend, depends on backedManagerCurrent variable.
         * It accepts an objConn object that contains all the information for the request, such as the method and the parameters.
         * Depending on the method name, it retrieves from routing object other information for the request (if it is GET/POST, server path, etc).
         * @param {Object} objConn = {
                        method: methodEnum.select,
                        prm: { tableName:"registry", columnList:"idreg,active,cu", top:3, filter:filterSerialized},
                        noLogError:true
                    };
         * @returns {Deferred}
         */
        call:function (objConn) {

            //la riga seguente l'ho commentata e poi sostituita perché nella login page
            //mi dava l'errore "Deferred is not a function"
            //var def = Deferred("Connection.call");
            var def = appMeta.Deferred("Connection.call");

            // controllo se c'è connessione
            if (!navigator.onLine){
                var err = appMeta.localResource.noNetwork;
                logger.log(logType.ERROR, err);
                return def.reject(err);
            }

            // recupero dal routing prm da passare alla chiamata
            var callConfigObj = appMeta.routing.getMethod(objConn.method);

            // Calcola id richiesta
            var currIdRequest = this.getRequestId();
            // Associo all'oggetto da inviare quindi richiesta è del tipo  (requestId, nome metodo, parametri metodo) e viene inviata al server
            objConn.prm.idRequest = currIdRequest;

            var self = this;

            // Rilancio al chiamante, aggiungendo logica in questa fase se necessario
            // N.B la progress quindi non serve gestirla, la gestisce direttamente il chiamante finale
            // poichè inutile qui, non aggiungo logica
            return this.currentBackendManager.call(callConfigObj, objConn)
                .then(
                    function (data) {
                        return def.resolve(data);
                    })
                .fail(
                    function (err) {
                        var logtype = logType.INFO;
                        if (objConn.noLogError === undefined){
                            // se è scaduto il token, lancio evento. così lo posso intercettare fuori e fare le opportune operazioni
                            // Per ora ho gestito err http 401 Unhautorized. Capire altri errori http cosa fare
                            var msg = appMeta.localResource.serverUnracheable;
                            if (err.status) {

                                // ripulisco errore
                                var serr = null;
                                if (err.text) {
                                    serr = err.text.replace(/"/g, '');
                                }

                                if (err.status === 401) {
                                    self.currentBackendManager.unsetToken(); // reset della'header dove c'è token di autenticazione
                                    if (!appMeta.globalEventManager) appMeta.globalEventManager = new appMeta.EventManager();

                                    // in ogni caso devo riportare al login
                                    appMeta.globalEventManager.trigger(appMeta.EventEnum.expiredCredential, self, 'expiredCredential');
                                }

                                if (err.status === 500) {
                                    msg = appMeta.localResource.serverErrorInternal;
                                }
                                if (err.text) {

                                    // gestione custom per filtro serializzato con undefined
                                    if (serr.startsWith(serverErrorTypeEnum.FilterWithUndefined)) {
                                        var parts = serr.split('$__$');
                                        msg = appMeta.localResource.filterWithUndefined + ' ' + parts[1];
                                    }

                                    // msg = serr;
                                    switch (serr) {
                                        case serverErrorTypeEnum.NoCredential :
                                            msg = appMeta.localResource.serverErrorNoCredential;
                                            break;
                                        case serverErrorTypeEnum.DataContabileMissing :
                                            msg = appMeta.localResource.dataContabileMissing;
                                            break;
                                        case serverErrorTypeEnum.ExpiredCredential :
                                            self.currentBackendManager.unsetToken();
                                            msg = appMeta.localResource.serverErrorExpiredCredential;
                                            break;
                                        case serverErrorTypeEnum.ExpiredSession :
                                            self.currentBackendManager.unsetToken();
                                            msg = appMeta.localResource.serverErrorExpiredSession;
                                            break;
                                        case serverErrorTypeEnum.BadCredential :
                                            msg = appMeta.localResource.serverErrorBadCredential;
                                            break;
                                        case serverErrorTypeEnum.DataNotPermitted :
                                            msg = appMeta.localResource.serverErrorDataNotPermitted;
                                            break;
                                        case serverErrorTypeEnum.TokenEmpty :
                                            msg = appMeta.localResource.serverErrorTokenEmpty;
                                            break;
                                        case serverErrorTypeEnum.UserNotSecurity :
                                            msg = appMeta.localResource.serverErrorUserNotSecurity;
                                            break;
                                        case serverErrorTypeEnum.AnonymousNotPermitted :
                                            msg = appMeta.localResource.serverErrorAnonymous;
                                            break;
                                        case serverErrorTypeEnum.ExpiredCredentialSSO :
                                            msg = appMeta.localResource.serverErrorSSO;
                                            break;

                                        }
                                    }
                                }
                            
                            logtype = logType.ERROR;
                        }

                        var envs = [appMeta.config.envEnum.DEV, appMeta.config.envEnum.QA];
                        var showInfo = envs.includes(appMeta.config.env) || appMeta.config.forceShowErrorInfo;

                        //&& (objConn.method === 'login' || objConn.method === 'loginLDAP')
                        if (objConn.prm && objConn.prm.password) {
                            objConn.prm.password = '************'
                        }

                        if (self.testMode) {
                            console.log(err);
                            def.reject(err);
                        }
                        else {
                            logger.log(logtype, msg + " method: '" + objConn.method + "' ",
                                showInfo ? " errors: " + JSON.stringify(err) : "",
                                showInfo ? " prm: " + JSON.stringify(objConn.prm) : "").
                                then(() => def.reject(err))
                        }
                        return def.promise();
                    })
        },

        /**
         * @method getRequestId
         * @private
         * @description SYNC
         * Returns the "requestIdCurrent" and increments it. It is a progressive number the enumerates the calls.
         * This "requestIdCurrent" is attached to the request, and passed to the server. Client can manage the right answer in the case of multipleResult request.
         * For example in multipleResult it is used to retrieve the right deferred to resolve.
         * @return {number}
         */
        getRequestId:function () {
            return ++this.requestIdCurrent;
        },

        /**
         * @method setCurrentBackend
         * @private
         * @description SYNC
         * Sets the current backend. It should be WEB_SERVICE (http) or WEB_SOCKET
         * @param {RequestTypeEnum} backedType is an enumerate that indicates if backend is WEB_SERVICE or WEB_SOCKET
         */
        setCurrentBackend:function(backedType){
            this.backendType = backedType;

            if (this.backendType === BackendTypeEnum.WEB_SOCKET){
                if (!this.backedManagerConnWebSocket){
                    // passo il token di auth
                    this.backendManagerConnWebSocket = new appMeta.connWebSocket(this.getAuthToken());
                }
                this.currentBackendManager  = this.backendManagerConnWebSocket;
            }

            if (this.backendType === BackendTypeEnum.WEB_SERVICE){
                if (!this.backendManagerconnWebService){
                    this.backendManagerconnWebService = new appMeta.connWebService();
                }
                this.currentBackendManager  = this.backendManagerconnWebService;
            }

        },

        /**
         * @method getAuthToken
         * @private
         * @description SYNC
         * Returns the authentication token, saved after the login
         * @returns {guid}
         */
        getAuthToken:function () {
            return this.currentBackendManager.getAuthToken();
        },

        /**
         * @method setToken
         * @public
         * @description SYNC
         * It configures the Authorization header of ajax call with the "token".
         * Usually it is called after the login method.
         * In fact after the login method all the calls require authorization. The "token" is checked server side
         * @param {string} token
         * @param {Date} expiresOn
         */
        setToken: function (token, expiresOn) {            
            return this.currentBackendManager.setToken(token, expiresOn);
        },

        /**
         * @method resetHeaders
         * @public
         * @description SYNC
         * Reset the header for the authentication. For example on the logiut
         */
        unsetToken:function(){
            return this.currentBackendManager.unsetToken();
        },

        /**
         * @method getTokenExpiresOn
         * @public
         * @description SYNC
         * Returns the token expiration date
         * @returns {Date}
         */
		getTokenExpiresOn: function () {
			return this.currentBackendManager.getTokenExpiresOn();
		},

        /**
         * @method setAnonymous
         * @public
         * @description SYNC
         * unsets the token, and set new anonymous token
         */
        setAnonymous:function () {
            // ripulisce token
           this.unsetToken();
            // setta token anonimo, che stabilirà una connessione anonima
            var anonymousToken = "AnonymousToken123456789";
            // set data scadenza a now + xxx minuti
            var now = new Date(),
            d2expire = new Date(now);
            d2expire.setMinutes (now.getMinutes() + 5);
            this.setToken(anonymousToken, d2expire, null) 
        }

    };

    appMeta.RequestTypeEnum = RequestTypeEnum;
    appMeta.BackendTypeEnum = BackendTypeEnum;
    appMeta.connection = new Connection();
}());


