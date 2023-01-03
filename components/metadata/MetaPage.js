/*global appMeta,_,$,jsDataSet */

/**
 * @module MetaPage
 * @description
 * Contains all methods applicable to the web page
 */
"use strict";

(function() {

    const utils = appMeta.utils;
    const localResource = appMeta.localResource;
    const metaModel = appMeta.metaModel;
    const getData = appMeta.getData;
    const postData = appMeta.postData;
    const q = window.jsDataQuery;
    const dataRowState = jsDataSet.dataRowState;

    const drawStates = {
        done: 0,
        prefilling: 1,
        filling: 2,
        clearing: 3
    };
    const currOperation = {
        none: 0,
        search: 1,
        setsearch: 2,
        save: 3,
        insert: 4,
        delete: 5,
        edit: 6
    };
    const Deferred = appMeta.Deferred;
    const ResolvedDeferred = appMeta.ResolvedDeferred;
    const logger = appMeta.logger;
    const logType = appMeta.logTypeEnum;
    const security = appMeta.security;
    appMeta.DrawStates = drawStates;
    appMeta.CurrOperation = currOperation;

    /**
     * Method called with claaMethod or fnMethod function
     * @type {string enum}
     */
    const toOverrideEvent = {
        afterFill: 'afterFill',
        beforeFill: 'beforeFill',
        afterClear: 'afterClear',
        beforeClear: 'beforeClear',
        beforePost: 'beforePost',
        afterPost: 'afterPost',
        onAssurePageState: 'onAssurePageState',
        freshToolBar: 'freshToolBar',
        setPageTitle: 'setPageTitle',
        afterLink: 'afterLink',
        afterActivation: 'afterActivation',
        beforeActivation: 'beforeActivation',
        doActivation: 'doActivation',
        doOptionalMainDoSearch: 'doOptionalMainDoSearch',
        clear: 'clear',
        setManager: 'setManager',
        listFilled: 'listFilled',
        afterGetFormData: 'afterGetFormData',
        afterRowSelect: 'afterRowSelect'
    };


    /**
     * @constructor
     * @description
     * The constructor of MetaPage. Each MetaPage is identified by "tableName" and "editType"
     * @param {string} tableName the name of the main table of the page
     * @param {string} editType the edit type to identify the specific dataset
     * @param {bool} isDetail
     * @returns {MetaPage}
     */
    function MetaPage(tableName, editType, isDetail) {

        /**
         * primary table name
         * @type {string}
         */
        this.primaryTableName = tableName;

        /**
         * current edittype
         * @type {string}
         */
        this.editType = editType;

        /**
         * name of root DOM element of the page
         * @type {string}
         */
        this.rootElement = "#metaRoot";

        /**
         *
         * @type {MetaPageState}
         */
        this.state = null;

        /**
         * @summary true when this page is a detail of another page
         * @type {boolean}
         * note that this value has to be set before a page is created
         */
        this.detailPage = isDetail;

        /**
         * Detail control name (optional)
         * @type {string}
         */
        this.detailControl = null;

        /**
         * Is true when init() has beend performed (and so helpForm has been created)
         */
        this.inited = false;

        /**
         * Is true when activate has been performed
         */
        this.activated = false;

        /**
         * @type {HelpForm}
         */
        this.helpForm = null;


        this.title = "Default title";
        this.drawState = appMeta.DrawStates.prefilling;
        this.currOperation = appMeta.CurrOperation.none;


        this.defaultListType = "default";
        this.startFilter = null;
        this.additionalSearchCondition = null;

        this.listManager = null;

        this.listTop = 1000;


        this.goingToEditMode = false;
        this.entityChanged = false;
        this.entityCalledChanged = false;
        this.firstFillForThisRow = false;

        this.eventManager = new appMeta.EventManager();
        this.dontWarnOnInsertCancel = false;

        /**
         * dict of the dependencies between txtFather and txtChild
         * @type {}
         */
        this.dependencies = {};

        // rappresenta il root node html del form parent
        this.savedRoot = null;
        // Booleani gestiti sulla commandEnabled()
        this.helpdeskEnabled = false;
        this.mainSelectionEnabled = false;
        this.searchEnabled = true;
        this.mainRefreshEnabled = true;

        this.isList = false;
        this.isTree = false;
        this.startEmpty = false;
        this.filterLocked = false;
        this.canInsert = true;
        this.canInsertCopy = true;
        this.canSave = true;
        this.canCancel = true;
        this.canShowLast = true;
        this.canCmdClose = true;

        // Intercetta l'errore server. serve per gestire eventuali azioni da fare sula maschera. utilizza il gestore global
        if (!appMeta.globalEventManager) appMeta.globalEventManager = new appMeta.EventManager();
        appMeta.globalEventManager.subscribe(appMeta.EventEnum.ERROR_SERVER, this.serverErrorHandler, this);

        return this;
    }


    MetaPage.prototype = {
        constructor: MetaPage,

        afterGetFormData: function () {
            return ResolvedDeferred(null, "afterGetFormData");
        },

        beforeFill: function () {
            return ResolvedDeferred(null, "beforeFill");
        },

        afterFill: function () {
            return ResolvedDeferred(null, "afterFill");
        },

        afterLink: function () {
            return ResolvedDeferred(null, "afterLink");
        },

        /**
         * @method serverErrorHandler
         * @public
         * @description ASYNC
         * Handles the ERROR_SERVER event. Hides eventually the loading indicator
         */
        serverErrorHandler:function () {
            if (this.modalLoader ) this.modalLoader.hideControl();
        },

        /**
         * @method beforeRowSelect
         * @public
         * @description ASYNC
         * Event fired before row selecting. To be eventually implemented in derived classes
         * @param {DataTable} t
         * @param {ObjectRow} r
         * @returns {Promise}
         */
        beforeRowSelect: function(t, r) {
            return ResolvedDeferred(null, "beforeRowSelect");
        },

        /**
         * @method afterRowSelect
         * @public
         * @description ASYNC
         * Event fired after row selecting. To be eventually implemented in derived classes
         * @param {DataTable} t
         * @param {ObjectRow} r
         * @returns {Deferred}
         */
        afterRowSelect: function (t, r) {
            return ResolvedDeferred(null, "afterRowSelect");
        },

        /**
         * @method freshForm
         * @public
         * @description ASYNC
         * Refills the form. If RefreshPeripherals is set to true, secondary tables
         * are read again from DB (i.e. all tables in the view that are not
         * cached, primary or child of primary).
         * @param {boolean} refreshPeripherals. When true, not-entity-or-cached-tables are cleared and read again from DB
         * @param {boolean} doPreFill. When true, also prefill is done, this is more expensive and should be done only once in a form
         * @param {string} tableName Table to Prefill
         * @param {string} container. id of the html string
         * @returns {Deferred}
         */
        freshForm: function(refreshPeripherals, doPreFill, tableName, container) {
            // default dei booleani. su mdl freshForm() viene passata con freshForm(true, false);
            refreshPeripherals = refreshPeripherals === undefined ? true : refreshPeripherals;
            doPreFill = doPreFill === undefined ? false : doPreFill;

            const self = this;
            const drawStateSaved = this.drawState;
            this.drawState =  appMeta.DrawStates.filling;
            const lastSelectedRow = this.helpForm.lastSelected(this.getPrimaryDataTable());
            let dtRow = null;
            // potrebbe essere stata detachata, poichè provengo da una cancellazione.
            if (lastSelectedRow && lastSelectedRow.getRow){
                dtRow = lastSelectedRow.getRow();
            }
            let def = Deferred("freshForm");
            const res = utils._if(refreshPeripherals)
            ._then(function (){
                return getData.doGet(self.state.DS, dtRow, self.primaryTableName, refreshPeripherals);
            })
            .then(function (){
                return utils._if(doPreFill)
                ._then(function (){
                    //NOTA BENE Se arrivo qui con dtRow ma senza dtRow.table controllare il parametro
                    //in querystring & searchon=on e metterlo a off
                    const filter = dtRow ? dtRow.table.keyFilter(lastSelectedRow) : null;
                    return self.doPreFill(tableName, filter);
                })
                .then(function (){
                    self.drawState = drawStateSaved;
                    return self.reFillControls(container);
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method rowSelect
         * @public
         * @description ASYNC
         * 1. Calls the auxiliar methods beforeRowSelect and afterRowSelect, that can be implemented externally
         * 2. if the table is not the main table it iterates only on the related controls, else
         *  calls the server, to refresh the peripheral tables
         *  3. Dispatch a row select through trigger ASYNC
         * @param {element} sender object generating the event
         * @param {DataTable} t the table of the row "r"
         * @param {ObjectRow} r the row selected that generates the event
         * @returns {Deferred}
         */
        rowSelect: function(sender, t, r) {
            const self = this;
            let waitingHandler;
            const result = this.beforeRowSelect(t, r)
            .then(function (){
                self.helpForm.lastSelected(t, r);
                if (t.name !== self.primaryTableName){
                    const parent = $(sender).parent();
                    self.helpForm.iterateFillRelatedControls(parent, sender, t, r);
                    return true;
                }
                // in questo caso mostro indicatore di attesa poiché devo aggiornare i controlli
                waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_page_update, true);
                self.state.currentRow = r;
                // la riga potrebbe essere cancellata, quindi detachata poichè si preme sulla stessa riga aggiunta ma si vuole fare il
                // discard delle modifiche, quindi eseguo questo check
                const dtRow = r ? (r.getRow ? r.getRow() : null) : null;

                return getData.doGet(self.state.DS, dtRow, self.primaryTableName, false) // fresh peripherals table, not entity tables
                .then(function (){
                    if (self.isTree && dtRow){
                        self.state.setEditState();
                    }
                    return self.freshForm(false, false);
                });
            })
            .then(function (){
                return self.eventManager.trigger(appMeta.EventEnum.ROW_SELECT, sender, t, r)
                .then(function (){
                    if (waitingHandler) self.hideWaitingIndicator(waitingHandler);
                    return self.afterRowSelect(t, r);
                });
            });

            return Deferred("rowSelect").from(result);
        },

        /**
         * @method hasUnsavedChanges
         * @private
         * @description ASYNC
         * Get the data from the controls, and verifies if the dataset has changes
         * @returns Deferred<bool> true if there are changes on the dataset, false otherwise
         */
        hasUnsavedChanges: function() {
            const that = this;
            const primaryDataTable = this.getPrimaryDataTable();
            return this.getFormData(true) //gets data without checks
                .then(function() {
                    return metaModel.hasChanges(that.state.DS,
                        primaryDataTable,
                        that.state.sourceRow(),
                        that.detailPage);
                });
        },

        /**
         * @method showMessage
         * @private
         * @description ASYNC
         * Shows a message box with a title, a text and with the buttons. It will resolve a deferred when user will click on one of the buttons
         * @param {string} title , the title of the message box
         * @param {string} text , the message of the message box
         * @param {string[]} buttons, it's an array of string with the name of the buttons. they will represnt also the labels of the buttons
         * @param {boolean} closeCommand
         * @result {Deferred(string)} the text of the buttons clicked, (when user will click it)
         */
        showMessage: function(title, text, buttons, closeCommand) {
            const winModal = new appMeta.BootstrapModal(title, text, buttons, closeCommand);
            return winModal.show(this);
        },

        /**
         * @method showMessageOkCancel
         * @private
         * @description ASYNC
         * Shows a message box with a message and the buttons "ok" and "cancel". Returns true if user press ok in the dialog, false otherwise
         * @param {String} msg
         * @returns {boolean} true if button pressed is "ok", false otherwise
         */
        showMessageOkCancel: function(msg) {
            // Fai apparire un messagebox di avviso con il testo
            return this.showMessage(localResource.alert,
                msg,
                [localResource.ok, localResource.cancel],
                localResource.cancel)
                .then(function(res) {
                    return (res === localResource.ok);
                });
        },

        /**
         * @method showMessageOk
         * @private
         * @description ASYNC
         * Shows a message box with a message and the button "ok" . Returns true if user press ok in the dialog, false otherwise
         * @param {String} msg
         * @returns {*} true if user close the window
         */
        showMessageOk: function(msg) {
            // Fa apparire un messagebox di avviso con il testo
            return Deferred("showMessageOk:"+msg).from(
                this.showMessage(localResource.alert, msg, [localResource.ok])
                    .then(function(res) {
                        return (res === localResource.ok);
                    }));
        },

        /**
         * @method warnUnsaved
         * @internal
         * @description ASYNC
         * Displays a message and stop form closing if there are unsaved changes
         * @returns Promise
         */
        warnUnsaved: function() {
            const currentRow = this.helpForm.lastSelected(this.getPrimaryDataTable());
            const result = Deferred("warnUnsaved");
            if (this.isList && !currentRow) return result.resolve(true);
            if (this.state.isInsertState() && this.dontWarnOnInsertCancel) return result.resolve(true);
            const self = this;
            result.from(this.hasUnsavedChanges()
                .then(function(result) {
                    if (!result) return true;
                    // Fai apparire un messagebox di avviso con il testo
                    return self.showMessageOkCancel(localResource.changesUnsaved);
                }));
            return result;
        },

        /**
         * @method updateState
         * @private
         * @description SYNC
         * Aligns form state to the current row state
         */
        updateState: function() {
            if (!this.state.currentRow) {
                this.state.setSearchState();
                return;
            }
            const stateDetached = !this.state.currentRow.getRow;
            if (stateDetached) {
                this.state.currentRow = null;
                this.state.setSearchState();
                return;
            }
            if (this.state.currentRow.getRow().state === dataRowState.added) {
                this.state.setInsertState();
                return;
            }
            this.state.setEditState();
        },

        /**
         * @method canSelect
         * @private
         * @description SYNC
         * Check if primary table can be changed to r
         * If there are unsaved changes, it shows a message box to the user. if user clicks "ok" it rejects changes and returns true.
         * If the user clicks "cancel" it returns false
         * @param {DataTable} t
         * @param {DataRow} r
         * @returns Promise<boolean>
         */
        canSelect: function(t, r) {
            const deferred = Deferred("MetaPage.canSelect");
            if (!t) {
                return deferred.resolve(true);
            }
            if (t.name !== this.primaryTableName) {
                return deferred.resolve(true);
            }
            if (r === this.state.currentRow) {
                return deferred.resolve(true);
            }

            const that = this;
            this.warnUnsaved()
                .then(function(res) {
                    if (res && that.state.DS.hasChanges()) {
                        that.state.DS.rejectChanges();
                        that.updateState();
                    }
                    deferred.resolve(!!res).promise();
                });

            return deferred.promise();
        },

        /**
         * @method setList. TODO
         * @protected
         * @description
         * Sets the given control as listManager for the page and establish that this page is a list
         * @remarks this must be called in a derived page, inside an afterLink method
         * @param {element} ctrlManager  deve essere un grid o un "tree"
         */
        setList: function(ctrlManager) {
            this.isList = true; //stabilisce che questo è un form lista
            this.listManager = ctrlManager; //controllo che gestisce la lista
        },

        /**
         * @method assureDataSet.
         * @private
         * @description ASYNC
         * If a Dataset is still not available asks to the server to create a dataset and returns it
         * @method assureDataSet
         * @returns Deferred<DataSet>
         */
        assureDataSet: function() {
            const res = Deferred("assureDataSet");

            if (!this.state) return res.reject("state shouldn't be empty");
            if (this.state.DS) return res.resolve(this.state.DS);

            const self = this;
            getData.getDataSet( this.primaryTableName, this.editType)
                .then(function (dataSet) {
                    self.setDataSet(dataSet);
                    res.resolve(dataSet);
                });

            return res.promise();
        },

        /**
         * @method fill
         * @private
         * @description ASYNC
         * Fills the controls, and call an afterFill method to implement externally eventually
         * @returns {*}
         */
        fill: function() {
            const self = this;
            return self.callMethod(toOverrideEvent.beforeFill)
                .then(function() {
                    return self.helpForm.fillControls();
                })
                .then(utils.skipRun(self.fnMethod(toOverrideEvent.afterFill)));
        },

        /**
         * @method getPrimaryDataTable
         * @private
         * @description SYNC
         * Returns the primary DataTable
         * @returns {DataTable} the primary DataTable
         */
        getPrimaryDataTable: function() {
            return this.getDataTable(this.primaryTableName);
        },

        /**
         * @method clear
         * @private
         * @description SYNC
         * Clears the page, resets some variables
         * @returns {Deferred}
         */
        clear: function() {
            const self = this;
            const def = Deferred("clear");

            this.helpForm.lastValidText("");
            this.state.setSearchState();
            this.drawState = appMeta.DrawStates.clearing;
            // metaModel.allowAllClear(this.state.DS);
            metaModel.clearEntity(this.state.DS);
            const primaryDataTable = this.getPrimaryDataTable();
            this.helpForm.lastSelected(primaryDataTable, null);
            this.state.currentRow = null;

            const res = this.callMethod(toOverrideEvent.beforeClear)
            .then(utils.optBind(self.helpForm.clearControls, self.helpForm))
            .then(utils.optionalDeferred(self.isRealClear(),
                function (){
                    return self.callMethod(toOverrideEvent.freshToolBar)
                    .then(self.fnMethod(toOverrideEvent.setPageTitle));
                }))
            .then(self.fnMethod(toOverrideEvent.afterClear))
            .then(function (){
                self.drawState = appMeta.DrawStates.done;
                return true;
            });

            return def.from(res).promise();
        },

        /**
         * @method isRealClear
         * @private
         * @description SYNC
         * Returs true if  no insert or edit are coming after the clear
         * @returns {boolean}
         */
        isRealClear:function () {
            return !(this.gointToInsertMode || this.goingToEditMode);
        },

        /**
         * @method setPageTitle
         * @public
         * @description SYNC
         * Based on the state of the form it sets the page title ("name of Page" + "suffix depending on state")
         */
        setPageTitle: function() {
            let suffix = localResource.insertTitle;
            if (this.state.isSearchState()) {
                suffix = localResource.searchTitle;
            }
            if (this.state.isEditState()) {
                suffix = localResource.changeTitle;
            }
            this.setTitle(this.getName() + " (" + suffix + ")");
        },

        /**
         * @method getName
         * @internal
         * @description SYNC
         * To override. sets the name of the page
         */
        getName:function () {
            return (this.name !== undefined) ? this.name : "";
        },

        /**
         * @method setTitle
         * @internal
         * @description SYNC
         * Sets page title private variable
         * @param {string} title
         */
        setTitle: function(title) {
            this.title = title;
            document.title = title;
        },

        /**
         * @method activate
         * @public
         * @description ASYNC
         * Function called the first time the page is showed. It fills the controls.
         * Opens also the deferred, that will be solved, at the exit or during some action in the detail page
         * @returns {Promise}
         */
        activate: function() {
            const self = this;
            if (self.activated) return self.freshToolBar();

            // ogni volta che chiamo una nuova metapage metto indicatore di caricamento.
            // Lo nascondo al termine della funz. activate()
            let msg = localResource.modalLoader_wait_metapage_loading;
            if (self.detailPage) msg = localResource.modalLoader_wait_metapageDetail_loading;
            const waitingHandler = self.showWaitingIndicator(msg);

            this.drawState = drawStates.prefilling;
            const primaryDataTable = self.getPrimaryDataTable();
            const meta = self.state.meta;

            // Apre il deferred, che verrà risolto su qualche tipo di comando o alla chiusura della maschera
            this.deferredResult = Deferred("DialogResult");
            //afterLink is the first custom method called in a metapage.
            //All structural information about the page should be set inside it
            return self.callMethod(toOverrideEvent.afterLink)
                .then(utils.optBind(meta.describeColumnsStructure, meta, primaryDataTable))
                .then(self.setTitle.bind(self, meta.getName(self.editType)))
                //per ora salto:dbConn.PrefillStructures(ds, primaryTableName);
                .then(utils.optBind(appMeta.getData.readCached, appMeta.getData, self.state.DS))
                .then(self.fnMethod(toOverrideEvent.beforeActivation))
                .then(function() {
                    self.activated = true;
                    return true;
                })
                .then(utils.optBind(meta.setDefaults, meta, primaryDataTable))
                .then(utils.optBind(self.helpForm.preScanControls, self.helpForm)) // myAdjustTablesForGridDisplay(linkedForm);
                .then(_.bind(self.helpForm.addEvents, self.helpForm, self))
                //.then(self.fnMethod("setHandlers")) non più necessario: sarà tutto gestito con controlli semi-custom
                .then(function () {
                    return self.doPreFill();
                })
                .then(utils.optBind(self.setCaptions, self, self.editType))
                .then(utils.optBind(self.setSubentityDefaults, self))
                .then(utils.optBind(self.describeEntityColumnsStructure, self))
                .then(self.fnMethod(toOverrideEvent.doActivation))
                //.then(self.fnMethod(toOverrideEvent.afterActivation))
                .then(function() {
                    self.drawState = drawStates.done;
                    return true;
                })
                .then(self.fnMethod(toOverrideEvent.freshToolBar))
                .then(self.fnMethod(toOverrideEvent.doOptionalMainDoSearch))
                .then(function () {
                    // al termine tolgo indicatore di caricamento
                    self.hideWaitingIndicator(waitingHandler);
                    return true;
                });
        },

        /***
         * To call only once, sets all subentities defaults
         * */
        setSubentityDefaults: function () {
            /* DataTable */
            let mainTable = this.getPrimaryDataTable();
            if (!mainTable) return;
            let relations = mainTable.childRelations();
            _.forEach(relations,  (rel) => {
                let childTableName = rel.childTable;
                let childTable = this.getDataTable(childTableName);
                if (!metaModel.isSubEntity(childTable, mainTable)) {
                    return true; // continua nel ciclo
                }

                let metaChild = appMeta.getMeta(childTableName);
                metaChild.setDefaults(childTable);
            });

            _.forEach(this.state.extraEntities, (tableName) => {
                let extra = this.getDataTable(tableName);              

                let metaExtra = appMeta.getMeta(tableName);
                metaExtra.setDefaults(extra);
            });
        },

        /**
         * @method setCaptions
         * @public
         * @description ASYNC
         * Loops on main meta and subentities meta calling the setCaption.
         * Should be called for specific columns that have a caption different by the caption on colDescr.
         * "colDescr" is read at the begging backend side and populates the caption of the column
         * @param {string} editType
         */
        setCaptions:function(editType) {
            const self = this;
            self.state.meta.setCaption(self.getPrimaryDataTable(), editType);
            const metaForCaptions = _.concat(this.state.extraEntities);
            _.forEach(metaForCaptions, function (tname) {
                const currMetaData = appMeta.getMeta(tname);
                if (!!currMetaData && !!self.state.DS.tables[tname]) currMetaData.setCaption(self.state.DS.tables[tname], editType);
            });
        },

        /**
         * Calls the structure table for each extra entities.
         */
        describeEntityColumnsStructure:function () {
            const self = this;
            _.forEach(this.state.extraEntities, function (tname) {
                const currMetaData = appMeta.getMeta(tname);
                if (!!currMetaData && !!self.state.DS.tables[tname]) currMetaData.describeColumnsStructure(self.state.DS.tables[tname]);
            });
        },


        /**
         * @method doOptionalMainDoSearch
         * @private
         * @description ASYNC
         * If exists a "firstSearchFilter" filter it performs a maindosearch command, otherwise it resolves the deferred with a null value
         * @returns Deferred
         */
        doOptionalMainDoSearch: function() {
            let def = Deferred("doOptionalMainDoSearch");
            if (this.firstSearchFilter) {
                const searchFilter = this.firstSearchFilter;
                this.firstSearchFilter = null;
                return def.from(this.doMainCommand("maindosearch" + "." + this.defaultListType , searchFilter)).promise();
            }

            return  def.resolve(null);
        },

        /**
         * @method doActivation
         * @private
         * @description ASYNC
         * Does specific activation operations basing on form type
         * @returns Promise
         */
        doActivation: function() {
            // Su MDL lo stato edit veniva settato qui: MetaData.Edit() -> MetaData.doEdit() -> MetaData.linkToForm() -> Formcontroller.doLink() (rr 256)
            const sRow = this.state.sourceRow();
            if (sRow) {
                this.state.setEditState();
                if (sRow.state === dataRowState.added) this.state.setInsertState();
            }

            if (this.isList && this.startEmpty) return this.doActivation_EmptyList();
            if (this.isList) return this.doActivation_NotEmptyList();
            if (this.state.isSearchState()) return this.doActivation_EmptyMain(); // form singolo principale
            return this.doActivation_NotEmptyMain();    // form singolo di dettaglio
        },

        /**
         * @method doActivation_EmptyList
         * @private
         * @description ASYNC
         * @returns Deferred
         */
        doActivation_EmptyList: function() {
            const self = this;
            return self.callMethod(toOverrideEvent.clear)
                .then(self.fnMethod(toOverrideEvent.setManager));
        },


        /**
         * @method doActivation_NotEmptyList
         * @private
         * @description ASYNC
         * @returns Promise
         */
        doActivation_NotEmptyList: function() {
            const def = Deferred("doActivation_NotEmptyList");
            const self = this;
            let exitImmediately = false;


            this.setManager();

            const res = utils._if(this.isTree)
            ._then(function (){

                return utils._if(!self.helpForm.mainTableSelector)
                ._then(function (){
                     return self.showMessageOk(localResource.getFormNoMainTreeView(self.getName()))
                    .then(function (){
                        self.drawState = drawStates.done;
                        self.inited = true;
                        exitImmediately = true;
                        return self.freshToolBar();
                    });
                })
                .then(function (){
                    if (!exitImmediately){

                        const treeManager = self.helpForm.mainTableSelector; // settato durante la preFill del TreeViewManager
                        let treeFilled = false;

                        return utils._if(self.manageParams && self.manageParams.startFieldWanted)
                        ._then(function (){
                            return self.helpForm.setTreeByStart(treeManager,
                                self.manageParams.startFilter, self.manageParams.startValueWanted, self.manageParams.startFieldWanted)
                            .then(function (res){
                                treeFilled = res;
                                if (!treeFilled){
                                    return self.showMessageOk(localResource.requiredRow_not_found);
                                }
                            });
                        }).then(function (){
                            // prosegue nel then
                            if (!treeFilled){
                                // eseguirà la fillpoichè il secondo prm è false
                                return treeManager.filteredPreFillTree(self.startFilter, false);
                            }
                            return true;

                        });
                    }
                });
            })
            ._else(function (){
                return self.getPrimaryTable(self.startFilter)
                .then(function (){
                    security.deleteAllUnselectable(self.getPrimaryDataTable());
                    return true;
                });
            })
            .then(function (){
                if (exitImmediately){
                    return true;
                }

                // Seleziono la prima. Nel caso GRID ci pensa il controllo stesso dopo il load.
                // Sul tree lasciamo come mdl, dovrei vedere le implicazioni e dove mettere
                //  la selezione al 1o caricamento nel tree
                if (self.isTree){
                    const pt = self.getPrimaryDataTable();
                    if (pt.rows.length > 0){
                        if (!self.helpForm.lastSelected(pt)){
                            self.helpForm.lastSelected(pt, pt.rows[0]);
                        }
                    }
                }


                // In realtà qui andrebbe controllato se, nel caso di form lista non
                // tree (ossia grid), è stato effettivamente letto qualcosa.
                // In tal caso il form dovrebbe andare in search e non in edit.
                const lastSelected = self.helpForm.lastSelected(self.getPrimaryDataTable());
                if (lastSelected){
                    self.currOperation = currOperation.edit; //assumes something has been displayed
                    self.state.setEditState();
                }

                return self.callMethod(toOverrideEvent.afterActivation).then(function (){
                    self.firstFillForThisRow = true;
                    const dtRow = lastSelected ? lastSelected.getRow() : null;
                    return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, dtRow, "doActivation_NotEmptyList")
                    .then(function (){
                        return self.reFillControls(); // DOES NOT ANYMORE sets form_drawstate to "done"
                    })
                    .then(function (){
                        return self.callMethod(toOverrideEvent.listFilled);
                    })
                    .then(function (){
                        return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, dtRow, "doActivation_NotEmptyList");
                    })
                    .then(function (){
                        self.firstFillForThisRow = false;
                        return true;
                    });
                });

            });

            return def.from(res).promise();
        },

        /**
         * @method doActivation_EmptyMain
         * @private
         * @description ASYNC
         * Activates a single form
         * @returns {Deferred}
         */
        doActivation_EmptyMain: function() {
            const self = this;
            const def = Deferred("doActivation_EmptyMain");
            const res = this.callMethod(toOverrideEvent.afterActivation).then(
                function (){
                    self.inited = true; //se no non funzionano i comandi eventuali nell'afterclear

                    return utils._if(self.state.isSearchState())
                    ._then(function (){
                        return self.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, self, "doActivation_EmptyMain")
                        .then(function (){
                            return self.clear();
                        })
                        .then(function (){
                            return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "doActivation_EmptyMain");
                        });
                    })
                    .then(function (){
                        self.drawState = drawStates.done;
                        if (self.firstSearchFilter){
                            return self.doMainCommand("maindosearch" + "." + self.defaultListType, self.firstSearchFilter)
                            .then(function (){
                                self.firstSearchFilter = null;
                                return true;
                            });
                        }
                    });
                });

            return def.from(res).promise();
        },

        /**
         * @method startFrom
         * @private
         * @description SYNC
         * @param {DataRow} start
         */
        startFrom:function (start) {
            const def = Deferred("startFrom");
            const self = this;
            const res = getData.readCached(this.state.DS).then(function (){
                metaModel.xCopyChilds(self.state.DS, start.table.dataset, start);
                const primaryDataTable = self.getPrimaryDataTable();
                const rSel = primaryDataTable.rows[0];
                self.helpForm.lastSelected(primaryDataTable, rSel);
            });

            return def.from(res).promise();
        },

        /**
         * @method doActivation_NotEmptyMain
         * @private
         * @description ASYNC
         * Here we are in the detail Page
         * @returns {Deferred}
         */
        doActivation_NotEmptyMain: function() {
            const def = Deferred("doActivation_NotEmptyMain");
            this.drawState = drawStates.prefilling;

            const primaryDataTable = this.getPrimaryDataTable();
            const sRow = this.state.sourceRow();

            metaModel.copyAutoincrementsProperties(sRow.table, primaryDataTable);

            // ok passate già nella callPage -> primaryTable.ExtendedProperties[extraParams] = meta.sourceRow.Table.ExtendedProperties[extraParams];
            // --> Decommentare ed utilizzare se serve per fare operazioni sul sourceRow. -> meta.SetEntityDetail(meta.sourceRow);

            const self = this;
            const res = this.startFrom(sRow)
            .then(function (){
                const start = self.helpForm.lastSelected(primaryDataTable);

                self.state.setEditState();
                if (sRow.state === dataRowState.added) self.state.setInsertState();

                const dtRow = start.getRow();

                return getData.doGet(self.state.DS, start.getRow(), primaryDataTable.name, true)
                .then(self.fnMethod(toOverrideEvent.afterActivation))
                .then(function (){
                    self.firstFillForThisRow = true;
                    return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent,
                        dtRow,
                        "doActivation_NotEmptyMain");
                })
                .then(function (){
                    return self.reFillControls();
                })
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent,
                        dtRow,
                        "doActivation_NotEmptyMain");
                })
                .then(function (){
                    self.firstFillForThisRow = false;
                    self.drawState = drawStates.none;
                    return true;
                });
            });


            return def.from(res).promise();
        },

        /**
         * @method setManager
         * @private
         * @description SYNC
         * Sets the event handlers for
         */
        setManager: function() {
            const manager = this.listManager;// funge da parametro C del resto del codice commentato, messo sul setList
            if (!manager) return;
        },

        /**
         * @method closing
         * @private
         * @description ASYNC
         */
        closing: function() {
            // TODO ? che deve fare
        },

        /**
         * @method freshToolBar
         * @private
         * @description ASYNC
         * Executes the refresh of the toolbar, based on current MetaPage state
         * returns {Deferred}
         */
        freshToolBar: function() {
            const def = Deferred('freshToBar');
            if (!this.inited && !this.isList) return def.resolve(false);

            const tb = appMeta.currApp.getToolBarManager();
            if (!tb) return def.resolve(false).promise();
            // assegno la metaPage corrente
            tb.setMetaPage(this);
            return def.from(tb.freshButtons()).promise();
        },

        /**
         * @method beforeClosing
         * @public
         * @description ASYNC
         */
        beforeClosing: function() {

        },

        /**
         * @method setDataSet
         * @private
         * @description SYNC
         * Sets the dataset state property
         * @param {DataSet} ds
         */
        setDataSet: function(ds) {
            this.state.DS = ds;
        },

        // ******************* INIZIO REGION DO MAIN COMMAND *******************

        /**
         * @method commandEnabled
         * @public
         * @description ASYNC
         * Verifies if a certain command can be ran, i.e. if the corresponding button should be "enabled".
         * @param {string} tag
         * @returns {Deferred}
         */
        commandEnabled: function(tag) {
            const def = Deferred("commandEnabled");

            if (!this.helpForm) {
                return def.resolve(false);
            }
            const cmd = this.helpForm.getFieldLower(tag, 0);
            const currRow = this.helpForm.lastSelected(this.getPrimaryDataTable());

            switch (cmd) {
                case "mainclose":
                    if (!this.canCmdClose) return def.resolve(false);
                    return def.resolve(this.canClose());
                case "mainselect":
                    if (!this.mainSelectionEnabled) return def.resolve(false);
                    if (currRow === null) return def.resolve(false);
                    return def.resolve(security.canSelect(currRow));
                case "editnotes":
                    return def.resolve(false);
                /* TODO
                 if (!(HasNotes() || HasOleNotes())) return def.resolve(false);
                 return def.resolve(true);
                 */
                case "addnotes":
                    return def.resolve(false);
                /* TODO
                 if (!(HasNotes() || HasOleNotes())) return def.resolve(false);
                 if (NotesAvailable()) return def.resolve(false);
                 return def.resolve(true);
                 */
                case "maininsert":
                    if (!this.canInsert) return def.resolve(false);
                    if (this.detailPage) return def.resolve(false);
                    if (this.state.isInsertState()) return def.resolve(false);
                    if (security.cantUnconditionallyPost( this.getPrimaryDataTable(), "I")) return def.resolve(false);
                    return def.resolve(true);
                case "maininsertcopy":
                    if (!this.canInsert) return def.resolve(false);
                    if (!this.canInsertCopy) return def.resolve(false);
                    //if (!CanSave) return false;
                    if (this.detailPage) return def.resolve(false);
                    if (this.state.isInsertState()) return def.resolve(false);
                    if (this.state.isSearchState()) return def.resolve(false);
                    if (!currRow) return def.resolve(false);
                    if (security.cantUnconditionallyPost(this.getPrimaryDataTable(), "I")) return def.resolve(false);
                    return def.resolve(true);
                case "maindosearch":
                    if (this.searchEnabled === false) return def.resolve(this.searchEnabled);
                    if (this.detailPage) return def.resolve(false);
                    if (!this.state.isSearchState()) return def.resolve(false);
                    return def.resolve(true);
                case "emptylist":
                    if (this.searchEnabled === false) return def.resolve(false);
                    if (this.detailPage) return def.resolve(false);
                    if (!this.state.isSearchState()) return def.resolve(false);
                    return def.resolve(true);
                case "mainsetsearch":
                    if (this.searchEnabled === false) return def.resolve(false);
                    if (this.detailPage) return def.resolve(false);
                    return def.resolve(true);
                case "gotonext":
                    return def.resolve(false);
                // TODO return HasNext();
                case "gotoprev":
                    return def.resolve(false);
                // TODO return HasPrev();
                case "showlast":
                    if (!this.canShowLast) {
                        return def.resolve(false);
                    }
                    if  (this.state.isSearchState())  {
                        return def.resolve(false);
                    }
                    return def.resolve(true);
                case "mainsave":
                    if (!this.canSave) return def.resolve(false);
                    if (this.state.isSearchState()) return def.resolve(false);
                    if (!currRow) return def.resolve(false);
                    if (currRow.getRow().state === dataRowState.added) {
                        return def.resolve(!security.cantUnconditionallyPost(this.getPrimaryDataTable(), "I"));
                    }
                    return def.resolve(security.canPost(currRow));
                case "maindelete":
                    if (!this.canSave && !this.detailPage) return def.resolve(false);
                    if (!this.canCancel) return def.resolve(false);
                    if (this.state.isSearchState()) return def.resolve(false);
                    // if ((this.state.isEditState()) && (this.detailPage)) return def.resolve(false);
                    if (!currRow) return def.resolve(false);
                    if (currRow.getRow().state === dataRowState.added) return def.resolve(true);
                    return def.resolve(security.canPost(currRow));
                case "mainrefresh":
                    if (!this.mainRefreshEnabled) return def.resolve(false);
                    if (this.isTree) return def.resolve(false);
                    return def.resolve(true);
                case "mainexportpdf":
                    if (this.state.isSearchState()) return def.resolve(false);
                    if (!currRow) return def.resolve(false);
                    return def.resolve(true);
                case "crea_ticket":
                    return def.resolve(this.helpdeskEnabled);

                default:
                    return def.resolve(false);

            }

        },

        /**
         * @method canClose
         * @private
         * @description SYNC
         * TO override
         * Returns true if metaPage can close
         */
        canClose:function () {
            return true;
        },

        /**
         * @method doMainCommandClick
         * @internal
         * @description ASYNC
         * Called by helpForm, by buttons with knew tag, binded with _partial
         * "this" here represents the html node button that fired the event.
         * I need to pass MetaPage in "that" prm to use doMainCommand() that use "this" as MetaPage
         * @param {MetaPage} that
         * @param {string} tag
         * @param {jsDataQuery} [filter]
         * @returns {Deferred}
         */
        doMainCommandClick:function (that, tag, filter) {
            logger.log(logtypeEnum.INFO,"executing "+tag+" of "+that);
            console.log("doMainCommandClick "+tag)
            return that.doMainCommand(tag, filter).
                then(function () {
                    logger.log(logtypeEnum.INFO,"done with "+tag)
                    console.log("raising buttonClickEnd of "+tag)
                    return  appMeta.globalEventManager.trigger(appMeta.EventEnum.buttonClickEnd, that, tag);
                });
        },

        /**
         * @method doMainCommand
         * @public
         * @description ASYNC
         * Does a generic command based on the tag parameter
         * @param {string} tag
         * @param {jsDataQuery} [filter]
         * @return Promise
         */
        doMainCommand: function(tag, filter) {
            const def = Deferred("doMainCommand: " + tag);
            if (!this.helpForm) return def.resolve(false);
            const command = this.helpForm.getFieldLower(tag, 0);
            if (!command) {
                logger.log(logType.ERROR, "Your command does not have a valid tag");
                return def.reject("Your command does not have a valid tag");
            }

            if (command === "crea_ticket") return def.from(this.cmdCreateTicket());

            if (command === "mainselect") return def.from(this.cmdMainSelect());

            if (command === "mainsetsearch") return def.from(this.cmdMainSetSearch());

            if (command === "maindosearch" || command === "emptylist") return def.from(this.cmdMainDoSearch(command, tag, filter));

            if (command === "showlast") return def.from(this.cmdShowLast());

            if (command === "mainsave") return def.from(this.cmdMainSave());

            if (command === "gotonext") return def.from(this.cmdGoToNext());

            if (command === "gotoprev") return def.from(this.cmdGoToPrev());

            if (command === "editnotes" || command === "addnotes") return def.from(this.cmdEditAddNotes());

            if (command === "maininsert") return def.from(this.cmdMainInsert());

            if (command === "maininsertcopy") return def.from(this.cmdMainInsertCopy());

            if (command === "maindelete") return def.from(this.cmdMainDelete());

            if (command === "manage") return def.from(this.manage(tag, null, null, filter));

            if (command === "choose") return def.from(this.choose(tag, filter, null));

            if (command === "mainclose") return def.from(this.cmdClose());

            if (command === "mainexportpdf") return def.from(this.exportPdf());


            return def.from(this.doCommand(command)).promise();

        },

        exportPdf: function() {
            return appMeta.PdfExport.exportToPdf(this);
        },

        /**
         * @method doCommand
         * @public
         * @description ASYNC
         * To override. Called on button
         * @param command
         * @returns {Deferred}
         */
        doCommand: function(command) {
            return Deferred("doCommand:" + command).resolve(true);
        },

        /**
         * @method cmdClose
         * @internal
         * @description ASYNC
         * Close the page. It returns to the caller if there is a caller page
         * @returns Promise
         */
        cmdClose:function () {
            const def = Deferred("cmdClose");
            if (!this.canClose()) return def.resolve();

            let res;
            const self = this;
            if (this.isEmpty()) {
                res =  appMeta.currApp.returnToCaller()
                    .then(function () {
                        // risolvo il deferredResult rimasto aperto dopo l'activate
                        self.deferredResult.resolve(false);
                        return def.resolve(true);
                    });

                return def.from(res).promise();
            }

            res =  this.warnUnsaved()
                .then(function(res) {
                    if (res) {
                        return appMeta.currApp.returnToCaller()
                            .then(function () {
                                self.deferredResult.resolve(false);
                                return def.resolve(true);
                            });
                    }

                    return def.resolve();
                });

            return def.from(res).promise();
        },


        /**
         * @method cmdCreateTicket
         * @private
         * @description ASYNC
         * @returns {Deferred}
         */
        cmdCreateTicket:function () {
            return this.callMethod("doHelpDesk")
                .then(function() {
                    return Deferred("create_ticket").resolve(true).promise();
                });
        },

        /**
         * @method cmdMainSelect
         * @private
         * @description ASYNC
         * Executes a mainSelect
         * @returns Promise
         */
        cmdMainSelect:function () {
            const def = Deferred("cmdMainSelect");
            const self = this;
            return this.warnUnsaved()
                .then(function(res) {
                    if (res) {
                        self.state.DS.rejectChanges();
                        return def.from(self.mainSelect());
                    }
                    return def.resolve(false);
                });
        },

        /**
         * @method mainSelect
         * @private
         * @description ASYNC
         * Do a "mainselect" command, i.e. the current primary table row is "choosen". It resolve also the
         *  deferredResult opened during the activation phase,
         * when returns to the caller
         * and returned to the caller Form
         * @returns {Deferred} deferred
         */
        mainSelect:function () {
            const def = Deferred("mainSelect");
            const self = this;

            if (this.state.callerState) this.state.callerState.calledPageSelectedRow = null;
            let sel = null;
            if (this.primaryTableName) sel = this.helpForm.lastSelected(this.getPrimaryDataTable());

            if (!sel) return def.resolve(false);

            if (!sel.getRow) return def.resolve(false); // Equivale alle al check su detached, che per robustezza lascio anche dopo
            if (sel.getRow().state === dataRowState.deleted) return def.resolve(false);
            if (sel.getRow().state === dataRowState.detached) return def.resolve(false);

            // imposto sullo stato della pagina chiamante la proprietà calledPageSelectedRow
            // in modo tale che al ritorno la pag chiamante abbia la riga, ad esempio nel manage
            if (this.state.callerState) this.state.callerState.calledPageSelectedRow = sel;

            const ctrl = this.helpForm.mainTableSelector;
            const isTreeControl = ctrl ? ctrl.superClass ? (ctrl.superClass.constructor.name === 'TreeViewManager') : (ctrl.constructor.name === "TreeViewManager") : false;
            return this.canSelect(this.getPrimaryDataTable(), sel.getRow())
                .then(function(res) {
                    if (!res) return def.resolve(false);

                    if (self.helpForm.mainTableSelector && isTreeControl) {

                        const tn = ctrl.selectedNode(); // la funz torna un jsTreeNode non un TreeNode della lib. quindi lo recupero con original
                        if (!tn) return def.resolve(false);
                        if (!tn.original) return def.resolve(false);
                        if (tn.original.toExplore) return def.resolve(false);
                        return tn.original.canSelect()
                            .then(function(res) {
                                if (!res) {
                                    return self.showMessageOk(localResource.selectedRowIsNotOperative)
                                        .then(function () {
                                            return def.resolve(false);
                                        });
                                }

                                self.helpForm.lastSelected(self.getPrimaryDataTable(), sel);
                                return appMeta.currApp.returnToCaller()
                                    .then(function() {
                                        // risolve il deferred aperto nella activate()
                                        self.deferredResult.resolve(true);
                                        return def.resolve(true);
                                    });
                            });
                    }
                });

        },

        /**
         * @method cmdMainSetSearch
         * @private
         * @description ASYNC
         * @returns {Promise}
         */
        cmdMainSetSearch:function () {
            const def = Deferred("cmdMainSetSearch");
            const self = this;
            const res = this.warnUnsaved()
            .then(function (res){
                if (res){
                    self.currOperation = currOperation.setsearch;
                    self.state.setSearchState();
                    self.helpForm.lastValidText("");
                    self.state.DS.rejectChanges();
                    if (self.isTree){
                        self.closeListManagerResultsSearch();
                        return self.treeSetSearch()
                        .then(function (){
                            self.currOperation = currOperation.none;
                            return def.resolve(true);
                        });
                    }

                    return self.eventManager
                    .trigger(appMeta.EventEnum.startClearMainRowEvent, self, "cmdMainSetSearch")
                    .then(function (){
                        self.closeListManagerResultsSearch();
                        return self.clear();
                    })
                    .then(function (){
                        return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent,
                            self,
                            "cmdMainSetSearch").then(
                            function (){
                                self.currOperation = currOperation.none;
                                return def.resolve(true);
                            }
                        );
                    });
                }
                return def.resolve(true);
            });

            return def.from(res).promise();
        },

        /**
         * @method treeSetSearch
         * @private
         * @description ASYNC
         */
        treeSetSearch:function () {
            const def = Deferred("treeSetSearch");

            const self = this;
            this.state.setSearchState();

            this.helpForm.lastSelected(this.getPrimaryDataTable(), null);
            if (this.state.callerState) this.state.callerState.calledPageSelectedRow = null;

            // metaModel.allowAllClear(this.state.DS);

            const res = this.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, self, "treeSetSearch")
            .then(function (){
                self.helpForm.lastValidText("");
                self.helpForm.clearControls();
                return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "treeSetSearch");
            })
            .then(function (){
                return self.freshToolBar();
            })
            .then(function (){
                self.setPageTitle();
                self.entityChanged = false;
                return self.callMethod(toOverrideEvent.afterClear);
            })
            .then(function (){
                self.currOperation = currOperation.done;
                return true;
            });

            return def.from(res).promise();

        },

        /**
         * @method cmdMainDoSearch
         * @private
         * @description ASYNC
         * @param {string} command
         * @param {string} tag
         * @param {jsDataQuery} [startFilter]
         * @returns Promise
         */
        cmdMainDoSearch:function (command, tag, startFilter) {
            const def = Deferred("cmdMainDoSearch");
            const self = this;
            this.currOperation = currOperation.search;
            self.state.setSearchState();
            const emptyList = (command === "emptylist");
            let listType = this.helpForm.getFieldLower(tag, 1);
            if (!listType) listType = this.defaultListType;
            // vecchia gestione var startFilter = this.helpForm.getLastField(tag, 2);
            if (!startFilter) startFilter = this.startFilter;
            startFilter = this.helpForm.mergeFilters(startFilter, this.additionalSearchCondition);


            const waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_search);

            const res = utils._if((!this.isList) || this.isTree)
            ._then(function (){
                return self.searchRow(listType, startFilter, emptyList);
            })
            ._else(function (){
                return self.filterList(startFilter);
            })
            .then(function (data){
                self.currOperation = currOperation.none;
                self.hideWaitingIndicator(waitingHandler);
                return data;
            });

            return def.from(res).promise();
        },

        /**
         * @method searchRow
         * @private
         * @description ASYNC
         * @param {string} listType
         * @param {jsDataQuery} startFilter filter SQL filter to apply in data retrieving
         * @param {boolean} emptyList
         * @returns Promise<boolean>
         */
        searchRow: function(listType, startFilter, emptyList) {

            this.closeListManagerResultsSearch();

            const def = Deferred('searchRow');
            const self = this;
            if (!this.primaryTableName) return def.resolve(false);
            const filter = this.helpForm.iterateGetSearchCondition();
            let mergedFilter;
            if (filter || startFilter) {
                mergedFilter = self.helpForm.mergeFilters(filter, startFilter);
            } else {
                logger.log(logType.WARNING, "iterateGetSearchCondition is undefined and startFilter undefined");
            }

            let top = 1000;
            if (emptyList) top = 0;
            this.listTop = top;

            const res = this.selectOne(listType, mergedFilter, null, null)
            .then(function (dataRow){
                if (!dataRow) return def.resolve(false);

                return self.selectRow(dataRow, listType)
                .then(function (){
                    dataRow.del(); // TODO ci va ancora, perchè lo faceva in mdl???
                    def.resolve(true);
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method selectRow
         * @internal
         * @description ASYNC
         * Called when a row is selected form a list, should fill the mainform
         * subsequently. In case of a list-form, entity table should not be cleared.
         * dataRow is the row from which start the filling of the form  - does not belong to DS
         * @param {DataRow} dataRow
         * @param {string} listType
         * @returns Promise<boolean>
         */
        selectRow:function(dataRow , listType) {
            const def = Deferred('selectRow');
            const self = this;

            if (!dataRow) return def.resolve(false);
            if (!this.helpForm.primaryTable) return def.resolve(false);

            if (this.isList && this.isTree) return def.from(this.treeSelectRow(dataRow, listType));

            this.state.setSearchState();
            this.drawState = drawStates.clearing;

            metaModel.clearEntity(this.state.DS);


            const waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_page_update, true);

            this.goingToEditMode = true;
            const res = this.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, this, "selectRow")
            .then(function (){
                return self.clear();
            })
            .then(function (){
                return self.callMethod(toOverrideEvent.afterClear)
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "selectRow");
                })
                .then(function (){

                    self.goingToEditMode = false;
                    const primaryTable = self.getPrimaryDataTable();

                    logger.log(logType.WARNING, "pre getDsByRowKey - Prima della chiamata al server: " + logger.getTimeMs());

                    // Condensati insieme  getData.SEARCH_BY_KEY(R) + DO_GET(false, null);
                    return getData.getDsByRowKey(dataRow, primaryTable, self.editType)
                    .then(function (){
                        logger.log(logType.WARNING, "post getDsByRowKey - Ho ricevuto il dataset popolato: " + logger.getTimeMs());

                        if (primaryTable.rows.length === 0){
                            return self.showMessageOk(localResource.rowSelectedNoMoreInDb).then(function (){
                                self.hideWaitingIndicator(waitingHandler);
                                return def.resolve(false);
                            });
                        }

                        self.helpForm.lastSelected(primaryTable, primaryTable.rows[0]);

                        self.state.setEditState();
                        self.entityChanged = false;
                        self.firstFillForThisRow = true;

                        return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent,
                            dataRow,
                            "selectRow")
                        .then(function (){
                            logger.log(logType.WARNING, "pre reFillControls " + logger.getTimeMs());
                            return self.reFillControls();
                        })
                        .then(function (){
                            return self.eventManager.trigger(
                                appMeta.EventEnum.stopMainRowSelectionEvent,
                                dataRow,
                                "selectRow");
                        })
                        .then(function (){
                            logger.log(logType.WARNING, "then finale in getDsByRowKey " + logger.getTimeMs());
                            self.firstFillForThisRow = false;
                            self.drawState = drawStates.done;
                            self.hideWaitingIndicator(waitingHandler);
                            return true;
                        });
                    });
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method reFillControls
         * @private
         * @description ASYNC
         * calls fillControls inside a before/afterFill 
         * @param {string} container. id of the html container
         * @returns {Promise}
         */
        reFillControls:function (container) {
            const savedDrawState = this.drawState;
            this.drawState = drawStates.filling;
            this.setPageTitle();
            const self = this;
            const lastSelectedRow = this.helpForm.lastSelected(this.getPrimaryDataTable());
            let res;
            const def = Deferred("refillControls");
            if (lastSelectedRow) {
                res = this.callMethod(toOverrideEvent.beforeFill)
                    .then( function () {
                        return self.helpForm.fillControls(container);
                    })
                    .then(function () {
                        return self.freshToolBar();
                    })
                    .then(function () {
                        return self.callMethod(toOverrideEvent.afterFill).then( function () {
                            self.drawState = savedDrawState;
                            return true;
                        });
                    });
                return def.from(res).promise();
            }

            //Se non c'è una riga corrente non chiama beforeFill/afterFill
            res = this.helpForm.fillControls(container)
                .then( function () {
                    return self.freshToolBar();
                }).then(function () {
                    self.drawState = savedDrawState;
                    return true;
                });
            return def.from(res).promise();
        },

        /**
         * @method treeSelectRow
         * @private
         * @description ASYNC
         * @param {DataRow} dataRow
         * @param {string} listType
         * @returns {Promise}
         */
        treeSelectRow:function(dataRow, listType) {
            const def = Deferred("treeSelectRow");
            const self = this;
            if (!dataRow) return def.resolve();

            // metto attesa, effettua query per recuperare ventualmente il nuovo nodo

            const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_tree_updating);

            const primaryTable = this.getPrimaryDataTable();
            this.helpForm.lastSelected(primaryTable, null);

            const tm = primaryTable.treemanager;

            const res = tm.selectRow(dataRow, listType)
            .then(function (){
                self.state.setEditState();
                self.entityChanged = false;
                // N.B Ok lo fa la selectedRow delle'evento del tree a lanciare  helpForm.extendedControlChanged(helpForm.mainTableSelector, null, r);
                self.setPageTitle();
                return self.freshToolBar()
                .then(function (){
                    self.hideWaitingIndicator(waitingHandler);
                    def.resolve();
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method selectOne
         * @private
         * @description ASYNC
         * Selects a row from a Table using linked MetaData specified grid-listing
         * If the entity is selected, a row is loaded in the primary table
         * and all other data is cleared.
         * If only one row is returned the form is filled wth the data. otherwise if more rows are returned then it open listManeger.
         * @param {string} listingType
         * @param {jsDataQuery} filter SQL filter to apply in data retrieving
         * @param {string} searchTableName Table from which data has to be retrieved
         * @param {DataTable} toMerge in-memory Table which has some changes to apply to searchtable
         * @param {boolean} filterLocked true if filter can't be changed during row selection
         * @returns Promise<DataRow> The selected row or null if no row selected
         */
        selectOne: function (listingType, filter, searchTableName, toMerge, filterLocked) {
            const def = Deferred("selectOne");
            const isSearchTable = !!searchTableName; // memorizzo per capire se sedvo forzare la chiusura dell'elenco eventualmente aperto
            if (!searchTableName) searchTableName = this.primaryTableName;
            let mergedFilter = filter;
            const self = this;

            if (!listingType)logger.log(logType.ERROR, localResource.getErrorListingTypeNull(searchTableName, filter.toString(), this.title));

            let metaToConsider = this.state.meta;

            if (searchTableName !== this.primaryTableName) {
                metaToConsider = appMeta.getMeta(searchTableName);
                metaToConsider.listTop = this.listTop;
            }
            const prefilter = mergedFilter;
            const dataTableSearch = this.getDataTable(searchTableName);
            let sort = metaToConsider.getSorting(listingType);
            const staticFilter = metaToConsider.getStaticFilter(listingType);

            const res = utils._if(!!dataTableSearch)
            ._then(function (){
                // Il sort prendo dal metadato. Se non lo trovo allora provo a vedere se sta sulla tabella,
                //  perché configurato sul metadato lato server e serializzato
                sort = (sort ? sort : dataTableSearch.orderBy());
                // Il backend già me lo ha impostato. Se è esplicitato sul meta js allora leggo anche quello
                mergedFilter = self.helpForm.mergeFilters(mergedFilter, staticFilter);
                mergedFilter = self.helpForm.mergeFilters(mergedFilter, self.state.DS.tables[searchTableName].staticFilter());
                return true;
            })._else(function (){

                return getData.createTableByName(searchTableName, "*")
                .then(function (temp){
                    if (!temp.key().length){
                        if (!!metaToConsider.primaryKey && metaToConsider.primaryKey().length > 0){
                            temp.key(metaToConsider.primaryKey());
                        }
                    }
                    return metaToConsider.describeColumns(temp, listingType);
                });

            }).then(function (){
                let hideListManger = false;
                // Se sono su tab principale e già è aperto, chiudo prima il listmaanger aperto.
                // Se è aperto, ma sto su un autochoose non devo chiudere il listManager.
                //       (su autochoose passo sicuramente searchTableName, altrimenti sto su ricerca di pagina)
                if (self.listManagerSearch && !isSearchTable){
                    hideListManger = true;
                    self.closeListManagerResultsSearch();
                }

                return utils._if(self.listTop !== 0 || filterLocked)

                ._then(function (){
                    // Eseguo la query. La prima volta vince il sorting del backend.
                    //  Successivamente se c'è un sorting passerò nel controllo quello del client
                    return getData.getPagedTable(searchTableName, 1, appMeta.config.listManager_nRowPerPage,
                            mergedFilter, listingType, null)

                    .then(function (dataTablePaged, totPage, totRows){

                        dataTablePaged.dataset = self.state.DS;
                        if ((!toMerge) && (totRows === 0)){
                            const mergedFilterString = (mergedFilter) ? mergedFilter.toString() : "";
                            const filterString = localResource.getFilterMessage(mergedFilterString);
                            let msgNoRowFound = localResource.getNoRowFound(searchTableName,
                                filterString,
                                listingType);

                            if (!appMeta.security.isAdmin()) msgNoRowFound = null;

                            return new appMeta.BootstrapModal(localResource.alert,
                                localResource.noElementFound,
                                [localResource.ok],
                                appMeta.localResource.cancel,
                                msgNoRowFound).show(self)
                            .then(function (){
                                //self.hideWaitingIndicator();
                                return def.resolve(null);
                            });
                        }

                        // When an external table is present, always display a list (no implicit selection done)
                        let toNotMergeCond = !toMerge;
                        if (toMerge && toMerge.rows.length === 0){
                            toNotMergeCond = true;
                        }

                        if (totRows === 1 && toNotMergeCond){
                            if (dataTablePaged.rows.length === 0){
                                return def.resolve(null);
                            }
                            //self.hideWaitingIndicator();
                            return def.from(metaToConsider.checkSelectRow(dataTablePaged, dataTablePaged.rows[0].getRow()));
                        }

                        if (filterLocked){
                            // mostra lista modale. Nel caso di elenco di ricerca salvo in var di classe, così lo chiudo quando necessario
                            // Nel caso autochoose lascio aperto l'elenco, e apro nuova modale per la liste dei risultati, senza nascondere l'elenco
                            // Utile nel caso di edit consecutivi di righe prese da un elenco (Al click singolo infatti l'elenco non si chiude)
                            let currList;
                            if (hideListManger){
                                // l'ultimo prm !isSearchTable indica che la dìfunz è alnciata da un search dal bottone e non da un autochoose
                                // utile capire a fuori, quando eseguo override di createAndGetListManager() se è autochoose o elenco normale di pagina
                                // nel caso elenco potrei utilizzare un altro listMaanger
                                self.listManagerSearch = self.createAndGetListManager(searchTableName, listingType, prefilter, true, self.rootElement, self, filterLocked, toMerge, !isSearchTable, sort);
                                currList = self.listManagerSearch;
                            }
                            else{
                                currList = self.createAndGetListManager(searchTableName, listingType, prefilter, true, self.rootElement, self, filterLocked, toMerge, !isSearchTable, sort);
                            }
                            return currList.show(dataTablePaged, totPage, totRows)
                            .then(function (res){
                                if (res){
                                    // res tornato è un ObjectRow
                                    return def.from(metaToConsider.checkSelectRow(dataTableSearch, res.getRow()));
                                }
                                return def.resolve(null);
                            });
                        }

                        self.listManagerSearch = self.createAndGetListManager(searchTableName, listingType, prefilter,
                            false, self.rootElement, self, filterLocked, null, !isSearchTable, sort);
                        return self.listManagerSearch.show(dataTablePaged, totPage, totRows);

                    });
                })
                ._else(function (){
                    // se arrivo qui filterLocked è sicuramente false, quindi mostro la lista non modale
                    self.listManagerSearch = self.createAndGetListManager(searchTableName, listingType, prefilter,
                        false, self.rootElement, self, filterLocked, null, !isSearchTable, sort);
                    return self.listManagerSearch.show();
                });
            });

            return def.from(res).promise();
        },

        /**
         * Forza la chiusura del manager della ricerca
         */
        closeListManagerResultsSearch:function () {
            if (this.listManagerSearch) this.listManagerSearch.hideControl(this.listManagerSearch);
            this.listManagerSearch = null;
        },


        /**
         * @method filterList
         * @private
         * @description ASYNC
         * Called when cmdMainDoSearch is called on a list form
         * @param {jsDataQuery} startFilter Initial filter to apply when filling form
         * @returns {Boolean}
         */
        filterList: function(startFilter) {
            const def = Deferred("filterList");
            if (!this.primaryTableName) return false;
            const filter = this.helpForm.iterateGetSearchCondition();
            const mergedFilter = this.helpForm.mergeFilters(filter, startFilter);
            const self = this;
            const res = this.getPrimaryTable(mergedFilter)
            .then(function (){
                if (self.getPrimaryDataTable().rows.length === 0){
                    return self.showMessageOk(localResource.noElementFound)
                    .then(function (){
                        return false;
                    });
                }
                self.state.setEditState();

                self.helpForm.lastSelected(self.getPrimaryDataTable(), null);

                return self.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, self, "filterList")
                .then(function (){
                    return self.reFillControls();
                })
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "filterList");
                })
                .then(function (){
                    return true;
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method getPrimaryTable
         * @private
         * @description ASYNC
         * Clears and Fills the primary table "tableName" with all records from a database table
         * @param {jsDataQuery} filter
         * @returns {Deferred}
         */
        getPrimaryTable:function (filter) {
            const def = Deferred('getPrimaryTable');
            const self = this;
            return getData.readCached(this.state.DS)
                .then(function () {
                    // N.B  era la MyClear su QueryCreator
                    self.clearDataTableAndGridRowIndex(self.getPrimaryDataTable());
                    return def.from(getData.getRowsByFilter(filter, null,
                        self.getPrimaryDataTable(), null, false, null)).promise();
                });
        },

        /**
         * @method clearDataTableAndGridRowIndex
         * @private
         * @description ASYNC
         * Clears the table and eventually clears the grid associated to the table
         * @param {DataTable} table
         */
        clearDataTableAndGridRowIndex:function (table) {

            if (table.rows.length === 0 ) return;

            // la ext property veniva settata da setLinkedGrid, nel sataDatagrid, ora sul costruttore del gridControl
            const g = table.linkedGrid;
            if (g) {
                if (table.rows.length > 1 && g.dataTable.dataset === table.dataset) {
                    g.currentRow = null;
                }
            }

            table.clear();
        },

        //TODO: move cmdShowLast implementation to a derived class
        /**
         * @method cmdShowLast
         * @private
         * @description ASYNC
         * Shows a message box with some info on the last selected row
         * @returns {Deferred}
         */
        cmdShowLast:function () {
            const def = Deferred("cmdShowLast");
            let msg = null;
            const self = this;
            const r = this.helpForm.lastSelected(this.getPrimaryDataTable());
            let dtRow;
            if (r) {
                dtRow = r.getRow();
                if (dtRow && dtRow.state === dataRowState.deleted || dtRow.state === dataRowState.detached) {
                    msg = localResource.getRowSelectedDetachedorDeleted();
                }
            }
            const res = utils._if(msg)
            ._then(function (){
                return self.showMessageOk(msg)
                .then(function (){
                    return def.resolve(true);
                });
            })
            ._else(function (){
                let txtcreate = "";

                if (dtRow && dtRow.table.columns.cu){
                    txtcreate = localResource.createdByUser(r.cu);
                }
                if (dtRow && dtRow.table.columns.createuser){
                    txtcreate = localResource.createdByUser(r.createuser);
                }

                if (dtRow &&  dtRow.table.columns.ct){
                    if (txtcreate === ""){
                        txtcreate = localResource.createdOn(r.ct);
                    }
                    else{
                        txtcreate += localResource.onlyOn(r.ct);
                    }
                }
                if (dtRow &&  dtRow.table.columns.createtimestamp){
                    if (txtcreate === ""){
                        txtcreate = localResource.createdOn(r.createtimestamp);
                    }
                    else{
                        txtcreate += localResource.onlyOn(r.createtimestamp);
                    }
                }

                if (txtcreate !== "") txtcreate += "\n";
                let txtupdate = "";

                if (dtRow.table.columns.lu){
                    txtupdate = localResource.modifiedBy(r.lu);
                }

                if (dtRow.table.columns.lastuser){
                    txtupdate = localResource.modifiedBy(r.lastuser);
                }

                if (dtRow.table.columns.lt){
                    if (txtupdate === ""){
                        txtupdate = localResource.modifiedOn(r.lt);
                    }
                    else{
                        txtupdate += localResource.onlyOn(r.lt);
                    }
                }

                if (dtRow.table.columns.lastmodtimestamp){
                    if (txtupdate === ""){
                        txtupdate = localResource.modifiedOn(r.lastmodtimestamp);
                    }
                    else{
                        txtupdate += localResource.onlyOn(r.lastmodtimestamp);
                    }
                }

                msg = txtcreate + txtupdate;
                if (!msg.length){
                    msg = localResource.info_not_avalilable;
                }
                return self.showMessageOk(msg)
                .then(function (){
                    def.resolve(true);
                });
            })
            .then(function (){
                return true;
            });

            return def.from(res).promise();

        },

        /**
         * @method showWaitingIndicator
         * @public
         * @description SYNC
         * Shows a modal loader indicator. It is not possible to close the modal by user
         * @param {string} msg. the message to show in the box
         * @param {boolean} [isBar]
         * @returns {number} the handler of the modal. It is used on hideWaitIndicator to remove the message form the list
         */
        showWaitingIndicator:function (msg, isBar) {
            //logger.log(logType.DEBUG,"show waiting indicator:"+msg);
            let number = appMeta.modalLoaderControl.show(msg, isBar);
            //console.log("show waiting indicator:"+msg+"=> "+number);
            return number;
        },

        /**
         * @method hideWaitingIndicator
         * @private
         * @description SYNC
         * Hides a modal loader indicator. (Shown with funct. showWaitingIndicator).
         * If handler is undefiend or null or 0 it forces the hide
         * @param {number} handler. the handler of the modal to hide. in handler is undefined it force hide
         */
        hideWaitingIndicator:function (handler) {
            //logger.log(logType.DEBUG, "hide waiting indicator n."+handler);
            //console.log("hide waiting indicator n."+handler);
            appMeta.modalLoaderControl.hide(handler);
        },

        /**
         * @method cmdMainSave
         * @private
         * @description
         * @returns Deferred<boolean> the deferred
         */
        cmdMainSave:function () {
            const self = this;
            let waitingHandler;
            // Metto indicatore attesa. Nel caso dettaglio non serve perchè non fa e2e, quindi apparirebbe per pochi ms inutilmente
            if (!this.detailPage) {
                waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_save);
            }
            return this.getFormData(false)
                .then(function(resultType) {
                    // era  if (!valid) return false;
                    if (!resultType){
                        self.hideWaitingIndicator(waitingHandler);
                        return resultType;
                    }

                    return self.saveFormData()
                        .then(function(result) { //convenzione : true se ha salvato

                            // potrebbe essere chiamato da un child, in quel caso torna un dialogResult e torno al chiamante
                            if (result && self.detailPage) {
                                return appMeta.currApp.returnToCaller()
                                    .then(function() {
                                        self.deferredResult.resolve(result);
                                    });
                            }

                            // tolgo indicatore attesa
                            self.hideWaitingIndicator(waitingHandler);
                            return self.eventManager
                                .trigger(appMeta.EventEnum.saveDataStop,
                                    self,
                                    result,
                                    "cmdMainSave").then(function () {
                                    return resultType && result;
                                });
                        });
                });
        },

        /**
         * @method saveFormData
         * @private
         * @description ASYNC
         * Save all changes made on the DataSet to DB. This is invoked when user clicks
         * "save" button or "Ok" button. Infact, both those buttons have a
         * "mainsave" tag.
         * @returns {Promise}
         */
        saveFormData: function() {
            const def = Deferred("saveFormData");

            this.currOperation = currOperation.save;
            const self = this;

            // booleano per capire se devo uscire dal metodo nei succssivi then, senza fare le ultime righe di codice come il freshform
            let returnImmediately = false;

            // DEPRECATO enumerato che indica se devo risolvere il deferred globale "this.resultDeferred" della maschera oppure tornare solamente true/false
            // Questo poichè il saveformData potrebbe esserte chiamato da cmdMainSave di un dettaglio,, in quel caso esco con resDialogResultOk
            // var resultType = ResultType.resFalse;

            const res = this.callMethod(toOverrideEvent.beforePost)
            .then(
                function (){
                    let last = self.helpForm.lastSelected(self.getPrimaryDataTable());

                    let wasadelete = (!last);
                    if (last) wasadelete = (last.getRow === undefined);  //(last.getRow().state === dataRowState.deleted);
                    return utils._if(self.detailPage)
                    ._then(function (){
                        self.entityChanged = true;
                        return true; // va avanti nella then() con true
                    })
                    ._else(function (){
                        if (self.state.DS.hasChanges()){
                            // entra nel loop di salvataggio sincrono/asincrono, con maschera errori ed
                            //  eventuale operazione d db da effettuare
                            // passo il prm dei messaggi vuoto, poiché in questo punto non ho messaggi accodati
                            return postData.doPost(self.state.DS, self.primaryTableName, self.editType, [], self)
                            .then(function (postRes){
                                // può tornare con false, cioè salvataggio non effettuato, oppure con true cioè salvataggio
                                if (postRes) self.entityChanged = true;
                                return postRes;
                            });
                        }

                        // se non entro qui    if (self.state.DS.hasChanges()) nel successivo then, vado avanti
                        return true;

                    })
                    .then(function (res){
                        // N. B nel caso sia un dettaglio, poiché sto self.detailPage = true, quindi non passo nell'_else
                        // res qui è sempre true

                        let last = self.helpForm.lastSelected(self.getPrimaryDataTable());
                        let lastTreeNodeToSelect = false;
                        let treemanager;
                        return utils._if(res)
                        ._then(function (){
                            return self.callMethod(toOverrideEvent.afterPost)
                            .then(function (){
                                if (self.detailPage && (self.mainSelectionEnabled === false)){
                                    self.currOperation = currOperation.none;
                                    returnImmediately = true; // su mdl faceva return;
                                    // resultType = ResultType.resDialogResultOk; // era LinkedForm.DialogResult = DialogResult.OK;
                                    return true; // serve per uscire da questa then interna e andare sulla then dell' _if(res)
                                }

                                // metaModel.allowAllClear(self.state.DS);
                                if (!last){
                                    //It was a successfully delete
                                    self.helpForm.lastSelected(self.getPrimaryDataTable(), null);
                                    if (!self.isList){
                                        return self.eventManager
                                        .trigger(appMeta.EventEnum.startClearMainRowEvent,
                                            self,
                                            "saveFormData")
                                        .then(function (){
                                            return self.clear()
                                            .then(function (){
                                                return self.eventManager.trigger(
                                                    appMeta.EventEnum.stopClearMainRowEvent,
                                                    self,
                                                    "saveFormData");
                                            })
                                            .then(function (){
                                                self.currOperation = currOperation.none;
                                                returnImmediately = true; // su mdl faceva return;
                                                return true; // serve per andare sul .then() dell' _if(res)
                                            });
                                        });
                                    }


                                    if (self.isTree){
                                        treemanager = self.helpForm.mainTableSelector;
                                        const treenode = treemanager.selectedNode();

                                        return utils._if(treenode)
                                        ._then(function (){
                                            if (!treenode.original.dataRow.getRow){
                                                treemanager.deleteCurrentNode(treenode);
                                                return true;
                                            }
                                            return self.beforeSelectTreeManager()
                                            .then(function (){
                                                return self.afterSelectTreeManager();
                                            });
                                        })
                                        .then(function (){
                                            const curr = self.helpForm.lastSelected(self.getPrimaryDataTable());

                                            return utils._if(!curr)
                                            ._then(function (){
                                                return self.doMainCommand("mainsetsearch");
                                            })
                                            .then(function (){
                                                self.currOperation = currOperation.none;
                                                returnImmediately = true;
                                                return true;
                                            });
                                        });
                                    }

                                    // clears data from entity Controls
                                    return self.selectARowInGridList()
                                    .then(function (){
                                        self.currOperation = currOperation.none;
                                        returnImmediately = true; // su mdl faceva return;
                                        return true;
                                    });

                                }

                                if (self.state.isInsertState()){
                                    if (self.isTree){
                                        self.state.setEditState();
                                        // recupero il manager del tree
                                        treemanager = self.helpForm.mainTableSelector;
                                        return treemanager.fillNodes(false, false)
                                        .then(function (){
                                            lastTreeNodeToSelect = true;
                                            return true;
                                        });
                                    }

                                    self.state.setEditState();
                                    return self.eventManager
                                    .trigger(appMeta.EventEnum.startClearMainRowEvent,
                                        last,
                                        "saveFormData")
                                    .then(function (){
                                        return self.freshForm(true, false);
                                    })
                                    .then(function (){
                                        // const g = self.helpForm.mainTableSelector;
                                        // if (typeof g === 'GridControlX'){
                                        //     self.helpForm.setGridCurrentRow(g, last);
                                        // }

                                        return self.eventManager.trigger(
                                            appMeta.EventEnum.stopClearMainRowEvent,
                                            last,
                                            "saveFormData");
                                    })
                                    .then(function (){
                                        last = null;
                                    });
                                }
                                else
                                    if (self.isTree){
                                    // recupero il manager del tree
                                    treemanager = self.helpForm.mainTableSelector;
                                    lastTreeNodeToSelect = true;
                                    return treemanager.fillNodes(true, false);
                                    }
                                return true;
                            });
                        })._else(function (){
                            //an error occurred
                            if (wasadelete){
                                self.state.DS.rejectChanges();
                                //A seguito del task 9394 penso che il commento sopra sia corretto, non si può
                                // annullare solo la riga padre, va annullato tutto altrimenti si rischia di cancellare solo la riga padre
                                // perché potrebbe essere in stato d'inserimento mentre le figlie sarebbero salvate senza padre,
                                // come è effettivamente accaduto
                                last = null;
                            }

                            returnImmediately = true;
                            // resultType = resultType.resDialogResultNone;

                        })
                        .then(function (){
                            // su mdl c'era return in determinati punti, qui gestisco con booleano exit, calcolato sopra
                            // quindi se è true non faccio le ultime operazioni
                            if (returnImmediately) {
                                return self.freshForm(true, false);
                                //return def.resolve(res);
                            }

                            return utils._if(last)
                            ._then(function (){

                                return utils._if(lastTreeNodeToSelect)
                                ._then(function (){
                                    return treemanager.selectNodeByRow(last, false);
                                })
                                .then(function (){
                                    return self.freshForm(true, false);
                                });
                            })
                            .then(function (){
                                // se arrivo qui sicuro non è un form Child di qualche parent
                                self.currOperation = currOperation.none;
                                return def.resolve(true);
                            });

                        }); // chiude then() dell _if(res)

                    }); // chiude then() dell '_if(IsSubEntity)
                });

            return def.from(res).promise();
        },

        /**
         * @method beforeSelectTreeManager
         * @private
         * @description ASYNC
         * @returns Promise
         */
        beforeSelectTreeManager:function () {
            const def = Deferred('beforeSelectTreeManager');
            const self = this;

            return this.warnUnsaved()
                .then(function (res) {
                    if (res) {
                        self.state.DS.rejectChanges();
                        self.state.setEditState();
                    }

                    return def.resolve(res);
                });
        },

        /**
         *@return Promise
         */
        afterSelectTreeManager:function () {
            const def = Deferred('afterSelectTreeManager');
            return def.resolve();
        },


        /**
         * @method selectARowInGridList
         * @private
         * @description ASYNC
         * @returns {Deferred}
         */
        selectARowInGridList:function () {
            const def = Deferred('selectARowInGridList');
            const primaryTable = this.getPrimaryDataTable();
            this.helpForm.iterateSetDataRowRelated(this.rootElement, primaryTable, null);
            this.helpForm.lastSelected(primaryTable, null);
            let res;
            if (primaryTable.rows.length > 0) {

                const g = this.helpForm.mainTableSelector;
                if (g){
                    if(g.setIndex){
                        g.setIndex(-1);
                    }
                }

                /*
                 TODO cambiato questo codice con righe precedenti, è ok? La setIndex(-1) dovrebbe proprio fare quello che faceva prima
                 var g = (DataGrid) myHelpForm.MainTableSelector;
                 if (g.CurrentRowIndex != 0 && g.DataSource != null) {
                 g.CurrentRowIndex = 0;
                 }
                 else {
                 myHelpForm.ControlChanged(g, null);
                 }
                 */

                this.state.setEditState(); //it was an insert or update
                this.firstFillForThisRow = true;
                var self = this;
                res = this.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, this, "selectARowInGridList")
                    .then(function () {
                        return self.freshForm(true, false); //Per fare scattare l'AfterFill()
                    })
                    .then(function () {
                        return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "selectARowInGridList");
                    })
                    .then(function () {
                        self.firstFillForThisRow = false;
                        return true;
                    });
            }
            else {

                res = this.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, this, "selectARowInGridList")
                    .then(function () {
                        return self.clear();
                    })
                    .then(function () {
                        return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "selectARowInGridList");
                    })
                    .then(function () {
                        return true;
                    });
            }

            return def.from(res).promise();
        },

        /**
         * @method cmdGoToNext
         * @private
         * @description ASYNC
         * @returns {Deferred}
         */
        cmdGoToNext:function () {
            return Deferred("cmdGoToNext").resolve(true);
            // TODO
            /*
             if (!HasNext()) return;
             GotoNext();
             */
        },

        /**
         * @method cmdGoToPrev
         * @private
         * @description ASYNC
         * @returns {Deferred}
         */
        cmdGoToPrev:function () {
            return Deferred("cmdGoToPrev").resolve(true);
            // TODO
            /*
             if (!HasPrev()) return;
             GotoPrev();
             */
        },

        /**
         * @method cmdGoToPrev
         * @private
         * @description ASYNC
         * @returns {Deferred}
         */
        cmdEditAddNotes:function () {
            return Deferred("cmdEditAddNotes").resolve(true);
            // TODO
            /*
             NotesOleNotes frmNotes = new NotesOleNotes(this);
             frmNotes.ShowDialog();
             return;
             */
        },

        /**
         * @method cmdMainInsert
         * @private
         * @description ASYNC
         *
         *
         * @returns Promise
         */
        cmdMainInsert:function () {
            const def = Deferred("cmdMainInsert");
            const self = this;

            // this.closeListManagerResultsSearch();

            const res = this.warnUnsaved()
            .then(function (res){

                if (!res) return def.resolve(null);

                self.state.DS.rejectChanges();

                if (!self.isList) return self.editNew();

                // List form -> finds main datagrid/datatable
                const gridtreetag = self.helpForm.mainTableSelector.tag;

                const editTypeRequested = self.helpForm.getFieldLower(gridtreetag, 2);
                // no sub-form to open: in-form insert mode
                if (!editTypeRequested) return self.editNew();

                // Sezione che gestisce l'edit di un dettaglio dell'entità stessa in un nuovo form
                // non è usata da alcun form al momento, poiché si preferisce l'in-form -detail
                const primaryTable = self.getPrimaryDataTable();

                const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_insert);
                // è giusto passare edittype di pagina, poichè serve solo per recuperare il ds principale lato server.
                return self.state.meta.getNewRow(null, primaryTable, self.editType)

                .then(function (rowToInsert){

                    if (!rowToInsert){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(null);
                    }

                    self.state.editedRow = rowToInsert; // M.SetSource(R);

                    return self.edit(primaryTable.name, editTypeRequested, true)

                    // sull'insert viene aperto il form per l'inserimento, può/deve esserci il bottone di mainSave
                    .then(function (dialogResult){

                        return utils._if(dialogResult)
                        ._then(function (){
                            return self.saveFormData()
                            .then(function (result){
                                self.entityChanged = result;
                                return true;
                            });
                        })
                        ._else(function (){
                            rowToInsert.del();
                            return true; // serve per mandarlo nel ramo then() che deve essere sempre fatto
                        })
                        .then(function (){
                            return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToInsert, "cmdMainInsert")
                            .then(function (){
                                return self.freshForm(true, true); //21/1/2003
                            })
                            .then(function (){
                                self.hideWaitingIndicator(waitingHandler);
                                return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, rowToInsert, "cmdMainInsert");
                            });
                        });
                    }); // chiude then() di self.edit
                }); // chiude then del getNewRow()
            }); // chiude primo then()

            return def.from(res).promise();
        },

        /**
         * @method editNew
         * @private
         * @description ASYNC
         * Creates a new entity (eventually clearing current one) and updates form.
         * @returns {Deferred}
         */
        editNew:function() {
            const def = Deferred("editNew");
            //return def.resolve().promise();

            const self = this;
            this.currOperation = currOperation.insert;
            self.state.setInsertState();
            let exit = false;
            const res = utils._if(!this.isList)
            ._then(function (){

                self.gointToInsertMode = true;

                return self.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, self, "editNew")
                .then(function (){
                    return self.clear();
                })
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, self, "editNew");
                })
                .then(function (){
                    self.gointToInsertMode = false;
                    if (!self.isEmpty()){
                        exit = true; // AfterClear has generated an "insert"
                    }

                    return true; // deve andare sempre sul ramo then()
                });
            })
            .then(function (){

                if (exit) return def.resolve(false);

                let parentRow = null;
                const primaryDataTable = self.getPrimaryDataTable();
                if (self.isTree){
                    parentRow = self.helpForm.lastSelected(primaryDataTable);
                    if (parentRow) parentRow = parentRow.getRow(); // devo passare un DataRow
                }

                // N.B fatto latoserver qaundo si legge il dataSet, tramite la getDataSet
                // il setDefaults() qui non fa nulla, potrebbe essere implementato da chi deriva il MetaData lato js
                const meta = self.state.meta;
                //meta.setDefaults(primaryDataTable); lo fa già nell'activate, non deve rifarlo qui
                const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_insert);
                return meta.getNewRow(parentRow, primaryDataTable, self.editType)

                .then(function (rowToEdit){
                    if (!rowToEdit){
                        self.currOperation = currOperation.none;
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(false);
                    }

                    self.helpForm.lastSelected(primaryDataTable, rowToEdit.current);
                    // rowToEdit now is the row from which start the filling of the form
                    self.state.setInsertState();

                    return getData.doGet(self.state.DS, rowToEdit, self.primaryTableName, false)
                    .then(function (){
                        self.entityChanged = true;
                        self.firstFillForThisRow = true;
                        return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToEdit, "editNew");
                    })
                    .then(function (){
                        return self.reFillControls();
                    })
                    .then(function (){
                        return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, rowToEdit, "editNew");
                    })
                    .then(function (){
                        self.firstFillForThisRow = false;
                        self.currOperation = currOperation.none;
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(true);
                    });
                }); // chiude then del getNewRow()
            });

            return def.from(res).promise();

        },

        /**
         * @method editNew
         * @private
         * @description ASYNC
         * Copies the lasrt selected row and inserts the copy in the primary Table
         * @returns Promise
         */
        cmdMainInsertCopy:function () {
            const def = Deferred("cmdMainInsertCopy");
            const self = this;
            const res = this.showMessage(localResource.alert,
                localResource.getPressedInsertAndcopy(),
                [localResource.confirm, localResource.cancel],
                localResource.cancel)
            .then(function (res){
                if (res !== localResource.confirm) return def.resolve(null);

                const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_insertcopy);

                return self.warnUnsaved()
                .then(function (res){
                    if (!res){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(null);
                    }

                    self.state.DS.rejectChanges();

                    if (!self.isList){
                        return self.editNewCopyJsSide()
                        .then(function (){
                            self.hideWaitingIndicator(waitingHandler);
                            return def.resolve();
                        });
                    }

                    //List form -> finds main datagrid/datatable
                    const gridtreetag = self.helpForm.mainTableSelector.tag;
                    const edit_type = self.helpForm.getFieldLower(gridtreetag, 2);
                    if (!edit_type){
                        // no sub-form to open: in-form insert mode
                        return self.editNewCopyJsSide()
                        .then(function (){
                            self.hideWaitingIndicator(waitingHandler);
                            return def.resolve();
                        });
                    }
                    const currCopy = self.helpForm.lastSelected(self.getPrimaryDataTable());
                    if (!currCopy) return;

                    const currMeta = appMeta.getMeta(self.primaryTableName);

                    return currMeta.getNewRow(null, self.getPrimaryDataTable(), self.editType)
                    .then(function (rowToInsert){
                        if (!rowToInsert){
                            self.hideWaitingIndicator(waitingHandler);
                            return def.resolve();
                        }

                        const primaryDataTable = self.getPrimaryDataTable();

                        _.forEach(primaryDataTable.columns, function (col){
                            // don't copy autoincrements
                            if (primaryDataTable.autoIncrement(col.name)) return true;
                            // don't copy keys
                            if (col.isPrimaryKey) return true;
                            rowToInsert.current[col.name] = currCopy[col.name];
                        });


                        self.state.editedRow = rowToInsert;

                        return self.edit(self.getPrimaryDataTable().name, edit_type, true)
                        .then(function (){
                            // entityCalledChanged valorizzato nella returnToCaller()
                            return utils._if(self.entityCalledChanged)
                            ._then(function (){
                                return self.saveFormData()
                                .then(function (result){
                                    self.entityChanged = result;
                                    return true;
                                });
                            })
                            ._else(function (){
                                rowToInsert.del();
                                return true;
                            }).then(function (){
                                return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToInsert, "cmdMainInsertCopy");
                            }).then(function (){
                                return self.freshForm(true, true);
                            }).then(function (){
                                self.hideWaitingIndicator(waitingHandler);
                                return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, rowToInsert, "cmdMainInsertCopy");
                            });
                        });
                    });
                });

            });

            return def.from(res).promise();

        },

        

        /**
         *
         * @param {ObjectRow} destRow
         * @param {ObjectRow} sourceRow
         */
         recursiveNewCopyChilds:function(destRow, sourceRow) {
            /* DataTable */
            const sourceTable = sourceRow.getRow().table;
            /* DataSet */
            const dsSource = destRow.getRow().table.dataset;
            const relations = sourceTable.childRelations();

            const allNewChildRowDeferred = [];

            const self = this;

            _.forEach(relations, function (rel) {

                const childTableName = rel.childTable;
                const childTable = dsSource.tables[childTableName];
                if (childTable.skipInsertCopy()) return true;

                    if (!metaModel.isSubEntity(childTable, destRow.getRow().table)) {
                        return true; // continua nel ciclo
                    }

                    if (childTableName === sourceTable.name) {
                        return true; // continua nel ciclo
                    }

                const childRowCopy = sourceRow.getRow().getChildRows(rel.name);

                const metaChild = appMeta.getMeta(childTableName);
                metaChild.setDefaults(childTable);

                    // creo catena di deferred iterative, ognuna ha bisogno del risultato precedente. poichè se ci sono più child devo inserire in
                    // self.state.DS.tables[defObj.childTableName] le righe con id momentaneo calcolato diverso. Lui riesce a calcolare
                    // l'id ovviamente solo se già ci sono le righe messe in precedenza. Nel vecchi metodo prima di questa modifica,
                    // metteva solo una riga l'ultima poichè l'id era sempre lo stesso. nel ciclo passavo sempre la tabella vuota all'inizio
                let chain = $.when();

                _.forEach(childRowCopy, function (childSourceRow) {

                        chain = chain.then(function() {
                            return metaChild.getNewRow(destRow.getRow(), childTable)
                                .then(function (newChildRow) {
                                    // copio la riga child calcolata sul dt destinazione, così vado ogni volta ad incrementare le righe.
                                    // nel successivo .then della catena il dt sarà modificato
                                    _.forIn(childTable.columns, function (childCol) {
                                        if (rel.childCols.some(function (c) {
                                            return c === childCol.name;
                                        })) {
                                            return true; // continuo nel ciclo
                                        }
                                        // don't copy autoincrements
                                        if (childTable.autoIncrement(childCol.name)) {
                                            return true;
                                        }
                                        metaChild.insertCopyColumn(childCol, childSourceRow, newChildRow.current);
                                    });

                                    return self.recursiveNewCopyChilds(newChildRow.current, childSourceRow);
                                });
                        });
                    });

                    // inserisco array di deferred , cioè uno per ogni relazione di cui eventualmente devo vedere i figli
                     allNewChildRowDeferred.push(chain);

                }); // chiude primo for sulle relazioni

            return $.when.apply($, allNewChildRowDeferred);
        },

        /**
         * @method editNewCopyJsSide This method do the deep copy js side, caling several getNewRow client/server.
         * Call the editNewCopy() to do the deep copy server side!
         * @private
         * @description ASYNC
         * Creates a new entity as a copy of current row
         * @returns {Promise}
         */
        editNewCopyJsSide:function() {
            const def = Deferred("editNewCopyJsSide");
            const self = this;
            let exitImmediately = false;
            // check preliminari e leggo al riga corrente
            if (!this.primaryTableName) return def.resolve(false);
            const primaryDataTable = this.getPrimaryDataTable();
            const currRow = this.helpForm.lastSelected(primaryDataTable);
            if (!currRow) return def.resolve(false);

            const dsCopy = appMeta.getDataUtils.cloneDataSet(this.state.DS);

            const keyfilter = currRow.getRow().table.keyFilter(currRow);
            const primaryRowCopy = dsCopy.tables[this.primaryTableName].select(keyfilter)[0];
            const meta = self.state.meta;
            let rowToInsert;
            const res = utils._if(!this.isList)
            ._then(function (){
                self.isClearBeforeInsert = true;
                return self.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, null, "editNewCopyJsSide")
                .then(function (){
                    return self.clear();
                })
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, null, "editNewCopyJsSide");
                })
                .then(function (){
                    self.isClearBeforeInsert = false;
                    if (!self.isEmpty()){
                        exitImmediately = true;
                    } // AfterClear has generated an "insert"
                    return true;
                });
            })
            .then(function (){
                if (exitImmediately) return def.resolve();

                meta.setDefaults(primaryDataTable);
                return meta.getNewRow(null, primaryDataTable, self.editType);

            }).then(function (rowOut){
                rowToInsert = rowOut;
                if (!rowToInsert){
                    return self.showMessageOk(localResource.getInvalidData(self.primaryTableName)).then(function (){
                        return def.resolve();
                    });
                }

                _.forEach(primaryDataTable.columns, function (col){
                    // don't copy autoincrements
                    if (rowToInsert.table.autoIncrement(col.name)) return true;
                    // don't copy keys
                    if (col.isPrimaryKey) return true;
                    meta.insertCopyColumn(col, primaryRowCopy, rowToInsert.current);
                });

                self.helpForm.lastSelected(self.getPrimaryDataTable(), rowToInsert.current);
                self.currOperation = currOperation.insert;
                self.state.setInsertState();
                if (false){ // this.isList
                    self.entityChanged = true;
                    self.firstFillForThisRow = true;

                    return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToInsert, "editNewCopyJsSide")
                    .then(function (){
                        return self.reFillControls();
                    })
                    .then(function (){
                        return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, rowToInsert, "editNewCopyJsSide");
                    })
                    .then(function (){
                        self.firstFillForThisRow = false;
                        return def.resolve(true);
                    });
                }

                // EFFETTUA IL DEEP-COPY
                return self.recursiveNewCopyChilds(rowToInsert.current, primaryRowCopy);
            }).then(function (){
                // rowToInsert now is the row from which start the filling of the form
                return getData.doGet(self.state.DS, rowToInsert, self.primaryTableName, true)
                .then(function (){
                    self.entityChanged = true;
                    self.firstFillForThisRow = true;
                    return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToInsert, "editNewCopyJsSide");
                })
                .then(function (){
                    return self.reFillControls();
                })
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopRowSelectionEvent, rowToInsert, "editNewCopyJsSide");
                })
                .then(function (){
                    self.firstFillForThisRow = false;
                    return true;
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method editNewCopy
         * @private
         * @description ASYNC
         * Creates a new entity as a copy of current row
         * @returns {Deferred}
         */
        editNewCopy:function() {
            const def = Deferred("editNewCopy");
            const self = this;
            let exitImmediately = false;
            // check preliminari e leggo al riga corrente
            if (!this.primaryTableName) return def.resolve(false);
            const primaryDataTable = this.getPrimaryDataTable();
            const currRow = this.helpForm.lastSelected(primaryDataTable);
            if (!currRow) return def.resolve(false);

            const dsCopy = appMeta.getDataUtils.cloneDataSet(this.state.DS);

            const keyfilter = currRow.getRow().table.keyFilter(currRow);
            const primaryRowCopy = dsCopy.tables[this.primaryTableName].select(keyfilter)[0];

            const res = utils._if(!this.isList)
            ._then(function (){
                self.isClearBeforeInsert = true;
                return self.eventManager.trigger(appMeta.EventEnum.startClearMainRowEvent, null, "editNewCopy")
                .then(function (){
                    return self.clear();
                })
                .then(function (){
                    return self.eventManager.trigger(appMeta.EventEnum.stopClearMainRowEvent, null, "editNewCopy");
                })
                .then(function (){
                    self.isClearBeforeInsert = false;
                    if (!self.isEmpty()){
                        exitImmediately = true;
                    } // AfterClear has generated an "insert"
                    return true;
                });
            })
            .then(function (){
                if (exitImmediately) return def.resolve();

                const meta = self.state.meta;
                meta.setDefaults(primaryDataTable);

                return meta.getNewRow(null, primaryDataTable, self.editType)

                .then(function (rowToInsert){
                    if (!rowToInsert){
                        return self.showMessageOk(localResource.getInvalidData(self.primaryTableName)).then(function (){
                            return def.resolve();
                        });
                    }

                    _.forEach(primaryDataTable.columns, function (col){
                        if (self.isList){
                            // don't copy autoincrement columns
                            if (rowToInsert.table.autoIncrement(col.name)) return true;
                            // don't copy keys
                            if (col.isPrimaryKey) return true;
                        }

                        meta.insertCopyColumn(col, primaryRowCopy, rowToInsert.current);
                    });

                    self.helpForm.lastSelected(primaryDataTable, rowToInsert.current);
                    self.currOperation = currOperation.insert;
                    self.state.setInsertState();
                    if (self.isList){
                        self.entityChanged = true;
                        self.firstFillForThisRow = true;

                        return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToInsert, "editNewCopy")
                        .then(function (){
                            return self.reFillControls();
                        })
                        .then(function (){
                            return self.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, rowToInsert, "editNewCopy");
                        })
                        .then(function (){
                            self.firstFillForThisRow = false;
                            return def.resolve(true);
                        });
                    }

                    // EFFETTUA IL DEEP-COPY
                    return meta.recusiveNewCopyChilds(primaryRowCopy.getRow(), rowToInsert, dsCopy, self.state.DS, self.primaryTableName, self.editType)
                    .then(function (){
                        // rowToInsert now is the row from which start the filling of the form
                        return getData.doGet(self.state.DS, rowToInsert, self.primaryTableName, true)
                        .then(function (){
                            self.entityChanged = true;
                            self.firstFillForThisRow = true;
                            return self.eventManager.trigger(appMeta.EventEnum.startMainRowSelectionEvent, rowToInsert, "editNewCopy");
                        })
                        .then(function (){
                            return self.reFillControls();
                        })
                        .then(function (){
                            return self.eventManager.trigger(appMeta.EventEnum.stopRowSelectionEvent, rowToInsert, "editNewCopy");
                        })
                        .then(function (){
                            self.firstFillForThisRow = false;
                            return true;
                        });
                    });
                });
            });

            return def.from(res).promise();
        },

        /**
         * Returns a Deferred, resolved with a js complex object, with the parametres useful for the loop on editNewCopy() method:
         * {metaChild:{MetaData}, childRow: {ObjectRow}, newChildRow: {ObjectRow}, childTableName:{string}, rel:{DataRelation} }
         * @param {MetaData} metaChild
         * @param {DataRow} rowToInsert
         * @param {DataTable} childTable
         * @param {ObjectRow} childRow
         * @param {DataRelation} rel
         * @returns {Deferred}
         */
        getNewRowEditCopy:function (metaChild, rowToInsert, childTable, childRow, rel) {
            const def = Deferred('getNewRowEditCopy');
            metaChild.setDefaults(childTable);
            const res = metaChild.getNewRow(rowToInsert, childTable, this.editType)
            .then(function (newChildRow){
                //costruisco oggetto js oltre che con il risultato della getNewRow, anche con i vari parametri utili poi nella successiva logica
                const objres = {
                    metaChild: metaChild,
                    childRow: childRow,
                    newChildRow: newChildRow.current,
                    childTableName: childTable.name,
                    rel: rel
                };
                return def.resolve(objres);
            });

            return def.from(res).promise();
        },

        /**
         * @method doDelete
         * @private
         * @description ASYNC
         * Called in two points in cmdMainDelete(). Performs the CascadeDelete on dataset and then posts the modifies on the database
         * @param {ObjectRow} currEntityRow
         * @returns {Deferred}
         */
        doDelete:function (currEntityRow) {
            const def = Deferred("doDelete");
            const self = this;
            try {
                metaModel.applyCascadeDelete(currEntityRow);



                return self.eventManager
                    .trigger(appMeta.EventEnum.saveDataStart,
                        self,
                        true,
                        "doDelete")
                    .then(function(){
                            return self.saveFormData();
                    })
                    .then(function(res) {
                        // Il saveFormData effettua la delete a database. ok.
                        // lato js currEntityRow verrà detached, durante il merge dei dataset in getDataUtils.mergeDataSetChanges()

                        if (currEntityRow.getRow) { //equivalente a .state!==detached
                            self.state.DS.rejectChanges();
                            return self.freshForm(true, false)
                                .then(function() {
                                    self.currOperation = currOperation.none;
                                    self.entityChanged = true;
                                    return def.resolve(true);
                                });
                        }
                        self.setPageTitle();
                        if (self.state.isInsertState()) {
                            def.resolve(null);
                        } // AfterClear has caused an insert --> nothing else to do
                        self.currOperation = currOperation.none;
                        return self.eventManager
                            .trigger(appMeta.EventEnum.saveDataStop,
                                self,
                                res,
                                "doDelete").then(function () {
                                return def.resolve(null);
                            });

                    });
            } catch (e) {
                self.state.DS.rejectChanges();
                return self.showMessageOk(localResource.getDeleteObjInsert(self.getName()))
                    .then(function () {
                        return self.freshForm(true, false)
                            .then(function () {
                                self.currOperation = currOperation.none;
                                return def.resolve(null);
                            });
                    });

            }
        },

        /**
         * @method cmdMainDelete
         * @private
         * @description ASYNC
         * Manages a main delete command
         * @returns Promise
         */
        cmdMainDelete:function () {
            const def = Deferred("cmdMainDelete");
            const self = this;
            const primaryDataTable = this.getPrimaryDataTable();

            const res = this.getFormData(true)
            .then(function (){
                self.currOperation = currOperation.delete;

                const currEntityRow = self.helpForm.lastSelected(primaryDataTable);
                if (!currEntityRow) return def.resolve(null);


                if (self.detailPage){
                    // in pag dettaglio metteva il dialog result a cencel: formController.linkedForm.DialogResult = DialogResult.Cancel;
                    self.currOperation = currOperation.none;

                    // Deve fare qualcosa di simile a quel che c'è in btnMainSave (return to caller, DeferredResult.resolve(false) )
                    return appMeta.currApp.returnToCaller()
                    .then(function (){
                        def.resolve(null);
                        self.deferredResult.resolve(false);
                    });

                }

                const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_delete);

                if (self.state.isInsertState()){
                    if (!self.dontWarnOnInsertCancel){
                        return self.showMessageOkCancel(localResource.getDeleteRowConfirm(self.name)).
                            then(function (res){
                                if (!res){
                                    self.currOperation = currOperation.none;
                                    self.hideWaitingIndicator(waitingHandler);
                                    return def.resolve(null);
                                }

                                return self.doDelete(currEntityRow).
                                    then(function (){
                                        self.hideWaitingIndicator(waitingHandler);
                                        return def.resolve(true);
                                    });
                            });
                    }
                    self.currOperation = currOperation.none;
                    self.hideWaitingIndicator(waitingHandler);
                    return def.resolve(null);
                }

                return self.showMessageOkCancel(localResource.getDeleteObjInsert(self.getName()))
                .then(function (res){
                    if (!res){
                        self.currOperation = currOperation.none;
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(null);
                    }
                    return self.doDelete(currEntityRow)
                    .then(function (){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(true);
                    });
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method manage
         * @private
         * @description ASYNC
         * @param {string} command
         * @param {string} startfield
         * @param {string} startvalue
         * @param {jsDataQuery} filter
         * @param {element} origin
         * @returns {Deferred}
         */
        manage:function (command, startfield, startvalue, filter, origin) {
            const def = Deferred("manage");

            const rootEl = origin || this.rootElement;
            const self = this;
            let waitingHandler;
            return this.getFormData(true)
                .then(function () {
                    const cmd = self.helpForm.getFieldLower(command, 0);
                    if (cmd !== "manage") return def.resolve(false);

                    //entity is the name of the table in the DataSet
                    const entityName = self.helpForm.getFieldLower(command, 1);
                    let entityTable = self.getDataTable(entityName);
                    if (!entityTable) {
                        return self.showMessageOk(localResource.getMissingTableDataSet(entityName)).then(function() {
                            return def.resolve(false);
                        });
                    }

                    //unaliased is the name of the actual metadata to build and get from db
                    const unaliased = self.getDataTable(entityName).tableForReading();

                    const editmode = self.helpForm.getFieldLower(command, 2);
                    // Ora è passato cone parametro var filter = self.helpForm.getLastField(command, 3);

                    const currMetaData = appMeta.getMeta(unaliased);

                    if (!currMetaData) {
                        return self.showMessageOk(localResource.getEntityNotfound(unaliased, self.title)).then(function() {
                            return def.resolve(false);
                        });
                    }

                    filter = self.helpForm.mergeFilters(filter, entityTable.staticFilter());

                    // Devono essere passati alla metaPage del Form "figlio", sfruttiamo l'oggetto "callingParameters"
                    // self.state.callingParameters.searchEnabled = false;
                    // self.state.callingParameters.mainSelectionEnabled = true;
                    //28/5/2021 Nino: uso manageParams invece di callingParameters
                    self.state.toInherit.manageParams = { startFieldWanted: startfield, startValueWanted: startvalue};
                    
                    self.state.toInherit.filterLocked = true;
                    self.state.toInherit.startFilter = filter;

                    let selected = null;
                    self.state.editedRow = null;
                    return utils._if(!!startvalue)
                        ._then(function () {
                            //try to load a row directly, without opening a new form
                            let stripped = startvalue;
                            if (stripped.endsWith("%")) stripped = stripped.slice(0, -1);
                            const filter2 = self.helpForm.mergeFilters(filter, q.isNullOrEq(startfield, stripped));
                            waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_search);
                            return currMetaData.selectByCondition(filter2, unaliased)
                                .then(function (dtRow) {
                                    selected = dtRow;

                                    if (selected) {
                                        entityTable = selected.table;
                                        while (entityTable.rows.length > 1) {
                                            entityTable.rows[1].getRow().del();
                                            entityTable.rows[1].getRow().acceptChanges();
                                        }
                                        if (entityTable.name === unaliased) entityTable.name = entityName;
                                        metaModel.copyPrimaryKey(entityTable, self.getDataTable(entityName));
                                    }
                                    self.hideWaitingIndicator(waitingHandler);
                                    return true;
                                });
                        })
                        .then(function () {

                            return utils._if(!selected)
                                ._then(function () {

                                    return self.edit(unaliased, editmode, true)
                                        .then(function (dialogResult) {//we assume true = "Ok" = mainsave command invoked

                                            waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_page_update);
                                            return utils._if(!dialogResult)
                                                ._then(function () {
                                                    // entityCalledChanged valorizzato nella returnToCaller()
                                                    return utils._if(self.entityCalledChanged && entityTable)
                                                        ._then(function () {
                                                            return utils._if(self.canRecache(entityTable))
                                                                ._then(function () {
                                                                    metaModel.reCache(entityTable);
                                                                    return getData.readCached(self.state.DS);
                                                                })
                                                                .then(function () {
                                                                    if (self.isEmpty()){
                                                                        return self.doPreFill(entityName, null);
                                                                    }
                                                                    return self.freshForm(true, false, entityName);

                                                                });
                                                        })
                                                        .then(function () {
                                                            // da questo ramo esce sempre con false, deve uscire dalla funz
                                                            return false;
                                                        });

                                                }) // chiude then if(!dialogResult)
                                                ._else(function () {
                                                    // se dialogResult è true allora devo restituire true poiche così rimbalzo sul successivo then e vado avanti. con false esco,
                                                    // come succede sulla funz in mdl, riga 2711 di MetaData
                                                    return true;
                                                })
                                                .then(function (res) {
                                                    // il form chiamato in edit, imposta sullo stato del chiamante questa proprietà, nella mainSelect
                                                    // che qui vado a rileggere
                                                    selected = self.state.calledPageSelectedRow;
                                                    return res; // rimbalzo al then successivo il booleano, se restituisco false devo uscire dall'interna funzione
                                                });

                                        });
                                })
                                .then(function (res) {

                                    // se dal _then precedente ero uscito con false, allora esco con false, altrimenti vado avanti
                                    if (!res){
                                        self.hideWaitingIndicator(waitingHandler);
                                        return def.resolve(false);
                                    }

                                    if (!selected) {
                                        const savedDrawState = self.drawState;
                                        self.drawState = drawStates.filling;
                                        return utils._if(self.canRecache(entityTable))
                                            ._then(function () {
                                                metaModel.reCache(entityTable);
                                                return getData.readCached(self.state.DS);
                                            })
                                            .then(function () {

                                                return self.beforeRowSelect(entityTable, null)
                                                    .then(function () {
                                                        return getData.doGet(self.state.DS, null, self.primaryTableName, true);
                                                    })
                                                    .then(function () {
                                                        return self.doPreFill();
                                                    })
                                                    .then(function () {
                                                        self.drawState = savedDrawState;
                                                        return true;
                                                    })
                                                    .then(function(){
                                                        return self.afterRowSelect(entityTable, null);
                                                    })
                                                    .then(function () {
                                                        self.hideWaitingIndicator(waitingHandler);
                                                        return def.resolve(true);
                                                    });
                                            });
                                    }

                                    // Entity Table is the actual DataTable in the DataSet. Select belongs to another
                                    // DataSet and possibly has a different TableName

                                    // in case of selectByCondition, selected is already dataRow
                                    const dtRow = selected ? (selected.getRow ? selected.getRow() : selected) : null;
                                    return self.manageSelectedRow(dtRow, entityTable, true, rootEl)
                                        .then(function () {
                                            self.hideWaitingIndicator(waitingHandler);
                                            return def.resolve(true);
                                        });

                                });// fine .then di  utils._if(selected === null)

                        }); // fine .then di  utils._if(startvalue)
                });
        },

        /**
         * @method edit
         * @private
         * @description ASYNC
         * Opens a new page for editing
         * @param {string} metaName
         * @param {string} editType
         * @param {boolean} wantsRow
         * @returns {Promise<boolean>}
         */
        edit:function (metaName, editType, wantsRow) {
            const def = Deferred("edit");

            return def
                .from(appMeta.currApp.callPage(metaName, editType, wantsRow))
                .promise();
        },

        /**
         * @method choose
         * @internal
         * @description ASYNC
         * Manages the choice of a row
         * @param {string} command
         * @param {jsDataQuery} filter
         * @param {element} origin
         * @returns Promise<boolean>  it is true if a row has been selected
         */
        choose:function (command, filter, origin) {

            const def = Deferred("choose");
            const self = this;

            const currRootElement = origin || this.rootElement;

            const waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_valuesSearching);

            const res = this.getFormData(true).then(function (){

                const cmd = self.helpForm.getFieldLower(command, 0);
                if (cmd !== "choose") return def.resolve(false);
                const entityName = self.helpForm.getFieldLower(command, 1);
                const unaliased = self.getDataTable(entityName).tableForReading();
                if (!unaliased){
                    self.hideWaitingIndicator(waitingHandler);
                    return self.showMessageOk(localResource.getCommandExecutionError(command)).then(function (){
                        return def.resolve(false);
                    });
                }
                const listtype = self.helpForm.getFieldLower(command, 2);
                const filterTag = self.helpForm.getLastField(command, 3); //o clear o niente
                const currMetaData = appMeta.getMeta(unaliased);

                if (!currMetaData){
                    self.hideWaitingIndicator(waitingHandler);
                    return self.showMessageOk(localResource.getEntityNotfound(unaliased, self.title)).then(function (){
                        return def.resolve(false);
                    });
                }

                //currMetaData.filterLocked = true; // passato come parametro esplicito alla selectOne
                const entityTable = self.getDataTable(entityName);

                //sometimes unnecessary cause SelectOne does the filter merging
                if (filterTag && filterTag !== "clear" && entityName !== unaliased && entityTable.staticFilter()){
                    if (filter && entityTable.staticFilter()){
                        filter = q.and(filter, entityTable.staticFilter());
                    }
                    else if (entityTable.staticFilter()){
                        filter = entityTable.staticFilter();
                    }
                }

                if (filterTag && filterTag !== "clear"){
                    if (filter && currMetaData.searchFilter(entityTable)){
                        filter = q.and(filter, currMetaData.searchFilter(entityTable));
                    }
                    else if (currMetaData.searchFilter(entityTable)){
                        filter = currMetaData.searchFilter(entityTable);
                    }
                }

                entityTable.clear();

                if (filterTag === "clear"){
                    return self.helpForm.fillSpecificRowControls(currRootElement, entityTable, null)
                    .then(function (){
                        return self.manageSelectedRow(null, entityTable, true, currRootElement);
                    }).then(function (){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(false);
                    });
                }

                // Da qui in poi "filter" è sicuramente diverso da clear

                let exclude = null;
                if (metaModel.notEntityChild(entityTable)) exclude = entityTable;

                return self.selectOne(listtype, filter, unaliased, exclude, true)
                .then(function (dataRow){
                    return self.selectOneCompleted(dataRow, entityTable, currRootElement);
                }).then(function (res){
                    self.hideWaitingIndicator(waitingHandler);
                    return def.resolve(res);
                });
            });

            return def.from(res).promise();
        },

        /**
         *
         * @param {DataRow} selectedRow
         * @param {DataTable} entityTable
         * @param {element} currRootElement
         * @returns {*}
         */
        selectOneCompleted:function(selectedRow, entityTable, currRootElement) {
            const def = Deferred("selectOneCompleted");
            const self = this;
            if (!selectedRow) {
                return def.resolve(false);
            }
            //SelectedRow may have been retrieved from a view
            const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_page_update);
            let exit = false;
            return utils._if(selectedRow.table.name !== entityTable.name)
                ._then(function() {
                    //search selected row in EntityTable
                    const keyFilter = getData.getWhereKeyClause(selectedRow, entityTable, entityTable, false);
                    const existingRows = entityTable.select(keyFilter);
                    if (!existingRows.length) {
                        const newRow = entityTable.newRow();
                        if (self.getRowFromList(selectedRow, newRow.getRow())) {
                            if (!self.isEmpty()) {
                                newRow.getRow().acceptChanges();
                                selectedRow =  newRow.getRow();
                            } else {
                                newRow.getRow().del();
                            }
                        } else {
                            newRow.getRow().del();
                            if (self.helpForm.childRelation(self.getPrimaryDataTable(), entityTable, null)) {

                                return getData.getByKey(entityTable, selectedRow).then(
                                    function(dataRow) {

                                        selectedRow = dataRow;

                                        return self.manageSelectedRow(selectedRow,
                                            entityTable,
                                            true,
                                            currRootElement).then(
                                            function() {
                                                exit = true;
                                                self.hideWaitingIndicator(waitingHandler);
                                                return true;
                                            });
                                    }
                                );
                            } else {
                                selectedRow.table.name = entityTable.name;
                            }
                        }
                    } else {
                        selectedRow = existingRows[0].getRow();
                    }
                })
                .then(function() {

                    if (exit) return def.resolve(false);

                    return self.manageSelectedRow(selectedRow, entityTable, true, currRootElement).then(
                        function() {
                            self.hideWaitingIndicator(waitingHandler);
                            return def.resolve(selectedRow);

                        });
                });
        },

        /**
         * @method getRowFromList
         * @private
         * @description SYNC
         * Gets a row (Output) knowing that it has been read via a certain list type.
         * Output row is assumed to belong to primary table. Input row can belong
         * to anything
         * @param {DataRow} input
         * @param {DataRow} output
         * @returns {boolean}
         */
        getRowFromList:function (input, output) {
            if (input.table.name === this.primaryTableName) {
                _.forEach(output.table.columns,
                    function(c) {
                        if (metaModel.temporaryColumn(c)) return false;
                        if (input.table.columns[c.name]) {
                            output.current[c.name] = input.current[c.name];
                        }
                    });
                return true;
            }
            return false;
        },

        /**
         * @method manageSelectedRow
         * @private
         * @description ASYNC
         * @param {DataRow} selected A row that May (in case of choose) or may NOT belong to Monitored
         * @param {DataTable} monitored current DataSet Table
         * @param {boolean} canPreFill
         * @param {element} currRootElement Control parent to eventually update with children
         * @returns {Deferred}
         */
        manageSelectedRow:function(selected, monitored, canPreFill, currRootElement) {
            const def = Deferred('manageSelectedRow');
            let keyfilter = null;
            let sqlkeyfilter = null;
            if (selected) {
                metaModel.copyPrimaryKey(selected.table, monitored);
                keyfilter = getData.getWhereKeyClause(selected, selected.table, selected.table, false);
                sqlkeyfilter = getData.getWhereKeyClause(selected, selected.table, selected.table, true);
            }

            if (this.canRecache(monitored)) {
                metaModel.reCache(monitored);
            }
            const self = this;
            let objRowSelected = selected ? selected.current : null;
            const result = this.beforeRowSelect(monitored, objRowSelected).then(function (){

                return utils._if(self.isEmpty())
                ._then(function (){

                    const savedDrawState = self.drawState;
                    self.drawState = drawStates.filling;

                    return getData.readCached(self.state.DS).then(
                        function (){
                            return utils._if(canPreFill)
                            ._then(function (){
                                return self.doPreFill(monitored.name);
                            })
                            .then(function (){
                                if (selected){
                                    selected.table.name = monitored.name;
                                    const oneSelected = monitored.select(keyfilter);
                                    if (oneSelected.length){
                                        selected = oneSelected[0].getRow();
                                        objRowSelected = oneSelected[0];
                                    }
                                }

                                return self.beforeRowSelect(monitored, objRowSelected)
                                .then(function (){
                                    return self.helpForm.fillParentControls(currRootElement, monitored, selected);
                                })
                                .then(function (){
                                    return self.helpForm.fillSpecificRowControls(currRootElement, monitored, selected);
                                })
                                .then(function (){
                                    self.helpForm.iterateFillRelatedControls(currRootElement, null, monitored, objRowSelected);
                                    self.drawState = savedDrawState;
                                    return self.freshToolBar();
                                })
                                .then(function (){
                                    return self.afterRowSelect(monitored, objRowSelected);
                                });
                            });
                        });
                })
                ._else(function (){

                    return utils._if(!!selected)
                    ._then(function (){
                        if (selected.state === dataRowState.detached && selected.table.name === monitored.name){
                            return getData.runSelectIntoTable(monitored, sqlkeyfilter, null).then(function (){
                                const oneSelected = monitored.select(keyfilter);
                                if (oneSelected.length > 0){
                                    selected = oneSelected[0].getRow();
                                    return true;
                                }
                                else{
                                    logger.log(logType.ERROR, "Impossibile collegare la riga alla tabella " + monitored.name + " nel metadato  " + self.state.meta.getName(self.editType));
                                    return def.resolve(false);
                                }
                            });
                        }

                        return true;
                    })
                    .then(function (){

                        self.helpForm.makeChildPrimaryORSubentity(selected, monitored, null);

                        if (!self.detailPage || !self.state.isInsertState()){
                            self.checkEntityChildRowAdditions(selected, null);
                        }

                        return self.eventManager.trigger(appMeta.EventEnum.startRowSelectionEvent, self, selected)
                        .then(function (){
                            return self.freshForm(canPreFill, true, monitored.name, currRootElement);
                        })
                        .then(function (){
                            return self.eventManager.trigger(appMeta.EventEnum.stopRowSelectionEvent, self, selected);
                        })
                        .then(function (){

                            if (selected){
                                if (selected.state === dataRowState.detached) selected = null;
                            }

                            return utils._if(!selected && keyfilter)
                            ._then(function (){
                                return getData.runSelectIntoTable(monitored, keyfilter, null).then(function (){
                                    const oneSelected = monitored.select(keyfilter);
                                    if (oneSelected.length) selected = oneSelected[0].getRow();
                                    return true;
                                });
                            })
                            .then(function (){
                                return utils._if(!!selected)
                                ._then(function (){
                                    const oneSelected = monitored.select(keyfilter);
                                    if (!oneSelected.length){
                                        return getData.runSelectIntoTable(monitored, keyfilter, null).then(function (){
                                            const oneSelected = monitored.select(keyfilter);
                                            if (oneSelected.length) selected = oneSelected[0].getRow();
                                            return true;
                                        });
                                    }
                                })
                                .then(function (){
                                    objRowSelected = selected ? selected.current : null;
                                    return self.beforeRowSelect(monitored, objRowSelected);
                                })
                                .then(function (){
                                    self.helpForm.iterateFillRelatedControls(currRootElement, null, monitored, objRowSelected);
                                    return self.freshToolBar();
                                })
                                .then(function (){
                                    return self.afterRowSelect(monitored, objRowSelected);
                                });
                            });
                        });

                    });

                });
            });

            return def.from(result).promise();

        },

        /**
         * @method canRecache
         * @private
         * @description ASYNC
         * A table "t" is recachable if it is clearable and is not entity or subentity
         * @param {DataTable} t
         * @returns {boolean}
         */
        canRecache:function(t) {
            if (!metaModel.allowClear(t)) return false;
            if (t.name === this.primaryTableName) return false;
            if (metaModel.isSubEntity(t, this.getPrimaryDataTable())) return false;
            return true;
        },

        /**
         * @method notesAvailable
         * @private
         * @description SYNC
         * Return true if there are notes available
         * @returns {boolean}
         */
        notesAvailable:function () {
            // TODO
            return false;

            /**
             *  if (HasNotes()) {
                if (GetNotes() != "") return true;
            }
             if (HasOleNotes()) {
                Byte[] N = GetOleNotes();
                if (N.Length > 132) return true;
            }
             return false;
             */
        },

        // ****** FINE REGION DOMAIN COMMAND *******************

        /**
         * @method assurePageState
         * @private
         * @description ASYNC
         * Creates own state if it still not exists
         * @method assurePageState
         * @returns {Deferred}
         */
        assurePageState: function() {
            const res = new Deferred("assurePageState");
            if (this.state) {
                return res.resolve(this.state).promise();
            }
            //eventually some other logic..
            this.state = new appMeta.MetaPageState();
            this.state.meta = appMeta.getMeta(this.primaryTableName);
            const self = this;
            this.callMethod(toOverrideEvent.onAssurePageState)
                .then(function() {
                    res.resolve(self.state);
                });

            return res.promise();
        },

        /**
         * @method init
         * @internal
         * @description ASYNC
         * Instantiate all necessary data to make the page work, this must be called BEFORE setCallingPage
         * @returns {Deferred}
         */
        init: function () {
            const def = Deferred("init");
            if (this.inited) {//the meta page already has been inited
                return (def.resolve().promise());
            }
            const waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_page_init);
            const self = this;
            const res = this.assurePageState()
            .then(this.assureDataSet.bind(this))
            .then(function (){
                // Helpform is created when the page is inited
                self.helpForm = new appMeta.HelpForm(self.state, self.primaryTableName, self.rootElement);
                self.inited = true;
                self.hideWaitingIndicator(waitingHandler);
                return def.resolve(self);
            });

            return def.from(res).promise();
        },

        /**
         * @method setCallingPage
         * @internal
         * @description SYNC
         * Sets this page as calling page
         * @param {MetaPage} pageToCall
         * @param {boolean} wantsRow
         */
        setCallingPage: function (pageToCall, wantsRow) {
            if (!this.state) throw "setCallingPage: init has not yet been called";
            this.state.wantsRow = wantsRow;
            pageToCall.state.callerState = this.state;
            pageToCall.state.callerPage = this;
            _.extend(pageToCall, this.state.toInherit);

        },

        /**
         * @method clearCalls
         * @internal
         * @description SYNC
         */
        clearCalls: function() {
            this.wantsRow = false;
        },

        /**
         * @method getFormData
         * @public
         * @description ASYNC
         * Reads data from page controls and put them into dataset
         * @param {boolean} noCheck
         * @returns Promise<boolean>
         */
        getFormData: function (noCheck) {
            const def = Deferred("doing getFormData");
            if (this.state.isSearchState()) return def.resolve(true);
            const self = this;
            const ds = self.state.DS;

            const primaryRow = this.helpForm.lastSelected(this.getPrimaryDataTable());
            if (!primaryRow) return def.resolve(true);

            const res =
                this.helpForm.getControls().
                    then(()=> {
                    return this.callMethod(toOverrideEvent.afterGetFormData);
                })
            .then(function (){
                if (noCheck) return def.resolve(false);
                const allRowsToCheck = [primaryRow.getRow()];
                // collect all subentity to check
                _.forIn(self.state.extraEntities,
                    function (subentity){
                        const subTable = ds.tables[subentity];
                        if (!subTable.rows.length) return true;
                        const entityRow = self.helpForm.getCurrChildRow(primaryRow, subTable);
                        if (entityRow && entityRow.getRow().state !== dataRowState.unchanged) allRowsToCheck.push(entityRow.getRow());
                    });

                return self.manageValidResults(allRowsToCheck)
                .then(function (valid){
                    if (!valid) return def.resolve(false);

                    if (!self.detailPage) return def.resolve(true);

                    return self.propagateChangesToMaster()
                    .then(function (wasValid){
                        if (!wasValid) return def.resolve(false);
                        return def.resolve(true);
                    });
                });
            });

            return def.from(res).promise();
        },

        /**
         * @method manageValidResults
         * @private
         * @description ASYNC
         * Returns true if all rows in rowsToCheck are valid, false otherwise
         * @param {DataRow[]} rowsToCheck
         * @returns {Deferred(boolean)}
         */
        manageValidResults: function(rowsToCheck) {
            const self = this;
            const def = Deferred("manageValidResults");
            // salvo i check, che sono deid eferred in 1 array, che sbrigleiro con una when
            const allDeferredChecks = [];
            _.forEach(rowsToCheck, function (row) {
                allDeferredChecks.push(self.manageValidResult(row));
            });

            const result = $.when.apply($, allDeferredChecks)
            .then(function (){
                //ha in input tutti i risultati dei manageValidResult

                // torna il primo elemento che non ha warning, quindi è obbligatorio. se non trova torna undefined
                const mandatoryMsg = _.find(arguments,
                    function (defObj){
                        // se è null significa che la isValid era ok quindi non è un defObj Mandatorio
                        if (!defObj) return false;
                        return (defObj.errMsg);
                    });

                // mostro il primo messaggio obbligatorio
                if (mandatoryMsg){

                    // mostro messagebox informativa
                    return self.showMessageOk(mandatoryMsg.errMsg)
                    .then(function (){
                        // metto il focus sul controllo
                        self.helpForm.focusField(mandatoryMsg.errField, mandatoryMsg.row.table.name);
                        return false;
                        // return Deferred("manageValidResults/showMessageOk").resolve(false).promise(); //deve uscire con false a prescindere dal fatto che uno prema ok
                    });
                }

                // recupera solo i warning
                const allWarning = _.filter(arguments,
                    function (defObj){
                        if (!defObj) return false;
                        return defObj.warningMsg;//se truthy allora viene restituito
                    });

                // se non ci sono warning esco con true
                if (allWarning.length === 0) return def.resolve(true); //return Deferred("manageValidResults/allWarning empty").resolve(true).promise();

                // inizializzo primo elemento della catena di then
                let f = $.Deferred().resolve(true).promise();

                // per ogni iterazione sui warningMessage creo una then
                _.forEach(
                    allWarning,
                    function (defObj){
                        f = f.then(function (prevValue){
                            if (prevValue) return self.showMessageOkCancel(defObj.warningMsg);

                            // metto il focus sul controllo
                            self.helpForm.focusField(defObj.errField, defObj.row.table.name);
                            // esco dal ciclo for
                            return false;
                        });
                    });

                // invoca la funzione appena costruita
                return f;
            });

            return def.from(result).promise();
        },

        // /**
        //  * @method manageValidResult
        //  * @public
        //  * @description SYNC
        //  * To override Permits externally to apply graphics on mandatory fields
        //  * @params {objMandatory} { warningMsg: warningMessage,
        //         errMsg: errmess + " (" + outCaption + ")",
        //         errField: colname,
        //         outCaption: outCaption,
        //         row: row }
        //  */
        // mandatoryUiFields: function(objMandatory) {
        //
        // },

        /**
         * @method manageValidResult
         * @private
         * @description SYNC
         * Checks if a row is valid, could potentially imply server logic
         * @param {DataRow} rowToCheck
         * @returns Promise
         */
        manageValidResult: function (rowToCheck) {
            // inizializzo il metaDato
            let currMetaData = this.state.meta;
            // se non è primary table lo recupero
            if (rowToCheck.table.name !== this.primaryTableName) currMetaData = appMeta.getMeta(rowToCheck.table.tableForReading());
            // ho il metadato chiamo la isValid
            return currMetaData.isValid(rowToCheck);
        },



        /**
         * @method fnMethod
         * @public
         * @description SYNC
         * Returns a function that calls a method and returns a promise
         * @param {string|Function} method
         * @returns {function}
         */
        fnMethod: function (method) {
            const self = this;
            return function () {
               return self.callMethod(method);
            };
        },

        /**
         * @method callMethod
         * @public
         * @description ASYNC
         * Calls a method if it exists and returns ther result as a promise
         * @param {string|Function} method
         * @returns Promise
         */
        callMethod: function (method) {
            const res = Deferred("callMethod " + method);
            if (typeof (method) === "string") {
                method = this[method];
            }
            if (typeof method !== "function") {
                return res.resolve(true).promise();
            }
            //preserves  this[method] number of arguments
            return res.from(utils.callOptAsync(utils.optBind(method, this)));
        },

        /**
         * @method drawStateIsDone
         * @private
         * @description SYNC
         * @returns {boolean}
         */
        drawStateIsDone: function() {
            return this.drawState === appMeta.DrawStates.done;
        },

        /**
         * @method doPreFill
         * @public
         * @description ASYNC
         * Prepares the page to be filled. This is generally done only the first time the page appears, but some time can be repeated
         * if there is the concrete possibility that secondary tables have been modified outside here
         * @param {string} [tableWantedName]
         * @param {jsDataQuery} [filter]
         * @returns Promise
         */
        doPreFill:function (tableWantedName, filter) {
            const def = Deferred('doPrefill');
            const saved = this.drawState;
            this.drawState = appMeta.DrawStates.prefilling;
            const selList = [];
            const self = this;
            const res = this.helpForm.preFillControls(tableWantedName, filter, selList)
            .then(function (){
                return getData.multiRunSelect(selList);
            })
            .then(function (){
                self.drawState = saved;
                return true;
            });

            return def.from(res).promise();
        },

        /**
         * @method isEmpty
         * @private
         * @description SYNC
         * Returns true if primary table hasn't rows
         * @returns {boolean}
         */
        isEmpty:function () {
            const primaryTable = this.getPrimaryDataTable();
            if (!primaryTable) return true;
            if (primaryTable.rows.length === 0) return true;
            return false;
        },

        /**
         * @method checkEntityChildRowAdditions
         * @private
         * @description SYNC
         * If possible, makes row child of current PrimaryEntity
         * @param {DataRow} row
         * @param {string} relName. can be undefined
         */
        checkEntityChildRowAdditions:function (row, relName) {
            if (!row) return;
            const primary = this.helpForm.lastSelected(this.getPrimaryDataTable());
            if (!primary) return;
            const isMadeChild = this.helpForm.makeChild(primary.getRow(), primary.getRow().table, row, relName);
            if (isMadeChild) {
                if (!relName) {
                    metaModel.addNotEntityChild(primary.getRow().table, row.table);
                } else {
                    metaModel.addNotEntityChildRel(row.table, relName);
                }
            }
        },

        /* START GRID EVENTS MANAGEMENT see helForm.setButtonHandler() */

        /**
         * @method insertClick
         * @public
         * @description ASYNC
         * "this" is the button that launched the event
         * @param {MetaPage} that
         * @param {GridControlX} grid or event if this is called via a button out of the grid
         * @returns {Deferred}
         */
        insertClick:function (that, grid) {

            const def = Deferred('insertClick');
            if (!grid.fillControl) {
	            grid = that.helpForm.getLinkedGrid(this);
            }

            const g = grid;
            if (!g) {
                return that.eventManager.trigger(appMeta.EventEnum.insertClick, that, "insertClick")
                    .then(function () {
                        return def.resolve(false).promise();
                    });
            }

            // if ($(this).prop('disabled')) return def.resolve(false);
            $(this).prop('disabled', true);

            try {
                const self = this;
                const res = that.insertGridRow(g, that.helpForm.getFieldLower(g.tag, 2))
                .then(function (){
                    $(self).prop('disabled', false);
                    return that.eventManager.trigger(appMeta.EventEnum.insertClick, g, "insertClick");
                });

                return def.from(res).resolve(true);
            }
            catch (e){
                logger.log(logType.ERROR, 'MetaPage.insertClick', e.message);
            }
        },

        /**
         * @method editClick
         * @public
         * @description ASYNC
         * Launched by the button "edit" attached to the grid
         * "this" is the Meta Page that launched the event. see helForm.setButtonHandler()
         * @param {MetaPage} that
         * @param {GridControl} grid
         * @returns {Deferred}
         */
        editClick:function (that, grid) {
            const def = Deferred('editClick');
            if (!grid) {
                return that.eventManager.trigger(appMeta.EventEnum.editClick, that, "editClick")
                    .then(function () {
                        return def.resolve(false);
                    });
            }

            try {
                let editType = that.helpForm.getFieldLower(grid.tag, 2)
                const res = that.editGridRow(grid, editType)
                .then(function (){
                    return that.eventManager.trigger(appMeta.EventEnum.editClick, grid, "editClick");
                });

                return def.from(res).promise();

            } catch (e) {
                logger.log(logType.ERROR, "MetaPage.editClick", e.message);
                return def.resolve(false);
            }
        },

        /**
         * @method editGridRow
         * @private
         * @description ASYNC
         * Called when an edit button is clicked on a grid. If there is a current row it opens a detail page to edit the row
         * @param {GridControl} grid
         * @param {string} editType
         * @returns {Promise<DataRow>}
         */
        editGridRow:function (grid, editType) {
            const def = Deferred('editGridRow');

            const self = this;
            if (!grid) return  def.resolve(null);

            const row = grid.getCurrentRow().row;
            if (!row) {
                return self.showMessageOk(localResource.selectRowInAGrid)
                    .then(function () {
                        return def.resolve(null);
                    });
            }

            // gets data from form
            const res = this.getFormData(true)
            .then(function (){

                if (!grid.DS){
                    const msg = localResource.getGridControlTagWrong(grid.tag, self.title);
                    return self.showMessageOk(msg)
                    .then(function (){
                        return def.resolve(null);
                    });
                }

                const res = self.helpForm.getCurrentRow(grid.el);  // N.b restituisce un obj così { table: this.dataTable, row: this.currentRow };
                if (!res.row){
                    return self.showMessageOk(localResource.selectRowInAGrid)
                    .then(function (){
                        return def.resolve(null);
                    });
                }
                const sourceTable = res.table;
                let currDR = res.row;

                return self.editDataRow(res.row.getRow(), editType)

                .then(function (dialogResult){

                    const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_page_update);

                    return utils._if(dialogResult)
                    ._then(function (){

                        // Questa è stata valorizzata nel child sull'Ok
                        currDR = self.state.newSourceRow;

                        // Deve essere child della tab principale + tuttele chiave della primaria devono essere anceh chiavi della child
                        // Ade sempio un grid apre un dettaglio in edit, le mod vengono riversate sul padre, se e solo se lui è considerato subentity
                        // e quindi la tabella child sul dataset deve avere la chiave della tab padre
                        if (metaModel.isSubEntity(sourceTable, self.getPrimaryDataTable())) self.entityChanged = true;

                        self.helpForm.iterateFillRelatedControls($(grid.el).parent(), grid.el, sourceTable, currDR);

                        // It's necesssary to do something cause Grid must re-evaluated:
                        // - calculated fields
                        // - resize of columns
                        metaModel.getTemporaryValues(sourceTable);

                        return self.doPreFill(sourceTable.name, null)
                        .then(function (){
                            return self.freshForm(true, true);
                        });
                    })
                    .then(function (){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(currDR);
                    });

                });
            });

            return def.from(res).promise();
        },

        /**
         * @method editDataRow
         * @private
         * @description ASYNC
         * Edits a datarow using a specified listing type. Also Extra parameter
         * of R.Table is considered.
         * @param {DataRow} dataRow
         * @param {string} editType
         * @returns {Promise<DataRow>}
         */
        editDataRow:function (dataRow, editType) {

            const def = Deferred('editDataRow');

            const sourceTable = dataRow.table;
            const unaliased = sourceTable.tableForReading();

            // Gli extra parameters vengono passati nella callPage  , sullo stato della calledPage, ok???
            // come passiamo le altre informazioni alla pagina called, cioè quello nelle 2 prox funzioni, setDefaults() e setSource()?
            // -> Il  setDefaults() avviene tutto sul dataset del parent, nell'edit è inutile nell'insert invece si, dove è creata una riga nel ds parent

            this.state.editedRow = dataRow;  //   child.sourceRow = dataRow  >>questo sarebbe ciò che rimane del setSource
            this.state.setEditState();
            // M.ExtraParameter = SourceTable.ExtendedProperties[(è una costante stringa) FormController.extraParams];
            // questo è fatto all'ultimo momento nella callPage

            const res = this.edit(unaliased, editType, true)
            .then(function (dialogResult){
                return dialogResult;
            });

            return def.from(res).promise();

            /*.then(function (dialogResult) {
             // OutputRow = M.NewSourceRow;  //diventa (siamo nel chiamante) state. NON SERVE PIU', è il child che valorizza this.state.newSourceRow
             // Impostato da getSourceChanges a sua volta chiamato da getFormData
             // bool res = M.EntityChanged;
             return dialogResult;
             });*/
        },

        /**
         * @method deleteClick
         * @public
         * @description ASYNC
         * "this" is the button that launched the event
         * @param {MetaPage} that
         * @param {GridControl} grid
         * @returns {Deferred}
         */
        deleteClick:function (that, grid) {

            const def = Deferred('deleteClick');
            if (!grid) {
                return that.eventManager.trigger(appMeta.EventEnum.deleteClick, that, "deleteClick")
                    .then(function () {
                        return def.resolve(false);
                    });
            }

            try {
                const self = this;

                const res = that.deleteGridRow(grid)
                .then(function (res){
                    return that.eventManager.trigger(appMeta.EventEnum.deleteClick, grid, "deleteClick", res);
                });
                return def.from(res).resolve(true);
            } catch (e){
                logger.log(logType.ERROR, 'MetaPage.deleteClick', e.message);
            }

        },

        /**
         * @method unlinkClick
         * @public
         * @description ASYNC
         * "this" is the button that launched the event
         * @param {MetaPage} that
         * @param {GridControl} grid
         * @returns {Deferred}
         */
        unlinkClick:function (that, grid) {

            const def = Deferred('unlinkClick');

            if (!grid) {
                return that.eventManager.trigger(appMeta.EventEnum.unlinkClick, that, "unlinkClick")
                    .then(function () {
                        return def.resolve(false);
                    });
            }

            if ($(this).prop('disabled'))return def.resolve(false);
            $(this).prop('disabled', true);

            try {
                const self = this;
                const res = that.unlinkGrid(grid)
                .then(function (){
                    $(self).prop('disabled', false);
                    return that.eventManager.trigger(appMeta.EventEnum.unlinkClick, that, "unlinkClick");
                });

                return def.from(res).resolve(true);
            } catch (e){
                logger.log(logType.ERROR, 'MetaPage.unlinkClick', e.message);
            }
        },

        /**
         * @method unlinkGrid
         * @private
         * @description ASYNC
         * Function to link with an "unlink" button
         * @param {GridControl} grid Grid into which add the row
         * @returns {Deferred}
         */
        unlinkGrid:function (grid) {
            const def = Deferred('unlinkGrid');
            const currMeta = this.state.meta;
            if (!currMeta) return def.resolve(false);
            return def.from(this.unlinkGridRow(grid));
        },

        /**
         * @method unlinkGridRow
         * @private
         * @description ASYNC
         * Unlinks a row contained in a "grid"
         * @param {GridControl} grid containing row to unlink
         * @returns {Deferred}
         */
        unlinkGridRow:function (grid) {
            const def = Deferred('unlinkGridRow');
            if (!grid.currentRow) return def.resolve(false);
            const self = this;
            //gets data from form

            const res = this.getFormData(true)
            .then(function (){
                if (!grid.DS){
                    const msg = localResource.getGridControlTagWrong(grid.tag, self.title);
                    return self.showMessageOk(msg).then(function (){
                        return def.resolve(null);
                    });
                }

                const res = self.helpForm.getCurrentRow(grid.el);  // N.b restituisce un obj così { table: this.dataTable, row: this.currentRow };
                if (!res.row) return def.resolve(null);
                const currDR = res.row;

                return self.unlink(currDR.getRow(), grid);
            });

            return def.from(res).promise();
        },

        /**
         * @method unlink
         * @public
         * @description ASYNC
         * Unlinks a specified row and set/unset the table as entitychild consequently.
         * Invoked during a Unlink_Grid_Row grid command
         * @param {DataRow} dataRow row to unlink
         * @param {GridControl} grid
         * @returns {Deferred}
         */
        unlink:function (dataRow, grid) {
            const def = Deferred('unlink');
            const self = this;
            if (!dataRow) return def.resolve(null);

            const linkedTable = dataRow.table;
            const waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_unlink_row);
            const res = this.unlinkDataRow(this.getPrimaryDataTable(), dataRow)
            .then(function (dtRow){

                if (!dtRow){
                    self.hideWaitingIndicator(waitingHandler);
                    return def.resolve(null);
                }

                if (linkedTable.rows.length > 0){
                    metaModel.addNotEntityChild(self.getPrimaryDataTable(), linkedTable);
                }
                else{
                    self.unMarkTableAsNotEntityChild(linkedTable);
                }

                self.helpForm.iterateFillRelatedControls($(grid.el).parent(), null, linkedTable, null);

                return self.freshForm(true, false)
                .then(function (){
                    self.hideWaitingIndicator(waitingHandler);
                    return def.resolve(dtRow);
                });

            });

            return def.from(res).promise();
        },

        /**
         * @method unlinkDataRow
         * @private
         * @description ASYNC
         * Unlinks R from parent-child relation with primary table. I.E., R becomes a not-child of main row.
         * If R becomes unchanged, it is removed from DataSet
         * @param {DataTable} primaryTable
         * @param {DataRow} dataRow
         * @returns {DataRow | null}
         */
        unlinkDataRow:function(primaryTable, dataRow) {
            const def = Deferred('unlinkDataRow');
            const self = this;
            if (!dataRow) return def.resolve(null);

            const sourceTable = dataRow.table;
            // Unlinks R from parent-child relation with primary table.
            let relFound = null;

            _.forEach(primaryTable.childRelations(), function (rel) {
                if (rel.childTable === sourceTable.name) {
                    relFound = rel;

                    _.forEach(relFound.childCols, function (col) {
                        if (sourceTable.isKey(col)) return true; // è un continue
                        dataRow.current[col] = null;
                    });
                }
            });

            const res = utils._if(!relFound)
            ._then(function (){
                const msg = appMeta.localResource.getCantUnlinkDataTable(sourceTable.name, primaryTable.name);
                return self.showMessageOk(msg)
                .then(function (){
                    return def.resolve(null);
                });
            })
            ._else(function (){
                // toglie la riga se inutile
                if (metaModel.checkForFalseUpdates(dataRow)){
                    dataRow.del();
                    //dataRow.acceptChanges();
                }

                return def.resolve(dataRow);
            });

            return def.from(res).promise();
        },

        /**
         * @method unMarkTableAsNotEntityChild
         * @private
         * @description ASYNC
         * Removes a table "t" from being a  NotEntitychild
         * @param {DataTable} t
         */
        unMarkTableAsNotEntityChild:function(t) {
            getData.allowClear(t);
            metaModel.clearNotEntityChild(t);
        },

        /**
         * @method insertGridRow
         * @private
         * @description ASYNC
         * Function to link with an grid-add button
         * @param {GridControl} grid Grid into which add the row
         * @param {string} editType Edit Type to use
         * @returns {Deferred}
         */
        insertGridRow:function (grid, editType) {
            const def = Deferred('insertGridRow');
            const self = this;

            let waitingHandler = this.showWaitingIndicator(localResource.modalLoader_wait_insert);

            const res = this.getFormData(true)
            .then(function (){
                const sourceDataSet = grid.DS;
                if (!sourceDataSet){
                    return self.showMessageOk(localResource.getGridControlTagWrong(grid.tag, self.title))
                    .then(function (){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(null);
                    });
                }
                const tableName = grid.dataSourceName;
                const sourceTable = self.getDataTable(tableName);

                const primaryDataTable = self.getPrimaryDataTable();
                const parentDataRow = self.helpForm.lastSelected(primaryDataTable);
                if (!parentDataRow){
                    return self.showMessageOk(localResource.noPrimaryDataSelected)
                    .then(function (){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(null);

                    });
                }

                // N.B note su vecchie chiamate di MDL, ora spostate in altri punti, logici:
                // questo viene passato nella callPage ---> M.ExtraParameter = SourceTable.ExtendedProperties[FormController.extraParams];
                // edit_type parametro della callPage  ---> M.edit_type = edit_type;
                // Fatto all'atto del getDataSet lato server ---> M.SetDefaults(SourceTable);
                // Lato js faccio il setDefaults, eventualmente sarà metodo del derivato di MetaData.

                const meta = appMeta.getMeta(sourceTable.tableForReading());
                //meta.setDefaults(sourceTable); // andrebbe  usata con moderazione, perchè sovrascrive i valori impostati nella pagina

                return meta.getNewRow(parentDataRow.getRow(), sourceTable, self.editType)

                .then(function (rowToInsert){
                    //a questo punto sourceTable è corredata di autoincrement properties e via dicendo
                    // queste servono (tra le altre cose) a nascondere le colonne ad autoincremento per le righe in state "added"
                    // Quindi è importante che siano copiate anche nel dataset del form di detail
                    if (!rowToInsert){

                        return self.showMessageOk(localResource.getGridDataNoValid(tableName))
                        .then(function (){
                            self.hideWaitingIndicator(waitingHandler);
                            return def.resolve(null);

                        });
                    }

                    self.state.editedRow = rowToInsert;

                    const unaliased = sourceTable.tableForReading();

                    self.hideWaitingIndicator(waitingHandler);
                    return self.edit(unaliased, editType, true)

                    .then(function (dialogResult){

                        return utils._if(dialogResult)
                        ._then(function (){
                            //27/5/2021 c'era una nuova variabile ma inutilizzata
                            waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_page_update);
                            // recupero newSourceRow dallo stato. è un ObjectRow
                            rowToInsert = self.state.newSourceRow;

                            if (metaModel.isSubEntity(sourceTable, self.getDataTable(tableName))){
                                self.entityChanged = true;
                            }

                            self.helpForm.iterateFillRelatedControls($(grid.el).parent(), null, sourceTable, rowToInsert);
                            return true; // iterateFillRelatedControls sincrona, quindi torno true per andare su ramo then()

                        })
                        ._else(function (){
                            rowToInsert.del(); // viene da un getNewRow, quindi è un DataRow
                            // rowToInsert.acceptChanges(); // No database activity is needed
                            rowToInsert = null;

                            return true; // deve andare sul ramo then()
                        })
                        .then(function (){

                            if (!dialogResult){
                                self.hideWaitingIndicator(waitingHandler);
                                return true;
                            }

                            // It's necesssary to do something cause Grid must re-evaluated:
                            // - calculated fields
                            // - resize of columns
                            metaModel.getTemporaryValues(sourceTable);

                            return self.doPreFill(tableName, null)
                            .then(function (){
                                self.helpForm.iterateFillRelatedControls($(grid.el).parent(), null, sourceTable, rowToInsert);
                                return self.freshForm(true, true);
                            }).then(function (){
                                self.hideWaitingIndicator(waitingHandler);
                                return true;
                            });
                        }); // chiude il then() dell' _if
                    });
                });
            });

            return def.from(res).promise();

        },

        /**
         * @method deleteGridRow
         * @private
         * @description ASYNC
         * Statically callable function to implement a delete - grid event
         * @param {GridControl} grid Grid into which add the row
         * @returns {Deferred}
         */
        deleteGridRow:function (grid) {
            const def = Deferred('deleteGridRow');

            const row = grid.getCurrentRow().row;
            if (!row) {
                return this.showMessageOk(localResource.noPrimaryDataSelected)
                    .then(function () {
                        return def.resolve(false);
                    });
            }

            if (!this.inited) return def.resolve(false).promise();
            const self = this;

            // gets data from form
            const res = this.getFormData(true)
            .then(function (){

                const sourceDataSet = grid.DS;
                if (!sourceDataSet){
                    return self.showMessageOk(localResource.getGridControlTagWrong(grid.tag, self.title))
                    .then(function (){
                        return def.resolve(false);
                    });
                }

                const res = self.helpForm.getCurrentRow(grid.el);

                if (!res.row){
                    return self.showMessageOk(localResource.noPrimaryDataSelected)
                    .then(function (){
                        return def.resolve(false);
                    });
                }

                const currDR = res.row;
                const sourceTable = res.table;

                // mostra messaggio di conferma ok cancel
                return self.showMessageOkCancel(localResource.getDeleteObjInsert(sourceTable.name))
                .then(function (res){

                    if (!res) return def.resolve(false);
                    const waitingHandler = self.showWaitingIndicator(localResource.modalLoader_wait_page_update);

                    // prima faceva solo currDR.getRow().del(); invece ha senso fare la cascade delte, che mette delted le subentity strette
                    // e unlinka lenotsub entity
                    metaModel.applyCascadeDelete(currDR);

                    if (metaModel.isSubEntity(sourceTable, self.getPrimaryDataTable())) self.entityChanged = true;

                    self.helpForm.lastSelected(sourceTable, null);
                    self.helpForm.iterateSetDataRowRelated(self.rootElement, sourceTable, null);
                    metaModel.getTemporaryValues(sourceTable);
                    return self.freshForm(true, false)
                    .then(function (){
                        self.hideWaitingIndicator(waitingHandler);
                        return def.resolve(currDR);
                    });
                });
            });

            return def.from(res).promise();

        },

        /**
         * @method rowDblClick
         * @public
         * @description ASYNC
         * Invoked by row DblClick of a grid control. Does the edit of the grid row
         * @param {GridControl} sender
         * @param {DataTable} dataTable
         * @param {ObjectRow} row
         * @returns {Deferred}
         */
        rowDblClick: function (sender, dataTable, row) {
            return this.editClick(this, sender);
        },

        /* END GRID EVENTS MANAGEMENT */


        /* START DEPENDENCIES REGION */

        /**
         * @method addDependencies
         * @public
         * @description SYNC
         * Adds the dependencies between element parent and child. A child element value is calculated with a formula, that depends from parent value.
         * @param {element} elParent usually a textBox
         * @param {element} elChild usually a textBox
         * @param {event} event
         */
        addDependencies:function (elParent, elChild, event) {

			if (!event) {
				event = 'blur';
			}

            if (!$(elParent).length){
                console.log("MetaPage.addDependencies: add parent on dependency");
                return;
            }

            if (!$(elChild).length){
                console.log("MetaPage.addDependencies: add child on dependency");
                return;
            }

            const eleId = $(elParent).attr('id');
            if (!eleId){
                console.log("Set the id on html tag " + $(elParent).data("tag") + " to insert dependencies on this control");
                return;
            }

            // popolo la dict di array con gli elementi figli
            if (!this.dependencies[eleId]){
                // inizializzo l'array dove inserisco gli elementi html figli
                this.dependencies[eleId] = [];
                // la prima volta metto l'evento
				$(elParent).on(event, _.partial(this.reCalcFormulaEvent, this ));
            }

            // aggiungo l'elemento figlio al padre
            this.dependencies[eleId].push(elChild);
        },

        /**
         * @method reCalcFormulaEvent
         * @private
         * @description ASYNC
         * Loops on this element Depencendies and invokes the function of child Element attached
         * "this" is the html element that fires the event
         * @param {MetaPage} that
         * @returns {Deferred}
         */
        reCalcFormulaEvent:function (that) {

            const eleId = $(this).attr('id');
            if (!eleId) return Deferred("reCalcFormulaEvent").resolve();
            const allDeferredFill = [];
            that.helpForm.getControls();

            _.forEach(that.dependencies[eleId],
                function(child){
                    // recupero la function attachcata con registerFormula()
                    const fn = $(child).data("mdlFn");
                    if(fn) {
                        // rieseguo la get, per rinfrescare il ds ,prima di calcolare la formula

                        // recupero la riga principale
                        const r = that.helpForm.lastSelected(that.getPrimaryDataTable());
                        // invoco funzione della formula con la riga principale per il calcolo del nuovo valore
                        const newVal = fn(r);
                        // recupero oggetto dom, richiesto come parametro da fillControl e getcontrol.
                        // Non trovato modo migliore con jquery
                        const domEl = $(child).get(0);
                        // imposto nuovo valore sul figlio. Salvo array di deferred
                        allDeferredFill.push(
                            that.helpForm.fillControl(domEl, newVal)
                                .then(function () {
                                    that.helpForm.getControl(domEl);
                                    // Vado in cascata su eventuali elementi figli per invocare la funzione a sua volta attachata sui figli
                                    return that.reCalcFormulaEvent.call(child, that);
                                }));
                    }
                });

            // terminati i fillcontrol dei figli del primo parent vado in cascade
            const resultWhen = $.when.apply($, allDeferredFill);


            return Deferred("reCalcFormulaEvent").from(resultWhen);
        },

        /**
         * @method registerFormula
         * @public
         * @description ASYNC
         * Assigns the formula function to the "elChild" html Element
         * @param {element} elChild usually a textBox
         * @param {function} fn the function with the formula attached to the textBox
         */
        registerFormula:function (elChild, fn) {
            $(elChild).data("mdlFn", fn);
        },

        /* END DEPENDENCIES REGION */

        /**
         * @method registerFilter
         * @public
         * @description SYNC
         * Assigns the jsDataQuery filter to the "elChild" html Element. Used for example for Autochoose element:
         * Es: metapage.registerFilter($("#autochoose1"), filter); where metapage is an instance of MetaPage and filter is a jsDataQuery
         * @param {element} elChild usually a textBox
         * @param {jsDataQuery} filter the function with the formula attached to the textBox
         */
        registerFilter:function (elChild, filter) {
            if (filter){
                $(elChild).data("filter", filter);
                return filter;
            }
            return $(elChild).data("filter");

        },

        /**
         * @method propagateChangesToMaster
         * @private
         * @description ASYNC
         * Propagates changes from detail Form to master
         * Takes values for the Source Row from linked Form Data. The goal is to propagate to the parent form the changes made (in LinkedForm) in this form.
         * Necessary condition is that FormDataSet does contain only one row of the same
         * table as SourceRow. This function can be redefined to implement additional operations
         * to do in SourceRow.Table when changes to SourceRow are accepted.
         * @returns {Promise<boolean>} true when operation succeded
         */
        propagateChangesToMaster:function() {
            const def = Deferred('propagateChangesToMaster');
            const self = this;
            if (!this.detailPage) return def.resolve(true).promise();

            // recupero riga di partenza, sarebbe quella del form principale, su cui poi dovrò propagare i valori di questo form
            const sourceRow = this.state.sourceRow(); // collegato errore 5176
            this.state.callerState.newSourceRow = sourceRow; // temporary value

            if (this.isList) return false; //it should never happen (a form-list can't be a subentity!)
            const unaliased = sourceRow.table.tableForReading();
            const t = this.getDataTable(unaliased);
            if (!t) return true;
            if (t.rows.length !== 1) {
                return self.showMessageOk(localResource.getMoreThenRow(t.name))
                    .then(function() {
                        return def.resolve(false);
                    });
            }

            // Riga DI QUESTO FORM (OSSIA IL DETTAGLIO), prenderò i valori di qeusta riga e li copierò sulla riga del dt di partenza, tramite la xcopy
            const externalRow = t.rows[0];
            const externalRowDataRow = externalRow.getRow();

            const dsSource = sourceRow.table.dataset;
            let changes = metaModel.xVerifyChangeChilds(dsSource, sourceRow.table, self.state.DS, externalRow);
            if (!changes) changes = metaModel.xVerifyChangeChilds(self.state.DS, t, dsSource, sourceRow.current);
            if (!changes) {
                metaModel.calculateRow(sourceRow.current);
                if (metaModel.checkForFalseUpdates(sourceRow)) sourceRow.acceptChanges();
                return def.resolve(true);
            }

            // Here should be done a backup of SourceRow before changing it, in order to
            // undo modification when needed.
            try {

                if (sourceRow.state === dataRowState.added) {
                    if (!metaModel.cmpSelectors(t, sourceRow, externalRowDataRow)) {
                        metaModel.calcTemporaryID(sourceRow.table, externalRowDataRow);
                    }

                    const filter = getData.getWhereKeyClause(externalRowDataRow, externalRowDataRow.table, externalRowDataRow.table, false); //  QueryCreator.WHERE_KEY_CLAUSE(externalRow, DataRowVersion.Default, false);

                    const existentFound = sourceRow.table.select(filter);
                    if (existentFound.length > 0) {
                        if (existentFound[0].getRow() !== sourceRow) {
                            return self.showMessageOk(localResource.sameValuesForTheKey)
                                .then(function() {
                                    return def.resolve(false);
                                });
                        }
                    }
                }

                this.state.callerState.newSourceRow = metaModel.xCopy(self.state.DS, dsSource, externalRowDataRow, sourceRow);

            } catch (e) {
                logger.log(logType.ERROR, "GetSourceChanges: Error on data", e.message);
                return def.resolve(false);
            }

            this.entityChanged = true;
            return def.resolve(true);
        },

        /**
         * @method show
         * @internal
         * @description ASYNC
         * @returns {Deferred}
         */
        show:function () {
            const def = Deferred("metapage-show");
            const res = appMeta.globalEventManager.trigger(appMeta.EventEnum.showPage, this, 'show');
            return def.from(res).promise();
        },

        /**
         * @method getDataTable
         * @public
         * @description SYNC
         * Given the name returns the DataTable on the dataSet
         * @param {string} tname
         * @returns {DataTable | undefined}
         */
        getDataTable:function (tname) {
            return this.state.DS.tables[tname];
        },

        /**
         * @method setDataTagAttr
         * @public
         * @description SYNC
         * set data-tag value for el element. N.B .data() only set value on memory, data() does not affect attributes in the DOM
         * If you use data() the selector doesn't work if we need to scan dom by data-tag
         * @param {element} el
         * @param {String} value. Should be accept also object but this method is used only for data-tag changed on DOM.
         */
        setDataTagAttr:function (el, value) {
            $(el).attr('data-tag', value);
        },


        /**
         * @method createAndGetListManager
         * @public
         * @description SYNC
         * Creates a new instance of listManager. To override in extended MetaPage if you want to use another listManager
         * For example to use ListManagerCalendar
         * @param searchTableName
         * @param listingType
         * @param prefilter
         * @param isModal
         * @param rootElement
         * @param metaPage
         * @param filterLocked
         * @param toMerge
         * @param {boolean} isCommandSearch, useful for overriden class that want to know if the listManager is called for a search
         * @param {string} sort
         * @returns {*|ListManager}
         */
        createAndGetListManager:function (searchTableName, listingType, prefilter, isModal, rootElement, metaPage, filterLocked, toMerge, isCommandSearch, sort) {
            const lm = new window.appMeta.ListManager(searchTableName, listingType, prefilter, isModal, rootElement, metaPage, filterLocked, toMerge, sort);
            lm.init();
            return lm;
        }

    };

    /**
     * @constructor AutoInfo
     * @description
     * @param {element} G usually DIV or SPAN
     * @param {string} type
     * @param {jsDataQuery} startfilter
     * @param {string} startfield
     * @param {string} table
     * @param {string} kind

     */
    function AutoInfo( G,
                       type,
                       startfilter,
                       startfield,
                       table,
                       kind) {
        this.G = G;
        this.type = type;
        this.startfield = startfield;
        this.startFilter = startfilter;
        this.table = table;
        this.kind = kind;
    }

    appMeta.MetaPage = MetaPage;
    appMeta.AutoInfo = AutoInfo;

}());
