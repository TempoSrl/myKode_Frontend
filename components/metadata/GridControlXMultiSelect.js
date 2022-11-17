/**
 * @module GridControlXMultiSelect
 * @description
 * Manages the graphics and the logic of an html GridControlXMultiSelect
 * This control permits to select one or more row with checkbox
 * Before opening the metapage child it creates the row and propagates the fields of the parent row on the child
 */
(function () {
    var cssDefault = appMeta.cssDefault;
    var GridControlX = appMeta.CustomControl("gridx");
    var locale = appMeta.localResource;
    /**
     * @constructor GridControlXMultiSelect
     * @description
     * Initializes the html grid control
     * @param {Html node} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table this is the table corresponding to the tableName configured in the tag at the position 0
     * (see function HelpForm.preScanCustomControl for the initialization)
     * @param {DataTable} primaryTable
     * @param {string} listType if it is called by in a listmanager, listType is passed
     * Contains all data of a grid
     */
    function GridControlXMultiSelect(el, helpForm, table, primaryTable, listType) {
        GridControlX.apply(this, [el, helpForm, table, primaryTable, listType]);
    }

    GridControlXMultiSelect.prototype =  _.extend(
        new GridControlX(),
        {
            constructor: GridControlXMultiSelect,
            superClass: GridControlX.prototype,

            init:function() {
                this.superClass.init.call(this);
                this.mdlwcheckboxColumn = "mdlwcheckboxColumn";
                this.rowSelectedDict = {};
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
                var cols = this.superClass.getOrderedColumns.call(this, dataTable);
                // aggiungo in prima posizione colonna checkbox
                cols.unshift(new jsDataSet.DataColumn(this.mdlwcheckboxColumn, "string"));
                return cols
            },

            /**
             * @method addTablecolumns
             * @private
             * @description SYNC
             * Adds the columns for the field of the table to show
             */
            addTablecolumns:function($tr) {
                var self  = this;

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

                _.forEach(cols, function (c, index) {
                        var thid = appMeta.utils.getUniqueId();
                        var $th;

                        // se si tratta dellaprima colonna nel grouping allora non la faccio draggable nè mettò l'ordinamento
                        if (c.isFirsGrouping) {
                            $th = $('<th id="' + thid + '">');
                        } else {
                            // aggiungo data-mdlcolumnname, serve per individuare la colonna da invertire quando le sposto con drag n drop
                            $th = $('<th draggable="true" id="' + thid + '" data-mdlcolumnname="' + c.name.replace("!", "") + '">');
                            $th.on("dragstart", _.partial(self.dragHeaderColumn, self, c));
                        }

                        // lego la colonna al th per ildrop e successivo spostamento della colonna
                        $th.data("mdlcolumn", c);
                        // tohide è calcolato in base alle opzioni del popup
                        var caption = (c.caption || c.name);
                        if (c.name === self.mdlwcheckboxColumn) caption = "";
                        self.addChildElement($tr, $th, caption);
                        // nel caso della prima colonna checkbox non metto header

                        if (c.name === self.mdlwcheckboxColumn) {
                            self.$checkboxAll = $('<input type="checkbox" class="big-checkbox">');
                            self.$checkboxAll.on("change", _.partial(self.selUnsAll, self ));
                            self.$checkboxAll.data("mdlallcheckbozes", true);
                            $th.append(self.$checkboxAll);
                            $th.width("30px");
                        } else {
                            // non emtto sort su colonna checkbox all
                            $th.on("click", _.partial(self.sortColumnClick, self, c));

                            if (c.tohide) $th.hide();

                            // se devo mettere sort e se non è la prima colonna del grouping
                            if (!self.isNotSort && !c.isFirsGrouping) {
                                var $sortIcon;
                                // se è ordinata per default metto icona bianca
                                if (colSorting[c.name]) {
                                    if (c.mdlw_sort === "desc"){
                                        $th.text( $th.text() + "   ↓");
                                    } else {
                                        $th.text( $th.text() + "   ↑");
                                    }
                                }
                            }
                        }

                        // sul mobile inserisco bottoncino su header per il grouping.
                        // non aggiungo se è la colonna notevole gruppo, e se è impostato che non deve essere visibile il grouping
                        if ((appMeta.currApp.isMobile || self.forceBtnGroupOnHeader) && !c.isFirsGrouping && !this.excludeGroup) {
                            var $groupIcon = $('<i class="fas fa-poll-h" style="color:grey; margin-left: 6px">');
                            var $span = $('<div style="padding:5px; float:right; cursor: pointer; display: contents">');
                            $span.on("click", _.partial(self.dropColumnEv, self, c));
                            self.addChildElement($th, $span, '');
                            self.addChildElement($span, $groupIcon, '');
                        }

                    });
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
                        that.onCheckBoxChange.call(this, that);
                    });
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
            addStandardCell:function ($tr, objRow, column) {
                var self = this;
                var value = this.getFormattedValue(objRow, column);
                var columnStyle = cssDefault.getColumnsAlignmentCssClass(column.ctype);
                // a seconda se è un json o stringa semplice formatto la cella
                var jsonObj = this.getJson(value);
                var $td = $('<td style="user-select: none" nowrap data-mdlcolumnname="' + column.name.replace("!", "") + '" >');
                if (column.name === this.mdlwcheckboxColumn){
                    // applico lo stile
                    var $td = $('<td style="user-select: none; text-align: center; vertical-align: middle;" nowrap>');
                    $td.addClass(columnStyle);
                    var $checkbox  =  $('<input type="checkbox" class="big-checkbox">');
                    $checkbox.on("change", _.partial(this.onCheckBoxChange, this));
                    $checkbox.data("mdlrowattached", objRow.getRow());
                    self.addChildElement($tr, $td);
                    self.addChildElement($td, $checkbox);
                } else {
                    if (!!jsonObj) {
                        var $tableCell = $('<table class="table table-in-cell">');
                        _.forEach(Object.keys(jsonObj), function (k) {
                            var $tr1 = $('<tr class="table-in-cell-tr">');
                            var $td3 =  $('<td>');
                            $td3.html(k + ": " + jsonObj[k]);
                            $tr1.append($td3);
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
                }
            },

            /**
             * Seleziona/Deseleziona aggiungendo nella dictionary
             * @param {GridControlXMultiSelect} that
             */
            onCheckBoxChange: function(that) {
                var checked = !!$(this).is(":checked");
                var row = $(this).data("mdlrowattached");
                if (!row) return;
                var rowkey = that.getRowkey(row);

                // aggiungo o tolgo dalla dict delle righe selzionate
                if (that.rowSelectedDict[rowkey] && (!checked)) {
                    delete that.rowSelectedDict[rowkey];
                }
                if (!that.rowSelectedDict[rowkey] && checked) {
                    that.rowSelectedDict[rowkey] = row;
                }

                $(that.countElement).html(locale.selectedRows + ": " + Object.keys(that.rowSelectedDict).length);
            },

            /**
             * torna una stringa, con la chiave della riga
             * @param row
             * @returns {*}
             */
            getRowkey:function (row) {
                return _.map(this.dataTable.key(), function (k) {
                    return row.current[k];
                }).join(",");
            }

        });

    appMeta.CustomControl("gridxmultiselect", GridControlXMultiSelect);
}());
