/**
 * @module GridControl
 * @description
 * Manages the graphics and the logic of an html Grid
 */
(function () {

    var GridControlX = appMeta.CustomControl("gridx");
    var Deferred = appMeta.Deferred;
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
    function GridControlXScrollable(el, helpForm, table, primaryTable, listType) {
        GridControlX.apply(this, [el, helpForm, table, primaryTable, listType]);
    }

    GridControlXScrollable.prototype =  _.extend(
        new GridControlX(),
        {
            constructor: GridControlXScrollable,
            superClass: GridControlX.prototype,

            init:function() {
                this.superClass.init.call(this);
                this.trBefore = undefined;
                this.forceBtnGroupOnHeader = true;
            },

            /**
             * @method redrawGridForGrouping
             * @private
             * @description SYNC
             * redraws the grid, based on grouping.
             * @param {GridControlX} that
             * @param {boolean} destroy. in some case. sort or group the grid have to redrawed. not append
             */
            redrawGridForGrouping: function (that, destroy) {
                // per ora funziona con un raggruppamento solo

                var rows = that.gridRows;
                if (rows.length > 10) $(that.el).css('height', '462px');

                var objGrouped = that.calcObjGrouped(rows, that.columnsGrouped);

                // rimuovo tutto, ricreo un mytable, per questioni di performance appendo al nuovo mytable al termine
                if (!that.mytable || destroy) {
                    that.trBefore = undefined;
                    if (that.mytable) that.mytable.parent().remove();
                    that.mytable = $('<table class="table" border="1" style="position:relative">');

                    // ho calcolato nuove colonne nell'header e le inserisco
                    that.addHeaders();

                    that.createRowsFromObjgrouped(objGrouped, 1, null, null);

                    that.tableCont = $('<div class="tableCont">');
                    that.tableCont.append(that.mytable);
                    $(that.el).prepend(that.tableCont);
                    $(that.tableCont).insertAfter($(that.$groupingArea));

                } else {
                    that.createRowsFromObjgrouped(objGrouped, 1, null);
                }

                // aggiungo eventi alle righe
                that.addMyEvents();
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

                if (this.trBefore) return $(this.trBefore).before($tr);
                this.mytable.append($tr);
            },

            /**
             * Set the tr id, where control have to append the rows
             * @param {string} trId. the html id
             */
            setTrBefore: function (trId) {
                this.trBefore = trId;
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
                // distinguo il doppio click s è o meno gestito come treeNavigator
                return Deferred("rowDblClick")
                    .from(that.rowClick
                        .call(this, that, false)
                        .then(function () {
                            // solamente se è definito
                            if (that.metaPage.rowDblClick) {
                                var row = $(self).data("mdldatarowlinked"); // self era il this ovvero , l'elemento cliccato
                                that.metaPage.rowDblClick(that, that.dataTable, row);
                            }
                        }));
            },

        });

    appMeta.GridControlXScrollable = GridControlXScrollable;
}());
