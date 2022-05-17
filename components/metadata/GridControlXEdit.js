/**
 * @module GridControlXEdit
 * @description
 * Manages the graphics and the logic of an html Grid with editing in palce.
 */
(function () {
    var Deferred = appMeta.Deferred;
    var GridControlX = appMeta.CustomControl("gridx");
    var directionScoll = {
        none: 0,
        up: 1,
        down: 2
    };

    /**
     * @constructor GridControlXEdit
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
    function GridControlXEdit(el, helpForm, table, primaryTable, listType) {
        GridControlX.apply(this, [el, helpForm, table, primaryTable, listType]);
    }

    GridControlXEdit.prototype = _.extend(
        new GridControlX(), {

            constructor: GridControlXEdit,

            superClass: GridControlX.prototype,

            init: function () {
                this.superClass.init.call(this);

                this.rowInPag = 200;
                this.rowGroupedInPag = 10;
                this.currPage = 0;
                this.loadedGroup = [];
                this.loadedRowsIndex = [];
                this.lastScrollLeft = 0;
            },

            /**
             * @method redrawGridForGrouping
             * @private
             * @description SYNC
             * redraws the grid, based on grouping.
             * @param {GridControlX} that
             */
            redrawGridForGrouping: function (that, append, upDown, actualTop) {
                // per ora funziona con un raggruppamento solo
                var rows = that.gridRows;
               /* if (!rows.length) {
                    return;
                }*/

                // rimuovo tutto, ricreo un mytable, per questioni di performance appendo al nuovo mytable al termine
                if (!append) {
                    that.loadedGroup = [];
                    that.loadedRowsIndex = [];
                    that.currPage = 0;
                    if (that.mytable) {
                        that.mytable.off("scroll", _.partial(that.scrollList, that));
                        that.mytable.parent().remove();
                    }
                    that.mytable = $('<table class="table" border="1" style="position:relative; display: block; overflow-y: scroll; max-height: 700px">');
                    that.mytable.on("scroll", _.partial(that.scrollList, that));
                }

                // calcolo raggruppamento per quella specifica colonna.
                // torna ob con chiave colonna , e valore array di rows
                // col1: [a,b,c]
                // col2: [d,e,f]
                //console.log("pre group " + appMeta.logger.getTimeMs());
                var objGrouped = that.calcObjGrouped(rows, that.columnsGrouped);
                //console.log("post group " + appMeta.logger.getTimeMs());

                // ho calcolato nuove colonne nell'header e le inserisco
                if (!append) {
                    that.addHeaders();
                }

                var addEvents = false;
                // console.log("pre render" + appMeta.logger.getTimeMs());
                if (_.isArray(objGrouped)) {

                    if (append && objGrouped.length <= that.rowInPag) {
                        return;
                    }
                    // creo struttura di righe raggruppate. passo 1 come livello di raggruppamento, poi nella ricorsione aumenterò
                    // console.log("pre render " + appMeta.logger.getTimeMs());
                    // appendo al mytable tutta la stringa html
                    var rowsToLoad = _.filter(objGrouped, function (row, index) {
                        if ((index >= that.currPage * that.rowInPag) &&
                            (index < (that.currPage * that.rowInPag) + that.rowInPag)) {
                            if (that.loadedRowsIndex.includes(index)) {
                                return false;
                            }
                            that.loadedRowsIndex.push(index);
                            return true;
                        }
                    });

                    if(rowsToLoad && rowsToLoad.length > 0) {
                        addEvents = true;
                        that.mytable.append(that.createRowsFromObjgrouped(rowsToLoad, 1, null));
                    }
                } else {

                    var numeroGruppi = Object.keys(objGrouped).length;
                    var counterRow = 0;
                    var gruppi = {};
                    console.log("numeroGruppi " + numeroGruppi);
                    // trovo gruppi da visualizzare.
                    _.forEach(objGrouped, function (k, a) {
                        if ( that.loadedGroup.includes(a)) {
                            return true;
                        }
                        // almeno 50 righe
                        if (counterRow < 50) {
                            counterRow += objGrouped[a].group.length;
                            gruppi[a] = objGrouped[a];
                            that.loadedGroup.push(a);
                        }
                    });

                    console.log('appendo gruppi ' + Object.keys(gruppi).length + ' ' + appMeta.logger.getTimeMs());

                    if (Object.keys(gruppi).length > 0) {
                        if (!upDown || upDown === directionScoll.up || upDown === directionScoll.none) {
                            addEvents = true;
                            that.currTrAppended = that.createRowsFromObjgrouped(gruppi, 1, null);
                            that.mytable.append(that.currTrAppended);
                        }
                    }
                }

                //console.log("post render" + appMeta.logger.getTimeMs());
                if (!append) {
                    var $tableCont = $('<div class="tableCont">');
                    $tableCont.append(that.mytable);
                    $(that.el).prepend($tableCont);
                    $($tableCont).insertAfter($(that.$groupingArea));
                }

                if (!rows.length) that.addTableEmptyRow();

                if ( addEvents) {
                    // aggiungo eventi alle righe
                    that.addMyEvents();
                }

                // rimetto scroll dove era
                actualTop = actualTop || 0;
                that.mytable.scrollTop(actualTop);
            },

            rowDblClick: function (that) {
                return Deferred("rowDblClick").resolve();
            },

            scrollList: function (that, ev) {

                var sl = $(this).scrollLeft();
                $(".gx-td-grouped-cell").css("padding-left", sl + 10);

                if (that.disableScroll) {
                    that.disableScroll = false;
                    return;
                }

                // se è scroll orizzontale non faccio nulla
                var documentScrollLeft = $(this).scrollLeft();
                if (that.lastScrollLeft !== documentScrollLeft) {
                    that.lastScrollLeft = documentScrollLeft;
                    return;
                }

                var outerHeight = $(this).outerHeight();
                var top = $(this).scrollTop();
                var scrollHeight = $(this).prop('scrollHeight');
                if (outerHeight + top >= scrollHeight) {
                    that.currPage++;
					that._scroll(that, directionScoll.up, top);
                    return
                }

                if (top <= 0 && that.currPage > 0) {
                    that.currPage--;
					// that._scroll(that, directionScoll, top);
                }
            },

			_scroll: function (that, upDown, actualTop) {
                if (!that.scrollRefrershRunning) {
                    // evita lancio scroll multipli
                    that.scrollRefrershRunning = true;
                    // ---> disabilito html
                    $(that.mytable).addClass("gridLoaderScroll");
                    setTimeout(function () {
                        that.redrawGridForGrouping(that, true, upDown, actualTop);
                        // --> riabilito html
                        $(that.mytable).removeClass("gridLoaderScroll");
                        that.scrollRefrershRunning = false;
                    }, 100);
                }
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

                // caso in cui cambia riga padre, riparto da prima pagina
                if (this.parentCurrentRow &&
                    this.metaPage &&
                    this.parentCurrentRow !== this.metaPage.currentRow) {
                    this.currPage = 0;
                }
                if (!this.parentCurrentRow) {
                    this.currPage = 0;
                }
                if (this.metaPage) {
                    this.parentCurrentRow =  this.metaPage.currentRow;
                }

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

                        // azioni dopo la selzione dell'indice giusto sulla griglia
                        return self.setRow(self.currentRow, propagate);

                    });

                return def.from(res).promise();

            },


        });

    appMeta.CustomControl("gridxedit", GridControlXEdit);
}());
