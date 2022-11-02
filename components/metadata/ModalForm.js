(function () {

    var Deferred = appMeta.Deferred;
    var utils = appMeta.utils;
    /**
     * Open a genric bootstrap modal.
     * @class ModalForm
     * @param {html element} parent
     * @param {html} body is the html to add to the body of the modal
     */
    function ModalForm(parent, body) {
        if (this.constructor !== ModalForm) {
            return new ModalForm(parent, body);
        }
        this.defModal = Deferred("ModalForm");
        this.body = body;
        this.currModal = null;
        this.parent = parent;
        this.resolvedObj = null;
        return this;
    }

    ModalForm.prototype = {
        
        constructor: ModalForm,

        /**
         * Builds the html for a modal dialog
         * @private
         * @returns {string}
         */
        getModalHtml:function () {
            var modalHtml = "<div class='modal' id='myModal" + this.idunivoque +  "' tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false' style='display:none;'><div class='modal-dialog modal-lg'>" +
            "<div class='modal-content'>" +
            "<div class='modal-header'>";
            modalHtml +=  "<button type='button' class='close modal-white-close'>" +
                "<span aria-hidden='true'>&times;</span></button>";
            modalHtml += "<h4 class='modal-title'></h4></div>" +
            "<div class='modal-body'><p></p></div>" +
            "<div class='modal-footer bg-default'></div>" +
            "</div>" +
            "</div>" +
            "</div>";

            return modalHtml;
        },

        /**
         * close and resolve the promise
         */
        close:function () {
            var that = $(this).data("mdlModalWin");
            that.hide();
            // that.defModal.resolve(that.resolvedObj);
            that.defModal.resolve(true);
        },

        /**
         * Empties the dialog
         * @method clear
         * @public
         */
        hide:function () {
            if (this.currModal){
                this.currModal.modal("hide");
                this.currModal.remove();
                this.currModal = null;
            }
        },

        /**
         * Append the body to the html and shows the bootstrap modal
         * @method show
         * @public
         * @param {MetaPage} page
         */
        show: function (page) {
            this.parent = this.parent || document.body;
            this.evManager = page ? page.eventManager : null;
            this.hide();
            this.idunivoque = utils.getUniqueId(); //Math.random().toString().replace(".","");
            this.currModal = $(this.getModalHtml());

            $(this.parent).append(this.currModal); // lo devo prima aggiungere , altrimenti la show non funziona. La show mette lo sfondo
            $("#myModal"+ this.idunivoque).modal("show");
            $("#myModal" + this.idunivoque + " .modal-body").html(this.body);
            // evento di close sul tastino x
            $('.modal-header').find("button").data("mdlModalWin", this).on("click", this.close);
            
            if ($("button[data-tag='mainselect']")){
                $("button[data-tag='mainselect']").data("mdlModalWin", this).on("click", this.close);
            }
            if (this.evManager) this.evManager.trigger(appMeta.EventEnum.showModalWindow, this);
            return this.defModal.promise();
        },

    };

    appMeta.ModalForm = ModalForm;

}());