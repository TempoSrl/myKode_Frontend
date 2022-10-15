/**
 * @module Logger
 * @description
 * Contains the method to log the messages on user javascript console
 */
(function () {

    var config = appMeta.config;
    var localResource = appMeta.localResource;
    /**
     *
     * @type {{ERROR: number, WARNING: number, INFO: number}}
     */
    var logTypeEnum = {
        ERROR : 0,
        DEBUG : 1,
        WARNING : 2,
        INFO : 3
    };

    /**
     * @constructor Logger
     * @description
     * Initializes the level of the log (it depends on logTypeEnum values)
     */
    function Logger() {
        "use strict";
        this.levelLog = logTypeEnum.ERROR;
    }

    Logger.prototype = {
        constructor: Logger,

        setLanguage: function(lan){
            localResource=lan;
        },

        /**
         * @method log
         * @public
         * @description SYNC
         * Depending on the "type" it prints on the console some information.
         * There several type of information (see enum logTypeEnum)
         * @param {logTypeEnum} type
         */
        log:function (type) {
            var params =  Array.prototype.slice.call(arguments, 1, arguments.length);
            var time = this.getTime();
            switch (type){
                case logTypeEnum.ERROR:
                    if (this.levelLog >= logTypeEnum.ERROR) console.error(params, time);
                    // lancia l'evento così eventualmente la metapage può effettuare operazioni.
                    appMeta.globalEventManager.trigger(appMeta.EventEnum.ERROR_SERVER);
                    var winModal = new appMeta.BootstrapModal(localResource.error, params[0], [appMeta.localResource.ok],  appMeta.localResource.cancel, time + ": " + JSON.stringify(params));
                    return winModal.show();
                    break;
                case logTypeEnum.DEBUG:
                    if (this.levelLog >= logTypeEnum.DEBUG) {
                        //impongo che per essere stampato debba esserci sul secondo parametro stringa la parola "DEBUG"
                        if (params.length > 1 && (params[1].indexOf("DEBUG-") !== -1 || params[1].indexOf("afterGetFormData-") !== -1 || params[1].indexOf("beforeFill-") !== -1 || params[1].indexOf("afterRowSelect-") !== -1 ))
                            console.info(params, time);
                    }
                    break;
                case logTypeEnum.WARNING:
                    if (this.levelLog >= logTypeEnum.WARNING)  console.warn(params, time);
                    break;
                case logTypeEnum.INFO:
                    if (this.levelLog >= logTypeEnum.INFO) console.info(params, time);
                    break;
            }
        },

        /**
         * @method setLogLevel
         * @private
         * @description SYNC
         * Sets the level of the log
         * @param {logTypeEnum} level
         */
        setLogLevel:function (level) {
            this.levelLog = level;
        },

        /**
         * @method getTime
         * @public
         * @description SYNC
         * Returns the string that represent the actual date. The format is: hh:mm:ss
         * @returns {string}
         */
        getTime:function () {
            var time = new Date();
            return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
        },

        /**
         * @method getTimeMs
         * @public
         * @description SYNC
         * Returns the string that represent the actual date. The format is: hh:mm:ss
         * @returns {string}
         */
        getTimeMs: function () {
            var time = new Date();
            return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "." + time.getMilliseconds();
        }

    };

    appMeta.logTypeEnum = logTypeEnum;
    appMeta.logger = new Logger();
}());


