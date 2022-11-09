/*globals ObjectRow,DataRelation,define,self,jsDataSet,sqlFun,metaModel,appMeta,_ */


/**
 * @module MetaData
 * @description
 * Contains all the information for a MetaData
 */
(function(_,metaModel,localResource,Deferred,
          getDataUtils,logger,logType,getMeta,getDataExt,/*{CType}*/ CType,securityExt) {
    /** Detect free variable `global` from Node.js. */
    let freeGlobal = typeof global === 'object' && global && global.Object === Object && global;
    /** Detect free variable `self`. */
    let freeSelf = typeof self === 'object' && self && self.Object === Object && self;
    /** Used as a reference to the global object. */
    let root = freeGlobal || freeSelf || Function('return this')();
    /** Detect free variable `exports`. */
    let freeExports = typeof exports === 'object' && exports && !exports.nodeType && exports;
    /** Detect free variable `module`. */
    let freeModule = freeExports && typeof module === 'object' && module && !module.nodeType && module;


    //noinspection JSUnresolvedVariable
    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
    let moduleExports = freeModule && freeModule.exports === freeExports;




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
         * Preserve method code. Used server side.
         * @param {Request} req
         */
        setRequest: function (req){
            if (!req) {
                return;
            }
            const ctx = req.app.locals.context;

            //This applies to backend. On the frontend side they are assigned to LocalResource prototype once at the beginning
            //  cause they are unique in the client side.
            this.localResource = ctx.localResource;
            this.getData = ctx.getDataInvoke;
            this.security = ctx.environment;
            this.getMeta = ctx.getMeta;
        },

        /**
         *
         * @param {string} lan
         */
        setLanguage: function (lan){
            this.localResource = localResource.prototype.getLocalResource(lan);
        },

        /**
         * @method isValid
         * @public
         * @description ASYNC
         * Checks if a DataRow "r" has a valid data. Returns an object { warningMsg, errMsg, errField, row }
         * @param {DataRow} r
         * @returns {Deferred} can be null or Object
         */
         isValid: function(r) {
            const emptyKeyMsg = this.localResource.dictionary.emptyKeyMsg;
            const emptyFieldMsg = this.localResource.dictionary.emptyFieldMsg;
            const stringTooLong = this.localResource.dictionary.stringTooLong;
            const noDataSelected = this.localResource.dictionary.noDataSelected;
            const emptyDate = "1000-01-01";
            let outMsg = null;
            let outField = null;
            let val;
            let outCaption = '';
            let foundCondition = false;
            const self = this;

            if (!r) return self.createIsValidResult(noDataSelected, noDataSelected, outCaption, r);

            _.forEach(
                r.table.key() ,
                function(colName) {
                    const col = r.table.columns[colName];

                    outCaption = colName;
                    if (col.caption && col.caption !== "") outCaption = col.caption;

                    val =  r.current[colName];
                    if (col.caption && col.caption !== "" && col.caption !== colName) outCaption = col.caption;

                    if ((val === null)) {
                        outMsg = emptyKeyMsg;
                        outField = colName;
                        foundCondition = true;
                        return false;
                    }
                    if (col.ctype === CType.date){ //( typeof val === "object" && val.constructor === Date) {

                        if (!val) {
                            outMsg = emptyKeyMsg;
                            outField = colName;
                            foundCondition = true;
                            return false;
                        }
                        if (val.getTime && val.getTime() === new Date(emptyDate).getTime()){
                            outMsg = emptyKeyMsg;
                            outField = colName;
                            foundCondition = true;
                            return false;
                        }
                    }
                    if ( col.ctype === CType.string  &&
                        (val.replace(/\s*$/,"") === "")) { //Esegue il trimEnd
                        outMsg = emptyKeyMsg;
                        outField = colName;
                        foundCondition = true;
                        return false;
                    }

                    if (!metaModel.allowZero(col) && metaModel.isColumnNumeric(col) && val === 0) {
                        outMsg = emptyKeyMsg;
                        outField = colName;
                        foundCondition = true;
                        return false;
                    }
                    return true;
                });

            // esco con promise se ho trovato una condizione di uscita
            if (foundCondition) return self.createIsValidResult(outMsg, outField, outCaption, r);

			outCaption = '';
            _.forOwn(
                r.table.columns ,
                /**
                 * @param {DataColumn} c
                 * @return {boolean}
                 */
                function(c) {
                    let colname = c.name;
                    val = r.current[colname];

                    // caption è valorizzata dal back da colDescr oppure tramite la setCaption dal programmatore.
                    outCaption = colname;
                    if (c.caption && c.caption !== "") outCaption = c.caption;

                    if (c.ctype === CType.string) {
                        const thisLen = val ? val.toString().length : 0;
                        const maxLen = metaModel.getMaxLen(c);
                        if (maxLen > 0 && thisLen > maxLen) {
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

                    if (c.ctype === CType.date || c.ctype === CType.DateTime ) {
                        if (!val) {
                            outMsg = emptyKeyMsg;
                            outField = colname;
                            return false;
                        }
                        if (val.getTime && val.getTime() === new Date(emptyDate).getTime()) {
                            outMsg = emptyFieldMsg;
                            outField = colname;
                            return false;
                        }
                    }

                    // E' passato il   if ((val === null) || (val === undefined))  ma devo fare attenzione a stringa vuota o a zero
                    if ((c.ctype === CType.string) && (val.replace(/\s*$/, "") === "")) {
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

            return self.createIsValidResult(outMsg, outField, outCaption, r);
        },

        /**
         * @method setCaption
         * @public
         * @description SYNC
         * To override in extended classes if user want to assign a friendly name to the column.
         * Friendly names are used in isValid messages
         * N.B:captions are set on backend, if there is a configuration o coldescr
         * @param {DataTable} table
         * @param {string} edittype
         */
        setCaption: function(table, edittype) {
        },


        /**
         * @method primaryKey
         * @public
         * @description SYNC
         * Returns the list of primary key fields, this has to be redefined for views.
         * @return {string[]}
         */
        primaryKey: function() {
            return  [];
        },

        /**
         * @method createIsValidResult
         * @private
         * @description ASYNC
         * Auxiliar function that builds the result of the isValid promise
         * ex  getPromiseIsValidObject
         * @param {string} errMessage
         * @param {string} colname
         * @param {string} outCaption
         * @param {DataRow} row
         * @param {string} [warningMessage]
         * @returns {Deferred}
         */
        createIsValidResult: function (errMessage, colname, outCaption, row, warningMessage) {
            let def = Deferred("createIsValidResult");
            if (!errMessage) return def.resolve(null);
            let objRes = {
                warningMsg: warningMessage,
                errMsg: errMessage , //+ " (" + outCaption + ")"
                errField: colname,
                outCaption: outCaption,
                row: row
            };
            return def.resolve(objRes).promise();
        },

        /**
         * @method describeColumnsStructure
         * @public
         * @description ASYNCH
         * Sets Captions, DenyNull and Format properties of Columns. They are usually set on backend.
         * @param {DataTable} table
         * @returns {*}
         */
        describeColumnsStructure: function(table) {

        },

        /**
         * @method describeAColumn
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
            const c = t.columns[cName];
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
         * @returns {jsDataQuery|null}
         */
        insertFilter:function() {
            return null;
        },

        /**
         * @method searchFilter
         * @public
         * @description SYNC
         * @returns {jsDataQuery|null}
         */
        searchFilter: function () {
            return null;
        },

        /**
         * @method describeColumns
         * @public
         * @description ASYNC
         * Describes a listing type (captions, column order, formulas, column formats and so on)
         * @param {DataTable} table
         * @param {string} listType
         * @returns {Promise<DataTable>}
         */
        describeColumns: function (table, listType) {
            let def = Deferred("describeColumns");
            // let self = this;
            // // recupero dal server o dalla cache la tabella di cui è fatto il describe columns
            // const res = getData.describeColumns(table, listType)
            //     .then(function (dtDescribed) {
            //         // applico alle colonne della output table quelle calcolate dalla describeColumns
            //         self.copyColumnsPropertiesToDescribe(dtDescribed.columns, table.columns);
            //         // 2. applico sorting e staticFilter che sono static calcolati in questa fase
            //         const sorting = self.getSorting(listType);
            //         metaModel.sorting(table, sorting ? sorting : metaModel.sorting(dtDescribed));
            //         table.staticFilter(dtDescribed.staticFilter());
            //         def.resolve();
            //     });
            return def.resolve(table).promise();
        },

        // /**
        //  * @method copyColumnsPropertiesToDescribe
        //  * @public
        //  * @description SYNC
        //  * Copies the properties "columnsKeysDescribed" of the column from src to dest.
        //  * @param {{DataColumn}} colsSrc
        //  * @param {{DataColumn}} colsDest
        //  */
        // copyColumnsPropertiesToDescribe:function (colsSrc, colsDest) {
        //     _.forIn(colsSrc, function (colSrc) {
        //         const colDest = colsDest[colSrc.name];
        //         if (!colDest) {
        //             return true; // prossima iterazione
        //         }
        //         _.forEach(['caption', 'listColPos', 'format', 'expression'], function (key) {
        //             colDest[key] = colSrc[key];
        //         });
        //     });
        // },

        /**
         * @method describeTree
         * @public
         * @description ASYNC
         * Describes the table of the tree
         * @param {DataTable} table
         * @param {string} listType
         * @returns {{rootCondition: sqlFun, nodeDispatcher: TreeNode_Dispatcher, maxDepth: int}}
         */
        describeTree:function (table, listType) {
            return Deferred.resolve(true).promise();
        },

        /**
         * @method getStaticFilter
         * @public
         * @description ASYNC
         * Gets the static filter associated to the "listType"
         * @param listType
         * @return {jsDataQuery | null}
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
                                        return c.listColPos !== -1;

                                    }),
                                'listColPos'),
                            function (dc) {
                                return dc.name;
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
         * @public
         * @description ASYNCH
         * Sets the default values for a DataTable. DataTable coming from server ha already its defaults. This method can contain some customization
         * @param {DataTable} table
         */
        setDefaults: function(table) {
            // si intende che il datatable sia già corredato dai defaults per come è stato deserializzato dal server
            // questo metodo può contenere al massimo delle personalizzazioni
        },

        /**
         * @method setOrderBy
         * @public
         * @description SYNC
         * Sets the static filter
         */
        setSorting: function() {
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
         * @description ASYNC
         * Gets new row, having ParentRow as Parent, and adds it on DataTable "dtDest"
         * @param {DataRow} parentRow. Parent Row of the new Row to create, or null if no parent is present
         * @param {DataTable} dtDest  Table in which row has to be added
         * @returns {Deferred<DataRow|null>}
         */
        getNewRow:function (parentRow, dtDest) {
            let def = new Deferred("getNewRow");
            let realParentObjectRow = parentRow ? parentRow.current : undefined;
            let objRow = dtDest.newRow({}, realParentObjectRow);
            // restituisco la dataRow creata
            return def.resolve(objRow.getRow());
        },

        /**
         * @method copyExtraPropertiesTable
         * @public
         * @description SYNC
         * Copies some structure properties form dtIn to dtOut
         * @param {DataTable} dtIn
         * @param {DataTable} dtDest
         */
        copyExtraPropertiesTable:function (dtIn, dtDest) {
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
         * @method doDelete
         * @public
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
         * @returns {Deferred<DataRow>} A row belonging to a table equal to PrimaryTable
         */
        selectByCondition:function (filter, tableName) {
            const def = Deferred("selectByCondition");
            const self = this;
            const res = this.getData.selectCount(tableName, filter)
                .then(function (resultCount) {
                    if (resultCount !== 1) return def.resolve(null);
                    return self.getData.runSelect(self.primaryTableName, "*", filter, null)
                        .then(function (dataTable) {
                            if (!dataTable.rows.length) return def.resolve(null);
                            return def.from(self.checkSelectRow(dataTable, dataTable.rows[0].getRow()));
                        });
                });

            return def.from(res).promise();
        },

        /***
         * Client function
         * @method checkSelectRow
         * @private
         * @description ASYNC
         * @public
         * Resolves a Deferred with dataRow if dataRow is selectable, null otherwise
         * @param {DataTable} t
         * @param {DataRow} dataRow
         * @returns {Deferred<null | DataRow>}
         */
        checkSelectRow:function(t, dataRow) {
            if (typeof appMeta=== undefined)return ;
            const modal = appMeta.BootstrapModal;

            const def = Deferred("MetaData-checkSelectRow");
            if (!dataRow) return def.resolve(null);
            const res = this.canSelect(dataRow)
                .then(function (result) {
                    if (result) {
                        return def.resolve(dataRow);
                    }
                    const winModal = new modal(
                        this.localResource.dictionary.alert,
                        this.localResource.dictionary.itemChooseNotSelectable, [this.localResource.dictionary.ok],
                        null,
                        null);
                    return winModal.show()
                        .then(function () {
                            return def.resolve(null);
                        });
                });
            return def.from(res).promise();

        },

        /**
         *
         * @param {DataRow} dataRow
         * @returns {Promise<boolean>}
         */
        canSelect:function (dataRow) {
        	if(typeof appMeta === 'undefined')
            	return securityExt.canSelect(dataRow);
            else
            	return Deferred().resolve(true).promise();
        },

        recusiveNewCopyChilds: recusiveNewCopyChilds
    };

    /** Take effect on client side **/

    MetaData.prototype.localResource = localResource;
    MetaData.prototype.getData = getDataExt;        //this is replaced server side with ctx.getDataInvoke
    MetaData.prototype.security = securityExt;      //this is replaces server side with ctx.environment;
    MetaData.prototype.getMeta = getMeta;           //this is replaces server side with ctx.getMeta;



    /**
     *
     * @param {ObjectRow} destRow
     * @param {ObjectRow} sourceRow
     */
    function recusiveNewCopyChilds (destRow, sourceRow) {
        /* DataTable */
        let sourceTable = sourceRow.getRow().table;
        /* DataSet */
        let dsSource = sourceTable.dataset;
        let relations = sourceTable.childRelations();

        let allNewChildRowDeferred = [];

        _.forEach(relations,
            /**
             * @param {DataRelation} rel
             * @return {boolean}
             */
            function (rel) {

                let childTableName = rel.childTable;
                let /* DataTable */ childTable = dsSource.tables[childTableName];
                if (childTable.skipInsertCopy()) return true;

                if (!metaModel.isSubEntity(childTable, destRow.getRow().table)) {
                    return true; // continua nel ciclo
                }

                if (childTableName === sourceTable.tableName) {
                    return true; // continua nel ciclo
                }


                let childRowCopy = rel.getChild(sourceRow); //  sourceRow.getRow().getChildRows(rel.name);

                let metaChild = this.getMeta(childTableName);
                metaChild.setDefaults(childTable);
                metaChild.setSorting(childTable);

                // creo catena di deferred iterative, ognuna ha bisogno del risultato precedente. poichè se ci sono più child devo inserire in
                // self.state.DS.tables[defObj.childTableName] le righe con id momentaneo calcolato diverso. Lui riesce a calcolare
                // l'id ovviamente solo se già ci sono le righe messe in precedenza. Nel vecchi metodo prima di questa modifica,
                // metteva solo una riga l'ultima poichè l'id era sempre lo stesso. nel ciclo passavo sempre la tabella vuota all'inizio
                let chain = Deferred.resolve(true);

                _.forEach(childRowCopy, function (childSourceRow) {

                    chain = chain.then(function () {

                        return metaChild.getNewRow(destRow,childTable)
                            .then(function (newChildRow) {
                                // copio la riga child calcolata sul dt destinazione, così vado ogni volta ad incrementare le righe.
                                // nel successivo .then della catena il dt sarà modificato
                                _.forIn(childTable.columns,
                                    /**
                                     * @param {DataColumn} childCol
                                     * @param {string} childColName
                                     */
                                    function (childCol, childColName) {
                                        if (rel.childCols.some( c => c === childColName )) return true; // continuo nel ciclo
                                        metaChild.insertCopyColumn(childCol, childSourceRow, newChildRow);
                                    });
                                return recusiveNewCopyChilds(newChildRow, childSourceRow);
                            });

                    });

                    // inserisco array di deferred , cioè uno per ogni relazione di cui eventualmente devo vedere i figli
                    allNewChildRowDeferred.push(chain);
                });

            }); // chiude primo for sulle relazioni

        return Deferred.when.apply(Deferred, allNewChildRowDeferred);
    }

    if (freeExports && freeModule) {
        // Export for a browser or Rhino.
        if (root.appMeta) {
            root.appMeta.MetaData = MetaData;
        }
        else {
            if (moduleExports) { // Export for Node.js or RingoJS.
                (freeModule.exports = MetaData).MetaData = MetaData;
            }
            else { // Export for Narwhal or Rhino -require.
                freeExports.MetaData = MetaData;
            }
        }
    }
    else {
        // Export for a browser or Rhino.
        if (root.appMeta){
            root.appMeta.MetaData = MetaData;
        }
        else {
            root.MetaData=MetaData;
        }
    }

}(  (typeof _ === 'undefined') ? require('lodash') : _,
    (typeof appMeta === 'undefined') ? require('./MetaModel').metaModel : appMeta.metaModel,
    (typeof appMeta === 'undefined') ? require('./LocalResource').localResource : appMeta.LocalResource,
    (typeof appMeta === 'undefined') ? require('./EventManager').Deferred : appMeta.Deferred,
    (typeof appMeta === 'undefined') ? require('./GetDataUtils') : appMeta.getDataUtils,
    (typeof appMeta === 'undefined') ? require('./Logger').logger : appMeta.logger,
    (typeof appMeta === 'undefined') ? require('./Logger').logTypeEnum : appMeta.logTypeEnum,
    (typeof appMeta === 'undefined') ? undefined : appMeta.getMeta.bind(appMeta),
    (typeof appMeta === 'undefined') ? undefined : appMeta.getData,
    (typeof jsDataSet === 'undefined') ? require('./../metadata/jsDataSet').CType : jsDataSet.CType,
    (typeof appMeta === 'undefined') ? undefined : appMeta.security
    )
);

