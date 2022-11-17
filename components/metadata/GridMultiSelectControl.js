/**
 * @module GridMultiSelectControl
 * @description
 * Manages the graphics and the logic of an html Grid with a multiselction
 */
(function() {

    var Deferred = appMeta.Deferred;
    var dataRowState = jsDataSet.dataRowState;
    var rightButtonCode = 3;

    /**
     * @constructor GridMultiSelectControl
     * @description
     * Initializes the html grid control for the multiselection
     * @param {element} parent
     * @param {DataTable} dt
     * @param {HelpForm} helpForm
     */
    function GridMultiSelectControl(parent, dt, helpForm) {
        if (this.constructor !== GridMultiSelectControl) {
            return new GridMultiSelectControl(parent, dt, helpForm);
        }

        this.parent = parent || document.body;
        this.helpForm = helpForm;
        this.DS = this.helpForm.pageState.DS;

        this.dt = dt;
        this.meta = appMeta.getMeta(this.dt.tableForReading());
        this.orderedCols = {};
        this.allRowsSelector = "tr:not(:has(>th))";
        this.mytable = $('<table class="table" border="1">');

        // elenco ordinato righe nel grid (solo quelle del grid, nell'ordine in cui vi si trovano)
        this.gridRows = [];

        this.selectedRows = [];
        this.lastClickedRow = null;
        return this;
    }

    GridMultiSelectControl.prototype = {
        constructor: GridMultiSelectControl,

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Executes the fill of the custom control
         * @param {jsDataQuery} filter
         * @returns {Deferred}
         */
        fillControl: function(filter) {

            if (!this.dt) return Deferred("fillControl").resolve();
            this.orderedCols = this.getOrderedColumns(this.dt);
            this.mytable = $('<table class="table" border="1">');

            // ho il datatable
            this.addHeaders();
            // inserisco righe
            this.addRows(this.dt, filter)
            // esegui l'append dela griglia appena creata
            $(this.parent).html(this.mytable);
            this.addMyEvents();
            return Deferred("GridMultiSelectfillControl.fillcontrol").resolve().promise();
        },

        /**
         * @method addMyEvents
         * @private
         * @description SYNC
         * Adds events to grid rows
         */
        addMyEvents:function () {
            this.mytable.find(this.allRowsSelector).on("mousedown", _.partial(this.mouseDown, this));
            // previene che venga mostrato context menu del browser
            this.mytable.find(this.allRowsSelector).on("contextmenu",function(evt) {evt.preventDefault();});
        },

        /**
         * @method mouseDown
         * @private
         * @description ASYNC
         * Event fired on mousedown. Manages the multiple selection on grid.
         * mousedown + ctrl select/deselect one row at a time
         * mousedown + shift selct a range of rows
         * right click select all rows
         * @param {GridMultiSelectControl} that
         * @param {Mouse Event} ev
         * @returns {Deferred}
         */
        mouseDown:function (that, ev) {
            var isCtrl = (ev.ctrlKey || ev.metaKey);
            var isShift = ev.shiftKey;
            var currRowIndex = $("tr").index(this);
            var lastRowIndex = that.lastClickedRow ? $("tr").index(that.lastClickedRow) : -1;
            var indexInSelectedRows = $.inArray(this, that.selectedRows);

            var isRightButton = ev.which ? (ev.which === rightButtonCode) : false;

            // per sicurezza
            if (isShift || isCtrl) ev.preventDefault();

            // rimuovo il css da tutti
            $(that.selectedRows).removeClass(appMeta.cssDefault.selectedRow);

            // se premo tasto destro mouse e c'è una o 0 righe allora selziono tutte

            if (isRightButton && that.selectedRows.length <= 1){
                that.selectedRows = that.mytable.find(that.allRowsSelector);
            } else if (isCtrl) {
                if (indexInSelectedRows > -1) that.selectedRows.splice(indexInSelectedRows, 1);
                else that.selectedRows.push(this);
            } else if (isShift && that.selectedRows.length > 0) {
                if (currRowIndex > lastRowIndex) {
                    var tempCurrIndex = currRowIndex;
                    currRowIndex = lastRowIndex;
                    lastRowIndex = tempCurrIndex;
                }
                // avendo premuto shift, seleziona un intervallo di righe
                that.selectedRows = that.mytable.find(that.allRowsSelector).slice(currRowIndex - 1, lastRowIndex);
            } else {
                that.selectedRows = indexInSelectedRows < 0 || that.selectedRows.length > 1 ? [this] : [];
            }

            // salvo in questa di classe l'ultima riga che ha fatto mousedown
            that.lastClickedRow = this;

            // aggiungo il css alle righe selezionate
            $(that.selectedRows).addClass(appMeta.cssDefault.selectedRow);

            return Deferred("mouseDown").resolve();
            // TODO lanciare qui l'evento di selzione multipla ???
        },

        /**
         * @method getOrderedColumns
         * @private
         * @description SYNC
         * Sorts the columns depending on listColPos column property. It doesn't consider columns that haven't caption, that start with a dot, and that have listColPos equal to -1punto
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
         * @method getSortedRows
         * @private
         * @description SYNC
         * Sorts and returns the rows of the DataTable "t"
         * @param {DataTable} t
         * @param {jsDataQuery} filter
         * @returns {ObjectRow[]}
         */
        getSortedRows: function(t, filter) {
            var sorting = this.getSorting(t);
            if (!sorting) return t.select(filter);
            var parts = sorting.split(",");
            var sortingObject = _.reduce(parts,
                function(result, part) {
                    var sortElem = part.trim().split(" ");
                    result.names.push(sortElem[0]);
                    if (sortElem.length === 1) {
                        result.names.push("asc");
                    } else {
                        result.names.push(sortElem[1].toLowerCase());
                    }
                    return result;
                },
                { names: [], sorting: [] });
            return _.orderBy(t.select(filter), sortingObject.names, sortingObject.sorting);
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
            var sorting  = this.meta.getSorting(this.listType);
            return (sorting ? sorting : dt.orderBy());
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
            // rimuovo eventuale classe
            $("tr", this.mytable).removeClass('active');
            // imposto class active al tr trovato
            if (tr) $(tr).addClass('active');
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
            var countRiga = 0;
            var that = this;
            this.gridRows = this.getSortedRows(dataTable, filter);

            _.forEach(this.gridRows,
                function(r, index) {
                    if (r.getRow().state !== dataRowState.deleted) {
                        that.addTableRow(r, countRiga, index);
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
        addTableRow: function(dataRow, gridRowCount, rowIndex) {
            if (!dataRow) return;
            var $tr = $("<tr>");
            var self = this;
            _.forEach(this.orderedCols,
                function(c) {
                    var value = self.getFormattedValue(dataRow, c);
                    var columnStyle = self.getColumnsAlignmentCssClass(c);
                    $tr.data("mdlRowIndex", rowIndex);
                    // applico lo stile
                    var $td = $("<td nowrap>");
                    $td.addClass(columnStyle);

                    self.addChildElement($tr, $td, value);

                    //if ((gridRowCount % 2) === 1) {
                    //    $tr.addClass(appMeta.cssDefault.odd);
                    //}

                });
            $($tr).appendTo(this.mytable);

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
            return pObj.stringValue(tag);
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
            var $tr = $("<tr>");
            _.forEach(this.orderedCols,
                function(c) {
                    self.addChildElement($tr, $("<th>"), c.caption || c.name);
                });
            $($tr).appendTo(this.mytable);
        },

        /**
         * @method clearControl
         * @private
         * @description SYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         */
        clearControl: function() {
            this.mytable.find("tr").each(
                function(i, tr) {
                    if ($(tr).find("th").length === 0) {
                        $(tr).remove();
                    }
                });

            this.selectedRows = [];
            this.lastClickedRow = null;
        }

    };

    appMeta.GridMultiSelectControl = GridMultiSelectControl;
}());