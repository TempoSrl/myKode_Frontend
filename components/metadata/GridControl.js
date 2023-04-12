/**
 * @module GridControl (deprecated. use GridControlX)
 * @description
 * Manages the graphics and the logic of an html Grid
 */
(function() {

    var dataRowState = jsDataSet.dataRowState;
    var Deferred = appMeta.Deferred;
    var Stabilizer = appMeta.Stabilizer;
    var getDataUtils = appMeta.getDataUtils;
    var utils = appMeta.utils;
    var localResource = appMeta.localResource;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    /**
     * @constructor GridControl
     * @description
     * Initializes the html grid control
     * @param {element} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table. this is the table corresponding to the tableName configured in the tag at the position 0
     * (see function HelpForm.preScanCustomControl for the initialization)
     * @param {DataTable} primaryTable
     * @param {string} listType. if it is called by in a listmanager, listType is passed
     * Contains all data of a grid
     */
    function GridControl(el, helpForm, table, primaryTable, listType) {
        if (this.constructor !== GridControl) {
            return new GridControl(el, helpForm, table, primaryTable, listType);
        }
        this.helpForm = helpForm;
        this.DS = table.dataset;// this.helpForm.pageState.DS;

        this.dataSourceName = table.name;
        this.dataTable = table;//this.DS.tables[this.dataSourceName];
        this.dataTable.linkedGrid = this;
        this.el = el;
        this.tag = $(el).data("tag");

        // colore per licona della colonna ordinata
        this.colorOrder = "white";

        // gestione bottoni editing direttamente su griglia
        this.isInsertBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttoninsert");
        this.isEditBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttonedit");
        this.isDeleteBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttondelete");
        this.isUnlinkBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttonunlink");
        this.isNotSort = helpForm.existsDataAttribute(el, "mdlnotsort");

        this.createConditionalColumns();

        this.isTreeNavigator = helpForm.existsDataAttribute(el, "treenavigator");

        this.meta = appMeta.getMeta(this.dataTable.tableForReading());
        this.listType = listType ? listType : helpForm.getField(this.tag, 1);

        this.defDescribedColumn = this.meta.describeColumns(this.dataTable, this.listType);

        this.editType = helpForm.getField(this.tag, 2);

        this.orderedCols = {};


        /**
         * To set in AfterLink overriden method, of the MetaPage extended
         * @type {boolean}
         */
        this.forceSelectRow = false;

        //indice della riga selezionata nel grid (indice in gridRows e non visuale) , 
        //      -1 se nessuna riga selezionata
        this.currentIndex = -1;
        this.currentRow = null; // DataRow selezionato, null se non c'è riga selezionata
        this.mytable = $('<table class="table" border="1">');

        //dalla metaPage recupera lo stato e quindi il DS

        this.primaryTable = primaryTable;// helpForm.primaryTable;

        this.gridParentRel = null;

        this.gridMaster = $(el).data("master");
        var gridParentRels = [];

        if (primaryTable) {
            if (this.gridMaster) {
                gridParentRels = this.DS.getParentChildRelation(this.gridMaster, this.dataSourceName);
            } else {
                gridParentRels = this.DS.getParentChildRelation(this.primaryTable.name, this.dataSourceName);
            }
            if (gridParentRels.length > 0) {
                this.gridParentRel = gridParentRels[0];
            }
        }

        // elenco ordinato righe nel grid (solo quelle del grid, nell'ordine in cui vi si trovano)
        this.gridRows = [];
        this.$btnexportExcel = null;
        // se mono select,  cerca sempre di selezionare la prima riga utile o l'ultima selezionata

        return this;
    }

    GridControl.prototype = {
        constructor: GridControl,

        getCurrentRow: function() {
            return { table: this.dataTable, row: this.currentRow };
        },

        /**
         * @method addMyEvents
         * @private
         * @description SYNC
         * Adds the "click" and "dblclick" events to the rows of the grid
         */
        addMyEvents: function() {
            // questo selettore evita di agganciare glie venti sull'header
            this.mytable.find("tr:not(:has(>th))").on("click", _.partial(this.rowClickEv, this));
            this.mytable.find("tr:not(:has(>th))").on("dblclick", _.partial(this.rowDblClickEv, this));
        },

        /**
         * @method addEvents
         * @public
         * @description SYNC
         * @param {element} el
         * @param {MetaPage} metaPage
         * @param {boolean} subscribe
         */
        addEvents: function(el, metaPage) {
            this.metaPage = metaPage;
            // this.addMyEvents(); aggiunti solo sulla addRow
            if (metaPage) {// prima era  && subscribe
                metaPage.eventManager.subscribe(appMeta.EventEnum.ROW_SELECT, this.selectRowCallBack, this);
            }
        },

        /**
         * @method selectRowCallBack
         * @private
         * @description ASYNC
         * It is the callback triggered after a ROW_SELCT event on metapage. If the parameter table is the gridmaster it fill the grid, and select the row "row"
         * @param {element|object} sender
         * @param {DataTable} table
         * @param {ObjectRow} row
         * @returns {Deferred}
         */
        selectRowCallBack: function(sender, table, row) {
            if (sender === this.el) return Deferred("selectRowCallBack").resolve(); //does never enter in a loop
            if (table.name === this.gridMaster) {
                return this.fillControl(this.el); //refills grid because parent row is changed
            }
            if (table.name !== this.dataSourceName) return Deferred("selectRowCallBack").resolve(); // it is not the "listened" table
            return Deferred("selectRowCallBack").from(this.selectRow(row, false));
        },

        /**
         * @method selectRow
         * @private
         * @description ASYNC
         * Selects the row "rpw"
         * @param {ObjectRow} row
         * @param {boolean} propagateEvent
         */
        selectRow: function(row, propagateEvent) {
            return Deferred("selectRow").from(this.setIndex(_.indexOf(this.gridRows, row), propagateEvent));
        },

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Fills the grid
         * @param {type} el
         * @returns {Deferred}
         */
        fillControl: function (el) {
            if (this.isTreeNavigator) {
                return this.fillControlTreeNavigator();
            } else{
                return this.fillControlNotTreeNavigator(el);
            }
        },

        /**
         *
         * @param el
         * @returns {*|Deferred}
         */
        fillControlNotTreeNavigator:function (el) {
            el = el || this.el;
            var helpForm = this.helpForm;
            var filter = null;
            var currParent = null;
            if (this.primaryTable) {
                currParent = helpForm.lastSelected(this.primaryTable);
                if (this.gridMaster) {
                    currParent = helpForm.lastSelected(this.DS.tables[this.gridMaster]);
                }

                // N.B: questo oggetto è un jsDataQuery.
                // Deve essere configurato sul metodo AfterLink della metaPage estesa tramite il seguente codice:
                // Esempio: $("#ID_ELEMENTO_GRIGLIA").data("customParentRelation", myJsDataQuery);
                var customParentRel = $(el).data("customParentRelation");
                if (customParentRel) {
                    filter = customParentRel;
                } else {
                    if (currParent && this.gridParentRel) {
                        filter = this.gridParentRel.getChildFilter(currParent);
                    }
                }
            }
            // in this.currentRow la riga corrente, nel caso di ListManager  this.gridParentRel=null
            if (currParent || this.gridParentRel === null) {
                return this.innerFillControl(el, filter);
            }
            else {
                return this.clearControl();
            }
        },

        /**
         * @method clearHtmlGrid
         * @private
         * @description SYNC
         * Remove all rows form html grid. Remains only the header
         */
        clearHtmlGrid:function () {
            this.mytable.find("tr").each(
                function(i, tr) {
                    if ($(tr).find("th").length === 0) {
                        $(tr).remove();
                    }
                });
        },

        /**
         * @method innerFillControl
         * @private
         * @description ASYNC
         * Executes the fill of the custom control
         * @method  fillControl
         * @param {html node} el
         * @param {jsDataQuery} filter
         * @returns {Deferred}
         */
        innerFillControl: function(el, filter, propagate) {

            var def = Deferred("innerFillControl");

            if (!this.dataTable) return def.resolve();
            var self = this;

            // rimane aperto dal costruttore e qui mi aspetto venga fatta la then, quando appunto torna il metodo
            var res =  this.defDescribedColumn
                .then(function () {
                
                    self.orderedCols = self.getOrderedColumns(self.dataTable);
                    if (self.emptyElement) self.emptyElement.remove();
                    self.mytable.remove();
                    self.mytable = $('<table class="table" border="1">');
    
                    // ho il datatable
                    self.addHeaders();
                    // aggiungo righe
                    self.addRows(self.dataTable, filter);
                    // aggiungo itnero ttag html table
                    $(el).html(self.mytable);

                    // aggiungo eventi alle righe
                    self.addMyEvents();
                    // azioni dopo la selzione dell'indice giusto sulla griglia
                    return self.setIndex(self.currentIndex, propagate);

            });

            return def.from(res).promise();

        },

        /**
         * @method getOrderedColumns
         * @private
         * @description SYNC
         * Sorts the columns depending on listColPos column property. It doesn't consider columns that haven't caption, that start with a dot, and that have listColPos equal to -1
         * @param {DataTable} dataTable
         * @return  {DataColumn[]}
         */
        getOrderedColumns: function(dataTable) {
            if (!dataTable) return new [];

            var cols = _.sortBy(
                _.filter(dataTable.columns,
                    function(c) {
                        if (!c.caption) return false;
                        if (c.caption === "") return false;
                        if (c.caption.startsWith(".")) return false;
                        if (c.listColPos === -1) return false;
                        return true;
                    }),
                'listColPos');

            return cols;
        },

        /**
         * @method getSorting
         * @private
         * @description SYNC
         * Returns the sorting for the DataTable. Ex "title asc"
         * It calls first the getSorting of the js metadata, and if it is null call the orderby on the dt.
         * orderBy is the getSorting of the backend metadata
         * @param {DataTable} dt
         * @returns {string} the sorting
         */
        getSorting: function (dt) {
            let sorting = this.meta.getSorting(this.listType);
            return (sorting ? sorting : dt.orderBy());
        },


        /**
         * @method getSortedRows
         * @private
         * @description SYNC
         * Sorts and returns the rows of the DataTable "t"
         * @param {DataTable} t
         * @param {jsDataQuery} filter
         * @returns {objectRow[]}
         */
        getSortedRows: function (t, filter) {
            // se ho cambiato sort tramite click su header  lo memorizzo sulla prop orderBy, quindi qui la rileggo
            let sorting = t.orderBy() || this.getSorting(t);
            let rows = t.select(filter);
            if (!sorting) return _.orderBy(rows, t.key());
            let parts = sorting.split(",");
            rows = _.orderBy(rows, t.key());

            let sortingObject = _.reduce(parts,
                function (result, part) {
                    let sortElem = part.trim().split(" ");
                    let field = sortElem[0];
                    result.names.push(function (row) {
                        let value = row[field];
                        if (value) {
                            if (value instanceof Date) return value.getTime();
                            if (!isNaN(value)) return value;
                            return value.toLowerCase ? value.toLowerCase() : value;
                        }
                        return value;
                    });
                    if (sortElem.length === 1) {
                        result.sorting.push("asc");
                    } else {
                        result.sorting.push(sortElem[1].toLowerCase());
                    }
                    return result;
                },
                { names: [], sorting: [] });
            return _.orderBy(rows, sortingObject.names, sortingObject.sorting);

        },

        /**
         * @method setRow
         * @private
         * @description ASYNC
         * Sets the row "row" as current row
         * @param {ObjectRow} row
         * @param {boolean} propagate
         * @returns{Deferred}
         */
        setRow: function (row, propagate) {
            var def = Deferred("setRow");
            var self = this;
            if (this.setRowRunning) {
                this.setRowRunning = false;
                return def.resolve(true);
            }
            if (row === this.currentRow) return def.resolve(true);
            if (propagate === undefined) propagate = true;
            this.currentRow = row;

            if (this.metaPage && propagate) {
                this.setRowRunning = true;
                return this.metaPage.rowSelect(this.el, this.dataTable, row)
                    .then(function () {
                        self.setRowRunning = false;
                        return def.resolve(true);
                    })
            }
            return def.resolve(true);
        },

        /**
         * @method setIndex
         * @private
         * @description ASYNC
         * Sets as current row the row with the index "index"
         * @param {int} index
         * @param {boolean} propagate
         * @return {Deferred}
         */
        setIndex: function (index, propagate) {
            var def = Deferred("setIndex");
            if (index >= this.gridRows.length) {
                index = this.gridRows.length - 1;
            }

            if (index < 0) {
                this.currentIndex = -1;
                // nessuna riga selezionata, quindi non metterà nessun css
                this.changeCssRowSelected(-1);
                return def.from(this.setRow(null, propagate)).promise();
            }

            this.currentIndex = index;

            this.changeCssRowSelected(index);

            // assure that row is properly selected
            var res =  this.setRow(this.gridRows[index], propagate);
            return def.from(res).promise();
        },

        /**
         * @method changeCssRowSelected
         * @private
         * @description SYNC
         * Applies the selectedRow style to the row with index "index" and cuts off selectedRow to the old selected row
         * @method changeCssRowSelected
         * @param {number} index
         */
        changeCssRowSelected:function (index) {
            //trovo tr con quell'index, con jquery non funziona nessun modo
            var tr = _.find($("tr", this.mytable), function(currTr) {
                return ($(currTr).data("mdlRowIndex") === index);
            });

            if (!tr) return;
            
            // imposto lo stile
            $("tr", this.mytable).css('background-color', '');
            $(tr).css('background-color', appMeta.config.selectedRowColor)
        },

        /**
         * @method addRows
         * @private
         * @description SYNC
         * Adds the rows of "dataTable" to the html table.
         * @params {DataTable}
         * @param {jsDataQuery} filter
         */
        addRows: function(dataTable, filter) {
            //Aggiunge i dati

            this.gridRows = this.getSortedRows(dataTable, filter);

            //check upper  bound
            if (this.currentIndex >= this.gridRows.length) {
                this.currentIndex = this.gridRows.length - 1; //does not fire events
            }

            //check lower bound
            if (this.forceSelectRow && this.currentIndex === -1) {
                if (this.gridRows.length === 0) {
                    this.currentIndex = -1;
                }
                else {
                    this.currentIndex = 0;
                }
            }

            this.loopOnRows()
        },

        loopOnRows:function () {
            var countRiga = 0;
            var self = this;
            var $tbody = $("<tbody>");
            this.mytable.append($tbody);
            _.forEach(this.gridRows,
                function(r, index) {
                    // non inserisco le deleted
                    if (r.getRow && r.getRow().state !== dataRowState.deleted) {
                        self.addTableRow(r, countRiga, index, $tbody);
                        countRiga++;
                    }
                });
        },

        /**
         * @method addTableRow
         * @private
         * @description SYNC
         * Adds the html cells to html row and the row to the html table. Cell values are read from dataRow
         * @param {ObjectRow} dataRow
         * @param {number} gridRowCount index of the row in the grid
         * @param {number} rowIndex index of the row in gridRows
         */
        addTableRow: function(dataRow, gridRowCount, rowIndex, tbody) {
            if (!dataRow) return;
            var $tr = $("<tr>");
            var self = this;
            _.forEach(this.orderedCols,
                function(c) {
                    var value = self.getFormattedValue(dataRow, c);
                    var columnStyle = self.getColumnsAlignmentCssClass(c);

                    // applico lo stile
                    var $td = $('<td style="user-select: none" nowrap>');
                    $td.addClass(columnStyle);

                    self.addChildElement($tr, $td, value);
                });

            // aggiungo cella per bottoni di editing se serve
            var $tdBtnEditing = $('<td class="mdlw_tdclickable">');
            if (this.isInsertBtnVisible || this.isEditBtnVisible) {
                self.addChildElement($tr, $tdBtnEditing, '');
            }
            if (this.isEditBtnVisible){
                var $btnedit = $('<div style="text-align:center;"></div>');
                $btnedit.on("click", _.partial(this.editClick, this));
                var $iconEdit =  $('<i class="fa fa-edit fa-2x"></i>');
                self.addChildElement($tdBtnEditing, $btnedit, '');
                self.addChildElement($btnedit, $iconEdit, '');
            }
            
            var addedTdDeleted= false;
            var $tdBtnDeleting = $('<td class="mdlw_tdclickable">');
            if ((this.isDeleteBtnVisible && this.isEditBtnVisible) ||
                (this.isDeleteBtnVisible && (!this.isEditBtnVisible && !this.isInsertBtnVisible))){
                self.addChildElement($tr, $tdBtnDeleting, '');
                addedTdDeleted = true;
            }

            if (this.isDeleteBtnVisible){
                var $btndelete = $('<div style="text-align:center;"></div>');
                $btndelete.on("click", _.partial(this.deleteClick, this));
                var $iconDelete =  $('<i class="fa fa-trash fa-2x"></i>');
                if (addedTdDeleted)  self.addChildElement($tdBtnDeleting, $btndelete, '');
                if (!addedTdDeleted)  self.addChildElement($tdBtnEditing, $btndelete, '');
                self.addChildElement($btndelete, $iconDelete, '');
            }

            var addedTdUnlink= false;
            var $tdBtnUnlink =  $('<td class="mdlw_tdclickable">');
            if ((this.isUnlinkBtnVisible && this.isEditBtnVisible) ||
                (this.isUnlinkBtnVisible && this.isDeleteBtnVisible) ||
                (this.isUnlinkBtnVisible && (!this.isEditBtnVisible && !this.isDeleteBtnVisible && !this.isInsertBtnVisible))){
                self.addChildElement($tr, $tdBtnUnlink, '');
                addedTdUnlink = true;
            }

            if (this.isUnlinkBtnVisible){
                var $btnunlink = $('<div style="text-align:center;"></div>');
                $btnunlink.on("click", _.partial(this.unlinkClick, this));
                var $iconUnlink =  $('<i class="fa fa-unlink fa-2x"></i>');
                if (addedTdUnlink)  self.addChildElement($tdBtnUnlink, $btnunlink, '');
                if (!addedTdUnlink)  self.addChildElement($tdBtnEditing, $btnunlink, '');
                self.addChildElement($btnunlink, $iconUnlink, '');
            }
            
            // fine gestione bottoni editing

            $tr.data("mdlRowIndex", rowIndex);

            // mettec olore alternato
            //if ((gridRowCount % 2) === 1) $tr.addClass(appMeta.cssDefault.odd);
            // se è riga corrent metto colore di selezione
            if (self.currentRow === dataRow)  $tr.css('background-color', appMeta.config.selectedRowColor);

            tbody.append($tr);
        },

        /**
         *
         * @param {GridControl} that
         */
        insertClick:function (that) {
            return that.metaPage.insertClick(that.metaPage, that);
        },

        /**
         *
         * @param {GridControl} that
         */
        editClick:function (that) {
          var tr =  $(this).closest("tr");
          // prima di invocare il metodo sulla metaPage richiamo il click, così eseguo lo stesso codice di quando il bottone era fuori il gird
          // stando attento a passare i giusti parametri. quindi l'ogg di inovazione eè il tr stesso e 1o prm GridControl
          that.rowClick.call(tr, that)
              .then(function () {
                  return that.metaPage.editClick(that.metaPage, that)
              })
        },

        /**
         *
         * @param {GridControl} that
         */
        deleteClick:function (that) {
            var tr =  $(this).closest("tr");
            // prima di invocare il metodo sulla metaPage richiamo il click, così eseguo lo stesso codice di quando il bottone era fuori il gird
            // stando attento a passare i giusti parametri. quindi l'ogg di inovazione eè il tr stesso e 1o prm GridControl
            that.rowClick.call(tr, that)
                .then(function () {
                    return that.metaPage.deleteClick(that.metaPage, that)
                })
        },

        /**
         *
         * @param {GridControl} that
         */
        unlinkClick:function (that) {
            var tr =  $(this).closest("tr");
            // prima di invocare il metodo sulla metaPage richiamo il click, così eseguo lo stesso codice di quando il bottone era fuori il gird
            // stando attento a passare i giusti parametri. quindi l'ogg di invocazione eè il tr stesso e 1o prm GridControl
            that.rowClick.call(tr, that)
                .then(function () {
                    return that.metaPage.unlinkClick(that.metaPage, that)
                })
        },
        

        /**
         * @method addChildElement
         * @private
         * @description SYNC
         * Sets "child" content and append child node to "parent"
         * @param {html node} parent jquery html element
         * @param {html node} child jquery html element
         * @param {string} value the string value
         */
        addChildElement: function(parent, child, value) {
            if (value === undefined || value === null) value  = "";
            $(child).html(value).appendTo(parent);
        },

        /**
         * @method getFormattedValue
         * @private
         * @description SYNC
         * Gets a properly formatted string representing r[c]
         * @param {ObjectRow} r
         * @param {DataColumn} c
         * @returns {*|string}
         */
        getFormattedValue: function(r, c) {
            var field = c.name;
            var fmt = this.helpForm.getFormatForColumn(c);
            var tag = "x.y." + fmt;
            var pObj = new appMeta.TypedObject(c.ctype, r[field]);
            var self = this;
            // vedo se si tratta di stringhe condizionali
            if (this.conditionallookupArray[c.name.toLowerCase()]){
                if (r[field] === null || r[field] === undefined)  return "";
                var lookups = _.filter(self.conditionallookupArray[c.name], function (el) {
                    return el.valuemember.toString().toLowerCase() == r[field].toString().toLowerCase();
                });
                if (lookups.length) return lookups[0]. displaymember;
                return "";
            }

            return pObj.stringValue(tag);
        },

        /**
         * Creates the dictionary with the info for the conditional columns.
         * user data-attribute is: "col1,v1,d1;col2,v2,d2"; where vi is the value for the column coli to replace with di
         */
        createConditionalColumns:function () {
            // utilizzato per permettere al programmatore di mettere valori condizionali in fase di config: "col1,v1,d1;col2,v2,d2"
            this.conditionallookup  = $(this.el).data("mdlconditionallookup");
            this.conditionallookupArray = {};

            if (this.conditionallookup){
                var self  =this;
                var columnObjs = this.conditionallookup.split(";");
                _.forEach(columnObjs, function (co) {
                    var els = co.split(",");
                    if (els.length !== 3) logger.log(logType.WARNING, "wrong conditional formatting on grid: " + self.dataTable.name);
                    var cname = els[0].toLowerCase();
                    if (!self.conditionallookupArray[cname]) self.conditionallookupArray[els[0]] = [];
                    self.conditionallookupArray[cname].push({valuemember:els[1], displaymember:els[2]});
                })
            }
        },

        /**
         * @method getColumnsAlignmentCssClass
         * @private
         * @description SYNC
         * Returns the css style of the column depending on the column type
         * @param {DataColumn} c
         * @returns {string}
         */
        getColumnsAlignmentCssClass: function(c) {
            switch (c.ctype) {
                case "Decimal":
                case "Double":
                case "Int16":
                case "Single":
                case "Int32":
                case "DateTime":
                    return appMeta.cssDefault.alignNumericColumn;
                case "String":
                    return appMeta.cssDefault.alignStringColumn;
                default:
                    return appMeta.cssDefault.alignStringColumn;
            }
        },

        /**
         * @method addHeaders
         * @private
         * @description SYNC
         * Adds the header on the html grid
         */
        addHeaders: function() {

            var self = this;
            var $thead = $("<thead>");
            var $tr = $("<tr>");
            $($tr).appendTo($thead);

            // calcolo array dellecolonne su cui è impostatol'oridnamento iniziale
            var sorting = this.dataTable.orderBy();
            var colSorting = {};
            if (sorting){
                var parts = sorting.split(",");
                // metto indicatore di sort sull'icona della colonna giusta
                _.forEach(parts, function (p) {
                    // "colname asc" o r "colname desc" quindi splitto sullo spazio
                    colSorting[p.split(" ")[0]] = true ;
                });
            }

            _.forEach(this.orderedCols,
                function(c, index) {
                    var csortId = self.getIdColumnSort(c.name);
                    var thid = appMeta.utils.getUniqueId();
                    var $th = $('<th  id="' + thid + '">');

                   
                    self.addChildElement($tr, $th, c.caption || c.name);

                    if (!self.isNotSort){
                        var $sortIcon;
                        // se è ordinata per default metto icona bianca
                        if (colSorting[c.name]){
                            $sortIcon = $('<i id="' + csortId +'" class="fa fa-sort" style="color:' +self.colorOrder +'">');
                        } else{
                            $sortIcon = $('<i id="' + csortId +'" class="fa fa-sort" >');
                        }

                        var $span = $('<div style="padding:5px; float:right; cursor: pointer;">');
                        $span.on("click", _.partial(self.sortColumnClick, self, c));
                        self.addChildElement($th, $span, '');
                        self.addChildElement($span, $sortIcon, '');

                        // inserisce bottone di export excel sulla rima colonna
                        if ( index === 0 ){
                            var $excelIcon = $('<i class="far fa-file-excel">');
                            self.$btnexportExcel = $('<a href="#" style="float:left; cursor: pointer; padding-right: 5px;"></a>');
                            self.$btnexportExcel.on("click", _.partial(self.gridHtmlToExcel, self));
                            self.addChildElement($th, self.$btnexportExcel, '');
                            self.addChildElement(self.$btnexportExcel, $excelIcon, '');
                        }

                    }

                });


             // gestione bottoni di editing
            // creo th per bottone di add se serve lo inserisco  o per altri bottoni di riga

             var $thBtn = $('<th class="mdlw_tdclickable">');
             // aggiungo bottone di add
             if (this.isInsertBtnVisible) {
                 this.addChildElement($tr, $thBtn,'');
                 var $btninsert = $('<div style="text-align:center;" data-insert></div>');
                 $btninsert.on("click", _.partial(this.insertClick, this));
                 var $iconInsert =  $('<i class="fa fa-plus-square fa-2x"></i>');
                 self.addChildElement($thBtn, $btninsert, '');
                 self.addChildElement($btninsert, $iconInsert, '');
             }

            var $thBtnEdit = $('<th>');
            if (this.isEditBtnVisible && !this.isInsertBtnVisible) {
                this.addChildElement($tr, $thBtnEdit,'');
            }

            var $thBtnDlt = $('<th>');
            if ((this.isDeleteBtnVisible && this.isEditBtnVisible) ||
                (this.isDeleteBtnVisible && (!this.isEditBtnVisible && !this.isInsertBtnVisible))
            ) {
                this.addChildElement($tr, $thBtnDlt,'');
            }

            var $thBtnUnlk = $('<th>');
            if ((this.isUnlinkBtnVisible && (this.isDeleteBtnVisible || this.isEditBtnVisible)) ||
                (this.isUnlinkBtnVisible && (!this.isEditBtnVisible && !this.isInsertBtnVisible && !this.isDeleteBtnVisible ))
            ){
                this.addChildElement($tr, $thBtnUnlk,'');
            }

            $($thead).appendTo(this.mytable);
        },

        /**
         * Gets an unique id of the icon for the column on the page
         * @param {string} cname the column name
         * @returns {string}
         */
        getIdColumnSort:function (cname) {
            return "icon_sort_id" + this.dataTable.name + cname.replace("!", "");
        },

        /**
         * Execute the sort of the rows on the user-click. TODO capire vecchio indice selzionato, se lodevo riselzionare
         * @param {GridControl} that
         * @param {DataColumn} column
         */
        sortColumnClick:function (that, column) {

            // svuoto
            that.clearControl();

            // ordino la collection attuale delle rgihe
            column.mdlw_sort = column.mdlw_sort ? (column.mdlw_sort === 'asc' ? 'desc' : 'asc') : 'asc' ;
            that.gridRows = _.orderBy(that.gridRows, [column.name], [column.mdlw_sort]);

           // reset indicatore colonna ordinata
            _.forEach(that.orderedCols, function (c) {
                var csortId = "#" + that.getIdColumnSort(c.name);
                if ($(csortId).length > 0 ) $(csortId).css("color", "black")
            });
            // metto indicatore di sort sull'icona della colonna giusta
            $("#" + that.getIdColumnSort(column.name)).css("color", that.colorOrder);

            // rimetto righe
            that.loopOnRows();

            // aggiungo eventi alle righe
            that.addMyEvents();
            // reset dell'indice selzionato
            that.setIndex(-1);
        },

        /**
         * @method getControl
         * @private
         * @description SYNC
         * Reads data from the control - Actually does nothing on a grid
         */
        getControl: function() {

        },

        /**
         * @method clearControl
         * @private
         * @description ASYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         * @returns {Deferred}
         */
        clearControl: function() {
            this.clearHtmlGrid();
            return this.setIndex(-1);
        },

        /**
         * @method rowClickEv
         * @private
         * @description ASYNC
         * Laucnhes a rowClick method after 200ms of timeout. To avoid checking the timeoutId double single click event.
         * "this" is the tr html element that launches the event
         * @param {GridControl} that
         */
        rowClickEv: function (that) { //this è l'element
            var self = this;
            // inserisco meccanismo con timeout per evitare che scatti CLICK + DBL_CLICK insieme
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
                Stabilizer.decreaseNesting("rowClickEv.timeout");
            }
            Stabilizer.increaseNesting("rowClickEv");
            this.timeoutId = setTimeout(function () {
                self.timeoutId = null;
                that.rowClick
                    .call(self, that);
                Stabilizer.decreaseNesting("rowClickEv.timeout");
            }, appMeta.currApp.dbClickTimeout);
        },

        /**
         * @method rowDblClickEv
         * @private
         * @description ASYNC
         * Clears the timeout to avoid the single click and call the rowDblClick method with this as invocation object.
         * "this" is the tr html element that launches the event
         * @param {GridControl} that
         */
        rowDblClickEv: function (that) {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
                Stabilizer.decreaseNesting("rowDblClickEv");
            }

            return Deferred("rowDblClickEv").from(that.rowDblClick.call(this, that));
        },

        /**
         * @method rowClick
         * @private
         * @description ASYNC
         * Manages a row click event
         * "this" is the tr html element that launches the event
         * @param {GridControl} that
         * @returns {Deferred}
         */
        rowClick: function (that, propagate) {
            var self = this;
            // distinguo ildoppio click s è o meno gestito come treeNavigator

            var index = $(this).data("mdlRowIndex");
            var r = null;
            var def = Deferred("rowClick");

            if (index || index === 0) r = that.gridRows[index];
            if (index === that.currentIndex) return def.resolve(true); //Riga già selezionata

                if (that.metaPage) {
                    that.metaPage.canSelect(that.dataTable, r)
                        .then(function (result) {
                            if (result) {
                                if (that.isTreeNavigator) return def.from(that.navigatorClick.call(self, that));
                                return def.resolve(that.setIndex(index, propagate));
                            } else {
                                return def.resolve(false);
                            }
                        });

                } else {
                    return def.from(that.setIndex(index, propagate));
                }


            return def;
        },

        /**
         * @method rowDblClick
         * @private
         * @description ASYNC
         * Manages a row double click event
         * "this" is the tr html element that launches the event
         * "that.metaPage" can be MetaPage, ListManager
         * @param {GridControl} that
         */
        rowDblClick:function (that) {
            // chiamo il rowClick con il this che è il tr che cliccato, + il that che è il Gridcontrol.
            // Poi invoco il rowDblClick su MetaPage
            var self = this;

            // distinguo ildoppio click s è o meno gestito come treeNavigator

            if ( that.isTreeNavigator) {
                return Deferred("rowDblClick")
                    .from(that.navigatorClick
                        .call(this, that)
                        .then(function() {
                            return that.navigatorDblClick();
                        }));
            } else{
                return Deferred("rowDblClick")
                    .from(that.rowClick
                        .call(this, that)
                        .then(function() {
                            // solamente se è definito
                            if (that.metaPage.rowDblClick && that.isEditBtnVisible) { //prima era incondizionato
                                var index = $(self).data("mdlRowIndex"); // self era il this ovvero , l'elemento cliccato
                                var row = null;
                                if (index || index === 0) row = that.gridRows[index];
                                that.metaPage.rowDblClick(that, that.dataTable, row);
                            }
                        }));
            }
        },

        /**
         * @method navigatorClick
         * @private
         * @description ASYNC
         * It selects and expands a node on tree navigator
         * @param {GridControl} that
         * @returns {Deferred}
         */
        navigatorClick:function (that) {
            var def = Deferred('navigatorClick');
            var treemanager = that.dataTable.treemanager;
            if (!treemanager) return def.resolve();

            var parent = that.dataTable.parentnode;
            if (!parent) {
                var curr = treemanager.selectedNode();
                parent = curr;
            }
            var index = $(this).data("mdlRowIndex");
            var rSel =  that.gridRows[index];
            var waitingHandler = that.metaPage.showWaitingIndicator(localResource.modalLoader_wait_tree_node_search);
            return treemanager.selectNodeByRow(rSel, false)
                .then(function () {
                    that.dataTable.parentnode = treemanager.getParent(treemanager.selectedNode());
                    that.setLastSelectedRowOnTree(treemanager.treeTable, rSel);   // N.B era that.helpForm.lastSelected(rSel.getRow().table, rSel); // la riga sul grid è una copia, non ha ilgetrow, prendo quella sul tree
                    that.setIndex(index, false); // seleziono anche indice su griglia corrente come facevail click semplice
                    that.metaPage.hideWaitingIndicator(waitingHandler);
                    return def.resolve();
            })
        },

        /**
         * @method navigatorDblClick
         * @private
         * @description ASYNC
         * @param {DataTable} table
         * @param {ObjectRow} row
         * Finds the same row on table and set on this table the lastSelected
         */
        setLastSelectedRowOnTree:function (table, row) {
            var rowFound;
            // per ogni riga del treemanger prendo quella che corrisponde e la linko. è lei che ha il getRow. qui sul grid ho una copia
            _.forEach(table.rows,function (currRow) {
                 if (getDataUtils.isSameRow(table, row, currRow)){
                     rowFound = currRow;
                     return false; // esco dal ciclo
                 }
            });

            if(rowFound) this.helpForm.lastSelected(rowFound.getRow().table, rowFound);
        },

        /**
         * @method navigatorDblClick
         * @private
         * @description ASYNC
         * @returns {Deferred}
         * Navigates the tree and the grid childs. if it is a leaf it fires a mainSelect on the metaPage
         */
        navigatorDblClick:function () {
            var self = this;
            var def = Deferred('navigatorDblClick');
            var treemanager = this.dataTable.treemanager;
            if (!treemanager) return def.resolve();
            var node = treemanager.selectedNode();
            if (!node) return def.resolve();

            var myDT = this.dataTable;
            var waitingHandler = this.metaPage.showWaitingIndicator(localResource.modalLoader_wait_tree_navigation);
            if (myDT.parentnode) {
                if (node.children.length === 0) {
                    this.metaPage.hideWaitingIndicator(waitingHandler);
                 return def.from(this.metaPage.mainSelect());
                }
                
                treemanager.openNode(node);
                
                return this.fillControlTreeNavigator().then(function () {
                    self.metaPage.hideWaitingIndicator(waitingHandler);
                })
            }

            treemanager.openNode(node);

            if (self.currentIndex === -1) return def.resolve();
            var selectedRow = self.currentRow;
            
            return utils._if(selectedRow)
                ._then(function () {
                    self.helpForm.lastSelected(selectedRow.getRow().table, selectedRow);
                    return treemanager.selectNodeByRow(selectedRow, false);
               }).then(function () {
                    var selectedNode = treemanager.selectedNode();
                    if (selectedNode) return treemanager.openNode(selectedNode);
                    self.metaPage.hideWaitingIndicator(waitingHandler);
                    def.resolve();
               })
        },

        /**
         * @method fillControlTreeNavigator
         * @private
         * @description ASYNC
         * Fills the grid based on tree navigator node selected
         * @returns {Deferred}
         */
        fillControlTreeNavigator:function () {
            var def = Deferred('fillControlTreeNavigator');
            var self = this;

            // 1. recupero il treeManager se esiste
            var treemanager = this.dataTable.treemanager;
            if (!treemanager) return def.resolve();

            treemanager.setNavigator(this);

            // costruisco un dt ausiliario della griglia sganciandolo dal quello del tree, che rimane quello che comanda.
            // sul dt clonato della griglia farò tutte le operazioni che voglio.
            if (!this.firstFillDone){
                this.firstFillDone = true;
                var dst = new jsDataSet.DataSet("temp");
                var dtt = dst.newTable(this.dataTable.name);
                dtt = getDataUtils.cloneDataTable(this.dataTable);
                this.dataSourceName = dtt.name;
                this.dataTable = dtt;
                this.dataTable.treemanager = treemanager;
                //parent of selected node, and of other nodes in datagrid
                this.dataTable.parentnode = null;
            }

            var mydt = this.dataTable;
            var prevParent = mydt.parentnode;

            var selectedNode = treemanager.selectedNode();
            if (!selectedNode) return def.resolve();
            var dtRowNode = null;
            var isNotRoot = !treemanager.isRoot(selectedNode);
            var isLeaf = treemanager.isLeaf(selectedNode);
            var hasDummyChild = treemanager.hasDummyChild(selectedNode);

            if (isNotRoot && (isLeaf || hasDummyChild)) {

                dtRowNode = selectedNode.original.dataRow;

                selectedNode = treemanager.getParent(selectedNode);

                if (prevParent === selectedNode ) {
                        return def.resolve(this.selectGridRowByRow(mydt, dtRowNode, false))
                }
            }

            if (!selectedNode) return def.resolve();

            this.helpForm.myClear(mydt);
            this.clearHtmlGrid();

            _.forEach(selectedNode.children, function (childNodeId) {
                var currNodeChild = treemanager.getNodeById(childNodeId);
                var r = currNodeChild.original.dataRow;
                var newRow = mydt.newRow();
                _.forEach(mydt.columns, function (col) {
                    newRow[col.name] = r[col.name];
                });
                newRow.getRow().acceptChanges();
            });

            mydt.parentnode = null;

            // eseguo fill normale della griglia
            return this.innerFillControl(this.el, undefined, false ).then(function () {
                if (dtRowNode) {
                        return self.selectGridRowByRow(mydt, dtRowNode, false)
                         .then(function () {
                             mydt.parentnode = selectedNode;
                             return def.resolve();
                         })
                }
                else {
                    self.currentIndex = 0;
                    return def.resolve(self.setIndex(self.currentIndex, false));
                }
            });
        },

        /**
         * @method selectGridRowByRow
         * @private
         * @description ASYNC
         * Selects the row on the grid based on the datarow parameter. If the row is in the grid it selcts it
         * @param {DataTable} table
         * @param {ObjectRow} datarow
         * @param {boolean} propagate if true it call a rowSelct on metaPage
         * @returns {Deferred}
         */
        selectGridRowByRow:function (table, datarow, propagate) {
            // passo la table su cui effettuare il confronto prendendo le chiavi, poichè
            // tale datarow è attachata alla griglia, e potrebbe non avere la getRow,
            //  poichè nella costruzione ne faccio la clear
            // sarà sempre quella del tree la riga che comanda
            var def = Deferred('selectGridRowByRow');
            // trova la riga nella collection
            var rowFound = null;
            var rowFoundIndex = null;
            _.forEach(this.gridRows, function (r, index) {
                if (getDataUtils.isSameRow(table, datarow, r)){
                    rowFound = datarow;
                    rowFoundIndex = index;
                    return false; // esco dal ciclo
                }
            });

            if (rowFoundIndex !== null){
                return def.from(this.setIndex(rowFoundIndex, propagate)).promise();
            }
            return def.resolve();
        },
        /**
         * @method buildEmptyRect
         * @public
         * @description ASYNC
         * during prescan adds an emty rect
         */
        buildEmptyRect:function () {
            /*var w = appMeta.currApp.getScreenWidth() * 0.3;
            var h = appMeta.currApp.getScreenHeight() * 0.2;
            var id = $(this.el).attr('id') + "empty";
            if (this.emptyElement) return;
            this.emptyElement = $('<br><div id =' + id + ' style="background-color: lightgrey; border: 1px solid grey; width: '+ w + 'px; height: ' + h + 'px"></div>');
            $(this.el).append(this.emptyElement);*/

            // inserisco solo header.per mostrare qualcosa all'inizio
            if (!this.emptyElement) {
                this.emptyElement = $('<table class="table"  border="1">');
                $(this.el).append(this.emptyElement);
                var $tr = $("<tr>");
                this.emptyElement.append($tr);
                var self  = this;
                if (!this.DS) return;
                var t  = this.dataTable || this.DS.tables[this.dataSourceName];
                if (!t) return;
                this.orderedCols = this.getOrderedColumns(t);
                _.forEach(this.orderedCols,
                    function(c, index) {
                        var $th = $('<th>');
                        self.addChildElement( $tr, $th, c.caption || c.name);
                    });
            }
        },


        /**
         * @method gridHtmlToExcel
         * @private
         * @description SYNC
         * replaces some special character into html code. Used in html export
         * @param {string} s
         */
        replaceSpecialCharacters:function (s) {
            var html = s;
            var fReplcace = function (htmlprm, char, code){while (htmlprm.indexOf(char) != -1) htmlprm = htmlprm.replace(char, code); return htmlprm};
            html = fReplcace(html,'á', '&aacute;');
            html = fReplcace(html,'é', '&eacute;');
            html = fReplcace(html,'í', '&iacute;');
            html = fReplcace(html,'ó', '&oacute;');
            html = fReplcace(html,'ú', '&uacute;');
            html = fReplcace(html,'à', '&agrave;');
            html = fReplcace(html,'è', '&egrave;');
            html = fReplcace(html,'ì', '&igrave;');
            html = fReplcace(html,'ò', '&ograve;');
            html = fReplcace(html,'ù', '&ugrave;');
            html = fReplcace(html,'"', '&#34;');
            html = fReplcace(html,'“', '&ldquo;');
            html = fReplcace(html,'”', '&rdquo;');
            html = fReplcace(html,'‘', '&lsquo;');
            html = fReplcace(html,'’', '&rsquo;');
            return html;
        },

        /**
         * @method gridHtmlToExcel
         * @private
         * @description SYNC
         * Executes and export to excel
         */
        gridHtmlToExcel:function (that) {

            var gridhtml = that.replaceSpecialCharacters(that.mytable.html());
            //that.replaceSpecialCharatcters(gridhtml);
            var tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
            tab_text = tab_text + '<head><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
            tab_text = tab_text + '<x:Name>'+ that.tag +'</x:Name>';
            tab_text = tab_text + '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
            tab_text = tab_text + '</x:ExcelWorksheets></x:ExcelWorkbook></xml></head><body>';
            tab_text = tab_text + "<table border='1px'>";
             // concatena alla griglia
            tab_text = tab_text + gridhtml;
            tab_text = tab_text + '</table></body></html>';

            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");
            var fileName  = moment().format('D_MMM_YYYY_HHmm') + "_" + that.dataTable.name + "_" + that.listType + ".xls";
            // IE
            if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
                if (window.navigator.msSaveBlob) {
                    var blob = new Blob([tab_text], {type: "application/csv;charset=utf-8;"});
                    navigator.msSaveBlob(blob, fileName);
                }
            }
            // Chrome + Firefox
            else {
                var data_type =  'data:application/vnd.ms-excel';
                that.$btnexportExcel.attr('href', data_type + ', ' +  encodeURIComponent(tab_text));
                that.$btnexportExcel.attr('download', fileName);
            }
        },

        /**
         * @method preFill
         * @public
         * @description ASYNC
         * Executes a prefill of the control
         * @param {Html node} el
         * @param {Object} param {tableWantedName:tableWantedName, filter:filter, selList:selList}
         * @returns {Deferred}
         */
        preFill: function(el, param) {
            var def = Deferred("preFill-Grid");
            var self =this;
            var res =  this.defDescribedColumn
                .then(function () {

                    self.buildEmptyRect();

                    if(param.tableWantedName && param.tableWantedName !== self.dataSourceName ) return def.resolve();

                    // se è un navigator il mainTableSelector sarà il tree
                    // su mdl era qui helpform.PreFillControlsTable()
                    if (!self.helpForm.mainTableSelector && self.dataSourceName === self.helpForm.primaryTableName && !self.isTreeNavigator){
                        self.helpForm.mainTableSelector = self;
                    }

                    def.resolve();

                });

            return def.from(res);
        },
        
        
    };

    // grids, in cui s sta per simple
    window.appMeta.CustomControl("grid", GridControl);
}
());
