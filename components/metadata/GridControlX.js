/**
 * @module GridControlX
 * @description
 * Manages the graphics and the logic of an html Grid.
 * It is an enhanced version of GridControl (deprecated).
 */
(function () {

   var dataRowState = jsDataSet.dataRowState;
   var Deferred = appMeta.Deferred;
   var Stabilizer = appMeta.Stabilizer;
   var getDataUtils = appMeta.getDataUtils;
   var utils = appMeta.utils;
   var localResource = appMeta.localResource;
   var logger = appMeta.logger;
   var logType = appMeta.logTypeEnum;
   var getData = appMeta.getData;
   var cssDefault = appMeta.cssDefault;
   var dragEnum = {
      HEADER_COLUMN: "HEADER_COLUMN",
      DROPPED_COLUMN: "DROPPED_COLUMN"
   };

   /**
    * @constructor GridControl
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
   function GridControlX(el, helpForm, table, primaryTable, listType) {
      this.helpForm = helpForm;
      this.table = table;
      this.primaryTable = primaryTable;
      this.el = el;
      this.listType = listType;
      return this;
   }

   GridControlX.prototype = {
      constructor: GridControlX,

      init: function () {

         this.DS = this.table.dataset;
         this.dataSourceName = this.table.name;
         this.dataTable = this.table;
         this.dataTable.linkedGrid = this;
         this.tag = $(this.el).data("tag");
         $(this.el).css("overflow-x", "auto");

         // colore per licona della colonna ordinata
         this.colorOrder = "white";

         if (this.helpForm.existsDataAttribute(this.el, "mdleditinplacecolumns")) {
            this.editInPlaceColumns = $(this.el).data("mdleditinplacecolumns").split(";");
         }

         // gestione bottoni editing direttamente su griglia
         this.isInsertBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttoninsert");
         this.isEditBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttonedit");
         this.isDeleteBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttondelete");
         this.isUnlinkBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttonunlink");
         this.isNotSort = this.helpForm.existsDataAttribute(this.el, "mdlnotsort");
         this.excludeGroup = this.helpForm.existsDataAttribute(this.el, "mdlexcludegroup");
         this.isTotnotvisible = this.helpForm.existsDataAttribute(this.el, "mdltotnotvisible");

         this.createConditionalColumns();

         // memorizza dict con i nomi di colonna che sono json oppure nipoti
         // e che hanno quindi una costruzione differente della cella
         this.jsonOrNipoti = {};

         this.isTreeNavigator = this.helpForm.existsDataAttribute(this.el, "treenavigator");

         this.meta = appMeta.getMeta(this.dataTable.tableForReading());
         this.listType = this.listType ? this.listType : this.helpForm.getField(this.tag, 1);

         this.defDescribedColumn = this.meta.describeColumns(this.dataTable, this.listType);

         this.editType = this.helpForm.getField(this.tag, 2);

         this.orderedCols = {};


         /**
          * To set in AfterLink overriden method, of the MetaPage extended
          * @type {boolean}
          */
         this.forceSelectRow = false;

         this.currentRow = null; // DataRow selezionato, null se non c'è riga selezionata

         this.gridParentRel = null;

         this.gridMaster = $(this.el).data("master");
         var gridParentRels = [];

         if (this.primaryTable) {
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
         // forza il disegno delle icone per il groping sull'header, senza drag n drop
         this.forceBtnGroupOnHeader = false;
         this.aggrFunctionArr = ['sum', 'avg', 'max', 'min'];
      },

      /**
       * Creates the dictionary with the info for the conditional columns.
       * user data-attribute is: "col1,v1,d1;col2,v2,d2"; where vi is the value for the column coli to replace with di
       */
      calcInputGrouping: function () {
         var groupedColumnsInput = $(this.el).data("mdlgroupedcolumns");
         var calcAggegateColumnsInput = $(this.el).data("mdlaggregatecolumns");
         var self = this;
         // popolo array delle colonne da raggruppare
         if (groupedColumnsInput) {
            this.groupedColumnsInput = groupedColumnsInput.split(";");
            // metto nell'array delle colonne da raggruppare
            _.forEach(this.orderedCols, function (c) {
               if (_.includes(self.groupedColumnsInput, c.name)) {
                  self.dropColumnEv(self, c);
               }
            });
         }

         // popolo oggetto con le funz di aggreg da calcolare date in input
         if (calcAggegateColumnsInput) {
            this.calcAggegateColumnsInput = calcAggegateColumnsInput.split(";");
            // metto nell'array delle colonne da raggruppare
            if (!this.confAgg) this.confAgg = {};

            _.forEach(this.orderedCols, function (c) {
               if (_.includes(self.calcAggegateColumnsInput, c.name)) {
                  self.confAgg[utils.getUnivoqueId() + c.name + "sum"] = { fname: "sum", value: true, column: c };
               }
            });
         }
      },

      /**
       * @method getCurrentRow
       * @public
       * @description SYNC
       * Returns a js object with the info on current selected row
       * @returns {{changed: (DataTable|*), rowChanged: (null|*|ObjectRow)}}
       */
      getCurrentRow: function () {
         return { table: this.dataTable, row: this.currentRow };
      },

      /**
       * @method addMyEvents
       * @private
       * @description SYNC
       * Adds the "click" and "dblclick" events to the rows of the grid
       */
      addMyEvents: function () {

         var self = this;

         // questo selettore evita di agganciare glie venti sull'header
         this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr)").on("click", _.partial(this.rowClickEv, this));
         this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr)").on("dblclick", _.partial(this.rowDblClickEv, this));
         if (this.editInPlaceColumns) {
            this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr) > td:not(.mdlw_tdclickable)").on("click", _.partial(this.cellEdit, this));
         }

         // aggiugno eventi per bottoni recursiveCollapse e recursiveExpand in caso di grouping

         this.mytable.find(".fa-plus-square")
            .each(function () {
               $(this).parent().on("click", _.partial(self.recursiveExpand, self, $(this).closest("tr").attr("id")));
            });

         this.mytable.find(".fa-minus-square")
            .each(function () {
               $(this).parent().on("click", _.partial(self.recursiveCollapse, self, $(this).closest("tr").attr("id")));
            });

         // aggiungo bottoni bottoni di editing di riga

         this.mytable.find("[data-mdleditbtn]").on("click", _.partial(self.editClick, self));

         this.mytable.find("[data-mdldeletebtn]").on("click", _.partial(self.deleteClick, self));

         this.mytable.find("[data-mdlunlinkbtn]").on("click", _.partial(self.unlinkClick, self));

         this.mytable.on("drop", _.partial(self.dropDroppedColumn, self));
         this.mytable.on("dragover", _.partial(self.allowDropDroppedColumn, self));

      },

      /**
       * @method removeEvents
       * @private
       * @description SYNC
       * Removes all the events from grid rows
       */
      removeEvents: function () {
         // questo selettore evita di agganciare glie venti sull'header
         this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped])").off("click", _.partial(this.rowClickEv, this));
         this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped])").off("dblclick", _.partial(this.rowDblClickEv, this));
         if (this.editInPlaceColumns) {
            this.mytable.find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr) > td:not(.mdlw_tdclickable)").off("click", _.partial(this.cellEdit, this));
         }

         var self = this;

         // rimuove eventi per bottoni recursiveCollapse e recursiveExpand in caso di grouping

         this.mytable.find(".fa-plus-square")
            .each(function () {
               $(this).parent().off("click", _.partial(self.recursiveExpand, self, $(this).closest("tr").attr("id")));
            });

         this.mytable.find(".fa-minus-square")
            .each(function () {
               $(this).parent().off("click", _.partial(self.recursiveCollapse, self, $(this).closest("tr").attr("id")));
            });

         // rimuove eventi bottoni di editing di riga

         this.mytable.find("[data-mdleditbtn]").off("click", _.partial(self.editClick, self));

         this.mytable.find("[data-mdldeletebtn]").off("click", _.partial(self.deleteClick, self));

         this.mytable.find("[data-mdlunlinkbtn]").off("click", _.partial(self.unlinkClick, self));

      },

      /**
       * @method addEvents
       * @public
       * @description SYNC
       * If "subscribe" subscribes the  ROW_SELECT event and invokes the callback "selectRowCallBack()"
       * @param {Html node} el
       * @param {MetaPage} metaPage
       * @param {boolean} subscribe
       */
      addEvents: function (el, metaPage, subscribe) {
         subscribe = (subscribe === undefined) ? true : subscribe;
         this.metaPage = metaPage;
         // this.addMyEvents(); aggiunti solo sulla addRow
         if (metaPage && subscribe) {
            metaPage.eventManager.subscribe(appMeta.EventEnum.ROW_SELECT, this.selectRowCallBack, this);
         }
      },

      /**
       * @method selectRowCallBack
       * @private
       * @description ASYNC
       * It is the callback triggered after a ROW_SELCT event on metapage. If the parameter table is the gridmaster it fill the grid, and select the row "row"
       * @param {html node|object} sender
       * @param {DataTable} table
       * @param {ObjectRow} row
       * @returns {Deferred}
       */
      selectRowCallBack: function (sender, table, row) {
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
      selectRow: function (row, propagateEvent) {
         return Deferred("selectRow").from(this.setRow(row, propagateEvent));
      },

      /**
       * @method fillControl
       * @public
       * @description ASYNC
       * Fills the grid
       * @param {html node} el
       * @returns {Deferred}
       */
      fillControl: function (el) {
         if (this.isTreeNavigator) return this.fillControlTreeNavigator();
         return this.fillControlNotTreeNavigator(el);
      },

      /**
       * @method fillControlNotTreeNavigator
       * @public
       * @description ASYNC
       * Fills the grid in the case it is not a tree navigator
       * @param {html node} el
       * @returns {*|Deferred}
       */
      fillControlNotTreeNavigator: function (el) {
         el = el || this.el;
         var helpForm = this.helpForm;
         var filter = null;
         var currParent = null;
         if (this.primaryTable) {
            currParent = helpForm.lastSelected(this.primaryTable);

            if (this.gridMaster) currParent = helpForm.lastSelected(this.DS.tables[this.gridMaster]);

            // N.B: questo oggetto è un jsDataQuery.
            // Deve essere configurato sul metodo AfterLink o meglio beforefill della metaPage estesa tramite il seguente codice:
            // Esempio: $("#ID_ELEMENTO_GRIGLIA").data("customParentRelation", myJsDataQuery);
            var customParentRel = $(el).data("customParentRelation");
            if (customParentRel) {
               filter = customParentRel;
            }
            if (!filter && currParent && this.gridParentRel) {
               filter = this.gridParentRel.getChildFilter(currParent);
            }
         }
         // in this.currentRow la riga corrente, nel caso di ListManager  this.gridParentRel=null
         if (currParent || !this.gridParentRel) return this.innerFillControl(el, filter);
         return this.clearControl();
      },

      /**
       * @method clearHtmlGrid
       * @private
       * @description SYNC
       * Removes all rows form html grid. Remains only the header
       */
      clearHtmlGrid: function () {
         if (!this.mytable) return;
         this.mytable.find("tr:not(:has(th))").remove();
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
      innerFillControl: function (el, filter, propagate) {

         var def = Deferred("innerFillControl");

         if (!this.dataTable) return def.resolve();
         var self = this;

         // rimane aperto dal costruttore e qui mi aspetto venga fatta la then, quando appunto torna il metodo
         var res = this.defDescribedColumn
            .then(function () {

               self.orderedCols = self.getOrderedColumns(self.dataTable);


               // se è la prima volta allora leggo il layout
               if (!self.gridLoadedFirstTime) {
                  self.gridLoadedFirstTime = true;
               }

               if (self.emptyElement) self.emptyElement.remove(); // rimuovo l'elemnto vuoto, cioè l'header

               self.gridRows = self.getSortedRows(self.dataTable, filter);

               self.manageColumnsEvents(el);

               // solo la prima volta aggiunge la colonna di gruppo configurata dall'esterno
               if (!self.initialGroupInput) {
                  self.initialGroupInput = true;
                  self.calcInputGrouping();
               }

               // ridisegno grid con le righe raggruppate
               self.redrawGridForGrouping(self);

               self.assignColumnsStyle();

               // azioni dopo la selezione dell'indice giusto sulla griglia
               return self.setRow(self.currentRow, propagate);

            });

         return def.from(res).promise();

      },

      assignColumnsStyle:function() {
         var self= this;
         var applyClass = function(tdOrTh) {
            _.forEach($(tdOrTh, self.mytable), function (curr) {
               var mdlcolumnname = $(curr).data("mdlcolumnname");
               if (!mdlcolumnname || self.jsonOrNipoti[mdlcolumnname]) {
                  // $(curr).addClass("mdl-cell-size-default");
               } else {
                  $(curr).addClass("mdl-cell-size-calc");
               }
            });
         };

         applyClass('th');
         applyClass('td');

      },

      /**
       * @method manageColumnsEvents
       * @private
       * @description SYNC
       * Manages the events for grouping and move columns
       */
      manageColumnsEvents: function (el) {
         // inserisco zona per fare drop della colonna e fare quindi il grouping
         if (!this.$groupingArea) {
            this.$groupingArea = $('<div id="groupingArea_id">');

            // inserisco zona dove poter droppare le colonne per effettuare il grouping
            // se è permesso dalla configurazione, infatti valuto "excludeGroup"
            if (!this.excludeGroup) $(el).prepend(this.$groupingArea);
            this.$groupingArea.on("drop", _.partial(this.dropHeaderColumn, this));
            this.$groupingArea.on("dragover", _.partial(this.allowDropColumnHeader, this));

            // aggiungo zona tratteggiata con scritta, e bottone epr configurare le funzioni di agregazione
            this.addConfigAggColumnBtn();
            this.addDragHereLbl();
         }
      },

      /**
       * @method getOrderedColumns
       * @private
       * @description SYNC
       * Sorts the columns depending on listColPos column property. It doesn't consider columns that haven't caption, that start with a dot, and that have listColPos equal to -1
       * @param {DataTable} dataTable
       * @return  {DataColumn[]}
       */
      getOrderedColumns: function (dataTable) {
         if (!dataTable) return [];

         var cols = _.sortBy(
            _.filter(dataTable.columns,
               function (c) {
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
       * @param {DataQuery} filter
       * @returns {ObjectRow[]}
       */
      getSortedRows: function (t, filter) {
         // se ho cambiato sort tramite click su header  lo memorizzo sulla prop orderBy, quindi qui la rileggo
         var sorting = t.orderBy() || this.getSorting(t);
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
         var sorting = this.meta.getSorting(this.listType);
         return (sorting ? sorting : dt.orderBy());
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
         this.changeCssRowSelected(row);
         if (propagate === undefined) propagate = true;

         this.oldCurrentRow = this.currentRow;
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
       * @method resetSelectedRow
       * @private
       * @description ASYNC
       * Called externally if a row select must be reverted cause rows can be selected or user decision to cancel operation.
       */
      resetSelectedRow: function () {
         this.currentRow = this.oldCurrentRow;
         this.changeCssRowSelected(this.currentRow);
      },

      /**
       * @method changeCssRowSelected
       * @private
       * @description SYNC
       * Applies the selectedRow style to the row with index "index" and cuts off selectedRow to the old selected row
       * @method changeCssRowSelected
       * @param {ObjectRow} currentRow
       */
      changeCssRowSelected: function (currentRow) {
         //trovo tr linkato a questa riga
         // imposto lo stile
         var self = this;
         $("tr", this.mytable).css('background-color', '');
         _.forEach($("tr", this.mytable), function (currTr) {
            if (getDataUtils.isSameRow(self.dataTable, $(currTr).data("mdldatarowlinked"), currentRow)) {
               $(currTr).css('background-color', appMeta.config.selectedRowColor);
               return false;
            }
         });
      },

      /**
       * @method getColsToInsert
       * @private
       * @description SYNC
       * Gets the columns to put in the header of the table. If there are columns grouped it doesn't insert in the header, but
       * put a generic column "group"
       */
      getColsToInsert: function () {
         var cols = [];
         var self = this;
         if (this.columnsGrouped && this.columnsGrouped.length > 0) {
            // in prima posizione quella gruppo
            cols[0] = new jsDataSet.DataColumn("Group&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", "String");
            cols[0].isFirsGrouping = true;
            _.forEach(this.orderedCols, function (c) {
               if (!_.some(self.columnsGrouped, { name: c.name })) cols.push(c)
            });
            return cols;
         } else {
            return this.orderedCols;
         }
      },

      /**
       * @method addTableRow
       * @private
       * @description SYNC
       * Adds the html cells to html row and the row to the html table. Cell values are read from dataRow
       * @param {ObjectRow} dataRow
       * @param {number} gridRowCount index of the row in the grid
       * @param {number} idHidden boolean. called by grouping it wil be true, because the row are collapsed
       * @param {string} tridParent the id of parent row in grouped mode
       */
      addTableRow: function (dataRow, idHidden, tridParent) {
         if (!dataRow) return;

         // se c'è raggruppamento passo id della riga parent
         var dataParent = "";
         if (tridParent) { dataParent = "data-parenttr=" + tridParent; }
         var $tr = $('<tr ' + dataParent + ' >');

         // quando faccio il grouping partono nascoste
         if (idHidden && !this.groupedColumnsInput) $tr.hide();

         this.addEditingCells($tr);
         this.addValuesCells($tr, dataRow);

         // link del tr grafico alla row
         $tr.data("mdldatarowlinked", dataRow);

         // se è riga corrente metto colore di selezione
         if (this.currentRow === dataRow) $tr.css('background-color', appMeta.config.selectedRowColor);

         return $tr;
      },

      /**
       * @method addTableRow
       * @private
       * @description SYNC
       * Adds the html cells to html row and the row to the html table. Cell values are read from dataRow
       */
      addTableEmptyRow: function () {
         var numColumnToAdd = 4; // Possiamo dare un numero maggiore di colspan (che non hanno effetto) piuttosto che minore
         var colsnum = this.orderedCols.length + numColumnToAdd;
         var $tr = $('<tr><td align="center" class="norow" colspan=' + colsnum + '>' + localResource.gridEmpty + '</td></tr>');
         this.mytable.append($tr);
      },

      /**
       * @method addValuesCells
       * @private
       * @description SYNC
       * Adds the value inside the cell for a specific <tr> element
       * @param {html node} $tr
       * @param {ObjectRow} dataRow
       */
      addValuesCells: function ($tr, dataRow) {
         var self = this;
         _.forEach(this.getColsToInsert(), function (c) {
            self.addStandardCell($tr, dataRow, c);
         });
      },


      addToJsonOrNipoti:function(cname) {
         cname = cname.replace("!", "");
         this.jsonOrNipoti[cname] = cname;
      },

      /**
       * @method addStandardCell
       * @private
       * @description SYNC
       * Add standard cell value
       * @param $tr
       * @param {ObjectRow} objRow
       * @param {DataColumn} column
       */
      addStandardCell: function ($tr, objRow, column) {
         var value = this.getFormattedValue(objRow, column);
         var columnStyle = cssDefault.getColumnsAlignmentCssClass(column.ctype);
         // a seconda se è un json o stringa semplice formatto la cella
         var jsonObj = this.getJson(value);
         var $td = $('<td style="user-select: none" nowrap data-mdlcolumnname="' + column.name.replace("!", "") + '" >');
         if (!!jsonObj) {

           this.addToJsonOrNipoti(column.name);

            var $tableCell = $('<table class="table table-in-cell">');
            _.forEach(Object.keys(jsonObj), function (k) {
               var $tr1 = $('<tr class="table-in-cell-tr">');
               if (typeof jsonObj[k] === 'object') {
                  for (var key in jsonObj[k]) {
                     var $td3 = $('<td class="mdl-cell-size-calc">');
                     $td3.html(key + ": " + jsonObj[k][key]);
                     $tr1.append($td3);
                  }
               } else {
                  var $td3 = $('<td class="mdl-cell-size-calc">');
                  $td3.html(k + ": " + jsonObj[k]);
                  $tr1.append($td3);
               };

               $tableCell.append($tr1);
            });
            $($td).append($tableCell);
            $($tr).append($td);
         } else {
            // applico lo stile
            $td.addClass(columnStyle);
            this.addChildElement($tr, $td, value);
         }
         if (column.tohide) $td.hide();
      },

      /**
       * @method addEditingCells
       * @private
       * @description SYNC
       * Adds the button edit or delete inside the cell for a specific <tr> element
       * @param {html node} $tr
       */
      addEditingCells: function ($tr) {
         var self = this;
         // aggiungo cella per bottoni di editing se serve
         var $tdBtnEditing = $('<td class="mdlw_tdclickable">');
         if (this.isInsertBtnVisible || this.isEditBtnVisible) {
            self.addChildElement($tr, $tdBtnEditing, '');
         }
         if (this.isEditBtnVisible) {
            var $btnedit = $('<div data-mdleditbtn style="text-align:center;"></div>');
            var $iconEdit = $('<i class="fa fa-edit"></i>');
            self.addChildElement($tdBtnEditing, $btnedit, '');
            self.addChildElement($btnedit, $iconEdit, '');
         }

         var addedTdDeleted = false;
         var $tdBtnDeleting = $('<td class="mdlw_tdclickable">');
         if ((this.isDeleteBtnVisible && this.isEditBtnVisible) ||
            (this.isDeleteBtnVisible && (!this.isEditBtnVisible && !this.isInsertBtnVisible))) {
            self.addChildElement($tr, $tdBtnDeleting, '');
            addedTdDeleted = true;
         }

         // se non sono visibili i bottoni di editing significa che non ho aggiunto header e quindi serve cella vuota per bottone di export
         // sul grid prer non avere il bottone appeso a destra
         if (!this.isEditBtnVisible && !this.isDeleteBtnVisible && !this.isUnlinkBtnVisible) {
            var $tdBtnEditing = $('<td class="mdlw_tdclickable">');
            self.addChildElement($tr, $tdBtnEditing, '');
         }

         if (this.isDeleteBtnVisible) {
            var $btndelete = $('<div data-mdldeletebtn style="text-align:center;"></div>');
            var $iconDelete = $('<i class="fa fa-trash"></i>');
            if (addedTdDeleted) self.addChildElement($tdBtnDeleting, $btndelete, '');
            if (!addedTdDeleted) self.addChildElement($tdBtnEditing, $btndelete, '');
            self.addChildElement($btndelete, $iconDelete, '');
         }

         var addedTdUnlink = false;
         var $tdBtnUnlink = $('<td class="mdlw_tdclickable">');
         if ((this.isUnlinkBtnVisible && this.isEditBtnVisible) ||
            (this.isUnlinkBtnVisible && this.isDeleteBtnVisible) ||
            (this.isUnlinkBtnVisible && (!this.isEditBtnVisible && !this.isDeleteBtnVisible && !this.isInsertBtnVisible))) {
            self.addChildElement($tr, $tdBtnUnlink, '');
            addedTdUnlink = true;
         }

         if (this.isUnlinkBtnVisible) {
            var $btnunlink = $('<div data-mdlunlinkbtn style="text-align:center;"></div>');
            var $iconUnlink = $('<i class="fa fa-unlink"></i>');
            if (addedTdUnlink) self.addChildElement($tdBtnUnlink, $btnunlink, '');
            if (!addedTdUnlink) self.addChildElement($tdBtnEditing, $btnunlink, '');
            self.addChildElement($btnunlink, $iconUnlink, '');
         }
      },

      /**
       * @method editClick
       * @private
       * @description SYNC
       * Manages the click on add button. it calls the specific method of metapage
       * @param {GridControlX} that
       */
      insertClick: function (that) {
         return that.metaPage.insertClick(that.metaPage, that);
      },

      /**
       * @method editClick
       * @private
       * @description SYNC
       * Manages the click on edit button. it calls the specific method of metapage
       * @param {GridControlX} that
       */
      editClick: function (that) {
         var tr = $(this).closest("tr");
         // prima di invocare il metodo sulla metaPage richiamo il click, così eseguo lo stesso codice di quando il bottone era fuori il gird
         // stando attento a passare i giusti parametri. quindi l'ogg di inovazione eè il tr stesso e 1o prm GridControl

          //in oltre controllo se il bottone è disabilitato e poi 
          //disabilito il bottone qualora venisse premuto in modo compulsivo
          if ($(this).prop("disabled")) return;
          $(this).prop("disabled", true);

          var self = this;
          that.rowClick.call(tr, that)
              .then(function () {
                  return that.metaPage.editClick(that.metaPage, that);
              }).then(function () {
                  //riabilito il bottone alla fine della operazione
                  $(self).prop("disabled", false);
                  return true
              });
      },

      /**
       * @method deleteClick
       * @private
       * @description SYNC
       * Manages the click on delete button. it calls the specific method of metapage
       * @param {GridControlX} that
       */
      deleteClick: function (that) {
         var tr = $(this).closest("tr");
         // prima di invocare il metodo sulla metaPage richiamo il click, così eseguo lo stesso codice di quando il bottone era fuori il gird
         // stando attento a passare i giusti parametri. quindi l'ogg di inovazione eè il tr stesso e 1o prm GridControl

          //in oltre controllo se il bottone è disabilitato e poi 
          //disabilito il bottone qualora venisse premuto in modo compulsivo
          if ($(this).prop("disabled")) return;
          $(this).prop("disabled", true);

          var self = this;
          that.rowClick.call(tr, that)
            .then(function () {
                return that.metaPage.deleteClick(that.metaPage, that);
            }).then(function () {
                //riabilito il bottone alla fine della operazione
                $(self).prop("disabled", false);
                return true
            });
      },

      /**
       * @method unlinkClick
       * @private
       * @description SYNC
       * Manages the click on unlink button. it calls the specific method of metapage
       * @param {GridControlX} that
       */
      unlinkClick: function (that) {
         var tr = $(this).closest("tr");
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
      addChildElement: function (parent, child, value) {
         value = value || "";
         var display_txt = value.replace(/\n/g, "<br />");
         $(child).html(display_txt).appendTo(parent);
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
      getFormattedValue: function (r, c) {
         var field = c.name;
         var fmt = this.helpForm.getFormatForColumn(c);
         var tag = "x.y." + fmt;
         var pObj = new appMeta.TypedObject(c.ctype, r[field]);
         var self = this;
         // vedo se si tratta di stringhe condizionali
         if (this.conditionallookupArray[c.name.toLowerCase()]) {
            if (r[field] === null || r[field] === undefined) return "";
            var lookups = _.filter(self.conditionallookupArray[c.name], function (el) {
               return el.valuemember.toString().toLowerCase() == r[field].toString().toLowerCase();
            });
            if (lookups.length) return lookups[0].displaymember;
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
      createConditionalColumns: function () {
         // utilizzato per permettere al programmatore di mettere valori condizionali in fase di config: "col1,v1,d1;col2,v2,d2"
         this.conditionallookup = $(this.el).data("mdlconditionallookup");
         this.conditionallookupArray = {};

         if (this.conditionallookup) {
            var self = this;
            var columnObjs = this.conditionallookup.split(";");
            _.forEach(columnObjs, function (co) {
               var els = co.split(",");
               if (els.length !== 3) logger.log(logType.WARNING, "wrong conditional formatting on grid: " + self.dataTable.name);
               var cname = els[0].toLowerCase();
               if (!self.conditionallookupArray[cname]) self.conditionallookupArray[els[0]] = [];
               self.conditionallookupArray[cname].push({ valuemember: els[1], displaymember: els[2] });
            })
         }
      },


      /**
       * @method dragHeaderColumn
       * @private
       * @description SYNC
       * Saves some info on drag column that is grouping
       * Puts the column in the grouping area if drop succeed
       * @param {GridControlX} that
       * @param {DataColumn} c
       * @param {jQueryEvent} ev
       */
      dragHeaderColumn: function (that, c, ev) {
         // salvo le info dell'oggetto che sto draggando
         ev.originalEvent.dataTransfer.setData("column", JSON.stringify(c));
         ev.originalEvent.dataTransfer.setData("idobj", ev.target.id);
         // è un drag che parte dalla colonna sull'header della tabella html
         ev.originalEvent.dataTransfer.setData("type", dragEnum.HEADER_COLUMN);
      },

      /**
       * @method dragColumnDropped
       * @private
       * @description SYNC
       * Saves some info on drag column that was on grouping area
       * Puts in the grid the column that was dropped if drop succeed.
       * @param {GridControlX} that
       * @param {DataColumn} c
       * @param {jQueryEvent} ev
       */
      dragColumnDropped: function (that, c, ev) {
         // salvo le info dell'oggetto che sto draggando. per passare tutto oggetto colonna lo ttrasformo in una stringa che po tecupererà tramite la aprse
         ev.originalEvent.dataTransfer.setData("column", JSON.stringify(c));
         ev.originalEvent.dataTransfer.setData("idobj", ev.target.id);
         // è un drag che parte dalla colonna sulla zona delle colonne raggruppate
         ev.originalEvent.dataTransfer.setData("type", dragEnum.DROPPED_COLUMN);
      },

      /**
       * @method allowDropDroppedColumn
       * @private
       * @description SYNC
       * It changes the drop effect on elements based on the attribute "type" of the target element
       * To allow a drop, we must prevent the default handling of the element.
       * @param {GridControlX} that
       * @param {jQueryEvent} ev
       */
      allowDropColumnHeader: function (that, ev) {
         ev.preventDefault();
         var isEmpty = that.isGridEmpty();
         if (ev.dataTransfer) {
            if (ev.target.getAttribute("type") === dragEnum.HEADER_COLUMN && !isEmpty)
               ev.dataTransfer.dropEffect = "all"; // drop it like it's hot
            else
               ev.dataTransfer.dropEffect = "none"; // dropping is not allowed
         }
      },

      /**
       * @method allowDropDroppedColumn
       * @private
       * @description SYNC
       * It changes the drop effect on elements based on the attribute "type" of the target element.
       * To allow a drop, we must prevent the default handling of the element.
       * @param {GridControlX} that
       * @param {jQueryEvent} ev
       */
      allowDropDroppedColumn: function (that, ev) {
         ev.preventDefault();
         var isEmpty = that.isGridEmpty();
         if (ev.dataTransfer) {
            if ((ev.target.getAttribute("type") === dragEnum.DROPPED_COLUMN) || (ev.target.getAttribute("type") === dragEnum.HEADER_COLUMN) && !isEmpty)
               ev.dataTransfer.dropEffect = "all"; // drop it like it's hot
            else
               ev.dataTransfer.dropEffect = "none"; // dropping is not allowed
         }
      },

      /**
       *
       * @returns {boolean}
       */
      isGridEmpty: function () {
         if (!this.dataTable) return true;
         if (!this.dataTable.rows.length) return true;
         return false
      },

      /**
       * @method dropHeaderColumn
       * @private
       * @description SYNC
       * Manages the drop of the column on the grouping area
       * @param {GridControlX} that
       * @param {jQueryEvent} ev
       */
      dropHeaderColumn: function (that, ev) {
         ev.preventDefault();
         // inizializzo oggetto per le colonne raggruppate
         if (!that.columnsGrouped) that.columnsGrouped = [];
         var type = ev.originalEvent.dataTransfer.getData("type");
         if (type === dragEnum.HEADER_COLUMN) {
            // dal drag recupero info
            var column = JSON.parse(ev.originalEvent.dataTransfer.getData("column"));
            // nuova colonna da raggruppare
            that.columnsGrouped.push(column);
            // mostro indicatore attesa
            that.showWaitingGrouping();
            // vado in asincrono così il thread corrente stoppa, mostra l'indicatore e poi alla then lo nasconde
            utils.callOptAsync(_.partial(that.redrawGridForGrouping, that, false)).then(function () {
               that.putDroppingRectColumn(column);
               that.hideWaitingGrouping();
            });
         }
      },

      /**
       * @method showWaitingGrouping
       * @private
       * @description SYNC
       * Hides the grid and Shows a spinner.
       */
      showWaitingGrouping: function () {
         if (!this.waitingGrouping) {
            // creo eleemnto div con lo spinner di attesa
            this.waitingGrouping = $('<div>');
            $(this.el).append(this.waitingGrouping.append($('<span class="fa fa-cog fa-spin fa-3x w-100">')));
         }
         this.waitingGrouping.show();
         this.mytable.hide();
      },

      /**
       * @method hideWaitingGrouping
       * @private
       * @description SYNC
       * Hides the spinner, and shows the grid
       */
      hideWaitingGrouping: function () {
         this.mytable.show();
         this.waitingGrouping.hide();
      },

      /**
       * @method putDroppingRectColumn
       * @private
       * @description SYNC
       * Adds on grouping area the rect for the specific column dropped
       * @param {DataColumn} column
       */
      putDroppingRectColumn: function (column) {
         var $div = $('<span draggable="true" id="' + utils.getUnivoqueId() + '" class="gx-column-drop-cell">');
         $div.on("dragstart", _.partial(this.dragColumnDropped, this, column));
         var $span = $('<span id="' + utils.getUnivoqueId() + '" style="cursor: pointer; padding-left: 5px">');
         $div.text(column.caption);
         this.$groupingArea.append($div);
         $div.append($span);
         // inserisco iconcina per togliere drop
         $span.on("click", _.partial(this.undropColumn, this, column));
         var $confIcon = $('<i class="fas fa-window-close" style="color:grey">');
         $span.append($confIcon);
      },

      /**
       * @method undropColumn
       * @private
       * @description SYNC
       * Removes the "column" from dropped area and recalculates the grouping without this column
       * @param {GridControlX} that
       * @param {DataColumn} column
       */
      undropColumn: function (that, column) {
         // colonna da raggruppare, la tolgo dall'array
         _.remove(that.columnsGrouped, function (currCol) {
            return currCol.name === column.name;
         });

         // svuoto area di grouping
         that.$groupingArea.find(".gx-column-drop-cell").remove();

         // rimetto header droppati
         _.forEach(that.columnsGrouped, function (c) {
            that.putDroppingRectColumn(c);
         });

         // mostro indicatore attesa
         that.showWaitingGrouping();
         // vado in asincrono così il thread mostra l'indicatore e poi alla then lo nasconde
         utils.callOptAsync(_.partial(that.redrawGridForGrouping, that, false)).then(function () {
            that.hideWaitingGrouping();
         });
      },

      /**
       * @method dropDroppedColumn
       * @private
       * @description SYNC
       * Manages the drop of the column already dropped on grouping area, in the grid for ungroup
       * @param {GridControlX} that
       * @param {jQueryEvent} ev
       */
      dropDroppedColumn: function (that, ev) {
         var type = ev.originalEvent.dataTransfer.getData("type");
         if (type === dragEnum.DROPPED_COLUMN) {
            // del drag recupero info
            var column = JSON.parse(ev.originalEvent.dataTransfer.getData("column"));
            var idobj = ev.originalEvent.dataTransfer.getData("idobj");
            that.undropColumn(that, column);
         }

         // swap delle colonne, cambia ordine
         else if (type === dragEnum.HEADER_COLUMN) {
            // del drag recupero info
            var column = JSON.parse(ev.originalEvent.dataTransfer.getData("column"));
            // recupero la colonna su cui ho droppato dall prop "mdlcolumn"
            if ($(ev.target).data("mdlcolumn")) {
               var currcolumn = $(ev.target).data("mdlcolumn");
               that.calculatesNewColumnsOrder(currcolumn, column);
               // N.B Per performance Non ridisegno la grid, ma dentro la calculatesNewColumnsOrder() effettuo lo swap delel celle
               // quindi non faccio prox istruzione, che nel caso ci sono molte righe è pesante
               // that.redrawGridForGrouping();
            }
         }
      },

      /**
       * @method calculatesNewColumnsOrder
       * @private
       * @description SYNC
       * Recalculates the listColPos of the columns based on the column moved and where it is dropped
       * @param {DataColumn} cToReplace
       * @param {DataColumn} cMoved
       */
      calculatesNewColumnsOrder: function (cToReplace, cMoved) {
         var index = 0;
         var self = this;
         // after: se vengo da un indice minore, metto la colonna dopo(after) la colonna su cui "droppo"
         // se invece vengo da un indice maggiore , metto la colonna prima(before) la colonna su cui "droppo"
         var after = false;
         // per robustezza allineo i nuovi indici delle colonne, oltre a spsotare gli oggetti html, attraverso swapCols()
         _.forEach(this.orderedCols, function (currc) {
            if (currc.name === cToReplace.name) {
               // trova nella collection la cMoved cioè quella spostata
               var colNew = _.find(self.orderedCols, function (c) {
                  return c.name === cMoved.name
               });
               // inverto gli indici
               if (colNew.listColPos < currc.listColPos) {
                  currc.listColPos = index;
                  index++;
                  colNew.listColPos = index;
                  after = true;
               } else {
                  colNew.listColPos = index;
                  index++;
                  currc.listColPos = index;
               }
               index++;
            } else if (currc.name !== cMoved.name) {
               currc.listColPos = index;
               index++;
            }
         });

         // sposto fisicamente le celle
         self.swapCols(cToReplace, cMoved, after);

         // ricalcola ordine alla luce dei nuovi indici assegnati
         this.orderedCols = this.getOrderedColumns(this.dataTable);
      },

      /**
       * @method swapCols
       * @private
       * @description SYNC
       * Swaps two html columns , based on linked DataColumns cToReplace and cMoved
       * @param {DataColumn} cToReplace
       * @param {DataColumn} cMoved
       * @param {boolean} after. if true use
       */
      swapCols: function (cToReplace, cMoved, after) {

         /**
          * inverte gli elementi HTML "a" e "b"
          * @param {HTML element} a
          * @param {HTML element} b
          */
         var swapCell = function (a, b) {
            if (after) $(b).after($(a));
            if (!after) $(b).before($(a));
         };

         /**
          * @param {HTML element} $row the jquery "tr"
          * @param {string} eltype can be "td" or "th"
          */
         var findAndSwapCell = function ($row, eltype) {
            var $elments = $row.find(eltype);
            $elments.each(function () {
               var columnname = $(this).data("mdlcolumnname");
               // osserva se è il td mosso
               if (cMoved.name.replace("!", "") === columnname) {
                  // trova il td da rimpiazzare su questa riga. cicla su tutti i td e confronta il nome della colonna
                  var $elReplace = _.filter($row.find(eltype), function (currEl) {
                     return $(currEl).data("mdlcolumnname") === cToReplace.name.replace("!", "");
                  });
                  // eseguo lo swap delle 2 celle
                  swapCell($(this).get(0), $elReplace[0]);
               }
            });
         };

         // per ogni riga eseguo swap delle celle
         this.mytable.find("tr")
            .each(function () {
               var $currRow = $(this);
               // esegue swap dei td e dei th
               findAndSwapCell($currRow, "td");
               findAndSwapCell($currRow, "th");
            })
      },

      /**
       * @method calcObjGrouped
       * @private
       * @description SYNC
       * Calculates an object that groups the rows, based on keys array.
       * First group is on first key and so on.
       * keys are the columns that user drag on top area of the grid
       * gr1
       *  sub1
       *    row1
       *    row2
       *  sub2
       *    row3
       *    row4
       * gr2 ...
       * Returns an array if there aren't columns to group, otherwise it return an object with key g and aggregate function. In g there is the group
       * that can be an array or another object {g:<object>,f:<object>} where f {value: <number>, column:<string>}
       * @param {ObjectRow[]} rows. the array of the rows to group belonging the DataColumn array
       * @param {DataColumn[]} columns. the array of DataColumn grouped by user.
       * @returns {Array!Object}
       */
      calcObjGrouped: function (rows, columns) {
         var self = this;
         // se non ho colonne torno direttamente le righe
         if (!columns || !columns.length) return rows;
         // prendo nome della colonna
         return _.mapValues(
            _.groupBy(rows, columns[0].name),
            // nella funct della mapValue per ogni gruppo vado a ricalcolare il sottogruppo ,prenderò la prima colonna del nuovo array in cui ho tolto la colonna
            // già considerata
            // inserire nell'obj di ritorno una chaive per funzione calcolata che a sua volta è un obj con 2 chiavi, una con la colonna su cui
            // è fatta la funz di aggegazione, l'altra il valore scalare {value: <number>, column:<string>}
            // Esempio  sum:{value:_.sumBy (values,  "idreg"), column:"idreg"}
            function (values) {
               var res = { group: self.calcObjGrouped(values, columns.slice(1)) };
               self.applyAggregateFunctions(res, values);
               // vado in ricorsione, togliendo la colonna su cui ho già raggruppato
               return res;
            });
      },

      /**
       * @method applyAggregateFunctions
       * @private
       * @description SYNC
       * Creates on "obj" new js object with key the functions to calc on values. {value: <number>, column:<string>}
       * It does side effect on "obj"
       * @param {Object} obj. is the js object with the key "group". The method link the aggr functions as other keys on "obj"
       * @param {ObjectRow[]} values
       */
      applyAggregateFunctions: function (obj, values) {
         // confAgg è calcolato sulla rpessione del bottone conferma nella form di scelta delle opzioni nella funz confirmConfAggr()
         _.forOwn(this.confAgg, function (objAggrValue, key) {
            if (!objAggrValue.value) return true;   // se è stato selezionato dall'utente nel configuratore allora inserisco nell'oggetto finale, che sarà visualizzato
            var aggrobj;
            switch (objAggrValue.fname) {
               case 'sum':
                  // i valori nulli li considero zero nel calcolo
                  aggrobj = {
                     value: _.ceil(_.sum(
                        _.map(values, function (row) {
                           if (!row[objAggrValue.column.name]) return 0;
                           return row[objAggrValue.column.name]
                        })), 2)
                  };
                  break;
               case 'avg':
                  // i valori nulli li considero zero
                  aggrobj = {
                     value: _.mean(
                        _.map(values, function (row) {
                           if (!row[objAggrValue.column.name]) return 0;
                           return row[objAggrValue.column.name]
                        }))
                  };
                  break;
               case 'max':
                  // min e max tornano l'intera riga, non lo scalare con il valore. quindi prendo il cname
                  var max = _.maxBy(values, objAggrValue.column.name) ? _.maxBy(values, objAggrValue.column.name)[objAggrValue.column.name] : 0;
                  aggrobj = { value: max };
                  break;
               case 'min':
                  var min = _.minBy(values, objAggrValue.column.name) ? _.minBy(values, objAggrValue.column.name)[objAggrValue.column.name] : 0;
                  aggrobj = { value: min };
                  break;
            }
            // lego le altre 2 proprietà comuni a tutte le funz. cioè nome  e caption della colonna. Su questi oggetti costruirò la stringa da mostrare
            // sulla riga della tab html in buildAggregationStringByGroupedObject()
            aggrobj['fname'] = objAggrValue.fname;
            aggrobj['column'] = objAggrValue.column.caption;
            obj[key] = aggrobj;
         });
      },

      /**
       * @method addDragHereLbl
       * @private
       * @description SYNC
       * Adds the label "Drag here ..." on the grouping area
       */
      addDragHereLbl: function () {
         if (!this.$divLbl) {
            this.$divLbl = $('<span class="searchzoneGridX">');
            if (this.$groupingArea) {
               this.$groupingArea.append(this.$divLbl);
               this.$divLbl.text(localResource.dragHereColumns);
            }

         }
         this.$divLbl.show();
      },

      /**
       * @method addConfigAggColumnBtn
       * @private
       * @description SYNC
       * Adds the button to open the form for the configurations of the aggregation functions on the columns on the grouped view
       */
      addConfigAggColumnBtn: function () {
         var $confIcon = $('<i class="fas fa-cog">');
         var $span = $('<div class="icoTrascina">');
         $span.on("click", _.partial(this.openConfigAggr, this));
         this.addChildElement(this.$groupingArea, $span, '');
         this.addChildElement($span, $confIcon, '');
      },

      /**
       * @method openConfigAggr
       * @private
       * @description SYNC
       * Opens the windows to configure the columns for the aggregation functions
       */
      openConfigAggr: function (that) {

         if (!that.dialogConfAggrId) {
            that.dialogConfAggrId = "dialog" + utils.getUnivoqueId();
            var divConfAggr = that.buildHtmlConfigAggr(that.dialogConfAggrId);

            // lo appendo al mio rootElement esterno
            $(that.el).append(divConfAggr);
            $("#" + that.dialogConfAggrId).dialog({
               show: "slide", modal: true, autoOpen: true,
               title: localResource.configAggrTitle,
               width: appMeta.getScreenWidth() * 0.85,
               height: appMeta.getScreenHeight() * 0.7,
               close: _.partial(that.hideConfigAggr, that),
               position: { my: "center bottom", at: "center bottom" , of: window}
            });

            // handler per la chiusura della form di configurazione delle funz. di aggragazione da calcolare
            var btnconfirmid = "#btn_confirm_id" + that.dialogConfAggrId;
            $(btnconfirmid).on("click", _.partial(that.confirmConfAggr, that));

            // handler per il salvataggio del layout della griglia
            //var btnsavelayouid = "#btn_savelayout_id" + that.dialogConfAggrId;
            //$(btnsavelayouid).on("click", _.partial(that.saveLayout, that ));
            var btnsavelayout = $(divConfAggr).find("#btn_savelayout_id");
            $(btnsavelayout).on("click", _.partial(that.saveLayout, that));
         }

         $("#" + that.dialogConfAggrId).dialog('open');

      },

      /**
       * @method buildHtmlConfigAggr
       * @private
       * @description SYNC
       * builds the form with the checkbox. For each numeric column visisble it creates 4 options:
       * <mycol> ckSum, ckAvg, ckmax, chMin
       *
       * <confirm  button>
       */
      buildHtmlConfigAggr: function (iddialog) {
         // Per ogni colonna numerica inserisco opzioni
         var self = this;

         /*****/
         var $root = $('<div id="' + iddialog + '">');

         // recupero template
         var templateFileHtmlPath = appMeta.basePath + appMeta.config.path_gridOption_Template;
         var htmlCodeTemplate = appMeta.getData.cachedSyncGetHtml(templateFileHtmlPath);
         $root.append(htmlCodeTemplate);

         // elemnti tab del template, tab1 dove c'è lista colonne, tab2 gestione labottoni salva layout
         var $tab1 = $root.find("#gridoption_tab1");
         var $tab2 = $root.find("#gridoption_tab2");

         // localizzo label su tab
         $root.find("a[data-target='#gridoption_tab1']").text(localResource.gridoption_tab1);
         // $root.find("a[data-target='#gridoption_tab2']").text(localResource.gridoption_tab2);

          var btnconfirmid = "btn_confirm_id" + iddialog;
         var $btn = $('<button class="btn btn-primary mb-2" id="' + btnconfirmid + '">');
         $($tab1).append($btn);
         $btn.text(localResource.confirm);

         // costrusico griglia delle opzioni colonne
         var $table = $('<table class="table" border="1">');
         var $thead = $("<thead>");
         var $tr = $("<tr>");
         $($tab1).append($table);
         $($table).append($thead);
         $($thead).append($tr);

         // costruisco colonne, mette funzioni di aggregazione, il valore checkbox solo se sono  numeriche
         var headercols = _.concat([localResource.column, localResource.visible], this.aggrFunctionArr);
         _.forEach(headercols, function (col) {
            var $th = $('<th>');
            var caption = _.includes(self.aggrFunctionArr, col) ? self.getStringFromAggregationFunction(col) : col;
            self.addChildElement($tr, $th, caption);
         });

         _.forEach(this.orderedCols, function (col) {
            var $tr = $("<tr>");
            _.forEach(headercols, function (hc) {
               var currid = iddialog + col.name.replace("!", "") + hc; // id html non puà contenere carattere "!", altrimenti jquery va in eccezione
               var $td = $('<td style="user-select: none; text-align: center; vertical-align: middle;" nowrap>');
               if (hc === localResource.column) {
                  $td.addClass(appMeta.cssDefault.alignStringColumn);
                  self.addChildElement($tr, $td, col.caption);
               } else if (hc === localResource.visible) {
                  var $checkbox = $('<input type="checkbox" id="' + currid + '" class="big-checkbox">');
                  $($td).append($checkbox);
                  $checkbox.prop("checked", true); // tutte visibili all'inizio
                  $($tr).append($td);
               } else if (appMeta.metaModel.isColumnNumeric(col)) {
                  var $checkbox = $('<input type="checkbox" id="' + currid + '" class="big-checkbox">');
                  $($td).append($checkbox);
                  $($tr).append($td);
               } else {
                  $($tr).append($td);
               }
            });

            $($table).append($tr);
         });



         /*var btnlayoutid = "btn_savelayout_id" + iddialog;
         var $btnSaveLayout = $('<button class="btn ml-3" id="' + btnlayoutid +'">');
         $($tab2).append($btnSaveLayout);
         $btnSaveLayout.text(localResource.saveLayout);*/

         return $root;
      },

      /**
       * @method saveLayout
       * @private
       * @description ASYNC
       * Saves the layout of the grid on the DB. The config will be applied with at the startup readLayoutToApply() function
       * @param {GridControlX} that
       */
      saveLayout: function (that) {
         return;
         var cname, ccaption, cvis, csort, cgroup, caggr;

         var dsCustomView_TableName = "customview";
         var dsCustomView_EditType = "default";

         var newListType = "system";
         var objectName = that.dataSourceName;

         var waitingHandler = that.metaPage.showWaitingIndicator(localResource.modalLoader_wait_for_save_layout);
         // recupero ds vuoto
         getData.getDataSet(dsCustomView_TableName, dsCustomView_EditType)
            .then(function (ds) {

               // popolo riga della tabella principale "customview"
               var rowCustomView = ds.tables[dsCustomView_TableName].newRow();
               rowCustomView["objectname"] = objectName;
               rowCustomView["viewname"] = newListType;

               _.forEach(that.orderedCols, function (col, index) {
                  cname = col.name;
                  ccaption = col.name; // TODO fare editabile
                  cvis = that.computesColVis(col) ? 1 : 0;
                  csort = col.mdlw_sort ? (col.mdlw_sort === 'asc' ? 'a' : 'd') : 'x';
                  cgroup = _.some(that.columnsGrouped, { name: cname }) ? 1 : 0;
                  caggr = that.computesColConfAggr(col);

                  // creo una riga per ogni colonna su "customviewcolumn"
                  var rowCustomViewColumn = ds.tables.customviewcolumn.newRow();
                  rowCustomViewColumn["objectname"] = objectName;
                  rowCustomViewColumn["viewname"] = newListType;
                  rowCustomViewColumn["listcolpos"] = index + 1;
                  rowCustomViewColumn["colnumber"] = index + 1; // colnumber non ouò essere zero
                  rowCustomViewColumn["colname"] = cname;
                  rowCustomViewColumn["heading"] = ccaption;
                  rowCustomViewColumn["visible"] = cvis;
                  rowCustomViewColumn["bold"] = 0;
                  rowCustomViewColumn["italic"] = 0;
                  rowCustomViewColumn["underline"] = 0;
                  rowCustomViewColumn["strikeout"] = 0;
               });

               // eseguo post del dataset
               appMeta.postData.doPostSilent(ds, dsCustomView_TableName, dsCustomView_EditType, [])
                  .then(function (res, messages) {
                     that.metaPage.hideWaitingIndicator(waitingHandler);
                     if (res) that.metaPage.showMessageOk(localResource.savingLayoutSucceded);
                     if (!res) that.metaPage.showMessageOk(localResource.savingLayoutError + ": " + JSON.stringify(messages || []));
                  })
            });

      },

      /**
       * @method applyLayout
       * @private
       * @description SYNC
       * Starting from the configuration saved on the db and apply it to the grid
       */
      readLayoutToApply: function () {
         var self = this;
         var arrConfCols = [];
         var orderByArr = [];
         // TODO leggere ds del "customview"
         _.forEach(arrConfCols, function (singleCol) {

            var cname, ccaption, cvis, csort, cgroup, caggr;

            var currCol = self.dataTable.columns[cname];
            if (currCol) {
               currCol.caption = ccaption || currCol.caption;
               currCol.tohide = !cvis;
               if (csort) {
                  var sort = (csort === "a") ? "asc" : "desc";
                  orderByArr.push(cname + " " + sort);
               }

               if (cgroup) {
                  if (!self.columnsGrouped) self.columnsGrouped = [];
                  self.groupedColumns.push(currCol);
               }

               /*_.forEach(self.aggrFunctionArr, function (fname) {
                var currid = self.dialogConfAggrId + col.name.replace("!", "") + fname;
                var bvalue = !!$('#' + currid).is(":checked");
                self.confAgg[currid] = {fname: fname, value: bvalue, column: col};
                functStr += bvalue ? "1" : "0";
                });*/
            }

         });

         if (orderByArr.length) {
            var orderBy = orderByArr.join(",");
            if (orderBy) self.dataTable.orderBy(orderby);
         }

      },

      /**
       * @method getStringFromAggregationFunction
       * @private
       * @description SYNC
       * Returns the string to show for the aggregation function
       * @param {string} aggrFuncName
       */
      getStringFromAggregationFunction: function (aggrFuncName) {
         switch (aggrFuncName) {
            case "avg": return localResource.avg;
            case "sum": return localResource.sum;
            case "max": return localResource.max;
            case "min": return localResource.min;
            default: return "missing aggr. function";
         }
         return "";
      },

      /**
       * @method hideConfigAggr
       * @private
       * @description SYNC
       * Hides the dialog for the aggregation functions user config
       * @param {GridControlX} that
       */
      hideConfigAggr: function (that) {
         $("#" + that.dialogConfAggrId).dialog('close');
      },

      /**
       * @method confirmConfAggr
       * @private
       * @description SYNC
       * Returns a js object {colid:{fname :<"sum" || "avg" || "max" || "min">, value:<bool>, column:<Datacolumn>}}
       * The value represents if the specific checkbox is checked or not
       * @param {GridControlX} that
       */
      confirmConfAggr: function (that) {


         // Funzione ausiliaria utilizzata per nascondere/visualizzare colonne
         // trova sulla riga la cella linkata a quella, colonna. eltype può essere "th" o "td"
         var showHideCell = function ($currRow, col, eltype) {
            $currRow.find(eltype)
               .each(function () {
                  var $el = $(this);
                  var columnname = $el.data("mdlcolumnname");
                  // osserva se è il td di cui devo gestire la visibilità o meno
                  if (col.name.replace("!", "") === columnname) {
                     if (col.tohide) {
                        $el.hide();
                     } else {
                        $el.show();
                     }
                  }
               })
         };

         // Ciclo su tutte le colonne e per ogni funz di aggregazione, leggo il valore del check
         // Popolo una struttura dati, che verrà utilizzata nel calcolo delle funzioni di aggregazione nel grouping.
         // Vado anche a vedere il flag visibilità e nel caso mostro/nascondo la colonna
         that.confAgg = {};
         _.forEach(that.orderedCols, function (col) {
            // salvo sulla colonna una prop "aggrFunctStr" con 4 bit che indicano se la colonna ha funz.di aggr
            // serve per il salvataggio del layout per costruire stringa di config.

            that.computesColConfAggr(col);

            var bvalueVis = that.computesColVis(col);

            // solo se effettivamente cambia
            if (col.tohide !== !bvalueVis) {
               // salvo il nuovo valore per la proprietà
               col.tohide = !bvalueVis;
               // trovo le celle ed applico
               that.mytable.find("tr")
                  .each(function () {
                     var $currRow = $(this);
                     showHideCell($currRow, col, "th");
                     showHideCell($currRow, col, "td");
                  });
            }

         });

         // chiudo modale
         that.hideConfigAggr(that);

         // ridisegno solo se effettivamente c'è un raggruppamento da fare,
         // la visibilità la fa subito nel ciclo precedente
         if (that.columnsGrouped && that.columnsGrouped.length) that.redrawGridForGrouping(that, false);

      },

      /**
       * @method computesColConfAggr
       * @private
       * @description SYNC
       * populates "confAgg" variable and return the configuration string
       * @param {DataColumn} col
       * @returns {string}
       */
      computesColConfAggr: function (col) {
         var functStr = "0000";
         var self = this;

         if (appMeta.metaModel.isColumnNumeric(col)) {
            functStr = "";
            _.forEach(this.aggrFunctionArr, function (fname) {
               var currid = self.dialogConfAggrId + col.name.replace("!", "") + fname;
               var bvalue = !!$('#' + currid).is(":checked");
               self.confAgg[currid] = { fname: fname, value: bvalue, column: col };
               functStr += bvalue ? "1" : "0"; // costrusico stringa perla strnga di config del layout
            });
         }

         return functStr;
      },

      /**
       * @method computesColVis
       * @private
       * @description SYNC
       * @param {DataColumn} col
       * @returns {boolean} true if column is visible
       */
      computesColVis: function (col) {
         var curridVis = this.dialogConfAggrId + col.name.replace("!", "") + localResource.visible;
         var bvalueVis = ($('#' + curridVis) && $('#' + curridVis).length) ? !!$('#' + curridVis).is(":checked") : true;
         return bvalueVis;
      },

      /**
       * @method buildAggregationStringByGroupedObject
       * @private
       * @description SYNC
       * Returns a string with the message to show on the aggregate row with the calculated function for tge rows of the group
       * @param {Object} obj. {group:<object>, fun:{value: <number>, column:<string>} }. Each fun has a value that is an object {value: <number>, column:<string>}
       * @returns {string}
       */
      buildAggregationStringByGroupedObject: function (obj) {
         var stringRes = "";
         // scorri obj, non considerando la chiave group, le altre saranno le funz di aggegazione.
         // torno stringa come per esempio: sum("salario") = 5551 - avg("salario") = 2980 - max("salario") = 2990
         // obj è l'oggetto costruto nella funzione applyAggregateFunctions()
         var self = this;
         _.forOwn(obj, function (value, key) {
            if (key !== 'group') stringRes += ", " + self.getStringFromAggregationFunction(value.fname) + "(" + value.column + ") = " + value.value;
         });
         return stringRes;
      },

      /**
       * @method createRowsFromObjgrouped
       * @private
       * @description SYNC
       * Starting from a grouped data structure create an html table with the grouoed rows
       * @param {Object | Array} obj the object with the rows grouped. It will be an array of rows if there isn't grouping or an object {g:value, aggr_func:value}
       * @param {number} groupLev
       * @param {string} tridParent. the id of the tr parent. it is null the first time
       * @returns {string} arrayHtmlPieces. the array with the pieaces of html string
       */
      createRowsFromObjgrouped: function (obj, groupLev, tridParent) {

         /* il value è
          * gr1
          *  sub1
          *    row1
          *    row2
          *  sub2
          *    row3
          *    row4
          * gr2 ...    in questo caso vado in ricorsione sui subx
          *
          * Oppure obj con un array di righe [row1, row2..] nello stesso gruppo
          *
          * Oppure array di righe, nel caso non ci sia un gruppo attivo
          */

         //  l'oggetto passato è un array e quindi sono righe inserisco immediatamente caricamento normale, ho tolto tutti i gruppi
         if (_.isArray(obj)) {
            return this.getHtmlGridNotGrouped(obj);
         }
         return this.getHtmlGridGrouped(obj, groupLev, tridParent);
      },


      getGroupedRowGrid: function (key) {
         return "<span style='font-weight:bold;'>" + key + "</span>";
      },

      /**
       * @method getHtmlGridGrouped
       * @private
       * @description SYNC
       * @param {Object} obj
       * @param {number} groupLev
       * @param {string} tridParent
       * @returns {string} the built html
       */
      getHtmlGridGrouped: function (obj, groupLev, tridParent) {
         var self = this;
         // colsInHeader serve per calcolare lo span, cioè quante celle prende la riga di gruppo, così da avere graficamente una griglia sempre compatta
         var numColumnToAdd = 2; // +2 perchè aggiungo "group" + export
         if (this.isInsertBtnVisible) numColumnToAdd = 3;
         var colsInHeader = this.columnsGrouped ? this.orderedCols.length - this.columnsGrouped.length + numColumnToAdd : this.orderedCols.length;
         // variabili per costruire array con i pezzi di stringa a html variabili da tornare alla funzione che poi ne effettuerà la join
         // E' un ottimizzazione rispettoa  dusare concatenzazione di stringhe, oppure ad utilizzare append ogni volta dfi jquery

         if (this.$divLbl) this.$divLbl.hide();

         var arrTr = [];
         // scorre gli oggetti, se è un array allora metto le righe , altrimenti aggiungo riga di raggruppamento e vado in ricorsione sugli oggetti contenuti
         _.forOwn(obj, function (el, key) {

            // metto riga del gruppo, eventualmente aggiungo spazi a seconda del livello per creare effetto gerarchico
            if (key === 'undefined' || key === 'null') key = '';

            // calcolo righe nel gruppo per inserirlo sulla label
            var numRowsInGroup = _.isArray(el.group) ? el.group.length : _.keys(el.group).length;

            // calcolo valore da mostrare "<nome colonna> (num righe)", eventualmente shiftato a seconda del livello del gruppo
            var aggregationRes = self.buildAggregationStringByGroupedObject(el);
            var totGroup = self.isTotnotvisible ? " " : "<span class='gridGroupTot'> (" + numRowsInGroup + ")</span> ";
            var keyString = self.getGroupedRowGrid(key);
            var tdGroupValue = "&nbsp;&nbsp;" + keyString + totGroup + "<span style='color:darkblue'>" + aggregationRes + "</span>";

            // costrusico oggetto tr con le info per effettare poi il recursiveCollapse/recursiveExpand
            var trid = utils.getUnivoqueId();
            var dataParent = "";
            if (tridParent) { dataParent = "data-parenttr=" + tridParent; }
            // aggiungo mdlgrouped per indicare che è una riga di grouping, servirà per non far scattare l'evento di selezione su quelle righe

            var $tr = $('<tr id="' + trid + '" ' + dataParent + ' data-mdlgrouped >');

            var classCss = (groupLev === 1) ? "gx-td-grouped-cell gx-td-grouped-cell-first" : "gx-td-grouped-cell gx-td-grouped-cell-notfirst";
            var $td = $('<td class="' + classCss + '" colspan="' + colsInHeader + '">');

            // solo le righe di livello 1 sono visibili, oppure nel caso ci siano colonne di gruppo in input
            self.addChildElement($tr, $td, tdGroupValue);
            if (groupLev !== 1 && !self.groupedColumnsInput) $tr.hide();

            // inserisco icona per espandere
            // a seconda del gruppo metto scostamento a sinistra per costruire una struttura a livelli
            var paddingleft = (groupLev - 1) * 10;

            var $expandIcon = $('<i class="far fa-plus-square">');
            var currid = "exp_" + trid;
            var $span = $('<div id="' + currid + '" style="padding-left:' + paddingleft + 'px; float:left; cursor: pointer;">');
            self.addChildElement($td, $span, '');
            self.addChildElement($span, $expandIcon, '');
            $span.hide();

            // inserisco icona per collassare , parte nascosta
            var $expandIcon = $('<i class="far fa-minus-square">');
            var currid = "col_" + trid;
            var $span = $('<div id="' + currid + '" style="padding-left:' + paddingleft + 'px; float:left; cursor: pointer;">');

            self.addChildElement($td, $span, '');
            self.addChildElement($span, $expandIcon, '');
            if (!self.groupedColumnsInput) $span.hide();

            // aggiungo intero tag html table

            arrTr.push($tr);
            // arrivo sulla foglia quindi devo inserire le righe
            if (_.isArray(el.group)) {

               _.forEach(el.group, function (r, index) {
                  // non inserisco le deleted
                  if (r.getRow && r.getRow().state !== dataRowState.deleted) {
                     arrTr.push(self.addTableRow(r, false, trid));
                  }
               });

            } else {
               // è un obj quindi aumento il livello e vado in ricorsione sugli oggetti annidati
               var lev = groupLev + 1;
               arrTr = arrTr.concat(self.createRowsFromObjgrouped(el.group, lev, trid));
            }
         });

         return arrTr;
      },

      /**
       * @method getHtmlGridNotGrouped
       * @private
       * @description SYNC
       * @param {ObjectRow[]} rows
       * @returns {string} the built html of rows
       */
      getHtmlGridNotGrouped: function (rows) {
         var self = this;
         var arrTr = [];
         // rimetto la scritta poichè non c'è grouping
         if (this.$divLbl) this.$divLbl.show();
         _.forEach(rows, function (r) {
            // non inserisco le deleted
            if (r.getRow && r.getRow().state !== dataRowState.deleted) {
               arrTr.push(self.addTableRow(r, false, null));
            }
         });
         if (!rows.length) self.addTableEmptyRow();
         return arrTr;
      },

      /**
       * @method recursiveExpand
       * @private
       * @description SYNC
       * Expands all the rows child of the row with id idTrParent
       * @param {GridControlX} that
       * @param {string} idTrParent
       */
      recursiveExpand: function (that, idTrParent) {
         $("#col_" + idTrParent).show();
         $("#exp_" + idTrParent).hide();
         _.forEach(that.mytable
            .not('.table-in-cell-tr')
            .find("tr[data-parenttr]:not(:has(>th))"), function (tr) {
               var dataParent = $(tr).data('parenttr');
               if (dataParent && parseInt(dataParent) === parseInt(idTrParent)) {
                  var currTrId = $(tr).attr("id");
                  $(tr).css('display', '');
                  if (currTrId) {
                     that.recursiveExpand(that, currTrId);
                  }
               }
            })
      },

      /**
       * @method recursiveCollapse
       * @private
       * @description SYNC
       * Collapses all the rows child of the row with id idTrParent
       * @param {GridControlX} that
       * @param {string} idTrParent
       */
      recursiveCollapse: function (that, idTrParent) {
         $("#exp_" + idTrParent).show();
         $("#col_" + idTrParent).hide();
         // nascondo tutte le righe che hanno idTrParent
         _.forEach(that.mytable
            .not('.table-in-cell-tr')
            .find("tr[data-parenttr]:not(:has(>th))"), function (tr) {
               var dataParent = $(tr).data('parenttr');
               if (dataParent && parseInt(dataParent) === parseInt(idTrParent)) {
                  var currTrId = $(tr).attr("id");
                  $(tr).css('display', 'none');
                  if (currTrId) {
                     that.recursiveCollapse(that, currTrId);
                  }
               }
            });
      },

      /**
       * @method redrawGridForGrouping
       * @private
       * @description SYNC
       * redraws the grid, based on grouping.
       * @param {GridControlX} that
       */
      redrawGridForGrouping: function (that) {
         // per ora funziona con un raggruppamento solo

         var rows = that.gridRows;

         // rimuovo tutto, ricreo un mytable, per questioni di performance appendo al nuovo mytable al termine
         if (that.mytable) that.mytable.parent().remove();
         that.mytable = $('<table class="table" border="1" style="position:relative">');
         // calcolo raggruppamento per quella specifica colonna.
         // torna ob con chiave colonna , e valore array di rows
         // col1: [a,b,c]
         // col2: [d,e,f]
         //console.log("pre group " + appMeta.logger.getTimeMs());
         var objGrouped = that.calcObjGrouped(rows, that.columnsGrouped);
         //console.log("post group " + appMeta.logger.getTimeMs());

         // ho calcolato nuove colonne nell'header e le inserisco
         that.addHeaders();

         // creo strtuutra di righe raggruppate. passo 1 come livello di raggruppamento, poi nella ricorsione aumenterò
         // console.log("pre render " + appMeta.logger.getTimeMs());
         // appendo al mytable tutta als tringa html
         that.mytable.append(that.createRowsFromObjgrouped(objGrouped, 1, null));
         // console.log("post render " + appMeta.logger.getTimeMs());

         var $tableCont = $('<div class="tableCont">');
         $tableCont.append(that.mytable);

         $(that.el).prepend($tableCont);
         $($tableCont).insertAfter($(that.$groupingArea));
         // aggiungo eventi alle righe
         that.addMyEvents();
      },

      /**
       * @method addHeaders
       * @private
       * @description SYNC
       * Adds the header on the html grid
       */
      addHeaders: function () {
         var $thead = $("<thead>");
         var $tr = $("<tr>");
         $($tr).appendTo($thead);
         this.addEditingGridButtonHeader($tr);
         this.addTablecolumns($tr);
         $($thead).appendTo(this.mytable);
      },

      /**
       * @method addTablecolumns
       * @private
       * @description SYNC
       * Adds the columns for the field of the table to show
       */
      addTablecolumns: function ($tr) {
         var self = this;

         // inserisco l'header. Se c'è gruppo colonna gruppo + tutte quelle che non sono raggruppate
         var cols = self.getColsToInsert();
         // calcolo array dell ecolonne su cui è impostato l'oridnamento iniziale
         var sorting = this.dataTable.orderBy();
         var colSorting = {};
         if (sorting) {
            var parts = sorting.split(",");
            // metto indicatore di sort sull'icona della colonna giusta
            _.forEach(parts, function (p) {
               // "colname asc" o r "colname desc" quindi splitto sullo spazio
               colSorting[p.split(" ")[0]] = true;
            });
         }

         _.forEach(cols,
            function (c, index) {
               var thid = appMeta.utils.getUnivoqueId();
               var $th;

               // se si tratta dellaprima colonna nel grouping allora non la faccio draggable nè mettò l'ordinamento
               if (c.isFirsGrouping) {
                  $th = $('<th id="' + thid + '">');
               } else {
                  // aggiungo data-mdlcolumnname, serve per individuare la colonna da invertire quando le sposto con drag n drop
                  $th = $('<th draggable="true" id="' + thid + '" data-mdlcolumnname="' + c.name.replace("!", "") + '">');
                  $th.on("dragstart", _.partial(self.dragHeaderColumn, self, c));
                  $th.on("click", _.partial(self.sortColumnClick, self, c));
               }

               // lego la colonna al th per ildrop e successivo spostamento della colonna
               $th.data("mdlcolumn", c);
               // tohide è calcolato in base alle opzioni del popup
               var capiton = (c.caption || c.name);
               self.addChildElement($tr, $th, capiton);
               if (c.tohide) $th.hide();

               // se devo mettere sort e se non è la prima colonna del grouping
               if (!self.isNotSort && !c.isFirsGrouping) {
                  var $sortIcon;
                  // se è ordinata per default metto icona bianca
                  if (colSorting[c.name]) {
                     if (c.mdlw_sort === "desc") {
                        $th.text($th.text() + "   ↓");
                     } else {
                        $th.text($th.text() + "   ↑");
                     }
                  }
               }

               // sul mobile inserisco bottoncino su header per il grouping.
               // non aggiungo se è la colonna notevole gruppo, e se è impostato che non deve essere visibile il grouping
               if ((appMeta.isMobile || self.forceBtnGroupOnHeader) && !c.isFirsGrouping && !this.excludeGroup) {
                  var $groupIcon = $('<i class="fas fa-poll-h" style="color:grey; margin-left: 6px">');
                  var $span = $('<div style="padding:5px; float:right; cursor: pointer; display: contents">');
                  $span.on("click", _.partial(self.dropColumnEv, self, c));
                  self.addChildElement($th, $span, '');
                  self.addChildElement($span, $groupIcon, '');
               }

            });

      },

      /**
       * @method addEditingGridButtonHeader
       * @private
       * @description SYNC
       * Adds the columns for the editing button
       */
      addEditingGridButtonHeader: function ($tr) {
         var self = this;
         this.isExportBtnAdded = false;
         // funzione ausiliaria per aggiungere bottone di export sul giusto elemento <th>
         var insertBtnGeneric = function (th, that) {
            // solamente se non è stato già aggiunto
            if (!that.isExportBtnAdded) {
               that.isExportBtnAdded = true;
               var $excelIcon = $('<i class="far fa-file-excel">');
               that.$btnexportExcel = $('<a href="#" style="float:left; cursor: pointer; padding-right: 5px;"></a>');
               // that.$btnexportExcel = $('<div style="text-align:center;"></div>');
               that.$btnexportExcel.on("click", _.partial(that.gridHtmlToExcel, that));
               that.addChildElement($(th), that.$btnexportExcel, '');
               that.addChildElement(that.$btnexportExcel, $excelIcon, '');
            }
         };

         // gestione bottoni di editing
         // creo th per bottone di add se serve lo inserisco  o per altri bottoni di riga
         var widthEditcolumns = "30px";
         var $thBtn = $('<th class="mdlw_tdclickable">');
         $thBtn.width(widthEditcolumns);
         // aggiungo bottone di add
         if (this.isInsertBtnVisible) {
            this.addChildElement($tr, $thBtn, '');
            var $btninsert = $('<div style="text-align:center;" data-insert></div>');
            $btninsert.on("click", _.partial(this.insertClick, this));
            var $iconInsert = $('<i class="fa fa-plus-square"></i>');
            self.addChildElement($thBtn, $btninsert, '');
            self.addChildElement($btninsert, $iconInsert, '');
         }

         var $thBtnEdit = $('<th>');
         $thBtnEdit.width(widthEditcolumns);
         if (this.isEditBtnVisible && !this.isInsertBtnVisible) {
            this.addChildElement($tr, $thBtnEdit, '');
            insertBtnGeneric($thBtnEdit, self)
         }

         var $thBtnDlt = $('<th>');
         $thBtnDlt.width(widthEditcolumns);
         if ((this.isDeleteBtnVisible && this.isEditBtnVisible) ||
            (this.isDeleteBtnVisible && (!this.isEditBtnVisible && !this.isInsertBtnVisible))
         ) {
            this.addChildElement($tr, $thBtnDlt, '');
            insertBtnGeneric($thBtnDlt, self)
         }

         var $thBtnUnlk = $('<th>');
         $thBtnUnlk.width(widthEditcolumns);
         if ((this.isUnlinkBtnVisible && (this.isDeleteBtnVisible || this.isEditBtnVisible)) ||
            (this.isUnlinkBtnVisible && (!this.isEditBtnVisible && !this.isInsertBtnVisible && !this.isDeleteBtnVisible))
         ) {
            this.addChildElement($tr, $thBtnUnlk, '');
            insertBtnGeneric($thBtnUnlk, self)
         }

         var $thBtnExp = $('<th id="thexp_id">');
         $thBtnExp.width(widthEditcolumns);
         if (!this.isExportBtnAdded) {
            this.addChildElement($tr, $thBtnExp, '');
            insertBtnGeneric($thBtnExp, this)
         }
      },

      /**
       *
       * @param {GridControlX} that
       * @param {DataColumn} c
       */
      dropColumnEv: function (that, c) {
         if (!that.columnsGrouped) that.columnsGrouped = [];
         that.putDroppingRectColumn(c);
         that.columnsGrouped.push(c);
      },

      /**
       * @method getIdColumnSort
       * @private
       * @description SYNC
       * Gets an unique id of the icon for the column on the page
       * @param {string} cname the column name
       * @returns {string}
       */
      getIdColumnSort: function (cname) {
         return "icon_sort_id" + this.dataTable.name + cname.replace("!", "");
      },

      /**
       * @method sortColumnClick
       * @private
       * @description SYNC
       * Execute the sort of the rows on the user-click. TODO capire vecchio indice selzionato, se lo devo riselzionare
       * @param {GridControlX} that
       * @param {DataColumn} column
       */
      sortColumnClick: function (that, column) {
         // ordino la collection attuale delle rgihe
         column.mdlw_sort = column.mdlw_sort ? (column.mdlw_sort === 'asc' ? 'desc' : 'asc') : 'asc';
         var def = Deferred('sortColumnClick');
         // nel caso di elenco con paginazione dovrei rilanciare la query sul backend per calcolare la nuov paginazione
         if (that.metaPage.sortPaginationChange) {
            var newSort = column.name + " " + column.mdlw_sort;
            return that.metaPage.sortPaginationChange(newSort)
               .then(function (sortDone) {
                  if (!sortDone) {
                     that.sortAfterClick(that, column);
                  }
                  return def.resolve();
               })
         } else {
            that.sortAfterClick(that, column);
            return def.resolve();
         }
      },

      sortAfterClick: function (that, column) {
         that.gridRows = _.orderBy(that.gridRows, function (row) {
            var value = row[column.name];
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

         // reset indicatore colonna ordinata
         _.forEach(that.orderedCols, function (c) {
            var csortId = "#" + that.getIdColumnSort(c.name);
            if ($(csortId).length > 0) $(csortId).css("color", "black")
         });

         // ridisegno grid con le righe raggruppate
         that.redrawGridForGrouping(that, true);
      },

      /**
       * @method getControl
       * @private
       * @description SYNC
       * Reads data from the control - Actually does nothing on a grid
       */
      getControl: function () {

      },

      /**
       * @method clearControl
       * @private
       * @description ASYNC
       * Executes a clear of the control. It removes rows and set the index to -1 value.
       * @returns {Deferred}
       */
      clearControl: function () {
         this.clearHtmlGrid();
         return this.setRow(null);
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
         //console.log("rowClickEv");
         var self = this;
         // inserisco meccanismo con timeout per evitare che scatti CLICK + DBL_CLICK insieme
         if (that.timeoutId) {
            clearTimeout(that.timeoutId);
            that.timeoutId = null;
            Stabilizer.decreaseNesting("rowClickEv.timeout");
            //console.log("decreasing for Timeout");
         }
         //console.log("increasing for Timeout");
         Stabilizer.increaseNesting("rowClickEv");
         that.timeoutId = setTimeout(function () {
            //    console.log("Grid faccio rowClickEv");
            that.timeoutId = null;
            that.rowClick.call(self, that);
            //console.log("decreasing for Timeout");
            Stabilizer.decreaseNesting("rowClickEv.timeout");
         }, appMeta.dbClickTimeout);
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
            //  console.log("stoppo rowClickEv");
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            //console.log("decreasing for Timeout");
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
       * @param {GridControlX} that
       * @param {boolean} propagate
       * @returns {Deferred}
       */
      rowClick: function (that, propagate) {
         var self = this;
         // distinguo ildoppio click s è o meno gestito come treeNavigator
         var r = $(this).data("mdldatarowlinked");
         var def = Deferred("rowClick");
         if (!r) return def.resolve(true);
         if (r === that.currentRow) {
            return def.from(that.cellEditable(this));
         } //Riga già selezionata

         if (that.metaPage) {
            return that.metaPage.canSelect(that.dataTable, r)
                .then(function (result) {
                   if (result) {
                      if (that.isTreeNavigator) return def.from(that.navigatorClick.call(self, that));
                      that.currentTrRow = this;
                      return def.resolve(that.setRow(r, propagate));
                   }
                   return def.resolve(false);
                });
         }
         return def.from(that.setRow(r, propagate));
      },

      selectOption:function(colname, row, that, preText, ev) {
         that.setValueOnDataRow(row, colname, $(this).val());
         // esco dall'editing
         var displayText = $(this).find('option:selected').html();
         that.resetEditableTd(displayText);
      },

      cellEdit: function (that) {
         // clicco su una cella se c'era valorizzato il td corrente
         if (that.tdEditing) {
            // rimetto il valore originale
            var text = $(that.tdEditing).data("mdlpretext");
            $(that.tdEditing).html(text);
            $(that.tdEditing).data("mdlediting", false);
         }
         // sul td corrente diventa quello editabile
         var preText = $(this).html();
         $(this).data("mdlpretext", preText);
         that.tdEditing = this;
      },

      cellEditable: function () {
         var def = Deferred("cellEditable");
         var self = this;

         // se sto già in editi sulq uel td esco
         var editing = this.helpForm.existsDataAttribute(this.tdEditing, "mdlediting");
         if (editing && $(this.tdEditing).data('mdlediting')) {
            return def.resolve();
         }
         // se non è un grid con editInPalce esco
         if (!this.editInPlaceColumns) {
            return def.resolve();
         }

         // recupero riga e colonna del td da editare
         var colname = $(this.tdEditing).data('mdlcolumnname');
         var row = $(this.tdEditing).closest('tr').data('mdldatarowlinked');

         // se non fa parte di quelle che ho input da editare
         if (!self.editInPlaceColumns.includes(colname)) {
            return def.resolve();
         }
         // variabile che indica che la cella è in fase di editing
         $(this.tdEditing).data("mdlediting", true);

         var preText = $(this.tdEditing).html();
         $(this.tdEditing).data("mdlpretext", preText);
         // creo input editabile
         var id = appMeta.utils.getUnivoqueId();

         // osservo se devo visualizzare select
         if (self.conditionallookupArray[colname]) {

            var selectObj = $("<select id=" + id + "/>");
            _.forEach(self.conditionallookupArray[colname], function (option) {
               var emptyOption = document.createElement("option");
               emptyOption.textContent = option.displaymember;
               emptyOption.value = option.valuemember;
               selectObj.append(emptyOption);
            });
            $(this.tdEditing).html("");
            selectObj.width($(this.tdEditing).width())
                .height($(this.tdEditing).height())
                .css({border: "0px", fontSize: "17px"})
                .val(preText)
                .appendTo($(this.tdEditing));

            selectObj.change( _.partial(self.selectOption, colname, row, self, preText));

            selectObj.click(function () {
               return false;
            });

         } else {
            var inputObj = $("<input type='text' id=" + id + "/>");
            $(this.tdEditing).html("");
            inputObj.width($(this.tdEditing).width())
                .height($(this.tdEditing).height())
                .css({border: "0px", fontSize: "17px"})
                .val(preText)
                .appendTo($(this.tdEditing))
                .trigger("focus")
                .trigger("select");

            // se premo qualceh tasto inovco evento. su invio effettuo modifica del valore sulla riga
            inputObj.on("keyup", _.partial(self.keyupeditinplace, colname, row, self, preText));

            inputObj.click(function () {
               return false;
            });
            // se è una colonna data, inserisco calendario
            var dc = self.dataTable.columns[colname];
            if (dc.ctype === 'DateTime') {
               inputObj.datepicker({
                  showOn: "focus",
                  onClose: function () {
                     this.focus();
                  }
               });
               inputObj.datepicker('show');
            }
         }

         return def.resolve();
      },

      keyupeditinplace: function (colname, row, that, preText, ev) {
         if (13 === ev.which) { // press ENTER-key
            var text = $(this).val();
            // recuperato il valore dalla input lo inserisco sia come testo del grid che come valore sulla riga
            that.setValueOnDataRow(row, colname, text);
            // esco dall'editing
            that.resetEditableTd(text)

            if(that.metaPage.editInPlace)
                that.metaPage.editInPlace(that.metaPage, that, colname, row);
         }

         if (27 === ev.which) {  // press ESC-key
            that.resetEditableTd(preText)
         }
      },

      resetEditableTd: function (text) {
         var self = this;
         setTimeout(function () {
            $(self.tdEditing).html(text);
            $(self.tdEditing).data('mdlediting', false);
            self.tdEditing = null;
         }, 200)
      },

      /**
       *
       * @param {ObjectRow} row
       * @param {string} colname
       * @param {string} text
       */
      setValueOnDataRow: function (row, colname, text) {
         var tag = this.dataSourceName + "." + colname;
         this.helpForm.getString(text, colname, row, tag, true);
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
      rowDblClick: function (that) {
         // chiamo il rowClick con il this che è il tr che cliccato, + il that che è il Gridcontrol. Poi invoco il rowDblClick su MetaPage
         var self = this;

         // distinguo ildoppio click s è o meno gestito come treeNavigator

         if (that.isTreeNavigator) {
            return Deferred("rowDblClick")
               .from(that.navigatorClick
                  .call(this, that)
                  .then(function () {
                     return that.navigatorDblClick();
                  }));
         }

         return Deferred("rowDblClick")
            .from(that.rowClick
               .call(this, that, false)
               .then(function () {
                  // solamente se è definito
                  if (that.metaPage.rowDblClick && that.isEditBtnVisible) {
                     var row = $(self).data("mdldatarowlinked"); // self era il this ovvero , l'elemento cliccato
                     that.metaPage.rowDblClick(that, that.dataTable, row);
                  }
               }));
      },

      /**
       * @method navigatorClick
       * @private
       * @description ASYNC
       * It selects and expands a node on tree navigator
       * @param {GridControl} that
       * @returns {Deferred}
       */
      navigatorClick: function (that) {
         console.log("navigatorClick");
         var def = Deferred('navigatorClick');
         var treemanager = that.dataTable.treemanager;
         if (!treemanager) return def.resolve();

         var parent = that.dataTable.parentnode;
         if (!parent) {
            var curr = treemanager.selectedNode();
            parent = curr;
         }
         var rSel = $(this).data("mdldatarowlinked");
         var waitingHandler = that.metaPage.showWaitingIndicator(localResource.modalLoader_wait_tree_node_search);
         return treemanager.selectNodeByRow(rSel, false)
            .then(function () {
               that.dataTable.parentnode = treemanager.getParent(treemanager.selectedNode());
               that.setLastSelectedRowOnTree(treemanager.treeTable, rSel);   // N.B era that.helpForm.lastSelected(rSel.getRow().table, rSel); // la riga sul grid è una copia, non ha ilgetrow, prendo quella sul tree
               that.setRow(rSel, false); // seleziono anche indce su griglia corrente come facevail click semplice
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
      setLastSelectedRowOnTree: function (table, row) {
         var rowFound;
         // per ogni riga del treemanger prendo quella che corrisponde e la linko. è lei che ha il getRow. qui sul grid ho una copia
         _.forEach(table.rows, function (currRow) {
            if (getDataUtils.isSameRow(table, row, currRow)) {
               rowFound = currRow;
               return false; // esco dal ciclo
            }
         });

         if (rowFound) this.helpForm.lastSelected(rowFound.getRow().table, rowFound);
      },

      /**
       * @method navigatorDblClick
       * @private
       * @description ASYNC
       * @returns {Deferred}
       * Navigates the tree and the grid childs. if it is a leaf it fires a mainSelect on the metaPage
       */
      navigatorDblClick: function () {
         console.log("navigatorDblClick");
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

         if (!self.currentRow) return def.resolve();
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
      fillControlTreeNavigator: function () {
         var def = Deferred('fillControlTreeNavigator');
         var self = this;

         // 1. recupero il treeManager se esiste
         var treemanager = this.dataTable.treemanager;
         if (!treemanager) return def.resolve();

         treemanager.setNavigator(this);

         // costruisco un dt ausiliario della griglia sganciandolo dal quello del tree, che rimane quello che comanda.
         // sul dt clonato della griglia farò tutte le operazioni che voglio.
         if (!this.firstFillDone) {
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
         var isRoot = treemanager.isRoot(selectedNode);
         var isLeaf = treemanager.isLeaf(selectedNode);
         var hasDummyChild = treemanager.hasDummyChild(selectedNode);

         if (!isRoot && (isLeaf || hasDummyChild)) {

            dtRowNode = selectedNode.original.dataRow;

            selectedNode = treemanager.getParent(selectedNode);

            if (prevParent === selectedNode) {
               return def.resolve(this.selectGridRowByRow(mydt, dtRowNode, false))
            }
         }

         if (!selectedNode) return def.resolve();

         // TODO se deve pulire anche il mio dt
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
         return this.innerFillControl(this.el, undefined, false).then(function () {
            if (dtRowNode) {
               return self.selectGridRowByRow(mydt, dtRowNode, false)
                  .then(function () {
                     mydt.parentnode = selectedNode;
                     return def.resolve();
                  })
            }

            self.currentRow = null;
            return def.resolve(self.setRow(null, false));
         });
      },

      /**
       * @method selectGridRowByRow
       * @private
       * @description ASYNC
       * Selects the row on the grid based on the datarow parameter. If the row is in the grid it selcts it
       * @param {DataTable} table
       * @param {ObjectRow} objrow
       * @param {boolean} propagate if true it call a rowSelct on metaPage
       * @returns {Deferred}
       */
      selectGridRowByRow: function (table, objrow, propagate) {
         // passo la table su cui effettuare il confronto prendendo el chaivi, poichè
         // tale datarow è attachata alla griglia, e potrebbe non avere la getRow, poichè nella costruzione ne faccio la clear
         // sarà sempre quella del tree la riga che comanda
         var def = Deferred('selectGridRowByRow');
         // trova la riga nella collection
         var rowFound = null;
         if (!table || !objrow) return def.resolve();
         _.forEach(this.gridRows, function (r, index) {
            if (getDataUtils.isSameRow(table, objrow, r)) {
               rowFound = r;
               return false; // esco dal ciclo
            }
         });

         if (rowFound !== null) {
            return def.from(this.setRow(rowFound, propagate)).promise();
         }
         return def.resolve();
      },
      /**
       * @method buildEmptyRect
       * @public
       * @description ASYNC
       * during prescan adds header for the visible columns
       */
      buildEmptyRect: function () {
         // inserisco solo header.per mostrare qualcosa all'inizio
         if (!this.emptyElement) {
            this.emptyElement = $('<table class="table"  border="1">');
            $(this.el).append(this.emptyElement);
            var $tr = $("<tr>");
            this.emptyElement.append($tr);
            var self = this;
            if (!this.DS) return;
            var t = this.dataTable || this.DS.tables[this.dataSourceName];
            if (!t) return;
            this.orderedCols = this.getOrderedColumns(t);
            _.forEach(this.orderedCols,
               function (c, index) {
                  var $th = $('<th>');
                  $th.data("mdlcolumnname", c.name);
                  self.addChildElement($tr, $th, c.caption || c.name);
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
      replaceSpecialCharatcters: function (s) {
         var html = s;
         var fReplcace = function (htmlprm, char, code) {
            return htmlprm.split(char).join(code);
         };
         html = fReplcace(html, 'á', '&aacute;');
         html = fReplcace(html, 'é', '&eacute;');
         html = fReplcace(html, 'í', '&iacute;');
         html = fReplcace(html, 'ó', '&oacute;');
         html = fReplcace(html, 'ú', '&uacute;');
         html = fReplcace(html, 'à', '&agrave;');
         html = fReplcace(html, 'è', '&egrave;');
         html = fReplcace(html, 'ì', '&igrave;');
         html = fReplcace(html, 'ò', '&ograve;');
         html = fReplcace(html, 'ù', '&ugrave;');
         html = fReplcace(html, '"', '&#34;');
         html = fReplcace(html, '“', '&ldquo;');
         html = fReplcace(html, '”', '&rdquo;');
         html = fReplcace(html, '‘', '&lsquo;');
         html = fReplcace(html, '’', '&rsquo;');
         return html;
      },

      /**
       * @method gridHtmlToExcel
       * @private
       * @description SYNC
       * Executes and export to excel
       */
      gridHtmlToExcel: function (that) {
         // devo togliere fisicamente le colonne nascoste, poichè html() prende anche i display:none , e quindi
         // comparirebbero nel report anche le coloonne nascoste. quindi creo un clone del grid ed effettuo le operazioni necessarie sul nuovo oggetto
         var gridcloned = $(that.mytable)[0].cloneNode(true);
         $(gridcloned).find("tr").each(function (i, tr) {

            var fRemoveDisplayNone = function (eltype) {
               $(tr).find(eltype).each(
                   function (i, el) {

                      if ($(el).css("display") === "none") {
                         $(el).remove();
                      }
                   });
            };
            fRemoveDisplayNone("td");
            fRemoveDisplayNone("th");

            // Rimuove le colonne con i bottoni di edit
            var fRemoveByIndex = function (eltype, index) {
               $(tr).not( ".table-in-cell-tr" ).find(eltype).each(function (i, el) {
                  if (i <= index) {
                     $(el).remove();
                  }
               });
            };

            // rimuove le colonne di editing
            if ((that.isEditBtnVisible || that.isInsertBtnVisible) && that.isDeleteBtnVisible) {
               fRemoveByIndex("td", 1);
               fRemoveByIndex("th", 1);
            } else {
               // altrimenti ne rimuovo almeno una, perchè è quella con il bottone excel stessa. dove poi sotto abbiamo edit o delete
               fRemoveByIndex("td", 0);
               fRemoveByIndex("th", 0);
            }

         });

         var gridhtml = that.replaceSpecialCharatcters($(gridcloned).html());

         // creo excel direttamente dal table
         var tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
         tab_text = tab_text + '<head><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
         tab_text = tab_text + '<x:Name>' + that.tag + '</x:Name>';
         tab_text = tab_text + '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
         tab_text = tab_text + '</x:ExcelWorksheets></x:ExcelWorkbook></xml></head><body>';
         tab_text = tab_text + "<table border='1px'>";
         // concatena alla griglia
         tab_text = tab_text + gridhtml;
         tab_text = tab_text + '</table></body></html>';

         var ua = window.navigator.userAgent;
         var msie = ua.indexOf("MSIE ");
         var fileName = moment().format('D_MMM_YYYY_HHmm') + "_" + that.dataTable.name + "_" + that.listType + ".xls";
         // IE
         if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
            if (window.navigator.msSaveBlob) {
               var blob = new Blob([tab_text], { type: "application/csv;charset=utf-8;" });
               navigator.msSaveBlob(blob, fileName);
            }
         }
         // Chrome + Firefox
         else {
            var data_type = 'data:application/vnd.ms-excel';
            that.$btnexportExcel.attr('href', data_type + ', ' + encodeURIComponent(tab_text));
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
      preFill: function (el, param) {
         var def = Deferred("preFill-Gridx");
         var self = this;
         var res = this.defDescribedColumn
            .then(function () {

               self.buildEmptyRect();

               if (param.tableWantedName && param.tableWantedName !== self.dataSourceName) return def.resolve();

               // se è un navigator il mainTableSelector sarà il tree
               // su mdl era qui helpform.PreFillControlsTable()
               if (!self.helpForm.mainTableSelector && self.dataSourceName === self.helpForm.primaryTableName && !self.isTreeNavigator) {
                  self.helpForm.mainTableSelector = self;
               }

               def.resolve();

            });

         return def.from(res);
      },

      /**
       * @method getJson
       * @private
       * @description SYNC
       * return the object from json if it is a json else return false
       * @param {string} str
       * @returns {boolean|any}
       */
      getJson: function (str) {
         try {
            if (str === null ||
               str === undefined ||
               str === '') {
               return false;
            }
            if (!str.includes("{")) {
               return false;
            }

            return JSON.parse(str);
         } catch (e) {
            return false;
         }
      },

      enableDisableAllGridControls:function (enable) {
         if (enable) {
            $(this.el).css("pointer-events", "unset")
         } else {
            $(this.el).css("pointer-events", "none")
         }
      }

   };

   window.appMeta.CustomControl("gridx", GridControlX);
}());
