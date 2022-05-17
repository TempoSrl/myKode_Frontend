/**
 * @module ConnWebSocket
 * @description
 * Manages the connection with the backend
 */
(function () {
    var Deferred = appMeta.Deferred;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    
    /**
     * @constructor ConnWebSocket
     * @description
     * Manages the calls to the web socket server.
     */
    function ConnWebSocket(authToken) {
        
        "use strict";
        // inizializzo url del server WebSocket
        this.url  = appMeta.config.webSocketAddress;

        // mi dice se il canale è stato aperto, callback dopo la new WebScoket()
        this.isOpen = false;
        // passato dopo la login. lo invio ad ogni richiesta. // TODO lato server si dovrebbe gestire controllando tale token
        this.tokenAuth  = authToken;

        // apre il canale webSocket
        this.openWebSocketChannel();

        // metodi del webSocket
        this.ws.onmessage = _.partial(this.onMessage, this);
        this.ws.onerror =_.partial(this.onError, this);
        this.ws.onopen = _.partial(this.onOpen, this);
        this.ws.onclose = _.partial(this.onClose, this);

        this.requestIdDict  = []; // array di requestId,ogni oggetto dell'array è una tripla  {method, deferred, multipleResult} 
       
    }

    ConnWebSocket.prototype = {

        /**
         * @method openWebSocketChannel
         * @private
         * @description SYNC
         * Instantiates a web socket object. Backend side will be launched OnOpen() and client will receive it on onopen ws callback
         */
        openWebSocketChannel:function () {
            // apre la connessione tramite web socket.
            this.ws = new WebSocket(this.url);
        },

        /**
         * @method onClose
         * @private
         * @description SYNC
         * Callback invoked by server after that the channel is closed;
         * It sets isOpen to false
         * @param e
         */
        onClose: function (e) {
            logger.log(logType.INFO, "web socket closed");
            this.isOpen  = false;
        },

        /**
         * @method onOpen
         * @private
         * @description SYNC
         * Callback invoked by server after new WebSocket(this.url);
         * It sets isOpen to true, otherwise the "send" will fail if the channel will not be opened
         * @param {ConnWebSocket} that
         */
        onOpen: function (that) {
            logger.log(logType.INFO, "web socket opened");
            // valorizzo connessione aperta
            that.isOpen  = true; 
        },

        /**
         * @method onError
         * @private
         * @description SYNC
         * Callback invoked by server if an error occurs
         * @param {ConnWebSocket} that
         * param {Object} e
         */
        onError: function (that, e) {
            logger.log(logType.ERROR, "Wweb socket error", e);
        },

        /**
         * @method onMessage
         * @private
         * @description SYNC
         * Callback received from server. "this" isn't the class connWebSocket, but this is the ws itself
         * "That" is ConnWebSocket, passed on the _partial in the class constructor
         * @param {ConnWebSocket} that
         * @param {MessageEvent} message , message.data is the field filled by the server
         */
        onMessage: function(that, message) {
            logger.log(logType.INFO, "web socket message received", message.data);
            var obj  = appMeta.getDataUtils.getJsObjectFromJson(message.data);
            
            // recupera i singoli parametri utili dal messagge inviato dals erver
            var currRequestId = obj.requestId;
            var type =  obj.type; // recupero il tipo, se è notify resolve o reject
            var data =  obj.data; // recupero i dati. E' un array
            
            // recupero la dictionary il gestore che conteneva il deferred
            var currRequest =  that.requestIdDict[currRequestId];
            var currDeferred = currRequest.deferred;
            
            // Nel caso  metodo associato a risposte multiple il server mi manda notify
            if (type === appMeta.RequestTypeEnum.notify){
                currDeferred.notify(data[0]);
                return;
            }
            
            // nel caso di resolve nel web socket osservo se  si tratta di multipleResult
            if (type === appMeta.RequestTypeEnum.resolve){
                if (currRequest.multipleResult){
                    currDeferred.resolve();
                }else{
                    currDeferred.resolve(data[0]);
                }
                return;
            }
            
            if (type === appMeta.RequestTypeEnum.reject){
                currDeferred.reject(data);
                return;
            }
        },

        /**
         * @method call
         * @private
         * @description ASYNC
         * Sends the request to the web socket server if the channel is opened.
         * @param {object} callConfigObj
         * @param {object} objConn
         * @return {Deferred}
         */
        call:function (callConfigObj, objConn) {
            // attacho il token di autenticazione; nel metodo login sarà null
            objConn.token =  this.tokenAuth; 

            // deferred da aggiungere alla lista. si occuperà lui di gestire il return
            var currDef =  new Deferred('call WebSocket' + objConn.prm.idRequest);

            //se il canale è chiuso lancio messaggio di errore
            if (!this.isOpen){
                this.openWebSocketChannel();
                return  currDef.reject("WebSocket not opened").promise();
            }

            // serve nella OnMessage asincrona per recuperare deferred e multipleResult.
            this.requestIdDict[objConn.prm.idRequest] = {method:objConn.method, deferred: currDef, multipleResult:callConfigObj.multipleResult};

            // serializzo i prm
            var jsonPrms = JSON.stringify(objConn);

            // invio tramite il metodo del webSocket
            this.ws.send(jsonPrms);

            // torno una promise
            return currDef.promise();
        }

    };

    appMeta.connWebSocket = ConnWebSocket;
    
}());





