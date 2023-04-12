/**
 * @module ConnWebService
 * @description
 * Manages the connection with the backend with  http call. It uses Ajax
 *
 */
(function () {

    /**
     * @constructor ConnWebService
     * @description
     * Manages the Ajax calls to the server
     */
    function ConnWebService() {
        "use strict";

        this.requestIdDict  = [];
    }

    ConnWebService.prototype = {

        /**
         * @method call
         * @public
         * @description ASYNC
         * Executes the ajax call to the server, and returns a deferred.
         * The deferred is resolved or rejected in the "success" and "error" callbacks
         * @param {object} callConfigObj contains the prm of routing as url, type(get/post)
         * @param {object} objConn contains the name of the method and the parameters
         * @returns {Deferred}
         */
        call: function (callConfigObj, objConn) {

            //la riga seguente l'ho commentata e poi sostituita perché nella login page
            //mi dava l'errore "Deferred is not a function"
            //var deferred = Deferred('ConnWebService.call ' + callConfigObj.url);
            var deferred = appMeta.Deferred('ConnWebService.call ' + callConfigObj.url);


            let options = {
                url: callConfigObj.url,
                type: callConfigObj.type,
                data: objConn.prm,
                timeout: appMeta.config.ajax_timeout,
                success: _.partial(this.success, this, deferred),
                error: _.partial(this.error, deferred)
            };

            // passo header per autorizzazione solo se metodo lo richiede
            if (callConfigObj.auth) {
                let token = this.getAuthToken();
                //console.log("evaluated token is "+token)
                options["headers"] = {
                    'Authorization': "Bearer " + token,
                    "language": appMeta.localResource.currLng
                };
            }
            else {
                let AnonymousToken = "AnonymousToken123456789";
                options["headers"] = {
                    'Authorization': "Bearer " + AnonymousToken,
                    "language": appMeta.localResource.currLng
                };
            }

            // associa ad una tripla. Serve principalmente per recuperare "multipleResult" alla risposta
            this.requestIdDict[objConn.prm.idRequest] =
            {
                method: objConn.method,
                deferred: deferred,
                multipleResult: callConfigObj.multipleResult
            };

            // Aggiungo solo se necessario il prm datatype
            if (callConfigObj.dataType) {
                options.datatype = callConfigObj.dataType;
            }
            //console.log("invoking " + JSON.stringify(options));
            try {
                $.ajax(options);
            }
            catch (err) {
                console.log("catching " + err);                
                deferred.reject({ text: err, status:500 });
            }

            return deferred.promise();
        },

        /**
         * @method error
         * @public
         * @description ASYNC
         * The callback in the case of error. it invokes the reject()
         * @param {Deferred} deferred
         * @param {Object} xhr
         * @param {Object} ajaxOptions
         * @param {Object} thrownError
         */
        error: function (deferred, xhr, status, thrownError) {
            //console.log(xhr);
            let err = xhr.responseText;
            //if (err.Message) err = JSON.parse(err).Message;
            console.log("got error server (ConnWebService): " + xhr.responseJSON + " status " + status + " body:" + thrownError);
            if (xhr.responseJSON) {
                err = xhr.responseJSON;
                if (err.Message) err = err.Message;
            }
           
            deferred.reject({ text: err, status: xhr.statusText });
        },

        /**
         * @method success
         * @public
         * @description ASYNC
         * The callback of the ajax call in the case of success.
         * Depending from "currRequestId" it resolves with the data the correct deferred.
         * The logic is managed from the caller
         * @param {ConnWebService} that
         * @param {Deferred} deferred
         * @param {string} res. is the answer of the server
         * @returns {Deferred}
         */
        success:function (that, deferred, res) {

            // INIZIO CODICE retrocompatibilità dei test e2e.
            // Introdotta nuova gestione dopo  l'inserimento dell'interfaccia comune con i web socket
            var isValidJSON = true;
            //console.log("got data from service")
            if (!res)  return deferred.resolve(null);
            try { JSON.parse(res); } catch (e){ isValidJSON = false; }
            if (isValidJSON) {
                var obj  = appMeta.getDataUtils.getJsObjectFromJson(res);
                if (!Array.isArray(obj.data)){
                    return deferred.resolve(res);
                }
            } else {
                //it's an object
                return deferred.resolve(res);
            }
            // FINE codice per retrocompatibilità . Togliere se sarà migrato tutto il backend http


            // ***** Da qui in poi nuova gestione resolve/notify/reject **** 
            // recupera i singoli parametri utili dal messagge inviato dal server
            var currRequestId = obj.requestId;
            // recupero la dictionary il gestore che conteneva il deferred
            var currRequest =  that.requestIdDict[currRequestId];

            var type =  obj.type; // recupero il tipo, se è resolve o reject (notify non possibile nel caso http)
            var data =  obj.data; // recupero i dati

            // nel caso resolve vedo se si tratta di multipleresult , in quel caso eseguo n notify
            if (type === appMeta.RequestTypeEnum.resolve){

                if (currRequest.multipleResult){
                    // deve fare un foreach sui dati e mandare la notify
                    _.forEach(data,function (singleData) {
                        deferred.notify(singleData);
                    });
                    
                    // al termine invia una resolve 
                    return deferred.resolve();
                }else{
                    // se non è multipleResult torno l'elemnto dell'array, che dò per scontato sia uno. 
                    // Eseguo check su eventuali casi di errori
                    var isArr = data instanceof Array;
                    if (!isArr){
                        return deferred.reject("Error Expected Data, must be an array");
                    }
                    if (data.length > 1){
                        return deferred.reject("Error Expected Data, check server method. Array must be only one member");
                    }
                    
                    return deferred.resolve(data[0]);
                }
            }
            
            if (type === appMeta.RequestTypeEnum.reject){
                return deferred.reject(error);
            }
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
            // salvo su storage locale, per riverificare se utente è già connesso
            //console.log("saving token into localStorage:"+token);
			window.localStorage.setItem('mdlusertoken', token);
            window.localStorage.setItem('expiresOn', expiresOn);
			//window.localStorage.setItem('idreg', idreg); // è nelle var di ambiente security.usr
        },

        /**
         * @method resetHeaders
         * @public
         * @description SYNC
         * Resets the header for the authentication. For example on the logiut
         */
        unsetToken:function(){
            // if ($.ajaxSettings.headers && $.ajaxSettings.headers["Authorization"]) delete $.ajaxSettings.headers["Authorization"]; // Remove header before call
            window.localStorage.setItem('mdlusertoken', '');
            window.localStorage.setItem('expiresOn', 0);
      },

        /**
         * @method getAuthToken
         * @public
         * @description SYNC
         * Returns the user auth token, memorized on browser cache
         * @returns {guid}
         */
        getAuthToken:function () {
            return window.localStorage.getItem('mdlusertoken');
        },

        /**
         * @method getTokenExpiresOn
         * @public
         * @description SYNC
         */
        getTokenExpiresOn:function () {
            return window.localStorage.getItem('expiresOn');
        }
    };

    appMeta.connWebService = ConnWebService;
}());


