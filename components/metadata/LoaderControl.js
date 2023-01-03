/**
 * @module LoaderControl
 * @description
 * Manages the graphics for a loading control
 */
(function() {

    /**
     * @constructor LoaderControl
     * @description
     * Initializes an html Loader control
     * @param {Html node} rootElement
     * @param {string} msg
     */
    function LoaderControl(rootElement, msg) {
        this.rootElement = rootElement || document.body;
        this.msg = msg;
        this.templateFileHtmlPath  = appMeta.config.path_loaderTemplate;
    }

    LoaderControl.prototype = {
        constructor: LoaderControl,

        /**
         * @method showControl
         * @public
         * @description SYNC
         * Loads the html template of the LoaderControl and appends it to the "rootElement"
         */
        showControl:function () {
            var htmlCodeTemplate = appMeta.getData.cachedSyncGetHtml(appMeta.basePath + this.templateFileHtmlPath);
            // non rimpiazzo, aggiungo
            if (!$('#loader_control_id').length) $(this.rootElement).append(htmlCodeTemplate);
            // nascondo tutto e  mostro loader
            $(this.rootElement).children().hide();
            this.setText(this.msg);
            $("#loader_control_id").show();
        },

        /**
         * @method hideControl
         * @public
         * @description SYNC
         * Hides the loader, and reshow the control on rootelement
         */
        hideControl:function () {
            // rimostro tutto e nascondo il loader
            $(this.rootElement).children().show();
            $('#loader_control_id').hide();
        },

        /**
         * @method setText
         * @private
         * @description SYNC
         * Set the text message on the control
         * @param {string} msg
         */
        setText:function(msg){
            $(".loader_control_text").text(msg);
        }
    };

    appMeta.LoaderControl = LoaderControl;

}());
