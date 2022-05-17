/**
 * @module MetaData
 * @description
 * Contains all the information for a MetaData
 */
(function() {
    var metaModel = appMeta.metaModel;
    var localResource = appMeta.localResource;
    var Deferred = appMeta.Deferred;
    var getDataUtils  = appMeta.getDataUtils;
    var getData  = appMeta.getData;
    var methodEnum = appMeta.routing.methodEnum;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var modal = appMeta.BootstrapModal;
    var sec = appMeta.security;

    /**
     * @constructor AutoInfo
     * @description
     * @param {Html node} G usually DIV or SPAN
     * @param {string} type
     * @param {jsDataQuery} startfilter
     * @param {string} startfield
     * @param {string} table
     * @param {string} kind

     */
    function AutoInfo( G,
                       type,
                       startfilter,
                       startfield,
                       table,
                       kind) {
        this.G = G;
        this.type = type;
        this.startfield = startfield;
        this.startFilter = startfilter;
        this.table = table;
        this.kind = kind;
    }


    /**
     * @constructor MetaData
     * @description Information about a metadata
     * @param {string} tableName
     */
    function MetaData(tableName) {
       
        this.tableName = tableName;
        this.metaPage= null;
        this.listTop = 0;

        return this;
    }

    MetaData.prototype = {
        constructor: MetaData,



        /**
         * @method isValid
         * @public
         * @description ASYNC
         * Checks if a DataRow "r" has a valid data. Returns an object { warningMsg, errMsg, errField, row }
         * @param {DataRow} r
         * @returns {Deferred} can be null or Object
         */
        isValid: function(r) {
            var emptyKeyMsg = localResource.emptyKeyMsg;
            var emptyFieldMsg = localResource.emptyFieldMsg;
            var stringTooLong =  localResource.stringTooLong;
            var noDataSelected =  localResource.noDataSelected;
            var emptyDate = "1000-01-01";
            var outMsg = null;
            var outField = null;
            var val;
            var outCaption  = '';
            var foundCondition = false;
            var self = this;

            if (!r) return self.getPromiseIsValidObject(noDataSelected, noDataSelected, outCaption, r);
            

            _.forEach(
                r.table.key() ,
                function(cname) {
                    var col = r.table.columns[cname];

                    outCaption = cname;
                    if (col.caption && col.caption !== "") outCaption = col.caption;

                    val =  r.current[cname];
                    if (col.caption && col.caption !== "" && col.caption !== cname) outCaption = col.caption;

                    if ((val === null)) {
                        outMsg = emptyKeyMsg;
                        outField = cname;
                        foundCondition = true;
                        return false;
                    }
                    if (col.ctype === "DateTime"){ //( typeof val === "object" && val.constructor === Date) {

                        if (!val) {
                            outMsg = emptyKeyMsg;
                            outField = cname;
                            foundCondition = true;
                            return false;
                        }
                        if (val.getTime && val.getTime() === new Date(emptyDate).getTime()){
                            outMsg = emptyKeyMsg;
                            outField = cname;
                            foundCondition = true;
                            return false;
                        }
                    }

                    if ( col.ctype === "String"  &&
                        (val.replace(/\s*$/,"") === "")) { //Esegue il trimEnd
                        outMsg = emptyKeyMsg;
                        outField = cname;
                        foundCondition = true;
                        return false;
                    }

                    if (!metaModel.allowZero(col) && metaModel.isColumnNumeric(col) && val === 0) {
                        outMsg = emptyKeyMsg;
                        outField = cname;
                        foundCondition = true;
                        return false;
                    }
                    return true;
                });

            // esco con promise se ho trovato una condizione di uscita
            if (foundCondition) return self.getPromiseIsValidObject(outMsg, outField, outCaption, r);

			outCaption = '';
            _.forEach(
                r.table.columns ,
                function(c) {
                    var colname = c.name;
                    val = r.current[colname];

                    // caption è valorizzata dal back da colDescr oppure tramite la setCaption dal programmatore.
                    outCaption = colname;
                    if (c.caption && c.caption !== "") outCaption = c.caption;

                    if (c.ctype === "String") {
                        var thislen = val ? val.toString().length : 0;
                        var maxlen = metaModel.getMaxLen(c);
                        if (maxlen > 0 && thislen > maxlen) {
                            outMsg = stringTooLong;
                            outField = colname;
                            return false;
                        }
                    }

                    if (metaModel.allowDbNull(c) && !metaModel.denyNull(c)) {
                        return true; // Continua
                    }

                    if ((val === null) || (val === undefined)) {
                        outMsg = emptyFieldMsg;
                        outField = colname;
                        return false;
                    }

                    if (c.ctype === "DateTime") {
                        if (!val) {
                            outMsg = emptyKeyMsg;
                            outField = cname;
                            return false;
                        }
                        if (val.getTime && val.getTime() === new Date(emptyDate).getTime()) {
                            outMsg = emptyFieldMsg;
                            outField = colname;
                            return false;
                        }
                    }

                    // E' passato il   if ((val === null) || (val === undefined))  ma devo fare attenzione a stringa vuota o a zero
                    if ((c.ctype === "String") && (val.replace(/\s*$/, "") === "")) {
                        outMsg = emptyFieldMsg;
                        outField = colname;
                        return false;
                    }

                    if (!metaModel.allowZero(c) && metaModel.isColumnNumeric(c) && metaModel.denyZero(c) && val === 0) {
                        outMsg = emptyFieldMsg;
                        outField = colname;
                        return false;
                    }

					return true;

                });

            return self.getPromiseIsValidObject(outMsg, outField, outCaption, r);
        },

        /**
         * @method setCaption
         * @private
         * @description SYNC
         * To override on extended class if user want to assign a caption to the column.
         * N.B:captions are set on backend, if there is a configuration o coldesr
         * This column appears on isValid message
         * @param {DataTable} table
         * @param {string} edittype
         */
        setCaption: function(table, edittype) {
        },

        /**
         * @method getPromiseIsValidObject
         * @private
         * @description ASYNC
         * Auxiliar function that builds the result of the isValid promise
         * @param {string} errmess
         * @param {string} colname
         * @param {string} outCaption
         * @param {DataRow} row
         * @param {string} warningMessage
         * @returns {Deferred}
         */
        getPromiseIsValidObject: function (errmess, colname, outCaption, row, warningMessage) {
            var def = Deferred("getPromiseIsValidObject");
            if(!errmess && !colname) return def.resolve(null);
            var objres = {
                warningMsg: warningMessage,
                errMsg: errmess + " (" + outCaption + ")",
                errField: colname,
                outCaption: outCaption,
                row: row
            };
            return def.resolve(objres)
        },

        /**
         * @method describeColumnsStructure
         * @public
         * @description ASYNCH
         * Sets DenyNull and Format properties of Columns. They are usually set on backend.
         * @param {DataTable} table
         * @returns {*}
         */
        describeColumnsStructure: function(table) {

        },

        /**
         * @method describeColumnsStructure
         * @public
         * @description SYNC
         * Set some information (useful on visualization) on column "cName"
         * @param {DataTable} t
         * @param {string} cName
         * @param {string} caption
         * @param {string} format
         * @param {Number} pos
         * @param {Number} maxLen
         */
        describeAColumn: function (t, cName, caption, format, pos, maxLen) {
            var c = t.columns[cName];
            if (!c) return;
            c.caption = (caption === '') ? '' : caption || c.name;
            if (format) c.format = format;
            if (maxLen) c.maxstringlen = maxLen;
            if (maxLen) c.length = maxLen;
            c.listColPos = pos || -1;
        },

        /**
         * @method insertFilter
         * @public
         * @description SYNC
         * @returns {undefined}
         */
        insertFilter:function() {
            return undefined;
        },

        /**
         * @method searchFilter
         * @public
         * @description SYNC
         * @returns {undefined}
         */
        searchFilter: function () {
            return undefined;
        },

        /**
         * @method describeColumns
         * @public
         * @description ASYNC
         * Describes a listing type (captions, column order, formulas, column formats and so on)
         * @param {DataTable} table
         * @param {string} listType
         * @returns {Deferred(DataTable)}
         */
        describeColumns: function (table, listType) {
           var def = Deferred("describeColumns");
           var self = this;
           // recupero dal server o dalla cache la tabella di cui è fatto il describe columns
           var res = getData.describeColumns(table, listType)
               .then(function (dtDescribed) {
                 // applico alle colonne della output table quelle calcolate dalla describeColumns
                   self.copyColumnsPropertiesToDescribe(dtDescribed.columns, table.columns);
                   // 2. applico sorting e staticFilter che sono static calcolati in questa fase
                   var sorting = self.getSorting(listType);
                   metaModel.sorting(table, sorting ? sorting : metaModel.sorting(dtDescribed));
                   table.staticFilter(dtDescribed.staticFilter());
                   def.resolve();
           });
            
           return def.from(res).promise(); 
        },

        /**
         * @method copyColumnsPropertiesToDescribe
         * @public
         * @description SYNC
         * Copies the properties "columnsKeysDescribed" of the column from src to dest.
         * @param {DataColumn[]} colsSrc
         * @param {DataColumn[]} colsDest
         */
        copyColumnsPropertiesToDescribe:function (colsSrc, colsDest) {
            _.forEach(colsSrc, function (colSrc) {
                var colDest = colsDest[colSrc.name];
                if (!colDest) return true; // prossima iterazione
                // copio solo le proprietà che mi aspetto
                _.forEach(['caption', 'listColPos', 'format', 'expression'], function (key) {
                    colDest[key] = colSrc[key];
                });
            });
        },

        /**
         * @method describeTree
         * @public
         * @description ASYNC
         * Describes the table of the tree
         * @param {DataTable} table
         * @param {string} listType
         * @returns {*}
         */
        describeTree:function (table, listType) {
            var def = Deferred("describeTree");
            
            // lato server torna rootcondition e poi vedremo cosa altro
            var resDef = getData.describeTree(table, listType)
            // N.B: ----> quando ritorno al treeview chiamante, torno le prorietà custom che si aspetta.
            // il default si aspetta solo  "rootCondition"
                .then(function (res) {

                    // recupero il filtro jsDataQuery dal json
                    var rootCondition = getDataUtils.getJsDataQueryFromJson(res.rootCondition);

                    def.resolve({
	                    rootCondition: rootCondition,
	                    withdescr: res.withdescr,
	                    maxDepth: res.maxDepth,
                        nodeDispatcher: new appMeta.TreeNode_Dispatcher()

                        //.... @remarks nell'override passerò diversi prm a seconda del tree
                        //prop1: "prop1",
                        //propN: "propN"
                    })
                });
              
            return def.from(resDef).promise();
        },

        /**
         * @method getStaticFilter
         * @public
         * @description ASYNC
         * Gets the static filter associated to the "listType"
         * @param listType
         */
        getStaticFilter:function (listType) {
            return null;
        },

        /**
         * @method sortedColumnNameList
         * @public
         * @description ASYNC
         * Returns the list of real (not temporary or expression) columns NAMES of a table "table"
         * formatting it like "fieldname1, fieldname2,...."
         * @param {DataTable} table
         */
        sortedColumnNameList:function (table) {
            return  _.join(
                        _.map(
                            _.sortBy(
                                _.filter(table.columns,
                                    function(c) {
                                        if (metaModel.temporaryColumn(c)) return false;
                                        if (c.name.startsWith("!")) return false;
                                        // if (!c.listColPos) return false;
                                        if (c.listColPos === -1) return false;
                                        return true;
                                    }),
                                'listColPos'),
                            function (dc) {
                                return dc.name
                            }),
                    ",");
        },

        /**
         * @method getName
         * @public
         * @description SYNC
         * Gets metadata name
         * @param {string} editType
         * @returns {string}
         */
        getName: function(editType) {
            return this.tableName;
        },

        /**
         * @method setDefaults
         * @private
         * @description ASYNCH
         * Sets the default values for a DataTable. DataTable coming from server ha already its defaults. This method can contain some customization
         * @param {DataTable} table
         */
        setDefaults: function(table) {
            // si intende che il datatable sia già corredato dai defaults per come è stato deserializzato dal server
            // questo metodo può contenere al massimo delle personalizzazioni
        },

        /**
         * @method getSorting
         * @public
         * @description SYNC
         * Returns the default sorting for a list type "listType"
         * @param {string} listType
         * @returns {string|null}
         */
        getSorting: function(listType) {
            return null;
        },

        /**
         * @method getNewRow
         * @public
         * @description ASYNCH
         * Gets new row, having ParentRow as Parent, and adds it on DataTable "dtDest"
         * @param {DataRow} parentRow. Parent Row of the new Row to create, or null if no parent is present
         * @param {DataTable} dtDest. Table in which row has to be added
         * @returns {Deferred(DataRow|null)}
         */
        getNewRow:function (parentRow, dtDest) {
            var def = Deferred("getNewRow");
            var self = this;
            var jsonTableChild = getDataUtils.getJsonFromDataTable(dtDest);
            var jsonTableParent = null;
            var relFound = null;

            // per individuare la riga lato server, passo tabella + filtro
            if (parentRow){
                // recupero relazione padre figlio che servirà lto backend per recuperare le info per creare la riga figlia a seocnda del padre
                var relsFound = dtDest.dataset.getParentChildRelation(parentRow.table.name, dtDest.name);
                if (relsFound && relsFound.length) {
                    relFound = relsFound[0];
                } else {
                    logger.log(logType.ERROR, "Nessuna relazione trovata tra tabella padre: " + parentRow.table.name + " e tabella figlia: " + dtDest.name);
                    return def.resolve(null);
                }

                var tParentClone = parentRow.table.clone();
                tParentClone.importRow(parentRow.current);
                jsonTableParent = getDataUtils.getJsonFromDataTable(tParentClone);
            }

            var objConn = {
                method: methodEnum.getNewRow,
                prm: {
                    dtChild:jsonTableChild,
                    dtParent:jsonTableParent,
                    rel:getDataUtils.getDataRelationSerialized(relFound) // serializzo la Relazione
                }
            };

            return  appMeta.connection.call(objConn)
                .then(function (json) {
                    // il json di risposta contiene 2 oggetti serializzati. 1. il dt 2. il filtro della riga inserita
                    var jsonDtOut  = json.dt;
                    var jsonFilterOut = json.filter;
                    // deserializzo
                    var dtOut = getDataUtils.getJsDataTableFromJson(jsonDtOut);
                    var filter = getDataUtils.getJsDataQueryFromJson(jsonFilterOut);
                    // recupero riga
                    var rowAdded = dtOut.select(filter);

                    if (rowAdded.length === 1){
                        // eseguo merge delle righe
                        getDataUtils.mergeRowsIntoTable(dtDest, rowAdded, true);

                        // E' necessario restituire la riga trasferita nel dataset originale e non quella del dataset temporaneo
                        var rowInsertedDtDest = dtDest.select(dtOut.keyFilter(rowAdded[0]))[0];

                        self.copyExtraPropertiesTable(dtOut, dtDest);

                        // torno la riga appena inserita
                        return def.resolve(rowInsertedDtDest.getRow());
                    }

                    logger.log(logType.ERROR, "error adding new row. rows added " + rowAdded.length);
                    return def.resolve(null);

                }, function(err) {
                    return def.reject(err).promise();
                })
        },

        /**
         * @method copyExtraPropertiesTable
         * @public
         * @description SYNC
         * Copies some useful properties form dtIn to dtOut
         * @param {DataTable} dtIn
         * @param {DataTable} dtDest
         */
        copyExtraPropertiesTable:function (dtIn, dtDest) {
            var self = this;
            // copio tutte le proprietà delle colonne eventualmente ricalcolate, tranne
            // quelle descritte nella describeColumns, cioè posizione e caption e formato
            _.forEach(dtIn.columns, function (c) {
                _.forOwn(c, function(value, key) {
                    if (_.includes(['caption', 'listColPos', 'format', 'expression'], key)) return true; // continua non copiare
                    if (dtDest.columns[c.name]) dtDest.columns[c.name][key] = value;
                } );
            });

            // copia gli autoincrements
            metaModel.copyAutoincrementsProperties(dtIn, dtDest);
            // copia i defaults
            dtDest.defaults(dtIn.defaults());
        },


        /**
         * @method getNewRowCopyChilds
         * @public
         * @description ASYNC
         * Does the copy of primary row selected and its child
         * @param {DataRow} primaryRowCopy main row already copied
         * @param {DataRow} rowToInsert main row in dsTarget copied
         * @param {DataSet} dsCopy dataset to copy
         * @param {DataSet} dsTarget dataset target. is the metapage dataset
         * @param {string} tableName main table name
         * @param {string} editType
         * @returns {deferred} def
         */
        getNewRowCopyChilds:function (primaryRowCopy, rowToInsert, dsCopy, dsTarget ,tableName, editType) {
            var def  = Deferred("getCopyChilds");
            var self = this;

            // tabella principale dove c'è la riga appena inserita
            var dtPrimary = dsTarget.tables[tableName];
            var objConn = {
                method: methodEnum.getNewRowCopyChilds,
                prm: {
                    dsIn: getDataUtils.getJsonFromJsDataSet(dsCopy, true), // dataset da copiare
                    dtPrimary: getDataUtils.getJsonFromDataTable(dtPrimary), // tabella principale del ds di pagina per recuperare la row appena inserita lato backend
                    tableName:tableName,
                    editType:editType,
                    filterPrimary:  getDataUtils.getJsonFromJsDataQuery(primaryRowCopy.table.keyFilter(primaryRowCopy.current)), // filtro sulla riga già copaita sul nuovo ds
                    filterInsertRow:  getDataUtils.getJsonFromJsDataQuery(rowToInsert.table.keyFilter(rowToInsert.current)) // filtro sullariga inseita sul ds principale
                }
            };
            return  appMeta.connection.call(objConn)
                .then(function (dsJson) {
                        var myDSout = getDataUtils.getJsDataSetFromJson(dsJson);
                        // metto le righe sul ds target cioè quello di pagina
                        getDataUtils.mergeDataSet(dsTarget, myDSout, true);

                        // copio alcune proprietà che vengono valorizzate sulla getNewRow
                        _.forEach(myDSout.tables, function (table) {
                            var dtDest = dsTarget.tables[table.name];
                            // per la tab principale non copio le proprietà , le quali già sono corrette, perche getNewrow sulla pricipale è stata fatta prima lato client
                            if (dtDest && table.name !== tableName) {
                                self.copyExtraPropertiesTable(table, dtDest);
                            }
                        });

                       return def.resolve(myDSout);
                    }, function(err) {
                       return def.reject(err).promise();
                    }
                )
        },

        /**
         * @method doDelete
         * @private
         * @description SYNC
         * To override eventually. Copies the value of the column col of the row "source" on the row "dest"
         * @param {DataColumn} col
         * @param {ObjectRow} sourceRow
         * @param {ObjectRow} destRow
         */
        insertCopyColumn:function (col, sourceRow, destRow) {
            destRow[col.name] = sourceRow[col.name];
        },

        /**
         * @method selectByCondition
         * @private
         * @description ASYNC
         * Returns a row searched by a filter condition if there is only one row that satisfy
         * the filter, and it is a selectable row. Otherwise returns null
         * @param {jsDataQuery} filter
         * @param {string} tableName
         * @returns {Deferred(DataRow)} A row belonging to a table equal to PrimaryTable
         */
        selectByCondition:function (filter, tableName) {
            var def = Deferred("selectByCondition");
            var self = this;
            var res =  getData.selectCount(tableName, filter)
                .then(function(resultCount) {
                    if (resultCount !== 1) return def.resolve(null);
                    return getData.runSelect(self.primaryTableName, "*", filter, null)
                        .then(function(dataTable) {
                            if (!dataTable.rows.length) return def.resolve(null);
                            return def.from(self.checkSelectRow(dataTable, dataTable.rows[0].getRow()));
                        });
                });

            return def.from(res).promise();
        },

        /***
         * @method checkSelectRow
         * @private
         * @description ASYNC
         * "public virtual"
         * Resolves a Deferred with dataRow if dataRow is selectable, null otherwise
         * @param {DataTable} t
         * @param {DataRow} dataRow
         * @returns {Deferred(null | DataRow)}
         */
        checkSelectRow:function(t, dataRow) {
            var def = Deferred("MetaData-checkSelectRow");
            if (!dataRow) return def.resolve(null);
            var res = this.canSelect(dataRow)
                .then(function (result) {
                    if (result) return def.resolve(dataRow);
                    var winModal = new modal(
                        localResource.alert,
                        localResource.itemChooseNotSelectable, [localResource.ok],
                        null,
                        null);
                    return winModal.show()
                        .then(function () {
                         return def.resolve(null);
                    })
                });
            return def.from(res).promise();

        },

        /**
         *
         * @param {DataRow} dataRow
         * @returns {Deferred(boolean)}
         */
        canSelect:function (dataRow) {
            return sec.canSelect(dataRow)
        }
    };

    appMeta.MetaData = MetaData;
    appMeta.MetaData.AutoInfo = AutoInfo;
}());

