/**
 * @module GridControlXChild
 * @description
 * Manages the graphics and the logic of an html GridControlXChild
 * This control permits to put on a cell the values of child table.
 * I read an array of { tablename:String, edittype:String, columnlookup:String, columncalc:String}
 * It put an add button, to create a child row
 * and open the page tablename_edittype. the row created is added on the dataset. On the cell row added is shown with blue, if deleted with red color.
 * Before to open the metapage child it creates the row and propagates the fields of the parent row on the child
 */
(function () {
    var localResource = appMeta.localResource;
    var dataRowState = jsDataSet.dataRowState;
    var GridControlX = appMeta.CustomControl("gridx");
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
    function GridControlXChild(el, helpForm, table, primaryTable, listType) {
        GridControlX.apply(this, [el, helpForm, table, primaryTable, listType]);
    }

    GridControlXChild.prototype =  _.extend(
        new GridControlX(),
        {
            constructor: GridControlXChild,
            superClass: GridControlX.prototype,

            init:function() {
                this.superClass.init.call(this);
                // leggo info su colonne speciali child
                this.childTables =  $(this.el).data("childtables");
                // leggo conf sulla visibilità dei bottoni di editing del child.
                this.isEditToShow =  this.helpForm.existsDataAttribute(this.el, "childtablesedit") ? $(this.el).data("childtablesedit") : true;
                this.isDeleteToShow =  this.helpForm.existsDataAttribute(this.el, "childtablesdelete") ? $(this.el).data("childtablesdelete") : true;
                this.isAddToShow =  this.helpForm.existsDataAttribute(this.el, "childtablesadd") ? $(this.el).data("childtablesadd") : true;
                this.defDescribedColumn = this.getDescribeColumns();
            },

            getDescribeColumns:function() {
                // la descr column in questo caso è quella della tabella più tabelle "nipoti"
                var descrColArrayDef = [];
                descrColArrayDef.push(this.meta.describeColumns(this.dataTable, this.listType));
                var DS = this.table.dataset;
                _.forEach(this.childTables, function (obj) {
                    var dataTable = DS.tables[obj.tablename];
                    var meta = appMeta.getMeta(dataTable.tableForReading());
                    var listType = obj.listType || obj.edittype;
                    descrColArrayDef.push(meta.describeColumns(dataTable, listType));
                });
                return $.when.apply($, descrColArrayDef);
            },

            /**
             * @method addValuesCells (overridden)
             * @public
             * @description SYNC
             * Adds the value inside the cell for a specific <tr> element
             * @param {html node} $tr
             * @param {ObjectRow} objRow
             */
            addValuesCells:function($tr, objRow) {
                var self = this;
                _.forEach(this.getColsToInsert(),
                    function (column) {
                        // recupero colonna se fa parte delle colonne speciali child
                        var calcChildObj = _.find(self.childTables, function (obj) {
                            return obj.columncalc === column.name;
                        });
                        // se la colonna fa parte di quelle speciali allora eseguo un fill diverso
                        if (calcChildObj) return self.addCustomCell(calcChildObj, $tr, objRow, column);
                        self.addStandardCell($tr, objRow, column);
                    });
            },

            /**
             * @method addForChildcolumnsEv
             * @private
             * @description ASYNC
             * Open the page for childTable + childTableListType.
             * @param {GridControlXChild} that
             * @param {ObjectRow} rowChild
             * @param {Object} calcChildObj  = { tablename:String, edittype:String, columnlookup:String, columncalc:String}
             */
            addForChildcolumnsEv:function(that, rowChild, calcChildObj) {
                var mp =  that.metaPage;
                var waitingHandler = null;
                var childTable = mp.state.DS.tables[calcChildObj.tablename];
				var meta = appMeta.getMeta(calcChildObj.tablename);
				meta.setDefaults(childTable);
                meta.getNewRow(null, childTable)
                    .then(function (rowToInsert) {

                        var rels = mp.state.DS.getParentChildRelation(that.dataSourceName, calcChildObj.tablename);

                        if (!rels.length) {
                            console.log("relation between " + that.dataSourceName + " and " + calcChildObj.tablename + " not found");
                            return false;
                        }

                        // assegna tutte le colonne prese dalla relazione alla riga child creata
                        _.assign(rowToInsert.current, _.pick(rowChild, _.split(rels[0].parentCols, ",")));

                        mp.state.editedRow = rowToInsert;
						return mp.edit(calcChildObj.tablename, calcChildObj.edittype, true);
                    }).then(function (dialogResult) {
                        if (!dialogResult) {
                            mp.state.editedRow.del(); // viene da un getNewRow, quindi è un DataRow, lo elimino, perchè precedentemnte aggiunto
                            return;
                        }
                        mp.entityChanged = true;
                        appMeta.metaModel.getTemporaryValues(childTable);
                        // rileggo ds.
                        waitingHandler = mp.showWaitingIndicator(localResource.modalLoader_wait_page_update);
                       return  mp.reFillControls();
                    }).then(function () {
                        mp.hideWaitingIndicator(waitingHandler);
                    })
            },

            /**
             * @method deleteForChildColumnsEv
             * @private
             * @description ASYNC
             * Delete child embedded on column. Called by edit button on child row
             * @param {GridControlXChild} that
             * @param {ObjectRow} childRow
             * @param {Object} calcChildObj  = { table:String, edittype:String, columnlookup:String, columncalc:String}
             * @param {Array} spanArray. array of html <span>
             */
            deleteForChildColumnsEv:function(that, childRow, calcChildObj, spanArray) {
                var msg  = childRow[calcChildObj.columnlookup];
                var jsonObj = that.getJson(childRow[calcChildObj.columnlookup]);
                if (!!jsonObj) {
                    msg  =_.reduce(Object.keys(jsonObj), function (acc, k) {
                            acc += k + ": " + jsonObj[k] + "<br>";
                            return acc;
                    }, "");
                }

                that.metaPage.showMessageOkCancel(localResource.getPressSaveAfterDelete(msg))
                    .then(function (res) {
                        if (res) {
                           childRow.getRow().del();
                           that.setCssCell(childRow, spanArray);
                        }
                    });
            },

            /**
             * @method editForChildColumnsEv
             * @private
             * @description ASYNC
             * Open a metaPage child for editing childRow. Called by edit button on child row
             * @param {GridControlXChild} that
             * @param {ObjectRow} childRow
             * @param {Object} calcChildObj  = { table:String, edittype:String, columnlookup:String, columncalc:String}
             */
            editForChildColumnsEv:function(that, childRow, calcChildObj) {
                var mp =  that.metaPage;
                var waitingHandler = null;
                var childTable = mp.state.DS.tables[calcChildObj.tablename];
                mp.state.editedRow = childRow.getRow();
                mp.edit(calcChildObj.tablename, calcChildObj.edittype, true)
                    .then(function (dialogResult) {
                        if (dialogResult)  mp.entityChanged = true;
                        appMeta.metaModel.getTemporaryValues(childTable);
                        // rileggo ds.
                        waitingHandler = mp.showWaitingIndicator(localResource.modalLoader_wait_page_update);
                        return  mp.reFillControls();
                    }).then(function () {
                        mp.hideWaitingIndicator(waitingHandler);
                    })
            },

            /**
             * @method addCustomCell
             * @private
             * @description SYNC
             * Add the special td content for special child columns (add edit delete for childrow objRow)
             * @param {Object} calcChildObj  = { tablename:String, edittype:String, columnlookup:String, columncalc:String}
             * @param $tr
             * @param {ObjectRow} objRow
             * @param {DataColumn} column
             */
            addCustomCell:function (calcChildObj, $tr, objRow, column) {
                var self  = this;
                // aggiungo data-mdlcolumnname, serve per individuare la colonna da invertire quando le sposto con drag n drop
                var $td = $('<td style="user-select: none" nowrap data-mdlcolumnname="' + calcChildObj.columncalc.replace("!", "") + '" >');

                // aggiungo tasto "+" e bind alal funzione che si occupwerà di aprire la machera opportuna
                var $addIcon = $('<i class="far fa-plus-square">');
                var $span = $('<div class="grid-child-add-button">');

                this.addToJsonOrNipoti(column.name);

                if (this.isAddToShow) {
                    $span.on("click", _.partial(self.addForChildcolumnsEv, self, objRow, calcChildObj));
                    this.addChildElement($td, $span, '');
                    this.addChildElement($span, $addIcon, '');
                    var $br = $('<br>');
                    this.addChildElement($td, $br, '');
                }


                // recupero le righe figlie di cui mostrare il campo "columnlookup"
                var childRows = objRow.getRow().getChildInTable(calcChildObj.tablename);

                //recupero l'ordinamento
                var meta = appMeta.getMeta(appMeta.currApp.currentMetaPage.state.DS.tables[calcChildObj.tablename].myTableForReading);
                var listType = (calcChildObj.listType || calcChildObj.edittype);
                var sorting = meta.getSorting(listType);
                if (sorting) {
                    var col = sorting.split(' ')[0];
                    childRows = _.sortBy(childRows, [function (o) { return o[col]; }])
                }

                _.forEach(childRows, function (childRow, indexChildRows) {

                    // inserisco tasto delete
                    var $deleteIcon = $('<i class="fa fa-trash">');
                    var div = '<div style="padding-left: 5px; display: inline-block; cursor: pointer;">';
                    var $spanDeleteIcon = $(div);
                    var $spanEditIcon = $(div);
                    var $iconEdit = $('<i class="fa fa-edit">');

                    $spanDeleteIcon.append( $deleteIcon);
                    $spanEditIcon.append( $iconEdit);

                    var $tableCell =  $('<table class="table table-in-cell">');
                    var widthEditcolumns = "30px";
                    // inserisco label, prendendo dalla proprietà configurata "columnlookup". la stringa
                    // potrebbe essere un json. in quel caso mostro in forma tabellare con 1 colonne + 2 dei bottoni
                    var addRowToInternalGrid = function(index, $currTable, caption, value, field, tname, that) {
                        var $tr1 = $('<tr class="table-in-cell-tr">');

                        var $tdDelete =  $('<td>');
                        if (that.isDeleteToShow) {
                            $tdDelete.width(widthEditcolumns);
                            $tr1.append($tdDelete);
                            if (index === 0) $tdDelete.append($spanDeleteIcon);
                        }

                        var $tdEdit =  $('<td>');
                        if (that.isEditToShow) {
                            $tdEdit.width(widthEditcolumns);
                            $tr1.append($tdEdit);
                            if (index === 0) $tdEdit.append($spanEditIcon);
                        }

                        var $td3 =  $('<td class="mdl-cell-child-size-calc">');
                        var str = self.getTextEditingChildCell(caption, value);
                        var display_txt = str ? str.replace(/\n/g, "<br />") : '';
                        $td3.html(display_txt);
                        $tr1.append($td3);

                        if (self.isChildcolToEdit(field, tname)) {
                            $td3.on("click", _.partial(self.clickChildCellForEditChild, self, childRow, caption, value, field, tname, calcChildObj));
                        }

                        $currTable.append($tr1);
                    };

                    // a seconda se è un json o stringa semplice formatto la cella
                   //  var jsonObj = self.getJson(childRow[calcChildObj.columnlookup]);
                    var jsonObj = self.buildObjCellChild(calcChildObj.tablename, childRow);

                    if (!!jsonObj) {
                        _.forEach(Object.keys(jsonObj), function (k, index) {
                            var caption = jsonObj[k].caption;
                            var value = jsonObj[k].value;
                            var tname = jsonObj[k].tname;
                            var field = jsonObj[k].field;
                            addRowToInternalGrid(index, $tableCell, caption, value, field, tname, self)
                        });
                    } else {
                        addRowToInternalGrid(0, $tableCell, '', childRow[calcChildObj.columnlookup], calcChildObj.columnlookup , calcChildObj.tablename, self)
                    }

                    // aggiungo su html bottone delete e stringa
                    $spanDeleteIcon.on("click", _.partial(self.deleteForChildColumnsEv, self, childRow, calcChildObj, [ $tableCell, $spanDeleteIcon, $spanEditIcon]));
                    $spanEditIcon.on("click", _.partial(self.editForChildColumnsEv, self, childRow, calcChildObj));

                    self.setCssCell(childRow,[ $tableCell, $spanDeleteIcon, $spanEditIcon]);
                    $($td).append($tableCell);
                    if (indexChildRows < childRows.length - 1) $($td).append($("<hr>"));
                });


                $($tr).append($td);

                if (column.tohide) $td.hide();
            },

            /**
             * @param field
             * @param tname
             * @returns {boolean}
             */
            isChildcolToEdit:function(field, tname)  {
                // Abilitare quando faremo edit in place delle colonne nipoti
                return false;
            },

            clickChildCellForEditChild:function(that, childrow, caption, value, field, tname, obj) {

                if (that.tdChildEditing) {
                    $(that.tdChildEditing).html(that.tdChildEditing.oldValue);
                    $(that.tdChildEditing).data("mdlediting", false);
                    that.tdChildEditing = null;
                    return;
                }

                that.tdChildEditing = this;
                $(that.tdChildEditing).html(caption);
                that.tdChildEditing.oldValue = that.getTextEditingChildCell(caption, value);

                // creo input editabile
                var id = appMeta.utils.getUniqueId();

                var inputObj = $("<input type='text' id=" + id + "/>");

                inputObj.width($(this).width())
                    .height($(this).height())
                    .css({border: "0px", fontSize: "17px"})
                    .val(value)
                    .appendTo($(this))
                    .trigger("focus")
                    .trigger("select");

                // se premo qualceh tasto inovco evento. su invio effettuo modifica del valore sulla riga
                inputObj.on("keyup", _.partial(that.keyupeditinplaceChild, tname, field, caption, value, childrow, that));

                inputObj.click(function () {
                    return false;
                });

                // se è una colonna data, inserisco calendario
               /* var dc = self.dataTable.columns[colname];
                if (dc.ctype === 'DateTime') {
                    inputObj.datepicker({
                        showOn: "focus",
                        onClose: function () {
                            this.focus();
                        }
                    });
                }*/
            },

            getTextEditingChildCell:function(caption, value) {
                return caption ? caption + ': ' + value : value
            },

            keyupeditinplaceChild: function (tname, colname, caption, value, row, that, ev) {
                if (13 === ev.which) { // press ENTER-key
                    var text = $(this).val();

                    // recuperato il valore dalla input lo inserisco sia come testo del grid che come valore sulla riga
                    that.setValueOnDataRowChild(tname, row, colname, text);
                    // esco dall'editing
                    that.resetEditableTdChild(that.getTextEditingChildCell(caption, text))
                }

                if (27 === ev.which) {  // press ESC-key
                    that.resetEditableTdChild(that.getTextEditingChildCell(caption, value))
                }
            },

            resetEditableTdChild: function (text) {
                var self = this;
                setTimeout(function () {
                    $(self.tdChildEditing).html(text);
                    $(self.tdChildEditing).data('mdlediting', false);
                    self.tdChildEditing = null;
                }, 200)
            },

            /**
             *
             * @param {ObjectRow} row
             * @param {string} colname
             * @param {string} text
             */
            setValueOnDataRowChild: function (tname, row, colname, text) {
                var tag = tname + "." + colname;
                this.helpForm.getString(text, colname, row, tag, true);
            },

            /**
             * Return an obj, with key =  {
             *      field;
                    tname;
                    value;
                    caption;
                    }
             * @param tname
             * @param row
             * @returns {*}
             */
            buildObjCellChild:function(tname, row) {

                var formattedDate = function(d) {
                        if (!d) {
                            return "";
                        }
                        var month = String(d.getMonth() + 1);
                        var day = String(d.getDate());
                        var year = String(d.getFullYear());

                        if (month.length < 2) month = '0' + month;
                        if (day.length < 2) day = '0' + day;

                        return day + '/' + month + '/' + year;
                    };

                var formattedBoolean = function(v) {
                   if (!v) {
                       return '';
                   }
                    if (v.toUpperCase('N')) {
                        return appMeta.localResource.no;
                    }
                    if (v.toUpperCase('S')) {
                        return appMeta.localResource.yes;
                    }

                    return v;
                };

                var DS = this.table.dataset;
               // la describeColumns ha descritto le colonne
                return _.chain(
                    //ordina le colonne per il listColPos che sta nella describeColumns
                    _.sortBy(DS.tables[tname].columns, 'listColPos'))
                    //toglie tutte quelle non descritte nella describeColumns
                    .filter(function (field) {
                        return (field.listColPos && field.listColPos !== -1);
                    })
                    .map(function (field) {
                        return field.name;
                    })
                    .filter(function (field) {
                        return row[field] !== undefined && row[field] !== null && row[field] !== '';
                    })
                    // in base alle colonne  costruisce l'oggetto per popolare le celle nipoti
                    .reduce(function (acc, field) {
                        if (!row.getRow) {
                            return acc;
                        }
                        var dc = row.getRow().table.columns[field];

                        var objInfo = {};
                        objInfo.field = field;
                        objInfo.tname = tname;
                        objInfo.value = row[field];
                        objInfo.caption = dc.caption;

                        if (dc.ctype === 'DateTime') {
                            objInfo.value = formattedDate(row[field]);
                        }
                        if (dc.sqltype === 'char' && dc.maxstringlen === 1) {
                            objInfo.value = formattedBoolean(row[field]);
                        }

                        acc[field] = objInfo;
                        return acc;
                    }, {})
                    .value();
            },

            /**
             * @method setCssCell
             * @private
             * @description SYNC
             * Set the color of html controls by row state
             * @param {ObjectRow} objRow
             * @param {Array} spanArray
             */
            setCssCell:function (objRow, spanArray) {
                var color = "red";

                // edit è l'ultimo parametro dei controlli dell'array
                this.showEdit(objRow, spanArray[spanArray.length - 1]);

                if (objRow.getRow) {
                    var state = objRow.getRow().state;
                    if (state === dataRowState.unchanged) return;
                    if (state === dataRowState.added) color = "green";
                    if (state === dataRowState.modified) color = "blue";
                    if (state === dataRowState.deleted) color = "red";
                }

                _.forEach(spanArray, function (span) {
                    $(span).css("color", color);
                });
            },

            /**
             * Show/hide button edit on child, by row state
             * @param {ObjectRow} objRow
             * @param {htmNode} spanEdit
             */
            showEdit:function(objRow, spanEdit) {
               if (!objRow.getRow) {
                   $(spanEdit).css('visibility', 'hidden');
                   return;
               }

               if (objRow.getRow().state === dataRowState.deleted){
                   $(spanEdit).css('visibility', 'hidden');
                   return;
               }

                $(spanEdit).css('visibility', 'visible');
            },

            getGroupedRowGrid:function(key) {
                if (!key) return;
                var obj = this.getJson(key);
                if (obj) {
                    key =  _.map(Object.keys(obj), function (k) {
                                return k + ": " + obj[k];
                            }, "").join("; ");
                }

                return "<span style='font-weight:bold;'>" + key + "</span>";
            }
        });

    appMeta.CustomControl("gridxchild", GridControlXChild);
}());
