/**
 * @module PostData
 * @description
 * Posts data through server services
 */
(function () {

    var Deferred = appMeta.Deferred;
    var getDataUtils  = appMeta.getDataUtils;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var methodEnum = appMeta.routing.methodEnum;


    /**
     * @constructor PostData
     * @description
     */
    function PostData() {
        "use strict";
    }

    PostData.prototype = {
        constructor: PostData,

        /**
         * @method saveDataSet
         * @public
         * @description ASYNC
         * Sends the dataset with the modifies on the server. The server saves it if possible. Returns the ds and the array of message errors
         * @method saveDataSet
         * @private
         * @param {DataSet} ds
         * @param {string} tableName
         * @param {string} editType
         * @param {Array} messages
         * @returns {Promise(boolean|DataSet)}
         */
        saveDataSet:function (ds, tableName, editType, messages) {
            var def = Deferred("saveDataSet");
            let dsToSend = ds.getChanges();
            //dsToSend.displayData();
            var objConn = {
                method: methodEnum.saveDataSet,
                prm: {
                    ds: getDataUtils.getJsonFromJsDataSet(dsToSend, false),
                    tableName: tableName,
                    editType: editType,
                    messages: getDataUtils.getJsonFromMessages(messages)
                }
            };

            appMeta.connection.call(objConn)
                .then(function (jsonRes) {
                        try{
                            // recupero oggetto json
                            var obj  = getDataUtils.getJsObjectFromJson(jsonRes);
                            // dal json obj recupero i vari pezzi. 1. dataset 2. success 3. canIgnore 4. messages
                            // messages a sua volta sarà un array di oggetti che metterò in obj js di tipo DbProcedureMessage
                            var dsOut = getDataUtils.getJsDataSetFromJson(obj.dataset);

                            var success = obj.success;
                            var canIgnore = obj.canIgnore;
                            var messages = [];
                            // In qualsiasi caso (anche su fail)  unisco il ds di output del metodo save con quello di input
                            var changesCommittedToDB = (obj.messages.length === 0); // se non ci sono msg e quindi è andato bene sono effettivamente da cancellare
                            getDataUtils.mergeDataSetChanges(ds, dsOut, changesCommittedToDB);
                            // popolo array di messaggi, creando un opportuno oggetto DbProcedureMessage.
                            _.forEach(obj.messages,
                                function (message) {
                                    var id = message.id;
                                    var description = message.description;
                                    var audit = message.audit;
                                    var severity = message.severity;
                                    var table = message.table;
                                    var canIgnore = message.canIgnore;
                                    var m = new appMeta.DbProcedureMessage(id, description, audit, severity, table, canIgnore);
                                    messages.push(m);
                                });
                            return def.resolve(ds, messages, success, canIgnore);

                        } catch (e){
                            console.log(e);
                            return def.resolve(false);
                        }

                    }, function(err) {
                        return def.reject(false);
                    }
                );

            return def.promise();
        },

        /**
         * @method doPost
         * @public
         * @description ASYNC
         * RECURSIVE
         * Sends the dataset with the modifies on the server. The server saves it if possible. returns the ds and the array of message errors
         * Manages the call to save data on db; if there are warning or error messages it shows a form,
         * In the form user can push "ignore and save" if there are only warnings, or "no save" button always visible
         * @param {DataSet} ds
         * @param {string} tableName
         * @param {string} editType
         * @param {Array} inputMessages
         * @param {MetaPage} metaPage
         * @returns Promise<boolean|DataSet>
         */
        doPost:function (ds, tableName, editType, inputMessages, metaPage) {
            var def  = Deferred("doPost");
            inputMessages = inputMessages || [];
            var self = this;
            // invocazione metodo backend
            var res = this.saveDataSet(ds, tableName, editType, inputMessages)

                .then(function (dsOut, newMessages, success, canIgnore) {
	                // se ritorna con successo esco con true
                    if(success) {
                        return def.resolve(true);
                    }
                    // se ci sono messaggi mostro form con lista degli errori.
                    // l'utente potrà uscire e non salvare , oppure provare ad ignorare e salvare
                    if (newMessages.length > 0) {
                        // mostra solo errori ricevuti in questo step di salvataggio
                        return self.showErrorList(newMessages, canIgnore, metaPage)
                            .then(function (res) {
                                // se esce con true, significa che l'utente ha potuto "ignorare e provare a ri-salvare"
                                if (res){
                                    // messaggi non ignorati, quindi aggiungo alla lista dei messaggi
                                    inputMessages = _.union(inputMessages, newMessages);

                                    // vado in ricorsione
                                    return def.from(self.doPost(ds, tableName, editType, inputMessages, metaPage)).promise();
                                }else{
                                    // uscito con false, l'utente ha deciso di non salvare
                                    return def.resolve(false);
                                }
                            });

                    } else {
                        // N.B se "success" è false devono esserci dei messaggi, altrimenti c'è anomalia da qualche parte! Mostro messaggio di errore all'utente
                        logger.log(logType.ERROR, "save unsucceded, but no procedure db error message found");
                        return def.resolve(false);
                    }
                });

            return def.from(res).promise();
        },

        /**
         * @method doPostSilent
         * @public
         * @description ASYNC
         * Sends the dataset with the modifies on the server. The server saves it if possible. returns the ds and the array of message errors
         * If all messages are ignorable, save it otherwise,  do nothing!
         * @param {DataSet} ds
         * @param {string} tableName
         * @param {string} editType
         * @param {Array} inputMessages
         * @returns {Deferred(boolean, dsOut)}
         */
        doPostSilent:function (ds, tableName, editType, inputMessages) {
            var def  = Deferred("doPostSilent");
            inputMessages = inputMessages || [];
            var self = this;
            // invocazione metodo backend
            var res = this.saveDataSet(ds, tableName, editType, inputMessages)

                .then(function (dsOut, newMessages, success, canIgnore) {

                    // se ritorna con successo esco con true
                    if(success) return def.resolve(true);

                    // se ci sono messaggi nella silent non mostro form, ma provo a salvare se sono tutti ignorabili
                    if (newMessages.length > 0) {
                        // e posso ignorare, automaticamente riprovo la post, cioè la saveDataSet
                        if (canIgnore){
                            // messaggi non ignorati, quindi aggiungo alla lista dei messaggi
                            inputMessages = _.union(inputMessages, newMessages);
                            // vado in ricorsione
                            return def.from(self.doPostSilent(ds, tableName, editType, inputMessages)).promise();
                        }
                        var warnmsg = "TableName: " + tableName + " - EditType: " + editType + ". Save not succeded";
                        console.warn([warnmsg, JSON.stringify(newMessages) ]);
                        // se nin sono ignorabili esco
                        return def.resolve(false, newMessages);
                    } else {
                        // N.B se success è false devono esserci dei messaggi, altrimenti c'è anomalia da qualche parte! Mostro messaggio di errore
                        logger.log(logType.WARNING, "Save not succeded, but no procedure db error message found");
                        return def.resolve(false);
                    }
                });

            return def.from(res).promise();
        },

        /**
         * @method showErrorList
         * @private
         * @description ASYNC
         * Show a modal form with a grid with the info on the messages.
         * @param {DbProcedureMessage[]} messages
         * @param {boolean} canIgnore
         * @param {MetaPage} metaPage
         * @returns {Deferred}
         */
        showErrorList:function (messages, canIgnore, metaPage) {
            var def  = Deferred("showErrorList");
            var formProcedureMessage = new appMeta.FormProcedureMessage(metaPage.rootElement, messages, canIgnore, metaPage);
            return def.from(formProcedureMessage.fillControl()).promise();
        },

    };

    appMeta.postData = new PostData();

}());
