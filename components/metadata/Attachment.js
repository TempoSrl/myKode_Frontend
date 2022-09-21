(function() {
    var Deferred = appMeta.Deferred;

    /**
     * Manages the upload and the download of the attachment.
     * Contains the methods to do the calls to the server about the upload/download/remove of the attachment.
     * This class can be used in a MetaPage where we need to manage an attachment.
     * There are two type of management, with some prerequisites:
     * 1. Attachment saved on file system
     * 2. Attachment saved on column table (type byte[]) on db
     *
     * 1. The upload method server side, saves the file on some destination, and
     *    creates a new row on table "attach" with counter=0, and returns to the client a DataTable "attach" on a temporary DataSet, with the row just created.
     *    This row will contains info on idattach, the real filename saved on server, the size etc..
     *    Developer can use idattach to link this attachment on own data structure, and then set counter=1 of the row with idattach.
     *
     *    Use of Attachment.js on UploadControl and MetaPage.
     *    The prerequisite is that the DataSet of the MetaPage must have a DataTable "attach" with a 1:1 relation with the main table.
     *    The relation must be between the table "attach" on field "idattach" and the "main table" on field "idattach<ColumnName>".
     *    The framework uses a special control called UploadControl to manage automatically the attachment.
     *    Infact it calls upload() method, and then when it receives the response, merges the row on "attach" table
     *    on the DataTable of the MetaPage DataSet, and update the field "idattach<ColumnName>" of the main table with the "idattach" just received.
     *    When user press "save", dataset is sent to the server and saved, the counter field of the row on attach table is set to 1.
     *    The uplaod control binded to the column "idattach<ColumnName>" will show a donwload button.
     *    Backend side the downlaod method reads the idattach, retrieves the file on the destination and send to the client..
     *
     * 2. The attachment is saved on the field of type byte[] of the main row of the main table.
     */
    function Attachment() {
        this.init();
    }

    Attachment.prototype = {
        constructor: Attachment,

        /**
         * Initializes the module for the attachment
         */
        init:function () {
        },

        /**
         * Returns a guid string, used to build an unique attachment filename.
         * @method getClientGuid
         * @private
         * @description ASYNC
         * Returns a client guid
         * @returns {string}a guid
         */
        getClientGuid:function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        /**
         * @method upload
         * @public
         * @description ASYNC
         * Uploads the file "file" on a server, and returns a Deferred with a DataSet with one DataTable "attach"
         * with one row, with the info of the attachment:
         * filename: the real name of the file saved on server file system. N.B it is a concatenation of a
         *  guid and real file name
         * size: the size of the file
         * idattach: the key of the table attach. used to link the attachment to another row of another table.
         * The upload is splitted on chunks of 1mb. So the method can upload files of any size.
         * @param {byte[]} file
         * @param {string} filename 
         * @returns {Deferred(DataSet)} the DataSet of Attach table with all the info of the file attached
         */
        upload:function (file, filename ) {
            var self  = this;
            var def = Deferred("upload");
            var arrDeferred = [];
            // concateno al file name utilizzato pe ricostruire i vari pacchetti del file anche un guid per avere nomi file univoci inviati al server
            var fname = this.getClientGuid()  + appMeta.config.separatorFileName + filename;
            // create array to store the buffer chunks
            var fileChunk = [];
            // set up other initial vars
            var readBuffer_Size = 1024;
            var bufferChunkSize = (readBuffer_Size * 1024);

            var fileStreamPos = 0;
            // inizializzo fine del primo pacchetto.
            var endPos = bufferChunkSize;
            var size = file.size;

            // inserisco in fileChunk array finchè non arrivo alla fine del file
            while (fileStreamPos < size) {
                // "slice" il  file dalla posizione iniziale + offset alla lunghezza voluta
                fileChunk.push(file.slice(fileStreamPos, endPos));
                fileStreamPos = endPos; // jump by the amount read
                endPos = fileStreamPos + bufferChunkSize; // prossima fine del pacchetto
            }

            // ottengo numerototale di pacchetti delfile da spedire
            var totalParts = fileChunk.length;
            var partCount = 0;

            // ogni volta recupero item iniziale dell'array ed invio
            while (chunk = fileChunk.shift()) {
                partCount++;
                // Convenzione nome del file per pacchettizzazione (file.name èil nome del file del client)
                var filePartName = fname + ".part_" + partCount + "." + totalParts;
                // spedisco il pacchtto e salvo risultato in deferred
				arrDeferred.push(this.uploadFileChunk(chunk, filePartName));
            }

            // terminato l'invio di tutti i pacchetti del file,  risolvo trovando nelle risposte il json del ds attach
            // in cui ho le info dell'allegato. Poi il chiamante fa quello che vuole
            $.when.apply($, arrDeferred)
                .then(function() {
                    var dsAttachJSON = _.find(arguments,
                        function(defObj) {
                            // se è null significa che è la risposta ad un singolo pacchetto, non quello finale
                            if (!defObj) return false;
                            return (defObj);
                        });

                    // se l'attachment è caricato con successo, popolo la riga del ds attach da passare al chiamante
                    if (dsAttachJSON) {
                        var dsattach = appMeta.getDataUtils.getJsDataSetFromJson(dsAttachJSON);
                        def.resolve(dsattach);
                    } else  {
                        def.reject('nessun file salvato');
                    }
                }).fail(function (err) {
                    def.reject(err);
                });

            return def.promise();
        },


        /**
         * @method uploadFileChunk
         * @private
         * @description ASYNC
         * Sends to the server the single chunk of the file that we are uploading.
         * Returns the  DataSet with "attach" DataTable.  if is the last chunk, an empty string otherwise.
         * @param {Object} chunk
         * @param {string} fileName
         * @returns {Deferred(json | "")}
         */
        uploadFileChunk:function(chunk, fileName){
            var def = Deferred("upload");
            var token = appMeta.connection.getAuthToken();
            var FD = new FormData();
            FD.append('file', chunk, fileName);
            // recupero dal routing prm da passare alla chiamata
           var callConfigObj = appMeta.routing.connObj['uploadChunk'];
           var myInit = {
                method: callConfigObj.type,
                body: FD,
                headers : {'Authorization':  "Bearer " + token}
            };
           fetch(callConfigObj.url, myInit)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    def.resolve(data);
                })
           return def.promise();
        },


        /**
         * @method download
         * @public
         * @description ASYNC
         * Downloads a file as a blob.
         * Server side retrieve the file reading the filename on the table "attach" for "idattach"
         * @param {string} idAttach. the id of the attachment on table "attach"
         * @returns {Deferred()}
         */
        download:function (idAttach) {
            var def = Deferred("download");
            var self = this;
            var token = appMeta.connection.getAuthToken();
            var callConfigObj = appMeta.routing.connObj['download'];
            var url = callConfigObj.url + '?idattach=' + idAttach;
            var filename = 'default';
            var myInit = { method: callConfigObj.type,
                headers : {'Authorization':  "Bearer " + token}};
            fetch(url, myInit).then( function (response) {
                filename = self.getFileNameFromContentDisposition(response.headers.get('content-disposition'));
                return response.blob();
            }).then(function(myBlob) {
                var fileURL = window.URL.createObjectURL(myBlob);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                console.log(fileURL);
                a.href = fileURL;
                a.download = filename;
                a.click();
                def.resolve();
            });
            return def.promise();
        },

        getFileNameByUTF8: function (str) {

            // Convert Base64 encoded bytes to percent-encoding, and then get the original string.
            var start = "=?utf-8?B?";
            var input = str.substring(str.indexOf(start) + start.length, str.lastIndexOf("?="));
            percentEncodedStr = atob(input).split('').map(function (c) {
                 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('');

            return decodeURIComponent(percentEncodedStr);
        },

        getFileNameFromContentDisposition: function (contentDisposition) {
            
            var filename = contentDisposition.split('filename=')[1].split(';')[0];
            if (filename.indexOf("utf-8") > 0)
                filename = this.getFileNameByUTF8(filename);
			return this.getOriginalFileName(filename.replaceAll('"',''));
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
         * Execute the download of the attachment , that were uploaded with windows client. and so they were on the table, not in the file system.
         * @param tableName
         * @param filter
         * @param columnAttach
         * @returns {*}
         */
        downloadDbField:function (tableName, filter, columnAttach) {
            var prms = {
                tableName: tableName,
                columnAttach: columnAttach,
                filter: appMeta.getDataUtils.getJsonFromJsDataQuery(filter)
            };

             // parametri da apssare nella query string
            serialize = function(obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p)) {
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    }
                return str.join("&");
            };

            var def = Deferred("downloadDbField");
            var token = appMeta.connection.getAuthToken();
            var callConfigObj = appMeta.routing.connObj['downloadDbField'];
            var url = callConfigObj.url + "?" + serialize(prms);
            var fname = '';

            // altri browser, ok Edge, tranne IE
            var myInit = {
                method: callConfigObj.type,
                headers : {'Authorization':  "Bearer " + token}
            };
            fetch(url, myInit).then( function (response) {
                fname = response.headers.get("Content-Disposition").split('=')[1];
                // l'header aggiunge nella stringa gli apici, quindi li devo togleire per recuperare il file originale
                fname = fname.replace(/"/g,'');
                return response.blob();
            }).then(function(myBlob) {
                var fileURL = window.URL.createObjectURL(myBlob);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                console.log(fileURL);
                a.href = fileURL;
                a.download = fname;
                a.click();
                def.resolve();
            });
            return def.promise();
        },

        uploadDbField: function(tableName, filter, columnAttach, file) {
        },

        ///**
        // * @method removeAttachment
        // * @private
        // * @description ASYNC
        // * Removes the attachment. Server sets the counter of the attachment to zero. 
        // * @param {string} idAttach. the id of the attachment on table "attach"
        // * @returns {Deferred(DataTable)}
        // */
        //removeAttachment:function (idAttach) {
        //    var def = Deferred("removeAttachment");
        //    var token = appMeta.connection.getAuthToken();
        //    var callConfigObj = appMeta.routing.connObj['remove'];
        //    $.ajax({
        //        type: callConfigObj.type,
        //        url: callConfigObj.url +  "?idattach=" + idAttach,//appMeta.routing.backendUrl + '/file/remove?idattach=' + idAttach,
        //        headers : {'Authorization':  "Bearer " + token},
        //        success: function(dtAttachJSON) {
        //            // restituisce la table attach con il contatore aggiornato
        //            var dtattach = appMeta.getDataUtils.getJsDataTableFromJson(dtAttachJSON);
        //            def.resolve(dtattach);
        //        },
        //        error: function (xhr, status){
        //            var err = "Error " + " " + status;
        //            if (xhr.responseText ) err = JSON.parse(xhr.responseText);
        //            def.reject(err);
        //            console.log(err);
        //        }
        //    });

        //    return def.promise();
        //}

    };

    appMeta.Attachment =  Attachment;

}());
