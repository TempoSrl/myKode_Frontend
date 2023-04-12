/*global _,$,appMeta */
/**
 * @module ModalLoaderControl
 * @description
 * Manages the graphics for a waiting modal control
 */
(function () {
    
    "use strict";
    /**
     * @constructor ModalLoaderControl
     * @description
     * Initializes a html waiting modal control
     * @param {element} rootElement
     */
    function ModalLoaderControl(rootElement) {
        // gestisco le modali come unica risorsa condivisa. quindi metto in una lista, poi
        // nell'hideWaitingIndicator() toglierò dalla lista, faccio la hide fisica solo se non ci sono più messaggi
        this.waitIndicatorList = [];
        this.rootElement = rootElement || document.body;

    }

    ModalLoaderControl.prototype = {
        
        constructor: ModalLoaderControl,

        clear: function () {
            this.waitIndicatorList = [];
        },
        /**
         *
         */
       addProgressBar:function() {
            let p = '<div class="waitProgress" id="waitProgressId"> <div class="waitBar" id="waitBarId"></div> </div>';
           $(appMeta.currApp.rootToolbar).after($(p));
        },

        /**
         *
         * @returns {string}
         */
        getHtmlModal:function() {
          return '<div class="modal" id="modalLoader_control_id" data-backdrop="static" data-keyboard="false">' +
                    '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                            '<div class="modal-header">' +
                            '   <h4 class="modal-title"></h4>' +
                            '</div>' +
                            '<div class="modal-body">' +
                                '<h4 style="text-align:center; margin-top: 25px;" class="modalLoader_control_text"></h4>' +
                                '<div class="spinner-cont">' +
                                    '<span class="fa fa-spinner fa-spin fa-3x"></span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        },


        /**
         * @method showControl
         * @private
         * @description SYNC
         * Sets the message and shows the modal control
         * @param {string} msg
         * @param {boolean} isBar
         * @return Promise
         */
        showControl:function (msg, isBar) {
            if (!this.initiated){
                this.initiated = true;
                this.rootElement = this.rootElement || document.body;
                $(this.rootElement).append(this.getHtmlModal());
                //console.log("html appended");
                this.$el = $("#modalLoader_control_id");

                this.addProgressBar();
                return appMeta.Deferred().resolve(true);
            }

            if (isBar){
                return this.pbarMove();
            }
            this.setMessage(msg);
            if (this.$el === undefined) return;
            if (this.$el.hasClass('in')) return;
            this.$el.modal("show");
            return appMeta.Deferred().resolve(true);
            //console.log("html showed");
        },



        /**
         * @method pbarMove
         * @description Show and move the progress bar
         * @return Promise
         */
        pbarMove:function() {
            $("#waitProgressId").css("visibility", "visible");
            let bar =  $("#waitBarId");
            let width = 5;
            let id = setInterval(frame, 10);
            function frame() {
                if (width >= 95) return clearInterval(id);
                width++;
                bar.width(width + "%");
            }
            return appMeta.Deferred().resolve(true);
        },

        /**
         * @method hideControl
         * @private
         * @description SYNC
         * Hides the loader
         * @return Promise
         */
        hideControl: function () {
            let result = appMeta.Deferred().resolve(true);
            if (this.$el) {
                //console.log("hiding " + JSON.stringify(this.$el));
                if (this.$el.is(":visible")) {
                    //console.log("ModalLoaderControl.hideControl seems visible -", $(".modal:visible").length);
                    result = appMeta.Deferred()
                    //console.log("hiding with id " + JSON.stringify(this.$el));
                    $("#modalLoader_control_id").one("hidden.bs.modal", function () {
                        //console.log("ModalLoaderControl.hideControl hiding done -", $(".modal:visible").length);
                        result.resolve(true);
                    })
                }
                else {
                    //console.log("ModalLoaderControl.hideControl $el was not visible - ", $(".modal:visible").length);
                }
                //this.$el.modal("hide");
                $(this.$el).modal("hide");
                //this.$el = undefined;
            }
            else {
                //console.log("ModalLoaderControl.hideControl  not hiding - ", $(".modal").length);
            }
            $("#waitProgressId").css("visibility", "hidden");
            //console.log("hide succeeded");
            return result;
        },

        /**
         * @method setText
         * @private
         * @description SYNC
         * Set the text message on the control
         * @param {string} msg          
         */
        setMessage: function (msg) {
            if (this.$el) this.$el.find(".modalLoader_control_text").text(msg);
        },

        /**
         * @method isAttachedToRoot
         * @public
         * @description SYNC
         * Checks if the modal is still linked to the html
         * @returns {boolean} true if modal exist on the html
         */
        isAttachedToRoot:function () {
            return !!this.$el.length;
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
        show:function (msg, isBar) {
            let handlerMax = this.waitIndicatorList.length ?  _.maxBy(this.waitIndicatorList, 'handler').handler : 0;
            let handler = handlerMax + 1;
            this.waitIndicatorList.push({ handler:handler, msg:msg });

            // mostro il controllo con il messaggio attuale
            this.showControl(msg, isBar);

            return handler;
        },

        /**
         * @method hideWaitingIndicator
         * @private
         * @description SYNC
         * Hides a modal loader indicator. (Shown with funct. showWaitingIndicator).
         * If handler is undefiend or null or 0 it forces the hide
         * @param {number} handler. the handler of the modal to hide. in handler is undefined it force hide
         * @return Promise
         */
        hide:function (handler) {
            // tolgo elemento dalla lista{

            if (handler){
                _.remove( this.waitIndicatorList, function(w) {
                    return w.handler === handler;
                });
            } else {
                this.waitIndicatorList = [];
            }

            // mostro l'ultimo messaggio se esiste
            var waitIndicatorListLength = this.waitIndicatorList.length;
            if (waitIndicatorListLength){
                let wo = this.waitIndicatorList[waitIndicatorListLength - 1];
                // mostro il controllo con l'ultimo messaggio calcolato
                //console.log("ModalLoaderControl.hide calls showed control");
                return this.showControl(wo.msg);
            }

            // nascondo fisicamente la modale solo se esiste, e la lista dei messaggi è vuota
            if (!this.waitIndicatorList.length) {
                //console.log("ModalLoaderControl.hide calls hideControl");
                return this.hideControl();
            }

            return Deferred().resolve(true);
        }
    };

    appMeta.modalLoaderControl = new ModalLoaderControl();

}());
