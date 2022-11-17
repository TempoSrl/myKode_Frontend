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
     * @param {node} el
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
         * @param {element} ctrl
         * @returns {Deferred}
         */
        focusContainer: function(ctrl) {
            let res= appMeta.Deferred("focusContainer");
            if (ctrl === null) {
                return res.resolve();
            }
            // recupera il tab prossimo al controllo, quindi dove è ospitato il controllo
            let currTab = $(ctrl).closest(".tab-pane");
            if (currTab) {
                // recupera l'id e utilizza la "show" di bootstrap
                let currId = $(currTab).prop('id');
                let selector = '.nav-link[href="#' + currId + '"]';
                let selTab = document.querySelector(selector);
                if (selTab) {
                    selTab.addEventListener('shown.bs.tab', function (event) {
                        res.resolve(true);
                    });
                    $(selector).tab('show');
                }
                else {
                    res.resolve(true);
                }
            }
            return res.promise();
        }
    };


    window.appMeta.CustomContainer("bootstrapTab", BootstrapContainerTab);
}());