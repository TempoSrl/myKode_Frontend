/**
 * @module BootstrapContainerTab
 * @description
 * Implements the methods to manage a Bootstrap container.
 */
(function() {

    /**
     * @constructor BootstrapContainerTab
     * @description
     * Initializes a bootstrap tab container
     * @param {Html node} el
     * @param {HelpForm} helpForm
     */
    function BootstrapContainerTab(el, helpForm) {
        this.el = el;
        this.helpForm = helpForm;
        return this;
    }

    BootstrapContainerTab.prototype = {
        constructor: BootstrapContainerTab,

        /**
         * @method focusContainer
         * @public
         * @description SYNC
         * Selects the tab in the bootstrap tab container, where the control ctrl is hosted
         * @param {Html element} ctrl
         * @returns {null}
         */
        focusContainer: function(ctrl) {
            if (ctrl === null) return null;
            // recupera il tab prossimo al controllo, quindi dove è ospitato il controllo
            var currTab = $(ctrl).closest(".tab-pane");
            if (currTab) {
                // recupoera l'id è utilizza la "show" di bootstrap
                var currId = $(currTab).prop('id');
                $('.nav-tabs a[href="' + currId + '"]').tab('show');
               // $('#'+currId).tab('show');
            }
            return null;
        }

    };

    window.appMeta.CustomContainer("bootstrapTab", BootstrapContainerTab);
}());