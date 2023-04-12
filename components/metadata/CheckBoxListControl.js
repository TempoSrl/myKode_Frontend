/**
 * @module CheckBoxListControl
 * @description
 * Manages the graphics and the logic of an html CheckBoxListControl
 */
(function() {

    var dataRowState = jsDataSet.dataRowState;
    var Deferred = appMeta.Deferred;
    var getData = appMeta.getData;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var q = window.jsDataQuery;
    var metaModel = window.appMeta.metaModel;

    /**
     * @constructor CheckBoxListControl
     * @description
     * Initializes the html grid control
     * @param {Html node} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table. this is the table corresponding to the tableName configured in the tag at the position 0
     * (see function HelpForm.preScanCustomControl for the initialization)
     * @param {DataTable} primaryTable
     * @param {string} listType. if it is called by in a listmanager, listType is passed
     * Contains all data of a grid
     */
    function CheckBoxListControl(el, helpForm, table, primaryTable, listType) {

        this.helpForm = helpForm;
        this.DS = table.dataset;

        this.dataSourceName = table.name;
        this.dataTable = table;
        this.dataTable.linkedGrid = this;
        this.el = el;
        this.tag = $(el).data("tag");
        this.isCustomGetcontrol = true;

        // colore per licona della colonna ordinata
        this.colorOrder = "white";
        this.mdlwcheckboxColumn = "mdlwcheckboxColumn";

        // gestione bottoni editing direttamente su griglia
        this.isInsertBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttoninsert");
        this.isEditBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttonedit");
        this.isDeleteBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttondelete");
        this.isUnlinkBtnVisible = helpForm.existsDataAttribute(el, "mdlbuttonunlink");
        this.isNotSort = helpForm.existsDataAttribute(el, "mdlnotsort");
        this.excludeGroup = true;

        this.createConditionalColumns();

        this.meta = appMeta.getMeta(this.dataTable.tableForReading());
        this.listType = listType ? listType : helpForm.getField(this.tag, 1);

        this.defDescribedColumn = this.meta.describeColumns(this.dataTable, this.listType);

        this.editType = helpForm.getField(this.tag, 2);

        this.orderedCols = {};


        //indice della riga selezionata nel grid (indice in gridRows e non visuale) ,
        //      -1 se nessuna riga selezionata
        this.currentIndex = -1;
        this.currentRow = null; // DataRow selezionato, null se non c'è riga selezionata
        this.mytable = $('<table class="table" border="1">');
        // aggiungo intero tag html table
        $(el).html(this.mytable);

        //dalla metaPage recupera lo stato e quindi il DS

        this.primaryTable = primaryTable;// helpForm.primaryTable;


        // elenco ordinato righe nel grid (solo quelle del grid, nell'ordine in cui vi si trovano)
        this.gridRows = [];
        // se mono select,  cerca sempre di selezionare la prima riga utile o l'ultima selezionata

        // bottone di conferma
        /* var btnGetSeleted = '<BR><button class="btn" id="btnGetSeleted_id">get selected</button>';
        $(el).append(btnGetSeleted);
        $("#btnGetSeleted_id").on("click", _.partial(this.getRowsSelected, this ));
        */
        return this;
    }

    CheckBoxListControl.prototype = {
        constructor: CheckBoxListControl,

        /**
         * @method getCurrentRow
         * @public
         * @description SYNC
         * Returns a js object with the info on current selected row
         * @returns {{changed: (DataTable|*), rowChanged: (null|*|ObjectRow)}}
         */
        getCurrentRow: function() {
            return { changed: this.dataTable, rowChanged: this.currentRow };
        },

        /**
         * @method addMyEvents
         * @private
         * @description SYNC
         * Adds the "click" and "dblclick" events to the rows of the grid
         */
        addMyEvents: function() {
           // this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped])").on("click", _.partial(this.rowClickEv, this));
           // this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped])").on("dblclick", _.partial(this.rowDblClickEv, this));
        },

        /**
         * @method addEvents
         * @public
         * @description SYNC
         * @param {Html node} el
         * @param {MetaPage} metaPage
         */
        addEvents: function(el, metaPage) {
            this.metaPage = metaPage;
        },

        /**
         * @method getMiddleTable
         * @public
         * @description SYNC
         * Gets the common child table of the two tables dt1 and dt2
         * @param {DataTable} dt1
         * @param {DataTable} dt2
         * @returns {DataTable | null}
         */
        getMiddleTable:function (dt1, dt2) {
            var self  = this;
            var dtMiddle = null;
            _.forEach(dt1.childRelations(), function (rel1) {
                if (dtMiddle) return false; // se l'ho trovata esco dal ciclo
                var middle = rel1.childTable;
                _.forEach(dt2.childRelations(), function (rel2) {
                    if(rel2.childTable === middle){
                        dtMiddle = self.helpForm.DS.tables[middle];
                        return false; // esco dal ciclo
                    }
                })
            });

            return dtMiddle;
        },

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Fills the grid  Checks/Unchecks items dependingly on current primary table row
         * @param {type} el
         * @returns {Deferred}
         */
        fillControl: function (el) {
            var def = Deferred("checkboxlist-fillControl");
            var self = this;
            this.innerFillControl(this.el, null).then(function () {
                var p1Row = self.helpForm.lastSelected(self.primaryTable);
                if (!p1Row) return def.resolve(false);
                var otherParentTable = self.dataTable;

                // recupera la tabella di collegamento
                var middle = self.getMiddleTable(self.primaryTable, otherParentTable);
                if (!middle){
                    console.log("CheckBoxListControl: Link table not exist among " + self.primaryTable.name + " e " + otherParentTable.name);
                    return def.resolve(false);
                }
                var pRel1s = self.helpForm.DS.getParentChildRelation(self.primaryTable.name, middle.name);
                var pRel2s = self.helpForm.DS.getParentChildRelation(otherParentTable.name, middle.name);

                // ese c'è zero o più di una relazione c'è qualche errore di configurazione ed esco
                if (pRel1s.length !==1){
                    console.log("CheckBoxListControl: Exist one o more relation (must be one) among parent: " + self.primaryTable.name + " and child:" + middle.name);
                    return def.resolve(false);
                }
                if (pRel2s.length !==1){
                    console.log("CheckBoxListControl: Exist one o more relation (must be one) among parent: " + otherParentTable.name + " and child:" + middle.name);
                    return def.resolve(false);
                }

                // recupero la relazione dall'array
                var pRel1 = pRel1s[0];
                var pRel2 = pRel2s[0];

                $(el).find("input[type=checkbox]:not([data-mdlallcheckbozes])")
                    .each(function() {
                        var objRow = $(this).data("mdlrowattached");
                        if (!objRow) return;

                        var pRel1ParentCols = [];
                        var PRel1ChildColumns = [];
                        var pRel2ParentCols = [];
                        var PRel2ChildColumns = [];

                        _.forEach(pRel1.parentCols, function (cname) {
                            if (self.primaryTable.columns[cname]) pRel1ParentCols.push(self.primaryTable.columns[cname]);
                        });
                        _.forEach(pRel1.childCols, function (cname) {
                            if (middle.columns[cname]) PRel1ChildColumns.push(middle.columns[cname]);
                        });
                        _.forEach(pRel2.parentCols, function (cname) {
                            if (otherParentTable.columns[cname]) pRel2ParentCols.push(otherParentTable.columns[cname]);
                        });
                        _.forEach(pRel2.childCols, function (cname) {
                            if (middle.columns[cname]) PRel2ChildColumns.push(middle.columns[cname]);
                        });

                        //Get Common child row if present
                        var par1filter = getData.getWhereKeyClauseByColumns(p1Row.getRow(), pRel1ParentCols, PRel1ChildColumns);
                        var par2filter = getData.getWhereKeyClauseByColumns(objRow, pRel2ParentCols, PRel2ChildColumns);
                        var par12filter = q.and(par1filter, par2filter);
                        // ricorda la select torna le righe  filtrate gia con le non deleted
                        var currChilds = middle.select(par12filter);
                        //  a seconda se trovo o non trovo, seleziono/deseleziono il checkbox
                        $(this).prop("checked", !!currChilds.length);

                    });
                return def.resolve(true);
            });

            return def.promise();
        },

        /**
         * @method getControl
         * @private
         * @description SYNC
         * Reads data from the control. Adds a row in "linked middle" table if checked
         */
        getControl: function() {
            var self = this;
            var p1Row = this.helpForm.lastSelected(this.primaryTable);
            if (!p1Row) return;
            var otherParentTable = this.dataTable;
            var middle = this.getMiddleTable(this.primaryTable, otherParentTable);

            if (!middle){
                console.log("CheckBoxListControl: Link table not exist among " + this.primaryTable.name + " e " + otherParentTable.name);
                return;
            }

            var pRel1s = this.helpForm.DS.getParentChildRelation(this.primaryTable.name, middle.name);
            var pRel2s = this.helpForm.DS.getParentChildRelation(otherParentTable.name, middle.name);

            // ese c'è zero o più di una relazione c'è qualche errore di configurazione ed esco
            if (pRel1s.length !==1){
                console.log("CheckBoxListControl: Exist one o more relation (must be one) among parent: " + this.primaryTable.name + " and child:" + middle.name);
                return;
            }
            if (pRel2s.length !==1){
                console.log("CheckBoxListControl: Exist one o more relation (must be one) among parent: " + otherParentTable.name + " and child:" + middle.name);
                return;
            }

            // recupero la relazione dall'array
            var pRel1 = pRel1s[0];
            var pRel2 = pRel2s[0];

            $(this.el).find("input[type=checkbox]:not([data-mdlallcheckbozes])")
                .each(function() {
                    var objRow = $(this).data("mdlrowattached");
                    if (!objRow) return;

                    var pRel1ParentCols = [];
                    var PRel1ChildColumns = [];
                    var pRel2ParentCols = [];
                    var PRel2ChildColumns = [];

                    _.forEach(pRel1.parentCols, function (cname) {
                        if (self.primaryTable.columns[cname]) pRel1ParentCols.push(self.primaryTable.columns[cname]);
                    });
                    _.forEach(pRel1.childCols, function (cname) {
                        if (middle.columns[cname]) PRel1ChildColumns.push(middle.columns[cname]);
                    });
                    _.forEach(pRel2.parentCols, function (cname) {
                        if (otherParentTable.columns[cname]) pRel2ParentCols.push(otherParentTable.columns[cname]);
                    });
                    _.forEach(pRel2.childCols, function (cname) {
                        if (middle.columns[cname]) PRel2ChildColumns.push(middle.columns[cname]);
                    });

                    //Get Common child row if present
                    var par1filter = getData.getWhereKeyClauseByColumns(p1Row.getRow(), pRel1ParentCols, PRel1ChildColumns);
                    var par2filter = getData.getWhereKeyClauseByColumns(objRow, pRel2ParentCols, PRel2ChildColumns);
                    var par12filter = q.and(par1filter, par2filter);

                    // ricorda la select torna le righe  filtrate gia con le non deleted
                    var currChilds = middle.select(par12filter);
                    var checked = !!$(this).is(":checked");

                    // se è selezionato e non è già associato allora creo la nuova riga sulla tabella di collegamento
                    if (checked && !currChilds.length){
                        var newMid = middle.newRow();
                        self.helpForm.makeChild(p1Row.getRow(), self.primaryTable, newMid.getRow(), pRel1.name);
                        self.helpForm.makeChild(objRow, otherParentTable, newMid.getRow(), pRel2.name);
                    }

                    // se deseleziono e ho già associato cancello la riga
                    if (!checked && currChilds.length) currChilds[0].getRow().del();

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
        innerFillControl: function(el, filter) {

            var def = Deferred("innerFillControl");

            if (!this.dataTable) return def.resolve();
            var self = this;

            // rimane aperto dal costruttore e qui mi aspetto venga fatta la then, quando appunto torna il metodo
            var res =  this.defDescribedColumn
                .then(function () {

                    self.orderedCols = self.getOrderedColumns(self.dataTable);
                    if (self.emptyElement) self.emptyElement.remove(); // rimuovo l'elemnto vuoto, cioè l'header

                    self.gridRows = self.getSortedRows(self.dataTable, filter);
                    self.recalculatesLinkedRowIndex();

                    // ridisegno grid con le righe raggruppate
                    self.redrawGrid();

                    // risolvo
                    def.resolve()

                });

            return def.from(res).promise();

        },

        /**
         * @method recalculatesLinkedRowIndex
         * @private
         * @description SYNC
         * For each row attach and index. In the grouping we need an index linked to the row and not the index in the gridrow array
         */
        recalculatesLinkedRowIndex:function () {
            _.forEach(this.gridRows, function (r, index) {
                r.getRow().mdlrowindex = index;
            })
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

            // aggiungo in prima posizione colonna checkbox
            cols.unshift(new jsDataSet.DataColumn(this.mdlwcheckboxColumn, "string"));

            return cols;
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
          var sorting = this.getSorting(t);
          var rows = t.select(filter);
          if (!sorting) return _.orderBy(rows, t.key());
          var parts = sorting.split(",");
          rows = _.orderBy(rows, t.key());

          var sortingObject = _.reduce(parts,
             function (result, part) {
                var sortElem = part.trim().split(" ");
                var field = sortElem[0];
                result.names.push(function (row) {
                   var value = row[field];
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
            return sorting ? sorting : dt.orderBy();
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
         * @method addTableRow
         * @private
         * @description SYNC
         * Adds the html cells to html row and the row to the html table. Cell values are read from dataRow
         * @param {ObjectRow} objRow
         * @param {number} gridRowCount index of the row in the grid
         */
        addTableRow: function(objRow, gridRowCount) {
            if (!objRow) return;

            var $tr = $('<tr>');

            var self = this;
            _.forEach(this.orderedCols,
                function(c) {
                    var columnStyle = self.getColumnsAlignmentCssClass(c);
                    if (c.name === self.mdlwcheckboxColumn){
                        // applico lo stile
                        var $td = $('<td style="user-select: none; text-align: center; vertical-align: middle;" nowrap>');
                        $td.addClass(columnStyle);
                        var $checkbox  =  $('<input type="checkbox" class="big-checkbox">');
                        $checkbox.data("mdlrowattached", objRow.getRow());
                        self.addChildElement($tr, $td);
                        self.addChildElement($td, $checkbox);
                    } else {
                        var value = self.getFormattedValue(objRow, c);
                        // applico lo stile
                        var $td = $('<td style="user-select: none" nowrap>');
                        $td.addClass(columnStyle);
                        self.addChildElement($tr, $td, value);
                    }
                });

            $tr.data("mdlRowIndex", objRow.getRow().mdlrowindex);

            self.mytable.append($tr);
        },

        /**
         * @method getRowsSelected
         * @private
         * @description SYNC
         * Gets the array of ObjectRow selected
         * @returns {Array(ObjectRow)}
         */
        getRowsSelected:function (that) {
            var rowsSelected = [];
            $(that.el).find("input[type=checkbox]")
                .each(function() {
                    var checked = !!$(this).is(":checked");
                    var objRow = $(this).data("mdlrowattached");
                    if (checked) rowsSelected.push(objRow);
                });

            return rowsSelected;
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
         * @method createConditionalColumns
         * @private
         * @description SYNC
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
         * @method createRows
         * @private
         * @description SYNC
         * @param {Array} obj the object with the rows grouped. It will be an array of rows if there isn't grouping or an object {g:value, aggr_func:value}
         */
        createRows:function(obj){
            // rimetto la scritta poichè non c'è grouping
            var countRow = 0;
            var self = this;
            _.forEach(obj, function (r) {
                // non inserisco le deleted
                if (r.getRow && r.getRow().state !== dataRowState.deleted) {
                    self.addTableRow(r, countRow);
                    countRow++;
                }
            });
        },

        /**
         * @method redrawGrid
         * @private
         * @description SYNC
         * Redraws the grid, based on grouping.
         */
        redrawGrid:function () {
            // per ora funziona con un raggruppamento solo
            var rows = this.gridRows;

            var self = this;
            // rimuovo tutte le righe
            this.mytable.find("tr").each(
                function(i, tr) {
                    $(tr).remove();
                });

            // ho calcolato nuove colonne nell'header e le inserisco
            this.addHeaders();

            // creo struttura di righe raggruppate. passo 1 come livello di raggruppamento, poi nella ricorsione aumenterò
            this.createRows(rows);

            // aggiungo eventi alle righe
            this.addMyEvents();
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

            // inserisco l'header. Se cìè gruppo colonna gruppo + tutte quelle che non sono raggruppate
            var cols = self.orderedCols;

            // calcolo array delle colonne su cui è impostato l'oridnamento iniziale
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

            _.forEach(cols,
                function(c, index) {
                    var thid = appMeta.utils.getUniqueId();
                    var $th = $('<th id="' + thid + '" style="border-bottom:1pt solid black;">');
                    // leggo la colonna al th per il drop e successivo spostamento della colonna
                    $th.data("mdlcolumn", c);

                    var cnamevalue  =  c.caption || c.name;
                    if (c.name === self.mdlwcheckboxColumn) cnamevalue = "";
                    self.addChildElement($tr, $th, cnamevalue);
                    // nel caso della prima colonna checkbox non metto header
                    if (c.name === self.mdlwcheckboxColumn){
                        self.$checkboxAll = $('<input type="checkbox" class="big-checkbox">');
                        self.$checkboxAll.on("change", _.partial(self.selUnsAll, self ));
                        self.$checkboxAll.data("mdlallcheckbozes", true);
                        $th.append(self.$checkboxAll);
                        $th.width("30px");
                    } else { // Se colonna aggiungo listener per ordinamento
                        $th.on("click", _.partial(self.sortColumnClick, self, c));
                    }

                    if (!self.isNotSort) {
                        // se è ordinata per default metto icona bianca
                        if (colSorting[c.name]) {
                           if (c.mdlw_sort === "desc") {
                              $th.text($th.text() + "   ↓");
                           } else {
                              $th.text($th.text() + "   ↑");
                           }
                        }
                     }
                });

            $($thead).appendTo(this.mytable);
        },

        /**
          * @method sortColumnClick
          * @private
          * @description SYNC
          * Execute the sort of the rows on the user-click.
          * @param {CheckBoxListControl} that
          * @param {DataColumn} column
          */
        sortColumnClick: function (that, column) {
            // ordino la collection attuale delle rgihe
            column.mdlw_sort = column.mdlw_sort ? (column.mdlw_sort === 'asc' ? 'desc' : 'asc') : 'asc';
            let def = Deferred('sortColumnClick');
            // nel caso di elenco con paginazione dovrei rilanciare la query sul backend per calcolare la nuova paginazione
            if (that.metaPage.sortPaginationChange) {
                let newSort = column.name + " " + column.mdlw_sort;
                return that.metaPage.sortPaginationChange(newSort)
                    .then(function (sortDone) {
                    if (!sortDone) {
                        that.sortAfterClick(that, column);
                    }
                    return def.resolve();
                });
            }
            else {
               that.sortAfterClick(that, column);
               return def.resolve();
            }
        },

        sortAfterClick: function (that, column) {
            _.forEach(that.gridRows,
                function(r, i){ 
                    let htmlCheckBox = $(r.getRow().table.linkedGrid.el).find('table>tr:eq('+i+')').find("input[type=checkbox]");
                    r.isChecked = $(htmlCheckBox).is(":checked"); //Segno le righe con la check impostata, per poi poterle ripristinare
                }
            );

            that.gridRows = _.orderBy(that.gridRows, function (row) {
                let value = row[column.name];
                if (value) {
                    if (value instanceof Date) return value.getTime();
                    if (!isNaN(value)) return value;
                    return value.toLowerCase ? value.toLowerCase() : value;
                }
                return value;
            }, [column.mdlw_sort]);
   
            // assegno anche al dt nuovo ordinamento temporaneo, se non si tratta di colonna calcolata
            if (!appMeta.metaModel.temporaryColumn(column)) {
                that.dataTable.orderBy(column.name + " " + column.mdlw_sort);
            }
   
            // ridisegno grid con le righe ordinate
            that.redrawGrid();

            _.forEach(that.gridRows,
                function(r, i){ 
                    let htmlCheckBox = $(r.getRow().table.linkedGrid.el).find('table>tr:eq('+i+')').find("input[type=checkbox]");
                    htmlCheckBox.prop('checked', r.isChecked);
                    delete r.isChecked; //Rimuovo proprietà temporanea
                }
            );
        },
         
        /**
         * @method selUnsAll
         * @private
         * @description SYNC
         * @param that
         */
        selUnsAll:function (that) {
            that.selctedall = !that.selctedall;
            // se il booleano è seleziona tutto, deseleziono
            $(that.el).find("input[type=checkbox]:not([data-mdlallcheckbozes])")
                .each(function() {
                    var checked = !!$(this).is(":checked");
                    // solo i discordi vanno modificati, quindi è (not xor)
                    if (!(checked ^ that.selctedall)) return;
                    $(this).prop("checked", that.selctedall);
                });
        },

        /**
         * @method clearControl
         * @private
         * @description ASYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         * @returns {Deferred}
         */
        clearControl: function() {
            // mette tutti i checkbox a false
            $(this.el).find("input[type=checkbox]")
                .each(function() {
                     $(this).prop("checked", false);
                });
        },

        /**
         * @method buildEmptyRect
         * @public
         * @description ASYNC
         * during prescan adds header for the visible columns
         */
        buildEmptyRect:function () {
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
                        var cnamevalue  =  c.caption || c.name;
                        // nel caso della prima colonna checkbox non metto header
                        if (c.name === self.mdlwcheckboxColumn) cnamevalue = "";
                        self.addChildElement( $tr, $th, cnamevalue);
                    });
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
            var def = Deferred("preFill-CheckBox");
            var self = this;

            if (!metaModel.temporaryTable(self.dataTable)) metaModel.cachedTable(self.dataTable, true);

            var res =  this.defDescribedColumn
                .then(function () {
                    self.buildEmptyRect();
                    if(param.tableWantedName && param.tableWantedName !== self.dataSourceName ) return def.resolve();
					return self.loadCheckBoxList().then(function () {
						def.resolve();
					});
                });

            return def.from(res).promise();
        },

        loadCheckBoxList:function () {
            var def = Deferred("loadCheckBoxList-CheckBox");
            var self = this;
            var filter = self.dataTable.staticFilter();
            var tablesToCache = [];

            if (this.runningLoad) {
                return def.resolve();
            }
            this.runningLoad = true;
            var selBuilderArray = [];
            
            appMeta.getData.runSelectIntoTable(self.dataTable, filter, null)
                .then(function () {
                    if (!self.dataTable.rows.length) console.log("CheckBoxListControl:" + self.dataTable.name + " has no rows");
                    // popolamento tabelle legate con foreign-key alla tabella della lista, con campi calcolati
                    var rels = self.DS.tables[self.dataTable.name].parentRelations();

                    _.forEach(rels, function (rel) {
                        var pTable = rel.parentTable;
                        // todo fare check vari nel caso di più colonne
                        var parentCol = rel.parentCols[0];
                        var childCol = rel.childCols[0];
                        var filter = q.isIn(parentCol,
                            _.uniq(_.map(_.filter(self.dataTable.rows, function (row) {
                                return !!row[childCol];
                            }), function (r) {
                                return r[childCol];
                            })));
                        appMeta.metaModel.cachedTable(self.metaPage.state.DS.tables[pTable], false);

                        var tnamereal = self.DS.tables[pTable].tableForReading();
                        var index = _.findIndex(selBuilderArray, function(s){
                            return s.table.name === pTable; //eventualmente quelli con gli alias
                        });
                        if (index !== -1) {
                            selBuilderArray[index].filter = q.or(selBuilderArray[index].filter, filter);
                            return true;
                        }
                        tablesToCache.push(pTable);
                        selBuilderArray.push({filter: filter, top: null, tableName: tnamereal, table: self.metaPage.state.DS.tables[pTable] });
                    });
                    return appMeta.getData.multiRunSelect(selBuilderArray);
                })
                .then(function () {
                    _.forEach(tablesToCache, function (tname) {
                        // forzo cached altrimenti il fmw le rinfresca e vengono persi i dati
                        appMeta.metaModel.cachedTable(self.metaPage.state.DS.tables[tname], true);
                        //aggiungo lo static filter per le pagine secondarie perchè poi MetaPage.StartFrom()
                        //rilancia getData.readCached() che ririempirebbe le tabelle completamente senza alcun filtro
                        var index = _.findIndex(selBuilderArray, function (s) {
                            return s.table.name === tname;
                        });
                        if (index !== -1) {
                            self.metaPage.state.DS.tables[tname].staticFilter(selBuilderArray[index].filter);
                        }
                    });
                    // forzo il ricalcolo dei campi calcolati
                    appMeta.metaModel.getTemporaryValues(self.dataTable);
                    return self.innerFillControl(self.el, null);
                }).then(function () {
                    return self.fillControl(self.el);
                }).then(function () {
                    self.runningLoad = false;
                    return def.resolve();
                });

            return def.promise();
        }

    };


    window.appMeta.CustomControl("checklist", CheckBoxListControl);

}());
