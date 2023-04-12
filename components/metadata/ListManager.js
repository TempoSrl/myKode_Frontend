/*global appMeta,_,$ */
/// <reference path="MetaApp.js" />
/**
 * @module ListManager
 * @description
 * Manages the graphics and the logic of an html List Manager
 */
(function() {
    "use strict";
    // utilizzo GridControl per costruire la griglia
    let GridController;
    let getData = appMeta.getData;
    let Deferred = appMeta.Deferred;
    let locale = appMeta.localResource;
    let q = window.jsDataQuery;
    let utils = appMeta.utils;

    /**
     * @constructor ListManager
     * @description
     * Initializes a ListManager control
     * @param {string} tableName
     * @param {string} listType
     * @param {jsDataQuery} filter
     * @param {boolean} isModal
     * @param {element} rootElement
     * @param {MetaPage} metaPage
     * @param {boolean} filterLocked true if filter can't be changed during row selection
     * @param {DataTable} toMerge. It contains the Rows to "merge" with those found in DB
     * @param {string} [sort]
     */
    function ListManager(tableName, listType, filter, isModal, rootElement,
                         metaPage, filterLocked, toMerge, sort) {

        this.filterLocked = filterLocked || false;
        this.toMerge = toMerge;
        this.tableName = tableName;
        this.listType = listType;
        this.sort = sort;
        this.filter = filter;
        this.isModal = isModal;
        this.rootElement = rootElement || document.body;
        this.metaPage = metaPage;

        GridController = appMeta.CustomControl("gridx");

        this.lastTableRequested = null;

        // variabili ausiliarie per costruire i bottoni del footer
        this.totpages = 0;
        this.currentPageDisplayed = 1;
        this.numberOfPagesInFooter = appMeta.config.listManager_numberOfPagesInFooter;
        this.nRowPerPage = appMeta.config.listManager_nRowPerPage;
        this.myfooter = null;
        this.showFooter = true;

        return this;
    }

    ListManager.prototype = {
        constructor: ListManager,

        /**
         *
         */
        locateNotModal:function() {
            this.dialogNotmodalId = "dialog" + utils.getUniqueId();
            // l'elenco occuperà metà dell'altezza
            // in alternativa aggiungi pure classe container di bootstrap, centra il tutto container
            this.currentRootElement = $('<div class="searchzoneList" id="' + this.dialogNotmodalId + '">');
            // aggiungo label per il titolo, dove mostro il num di righe totali + paginazione
            let $lblTile = $("<label class='risultati' id='" + this.dialogNotmodalId + "_title'>");
            $(this.currentRootElement).append($lblTile);

            // aggiungo bottone per la chiusura
            let $closeIcon = $('<i class="fa fa-window-close">');
            let $span = $('<div class="searchClose">');
            $span.append($closeIcon);
            $span.on("click", _.partial(this.hideControl, this));
            this.closeEl = $span;
            $(this.currentRootElement).append($span);

            // lo appendo al mio rootElement esterno
            $(this.rootElement).prepend(this.currentRootElement);
        },

        /**
         *
         */
        locateModal:function() {
            this.myModalUnivoqueId = "#mymodal" + utils.getUniqueId();
            this.defModal = Deferred("ListManager-modal");
            // in alternativa aggiungi pure classe "container" di bootstrap, centra il tutto container
            this.currentRootElement = $('<div class="listManagerContainer">');
            $(this.rootElement).append(this.currentRootElement);
        },

        /**
         *
         * @param visible
         */
        setShowFooter:function (visible) {
            this.showFooter = visible;
        },

        /**
         *
         */
        init:function() {
            if (this.isModal) this.locateModal();
            if (!this.isModal) this.locateNotModal();
            // A seconda se modale o non appendo i vari html a un nuovo root. Così non serve if dopo.
            this.myRootListManger = $("<div data-tag='" + this.tableName + "." + this.listType + "' class='autoChooseDataTag'>");
            // aggiungo al mio root corrente il div dinamico con la griglia e il footer.
            $(this.currentRootElement).append(this.myRootListManger);
            this.loader = new appMeta.LoaderControl(this.myRootListManger, appMeta.localResource.loader_waitListLoading);
        },

        /**
         * A seguito di un cambio di sort riesegue la query paginata
         */
        sortPaginationChange:function(newSort) {
            let def = Deferred('doPaginatedNewSort');
            this.newSort = newSort;
            if (this.totpages > 1) {
                return this.createList()
                    .then(function () {
                       return def.resolve(true);
                    });
            }
            return def.resolve(false);
        },

        /**
         * @method show
         * @public
         * @description ASYNC
         * Builds and shows a listManger control, and returns a Promise
         * @param {DataTable} [dataTablePaged]
         * @param {int} [totPage]
         * @param {int} [totRows]
         * @returns Promise
         */
        show: function (dataTablePaged, totPage, totRows) {
            let self = this;
            let def = Deferred("show-ListManager");
            let res = self.createList(dataTablePaged, totPage, totRows)
                .then(function () {
                    self.hideWaitingIndicator();
                    // caso autochoose modale
                    if (self.isModal) {
                        self.buildModal();
                        self.adjustSizeModal();
                        self.loader.hideControl();
                        return self.defModal.promise();
                    }
                    self.adjustSizeNotModal();
                    self.metaPage.eventManager.trigger(appMeta.EventEnum.listCreated, self, "show");
                    return def.resolve();
                });

            return def.from(res).promise();
        },

        adjustSizeNotModal:function() {
        },


        /**
         * @method adjustSizeModal
         * @private
         * @description SYNC.
         * Adjusts the size and the position of the modal based on its content (based on the grid)
         */
        adjustSizeModal:function () {
            let screenW  = $(window).width();
            // attuale width del rect bianco della mdoale
            let currwcont = parseInt($(this.myModalUnivoqueId + ' .modal-content').css("width").replace("px",""));
            // new width come griglia contenuta. tolgo 10 così appare la scrollabr
            let newcontint = parseInt(this.gridControl.mytable.css("width").replace("px","")) - 10;
            // la new width non può uscire dallo schermo
            if (newcontint > screenW) newcontint = screenW - 50;
            // left attuale metà schermo meno metà della content bianca, posizionata al centro
            let actualeft = (screenW - currwcont)/ 2;
            // calcolo qaunto devo spostare a sx il content bianco
            let widthAdded = newcontint - currwcont;

            // fisso altezza in base allo schermo
            let h = ($(window).height() - 100).toString() + "px";
            $(this.myModalUnivoqueId + ' .modal-content').css("height", h);

            if (widthAdded <= 0) return;
            let newleftint = (widthAdded / 2);
            // se vado troppo a sx rimetto 50 px avanti
            if (newleftint > actualeft) newleftint = actualeft - 50;
            let newleft = (-newleftint).toString() + "px";
            let newcontw = (newcontint).toString() + "px"; // -10 così appare la scroll orizz

            // asegno nuove prop css calcolate
            $(this.myModalUnivoqueId + ' .modal-content').css("width", newcontw);
            $(this.myModalUnivoqueId + ' .modal-content').css("left", newleft);
        },

        /**
         * @method addBtnCloseNotModal
         * @private
         * @description SYNC. DEPRECATED
         * Adds the close button for the not modal case
         */
        addBtnCloseNotModal:function () {
            if (!this.isModal){
                let $button = $('<button class="btn btn-secondary" style="float: right">');
                $button.text(appMeta.localResource.close);
                $button.on("click", _.partial(this.hideControl, this));
                $(this.currentRootElement).append($button);
            }
        },

        /**
         * @method getModalHtml
         * @private
         * @description SYNC
         * Builds and returns the html string for a modal form
         * @returns {string}
         */
        getModalHtml:function () {
            return "<div class='modal'  id=" + this.myModalUnivoqueId.substr(1) +
                " tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false'" +
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

        },

        /**
         * @method buildModal
         * @private
         * @description SYNC
         * Builds the modal control. Also attaches the event to the controls
         * @returns {boolean}
         */
        buildModal:function () {
            // prendo il template html della modale e lo aggiungo al rootElement
            let currModal = $(this.getModalHtml());
            $(this.currentRootElement).append(currModal);
            // una volta aggiunto al currentRootElement, lo popolo con i dati parametrici che ho calcolato nella createList
            $(this.myModalUnivoqueId + ' .modal-body').append($(this.myRootListManger));
            // evento di close sul tastino x
            $(this.myModalUnivoqueId  + ' .modal-header').find("button")
                .data("mdlModalWin", this)
                .on("click", this.closeModalBtnEv);
            $(this.myModalUnivoqueId  + ' .modal-footer').append($(this.myfooter));
            $(this.myModalUnivoqueId).modal('show');
            if (this.metaPage.eventManager) {
                return this.metaPage.eventManager.trigger(appMeta.EventEnum.showModalWindow, this, "buildModal");
            }
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
                // invoco hide così rimuove lo sfondo non cliccabile
                if (that.isModal) $(this.myModalUnivoqueId).modal('hide');
                that.currentRootElement.remove();
            }
            if (that.metaPage.eventManager){
                that.metaPage.eventManager.trigger(appMeta.EventEnum.listManagerHideControl, that, "hideControl");
            }
        },

        /**
         * @method closeModalBtnEv
         * @private
         * @description SYNC
         * Called by the button close of the modal
         */
        closeModalBtnEv:function () {
            let that = $(this).data("mdlModalWin");
            // non passo nulla, poiché nella modale se chiudo con il close non deve comunicare nulla al chiamante.
            that.closeListManager();
        },

        /**
         * @method createList
         * @private
         * @description ASYNC
         * Creates the grid and the footer
         * @param {DataTable} dataTablePaged
         * @param {int} totPage
         * @param {int} totRows
         * @returns Promise
         */
        createList: function(dataTablePaged, totPage, totRows) {
            let self = this;
            let def = Deferred("listManager.createList");
            // mostro il loader
            this.loader.showControl();
            let res;
            // la prima volta le passa metaPage sullo show quando chiama l'elenco
            //  poiché già ha fatto la query e non la rifaccio
            if (dataTablePaged) {
                res = self.loadCore(dataTablePaged, totPage, totRows);
            }
            else {
                // passo qui, quando premo i pulsanti di navigazione della paginazione, quindi qui si ricalcola il dt
                // oppure se eseguo un ordinamento sulla griglia e ci sono più pagine
                res = getData.getPagedTable(this.tableName, this.currentPageDisplayed,
                                this.nRowPerPage, this.filter, this.listType, this.newSort)
                    .then(function (dtp, totp, totr) {
                        // Nel momento in cui torno la riga alla metapage viene fatta della logica sulla riga
                        //  selezionata su relazioni etc... Quindi recupera dalla table la proprietà dataset,
                        //  che in questo caso non avrebbe perché getPagedTable() torna solo un datatable,
                        //  e lo devo quindi associare al ds corrente della metapage
                        dtp.dataset = self.metaPage.state.DS;
                        return self.loadCore(dtp, totp, totr);
                    });
            }

            return def.from(res).promise();
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
         * Given the dataTablePaged fills the grid
         * @method loadCore
         * @private
         * @description ASYNC
         * @param {DataTable} dataTablePaged
         * @param {int} totPage
         * @param {int} totRows
         * @returns Promise
         */
        loadCore:function (dataTablePaged, totPage, totRows) {
            let self = this;
            let def = Deferred("loadCore");
            self.totpages = totPage;
            //Calcolo titolo dinamicamente. Utilizzato nel caso modale usualmente
            self.title =  self.getTitle() + " - " + self.getNumberOfRowOnTot(totRows);
            if (!self.isModal) {
                $("#" +  this.dialogNotmodalId + "_title").text(self.getNumberOfRowOnTot(totRows));
            }
            if ( $(self.myModalUnivoqueId  + ' .modal-title').length) {
                $(this.myModalUnivoqueId  + ' .modal-title').text(self.title);
            }
            // "dataTablePaged" è il DataTable calcolato da getPagedTable()
            if (!dataTablePaged) return def.resolve(null);
            // salvo le proprietà delle colonne precedenti
            if (!!self.lastTableRequested &&
                !!self.lastTableRequested.columns &&
                !!dataTablePaged &&
                !!dataTablePaged.columns){
                dataTablePaged.columns = Object.assign({}, self.lastTableRequested.columns);
            }
            self.lastTableRequested = dataTablePaged;
            // se c'è la tab toMerge prova a fare il merge delle righe in base al filtro notEntityChild
            self.checkToMerge(dataTablePaged);
            // inizializzo il controllo griglia se già non è stato fatto
            self.getGridInstance(dataTablePaged);
            self.gridControl.dataTable = dataTablePaged;
            let  metaToConsider = appMeta.getMeta(dataTablePaged.tableForReading());
            // Il be fa la describeCol, ma il programmatore potrebbe non implementare.
			// Ripeto qui, quella client veloce, e se non fosse implementata sul js prenderebbe quella in cache eventualmente
			//popolo la griglia
            let res = metaToConsider.describeColumns(self.gridControl.dataTable, self.listType)
                .then(function() {
                    return self.gridControl.fillControl();
                }).then(function() {
                    // aggiungo eventi
                    self.gridControl.addEvents(self, self); //era inutile chiamarlo con false, non faceva nulla in quel caso
                    // popolo il footer con i bottoni di navigazione
                    if (self.showFooter) {
                        self.buildFooter();
                    }
                    // nascondo loader, una volta caricati i dati
                    self.loader.hideControl();
                    return true;
                });

            return def.from(res).promise();
        },

        /**
         * @method getNumberOfRowOnTot
         * @private
         * @description SYNC
         * Returns the string "Results xx" or "Results from zzz to yyy of xxx", where "xxx" is rowsShowed
         * @param {int} rowsShowed.
         */
        getNumberOfRowOnTot:function (rowsShowed) {
            // se sono più del totale msotrato paginato mostro "xx di 100"
            let from = (this.currentPageDisplayed - 1) * this.nRowPerPage;
            let to = from + this.nRowPerPage;
            if (to > rowsShowed) to = rowsShowed;
            let msgShow = rowsShowed.toString();
            if (rowsShowed > this.nRowPerPage) msgShow = locale.from + " " + from + " " + locale.to + " " + to + " " + locale.of + " " + rowsShowed;
            return locale.getNumberOfRows(msgShow);
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

            let self = this;
            // è un jsDataQuery
            let noChildFilter = appMeta.metaModel.notEntityChild(this.toMerge);

            // Delete from list those who have not the filter property in the ToMerge Table
            let toExclude = this.toMerge.select(q.not(noChildFilter));
            _.forEach(toExclude, function (r) {
                let  cond = dt.keyFilter(r);
                    //getData.getWhereKeyClause(r.getRow(), self.toMerge , self.toMerge, false);

                let toDelete = dt.select(cond);
                if (toDelete.length > 0) {
                    toDelete[0].getRow().del();
                    toDelete[0].getRow().acceptChanges();
                }
            });

            // Add to list those who are not present in the list and are present in the ToMerge table
            let toAdd = this.toMerge.select(noChildFilter);
            _.forEach(toAdd, function (r) {
                let cond = dt.keyFilter(r);
                    //getData.getWhereKeyClause(r.getRow(), self.toMerge , self.toMerge, false);
                let toInsert = dt.select(cond);
                // Removes eventually present row from DT
                _.forEach(toInsert, function (rIns) {
                    rIns.getRow().del();
                    rIns.getRow().acceptChanges();
                });

                let newRow = dt.newRow();
                _.forEach(self.toMerge.columns, function (c) {
                    if(dt.columns[c.name]){
                        newRow[c.name] = r.getRow().current[c.name];
                    }
                });

                // newRow già aggiunge la riga dt.add(newRow);

            });
        },


        /**
         * @method buildFooter
         * @private
         * @description SYNC
         * Builds the footer:
         * << < 1 2 3 4 5 > >>
         * <table>
         *  <tr>
         *   <td><button  onclick="event()">aaa</button></td>
         *   ...
         *  </tr>
         * </table>
         */
        buildFooter:function () {
            // inizializzo oggetto footer

            if (this.myfooter) this.myfooter.remove();
            this.myfooter = $('<table>');

            if(this.totpages <= 1 ) return true;

            // unica riga dell' elemento footer
            let $tr = $("<tr>");

            // calcolo bottoni di avanzamento
            let upperLimit;
            if(( this.currentPageDisplayed + this.numberOfPagesInFooter - 1) > this.totpages)
                upperLimit = this.totpages;
            else
                upperLimit = this.currentPageDisplayed + this.numberOfPagesInFooter - 1;

            // Inserisco bottone   "<<"
            this.buildButtonFooter($tr,
                "<<",
                this.currentPageDisplayed <= 1,
                _.partial(this.showPreviousPages, this));

            // Inserisco bottone   "<"
            this.buildButtonFooter($tr,
                "<",
                this.currentPageDisplayed <= 1,
                _.partial(this.goPreviousPage, this));

            let startIndex = upperLimit - this.numberOfPagesInFooter + 1;
            if (startIndex < 1) {
                startIndex = 1;
            }

            // Mostro i bottoni delle pagine cliccabili. Tranne quello della pag corrente, che sarà disabilitato
            for(let pageIndex = startIndex; pageIndex <= upperLimit; pageIndex++) {
                this.buildButtonFooter($tr,
                    pageIndex,
                    (pageIndex === this.currentPageDisplayed),
                    _.partial(this.goToPage, this, pageIndex));
            }

            // Inserisco bottone   ">"
            this.buildButtonFooter($tr,
                ">",
                this.currentPageDisplayed >= this.totpages,
                _.partial(this.goNextPage, this));

            // Inserisco bottone   ">>"
            this.buildButtonFooter($tr,
                ">>",
                upperLimit >= this.totpages,
                _.partial(this.showNextPages, this));

            // Aggiungo la riga creata sull'oggetto parent
            $($tr).appendTo(this.myfooter);

            // applico lo stile
            this.myfooter.addClass(appMeta.cssDefault.listManagerFooter);

            // ogni volta rimetto footer
            if (this.isModal){
                let footer= $('.modal-footer');
                if  (footer.length) {
                    footer.find("table").remove();
                    footer.append($(this.myfooter));
                }
            } else {
                let $fooDiv = $("<div>");
                $fooDiv.addClass(appMeta.cssDefault.listManagerFooterCont);

                this.myfooter.appendTo($fooDiv);
                $fooDiv.appendTo(this.myRootListManger);
            }

            return true;
        },

        /**
         * @method buildButtonFooter
         * @private
         * @description SYNC
         * Builds a button located on the footer of the control.
         * @param {element} $tr tr html element where add the new td element
         * @param {string} txt the text of the button
         * @param {boolean} isDisabled
         * @param {Function} action the event attached to the button
         */
        buildButtonFooter: function ($tr, txt, isDisabled, action) {
            let $td = $("<td>");
            let $button = $('<button class="btn btn-secondary">');
            $button.text(txt);
            $button.prop("disabled", isDisabled);
            $button.on("click", action);
            $($button).appendTo($td);
            $td.appendTo($tr);
        },

        /**
         * @method showNextPages
         * @private
         * @description ASYNC
         * Attached on click event on button >>" in the footer, to go ahead if possible of "numberOfPagesInFooter" pages
         * @param {ListManager} that
         * @return  {Promise}
         */
        showNextPages:function (that) {
            if (that.currentPageDisplayed + that.numberOfPagesInFooter > that.totpages) {
                that.currentPageDisplayed = that.totpages;
            } else {
                that.currentPageDisplayed += that.numberOfPagesInFooter;
            }
            return that.createList();
        },

        /**
         * @method showPreviousPages
         * @private
         * @description ASYNC
         * Attached on click event on button "<<" in the footer, to go down if possible of "numberOfPagesInFooter" pages
         * @param {ListManager} that
         * @return  {Promise}
         */
        showPreviousPages:function (that) {
            that.currentPageDisplayed -= that.numberOfPagesInFooter;
            if ( that.currentPageDisplayed < 1 )  that.currentPageDisplayed =1;
            return that.createList();
        },

        /**
         * @method goNextPage
         * @private
         * @description ASYNC
         * Attached on click event on button ">" in the footer, to go to the next page
         * @param {ListManager} that
         * @returns Promise
         */
        goNextPage:function (that) {
            that.currentPageDisplayed  = that.currentPageDisplayed + 1;
            if (that.currentPageDisplayed > that.totpages) that.currentPageDisplayed = that.totpages;
            return that.createList();
        },

        /**
         * @method goToPage
         * @private
         * @description ASYNC
         * Attached on click event on button "nPage" in the footer, to go at the page nPage
         * @param {ListManager} that
         * @param {number} nPage
         * @return  Promise
         */
        goToPage:function (that, nPage){
            that.currentPageDisplayed = nPage;
            return that.createList();
        },

        /**
         * @method goPreviousPage
         * @public
         * @description ASYNC
         * Attached on click event on button "<" in the footer, to go in the previous page
         * @param {ListManager} that
         * @return  Promise
         */
        goPreviousPage:function(that){
            if(that.currentPageDisplayed > 1)  that.currentPageDisplayed -= 1;
            return that.createList();
        },


        // *** START Methods MetaPage Interface ***

        /**
         * @method canSelect
         * @public
         * @description ASYNC
         * Return a deferred boolean true if control can select a row
         * @param {DataTable} dataTable
         * @param {DataRow} row
         * @returns Promise
         */
        canSelect: function (dataTable, row) {
            //TODO richiamare il canSelect della MetaPage
            let deferred = Deferred("canSelect");
            return deferred.resolve(true).promise();
        },

        /**
         * @method rowSelect
         * @public
         * @description ASYNC
         * Dispatches a row select through listeners if the control is not modal,
         *  otherwise it resolve immediately the deferred
         * @param {element} sender  object generating the event
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         * @returns Promise
         */
        rowSelect: function (sender, dataTable, row) {
            if (this.isModal) {
                // Nel caso modale, se il grid ospitato lancia un rowselect non deve fare nulla.
                // Torno la deferred poiché l'interfaccia della rowSelect prevede torni un Deferred.
                // Al click su una riga infatti viene invocato il click su grid,
                // il grid chiama la setRow e invoca la rowSelect sulla metaPage chiamante,
                // quindi in questo caso la metaPage è ListManager e proprio questo metodo rowSelect() ;
                // lui deve quindi tornare una Deferred altrimenti va in errore.

                // per il mobile la selezione avviene al singolo click
                if (appMeta.isMobile) {
                    this.closeAndResolveDeferred(row);
                }
                return Deferred("rowSelect").resolve();
            }
            // qui invece viene invocato la rowSelect sulla MetaPage vera e propria e lei torna Deferred
            // Di qua passa quando il listManager non è modale, ossia è associato a un form elenco sulla tabella principale
            let dtRow = row ? (row.getRow ? row.getRow() : null) : null;

            let self = this;
            return this.metaPage.warnUnsaved()
                .then(function (res) {
                    if (res) {
                        return Deferred("rowSelect").from(self.metaPage.selectRow(dtRow, self.listType)).promise();
                    }
                    self.gridControl.resetSelectedRow();
                    return Deferred("rowSelect").resolve();
                });
        },

        /**
         * @method rowDblClick
         * @private
         * @description SYNC
         * This was enabled for modal list, now it is not used anymore
         * Handler for the dbClick event on the grid of listManager
         * @param {GridControl} sender
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         */
        rowDblClick: function (sender, dataTable, row){
            this.closeListManager(dataTable, row);
        },

        closeAndResolveDeferred:function(row) {
            this.hideControl(this);
            this.defModal.resolve(row);
        },

        /**
         * @method closeListManager
         * @public
         * @description SYNC
         * Hides/removes the control graphically and resolve the deferred with the row selected.
         * It distinguishes 2 cases:
         * 1. modal resolve the "defModal" Deferred with the selected row
         * 2. not modal invoke selectRow on the Metapage
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         * @return Promise
         */
        closeListManager:function (dataTable, row) {
            if (this.isModal) {
                this.closeAndResolveDeferred(row);
            }
            else {
                // alla chiusura se non è modale lancia la rowSelect su metaPage
                // this.metaPage.rowSelect(null, dataTable, row);
                let dtRow = row ? (row.getRow ? row.getRow() : null) : null;
                let self = this;
                return this.metaPage.warnUnsaved()
                    .then(function (res) {
                        if (res) {
                            self.hideControl(self);
                            return Deferred("closeListManager").from(self.metaPage.selectRow(dtRow, self.listType)).promise();
                        }
                        self.gridControl.resetSelectedRow();
                        return Deferred("closeListManager").resolve();
                    });
            }
        },


        showWaitingIndicator:function (msg) {
            if (this.metaPage) return this.metaPage.showWaitingIndicator(msg);
        },

        hideWaitingIndicator:function (handler) {
            if (this.metaPage) this.metaPage.hideWaitingIndicator(handler);
        },

        /**
         * Create an instance of gridControl
         * @param {DataTable} dt
         */
        getGridInstance:function (dt) {
            if (!this.gridControl) {
                this.gridControl = new GridController(this.myRootListManger, this.metaPage.helpForm, dt, null, this.listType);
                this.gridControl.init();
                this.gridControl.doubleClickToExit=true;
            }
        }
        // *** END Methods MetaPage Interface  ***

    };

    window.appMeta.ListManager = ListManager;

}());
