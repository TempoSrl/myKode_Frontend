/**
 * @module BootstrapModal
 * @description
 * Implements the methods to open and manage a bootstrap modal form
 */
(function () {

    var Deferred = appMeta.Deferred;
    var utils = appMeta.utils;
    var localResource = appMeta.localResource;
    /**
     * @constructor BootstrapContainerTab
     * @description
     * Initializes the control with the "title", "body" and with the info on "buttons"
     * @class BootstrapModal
     * @param {String} title
     * @param {String} body. the body of the message.
     * @param {String[]} buttons. array with the caption of the buttons
     * @param {String} closeCommand
     * @param {String} details. Optional. string with a long description of the message (usually in the erro)
     */
    function BootstrapModal(title, body, buttons, closeCommand, details) {
        this.closeCommand = closeCommand;
        this.title = title;
        this.body = body;
        this.buttons = buttons || [appMeta.localResource.dictionary.close];
        this.currModal = null;
        this.parent = null;
        this.details = details;
        return this;
    }

    BootstrapModal.prototype = {
        constructor: BootstrapModal,

        /**
         * @method getModalHtml
         * @private
         * @description SYNC
         * Builds the html for a modal Bootstrap dialog
         * @returns {string} html string for a modal Bootstrap dialog
         */
        getModalHtml:function () {
            var modalHtml = "<div class='modal' id='myModal" + this.idunivoque +  "' tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false' style='display:none;'><div class='modal-dialog'>" +
                "<div class='modal-content'>" +
                "<div class='modal-header'>" +
                "<h4 class='modal-title'></h4>";
            if (this.closeCommand){
                modalHtml +=  "<button type='button' class='close modal-white-close'>" +
                    "<span aria-hidden='true'>&times;</span></button>";
            }
            
            modalHtml += "</div><div class='modal-body'><p></p></div>" +
                "<div class='modal-footer bg-default'></div>" +
                "</div>" +
                "</div>" +
                "</div>";


            return modalHtml;
        },

        /**
         * @method hide
         * @private
         * @description SYNC
         * Empties the dialog box
         */
        hide:function () {
            if (this.currModal) {             
                this.currModal.modal("hide");
                this.currModal.remove();
                this.currModal = null;
            }
        },

        /**
         * @method close
         * @public
         * @description SYNC
         * Hides the bootstrap modal and resolves the promise, opened in the show() event, with the related text
         */
        close: function () { //"this" is the button
            var that = $(this).data("mdlModalWin");
            var res = $(this).data("mdlModalResult");
            that.hide();
            that.def.resolve(res);
            if (that.evManager) that.evManager.trigger(appMeta.EventEnum.closeModalWindow, that);
        },

        /**
         * @method show
         * @public
         * @description ASYNC
         * Shows the bootstrap modal
         * @param {MetaPage} page
         * @param {element} parent. the html node where the modal will be added
         * @return {Promise} a promise, that will be resolved in the close() event
         */
        show: function (page, parent) {
            this.def = Deferred("BootstrapModal.show");
            this.evManager = page ? page.eventManager : null;
            this.parent = parent || document.body;
            this.hide();
            var self = this;
            this.idunivoque = utils.getUniqueId();
            this.currModal = $(this.getModalHtml());

            $(this.parent).append(this.currModal); //lo devo prima aggiungere , altrimenti la show non funziona. La show mette lo sfondo
            $("#myModal"+ this.idunivoque).modal("show");
            $("#myModal" + this.idunivoque + " .modal-title").html(this.title);
            $("#myModal" + this.idunivoque + " .modal-body").html(this.body);
            // dopo la append aggiungo i bottoni
            _.forEach(this.buttons, function (btnText) {
                $("#myModal" + self.idunivoque + " .modal-footer")
                    .append($("<button class='btn btn-secondary'>")
                        .text(btnText)
                        .data("mdlModalWin", self)
                        .data("mdlModalResult", btnText)
                        .on("click", self.close));
            });

            // metto pulsante apposito per vedere il dettaglio dell'errore
            if (this.details) {
                $("#myModal" + self.idunivoque + " .modal-footer")
                    .append($("<button class='btn btn-secondary'>")
                        .text(localResource.dictionary.details)
                        .data("mdlModalWin", self)
                        .on("click", self.toggleDetails));
            }
            
            if (this.closeCommand) {
                $("#myModal" + this.idunivoque + " .modal-header").find("button").data("mdlModalWin", this).data("mdlModalResult", this.closeCommand).on("click", self.close);
            }
            //if (!this.evManager) console.log("SHOW MODAL: there is no eventManager");
            if (this.evManager) this.evManager.trigger(appMeta.EventEnum.showModalWindow, this);
            return this.def.promise();
        },

        /**
         * @method toggleDetails
         * @private
         * @description SYNC
         * Shows a paragraph with the string of the detail of the message
         */
        toggleDetails:function () {
            var that = $(this).data("mdlModalWin");
            // aggiungo textArea se non è già aggiunta, altrimenti la nasocndo
            if (that.txtDetails){
                that.txtDetails.hide();
                that.txtDetails = null;
            } else {
                that.txtDetails = $("<p>").text(that.details);
                $("#myModal" + that.idunivoque + " .modal-body").append(that.txtDetails);
            }

        }
        
    };

    appMeta.BootstrapModal = BootstrapModal;

}());
