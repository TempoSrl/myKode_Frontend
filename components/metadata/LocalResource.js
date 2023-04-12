/*globals ObjectRow,DataRelation,define,self,jsDataSet,jsDataQuery,appMeta,_,$,define */
/**
 * @module LocalResource
 * @description
 * Collection of the localized strings (for now it manages it language)
 */
(function (appMeta,_,$) {

    /** Detect free variable `global` from Node.js. */
    let freeGlobal = typeof global === 'object' && global && global.Object === Object && global;

    //const freeGlobal = freeExports && freeModule && typeof global === 'object' && global;


    /** Detect free variable `self`. */
    let freeSelf = typeof self === 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    let root = freeGlobal || freeSelf || Function('return this')();



    /** Detect free variable `exports`. */
    let freeExports = typeof exports === 'object' && exports && !exports.nodeType && exports;


    /** Detect free variable `module`. */
    let freeModule = freeExports && typeof module === 'object' && module && !module.nodeType && module;


    //noinspection JSUnresolvedVariable
    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
    let moduleExports = freeModule && freeModule.exports === freeExports;


    /**
     * @constructor LocalResource
     */
    function LocalResource() {
        this.dictionary= null;
    }

    LocalResource.prototype = {
        constructor: LocalResource,

        dictionaries: {}, //shared between all instances of application

        localizedResources:{},

        /**
         * Assigns a language dictionary to a language code
         * @param language
         * @param dictionary
         */
        registerDictionary: function(language, dictionary){
            LocalResource.prototype.dictionaries[language]= dictionary;
        },

        /**
         * Gets a registered language dictionary
         * @param language
         * @return {*}
         */
        getDictionary: function(language){
            let res = LocalResource.prototype.dictionaries[language];
            if (res) {
                return res;
            }
            if (typeof appMeta=== 'undefined'){
                let lbnSuffix = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
                res = require("./../i18n/LocalResource"+lbnSuffix);
                LocalResource.prototype.dictionaries[language] = res;
            }
            return res;
        },

        /**
         * obtains a language resource by a language code
         * @param language
         * @return {LocalResource|*}
         */
        getLocalResource:function (language){
            if (LocalResource.prototype.localizedResources[language]){
                return LocalResource.prototype.localizedResources[language];
            }
            let resource = new LocalResource();
            resource.setLanguage(language);
            LocalResource.prototype.localizedResources[language]= resource;
            return  resource;
        },

        /**
         * @method setLanguage
         * @public
         * @description Set the language for this instance of local resources
         * @param {string} lng language constant it for italian, en for english, fr: francaise etc..
         */
        setLanguage:function (lng) {
            this.currLng = lng;

            // creo il nome del prototipo a runtime senza cablare la switch così se aggiungo una lingua
            // viene automaticamente presa
            try {
                if (appMeta){
                    //executed on client
                    this.dictionary = this.getDictionary(lng); //appMeta['localResource'+lbnSuffix]();
                    _.extend(this, this.dictionary);

                    // localizza eventuali custom control con localizzazione custom
                    this.localizeCustomControls(lng);

                    if (appMeta.currApp.toolBarManager) {
                        appMeta.currApp.toolBarManager.localize();
                    }
                }
                else {

                    //executed on server
                    //
                    this.dictionary = this.getDictionary(lng);
                    _.extend(this, this.dictionary);
                }

            } catch (e){
                console.log(e);
                console.log("Language " + lng + " doesn't exist! Go to i18n folder and create the file localResource " + lng + ".js");
            }
        },

        /**
         * Client function, only does some work on client environment
         */
        localizeCustomControls:function (lng) {
            if (typeof appMeta === undefined || typeof  $ === undefined){
                return;
            }
            $(appMeta.currApp.rootElement + " [data-custom-control] ")
                .each(function(index, el) {
                    let ctrl = $(el).data("customController");
                    if (!ctrl) return;
                    if (!ctrl.localize) return;
                    ctrl.localize(lng);
                });
        },


        /**
         * Common function
         * @method getNoRowFound
         * @public
         * @param searchTableName
         * @param mergedFilter
         * @param listingType
         * @return {*}
         */
        getNoRowFound: function (searchTableName, mergedFilter, listingType) {
            let msg = this.getNoRowFound1(searchTableName);
            msg += this.getNoRowFound2(mergedFilter);
            msg += this.getNoRowFound3(listingType);
            return msg;
        },


        /**
         * Common function
         * @method getNoRowFound1
         * @param searchTableName
         * @return {*}
         */
        getNoRowFound1:function (searchTableName) {
            return this.replacePlaceolderLocalization('searchTableName', searchTableName, this.dictionary.noRowOnTable);
        },

        /**
         * Common function
         * @param mergedFilter
         * @return {string|*}
         */
        getNoRowFound2: function (mergedFilter) {
            if (mergedFilter.length > 0) return this.replacePlaceolderLocalization('mergedFilter', mergedFilter, this.dictionary.filterWas);
            return "";
        },

        /**
         * Common function
         * @param listingType
         * @return {string}
         */
        getNoRowFound3:function (listingType) {
            if (listingType)  return " - " + this.dictionary.listName + ": " + listingType + "'.\r\n";
            return "";
        },

        /**
         * Common function
         * @method
         * @public
         * @param searchTableName
         * @param filter
         * @param title
         * @return {*}
         */
        getErrorListingTypeNull:function (searchTableName, filter, title ) {
            return this.replaceWordsInPhrase({searchTableName : searchTableName, filter: filter, title:title}, this.dictionary.errorListingTypeNull);
        },

        /**
         * Common function
         * @method
         * @public
         * @param searchTableName
         * @return {*}
         */
        getErrorLoadingMetaData:function (searchTableName) {
            return  this.replacePlaceolderLocalization('searchTableName', searchTableName, this.dictionary.errorLoadingMetaData);
        },

        getCommandExecutionError:function (command) {
            return  this.replacePlaceolderLocalization('command', command, this.dictionary.commandExecutionError);
        },

        getEntityNotfound:function (unaliased, formTitle) {
            return this.replaceWordsInPhrase({unaliased : unaliased, formTitle: formTitle}, this.dictionary.entityNotfound);
        },

        getGridControlTagWrong:function (gridTag, formTitle) {
            return this.replaceWordsInPhrase({gridTag : gridTag, formTitle: formTitle}, this.dictionary.gridControlTagWrong);
        },

        getDeleteRowConfirm:function (tableName) {
            return  this.replacePlaceolderLocalization('tableName', tableName, this.dictionary.deleteRowConfirm);
        },

        getCantUnlinkDataTable:function (sourceTableName, primaryTableName) {
            return this.replaceWordsInPhrase({sourceTableName : sourceTableName, primaryTableName: primaryTableName}, this.dictionary.cantUnlinkDataTable);
        },

        getMissingTableDataSet:function (tableName) {
            return this.replacePlaceolderLocalization('tableName', tableName, this.dictionary.missingTableDataSet);
        },

        getMoreThenRow:function(tableName){return this.replacePlaceolderLocalization('tableName', tableName, this.dictionary.moreThenRow);},

        getGridDataNoValid:function (tableName) {
            return this.replacePlaceolderLocalization('tableName', tableName, this.dictionary.gridDataNoValid);
        },

        getCancelObjInsert:function (formTitle) {
            return this.replacePlaceolderLocalization('formTitle', formTitle, this.dictionary.cancelObjInsert);
        },

        getDeleteObjInsert:function (formTitle) {
            return this.replacePlaceolderLocalization('formTitle', formTitle, this.dictionary.deleteObjInsert);
        },

        getFormNoMainTreeView:function (formTitle) {return this.replacePlaceolderLocalization('formTitle', formTitle, this.dictionary.formNoMainTreeView);},

        getPressedInsertAndcopy:function () {return this.dictionary.copyPressedMsg;},

        getInvalidData:function (tableName) {return this.replacePlaceolderLocalization('tableName', tableName, this.dictionary.invalidData);},

        // INIZIO messaggi per show last
        getNoRowSelected:function (tableName) {return this.replacePlaceolderLocalization('tableName', tableName, this.dictionary.noRowSelected);},

        getRowSelectedDetached:function () {return this.dictionary.rowCouldBeDetached;},

        getRowSelectedDetachedorDeleted:function () {return  this.dictionary.rowCouldBeDetachedOrDeleted;},

        createdByUser:function (user) {
            if (user)  return this.replacePlaceolderLocalization('user', user, this.dictionary.createdByStr);
            return "";
        },

        createdOn:function (time) {
            if (time) return this.replacePlaceolderLocalization('time', time, this.dictionary.createdOnStr);
            return "";
        },

        onlyOn:function (time) {
            if (time) return  " " + this.dictionary.onDate + " " + time;
            return "";
        },

        modifiedBy:function (user) {
            if (user) return this.replacePlaceolderLocalization('user', user, this.dictionary.modifiedByStr);
            return "";
        },

        modifiedOn:function (time) {
            if (time) return this.replacePlaceolderLocalization('time', time, this.dictionary.modifiedOnStr);
            return "";
        },

        getNumberOfRows:function (count) {
            if (count === undefined || count === null) return "";
            return this.replacePlaceolderLocalization('count', count, this.dictionary.result);
        },


        getDoYouWantModifyEventResize:function (eventTitle, endDate) {
            var s1 = this.replacePlaceolderLocalization('eventTitle', eventTitle, this.dictionary.calendarEventResizeEnd);
            return  this.replacePlaceolderLocalization('endDate', endDate, s1);
        },

        getDoYouWantModifyEvent:function (eventTitle, startDate, endDate) {
            return this.replaceWordsInPhrase({eventTitle : eventTitle, startDate: startDate, endDate: endDate}, this.dictionary.calendarEventMoveEventQuestion);
        },

        getColumnNotInTable:function (cname) {
            return  this.replacePlaceolderLocalization('cname', cname, this.dictionary.tableAttachNotAvailable);
        },

        getIsValidFieldMandatory:function (field) {
            return  this.replacePlaceolderLocalization('field', field, this.dictionary.isValidFieldMandatory);
        },

        getIsValidFieldMaxLength:function (field, maxlenght) {
            return this.replaceWordsInPhrase({field : field, maxlenght: maxlenght}, this.dictionary.isValidMaxLength);
        },

        getMinNumRowRequired:function (msg, numrows) {
            return this.replaceWordsInPhrase({numrows : numrows, msg: msg}, this.dictionary.minNumrowRequired);
        },

        getUnValidMail:function (email) {
            return this.replacePlaceolderLocalization('email', email, this.dictionary.unvalidEMail);
        },

        getUnValidIp:function (ip) {
            return this.replacePlaceolderLocalization('ip', ip, this.dictionary.unvalidIp);
        },

        getFilterDateString:function (startcolname, date1, date2) {
            return this.replaceWordsInPhrase({startcolname : startcolname, date1: date1, date2:date2}, this.dictionary.filterDateString);
        },

        getPressSaveAfterDelete:function (valuecell) {
            return this.replaceWordsInPhrase({valuecell : valuecell}, this.dictionary.pressSaveAfterDelete);
        },

        /**
         * translates jsDataQuery expression in a clearest mode
         * @param filter
         */
        getFilterMessage: function (filter) {
            return filter;
        },

        /**
         * Replace each word placeholders in the input string . the placeholder is S%<word>%S
         * @param {Object} objs key pair. with key and value to repalce on sInpunt
         * @param {string} sInpunt. input string
         * @returns {*}
         */
        replaceWordsInPhrase:function (objs, sInpunt) {
            var self  = this;
            // prende la stringa di input e rimpiazza ogni volta la stringa
            return _.reduce(objs, function (res, value, key) {
                return self.replacePlaceolderLocalization(key, value, res);
            }, sInpunt);
        },

        /**
         * Replaces placeholder in the string "stringToSearch"
         * @param {string} placeholder the placeholder to search, senza %S
         * @param {string} newValue new value tio insert
         * @param {string} stringToSearch the string to search and to replace
         * @returns {*}
         */
        replacePlaceolderLocalization:function(placeholder, newValue, stringToSearch){
            return stringToSearch.replace('S%' + placeholder + '%S', newValue);
        }

        // FINE messaggi per show last
    };

    let localResource = LocalResource;

    // Some AMD build optimizers like r.js check for condition patterns like the following:
    //noinspection JSUnresolvedVariable
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        // Expose lodash to the global object when an AMD loader is present to avoid
        // errors in cases where lodash is loaded by a script tag and not intended
        // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
        // more details.
        // Export for a browser or Rhino.
        if (root.appMeta) {
            root.appMeta.localResource = new localResource();
            root.appMeta.LocalResource = localResource;
        }
        else {
            root.localResource = localResource;
        }

        // Define as an anonymous module so, through path mapping, it can be
        // referenced as the "underscore" module.
        //noinspection JSUnresolvedFunction
        define(function () {
            return localResource;
        });
    }
    // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
    else if (freeExports && freeModule) {
        // Export for Node.js or RingoJS.
        if (moduleExports) {
            (freeModule.exports = localResource).localResource = localResource;
        }
        // Export for Narwhal or Rhino -require.
        else {
            freeExports.localResource = localResource;
        }
    }
    else {
        // Export for a browser or Rhino.
        if (root.appMeta){
            root.appMeta.localResource = new localResource();
            root.appMeta.LocalResource = localResource;
        }
        else {
            root.localResource = localResource;
        }
    }

}.call(this,
    (typeof appMeta === 'undefined') ? undefined : appMeta,
    (typeof _ === 'undefined') ? require('lodash') : _,
    (typeof $ === 'undefined') ? undefined : $
) );


