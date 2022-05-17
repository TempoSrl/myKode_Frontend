(function() {

    var ListManager = window.appMeta.ListManager;
    var locale = appMeta.localResource;
    function ListManagerMultiSelect(tableName, listType, filter, isModal, rootElement, metaPage, filterLocked, toMerge, sort) {
        ListManager.apply(this, [tableName, listType, filter, true, rootElement, metaPage, filterLocked, toMerge, sort]);
    }

    ListManagerMultiSelect.prototype = _.extend(
        new ListManager(),
        {
            constructor: ListManagerMultiSelect,
            superClass: ListManager.prototype,

            /**
             *
             */
            init:function() {
                this.superClass.init.call(this);
            },

            getModalHtml:function () {
                var modalHtml = "<div class='modal'  id=" + this.myModalUnivoqueId.substr(1) + " tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false'" +
                    " style='display:none;'>" +
                    "<div class='modal-dialog modal-lg'>" +
                    "<div class='modal-content'  >" +
                    "<div class='modal-header'>"+
                    "<button class='btn btn-primary modal-select-btn mr-2' type='button'> " + locale.confirmSelection + " </button>" +
                    "<h4 class='modal-title'> " + this.title + "</h4>" +
                    "<button type='button' class='close modal-white-close'>" +
                    "<span aria-hidden='true'>&times;</span></button>" +
                    "</div>" +
                    "<div class='modal-body' style='overflow-x: auto;'></div>" +
                    "<h6 class='ml-5 modal-label-count'></h6>" +
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
                $(this.currentRootElement).append(currModal);
                // evento di close sul tastino x
                $(this.myModalUnivoqueId  + ' .modal-white-close').on("click", _.partial(this.closeMulti, this));
                $(this.myModalUnivoqueId  + ' .modal-select-btn').on("click", _.partial(this.selectRows, this));
                $(this.myModalUnivoqueId  + ' .modal-footer').append($(this.myfooter));
                $(this.myModalUnivoqueId).modal('show');
                if (this.metaPage.eventManager) return this.metaPage.eventManager.trigger(appMeta.EventEnum.showModalWindow, this, "buildModal");

                return true;

            },

            closeMulti:function(that) {
                that.closeListManager();
            },

            selectRows:function(that){
                that.hideControl(that);
                // trasformo una dict in array di righe
                var arraySelectedRows = _.map(Object.keys(that.gridControl.rowSelectedDict), function (key) {
                    return that.gridControl.rowSelectedDict[key];
                });
                that.defModal.resolve(arraySelectedRows);
            },

            /**
             * @method rowDblClick
             * @private
             * @description SYNC
             * Handker for the dbClick event on the grid of listManager
             * @param {GridControl} sender
             * @param {DataTable} dataTable
             * @param {ObjectRow} row
             */
            rowDblClick: function (sender, dataTable, row){
                // al doppio click non fa null
            },

            /**
             * Create an instance of gridControl
             * @param {DataTable} dt
             */
            getGridInstance:function (dt) {
                if (!this.gridControl) {
                    var GridController = appMeta.CustomControl("gridxmultiselect");
                    this.gridControl = new GridController(this.myRootListManger, this.metaPage.helpForm, dt, null, this.listType);
                    // assegno id della label dove inserire il counter delle righe selezionate
                    this.gridControl.countElement =  this.myModalUnivoqueId  + ' .modal-label-count';
                    this.gridControl.init();
                }
            }

        });

    appMeta.ListManagerMultiSelect = ListManagerMultiSelect;
}());

