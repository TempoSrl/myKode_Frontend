/**
 * @module FormProcedureMessage
 * @description
 * Manages the form that shows the db procedure messages
 */
(function() {
    var locale = appMeta.localResource;
    var Deferred = appMeta.Deferred;
    var logType = appMeta.logTypeEnum;
    var logger = appMeta.logger;

    /**
     * @constructor FormProcedureMessage
     * @description
     * Initializes the form for the db procedure messages
     * @param {node} rootElement
     * @param {DbProcedureMessage []} messages. They are the messages returned form the server, after the post command.
     * @param {MetaPage} metaPage
     * @param {boolean} canIgnore. Indicates that all messages can be ignored
     */
    function FormProcedureMessage(rootElement, messages, canIgnore, metaPage) {
       
        this.metaPage = metaPage;
        this.rootElement = rootElement || document.body;
        this.messages = messages;
        this.templateFileHtmlPath  =  appMeta.config.path_procedureMessagesTemplate;
        this.columnNames = ["id", "description"];
        this.columnCaptions = [locale.prodMess_id, locale.prodMess_lonMsg];

        // dichiara il deferred di cui verrà fatta la promise alla fine del fillcontrol, cioè quando sarà
        // mostrato il form, e si rimane in attesa dell'operazione dell'utente.
        // infatti il def verrà risolto alla pressione dei pulsanti salva o ignora
        this.def = Deferred('FormProcedureMessage.loadTemplate');

        this.canignore = canIgnore;
    }

    FormProcedureMessage.prototype = {
        constructor: FormProcedureMessage,

        /**
         * @method fillControl
         * @private
         * @description ASYNC
         * Loads the html template of the FormProcedureMessage
         * @returns {Deferred}
         */
        fillControl:function () {
            // carico il template della Form
            var htmlFileName =  appMeta.basePath +this.templateFileHtmlPath;
            var self = this;
            $.get(htmlFileName)
                .done(
                    function (data) {
                        // aggancio al mio rootElement
                        $(self.rootElement).append(data);
                        // ora posso eseguire la fill del controllo.
                        self.innerFillControl();
                        // mostro la modale
                        $("#procedureMessage_id").modal('show');
                        self.adjustSizeModal();
                        // evento per il momento solo per test
                        if (self.metaPage.eventManager) self.metaPage.eventManager.trigger(appMeta.EventEnum.showModalWindow, self);
                    })
                .fail(
                    function (e) {
                        logger.log(logType.ERROR, "FormProcedureMessage.loadTemplate", JSON.stringify(e));
                    });

            return this.def.promise();
        },

        /**
         * @method adjustSizeModal
         * @private
         * @description SYNC.
         * Adjusts the size and the position of the modal based on its content (based on the grid)
         */
        adjustSizeModal:function () {
            var screenW  = $(window).width();
            // recupero content che dovrò manipolare
            var ctrlModalContent  = $('#procedureMessage_id').find('.modal-content')[0];
            // attuale width del rect bianco della mdoale
            var currwcont = parseInt($(ctrlModalContent).css("width").replace("px",""));
            // new width come griglia contenuta. tolgo 10 così appare la scrollabr
            var newcontint = parseInt(this.mytable.css("width").replace("px","")) - 10;
            // la new width non può uscire dallo schermo
            if (newcontint > screenW) newcontint = screenW - 50;
            // left attuale metà schermo meno metà della content bianca, posizionata al centro
            var actualeft = (screenW - currwcont)/ 2;
            // calcolo qaunto devo spostare a sx il content bianco
            var widthAdded = newcontint - currwcont;

            // fisso altezza in base allo schermo
            var h = ($(window).height() * 0.6).toString() + "px";
            $(ctrlModalContent).css("height", h);

            if (widthAdded <= 0) return;
            var newleftint = (widthAdded / 2);
            // se vado troppo a sx rimetto 50 px avanti
            if (newleftint > actualeft) newleftint = actualeft - 50;
            var newleft = (-newleftint).toString() + "px";
            var newcontw = (newcontint).toString() + "px"; // -10 così appare la scroll orizz

            // asegno nuove prop css calcolate
            $(ctrlModalContent).css("width", newcontw);
            $(ctrlModalContent).css("left", newleft);
        },


        /**
         * @method innerFillControl
         * @private
         * @description ASYNC
         * Executes the fill of the custom control. Sets events, labels and initializes the messages grid
         * @method  fillControl
         * @returns {Deferred}
         */
        innerFillControl: function() {
            this.initControls();
            this.initTable();
        },

        /**
         * @method initControls
         * @private
         * @description SYNC
         * Initializes the controls. Attaches labels and events to the buttons
         */
        initControls:function () {
            $("#procedureMessage_id .modal-title").text(locale.procedureMessage_modal_title);

            // dopo che ho aggiunto le righe valuto al visibilità del bottone
            if (this.canignore){
                $(".procedureMessage_btn_ignoreandsave").show();
                $(".procedureMessageWarningIcon").show();
                $(".procedureMessage_btn_ignoreandsave").text(locale.procedureMessage_btn_ignoreandsave).on("click", _.partial(this.ignoreAndSave, this));
            }
            else{
                $(".procedureMessageErrorIcon").show();
            }

            $(".procedureMessage_btn_nosave").text(locale.procedureMessage_btn_nosave).on("click", _.partial(this.noSave, this));

        },

        /**
         * @method initTable
         * @private
         * @description SYNC
         * Builds the html grid of the procedure messages. It adds the header and the rows
         */
        initTable:function () {
            this.mytable = $('<table class="table table-bordered"  border="1">');
            // ho il datatable
            this.addHeaders();
            this.addRows();
            // aggiungo al div del template
            $(".procedureMessage_grid").append(this.mytable);
        },

        /**
         * @method addRows
         * @private
         * @description SYNC
         * Adds the rows to the grid of the procedure message. Each row represents a procedure message
         */
        addRows:function () {
            var self = this;

            _.forEach(this.messages, function (m, index) {
                var $tr = $("<tr>");

                // la prima colonna è quella con l'icona. a seconda se è un warning o meno decido
                var $td = $("<td nowrap style='width: 50px'>");
                var $colorIcon = "darkred";
                if (m.canignore) $colorIcon = "darkorange";
                var $icon = $('<i class="procedureMessageWarningIcon fas fa-exclamation-triangle fa-3x" style="color:' + $colorIcon + '; padding: 5px"></i>');
                $tr.append($td.append($icon));

                // inserisco valori, leggendo l'array di colonne, che corrispondono ai campi (visibili) dell'oggetto DbProcedureMessage
                _.forEach(self.columnNames, function (cName) {
                    var $td = $("<td nowrap>");
                    $tr.append($td.html(m[cName]));
                });

                //if ((index % 2) === 1) {
                //    $tr.addClass(appMeta.cssDefault.odd);
                //}

                self.mytable.append($tr);
            });

        },

        /**
         * @method addHeaders
         * @private
         * @description SYNC
         * Adds the html header grid
         */
        addHeaders:function () {
            var self = this;
            var $tr = $("<tr>");

            $tr.append( $("<th>").html(locale.prodMess_type));

            _.forEach(self.columnCaptions,
                function(cName) {
                    $tr.append( $("<th>").html(cName));
                });

            this.mytable.append($($tr));
        },

        /**
         * @method noSave
         * @private
         * @description SYNC
         * Returns the deferred "def" with false, meaning caller has to do nothing. Changes are not sent to the server
         * @param {FormProcedureMessage} that
         * @returns {Deferred(false)}
         */
        noSave:function (that) {
            that.closeWindowModal();
            that.def.resolve(false);
        },

        /**
         * @method ignoreAndSave
         * @private
         * @description SYNC
         * Returns the deferred "def" with true, meaning caller has to redo the post to server
         * @param {FormProcedureMessage} that
         * @returns {Deferred<true>)}
         */
        ignoreAndSave:function (that) {
            that.closeWindowModal();
            that.def.resolve(true);
        },

        /**
         * @method closeWindowModal
         * @private
         * @description SYNC
         * Closes the window modal
         */
        closeWindowModal:function () {
            $('#procedureMessage_id').modal('hide');
            $("#procedureMessage_id").remove();
        }
    };

    appMeta.FormProcedureMessage = FormProcedureMessage;

}());