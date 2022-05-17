/**
 * @module LocalResource
 * @description
 * Collection of the localized strings (for now it manages it language)
 */
(function () {

    /**
     * @constructor LocalResource
     * @description
     */
    function LocalResource() {
        "use strict";
        this.currLng = "it";
        // default è italiano, il file italiano avrà sicuramente tutte le stringhe, poichè parto sempre da quello
        // per inserire nuove costanti per le stringhe
        this.setLanguage(this.currLng);
    }

    LocalResource.prototype = {
        constructor: LocalResource,
        
        /**
         * @method setLanguage
         * @public
         * @description SYNC
         * @param {string} lng. language constant it for italian, en for english, fr: francaise etc..
         */
        setLanguage:function (lng) {
            this.currLng = lng;
            // creo il nome del prototipo a runtime senza cablare la swicth così se aggiungo una lingua
            // viene automaticamente presa
            try {
                var lbnSuffix = lng.charAt(0).toUpperCase() + lng.slice(1).toLowerCase();
                var lngPrototype = 'appMeta.localResource' + lbnSuffix + '.prototype';
                _.extend(this, eval(lngPrototype));

                // localizza eventuali custom control con localizzazione custom
                this.localizeCustomControls(lng);
                
                // localizzo la toolbar
                if (appMeta.toolBarManager) appMeta.toolBarManager.localize();
            } catch (e){
                console.log("Language " + lng + " doesn't exist! Go to i18n folder and create the file localResource" + lng + ".js")
            }
        },

        /**
         * 
         */
        localizeCustomControls:function (lng) {
            $(appMeta.rootElement + " [data-custom-control] ")
                .each(function(index, el) {
                    var ctrl = $(el).data("customController");
                    if (!ctrl) return;
                    if (!ctrl.localize) return;
                    ctrl.localize(lng);
                });
        },

        getNoRowFound: function (searchTableName, mergedFilter, listingType) {
            var msg  = this.getNoRowFound1(searchTableName);
            msg += this.getNoRowFound2(mergedFilter);
            msg += this.getNoRowFound3(listingType);
            return msg;
        },

        getNoRowFound1:function (searchTableName) {
            return this.replacePlaceolderLocalization('searchTableName', searchTableName, this.noRowOnTable);
        },

        getNoRowFound2:function (mergedFilter) {
            if (mergedFilter.length > 0) return this.replacePlaceolderLocalization('mergedFilter', mergedFilter, this.filterWas);
            return "";
        },

        getNoRowFound3:function (listingType) {
            if (listingType)  return " - " + this.listName + ": " + listingType + "'.\r\n";
            return "";
        },

        getErrorListingTypeNull:function (searchTableName, filter, title ) {
            return this.replaceWordsInPhrase({searchTableName : searchTableName, filter: filter, title:title}, this.errorListingTypeNull);
        },

        getErrorLoadingMetaData:function (searchTableName) {
            return  this.replacePlaceolderLocalization('searchTableName', searchTableName, this.errorLoadingMetaData);
        },

        getCommandExecutionError:function (command) {
            return  this.replacePlaceolderLocalization('command', command, this.commandExecutionError);
        },

        getEntityNotfound:function (unaliased, formTitle) {
            return this.replaceWordsInPhrase({unaliased : unaliased, formTitle: formTitle}, this.entityNotfound);
        },

        getGridControlTagWrong:function (gridTag, formTitle) {
            return this.replaceWordsInPhrase({gridTag : gridTag, formTitle: formTitle}, this.gridControlTagWrong);
        },

        getDeleteRowConfirm:function (tableName) {
            return  this.replacePlaceolderLocalization('tableName', tableName, this.deleteRowConfirm);
        },

        getCantUnlinkDataTable:function (sourceTableName, primaryTableName) {
            return this.replaceWordsInPhrase({sourceTableName : sourceTableName, primaryTableName: primaryTableName}, this.cantUnlinkDataTable);
        },

        getMissingTableDataSet:function (tableName) {
            return this.replacePlaceolderLocalization('tableName', tableName, this.missingTableDataSet);
        },

        getMoreThenRow:function(tableName){return this.replacePlaceolderLocalization('tableName', tableName, this.moreThenRow);},

        getGridDataNoValid:function (tableName) {
            return this.replacePlaceolderLocalization('tableName', tableName, this.gridDataNoValid);
        },

        getCancelObjInsert:function (formTitle) {
            return this.replacePlaceolderLocalization('formTitle', formTitle, this.cancelObjInsert);
        },

        getDeleteObjInsert:function (formTitle) {
            return this.replacePlaceolderLocalization('formTitle', formTitle, this.deleteObjInsert);
        },

        getFormNoMainTreeView:function (formTitle) {return this.replacePlaceolderLocalization('formTitle', formTitle, this.formNoMainTreeView);},

        getPressedInsertAndcopy:function () {return this.copyPressedMsg},

        getInvalidData:function (tableName) {return this.replacePlaceolderLocalization('tableName', tableName, this.invalidData);},

        // INIZIO messaggi per show last
        getNoRowSelected:function (tableName) {return this.replacePlaceolderLocalization('tableName', tableName, this.noRowSelected);},
        
        getRowSelectedDetached:function () {return this.rowCouldBeDetached;},
        
        getRowSelectedDetachedorDeleted:function () {return  this.rowCouldBeDetachedOrDeleted},

        createdByUser:function (user) {
            if (user)  return this.replacePlaceolderLocalization('user', user, this.createdByStr);
            return "";
        },

        createdOn:function (time) {
            if (time) return this.replacePlaceolderLocalization('time', time, this.createdOnStr);
            return "";
        },

        onlyOn:function (time) {
            if (time) return  " " + this.onDate + " " + time;
            return "";
        },

        modifiedBy:function (user) {
            if (user) return this.replacePlaceolderLocalization('user', user, this.modifiedByStr);
            return "";
        },

        modifiedOn:function (time) {
            if (time) return this.replacePlaceolderLocalization('time', time, this.modifiedOnStr);
            return "";
        },

        getNumberOfRows:function (count) {
            if (count === undefined || count === null) return "";
            return this.replacePlaceolderLocalization('count', count, this.result);
        },


        getDoYuoWantModifyEventResize:function (eventTitle, endDate) {
            var s1 = this.replacePlaceolderLocalization('eventTitle', eventTitle, this.calendarEventResizeEnd);
            return  this.replacePlaceolderLocalization('endDate', endDate, s1);
        },

        getDoYuoWantModifyEvent:function (eventTitle, startDate, endDate) {
            return this.replaceWordsInPhrase({eventTitle : eventTitle, startDate: startDate, endDate: endDate}, this.calendarEventMoveEventQuestion);
        },

        getColumnNotInTable:function (cname) {
            return  this.replacePlaceolderLocalization('cname', cname, this.tableAttachNotAvailable);
        },
        
        getIsValidFieldMandatory:function (field) {
            return  this.replacePlaceolderLocalization('field', field, this.isValidFieldMandatory);
        },
        
        getIsValidFieldMaxLength:function (field, maxlenght) {
            return this.replaceWordsInPhrase({field : field, maxlenght: maxlenght}, this.isValidMaxLength);
        },

        getMinNumRowRequired:function (msg, numrows) {
            return this.replaceWordsInPhrase({numrows : numrows, msg: msg}, this.minNumrowRequired);
        },

        getUnValidMail:function (email) {
           return this.replacePlaceolderLocalization('email', email, this.unvalidEMail);
        },

        getUnValidIp:function (ip) {
            return this.replacePlaceolderLocalization('ip', ip, this.unvalidIp);
        },
        
        getFilterDateString:function (startcolname, date1, date2) {
            return this.replaceWordsInPhrase({startcolname : startcolname, date1: date1, date2:date2}, this.filterDateString);
        },

        getPressSaveAfterDelete:function (valuecell) {
            return this.replaceWordsInPhrase({valuecell : valuecell}, this.pressSaveAfterDelete);
        },

        /**
         * translates jsDataQuery expression in a clearest mode
         * @param filter
         */
        getFilterMessage:function(filter) {
            /*
                \( : match parentesi aperta
                ( : inizio del gruppo all'interno delleparentesi
                [^)]+: qualsiasi carattere uno o più ma non ")" parentesi  chiusa
                ) : fine del gruppo
                \) : matcth parentesi chiusa
             */

            // loop su tutte le condizioni trovate e costruice stringa.
            // se è "eq" mette campo=valore se "like" campo simile
            // expr ex: "eq(field, value),like(filed2,value)"
            var self = this;
            var conds = filter.match(/(eq|like)+\(([^)]+)\)/g);
            return _.join(_.reduce(conds, function (acc, cond) {
                        var els = cond.match(/(eq|like)|\(([^)]+)\)/g);
                        var operator = els[0];
                        var fieldValue = els[1].replace("(", "").replace(")","").split(",");
                        acc.push("(" + fieldValue[0] + " " + self[operator] + " " + fieldValue[1] + ")");
                        return acc;
                    }, []),
                " " + this.and + " ");
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
         * @param {string} needle the placeholder to search, senza %S
         * @param {string} newval new value tio insert
         * @param {string} stringToSearch the string to search and to replace
         * @returns {*}
         */
        replacePlaceolderLocalization:function(needle, newval, stringToSearch){
            return stringToSearch.replace('S%' + needle + '%S', newval);
        }

        // FINE messaggi per show last
    };
    
    appMeta.localResource = new LocalResource();
}());


