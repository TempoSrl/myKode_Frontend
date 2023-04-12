/**
 * @class ComboManager
 * @description
 * Manages a select html control
 */
(function() {

    var jsObjFromString = appMeta.jsObjFromString;
    var q = window.jsDataQuery;
    var metaModel = appMeta.metaModel;
    var getData = appMeta.getData;
    var Deferred = appMeta.Deferred;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var locale = appMeta.localResource;
    /**
     * @constructor BootstrapContainerTab
     * @description
     * Contains all data of a combo box.
     * Tag of a combo is table.field
     * A combo has also those additional informations:
     *  {string} data-sourceName : table name of dataSource
     *  {string} data-valueMember: field value member name
     *  {string} data-displayMember
     *  {string} [data-no-blank] : if present a blank row is not wanted
     *  {string} [data-master]  : name of Master table which this combo depends on
     * @param {element} el
     * @param {HelpForm} helpForm
     */
    function ComboManager(el, helpForm) {
        if (this.constructor !== ComboManager) {
            return new ComboManager(el, helpForm);
        }
        this.el = el;
        this.helpForm = helpForm;
        this.DS = this.helpForm.pageState.DS;
        this.pageState = helpForm.pageState;

        this.dataSourceName = $(el).data("sourceName");
        this.dataTable = this.DS.tables[this.dataSourceName];
        if (!this.dataTable) {
            logger.log(logType.ERROR, "DataSource table " + this.dataSourceName + " was not found in DataSet");
        }
        this.valueMember = $(el).data("valueMember");
        if (!this.valueMember)  logger.log(logType.ERROR, "No value member specified in combobox " + this.el);
		this.displayMember = $(el).data("displayMember") || this.valueMember;

		//di base la combo è ordinata per il displayMember
		this.sortMember = $(el).data("sortMember") || this.displayMember;

        let tag = helpForm.getStandardTag($(el).data("tag"));
        if (!tag) logger.log(logType.ERROR, "Bad data-tag specified in combobox " + this.el);

        if (this.dataTable) {
            var sourceMeta = appMeta.getMeta(this.dataSourceName);
            if (!metaModel.insertFilter(this.dataTable)) {
                metaModel.insertFilter(this.dataTable, sourceMeta.insertFilter());
            }
            if (!metaModel.searchFilter(this.dataTable)) {
                metaModel.searchFilter(this.dataTable, sourceMeta.searchFilter());
            }
        }

        this.comboRows = [];
        this.currentRow = null;
        this.destTableName = helpForm.getTableName(tag); // table del tag, non il datasource
        this.destField = helpForm.getColumnName(tag);
        var destTable = this.DS.tables[this.destTableName];
        var col = destTable.columns[this.destField];
        if (!col) {
            console.log($(el).attr("type") +
                " control with tag " +
                tag +
                " has not a valid Column in (Standard) Tag (" +
                this.destField +
                ")");
            return null;
        }
        this.colType = col.ctype;

        this.tag = helpForm.completeTag(tag, col); //may come back useful?
        this.isDenyNull = metaModel.denyNull(col) || !metaModel.allowNull(col);

        this.noBlank = !!$(el).data("noblank");
        this.firstDataRow = this.noBlank ? 0 : 1;
        this.blankLineIndex = this.noBlank ? -1 : 0;
        //name of Master table which this combo depends on
        this.comboMaster = $(el).data("master") || null;
        this.initVarsForMaster();
        $(this.el).select2({minimumResultsForSearch: appMeta.config.minimumResultsForSearch});
        this.isStandardFill = true; // segue la fillControl del framework
        this.rowChangeDisabled = false;
        return this;
    }


    ComboManager.prototype = {
        constructor: ComboManager,

        /**
         * @method getSearchControl
         * @public
         * @description SYNC
         * Returns a sqlFun that represents the clause to filter the data in the form.
         * The clause is built reading the column to filter from the tag, and the value from the control itself.
         * @param {node} el
         * @param {DataColumn} col
         * @param {string} tagSearch
         * @returns {sqlFun}
         */
        getSearchControl:function(el, col, tagSearch) {
            if ($(el).val() === undefined || $(el).val() === null) return null; // se non c'è selezione esco null
            var index = this.el.selectedIndex;
            if (index < this.firstDataRow) return null;
            var searchcol = this.helpForm.getColumnName(tagSearch);
            var val = this.getValue();
            if (val === undefined || val === null) return null;
            return this.helpForm.compareLikeFields(searchcol, val, col.ctype);
        },

        /**
         * @method getCurrentRow
         * @public
         * @description SYNC
         * Gets the current row from ComboBox as js object. The js object has three key: a boolean, the DataTable linked to the row and the ObjectRow itself.
         * Ex: { table: DataTable, row: ObjectRow }
         * @returns {Object}
         */
        getCurrentRow: function() {
            // recupero riga selezionata
            var index = this.el.selectedIndex;
            if (index < this.firstDataRow) return { result: true, changed: this.dataTable, row: null };
            return { result: true, table: this.dataTable, row: this.comboRows[index - this.firstDataRow] };
        },

        /**
         * @method addEvents
         * @private
         * @description SYNC
         * Add the events to the table control
         * @param {element} el
         * @param {MetaPage} metaPage
         */
        addEvents: function(el, metaPage) {
            this.metaPage = metaPage;
            //genera eventualmente una RowSelect sulla metaPage
            $(this.el).on("change", _.partial(this.controlChanged, this)); //select2:select
            if (metaPage) {
                metaPage.eventManager.subscribe(appMeta.EventEnum.ROW_SELECT, this.selectRowCallBack, this);
            }
        },

        /**
         * @method controlChanged
         * @private
         * @description ASYNC
         * Called whenever a row is selected in the combo. "this" is the control that fires the event
         * @param {HelpForm} that
         * @returns {Deferred}
         */
        controlChanged: function (that) {
            if (that.rowChangeDisabled) {
                return false;
            }
            return that.setRow(that.getCurrentRow().row, undefined)
                .then(function () {
                    return that.metaPage.eventManager.trigger(appMeta.EventEnum.afterComboChanged, that);
            });
        },

        /**
         * @method setRow
         * @private
         * @description ASYNC
         * If the row is the same of currentRow it resolves the deferred with true, otherwise if it can "propagate" invokes a rowSelect on the MetaPage
         * @param {ObjectRow} row the row selected on the combo
         * @param {boolean} propagate true if it have to propagate the event to the MetaPage, false otherwise
         * @returns {Deferred}
         */
        setRow: function (row, propagate) {
             var def = Deferred("setRow");
            if (row === this.currentRow) {
                return def.resolve(true);
            }
            if (propagate === undefined) propagate = true;
            this.currentRow = row;
            if (this.metaPage && propagate) {
                return def.from(this.metaPage.rowSelect(this.el, this.dataTable, row));
            }
            return def.resolve(true);
        },

        /**
         * @method setIndex
         * @private
         * @description ASYNC
         * If the "index" is lower then the "firstDataRow" index it calls setRow with a null row.
         * Otherwise it sets the current value of the combo reading the row with the index "index", and then it invokes a setRow
         * @param {number} index, the index of the row in the "comboRows" array
         * @param {boolean} propagate
         * @return {Deferred}
         */
        setIndex: function(index, propagate) {
            var def = Deferred("setIndex");

            if (index < this.firstDataRow) {

                this.rowChangeDisabled = true;
                $(this.el).val(null).trigger('change');
                this.el.selectedIndex = index; //may or may not raise an onChange
                this.rowChangeDisabled = false;

                return def.from(this.setRow(null, propagate)); //assure that row is properly selected
            }

            if (index >= this.comboRows.length + this.firstDataRow) {
                index = this.comboRows.length + this.firstDataRow - 1;
            }
            let selectedIndex = index - this.firstDataRow;
            $(this.el).val(this.comboRows[selectedIndex][this.valueMember]);
            this.rowChangeDisabled = true;
            $(this.el).trigger('change');
            this.rowChangeDisabled = false;
            // assure that row is properly selected
            return def.from(this.setRow(this.comboRows[index - this.firstDataRow], propagate));
        },

        /**
         * @method setValue
         * @private
         * @description ASYNC
         * If "value" is null it set the index of the row at the first row index. Otherwise it finds the row in the comboRows, where the valueMember matches the value
         * and then invokes the setIndex function just passing the "index" found.
         * @param {string | number | Object} value
         * @param {boolean} propagate
         * @returns {Deferred}
         */
        setValue: function (value, propagate) {
            var def = Deferred("setValue");
            var that = this;
            if (value === null) {
                def.from(this.setIndex(this.blankLineIndex, propagate));
            } else {
                var index = _.findIndex(this.comboRows, function(r) {
                        return r[that.valueMember] === value;
                    });
                if (index >= 0) {
                    def.from( this.setIndex(index + this.firstDataRow, propagate));
                } else {
                    def.from(this.setIndex(-1, propagate));
                }
            }

            return def;
        },

        /**
         * @method setValue
         * @private
         * @description ASYNC
         * Updates a ComboBox when a row has been selected
         * @param {object} sender
         * @param {DataTable} changed
         * @param {ObjectRow} rowChanged
         * @returns {Deferred}
         */
        selectRowCallBack: function (sender, changed, rowChanged) {
            var def = Deferred("selectRowCallBack");
            var self = this;
            if (sender === this.el) return def.resolve(true); //does never enter in a loop
            var changedName = changed.name;

            if (changedName === this.dataSourceName) { //A row from the DataSource table has been selected
                //allinea il combo al datarow del datasource selezionato esternamente
                return def.from(this.setValue(rowChanged ? rowChanged[this.valueMember] : null));
            }

            if (changedName === this.destTableName) {  //A row from the primary table has been selected
                //I dont'understant why is this necessary. Isn't it sufficient the fillControls default function?
                return def.from(this.setValue(rowChanged ? rowChanged[this.destField] : null));
            }

            if (changedName === this.comboMaster) { //A row from the master table has been selected. Refilter this combo
                this.masterFilter = q.constant(false); //svuota la combo
                if (rowChanged) {
                    this.masterFilter = q.mcmp( this.comboParentRel.childCols,
                        _.map( self.comboParentRel.parentCols, function (col) {
                            return rowChanged[col];
                        }));
                    //this.masterFilter.isTrue = true;
                }

                self.waitMasterDetail(true);
                var res = this.filteredPreFillCombo(this.masterFilter, null, true)
                    .then(function () {
                        self.waitMasterDetail(false);
                        def.resolve(true);

                    });
                return def.from(res);
            }

            return def.resolve(true); //does nothing

        },

        /**
         * @method waitMasterDetail
         * @public
         * @description ASYNC
         * Put a loading indicator for the detail combo
         * @param {boolean} wait
         */
        waitMasterDetail:function (wait) {
            var defaultcolor = "1px solid #5c6f82";
            var waitcolor = "1px solid #F5F5F5";

            if (!this.waitOption){
                this.waitOption = document.createElement("option");
                this.waitOption.textContent = locale.loading;
                this.waitOption.value = "";
            }

            if (wait){
                this.el.appendChild(this.waitOption);
                $(this.el).css("border", waitcolor);
            } else {
                try {
                    this.el.removeChild(this.waitOption);
                } catch(e){}
                $(this.el).css("border", defaultcolor);
            }
        },



        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Executes the fill of the combo (Seelct html).
         * @param {node} comboBox
         * @param {object} val
         */
        fillControl: function (comboBox, val) {
            var def = Deferred("ComboManager.fillControl");
            if (this.helpForm.comboBoxToRefill) {
                this.checkComboBoxSource(val);
            }
            // se c'è una sola riga dati ed è deny null+insert, scegli quella punto e basta
            if (this.comboRows.length === 1 && this.isDenyNull && this.pageState.isInsertState()) return  def.from(this.setIndex(this.firstDataRow));
            return def.from(this.setValue(val));
        },

        /**
         * @method clearControl
         * @private
         * @description ASYNC
         * Clears the control. Sets the index of the combo  to the blankLineIndex.
         * @returns {Deferred}
         */
        clearControl: function () {
            return Deferred("clearControl").from(this.setIndex(this.blankLineIndex));
        },

        /**
         * Reads data from the control - actually does nothing on a combo
         * @method getControl
         * @param {element} el
         * @param {ObjectRow} r       row to fill
         * @param {string} field    field to fill
         */
        getControl: function(el, r, field) {
            var valueDataRow = r[field];
            var valueSelect = this.getValue();
            if (valueSelect == null || el.selectedIndex <= 0) {
                // metto a null se era popolato, se era undefined non lo modifico altrimenti poi la riga va nello stato modified
                if (r[field] !== undefined) r[field] = metaModel.clearValue(r.getRow().table.columns[field]);
            }
            else if (valueDataRow !== valueSelect) r[field] = valueSelect;
        },

        /**
         * @method getValue
         * @private
         * @description SYNC
         * Gets the selected value of the combo
         * @returns {any}
         */
        getValue: function() {
            var index = this.el.selectedIndex;
            if (index < this.firstDataRow) {
                return null;
            }
            if (this.valueMember && index - this.firstDataRow < this.comboRows.length) {
                return this.comboRows[index - this.firstDataRow][this.valueMember];
            } else {
                return jsObjFromString(this.colType, this.el.value);
            }
        },

        /**
         * @method fillComboBoxOptions
         * @private
         * @description SYNC
         * Fills the html combo options with comboRows content
         */
        fillComboBoxOptions: function() {
            let comboBox = this.el;
            $(comboBox).empty();
            this.rowChangeDisabled = true;
            // se non c'è l'ozione noBlank,
            //    inserisco opzione vuota - quindi la riga vuota "rompe" l'associazione indice combo - indice in comboRows
            if (!this.noBlank) {
                var emptyOption = document.createElement("option");
                emptyOption.textContent = "";
                emptyOption.value = "";
                comboBox.appendChild(emptyOption); //$(comboBox).append(el);
            }
            var that = this;
            _.forEach(
                this.comboRows,
                function(dataRow) {
                    let opt = document.createElement("option");
                    opt.textContent = dataRow[that.displayMember];
                    opt.value = dataRow[that.valueMember];
                    comboBox.appendChild(opt); //$(comboBox).append(el);
                });

            this.rowChangeDisabled = false;
        },

        /**
         * @method checkComboBoxSource
         * @private
         * @description SYNC
         * Sets the datasource of the combo, so that it shows the oldValue
         * remarks: must call fillComboBoxOptions
         * @param {object} oldValue
         */
        checkComboBoxSource: function(oldValue) {
            if (!this.valueMember) return ;
            // esegue fill della combo a partire dai valori di configurazione
            var t = this.dataTable;

            if (!metaModel.temporaryTable(t)) {
                this.comboRows = t.select(this.masterFilter); //non è una tabella gestita dal framework
				this.comboRows = _.sortBy(this.comboRows, [this.sortMember]);
                return;
            }

            //Se T non ha filtro per l'inserimento non deve fare nulla, più di quello non si può avere
            if (!metaModel.insertFilter(t)) {
                this.comboRows = t.select(this.masterFilter);
				this.comboRows = _.sortBy(this.comboRows, [this.sortMember]);

                this.fillComboBoxOptions(); //tutte le righe
                return;
            }

            //Esaminiamo ora il caso in cui T HA filtro per insert. In questo caso può accadere che
            //  DataSetName = mkytemp_insert o mkytemp_special
            if (this.pageState.isSearchState()) {
                let filter = this.helpForm.mergeFilters(metaModel.searchFilter(t), this.masterFilter);
                this.comboRows = t.select(filter);
                 this.comboRows = _.sortBy(this.comboRows, [this.sortMember]);
                this.fillComboBoxOptions(); //ripristina le voci di search
                return;
            }

            if (this.pageState.isInsertState()) {
                this.comboRows = t.select(this.helpForm.mergeFilters(this.masterFilter, metaModel.insertFilter(t)));
				this.comboRows = _.sortBy(this.comboRows, [this.sortMember]);
                this.fillComboBoxOptions(); //ripristina le voci di insert
                return;
            }

            //Modo è EDIT.
            var oldvaluefilter = (oldValue === null) ? null : q.eq(this.valueMember, oldValue);
            var f1 = this.helpForm.mergeFilters(oldvaluefilter, metaModel.insertFilter(t));
            var filterAnd = this.helpForm.mergeFilters(f1,  this.masterFilter);
            if (filterAnd.isTrue || (t.select(filterAnd).length > 0)) { //il filtro in insert ha già la riga che serve
                this.comboRows = t.select(filterAnd);
				this.comboRows = _.sortBy(this.comboRows, [this.sortMember]);
                this.fillComboBoxOptions(); // le voci di insert già bastano
                return;
            }
            var filterOr = q.or(oldvaluefilter, metaModel.insertFilter(t));
            this.comboRows = t.select( this.helpForm.mergeFilters(filterOr,  this.masterFilter));
			this.comboRows = _.sortBy(this.comboRows, [this.sortMember]);
            this.fillComboBoxOptions();
        },

        /**
         * @method fillComboBoxTable
         * @private
         * @description ASYNC
         * Fills the table  related to a combobox.
         * @param {boolean} freshValue when true, a redraw of combobox table related fields
         * @returns  {Deferred}
         */
        fillComboBoxTable: function (freshValue) {
            this.fillComboBoxOptions();
            if (freshValue) {
                this.checkComboBoxSource(null);
                return Deferred("fillComboBoxTable").from(
                    this.setIndex(this.blankLineIndex,true) // this should generate a rowselect event
                );
            }
            return Deferred("fillComboBoxTable").resolve(true);
        },

        /**
         * @method preFill
         * @public
         * @description ASYNC
         * Execute a prefill of the combobox
         * @param {node} el
         * @param {Object} param {tableWantedName:tableWantedName, filter:filter, selList:selList}
         * @returns {Deferred}
         */
        preFill: function(el, param) {
            var def = Deferred("preFill");
            if(this.dataSourceName && param.tableWantedName && param.tableWantedName !== this.dataSourceName ) return def.resolve().promise();
            this.initVarsForMaster();
            return def.from(this.filteredPreFillCombo(param.filter, param.selList)).promise();
        },

        /**
         * Inits some vars for used for masterDetail combo
         * @method initVarsForMaster
         * @public
         * @description SYNC
         */
        initVarsForMaster:function () {
            this.masterFilter = q.constant(true);
            if (this.comboMaster) {
                var comboParentRels = this.DS.getParentChildRelation(this.comboMaster, this.dataSourceName);
                if (comboParentRels.length) {
                    this.comboParentRel = comboParentRels[0];
                    this.masterFilter = q.constant(false);
                }
            }
        },

        /**

         * @method filteredPreFillCombo
         * @public
         * @description ASYNC
         * Fills a combobox with related data. It adds a dummy empty row to the PARENT table if the master selector allows null. This row
         * is marked as temp_row.  More, the table have not to be a CHILD table itself ASYNC
         * @param {jsDataQuery} filter. It is the filter to apply
         * @param {SelectBuilder[]} selList
         * @param {sqlFun} filterMaster
         * @returns {Deferred}
         */
        filteredPreFillCombo: function (filter, selList, filterMaster) {
            var def = Deferred("filteredPreFillCombo");
            var t = this.dataTable;

            if (metaModel.temporaryTable(t)) {
                return def.resolve(t);
            }

            //Checks that the table is a child of another table and the filter is empty
            if ((filter === null || filter === undefined || !filterMaster) && this.comboMaster) {
                //The list will be built depending on the selected row of the other table
                //Don't read anything for now. table will be read when a filter is given
                return def.resolve(false);
            }

            if (filter === null || filter === undefined) {
                // Mark table as cached only if it is not already.
                // A locked-read table is also considered a cached table so it should not be cached again
                if (!metaModel.cachedTable(t)) metaModel.cachedTable(t, true);
            }
            var that = this;
            var res = getData.doGetTable(t, filter, true, null, selList)
                .then(function(sel) {
                    if (selList && sel) {
                        // gli oggetti onRead() vengono richiamati alla fine della multiRunSelect
                        sel.onRead = function () {
                            that.comboRows = t.select();
							that.comboRows = _.sortBy(that.comboRows, [that.sortMember]);
                            return that.fillComboBoxTable(true);
                        };
                        return Deferred('filteredPreFillCombo - delayed').resolve(true);
                    }

                    //Table has been read
                    that.comboRows = t.select();
					that.comboRows = _.sortBy(that.comboRows, [that.sortMember]);
                    return Deferred('filteredPreFillCombo - fillComboBoxTable').from(that.fillComboBoxTable(true));
                });

            return def.from(res).promise();
        }
    };

    window.appMeta.CustomControl("combo", ComboManager);    
}());
