/**
 * Custom Control for the upload of the attachment, complaint with windows client.
 * @module UploadControlWin
 * @description
 * Manages the graphics and the logic of a upload for the attachments
 */
(function() {

    var Deferred = appMeta.Deferred;
    var Attachment = appMeta.Attachment;
    var localResource = appMeta.localResource;
    var $q = window.jsDataQuery;
    
    /**
     *
     * @param {element} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table
     * @param {DataTable} primaryTable
     * @param {string} listType
     * @constructor
     */
    function UploadControlWin(el, helpForm, table, primaryTable, listType) {
        this.helpForm = helpForm;
        this.tag = $(el).data("tag");
        this.el = el;
        var tag = helpForm.getStandardTag(this.tag);
        // recupero tableName  e columnName dal tag del controllo
        this.tableName = helpForm.getField(tag, 0);

        // dal tag prendo la colonna della tabella su cui verrà inserito l'id dell'attachment calcolato lato server 
        this.columnName_AttachRifReal =  helpForm.getField(tag, 1);
        this.columnName_AttachRif =  "!" + helpForm.getField(tag, 1);
        /****
         Deve essere presente su DS di pagina una tabella attach, che ha idattach e filename, il controllo upload
         sarà referenziato ad una colonna della riga di questo form in cui c'è il valore "idattach". L'assunzione è che colonna inizi per "idattach"
         Tale valore sarà bindato con l'id calcolato dal server, che è già salvato quindi.
         Quindi il valore è importate chiarire che è bindato sulla riga principale del form dove è ospitato il controllo
         In questo modo avremo il collegamento tra l'allegato nella specifica tabella e la tabella attach, dove verranno gestiti anche i contatori,
         che serviranno per l'algoritmo di pulizia degli allegati, come ad esempio quelli che una volta caricati non verranno più confermati
        ****/

        // init tabella in cui inserire l'allegato il cui riferimento sarà sulla tab  del ds che vogliamo(corrisponde tab principale qui)

        // devo trovare la tabella attacch che potrebbe utilizzare un alias, quindi non posso andare per nome diretto
        // mai in base alla relazione

        // nome tabella che gestisce gli attachment  su ds notevole dsattach
        this.tableAttachNameOnDsAttach = "attach";
        // nome tabella "attach" relazionata all'id attach. nome può avere alias
        this.tableAttachName = this.getTableAttachName();

        // id della colonna principale da fillare con l'id dell attachemnt proveniente dal server
        this.idAttachColumnName = "idattach";
        this.fileNameColumnName = "filename";

        // stringa da mostrare nella label per il download
        this.lblDownload = (typeof $(el).data("mdllbldownloadfile") === "undefined") ? appMeta.localResource.download_attach : $(el).data("mdllbldownloadfile");
        this.lblUpload = (typeof $(el).data("mdllbluploadfile") === "undefined") ? appMeta.localResource.upload_attach : $(el).data("mdllbluploadfile");

        // è il nome del file che invio al server. se passo vuoto allora concatena il nome del file reale sul disco client
        this.lblFileName = (typeof $(el).data("mdlfilename") === "undefined") ? "" : $(el).data("mdlfilename");
        // se non lo passo prenderà quello del server
        this.lblDownloadFileName = (typeof $(el).data("mdldownloadfilename") === "undefined") ? "" : $(el).data("mdldownloadfilename");

        // instanzio classe che gestisce upload
        this.attachManger = new Attachment();

        // costrusice la grafica del controllo
        this.buildTemplateHtml();

    }

    UploadControlWin.prototype = {
        constructor: UploadControlWin,

        /**
         * table name of the table attach should be an alias. It finds the name of the table aliased, searching
         * the child relation with childCol = columnName_AttachRif
         * @returns {string}
         */
        getTableAttachName:function() {
            var tname = this.tableAttachNameOnDsAttach;
            var rel;
            var self = this;
            var tables = this.helpForm.DS.tables;
            _.forEach(tables, function (t) {
                var relsChild = t.childRelations();
                rel = _.find(relsChild, function (rel) {
                    return _.includes(rel.childCols, self.columnName_AttachRif );
                });
                // ho trovato, assegno nome reale della tabella ed esco dal ciclo
                if (rel) {
                    tname = rel.parentTable;
                    return false;
                }
            });

            return tname;
        },

        /**
         * @method buildTemplateHtml
         * @private
         * @description SYNC
         * Builds the upload control and appends to the parent
         */
        buildTemplateHtml:function () {
            var uniqueid = appMeta.utils.getUniqueId();
            this.idUploadFile = "upload_file" + uniqueid;
            this.idBtnUpload = "btn_upload_file" + uniqueid;
            this.idlbl_file_uploaded = "lbl_file_uploaded" + uniqueid;
            this.idlbl_file_download = "lbl_file_download" + uniqueid;
            this.idbtn_delete_file = "btn_delete_file" + uniqueid;

            var htmlCodeTemplate = '<input type="file" id="'+ this.idUploadFile + '" name="file" /> ' +
            // '<label id="lbl'+ this.idUploadFile + '" for="' + this.idUploadFile +'"><i class="fa fa-fw fa-search"></i> Click me to upload image</label>'+
            ' <a class="btn btn-primary" href="#" id="' + this.idBtnUpload + '">' + this.lblUpload + '</a>' +
            ' <a href="#" id="' + this.idlbl_file_download + '" hidden>' + this.lblDownload + '</a> &nbsp;' +
            ' <label id="' + this.idlbl_file_uploaded + '"></label>'+
            ' <a href="#" id="' + this.idbtn_delete_file + '" style="color: red" hidden> ' + localResource.removeAttach + '&nbsp;<i class="fa fa-trash"></i></a>';

            // appendo al controllo padre
            $(this.el).append(htmlCodeTemplate);
        },

        /**
         * @method upload
         * @public
         * @description ASYNC
         * Performs some checks and executes the upload and inserts the rif of the attachment get from the server on the main row (Main row must have an "idattach" column name)
         * @param {UploadControl} that
         */
        upload:function (that) {
            var def = Deferred("upload-upload");
            // recupero riga principale corrente sulla quale devo bindare "idattach"
            var mainRow = that.getMainRow(); //this.metaPage.state.currentRow;

            // messaggi di errore, di solito qualche configurazione sbagliata o azione utente non permessa
            if (!mainRow) return that.metaPage.showMessageOk(localResource.noPrimaryDataSelected);
            if (!mainRow.getRow) return that.metaPage.showMessageOk(localResource.noPrimaryDataSelected);
            // check nome tabella sia quella principale, altrimenti c'è un errore di configurazione ed utilizzo del controllo custom
            var mainTableName = mainRow.getRow().table.name;
            if (mainTableName !== that.tableName) return that.metaPage.showMessageOk(localResource.tableNotMatch);
            // check su colonna dove inserirò il riferimento    
            if (!mainRow.getRow().table.columns[that.columnName_AttachRif]) return that.metaPage.showMessageOk(localResource.tableAttachNotAvailable);

            // controllo html del file
            var inputCtrl = $("#" + that.idUploadFile);
            // recupero oggetto file dal controllo
            var file = inputCtrl.get(0).files[0];
            if (!file) return that.metaPage.showMessageOk(localResource.noAttachmentToUpload);
            // invoca la routine che effettua l'upload
            return def.from(that.uploadCore(file));
        },

        /**
         * @method uploadCore
         * @public
         * @description ASYNC
         * Shows the waiting modal, and does the upload if the File "file"
         * @param {File} file
         * @returns {Deferred}
         */
        uploadCore:function (file) {
            var def = Deferred("upload-uploadCore");
            var self = this;
            // mostro indicatore di attesa
            var waitingHandler = this.metaPage.showWaitingIndicator(localResource.waitAttachLoading);
            // nome del file che invio al server. se passo vuoto allora concatena il nome del file reale sul disco client
            var filename = self.lblFileName;
            // invoco funz async per il caricamento
            this.attachManger.upload(file, filename)
                .then(function (dsattach) {
                    // merge della tab attach
                    var tableAttach = self.helpForm.DS.tables[self.tableAttachName];
                    // recupero dt attach del dataset dal qaule prenderò tutte le informazioni persistenti che ho salvato circa l'allegato
                    var dtattach = dsattach.tables[self.tableAttachNameOnDsAttach];
                    var idattach = dtattach.rows[0][self.idAttachColumnName];
                    var mainRow = self.getMainRow(); //this.metaPage.state.currentRow;
                    // popolo tab attach, mergiando la riga tornata dal nuovo allegato
                    appMeta.getDataUtils.mergeRowsIntoTable(tableAttach, dtattach.rows, true);
                    // valorizzo il campo/i campi necessari per la logica di assegnazione dell'allegato alla riga principale del ds
                    // Qui son sicuro che la riga principale è ok, i controlli di conf esatta li ho fatti all'inizio del emtodo
                    mainRow[self.columnName_AttachRifReal] = idattach;
                    mainRow[self.columnName_AttachRif] = idattach;
                    // visualizzo label con il file name
                    self.setLblFileName(idattach, dtattach);
                    // nascondo indicatore di attesa
                    self.metaPage.hideWaitingIndicator(waitingHandler);
                    // Non mostro  messaggio di conferma. quindi lo commento per ora
                    // that.metaPage.showMessageOk(localResource.attachSent); 

                    // SE ARRIVO A QUESTO PUNTO AVRò LA TABELLA DEGLI ALLEGATI CON UNA NUOVA RIGA, E LA TABELLA PRINCIPALE CON IL RIF ALL'ALLEGATO
                    // QUINDI SE PREMO SALVA, OTTERRò LA NUOVA RIGA DELL'ALLEGATO PERSISTENTE.
                    self.disableCtrls(true);
                    def.resolve();
                })
                .fail(function (err) {
                    alert(JSON.stringify(err));
                    // nascondo indicatore di attesa
                    self.metaPage.hideWaitingIndicator(waitingHandler);
                    def.resolve()
                });

            return def.promise();
        },

        /**
         * @method download
         * @public
         * @description ASYNC
         * Downloads the attachment
         * @param {UploadControl} that
         */
        download:function (that) {
            // recupero riga principale corrente
            var mainRow = that.getMainRow();
            // recupera il filtro ceh individua la riga sulla colonna
            var filter = mainRow.getRow().table.keyFilter(mainRow);
            // mostro indicatore di attesa
            var waitingHandler = that.metaPage.showWaitingIndicator(localResource.downloadAttachWaiting);
            // chiamo metodo per il download
            that.attachManger.downloadwin(that.tableName, filter, that.columnName_AttachRifReal)
                .then(function () {
                    // nascondo indicatore di attesa
                    that.metaPage.hideWaitingIndicator(waitingHandler);
                })
                .fail(function (err) {
                    // nascondo indicatore di attesa
                    that.metaPage.hideWaitingIndicator(waitingHandler);
                    that.metaPage.showMessageOk(err)
                })
        },


        /**
         * @method removeAttachment
         * @public
         * @description ASYNC
         * Remove tge attachment for the main row of the form.
         * It should calls a wsthat set tu zero the counter on dt attach.But it only
         * @param {UploadControl} that
         */
        removeAttachment:function (that) {
            // recupero riga principale corrente
            var mainRow = that.getMainRow(); //this.metaPage.state.currentRow;
            // id dell'attach da recuperare
            var idAttach = mainRow[that.columnName_AttachRif];
            // annullo il riferimento sulla riga principale
            mainRow[that.columnName_AttachRif] = null;
            mainRow[that.columnName_AttachRifReal] = null;
            // posso eseguire eventualmente load di 1 altro allegato, poichè questo è rimosso
            that.disableCtrls(false);

            // PER ORA LO GESTISCO SENZA ANDARE SUL SERVER. semplicemnte metto null columnName_AttachRif sulla riga principale
            // Nel momento in cui salverò il save del server si accorge che una riga con attach è modified e idatatch è nullo , quindi si occuperà lei di mettere il counter a zero
        },

        /**
         * @method disableCtrl
         * @private
         * @description ASYNC
         * If disable=true then disable the loading, else, enable the controls and show the link for delete the attach
         * @param {boolean} enable
         */
        disableCtrls:function (disable) {
            // controllo html del file
            var inputCtrl = $("#" + this.idUploadFile);
            //  label che appare se l'allegato è caricato
            var lblCtrl = $("#" + this.idlbl_file_uploaded);
            // btn per delte del file
            var btndeleteCtrl = $("#" + this.idbtn_delete_file);
            // btn per upload
            var btnUploadctrl = $("#" + this.idBtnUpload);
            // label per il download
            var lblDownload = $("#" + this.idlbl_file_download);

            // Grafica per gestire interazione con il controllo
            inputCtrl.prop("hidden", disable);
            // disabilito anche il bottone stesso
            btnUploadctrl.prop("hidden", true); // messo smepre inviisubile. l'upload parte subito
            // visualizzo label con file caricato, pronto per download
            lblCtrl.prop("hidden", !disable);
            btndeleteCtrl.prop("hidden", !disable);
            lblDownload.prop("hidden", !disable);
        },

        /**
         * @method setLblFileName
         * @private
         * @description ASYNC
         * Sets the label with the file name taken by "idattach" and searching on table "attach"
         * @param {string} idattach
         * @param {DataTable} dtattach . DataTable where to retrieve the filename for the "idattach"
         */
        setLblFileName:function (idattach, dtattach) {
            var lblCtrl = $("#" + this.idlbl_file_uploaded);
            lblCtrl.text("");
            var rowsReferenced = dtattach.select($q.eq(this.idAttachColumnName, idattach ));
            // solamente se trovo la riga su dtattach, altrimenti significa che l'allegato per qualche motivo sta referenziato sulla tab ma
            // sulla tabella di chcek o non esiste o il counter sta a zero
            if (!rowsReferenced.length) return;
            var fileName = rowsReferenced[0][this.fileNameColumnName];
            lblCtrl.text(this.getOriginalFileName(fileName));
        },

        /**
         * Returns the original name of the attachment. js and server add a guid to the file name to do the name of the file univocal
         * @param {string} fileName
         * @returns {*}
         */
        getOriginalFileName:function (fileName) {
            var fname = fileName;
            var sep = appMeta.config.separatorFileName;
            var sepIndex = fileName.indexOf(sep);
            if (sepIndex) fname = fileName.substring(sepIndex + 4, fileName.length);
            return fname;
        },

        /**
         * Returns the row on the table where we have to put the idattach value
         * @returns {null | ObjectRow}
         */
        getMainRow:function () {
            var  dt = this.helpForm.DS.tables[this.tableName];
            if (!dt){
                console.log("table " + this.tableName + " doesn't exist on dataset");
                return null;
            }
            if (dt.rows.length !== 1) {
                console.log("on " + this.tableName + " there are zero or more then 1 rows. It is not possible to manage the attachment");
                return null;
            }
            return dt.rows[0];
        },


        // QUI INZIANO METODI DI INTERFACCIA Del CUSTOM CONTROL

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Fills the control. First to fill it resets the events rect
         */
        fillControl:function(el){
            var def = Deferred("upload-fillControl");
            var mainRow = this.getMainRow(); //this.metaPage.state.currentRow;
            //  label che appare se l'allegato è caricato

            // messaggi di errore, di solito qualche configurazione sbagliata o azione utente non permessa
            if (!mainRow) return def.resolve();
            if (!mainRow.getRow) return def.resolve();

            // check nome tabella sia quella principale, altrimenti c'è un errore di configurazione ed utilizzo del controllo custom
            var mainTableName = mainRow.getRow().table.name;
            if (mainTableName !== this.tableName) return this.metaPage.showMessageOk(localResource.tableNotMatch);
            // check su colonna dove inserirò il riferimento
            if (!mainRow.getRow().table.columns[this.columnName_AttachRif]) {
                return this.metaPage.showMessageOk(localResource.getColumnNotInTable(this.columnName_AttachRif));
            }

            // di default disabilito, poi vedo se c'è un idattach esistente
            this.disableCtrls(false);

            // se c'è il valore per idAttach disabilito caricamento abilito download e cancellazione
            var idattachValue = mainRow[this.columnName_AttachRif];
            if (!idattachValue) return def.resolve();

            // visualizzo nome file
            var lblCtrl = $("#" + this.idlbl_file_uploaded);
            lblCtrl.text('Allegato');
            this.disableCtrls(true);
            return def.resolve();
        },

        /**
         * @method getControl
         * @public
         * @description ASYNC
         */
        getControl: function() {
            // TODO. LA GET NON DOVREBBE ESSER NECESSARIA, IL BIND VIENE FATTO SULLA UPLOAD STESSA, QUANDO ESEGUO L'ASSEGNAZIONE
            // DEL VALORE DELL'ID ATTACH TORNATO DAL SERVER
        },

        /**
         * @method clearControl
         * @public
         * @description ASYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         * @returns {Deferred}
         */
        clearControl: function() {
            var def = Deferred("upload-clearControl");
            // reset del file eventualemnte caricato
            var inputCtrl = $("#" + this.idUploadFile);
            inputCtrl.val('');
            // riabilito caricamento
            this.disableCtrls(false);
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
            $("#" + this.idUploadFile).on("change", _.partial(this.upload, this));
            $("#" + this.idlbl_file_download).on("click", _.partial(this.download, this));
            $("#" + this.idbtn_delete_file).on("click", _.partial(this.removeAttachment, this));
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
            var def = Deferred("preFill-Upload");
            return def.resolve();
        },

        /**
         * @method getCurrentRow
         * @private
         * @description SYNC
         * @returns {{result: boolean, changed: *, rowChanged: *}}
         */
        getCurrentRow: function() {return null},

        /**
         * @method setCurrentRow
         * @private
         * @description SYNC
         * Used when the user click the event to set the current row. read from metapage with getCurrentRow() method
         * @param {ObjectRow} row
         */
        setCurrentRow:function (row) {}
    };

    window.appMeta.CustomControl("uploadwin", UploadControlWin);

}());
