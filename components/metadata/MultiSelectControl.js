/**
 * @module MultiSelectControl
 * @description
 * Manages the logic and the graphics of a multiselect control.
 * It has two grid. One is the input grid with the rows to added, the second is the grid with the rows added in the sourceTable
 */
(function() {

    var locale = appMeta.localResource;
    var Deferred = appMeta.Deferred;
    var logType = appMeta.logTypeEnum;
    var logger = appMeta.logger;
    var dataRowState = jsDataSet.dataRowState;
    var model = appMeta.metaModel;
    var getData = appMeta.getData;
    var q = window.jsDataQuery;

    /**
     * @constructor
     * @description
     * Initializes a multiSelect control
     * @param {html node} rootElement
     * @param {MetaPage} metaPage
     * @param {DataTable} sourceTable
     * @param {jsDataQuery} filter
     * @param {string} listingType
     * @returns {MultiSelectControl}
     */
    function MultiSelectControl(rootElement, metaPage, sourceTable, filter, listingType) {

        this.metaPage = metaPage;
        this.sourceTable = sourceTable;
        this.filter = filter;
        this.listingType = listingType;

        this.tablename = this.sourceTable.tableForReading();
        this.primaryTable = sourceTable.dataset.tables[this.tablename];
        model.addNotEntityChild(this.primaryTable, this.sourceTable);
        this.notEntityChildFilter = model.notEntityChildFilter(this.sourceTable);

        // recupero file del template del controllo
        this.templateFileHtmlPath  =  appMeta.config.path_multiSelectTemplate;
        this.rootElement = rootElement || document.body;

        this.addedTable  = null;
        this.toAddTable = null;
        this.loader = new appMeta.LoaderControl(this.rootElement, locale.multiSelect_lbl_wait);

        return this;
    }

    MultiSelectControl.prototype = {
        constructor: MultiSelectControl,

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Loads the html template of the multiSelectControl. It starts hidden
         * @returns {Deferred}
         */
        fillControl:function () {
            var def = Deferred('MultiSelectControl.fillControl');

            var self = this;
            // avvio loader
            self.loader.showControl();
            // carico il template del multiSelect
            var htmlFileName = appMeta.basePath + self.templateFileHtmlPath;
            $.get(htmlFileName)
                .done(
                    function (data) {
                        // aggancio al mio rootElement
                        $(self.rootElement).append(data);

                        // ora posso eseguire la fill del controllo.
                        return self.innerFillControl().then(function () {
                            // nascondo loader
                            self.loader.hideControl();
                            self.showControl(true);
                            def.resolve(true);
                        });
                    })
                .fail(
                    function (e) {

                        logger.log(logType.ERROR, "MultiSelectControl.fillControl", JSON.stringify(e));
                        self.loader.hideControl();
                        def.reject();

                    });

            return def.promise();
        },

        /**
         * @method showControl
         * @public
         * @description SYNC
         * Shows/ hides the entire control depending on "visible" parameter
         * @param {boolean} visible
         */
        showControl:function (visible) {
            if (visible){
                $('#multiSelectControl_id').show();
            }else{
                $('#multiSelectControl_id').hide();
            }
        },

        /**
         * @method innerFillControl
         * @public
         * @description ASYNC
         * Executes the fill of the custom control
         * @returns {Deferred}
         */
        innerFillControl: function() {
            var def = Deferred('MultiSelectControl.innerFillControl');
            this.initControls();
            return def.from(this.initTables()).promise();
        },

        /**
         * @method initTables
         * @private
         * @description ASYNC
         * Inits the grids with the DataTable
         * @returns Promise
         */
        initTables:function () {
            var def = Deferred('MultiSelectControl.initTables');
            var self = this;
            var columnList =  this.metaPage.state.meta.sortedColumnNameList(this.sourceTable);
            var res =  getData.createTableByName(this.tablename, columnList)
                .then(function (dt) {
                    self.addedTable = dt;
                    self.addedTable.name = "added";
                    self.addedTable.tableForReading(self.tablename);
                    self.copyKeyWhenBlank(self.sourceTable, self.addedTable);

                    return getData.createTableByName(self.tablename, columnList)
                        .then(function (dt) {
                            self.toAddTable = dt;

                            self.toAddTable.name = "toadd";
                            self.toAddTable.tableForReading(self.tablename);
                            self.copyKeyWhenBlank(self.sourceTable, self.toAddTable);

                            // Riempie la Table delle righe "toAddTable" prendendole dal DB. Questa tabella
                            // contiene anche righe già "added" in memoria, che vanno quindi escluse.
                            // Inoltre va integrata con righe che erano "added" e sono state rimosse
                            // in memoria
                            return getData.runSelectIntoTable(self.toAddTable, self.filter, null).then(function () {
                                // Riempie la Table delle righe "Added". Questa contiene anche righe che sono
                                // state rimosse in memoria, e quindi vanno rimosse (e integrate a "toAddTable")
                                self.addedTable.merge(self.sourceTable);

                                // Per tutte le righe rimosse in memoria (che rispettano il filtro): le toglie da
                                // Added e le mette in toAddTable.
                                var tomovefilter = self.filter;
                                if (self.notEntityChildFilter){
                                    tomovefilter = q.and(self.notEntityChildFilter, self.filter);
                                }
                                var rowsToMove = self.addedTable.select(tomovefilter);

                                _.forEach(rowsToMove, function (rToMove) {
                                    var verifyexistentfilter = self.addedTable.keyFilter(rToMove);
                                    var dataRow = rToMove.getRow();
                                    //Just for sure I remove from toAddTable those rows I'm going to add to it!
                                    var toRemoveFromToAdd = self.toAddTable.select(verifyexistentfilter);

                                    _.forEach(toRemoveFromToAdd,
                                        function(rToRemFromToAdd) {
                                            rToRemFromToAdd.getRow().del();
                                            rToRemFromToAdd.getRow().acceptChanges();
                                        });

                                    //Adds the row to toAddTable
                                    getData.addRowToTable(self.toAddTable, rToMove);

                                    //Remove the row from Added
                                    dataRow.del();
                                    //  una volta fatto del() che accade? 
                                    //rimane sonol un Object senza il metodo getrow etc.. ?
                                    // No,rimane una datarow nello stato di deleted ecco perchè è necessaria la successiva
                                    if (dataRow.state !== dataRowState.detached) {
                                        dataRow.acceptChanges();
                                    }
                                });

                                //Per tutte le righe rimosse in memoria rimanenti (ossia che NON rispettano
                                // il filtro) : le rimuovo da Added
                                var toRemoveFromAdded = self.addedTable.select(self.notEntityChildFilter);
                                _.forEach(toRemoveFromAdded, function (rToRemFromAdded) {
                                    var dataRow = rToRemFromAdded.getRow();
                                    dataRow.del();
                                    if (dataRow.state !== dataRowState.detached) dataRow.acceptChanges();
                                });


                                //Per tutte le righe rimaste in Added: le rimuove da toAddTable
                                var toRemoveFromToAdd2 = self.addedTable.select();

                                _.forEach(toRemoveFromToAdd2, function (rToRemFromAdded2) {
                                    //  var toRemKeyFilter = getData.getWhereKeyClause(rToRemFromAdded2.getRow(), rToRemFromAdded2.getRow().table, rToRemFromAdded2.getRow().table, false);
                                    var toRemKeyFilter = self.addedTable.keyFilter(toRemoveFromToAdd2);
                                    var toRemove = self.toAddTable.select(toRemKeyFilter);

                                    _.forEach(toRemove, function (rToRem) {
                                        var dataRow = rToRem.getRow();
                                        dataRow.del();
                                        if (dataRow.state !== dataRowState.detached) dataRow.acceptChanges();
                                    });

                                });

                                var currMeta = appMeta.getMeta(self.tablename);
                                
                                // le describe Column sono async, perchè la 1a volta chiedono al server
                                return currMeta.describeColumns(self.toAddTable, self.listingType)
                                    .then(function () {
                                        return currMeta.describeColumns(self.addedTable, self.listingType).then(function () {
                                            // costruisco le griglie con multiselezione
                                            self.gridToAdd = new appMeta.GridMultiSelectControl( $(".gridToAdd"), self.toAddTable, self.metaPage.helpForm);
                                            self.gridAdded = new appMeta.GridMultiSelectControl( $(".gridAdded"), self.addedTable, self.metaPage.helpForm);

                                            return self.gridToAdd.fillControl(null)
                                                .then(self.metaPage.fnMethod(self.gridAdded.fillControl(null)))
                                                .then(function() {
                                                    return def.resolve(true);
                                                });
                                        })
                                    });
                            });
                        });
                });

            return def.from(res).promise();
        },

        /**
         * @method copyKeyWhenBlank
         * @private
         * @description SYNC
         * Copies the keys of table "source" into table "t", if "t" has not keys
         * @param {DataTable} source
         * @param {DataTable} t
         */
        copyKeyWhenBlank:function (source, t) {
            if ((t.key().length > 0)) return;
            if ((source.key().length === 0)) return;
            t.key(source.key());
        },

        /**
         * @method initControls
         * @private
         * @description SYNC
         * Initializes the button events and the labels
         */
        initControls:function () {
            $(".multiSelect_btn_add").text(locale.multiSelect_addRows).on("click", _.partial(this.addRowsEv, this));
            $(".multiSelect_btn_remove").text(locale.multiSelect_removeRows).on("click", _.partial(this.removeRowsEv, this));
            $(".multiSelect_lbl_toAdd").html(locale.multiSelect_lbl_toAdd);
            $(".multiSelect_lbl_added").html(locale.multiSelect_lbl_added);
            $(".multiSelect_lbl_description").html(locale.multiSelect_lbl_descrtiption); // html invece di text, per inserire html ascii, tipo è con &egrave; il metodo text() fa apparire esattamente come è las tringa
        },

        /**
         * @method addRowsEv
         * @private
         * @description ASYNC
         * Event fired from button to add rows to the gridAdded
         * @param {MultiSelectControl} that
         * @returns {Deferred}
         */
        addRowsEv: function (that) { //"this" is the button
            var def = Deferred('MultiSelectControl.addRowsEv');
            var selectedRows = that.gridToAdd.selectedRows;
            var toRemoveFromToAdd = [];
            _.forEach(selectedRows, function (tr) {
                var index = $(tr).data("mdlRowIndex");
                if (index || index === 0) {
                    var r = that.gridToAdd.gridRows[index];
                    if (r){
                        toRemoveFromToAdd.push(r);
                        // L' aggiunge ad Added
                        getData.addRowToTable(that.addedTable, r);
                    }else{
                        logger.log(logType.ERROR, "riga selezionata di indice " + index + " non appartiene al dataTable Added");
                    }
                }
            });

            // Rimuove tutte le righe da ToAdd
            _.forEach(toRemoveFromToAdd, function (rToRemove) {
                var dataRow = rToRemove.getRow();
                dataRow.del();
                if (dataRow.state !== dataRowState.detached) dataRow.acceptChanges();
            });

            // inutile invocare la updateSourceTable se non ci sono righe selezionate da spostare
            if (selectedRows.length === 0) return def.resolve();

            return def.from(that.updateSourceTable()).promise();
        },

        /**
         * @method removeRowsEv
         * @private
         * @description ASYNC
         * Event fired from button to remove rows from grid gridAdded
         * @param {MultiSelectControl} that
         * @returns {Deferred}
         */
        removeRowsEv: function (that) { //"this" is the button

            var def = Deferred('MultiSelectControl.removeRowsEv');
            var selectedRows = that.gridAdded.selectedRows;
            var toRemoveFromAdded = [];

            _.forEach(selectedRows, function (tr) {
                var index = $(tr).data("mdlRowIndex");
                if (index || index === 0) {
                    var r = that.gridAdded.gridRows[index];
                    if (r){
                        toRemoveFromAdded.push(r);
                        //La  aggiunge ad ToAdd
                        getData.addRowToTable(that.toAddTable, r);
                    }
                    else{
                        logger.log(logType.ERROR, "riga selezionata di indice " + index + " non appartiene al dataTable toAddTable");
                    }
                }
            });

            //Rimuove tutte le righe da Added
            _.forEach(toRemoveFromAdded, function (rToRemove) {
                var dataRow = rToRemove.getRow();
                dataRow.del();
                if (dataRow.state !== dataRowState.detached) dataRow.acceptChanges();
            });

            // inutile invocare la updateSourceTable se non ci sono righe selezionate da spostare
            if (selectedRows.length === 0) return def.resolve();

            return def.from(that.updateSourceTable()).promise();
        },

        /**
         * @method updateSourceTable
         * @private
         * @description ASYNC
         * Updates the two grid of the control
         * @returns {Deferred}
         */
        updateSourceTable:function() {
            var def = Deferred('updateSourceTable');

            // Scollega le righe presenti in ToAdd, ove presenti in SourceTable
            var toAddRows = this.toAddTable.select();
            var self = this;
            var allDeferredUnlink = [];

            _.forEach(toAddRows, function (rToUnlink) {
                // var unlinkkeyfilter = getData.getWhereKeyClause(rToUnlink.getRow(), rToUnlink.getRow().table, rToUnlink.getRow().table, false);
                var unlinkkeyfilter = self.toAddTable.keyFilter(rToUnlink);
                var toUnlinkRows = self.sourceTable.select(unlinkkeyfilter);
                if (toUnlinkRows.length !== 0){
                    var toUnlinkRow = toUnlinkRows[0];
                    // salvo in array di deferred, pichè unlink trorna def, e risolverli tutti alla fine con when
                    allDeferredUnlink.push(self.metaPage.unlink(toUnlinkRow.getRow(), self.gridToAdd));
                }
            });

            var res = $.when.apply($, allDeferredUnlink)
                .then(function () {
                    // Collega le righe presenti in Added, aggiungendole se non presenti
                    var addedRows = self.addedTable.select();

                    _.forEach(addedRows, function (rToLink) {
                        // var linkkeyfilter = getData.getWhereKeyClause(rToLink.getRow(), rToLink.getRow().table, rToLink.getRow().table, false);
                        var linkkeyfilter = self.addedTable.keyFilter(rToLink);
                        var tolinkRows = self.sourceTable.select(linkkeyfilter);
                        var addedRow;
                        if (tolinkRows.length === 0) {
                            //La riga va aggiunta
                            addedRow = getData.addRowToTable(self.sourceTable, rToLink);
                        }
                        else {
                            addedRow = tolinkRows[0];
                        }

                        self.metaPage.checkEntityChildRowAdditions(addedRow.getRow(), null);
                    });

                    return self.gridToAdd.fillControl(null)
                        .then(self.metaPage.fnMethod(self.gridAdded.fillControl(null)))
                        .then(function() {
                            def.resolve(true);
                        });
                });

            return def.from(res).promise();

        }

    };

    appMeta.MultiSelectControl = MultiSelectControl;
}
());