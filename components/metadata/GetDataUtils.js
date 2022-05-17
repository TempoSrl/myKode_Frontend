/**
 * @module getDataUtils
 * @description
 * Collection of utility functions for GetData
 */
(function () {

    var getDataUtils = {};
    var q = window.jsDataQuery;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var dataRowState = jsDataSet.dataRowState;

    /**
     * @function getJsObjectFromJson
     * @public
     * @description SYNC
     * Given a json representation of the DataSet/DataTable returns a javascript object
     * @param {Json string} json
     * @returns {object} an object (DataTable or DataSet)
     */
    getDataUtils.getJsObjectFromJson = function (json) {
        // riconverto la stringa json proveniente dal server
        return JSON.parse(json);
    };

    /**
     * @function getJsDataTableFromJson
     * @public
     * @description SYNC
     * Given a json representation of the DataTable returns a Js DataTable
     * @param {Json string} jsonJsDataTable
     * @returns {DataTable} the datatable
     */
    getDataUtils.getJsDataTableFromJson = function (jsonJsDataTable) {

        // riconverto la stringa json proveniente dal server
        var objParsed =  getDataUtils.getJsObjectFromJson(jsonJsDataTable);

        // creo nuovo jsDataSet da popolare
        var dt = new jsDataSet.DataTable(objParsed.name);
        // deserializzo il json proveniente dal server e popolo ds
        dt.deSerialize(objParsed, true);

        return dt;
    };

    /**
     * @function getJsDataSetFromJson
     * @public
     * @description SYNC
     * Given a json representation of the DataSet returns a JsDataSet
     * @param {Json string} jsonJsDataSet
     * @returns {DataSet} the datatset
     */
    getDataUtils.getJsDataSetFromJson = function (jsonJsDataSet) {
        // riconverto la stringa json proveniente dal server
        var objParsed = getDataUtils.getJsObjectFromJson(jsonJsDataSet);
        // creo nuovo jsDataSet da popolare
        var ds = new jsDataSet.DataSet(objParsed.name);
        // deserializzo il json proveniente dal server e popolo ds
        ds.deSerialize(objParsed, true);
        return ds;
    };

    /**
     * @function getJsonFromJsDataSet
     * @public
     * @description SYNC
     * Given a jsDataSet returns the json string. First it calls the methods serialize() of jsDataSet and then returns the json representation of the dataset object
     * @param {DataSet} ds
     * @param {boolean} serializeStructure. If true it serialize data and structure
     * @returns {string] the json string
     */
    getDataUtils.getJsonFromJsDataSet = function (ds, serializeStructure) {
        var objser = ds.serialize(serializeStructure);
        var jsonToSend = JSON.stringify(objser);
        return jsonToSend;
    };

    /**
     * @function getJsonFromJsDataSet
     * @public
     * @description SYNC
     * Serializes a DataTable with the data and structure
     * @param {DataTable} dt
     * @returns {string} the json string
     */
    getDataUtils.getJsonFromDataTable = function (dt) {
        var objser = dt.serialize(true);
        var jsonToSend = JSON.stringify(objser);
        return jsonToSend;
    };

    /**
     * @function getJsonFromMessages
     * @public
     * @description SYNC
     * Given an array of message object returns the json string
     * @param {[]} messages
     */
    getDataUtils.getJsonFromMessages = function (messages) {
        if (!messages) return;
        if (messages.length === 0) return;
        var jsonToSend = JSON.stringify(messages);
        return jsonToSend;
    };

    /**
     * @function getJsDataQueryFromJson
     * @public
     * @description SYNC
     * Given a json representation of the JsDataQuery returns a JsDataQuery
     * @param {Json string} jsonJsDataQuery
     * @returns {jsDataQuery} the jsDataQuery representation of the json
     */
    getDataUtils.getJsDataQueryFromJson = function (jsonJsDataQuery) {
        // riconverto la stringa json proveniente dal server
        var objParsed = getDataUtils.getJsObjectFromJson(jsonJsDataQuery);
        return q.fromObject(objParsed);
    };

    /**
     * @function getJsonFromJsDataQuery
     * @public
     * @description SYNC
     * Given jsDataQuery returns the json string. first it converts jsDataQuery into js object and to a json string
     * @param {jsDataQuery} dataQuery
     * @returns {string} the json string
     */
    getDataUtils.getJsonFromJsDataQuery = function (dataQuery) {
        var objser = q.toObject(dataQuery);
        var jsonToSend =  JSON.stringify(objser);
        return jsonToSend;
    };

    /**
     * @function getDataRelationSerialized
     * @public
     * @description SYNC
     * Serializes the DataRelation "rel"
     * @param {DataRelation} rel
     * @returns {string} the string of DataRelation serialized
     */
    getDataUtils.getDataRelationSerialized = function (rel) {
        if (!rel) return "";
        var objser = rel.serialize();
        var jsonToSend =  JSON.stringify(objser);
        return jsonToSend;
    };

    /**
     * @function cloneDataTable
     * @public
     * @description SYNC
     * Returns a cloned copy of "dt" input using the ser/der methods of the framework
     * @param {DataTable} dt
     * @returns {DataTable}
     */
    getDataUtils.cloneDataTable = function (dt) {
        var dsClone = getDataUtils.cloneDataSet(dt.dataset);
        var dt =  getDataUtils.getJsDataTableFromJson(appMeta.getDataUtils.getJsonFromDataTable(dt));
        dt.dataset = dsClone;
        return dt;
    };

    /**
     * @function cloneDataSet
     * @public
     * @description SYNC
     * Returns a cloned copy of "ds" input using the ser/der methods of the framework
     * @param {DataSet} ds
     * @returns {DataSet}
     */
    getDataUtils.cloneDataSet = function (ds) {
        return getDataUtils.getJsDataSetFromJson(appMeta.getDataUtils.getJsonFromJsDataSet(ds, true));
    };

    /**
     * @function mergeDataSet
     * @public
     * @description SYNC
     * Merges the rows of dsSource into dsTarget
     * @param {DataSet} dsDest. DataSet target, where inject new rows, taken form dsSource
     * @param {DataSet} dsSource. The new DataSet, with modifies read from server. Need to merge these rows into dsTarget
     * @param {boolean} checkExistence
     */
    getDataUtils.mergeDataSet = function (dsDest, dsSource, checkExistence) {
        _.forEach(dsSource.tables, function (tSource) {
            // se il mio dsTarget contiene la tabella allora effettuo merge delle righe
            if (dsDest.tables[tSource.name]){
                // se non ci sono inutile fare il check esistenza. così si va più rapidi
                if (!dsDest.tables[tSource.name].rows.length) {
                    getDataUtils.mergeRowsIntoTable(dsDest.tables[tSource.name], tSource.rows, false);
                } else {
                    getDataUtils.mergeRowsIntoTable(dsDest.tables[tSource.name], tSource.rows, checkExistence);
                }

            }else{
                logger.log(logType.ERROR, "La tabella " + tSource.name + " non esiste sul dataset " + dsDest.name);
            }
        })
    };

    /**
     * @function mergeDataSetChanges
     * @public
     * @description SYNC
     * Merges rows modified of dsSource into dsDest. Use "merge" method of DataTable of jsDataSet
     * @param {DataSet} dsDest
     * @param {DataSet} dsSource
     * @param {boolean} changesCommittedToDB
     */
    getDataUtils.mergeDataSetChanges = function (dsDest, dsSource, changesCommittedToDB) {
        _.forEach(dsSource.tables,
            function(tSource) {
                // se il mio dsTarget contiene la tabella allora effettuo merge delle righe
                if (dsDest.tables[tSource.name]) {
                    // Questo non basta, vedi righe successive. dsDest.tables[tSource.name].merge(tSource);
                    // ciclo sulle righe originali del dest attraverso un contatore. ragiono al livello posizionale.
                    // 1. se riga è modified faccio merge. i 2 indici source e dest allineati
                    // 2. se riga è added inserisco riga corrispondente, aumento gli indici
                    // 3. deleted . faccio acceptChanges() così la riga viene detachata, rimango fermo sugli indici. solo se la transazione è ok

                    // recupero tabella di destinazione
                    var tDest = dsDest.tables[tSource.name];

                    // Indice delle righe del source, và con l'indice del dest cioè quello di partenza, ma se la riga del source è deleted non viene aumentato
                    // poichè il js nelle iterazioni successive deve copiare per le mod e add quella con lo stesso indice.
                    // var rSourceIndex = 0; // NON SERVE, tengo solo l'indicedella dest.
                    var rDestIndex = 0;

                    try {
                        for(rDestIndex; rDestIndex < tDest.rows.length;) {
                            // ottengo la i-esima riga dest. a seconda dello stato effettuo operazioni,
                            var rowDest = tDest.rows[rDestIndex];
                            var currState = rowDest.getRow().state;

                            if (currState === dataRowState.unchanged){
                                // non fai nulla nel caso unchanged
                                rDestIndex++;
                                continue;
                            }
                            if (currState === dataRowState.modified){
                                // 1. se riga è modified faccio merge. i 2 indici source e dest allineati
                                rowDest.getRow().makeSameAs(tSource.rows[rDestIndex].getRow());
                                // aumento contatore delle righe del source
                                rDestIndex++;
                                continue;
                            }
                            if (currState === dataRowState.added){
                                // 2. se riga è added inserisco riga corrispondente, aumento gli indici
                                rowDest.getRow().makeSameAs(tSource.rows[rDestIndex].getRow());
                                // aumento contatore delle righe del source
                                rDestIndex++;
                                continue;
                            }
                            if (currState === dataRowState.deleted){
                                // potrei aver preso degli errori e quindi il commit non è stato fatto, dovrò aumentare il contatore senza cancellare la riga
                                if (changesCommittedToDB) {
                                    // NON aumento contatore delle righe del source! poichè era deleted, quindi sul source non la trovo
                                    // poichè il server avrà fatto acceptChanges()
                                    // qui io voglio che diventi detached e quindi a sua volta eseguo acceptChanges() sulla riga. Verrà tolto il metodo getRow()
                                    rowDest.getRow().acceptChanges();
                                    continue;
                                } else{
                                    rDestIndex++;
                                    continue;
                                }
                            }
                        }
                    } catch (e){
                        logger.log(logType.ERROR, "Dataset disallineati dopo il salvataggio " + e.message);
                    }

                } else {
                    logger.log(logType.ERROR, "La tabella " + tSource.name + " non esiste sul dataset " + dsDest.name);
                }
            });
    };

    /**
     * @function mergeRowsIntoTable
     * @public
     * @description SYNC
     * Merges given "rows" in a specified table "tDest"
     * @param {DataTable} tDest
     * @param {ObjectRow[]} rows
     * @param {boolean} checkExistence
     */
    getDataUtils.mergeRowsIntoTable = function(tDest, rows, checkExistence) {
        _.forEach(rows,
            function(r) {
                if (!checkExistence) {
                    tDest.add({}).makeSameAs(r.getRow());
                    return true;
                }
                var oldRow = tDest.existingRow(r);
                if (oldRow) {
                    oldRow.getRow().makeSameAs(r.getRow());
                } else {
                    tDest.add({}).makeSameAs(r.getRow());
                }
                return true;
            });
    };

    /**
     * @method getAutoChildRelation
     * @private
     * @description SYNC
     * Gets a relation that connects a table with its self. Should be the same as AutoParent
     * @param {DataTable} dt
     * @returns {DataRelation} the auto child relation
     */
    getDataUtils.getAutoChildRelation = function (dt) {
        var autoChildRel = null;
        if (!dt) return null;
        _.forEach(dt.childRelations(), function (rel) {
            if (rel.parentTable === dt.name && rel.childTable === dt.name) {
                autoChildRel = rel;
                // ho trovato la rel esco dal ciclo for
                return false;
            }
        });

        return autoChildRel;
    };

    /**
     * @method getAutoParentRelation
     * @private
     * @description SYNC
     * Gets a relation that connects a table with its self
     * @param {DataTable} dt
     * @returns {DataRelation} the auto parent relation
     */
    getDataUtils.getAutoParentRelation = function (dt) {
        var autoParentRel = null;
        if (!dt) return null;
        _.forEach(dt.parentRelations(), function (rel) {
            if (rel.parentTable === dt.name) {
                autoParentRel = rel;
                // ho trovato la rel esco dal ciclo for
                return false;
            }
        });

        return autoParentRel;
    },


    /**
     * @method containsNull
     * @public
     * @description SYNC
     * Returns true if there is a null value or "", for some value in row on the columns cols
     * @param {ObjectRow} row
     * @param {DataColumn[]} cols
     * @returns {boolean} true or false depending if there are null values on row in cols
     */
    getDataUtils.containsNull = function (row, cols) {
        var res = _.some(cols, function (c) {
            return row[c.name] === null || row[c.name] === "";
        });
        return res;
    };
    
    /**
     * @method compareRows
     * @private
     * @description SYNC
     * Returns true if it is the same row. It compares the columns field key
     * @param {DataTable} dt
     * @param {ObjectRow} r1
     * @param {ObjectRow} r2
     * @returns {boolean} true if r1 and r2 are the same row
     */
    getDataUtils.isSameRow = function (table, r1, r2) {
        if (!r1 || !r2) return false;
        var res =  _.every(table.key(), function (k) {
            return r1[k] === r2[k];
        });
        return res; // torno true se non trovo val differenti sulla chiave
    };

    appMeta.getDataUtils = getDataUtils;
}());

