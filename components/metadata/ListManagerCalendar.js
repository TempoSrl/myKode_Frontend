/// <reference path="MetaApp.js" />
/**
 * @module ListManagerCalendar
 * @description
 * Manages the graphics and the logic of an html List Manager with Calendar not grid!
 */
(function() {

    // utilizzo CalendarControl
    var CalendarController;
    var getData = appMeta.getData;
    var Deferred = appMeta.Deferred;
    var locale = appMeta.localResource;
    var q = window.jsDataQuery;
    var utils = appMeta.utils;
    /**
     * @constructor ListManagerCalendar
     * @description
     * Initializes a ListManagerCalendar control
     * @param {string} tableName
     * @param {string} listType
     * @param {jsDataQuery} filter
     * @param {boolean} isModal
     * @param {element} rootElement
     * @param {MetaPage} metaPage
     * @param {boolean} filterLocked true if filter can't be changed during row selection
     * @param {DataTable} toMerge. It contains the Rows to "merge" with those found in DB
     * @param {string|null} sort. The name of the column to sort for the query
     * @param {string} startColumnName the startDate column name in the datatable. Mandatory
     * @param {string} titleColumnName the titel column name in the datatable. Mandatory
     * @param {string|null} stopColumnName the stopDate column name in the datatable. Optional
     */
    function ListManagerCalendar(tableName, listType, filter, isModal, rootElement,  metaPage, filterLocked, toMerge, sort, startColumnName, titleColumnName, stopColumnName) {

        this.filterLocked = filterLocked || false;
        this.toMerge = toMerge;
        this.sort = sort;
        this.tableName = tableName;
        this.listType = listType;
        this.filter = filter;
        this.isModal = isModal;
        this.rootElement = rootElement || document.body;
        this.metaPage = metaPage;
        this.helpForm = metaPage.helpForm;

        // parametri obbligatori da passare al calendario
        this.startColumnName = startColumnName;
        this.titleColumnName = titleColumnName;
        this.stopColumnName = stopColumnName;

        CalendarController = appMeta.CustomControl("calendar");

        // creo rootElement in maniera dinamica. imposto la classe css custom listManagerContainer

        if (isModal){
            this.myModalUnivoqueId = "#mymodal" + utils.getUniqueId();
            this.defModal = Deferred("ListManager");
            this.currentRootElement = $('<div class="listManagerContainer">'); // in alternativa aggiungi pure classe "container" di bootstrap, centra il tutto container
            $(this.rootElement).append(this.currentRootElement);
        }
        else {
            this.dialogNotmodalId =  "dialog" + utils.getUniqueId();
            this.currentRootElement = $('<div id="' + this.dialogNotmodalId + '">'); // in alternativa aggiungi pure classe container di bootstrap, centra il tutto container
            // lo appendo al mio rootElement esterno
            $(this.rootElement).append(this.currentRootElement);
            var self = this;
            $("#"+this.dialogNotmodalId).dialog({ autoOpen: false,
                width: appMeta.currApp.getScreenWidth() * 0.9,
                height: appMeta.currApp.getScreenHeight() * 0.8,
                close: _.partial(self.hideControl, self),
                position: { my: "center bottom", at: "center bottom" }
            });
            $("#"+self.dialogNotmodalId).dialog('open');
        }

        // a seconda se modale o non appendo i vari html ad un nuovo root. così non serve if dopo.
        this.myRootListManger = $("<div data-tag=" + tableName + "." + listType + ">");

        // aggiungo al mio root corrente il div dinamico con la griglia e il footer.
        $(this.currentRootElement).append(this.myRootListManger);

        this.lastTableRequested = null;

        // var ausiliarie per costruire i bottoni del footer
        this.numberOfPagesInFooter = appMeta.config.listManager_numberOfPagesInFooter;
        this.nRowPerPage = appMeta.config.listManager_nRowPerPage;
        
        // serve per paginazione, serve per capire se sono andato pev o next,e  di quanti mesi
        this.countMonth = 0;
        this.monthsIntervalPagination = 1;

        this.loader = new appMeta.LoaderControl(this.myRootListManger, appMeta.localResource.loader_waitListLoading);
        return this;
    }

    ListManagerCalendar.prototype = {
        constructor: ListManagerCalendar,

        /**
         * @method show
         * @public
         * @description ASYNC
         * Builds and shows a listManger control, and returns a Promise
         * @param {DataTable} dataTablePaged
         * @param {int} totPage
         * @param {int} totRows
         * @returns {Deferred}
         */
        show:function (dataTablePaged, totPage, totRows) {
            var self = this;
            var def = Deferred("show-ListManager");

            var res = self.createList(dataTablePaged, totPage, totRows)
                .then(function () {
                    self.hideWaitingIndicator();
                    if (self.isModal) {
                        self.buildModal();
                        self.loader.hideControl();
                        self.metaPage.eventManager.trigger(appMeta.EventEnum.listCreated, self, "show");
                        return self.defModal.promise();
                    }else{
                        $("#"+self.dialogNotmodalId).dialog('open');
                    }

                    self.metaPage.eventManager.trigger(appMeta.EventEnum.listCreated, self, "show");
                    return def.resolve();
                });

            return def.from(res).promise();
        },

        /**
         * @method getModalHtml
         * @private
         * @description SYNC
         * Builds and returns the html string for a modal form
         * @returns {string}
         */
        getModalHtml:function () {
            var modalHtml = "<div class='modal'  id=" + this.myModalUnivoqueId.substr(1) + " tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false'" +
                " style='display:none;'>" +
                "<div class='modal-dialog modal-lg'>" +
                "<div class='modal-content'  >" +
                "<div class='modal-header'>"+
                "<h4 class='modal-title'>" + this.title + "</h4>" +
                "<button type='button' class='close modal-white-close'>" +
                "<span aria-hidden='true'>&times;</span></button>" +
                "</div>" +
                "<div class='modal-body' style='overflow-x: auto;'></div>" +
                "<div class='modal-footer bg-default'></div>" +
                "</div>" +
                "</div>" +
                "</div>";

            return modalHtml;
        },

        /**
         * @method buildModal
         * @private
         * @description SYNC
         * Builds the modal control. Ataches also the event to the controls
         * @returns {boolean}
         */
        buildModal:function () {
            // prendo il template html della modale e lo aggiungo al rootElement
            var currModal = $(this.getModalHtml());
            $(this.currentRootElement).append(currModal);
            // una volta aggiunto al currentRootElement, lo popolo con i dati parametrici che ho calcolato nella createList
            $(this.myModalUnivoqueId + ' .modal-body').append($(this.myRootListManger));
            // evento di close sul tastino x
            $(this.myModalUnivoqueId  + ' .modal-header').find("button")
                .data("mdlModalWin", this)
                .on("click", this.closeModalBtnEv);
            $(this.myModalUnivoqueId).modal('show');
            if (this.metaPage.eventManager) return this.metaPage.eventManager.trigger(appMeta.EventEnum.showModalWindow, this, "buildModal");

            return true;

        },
        
        /**
         * @method hideControl
         * @private
         * @description SYNC
         * Hides and removes the control itself.
         * Called by btn close, attached with partial, and by the private method closeListManager()
         * @param {ListManager} that the instance itself
         */
        hideControl:function (that) {
            if (that.currentRootElement){
                if (that.isModal) $(this.myModalUnivoqueId).modal('hide'); // inovo hide così rimuove lo sofndo non cliccabile
                that.currentRootElement.remove();
            }
            if (that.metaPage.eventManager) that.metaPage.eventManager.trigger(appMeta.EventEnum.listManagerHideControl, that, "hideControl");
        },

        /**
         * @method closeModalBtnEv
         * @private
         * @description SYNC
         * Called by the button close of the modal
         */
        closeModalBtnEv:function () {
            var that = $(this).data("mdlModalWin");
            that.closeListManager(); // non passo nulla, poichè nella modale se chiudo con il close non deve comunicare nulla al chiamante.
        },

        /**
         * @method createList
         * @private
         * @description ASYNC
         * Creates the grid and the footer
         * @returns {Deferred}
         */
        createList: function() {
            var self = this;
            var def = Deferred("listManager.createList");
            // mostro il loader
            this.loader.showControl();

            var dateFilter = this.getfilterPagination();
            var currFilter = this.filter ? q.and(this.filter, dateFilter) : dateFilter;
            // non eseguo paginazione standard quindi passo 1 pagina e metto grande num di record
            var res = getData.getPagedTable(this.tableName, 1 , 1000000, currFilter, this.listType, this.sort)
                .then(function(dtp, totp, totr) {
                    // nel momento in cui torno la riga alla metapage viene fatta della logica sulla riga seelzionata
                    // su relazioni etc.. quindi recupera dalla table la proprietà dataset, che in questo caso non avrebbe perchè
                    // getPagedTable() torna solo un datatable, e lo devo quindi associare al ds corrente della metapage
                    dtp.dataset = self.metaPage.state.DS;
                    return self.loadCore(dtp, totr);
                });

            return def.from(res).promise()
        },

        /**
         * @method getfilterPagination
         * @private
         * @description SYNC
         * Returns the filter for the pagination on datetime (data >= data1(1/M1/Y) and data <= data2(31/M2/Y))
         * @returns {jsDataQuery} the filter on date based on pagination
         */
        getfilterPagination:function () {
            // costruisce filtro sulla data per la paginazione per data.
            // ccstruisce quindi (data >= data1(1/M1/Y) and data <= data2(31/M2/Y))

            // torna il num di giorni nel mese specificato
            // month è il numerico del mese base:1
            // year è yyyy
            var daysInMonth = function (month, year) {
                return new Date(year, month , 0).getDate();
            };

            var today = new Date();
            var currMonth = today.getMonth();
            var currMonthQuery = currMonth + this.countMonth;
            // vado avanti e indietro di "this.monthsIntervalPagination" mesi, così prendo un intervallo di (this.monthsIntervalPagination*2 +1) mesi
            var currmonthGE = currMonthQuery - this.monthsIntervalPagination;
            var currmonthLE = currMonthQuery + this.monthsIntervalPagination;
            var year = today.getFullYear();
            var d1 = new Date(year, currmonthGE, 1, 0, 0);
            // siccome verrà serializzata tramite json.stringfy, applico normalizzazione
            var v1 = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(d1, true);
            var d1cond = q.ge(this.startColumnName, v1); // data >= data1
            var daysv2 = daysInMonth(currmonthLE + 1, year); // aggiungo +1 perchè la funz daysInMount considera emse partendo da 1=gennaio
            var d2 = new Date(year, currmonthLE, daysv2, 23, 59);
            var v2 = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(d2, true);
            var d2cond = q.le(this.startColumnName, v2); // data <= data2
            var dateFilter = q.and(d1cond, d2cond);
            // salvo il filtro in versione stringa, così lo inietto nel titolo insieme all'informazione del numero di record
            this.filterStringForTitle = this.buildFilterDateString(d1, d2);
            return dateFilter;
        },

        /**
         * Returns the string "(data>= d1 and data<= d2)"
         * @param {Date} d1
         * @param {Date} d2
         * @returns {string}
         */
        buildFilterDateString:function (d1, d2) {
            function pad(s) { return (s < 10) ? '0' + s : s; }
            var d2new = d2; //new Date(d2 - 1000 * 60 ); // tolgo 1 minuto così risulta 23:00:00 e mette giorno giusto
            var d1string = [pad(d1.getDate()), pad(d1.getMonth()+1), d1.getFullYear()].join('/');
            var d2string = [pad(d2new.getDate()), pad(d2new.getMonth()+1), d2new.getFullYear()].join('/');
            return locale.getFilterDateString(this.startColumnName, d1string, d2string);
        },

        /**
         * @method getTitle
         * @private
         * @description SYNC
         * Returns the title the column of the Autochoose used for the title (in modal case)
         * @returns {string}
         */
        getTitle:function () {
            return this.metaPage.titleAutochoose || "" ;
        },

        /**
         * Given the dataTablePaged fills th grid
         * @method loadCore
         * @private
         * @description ASYNC
         * @param {DataTable} dataTablePaged
         * @param {int} totPage
         * @param {int} totRows
         * @returns {Deferred}
         */
        loadCore:function (dataTablePaged, totRows) {
            var self = this;
            var def = Deferred("loadCore");
            self.title =  self.getTitle() + " - " + self.getNumberOfRowOnTot(totRows); // calcolo titolo dinamicamente. utilizzato nelc aso modale usualmente
            if (!self.isModal) $("#"+self.dialogNotmodalId).dialog({title: self.getNumberOfRowOnTot(totRows)});
            // "dataTablePaged" è il DataTable calcolato da getPagedTable()
            if (!dataTablePaged) return def.resolve(null);
            self.lastTableRequested = dataTablePaged;
            // se c'è la tab toMerge prova a fare il merge delle righe in base al filtro notEntityChild
            self.checkToMerge(dataTablePaged);
            // inizializzo il controllo calendario se già non è stato fatto
            //  // imposto che è in modalità listmanager, cioè devo mostrare calendario su un elenco di ricerca di pag principale, ultimo prm "isListManager = true;"
            self.calendarControl = self.calendarControl || new CalendarController(self.myRootListManger, self.helpForm, dataTablePaged, null, self.listType, true);
            // parametri per far funzionare il calendario
            self.calendarControl.startColumnName = self.startColumnName;
            self.calendarControl.titleColumnName = self.titleColumnName;
            self.calendarControl.stopColumnName = self.stopColumnName;

            // riassegno nuovo dataTable
            self.calendarControl.dataTable = dataTablePaged;
            // popolo la griglia
            var res = self.calendarControl.fillControl()
                .then(function() {
                    // aggiungo eventi
                    self.calendarControl.addEvents(self, self);

                    // nascondo loader, una volta caricati i dati
                    self.loader.hideControl();
                    return true;
                });

            return def.from(res).promise()
        },

        /**
         * @method getNumberOfRowOnTot
         * @private
         * @description SYNC
         * Returns the string "Results xx" or "Results xx of xxx", where "xx" is rowsShowed and add "data between d1 and d2"
         * @param {string} rowsShowed. should be a number
         */
        getNumberOfRowOnTot:function (rowsShowed) {
            // se sono più del totale mostrato paginato mostro "xx di 100"
            if(rowsShowed > this.nRowPerPage) rowsShowed = this.nRowPerPage + " " + locale.of + " " + rowsShowed;
            var filterDate = this.filterStringForTitle ? ", " + this.filterStringForTitle : "";
            return locale.getNumberOfRows(rowsShowed) + filterDate;
        },

        /**
         * @method checkToMerge
         * @public
         * @description SYNC
         * Merges/UnMarges rows contained in "toMerge" table in "dt", based on toMerge notEntityChild filter
         * @param {DataTable} dt, dataTable where the rows of toMerge table must be merged
         */
        checkToMerge:function (dt) {

            if (!this.toMerge) return;

            var self = this;
            // è un jsDataQuery
            var noChildFilter = appMeta.metaModel.notEntityChild(this.toMerge);

            // Delete from list those who have not the filter property in the ToMerge Table
            var toExclude = this.toMerge.select(q.not(noChildFilter));
            _.forEach(toExclude, function (r) {
                var  cond = dt.keyFilter(r);
                    //getData.getWhereKeyClause(r.getRow(), self.toMerge , self.toMerge, false);

                var toDelete = dt.select(cond);
                if (toDelete.length > 0) {
                    toDelete[0].getRow().del();
                    toDelete[0].getRow().acceptChanges();
                }
            });

            // Add to list those who are not present in the list and are present in the ToMerge table
            var toAdd = this.toMerge.select(noChildFilter);
            _.forEach(toAdd, function (r) {
                var  cond =  dt.keyFilter(r);
                        //getData.getWhereKeyClause(r.getRow(), self.toMerge , self.toMerge, false);
                var toInsert = dt.select(cond);
                // Removes eventually present row from DT
                _.forEach(toInsert, function (rIns) {
                    rIns.getRow().del();
                    rIns.getRow().acceptChanges();
                });

                var newRow = dt.newRow();
                _.forEach(self.toMerge.columns, function (c) {
                    if(dt.columns[c.name]){
                        newRow[c.name] = r.getRow().current[c.name];
                    }
                });

                // newRow già aggiunge la riga dt.add(newRow);

            });

        },

        // *** START Methods MetaPage Interface ***

        /**
         * @method canSelect
         * @public
         * @description ASYNC
         * Return a deferred boolena true if control can select a row
         * @param {DataTable} dataTable
         * @param {DataRow} row
         * @returns {Deferred}
         */
        canSelect: function (dataTable, row) {
            //TODO richiamare il canSelect della MetaPage
            var deferred = Deferred("canSelect");
            return deferred.resolve(true).promise();
        },

        /**
         * @method rowSelect
         * @public
         * @description ASYNC
         * Dispatches a row select through listeners if the control is not modal, otherwise it resolve immediately the deferred
         * @param {Html node} sender  object generating the event
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         * @returns {Deferred}
         */
        rowSelect: function (sender, dataTable, row) {
            if (this.isModal) {
                // Nel caso modale, se il grid ospitato lancia un rowselect non deve fare nulla. Torno la deferred poichè l'interfaccia della rowSelect prevede torni un Deferred.
                // Al click su una riga infatti viene invocato il click su grid, il grid chiama la setIndex -> setRow -> ed invoca la rowSelect sulla metPage chiamante,
                // quindi in questo caso la metaPage è ListManager e proprio questo metodo rowSelect() ; lui deve quindi tornare una Deferred altrimenti va in errore.
                return Deferred("rowSelect").resolve();
            }else{
                // qui invece viene invocato la rowSelct sulla MetaPage vera e propria e lei torna Deferred
                // Di qua passa quando il listManager non è modale, ossia è associato ad un form elenco sulla tabella principale
                var dtRow = row ? (row.getRow ? row.getRow() : null) : null;
                return Deferred("rowSelect").from(this.metaPage.selectRow(dtRow, this.listType)).promise();
            }
        },

        /**
         * @method rowDblClick
         * @private
         * @description SYNC
         * Handler for the dbClick event on the grid of listManager
         * @param {ListManagerCalendar} sender
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         */
        rowDblClick: function (sender, dataTable, row){
            this.closeListManager(dataTable, row);
        },

        /**
         * @method closeListManager
         * @public
         * @description SYNC
         * Hides/removes the control graphically and resolve the deferred with the row selected.
         * It distinguishes 2 cases:
         * 1. modal resolve the "defModal" Deferred, instead
         * 2. not modal call a selectRow on metapage
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         */
        closeListManager:function (dataTable, row) {
            this.hideControl(this);
            if (this.isModal) {
                // nel caso modale risolvo la promise, che è in attesa sulla show()
                this.defModal.resolve(row);
            }else{
                // alla chiusura se non è modale lancia la rowSelect su metaPage
                // this.metaPage.rowSelect(null, dataTable, row);
                var dtRow = row ? (row.getRow ? row.getRow() : null) : null;
                return Deferred("closeListManager").from(this.metaPage.selectRow(dtRow, this.listType)).promise();
            }
        },

        /**
         * @method showWaitingIndicator
         * @public
         * @description SYNC
         * @param msg the message to show, during the waiting
         */
        showWaitingIndicator:function (msg) {
            if (this.metaPage) return this.metaPage.showWaitingIndicator(msg);
        },

        /**
         * @method hideWaitingIndicator
         * @public
         * @description SYNC
         * Hides the waiting indicator
         * @param {number} handler
         */
        hideWaitingIndicator:function (handler) {
            if (this.metaPage) this.metaPage.hideWaitingIndicator(handler);
        },

        // *** END Methods MetaPage Interface  ***
        
        /**
         * @method goNextClick
         * @public
         * @description SYNC
         * Handler for the next button on calendar during the navigation in pagination mode
         * @param {CalendarControl} calendar
         */
        goNextClick:function (calendar) {
            this.countMonth = this.countMonth + 1 ;
            this.createList();
        },

        /**
         * @method goPrevClick
         * @public
         * @description SYNC
         * Handler for the prev button on calendar during the navigation in pagination mode
         * @param {CalendarControl} calendar
         */
        goPrevClick:function (calendar) {
            this.countMonth = this.countMonth - 1 ;
            this.createList();
        }



    };

    window.appMeta.ListManagerCalendar = ListManagerCalendar;
}());
