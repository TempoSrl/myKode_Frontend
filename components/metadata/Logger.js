/**
 * Created by Gaetano Lazzo on 07/02/2015.
 * Thanks to lodash, ObjectObserve
 */
/* jslint nomen: true */
/* jslint bitwise: true */
/*globals Environment,jsDataAccess,Function,jsDataQuery,define,_ */

/**
 * @module Logger
 * @description
 * Contains the method to log the messages on user javascript console
 */

(function (localResource) {
    'use strict';

    //noinspection JSUnresolvedVariable

    /** Detect free variable `global` from Node.js. */
    let freeGlobal = typeof global === 'object' && global && global.Object === Object && global;

    //const freeGlobal = freeExports && freeModule && typeof global === 'object' && global;


    /** Detect free variable `self`. */
    let freeSelf = typeof self === 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    let root = freeGlobal || freeSelf || Function('return this')();



    /** Detect free variable `exports`. */
    let freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;


    /** Detect free variable `module`. */
    let freeModule = freeExports && typeof module === 'object' && module && !module.nodeType && module;


    //noinspection JSUnresolvedVariable
    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
    let moduleExports = freeModule && freeModule.exports === freeExports;

    /**
     *
     * @type {{ERROR: number, WARNING: number, INFO: number}}
     */
    const logTypeEnum = {
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

        setLanguage: function (lan) {
            localResource = lan;
        },

        /**
         * @method log
         * @public
         * @description SYNC
         * Depending on the "type" it prints on the console some information.
         * There several type of information (see enum logTypeEnum)
         * @param {logTypeEnum} type
         */
        log: function (type) {
            var params = Array.prototype.slice.call(arguments, 1, arguments.length);
            var time = this.getTime();
            switch (type) {
                case logTypeEnum.ERROR:
                    if (this.levelLog >= logTypeEnum.ERROR)
                        if (typeof appMeta === 'undefined') {
                            console.error(params, time);
                        }
                        else {
                            // lancia l'evento così eventualmente la metapage può effettuare operazioni.
                            appMeta.globalEventManager.trigger(appMeta.EventEnum.ERROR_SERVER);
                            var winModal = new appMeta.BootstrapModal(localResource.error, params[0], [appMeta.localResource.ok], appMeta.localResource.cancel, time + ": " + JSON.stringify(params));
                            return winModal.show();
                        }
                    break;
                case logTypeEnum.DEBUG:
                    if (this.levelLog >= logTypeEnum.DEBUG) {
                        if (typeof appMeta === 'undefined') {
                            console.info(params, time);
                        }
                        else {
                            //impongo che per essere stampato debba esserci sul secondo parametro stringa la parola "DEBUG"
                            if (params.length > 1 && (params[1].indexOf("DEBUG-") !== -1 ||
                                params[1].indexOf("afterGetFormData-") !== -1 ||
                                params[1].indexOf("beforeFill-") !== -1 ||
                                params[1].indexOf("afterRowSelect-") !== -1))
                                console.info(params, time);
                        }
                    }
                    break;
                case logTypeEnum.WARNING:
                    if (this.levelLog >= logTypeEnum.WARNING) console.warn(params, time);
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
        setLogLevel: function (level) {
            this.levelLog = level;
        },

        /**
         * @method getTime
         * @public
         * @description SYNC
         * Returns the string that represent the actual date. The format is: hh:mm:ss
         * @returns {string}
         */
        getTime: function () {
            let time = new Date();
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
            let time = new Date();
            return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "." + time.getMilliseconds();
        }

    };

    let toExport={
        logTypeEnum:logTypeEnum,
        logger: new Logger()
    };



    // Some AMD build optimizers like r.js check for condition patterns like the following:
    //noinspection JSUnresolvedVariable
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        // Expose lodash to the global object when an AMD loader is present to avoid
        // errors in cases where lodash is loaded by a script tag and not intended
        // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
        // more details.
        if (root.appMeta) {
            root.appMeta.logTypeEnum = toExport.logTypeEnum;
            root.appMeta.logger = toExport.logger;
        }
        else {
            root.logTypeEnum = toExport.logTypeEnum;
            root.logger = toExport.logger;
        }

        // Define as an anonymous module so, through path mapping, it can be
        // referenced as the "underscore" module.
        //noinspection JSUnresolvedFunction
        define(function () {
            return toExport;
        });
    }
    // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
    else if (freeExports && freeModule) {
        // Export for Node.js or RingoJS.
        if (moduleExports) {
            (freeModule.exports = toExport).Logger = toExport;
        }
        // Export for Narwhal or Rhino -require.
        else {
            freeExports.logTypeEnum = toExport.logTypeEnum;
            freeExports.logger = toExport.logger;
        }
    }
    else {
        // Export for a browser or Rhino.
        if (root.appMeta) {
            root.appMeta.logTypeEnum = toExport.logTypeEnum;
            root.appMeta.logger = toExport.logger;
        }
        else {
            root.logTypeEnum = toExport.logTypeEnum;
            root.logger = toExport.logger;
        }

    }

}(
    (typeof appMeta === 'undefined') ? require('./LocalResource').localResource : appMeta.localResource,
));


