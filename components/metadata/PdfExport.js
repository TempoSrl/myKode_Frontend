(function () {
    var jsPDF = jspdf.jsPDF;
    var Deferred = appMeta.Deferred;
    var getData = appMeta.getData;
    var q = window.jsDataQuery;

    /**
     * @constructor PdfExport
     * @description
     * Executes meta page pdf export. fields + grids
     */
    function PdfExport() {
        this.top = 15;
        this.left = 10;
        this.rowSpace = 12;
        this.titleFontSize = 16;
        this.textFontSize = 12;
        this.sheetFormat = 'a4';
        this.firstPage = true;
        this.C_ALL_TABS = 'Tutte';

        this.C_ENABLED = 'Selezionato: SI';
        this.C_DISABLED = 'Selezionato: NO';
        this.C_CAMPO = 'Campo';
        this.C_VALORE = 'Valore';
        this.C_ALLEGATO = 'Allegato';
    }

    PdfExport.prototype = {
        constructor: PdfExport,

        /**
         * SYNC
         * init the doc-pdf object
         */
        initDoc:function() {
            this.doc = new jsPDF('landscape', 'pt', this.sheetFormat);
            this.doc.setFontSize(this.titleFontSize);
        },

        /**
         * SYNC
         * build the html for the modal
         * @returns {string}
         */
        getModalHtml:function() {
           return  "<div class=\"row\">\n" +
                "     <div class=\"col-12 col-md-12\">\n" +
                "              <label for=\"selectSheetFormat\">Seleziona il formato di stampa e le schede da esportare. (a seconda della grandezza delle griglie potrebbe essere utile cambiare formato)</label>\n" +
                "     </div>\n" +
                "  </div>\n" +
                "<div class=\"row\">\n" +
                "   <div class=\"col-5 col-md-5\">\n" +
                "      <label for=\"selectSheetFormat\">Formato</label>\n" +
                "      <select id=\"selectSheetFormat\" name=\"sheetFormat\">\n" +
                "         <option value=\"a0\">A0</option>\n" +
                "         <option value=\"a1\">A1</option>\n" +
                "         <option value=\"a2\">A2</option>\n" +
                "         <option value=\"a3\">A3</option>\n" +
                "         <option value=\"a4\" selected>A4</option>\n" +
                "       </select>\n" +
                "   </div>\n" +
                "   <div class=\"col-7 col-md-7\">\n" +
                "      <label for=\"tabspdfexport\">Seleziona schede da esportare</label>\n" +
                "      <select id=\"tabspdfexport\" multiple=\"multiple\" name=\"tabs\">" +
                "      </select>\n" +
                "   </div>\n" +
                "</div>\n" +
                "<button id=\"btnExportPdf\" type=\"button\" class=\"btn btn-primary p-2 mt-2\" >\n" +
                "<i class=\"fa fa-file-pdf mr-1\" ></i>Esporta in pdf\n" +
                "</button>"
        },

        /**
         * SYNC
         * select deselect options based on the current selected option
         * @param that
         * @param e
         */
        tabspdfexportChanged:function(that, e) {
            if (e.params.data.text === that.C_ALL_TABS) {
                // se scelgo la prima opzione, cioè tutti i tab tolgo tutte le altre opzioni
                $(this).val($("#tabspdfexport option:first").val()).trigger("change");
            } else {
                // rimuovo la condizione all se selezionata
                var selected = $(this).val();
                if (selected.length) {
                    selected = selected.filter(function (opt) {
                        return opt !== that.C_ALL_TABS
                    });
                    $(this).val(selected).trigger("change");
                }
            }
        },

        /**
         * SYNC
         * after html creation, set some properties on the control and the event handlers
         */
        setControls: function() {
            var self = this;
            $("#btnExportPdf").on("click", _.partial(self.doExportPdf, self ));
            $('#selectSheetFormat').select2();
            $('#tabspdfexport').select2();
            $("#" + this.dialogid).find(".select2-search").css("display", "none");
            $('#tabspdfexport').on("select2:select", _.partial(this.tabspdfexportChanged, this));

            // inserisco i tab sulla combo.
            $('#tabspdfexport').each(function(index, row) {
                var ctrl = this;
                var option = "<option>";
                $(ctrl).append($(option).text(self.C_ALL_TABS).val(self.C_ALL_TABS));
                _.forEach(self.tabs, function (tab) {
                    $(ctrl).append($(option).text(tab).val(tab));
                })
            });

            $("#tabspdfexport").val($("#tabspdfexport option:first").val());
        },

        /**
         * PUBLIC ASYNC
         * ask for the pdf export.
         * @param {MetaPage} metaPage
         */
        exportToPdf:function (metaPage) {
            var self = this;
            // this.def = Deferred("PdfExport.exportToPdf");
            this.metaPage = metaPage;

            var waitingHandler = metaPage.showWaitingIndicator('Attendi configurazione export pdf in corso...');

            // osserviamo se c'è un template specifico per questa pagina, infatti filtro per tablename ed edittype
            var filterEdittype = q.eq("apppages_editlistingtype", metaPage.editType);
            if (metaPage.editType.toUpperCase() === 'DEFAULT') {
                filterEdittype = q.isNull('apppages_editlistingtype');
            }
            var filter = q.and(
                q.eq("apppages_tablename", metaPage.primaryTableName),
                filterEdittype
            );
            // leggo valore direttamente
            return appMeta.getData.doReadValue("apppagestemplatedefaultview", filter, "idattach", null)
                .then(function (idAttach) {
                    // ===> se c'è un idattach sulla tabella eseguo export direttamente
                    if (idAttach) {
                        return self.exportToPdfFromTemplate(metaPage, idAttach)
                            .then(function () {
                                metaPage.hideWaitingIndicator(waitingHandler);
                                return true;
                            })
                    }

                    // ===> caso export generico
                    metaPage.hideWaitingIndicator(waitingHandler);
                    return self.doGenericExport();
                });
        },

        /**
         * Open a dialog with aptions to to a genrico pdf export
         * @returns {*}
         */
        doGenericExport:function() {
            var self = this;
            this.def = Deferred("PdfExport.exportToPdf");
            this.calcTabs();
            this.dialogid = "dialogid" + appMeta.utils.getUnivoqueId();
            this.dialogrootelement = $('<div id="' +  this.dialogid + '">');
            var htmlInfo = this.getModalHtml();
            $(this.metaPage.rootElement).append(this.dialogrootelement);

            // apro dialog per scelta del formato
            $("#" + this.dialogid).dialog({
                modal: true,
                autoResize:true,
                width: screen.width * 0.5,
                title: 'Pdf export',
                open: function () {
                    // attacco html
                    $(this).html(htmlInfo);
                    self.setControls();
                },
                close: function(event, ui) {
                    $(this).dialog("close");
                    self.dialogrootelement.remove();
                    self.def.resolve();
                },
                position: { my: "center bottom", at: "center center", of: window }
            });
            return this.def.promise();
        },

        /**
         * SYNC
         * populates collection of tabs in the page
         */
        calcTabs:function() {
            var self = this;
            this.tabs = {};

            // loop sui controlli che hanno il data-tag e popola array di tab, con la stringa
            // così poi la utilizzo come titolo delle varie sezioni nell'export
            $(this.metaPage.rootElement + "  [data-tag]")
                .each(function () {
                    var el = $(this);
                    // prendo name dal titolo del tab
                    var tabPane = $(el).closest('.tab-pane');
                    if (tabPane.length) {
                        var id = tabPane.prop('id');
                        var tab = $('[data-target="#' + id + '"]');
                        if (id &&
                            tab.length &&
                            !self.tabs[id]) {
                            self.tabs[id] = tab.text();
                        }
                    }
                });
        },

        /**
         * SYNC
         * check if element is under an exportable tab
         * @param el
         * @returns {boolean}
         */
        elementInTab:function(el) {
            // array di stringhe
            var tabSelected = $('#tabspdfexport').val();

            if (!tabSelected) {
                return false;
            }

            if (tabSelected.includes(this.C_ALL_TABS)) {
                return true;
            }

            // prendo name dal titolo del tab
            var tabPane = $(el).closest('.tab-pane');

            if (tabPane.length) {
                var id = tabPane.prop('id');
                var dataTarget = $('[data-target="#' + id + '"]');
                if (id && dataTarget.length) {
                    return tabSelected.includes(dataTarget.text());
                }
            }

            return false;
        },

        /**
         * SYNC
         * Build a class with the info of the controls to print pdf
         * @returns {StoreControl}
         */
        buildTabsControls:function() {
            var storeControl = new appMeta.StoreControl();

            var self = this;
            $(this.metaPage.rootElement + "  [data-tag]")
                .each(function () {
                    var el = $(this);
                    var ctrl = $(el).data("customController");
                    var ctrlType = $(el).data("customControl");

                    // stampo solo l'elemento è nei tab selezionati.
                    if (self.elementInTab(el)) {

                        var tabPane = $(el).closest('.tab-pane');
                        var id = tabPane.prop('id');
                        var dataTarget = $('[data-target="#' + id + '"]');
                        var tabKey = dataTarget.text();

                        if (ctrl) {
                            switch (ctrlType) {
                                case 'tachimetro':
                                case 'combo':
                                case 'dropdowngrid':
                                case 'upload':
                                    storeControl.addElementInTab(tabKey, el);
                                    break;
                                case 'gridx':
                                case 'gridxchild':
                                case 'gridxedit':
                                case 'calendar':
                                case 'checklist':
                                    storeControl.addGrid(tabKey, el);
                                    break;
                            }
                        } else {
                            storeControl.addElementInTab(tabKey, el);
                        }
                    }

                });

            return storeControl;
        },

        /**
         * SYNC
         * loop on the built structure and print pdf
         * @param tabs
         */
        printTabs:function(tabs) {
            var self = this;
            _.forEach(tabs, function (tab, tabName) {

                if (tab.elements &&
                    tab.elements.length) {
                    self.printElementsInGrid(tabName, tab.elements)
                }

                if (tab.grids) {
                    _.forEach(tab.grids, function (grid, tabName) {
                        self.printGrid(tabName, grid)
                    });
                }
            });
        },

        /**
         * SYNC
         * print the simple controls to pdf in a grid.
         * @param {string} tabName
         * @param {Array} elements
         */
        printElementsInGrid: function(tabName, elements) {
            var self = this;
            var rows = [];

            this.checkFirstPage();

            self.printRow(tabName);

            // dict di stili style[n] stile per riga n-esima. la chiave è il progressivo
            var styles = {};

            _.forEach(elements, function (el) {

                var ctrl = $(el).data("customController");
                var ctrlType = $(el).data("customControl");
                var row = null;
                if (ctrl) {
                    switch (ctrlType) {
                        case 'tachimetro':
                            var res = self.getRowFromTachimetroCtrl(el);
                            row = res.row;
                            styles[rows.length] = res.style;
                            break;
                        case 'combo':
                            row = self.getRowFromComboCtrl(el);
                            break;
                        case 'dropdowngrid':
                            row = self.getRowFromDropdownCtrl(el);
                            break;
                        case 'upload':
                            row = self.getRowFromUploadCtrl(el);
                            break;
                    }
                } else {
                    row = self.getRowForStandardCtrl(el);
                }

                if (row) {
                    rows.push(row);
                }
            });

            this.doc.autoTable({
                theme: 'grid',
                head: [[self.C_CAMPO, self.C_VALORE]],
                body: rows,
                columns: [
                    {
                        title: self.C_CAMPO,
                        dataKey: self.C_CAMPO
                    },{
                        title: self.C_VALORE,
                        dataKey: self.C_VALORE
                    }
                ],
                startY: self.top,
                didDrawPage: function (d) {
                    // self.top += d.cursor.y + 20;
                },
                didParseCell: function (data) {
                    var key = data.row.index;
                    if (styles[key] && data.row.section === "body") {
                        Object.assign(data.cell.styles, styles[key]);
                    }
                }
            });
        },

        /**
         * SYNC
         * @param {string} tabName
         * @param el
         */
        printGrid: function(tabName, el) {
            var ctrlType = $(el).data("customControl");
            switch (ctrlType) {
                case 'checklist':
                    this.printPdfForChecklistCtrl(tabName, el);
                    break;
                case 'gridx':
                case 'gridxchild':
                case 'gridxedit':
                case 'calendar':
                    this.printGridChildControl(tabName, el);
                    break;
            }
        },

        /**
         * SYNC
         * builds structure, print pdf and save the file.
         * @param that
         */
        doExportPdf:function(that){
            var waitingHandler = that.metaPage.showWaitingIndicator('attendi export pdf in corso');
            that.sheetFormat = $('#selectSheetFormat').val(); // a1, a2 ..etc;

            that.initDoc();

            that.printRow(that.metaPage.name);
            that.printRow('');

            that.doc.setFontSize(that.textFontSize);

            var store = that.buildTabsControls();
            that.printTabs(store.tabs);

            that.resetGlobalVar();

            that.metaPage.hideWaitingIndicator(waitingHandler);
            var fileName = that.metaPage.name.split(/\s+/).join('') + '_' + moment().format('D_MMM_YYYY_HHmm') + '.pdf';
            that.doc.save(fileName);
        },

        /**
         * Reset global var class. Each time that e pdf export is done
         */
        resetGlobalVar: function() {
            this.firstPage = true;
            this.top = 15;
        },

        /**
         * SYNC
         * @param tabName
         * @param el
         */
        printPdfForChecklistCtrl: function(tabName, el) {
            var helpForm = this.metaPage.helpForm;
            var eltag = $(el).data("tag");
            var tag = helpForm.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var tableName = helpForm.getTableName(tag);
            var checklist = $(el).data("customController");
            var dt1 = this.metaPage.state.DS.tables[this.metaPage.primaryTableName];
            var dt2 = this.metaPage.state.DS.tables[tableName];
            var dtMiddle = checklist.getMiddleTable(dt1, dt2);

            var pRel1s = helpForm.DS.getParentChildRelation(dt1.name, dtMiddle.name);
            var pRel2s = helpForm.DS.getParentChildRelation(dt2.name, dtMiddle.name);

            // ese c'è zero o più di una relazione c'è qualche errore di configurazione ed esco
            if (pRel1s.length !==1) {
                return;
            }
            if (pRel2s.length !==1) {
                return ;
            }

            // recupero la relazione dall'array
            var pRel1 = pRel1s[0];
            var pRel2 = pRel2s[0];

            var p1Row = this.metaPage.state.currentRow;

            var pRel1ParentCols = [];
            var PRel1ChildColumns = [];
            var pRel2ParentCols = [];
            var PRel2ChildColumns = [];

            var conditions = [];
            _.forEach(dt2.rows, function (r) {

                _.forEach(pRel1.parentCols, function (cname) {
                    if (dt1.columns[cname]) pRel1ParentCols.push(dt1.columns[cname]);
                });
                _.forEach(pRel1.childCols, function (cname) {
                    if (dtMiddle.columns[cname]) PRel1ChildColumns.push(dtMiddle.columns[cname]);
                });
                _.forEach(pRel2.parentCols, function (cname) {
                    if (dt2.columns[cname]) pRel2ParentCols.push(dt2.columns[cname]);
                });
                _.forEach(pRel2.childCols, function (cname) {
                    if (dtMiddle.columns[cname]) PRel2ChildColumns.push(dtMiddle.columns[cname]);
                });

                //Get Common child row if present
                var par1filter = getData.getWhereKeyClauseByColumns(p1Row.getRow(), pRel1ParentCols, PRel1ChildColumns);
                var par2filter = getData.getWhereKeyClauseByColumns(r.getRow(), pRel2ParentCols, PRel2ChildColumns);
                var par12filter = q.and(par1filter, par2filter);
                // ricorda la select torna le righe  filtrate gia con le non deleted
                var currChilds = dtMiddle.select(par12filter);
                if (currChilds.length) {
                    var condition = dt2.keyFilter(r);
                    conditions.push(condition);
                }
            });

            // devo visualizzare solo le righe selezionate.
            var filter = q.constant(false);
            if (conditions.length) {
                filter = q.or(conditions);
            }
            this.printDataTable(el, dt2.name, filter, tabName);
        },

        /**
         * get an array with 2 elements [key, value] for combo controls
         * (input for autoTable rows)
         * @param el
         * @returns {[]}
         */
        getRowFromComboCtrl:function(el) {
            var row = [];
            var helpForm = this.metaPage.helpForm;
            var eltag = $(el).data("tag");
            var tag = helpForm.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var tableName = helpForm.getTableName(tag);
            var columnName = helpForm.getColumnName(tag);
            var dc = this.metaPage.state.DS.tables[tableName].columns[columnName];
            var optionSelected = $('#' + $(el).attr('id') + ' option:selected');
            var value = '';
            if (optionSelected && optionSelected.length) {
                value = optionSelected.text();
            }
            row.push(dc.caption);
            row.push(value);
            return row;
        },

        /**
         * Retrun an object with 2 key. row an array with campo and value, and an object for the css style of the row
         * @param el
         * @returns {{row:[], style:{fillColor}}}
         */
        getRowFromTachimetroCtrl: function(el) {
            var rowAndStyle = {};
            var row = [];
            var helpForm = this.metaPage.helpForm;
            var eltag = $(el).data("tag");
            var tag = helpForm.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var tableName = helpForm.getTableName(tag);
            var columnName = helpForm.getColumnName(tag);
            var tachimetro = $(el).data("customController");
            var min = tachimetro.min;
            var max = tachimetro.max;
            var th1 = tachimetro.th1;
            var th2 = tachimetro.th2;
            var dc = this.metaPage.state.DS.tables[tableName].columns[columnName];
            var value = '';
            var style = {};
            if (this.metaPage.state.DS.tables[tableName].rows.length) {
                value = this.metaPage.state.DS.tables[tableName].rows[0][columnName];
                if (value) {
                    // calcolo colore
                    var fillColor = tachimetro.red;
                    if (value < th1) {
                        fillColor = tachimetro.green;
                    } else if (value < th2) {
                        fillColor = tachimetro.yellow;
                    }
                    value = new appMeta.TypedObject(dc.ctype, value, eltag).stringValue(eltag) + ' (min:' + min + ' th1: ' + th1 + ' th2: ' + th2 + ' max: ' + max + ')';

                    style.fillColor = fillColor;
                }
            }

            row.push(dc.caption);
            row.push(value);

            rowAndStyle.row = row;
            rowAndStyle.style = style;
            return rowAndStyle;
        },

        /**
         * get  a key: value for dropdownGrid controls
         * @param el
         * @returns {[]}
         */
        getRowFromDropdownCtrl:function(el) {
            var row = [];
            var helpForm = this.metaPage.helpForm;
            var eltag = $(el).data("tag");
            var tag = helpForm.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var tableName = helpForm.getTableName(tag);
            var columnName = helpForm.getColumnName(tag);
            var rows = this.metaPage.state.currentRow.getRow().getParentsInTable(tableName);
            var value = '';
            if (rows.length) {
                value = rows[0][columnName];
            }

            row.push($(el).parent().parent().find('label').text());
            row.push(value);
            return row;
        },

        /**
         * get  a key: value for upload control (used for attachment)
         * @param el
         */
        getRowFromUploadCtrl:function(el) {
            var row = [];
            var helpForm = this.metaPage.helpForm;
            var eltag = $(el).data("tag");
            var tag = helpForm.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var columnName = helpForm.getColumnName(tag);
            var value = '';
            var ctrl = $(el).data("customController");
            var attachTableName = ctrl.getTableAttachName();
            var idAttach = this.metaPage.state.currentRow[columnName];
            var rowsReferenced = this.metaPage.state.DS.tables[attachTableName].select(q.eq(ctrl.idAttachColumnName, idAttach ));
            if (rowsReferenced.length) value = ctrl.getOriginalFileName(rowsReferenced[0][ctrl.fileNameColumnName]);
            row.push(this.C_ALLEGATO);
            row.push(value);
            return row;
        },

        /**
         * print grid with grid child nested
         * @param {string} tabName
         * @param el
         */
        printGridChildControl: function(tabName, el) {
            var eltag = $(el).data("tag");
            // aggiungo nuovo foglio
            var helpForm = this.metaPage.helpForm;
            var tableName = helpForm.getField(eltag, 0);
            this.printDataTable(el, tableName, null, tabName);
        },

        /**
         * based on the tab or page where the grid is hosted get the title
         * @param el
         * @returns {string|jQuery}
         */
        getTableTitle: function (el) {
            var custom_lng_div = $(el).parent().find(".custom_lng_div");
            // vedo se c'è un div con traduzione, cioè un grid affogato nella pag
            if (custom_lng_div.length) {
                return custom_lng_div.text()
            }

            // prendo name dal titolo del tab
            var tabPane = $(el).closest('.tab-pane');
            if (tabPane.length) {
                var id = tabPane.prop('id');
                var dataTarget = $('[data-target="#' + id + '"]');
                if (id && dataTarget.length) {
                    return dataTarget.text()
                }
            }

            return null;
        },

        /**
         * check if is the first page to print, otherwise add a new page
         */
        checkFirstPage: function (){
            if (this.firstPage) {
                this.firstPage = false;
                return;
            }

            this.doc.addPage(this.sheetFormat, 'landscape');
            this.top = 15;
        },

        /**
         *
         * @param el
         * @param tableName
         * @param filterRows
         * @param tabName
         */
        printDataTable: function (el, tableName, filterRows, tabName) {
            var self = this;
            this.checkFirstPage();
            this.left = 40;
            var dataTable = self.metaPage.state.DS.tables[tableName];
            var tname = dataTable.tableForReading();

            var title = self.getTableTitle(el);

            this.printRow(title || tabName);

            // torna array di datacolum che sono le colonne visibili
            var getDataColumnsFromTable = function (tname) {
                var dataTable = self.metaPage.state.DS.tables[tname];
                return _.sortBy(
                    _.filter(dataTable.columns,
                        function (c) {
                            if (!c.caption) return false;
                            if (c.caption === "") return false;
                            if (c.caption.startsWith(".")) return false;
                            if (c.listColPos === -1) return false;
                            return true;
                        }),
                    'listColPos');
            };

            var getJson = function (str) {
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
            };

            var cleanValue = function (v) {
                if (v === null || v === undefined) {
                    return ''
                }
                return v.toString().replace(/<tr class='table-in-cell-tr' >/g, '')
                    .replace(/<td class='table-in-cell-td' >/g, '')
                    .replace(/<b>/g, '')
                    .replace(/<\/b>/g, '')
                    .replace(/<\/td>/g, '')
                    .replace(/<\/tr>/g, '')
                    .replace(/<\/table>/g, '');
            };

            // torna array di array, in cui l'elemento sono i valori della riga
            var getRowsFromTable = function (tname, filter) {
                var dataBody = [];
                var rows = self.metaPage.state.DS.tables[tname].rows;
                if (filter) {
                    rows = self.metaPage.state.DS.tables[tname].select(filter);
                }

                var childTables =  $(el).data("childtables");

                _.forEach(rows, function (row) {
                    var myRow = [];
                    var cols = getDataColumnsFromTable(tname);

                    _.forEach(cols, function (col) {
                        var value = row[col.name] !== null && row[col.name] !== undefined ? row[col.name] : '';

                        // =======> vedo se si tratta di colonna nipote

                        var childTable = _.find(childTables, {columncalc : col.name});
                        if (childTable) {
                            var tname = childTable.tablename;
                            var childRows = row.getRow().getChildInTable(tname);
                            var arrChild = [];
                            _.forEach(childRows, function (row, index) {
                                var cols = getDataColumnsFromTable(tname);
                                _.forEach(cols, function (col) {
                                    var value = row[col.name] !== null && row[col.name] !== undefined ? row[col.name] : '';
                                    if (col.ctype === "DateTime" && value) {
                                        value = value.getDate().toString() + '/' +value.getMonth().toString() + '/' + value.getFullYear().toString()
                                    }
                                    if (value) {
                                        value = cleanValue(value);
                                        arrChild.push(col.caption + ": " + value);
                                    }
                                });
                                // ultima riga non mettere a capo
                                if (index < childRows.length - 1) {
                                    // crea spaziatura tra righe child. esempio:
                                    // riga 1 child
                                    //
                                    // riga 2 child
                                    arrChild.push("\n");
                                }
                            });

                            myRow.push(arrChild.join("\n"));
                            return true;
                        }

                        // Caso data

                        if (col.ctype === "DateTime" && value) {
                            value = value.getDate().toString() + '/' +value.getMonth().toString() + '/' + value.getFullYear().toString()
                        }

                        // ===> Caso json in cella

                        var jsonObj = getJson(value.toString());
                        if (jsonObj) {
                            var textFromJson = [];
                            _.forEach(Object.keys(jsonObj), function (k) {
                                if (typeof jsonObj[k] === 'object') {
                                    for (var key in jsonObj[k]) {
                                        textFromJson.push(key + ": " + jsonObj[k][key]);
                                    }
                                } else {
                                    textFromJson.push(k + ": " + jsonObj[k]);
                                }
                            });
                            myRow.push(textFromJson.join("\n"));
                        } else {
                            value = cleanValue(value);
                            myRow.push(value.toString()); // toString altrimenti non stampa i numeri
                        }

                    });

                    dataBody.push(myRow);
                });

                return dataBody;
            };

            var maincols = getDataColumnsFromTable(tableName);

            this.doc.autoTable({
                    theme: 'grid',
                    head: [maincols.map(function (c) {return c.caption})],
                    body: getRowsFromTable(tableName, filterRows),
                    columns: maincols.map(function (c) {
                        return {
                            title: c.caption.split(/\s+/).join(''),
                            dataKey: c.name
                        }
                    }),
                    startY: self.top,
                    didDrawPage: function (d) {
                       // self.top += d.cursor.y + 20;
                    },
                    didParseCell:function (dataEvent) {
                        var rows = dataEvent.table.body;
                        // altezza righe dinamica in base al contenuto delle colonne nipoti
                        if (dataEvent.row.section === 'body') {
                            // dataEvent.row.height = 300
                        }
                    },

                    // ===============================================================================================================
                    // ====> NON utilizzato. serviva per creare tabella dentro la cella, ma il contenuto usciva se era troppo grande
                    // inoltre l'altezza doveva essere calcolata dinamicamente in base alle righe child
                    // ================================================================================================================
                    /* didDrawCell: function (data) {
                         var childTables =  $(el).data("childtables");
                         // dataKey è il nome della colonna, che ritrovo su columncal
                         // data.column.raw è un obj con titel: e dataKey


                         // disabilitato l'ho gesto sopra, direttamente creando una cella
                         if (data.cell.section === 'body' && false) {
                             // data.cell.styles.minCellHeight
                             data.cell.width = 400;
                             // vedo se la colonna corrente è child
                             var childTable = _.find(childTables, {columncalc : data.column.dataKey});
                             if (childTable) {

                                 var tname = childTable.tablename;

                                 // recupero la relazione
                                 var childRel = _.find(self.metaPage.state.DS.tables[tableName].childRelations(), {childTable: tname});

                                 // prendo riga e colonna corrente, così individuo la cella
                                 // var valueInCell = data.row.cells[data.column.dataKey].raw;

                                 // recupero la riga padre
                                 var currRow = self.metaPage.state.DS.tables[tableName].rows[data.row.index];
                                 var childFilter = childRel.getChildFilter(currRow);

                                 var childcols = getDataColumnsFromTable(tname);
                                 data.row.height = 200;

                                 var childRows = currRow.getRow().getChildInTable(tname);
                                 var arrChild = [];
                                 _.forEach(childRows, function (row) {
                                     var cols = getDataColumnsFromTable(tname);
                                     _.forEach(cols, function (col) {
                                         var value = row[col.name] !== null && row[col.name] !== undefined ? row[col.name] : '';
                                         if (col.ctype === "DateTime" && value) {
                                             value = value.getDate().toString() + '/' +value.getMonth().toString() + '/' + value.getFullYear().toString()
                                         }
                                         if (value) {
                                             arrChild.push(col.caption + ": " + value);
                                         }
                                     });
                                 });

                                 self.doc.text(arrChild.join("\n"), data.cell.x + 5, data.cell.y + 10);

                                 // => disegna una tabella dentor la cella. non più utilizzato, perchè non gestiva bene lo spazio
                                 // è stata sostoituita con una cella il cui valore è un testo chiave: valore separati da ritorni a capo.
                                 /!*self.doc.autoTable({
                                     startY: data.cell.y ,
                                     margin: { left: data.cell.x },
                                     tableWidth: data.cell.width ,
                                     body: getRowsFromTable(tname, childFilter),
                                     columns: childcols.map(function (c) {
                                         return {
                                             title: c.caption.split(/\s+/).join(''),
                                             dataKey: c.name
                                         }
                                     }),
                                 })*!/


                             }
                         }
                     },*/
                    // ===============================================================================================================
                    // ================================================================================================================
                });

        },

        /**
         * print a single row
         * @param text
         */
        printRow: function (text) {
            this.doc.text(text, this.left, this.top);
            this.top += this.rowSpace;
            // possibile modo per emttere bold e normale sus tessa riga.
            // docs.setFontType('bold');
            // docs.text(xAxes=10, yAxes = 20 + i * 5 , "Device: ")
            // docs.setFontType('normal');
            //  docs.text(25, yAxes = 20 + i * 5 , detail.deviceCode);
        },

        getRowForStandardCtrl:function (el) {
            var helpForm = this.metaPage.helpForm;
            var tagName = el.get(0).tagName;
            var value = $(el).val();
            var eltag = $(el).data("tag");

            var tag = helpForm.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var tableName = helpForm.getTableName(tag);
            var columnName = helpForm.getColumnName(tag);

            var dt = null;
            var dc = null;

            //l'etichetta fa eccezione e non viene recuperato nulla dal dataset ma dall'html
            if (tagName.toUpperCase() != "LABEL") {
                dt = this.metaPage.state.DS.tables[tableName];
                if (!dt && tagName.toUpperCase() != "LABEL") {
                    return
                }

                dc = dt.columns[columnName];
                if (!dc && tagName.toUpperCase() != "LABEL") {
                    return
                }
            }
           /* if (!$(el).is(":visible")) {
                return;
            }*/

            switch (tagName.toUpperCase()) {
                case "INPUT":
                    switch ($(el).attr("type").toUpperCase()) {
                        case "TEXT":
                        case "DATE":
                        case "PASSWORD":
                        case "TEXTAREA":
                            return [dc.caption, value];
                        case "CHECKBOX":
                            if ($(el).prop("indeterminate") === true) {
                                return [dc.caption, ''];
                            }
                            if ($(el).prop("checked") === true) {
                                return [dc.caption, this.C_ENABLED];
                            }
                            if ($(el).prop("checked") === false) {
                                return [dc.caption, this.C_DISABLED];
                            }
                            break;
                        case "RADIO":
                            if($(el).prop("checked")) {
                                return [dc.caption, $(el).next().text()];
                            }
                            break;
                    }
                    break;
                case "TEXTAREA":
                    return [dc.caption, value];
                case "LABEL":
                    return ["", $(el)[0].innerHTML];
                case "DIV":
                case "SPAN":
                    break;
            }

            return null;
        },

        /**
         * DEPRECATED. not used. only for dev documentation
         * Print grid
         * @param {html node} el
         */
        printGridControl: function(el) {
            var self = this;
            var eltag = $(el).data("tag");

            // aggiungo nuovo foglio
            this.doc.addPage(this.sheetFormat, 'landscape');
            this.top = 10;
            var helpForm = this.metaPage.helpForm;

            var tableName = helpForm.getField(eltag, 0);

            var dataTable = this.metaPage.state.DS.tables[tableName];
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
            var headers = this.createHeaders(cols.map(function (c) {
                return c.caption.split(/\s+/).join('');
            }));

            // array di righe , che sono oggetti del tipo {col1: value1, col2: value2} in cui col1 col2 sono le stesse dell'header
            var data = [];
            _.forEach(this.metaPage.state.DS.tables[tableName].rows, function (row) {
                var myRow = {};
                _.forEach(cols, function (col) {
                    var value = row[col.name] !== null && row[col.name] !== undefined ? row[col.name] : ' ';
                    var caption = col.caption.split(/\s+/).join('');
                    myRow[caption] = value.toString(); // toString altrmenti non stampa i numeri
                });
                data.push(myRow);
            });

            this.doc.table(this.left, this.top, data, headers,
                {
                    fontSize: this.textFontSize,
                    autoSize:true
                });
        },

        /**
         * DEPRECATED. used in deprecated methid printGridControl()
         * @param keys
         * @returns {[]}
         */
        createHeaders:function(keys) {
            var result = [];
            for (var i = 0; i < keys.length; i += 1) {
                result.push({
                    id: keys[i],
                    name: keys[i],
                    prompt: keys[i],
                    align: "center",
                    width: 100,
                    height: 200,
                    padding: 1
                });
            }
            return result;
        },


        // *************************************************************************************
        // *********************** START EXPORT FROM TEMPLATE **********************************
        // *************************************************************************************


        exportToPdfFromTemplate:function (metaPage, idAttach) {
            var self = this;
            this.def = Deferred("PdfExport.exportToPdfFromtamplete");
            this.metaPage = metaPage;

            var def = Deferred("download");
            var token = appMeta.connection.getAuthToken();
            var callConfigObj = appMeta.routing.connObj['download'];
            var url = callConfigObj.url + '?idattach=' + idAttach;
            var filename = 'default';
            var myInit = { method: callConfigObj.type,
                headers : {'Authorization':  "Bearer " + token}};

            fetch(url, myInit).then( function (response) {
                filename = self.getFileNameFromContentDisposition(response.headers.get('content-disposition'));
                return response.text();
            }).then(function (htmlText) {
                    // dato html rimpiazzo i palceholders
                    var mytextReplaced = self.replacePlaceHolders(htmlText);
                    // var b = new Blob([mytextRepalced], { type: 'application/pdf' });
                    var printWindow = window.open();
                    printWindow.document.write(mytextReplaced);
                    printWindow.document.close();

                  /*  var myBlob = new Blob([mytextReplaced], { type: 'application/pdf' })
                    var fileURL = window.URL.createObjectURL(myBlob);
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    a.href = fileURL;
                    a.download = filename;
                    a.click();
                    def.resolve();*/


                    def.resolve();
                });

            return def.promise();
        },

        /**
         * a placeholder in a html is "$(MyPlaceholder)" where MyPlaceholder is the data-tag in html. ex: "tab.col?seach.colSearch"
         * @param text
         * @returns {*}
         */
        replacePlaceHolders: function(text) {
            var self = this;
            var placeholders = this.getPlaceholders(text);

            // loop sui placeholder , dato il tag, cioè il placeholder indicato sul test trova il valore sul dataset e rimpiazza placeholder con valore
            return  _.reduce(placeholders, function (acc, placeholder) {

                // var el = $("[data-tag='" + placeholder +"']");
                var el = $("#" + placeholder);

                var row = self.getRowValueByEl(el);

                // effettua replace del placeholder
                if (row && row.length === 2 ) {
                    acc = acc.replace("$(" + placeholder + ")", row[1]);
                }

                return acc;

            }, text);

        },

        /**
         *
         * @param el
         * @returns {[]} array [caption, value]
         */
        getRowValueByEl:function(el) {
            var self  =this;
            var ctrl = $(el).data("customController");
            var ctrlType = $(el).data("customControl");
            var row = null;
            // trova valore. usa stesse fuznioni di export PDF
            if (ctrl) {
                switch (ctrlType) {
                    case 'tachimetro':
                        var res = self.getRowFromTachimetroCtrl(el);
                        row = res.row;
                        break;
                    case 'combo':
                        row = self.getRowFromComboCtrl(el);
                        break;
                    case 'dropdowngrid':
                        row = self.getRowFromDropdownCtrl(el);
                        break;
                    case 'upload':
                        row = self.getRowFromUploadCtrl(el);
                        break;
                }
            } else {
                row = self.getRowForStandardCtrl(el);
            }

            return row;
        },

        getFileNameFromContentDisposition: function (contentDisposition) {
            var filename = contentDisposition.split('filename=')[1].split(';')[0];
            return this.getOriginalFileName(filename.replaceAll('"',''));
        },

        /**
         * Returns the original name of the attachment. js and server add a guid to the file name to do the name of the file univocal
         * @param {string} fileName
         * @returns {*}
         */
        getOriginalFileName:function (fileName) {
            var fname = fileName;
            var sep = appMeta.config.separatorFileName;
            var sepIndex = fileName.indexOf(sep);
            if (sepIndex) fname = fileName.substring(sepIndex + 4, fileName.length);
            return fname;
        },

        /**
         * take "xxxxx $(tab1.col1?searchtab.searchcol) xxxxxx $(tab2.col2?searchtab.searchcol) $(tab3.col3?searchtab.searchcol) xxxxxxx" returns array ['tab1.col1?searchtab.searchcol', 'tab2.col2?searchtab.searchcol', 'tab3.col3?searchtab.searchcol']
          * @param str
         * @returns {[]}
         */
         getPlaceholders:function(str) {
            var regex = /\$\(([\w\[.\]\\\?]+)\)/g;
            var result = [];

            while (match = regex.exec(str)) {
                result.push(match[1]);
            }
            return result;
        },

        // ***********************************************************************************
        // *********************** END EXPORT FORM TEMPLATE **********************************
        // ***********************************************************************************

    };

    appMeta.PdfExport = new PdfExport();

    /**
     * Help class to build a data structure to loop and print
     *  0: table with el1 el2..
     *  1: grid
     *  2: table with el3 el4 ..
     *  3: grid...
     *
     *  where 0, 1,2 3 are the key of the dictionary. pdfExport loops on the dictionary and print a page for each entry
     * @constructor
     */
    function StoreControl() {
        /**
         * @type {
         * grid: object
         * elements:[]
         * }
         */
        this.tabs = {};
        this.C_MAINTAB = 'Principale';
    }

    StoreControl.prototype = {
        constructor: StoreControl,

        /**
         * add an element that is an html input or select radio checkbox, tachimetro, dropdowngrid.
         * @param tabkey
         * @param el
         */
        addElementInTab:function(tabkey, el) {
            tabkey = this.createNewEntry(tabkey);
            this.tabs[tabkey].elements.push(el);
        },

        /**
         * add a grid in the dictionary
         * @param tabkey
         * @param el
         */
        addGrid: function (tabkey, el) {
            tabkey = this.createNewEntry(tabkey);
            this.tabs[tabkey].grid = el;
            this.tabs[tabkey].grids.push(el);
        },

        /**
         * add a new entry in nthe dictonary if not exist.
         * If tabkey is empty add a default tab C_MAINTAB
         * @param {string} tabkey
         * @returns {string} the tab key
         */
        createNewEntry:function(tabkey) {

            // se non c'è tab metto un nome di default
            if (!tabkey || tabkey === '') {
                tabkey = this.C_MAINTAB;
            }

            if (!this.tabs[tabkey]) {
                this.tabs[tabkey] = {};
                this.tabs[tabkey].elements = [];
                this.tabs[tabkey].grids = [];
            }

            return tabkey;
        }
    };

    appMeta.StoreControl = StoreControl;
}());
