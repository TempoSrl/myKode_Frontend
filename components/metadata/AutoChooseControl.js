/**
 * @module AutoChooseControl
 * @description
 * Manages the graphics and the logic of a autochoose.
 */
(function() {

    var Deferred = appMeta.Deferred;
    var getData = appMeta.getData;
    var positionType = appMeta.ListManager.E_POSITION_TYPE;

    /**
     *
     * @param {html node} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table
     * @param {DataTable} primaryTable
     * @param {string} listType
     * @constructor
     */
    function AutoChooseControl(el, helpForm, table, primaryTable, listType) {
        this.listManager = null;
        this.timeoutId = 0; // timer che permette di lanciare la query se tra 2 keyup passa più di mezzo secondo
        this.minCharacter = 3; // numero di caratteri per cui scatta la query
        this.msDelay = 500; // millisecondi di attesa massima

        this.helpForm = helpForm;
        this.DS = table.dataset;
        this.dataSourceName = table.name;
        this.tag = $(el).data("tag");
        this.el = el;
        this.listingType = $(el).data("listtype");
        $(el).addClass(appMeta.cssDefault.autoChoose);
        var startFilter = helpForm.getFilterFormDataAttribute(el);
        var kind = 'AutoChoose';
        var startfield = helpForm.getColumnName(this.tag);

        var ai = new appMeta.AutoInfo(el, this.listingType, startFilter, startfield, table.name, kind);
        $(el).on("keyup", _.partial(this.delay, this.keyup, this.msDelay, this));
        $(el).on("blur", _.partial(this.lostfocus, this));
        // aggiunge il text invisibile, che verrà utilizzato in ricerca tramite id sulla tabella referenziata,
        // inoltre aggiungo al tag ?x in modo tale che se non c'è un search tag il campo verrà
        // comunque abilitato in inserimento.
        if (helpForm.addInvisibleTextBox(ai)) {
            $(el).data("tag", helpForm.getStandardTag(this.tag) + "?x");
        }
    }

    AutoChooseControl.prototype = {
        constructor: AutoChooseControl,

        /**
         *
         * @returns {*}
         */
        keyup: function() {
            console.log("keyup");
            this.dataTable = this.metaPage.state.DS.tables[this.dataSourceName];
            var  metaToConsider = this.metaPage.state.meta;
            // il sort prendod al emtadato.se non lo trovo allora provo a vedere se sta sulla tabella, perchè configurato sul meta server e serializzato
            var sort =  metaToConsider.getSorting(this.listingType);
            sort = (sort ? sort : this.dataTable.orderBy());
            var self = this;
            var startFilter = this.helpForm.getFilterFormDataAttribute(this.el);

            var column = this.helpForm.getColumnName(this.tag);
            var startValue = $(this.el).val().trim();

            // costrusico filtro
            var filter = jsDataQuery.like(column, "%" + startValue + "%");
            if (startValue.length < this.minCharacter){
                if (startValue.length === 0 && self.listManager) self.listManagerHideControl();
                return;
            }
            filter  = this.helpForm.mergeFilters(filter, startFilter);
            this.rowSelected = false;
            // eseguo chiamata al ws
            return getData.getPagedTable(this.dataSourceName, 1, appMeta.config.listManager_nRowPerPage, filter, this.listingType, sort)
                .then(function(dataTablePaged, totPage, totRows) {
                    dataTablePaged.dataset = self.metaPage.state.DS;
                    if (!self.listManager) {
                        self.listManager = new appMeta.ListManager(self.dataSourceName, self.listingType, null, positionType.relative , self.el, self.metaPage, false, false, sort);
                        self.listManager.filter = filter;
                        self.listManager.show(dataTablePaged, totPage, totRows).then(function (res) {
                            if (res) {
                                // res tornato è un ObjectRow
                                return self.metaPage.checkSelectRow(self.dataTable, res.getRow())
                                    .then(function (dataRow) {
                                        return self.metaPage.selectOneCompleted(dataRow, self.dataTable, self.metaPage.rootElement)
                                    })
                                    .then(function (selected) {
                                        self.rowSelected = selected;
                                        if (!selected) self.helpForm.applyFocus(self.el);
                                    })
                            }
                            self.helpForm.applyFocus(self.el);
                        });
                    } else {
                        self.listManager.loadCore(dataTablePaged, totPage, totRows);
                    }

            })
        },

        /**
         *
         */
        lostfocus:function(that) {
            if (!that.canGoOut()) return that.helpForm.applyFocus(that.el);
        },

        /**
         * cancel the event if time < ms
         * @param {Function} callback to call after delay
         * @param {number} ms. the delay
         * @param {AutoChooseControl} that
         */
        delay:function(callback, ms, that) {
            var args = arguments;
            clearTimeout(that.timeoutId);
            that.timeoutId = setTimeout(function () {
                callback.apply(that, args);
            }, ms || 0);
        },

        // QUI INZIANO METODI DI INTERFACCIA Del CUSTOM CONTROL

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Fills the control. First to fill it resets the events rect
         */
        fillControl:function(el){
            var def = Deferred("AutoChoose-fillControl");
            return def.resolve();
        },

        /**
         * @method getControl
         * @public
         * @description ASYNC
         */
        getControl: function() {
        },

        /**
         * @method clearControl
         * @public
         * @description ASYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         * @returns {Deferred}
         */
        clearControl: function() {
            var def = Deferred("calendar-clearControl");
            return def.resolve();
        },

        /**
         * @method addEvents
         * @public
         * @description ASYNC
         * @param {html node} el
         * @param {MetaPage} metaPage
         * @param {boolean} subscribe
         */
        addEvents: function(el, metaPage, subscribe) {
            this.metaPage = metaPage;
            this.metaPage.eventManager.subscribe(appMeta.EventEnum.listManagerHideControl, this.listManagerHideControl, this);
        },

        /**
         * close the list manager associated to the control
         */
        listManagerHideControl:function() {
            // se non è selezionata nessuna riga non lo faccio uscire
           //  var cangoOut = this.canGoOut();
           // if (!cangoOut) return this.helpForm.applyFocus(this.el);
           // if (this.listManager) this.listManager.closeListManager();
           this.listManager = null
        },

        canGoOut:function() {
            var value = $(this.el).val();
            return !!this.rowSelected || value.length === 0;
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
            var def = Deferred("preFill-Grid");
            return def.resolve();
        }
    };

    window.appMeta.CustomControl("choose", AutoChooseControl);

}());
