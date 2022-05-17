/**
 * @module Routing
 * @description
 * Contains all the routin info
 */
(function () {


    /**
     *
     * @type {{getDataSet: string, prefillDataSet: string, fillDataSet: string}}
     */
    var methodEnum = {
        getDataSetTest: "getDataSetTest",
        fromJsDataSetToDataset : "fromJsDataSetToDataset",
        getJsDataQuery : "getJsDataQuery",
        fromJsDataQueryToSql : "fromJsDataQueryToSql",

        getDsByRowKey : "getDsByRowKey",
        createTableByName: "createTableByName",
        getDataSet : "getDataSet",
        prefillDataSet: "prefillDataSet",
        multiRunSelect: "multiRunSelect",
        fillDataSet : "fillDataSet",
        select : "select",
        getPrimaryTable: "getPrimaryTable",
        selectCount : "selectCount",
        getPagedTable : "getPagedTable",
        doGet : "doGet",
        saveDataSet : "saveDataSet",
        getNewRow : "getNewRow",
        describeColumns : "describeColumns",
        describeTree: "describeTree",
        getSpecificChild : "getSpecificChild",
        getNewRowCopyChilds: "getNewRowCopyChilds",
        setUsrEnv: "setUsrEnv",
        doReadValue: "doReadValue",
        customServerMethod: "customServerMethod",

        read : "read",
        login : "login",
        loginSSO : "loginSSO",
        loginLDAP : "loginLDAP",
        register : "register",
        resetPassword : "resetPassword",
        nuovaPassword: "nuovaPassword",
        cambiaRuolo: "cambiaRuolo",

        uploadChunk: "uploadChunk",
        remove : "remove",
        download : "download",

        downloadDbField: "downloadDbField",
        sendMail: "sendMail"
    };


    /**
     * Server error (declared on LoginFailedStatus backend class on our .net backed)
     * @type {{NoCredential: string, ExpiredCredential: string, ExpiredSession: string, BadCredential: string, DataNotPermitted: string, TokenEmpty: string}}
     */
    var serverErrorTypeEnum = {
        NoCredential : 'NoCredential',
        ExpiredCredential : "ExpiredCredential",
        ExpiredCredentialSSO: "ExpiredCredentialSSO",
        ExpiredSession : "ExpiredSession",
        BadCredential : "BadCredential",
        DataNotPermitted : "DataNotPermitted",
        TokenEmpty: "TokenEmpty",
        UserNotSecurity: "UserNotSecurity",
        DataContabileMissing : "DataContabileMissing",
        AnonymousNotPermitted: "AnonymousNotPermitted", // only certain DataSet are readable without login
        FilterWithUndefined: "FilterWithUndefined"
    };

    /**
     * @constructor PostData
     * @description
     * Initializes the routing object. It set the backend url
     */
    function Routing() {
        "use strict";
        // appMeta.basePath = "http://localhost:54471/";
        appMeta.basePath = "/";
        this.connObj  = {};
        this.init();
    }

    Routing.prototype = {
        constructor: Routing,

        /**
         * @method changeUrlMethods
         * @public
         * @description SYNC
         * Utilizzata nei file html di debug. Ad esempio quelli sotto "test/testViewsHtml"
         * assegna la url passata per tuti i metodi
         * @param {string} prefixUrl the ip and port of the server for example http://localhost:54471
         */
        changeUrlMethods:function (prefixUrl) {
            this.backendUrl = prefixUrl;
            _.forEach(this.connObj, function (co) {
                co.url = prefixUrl + co.url;
            })
        },

        /**
         * @method methodRegistered
         * @public
         * @description SYNC
         * Returns the obj that represents the configuration for this web "method":
         * { method: method,
                    type: type,
                    url: appMeta.basePath + relativePath + "/" + method ,
                    multipleResult:multipleResult,
                    auth: auth
                }
         * @param {string} method
         * @returns {object|undefined}
         */
        methodRegistered:function (method) {
            return this.connObj[method];
        },

        /**
         * @method register
         * @public
         * @description SYNC
         * Called to register a new method, with custom url
         * @param {object} connObj {method type, url, multipleResult} type can be GET/POST/DELETE, url is absolute url for example http://mysite/mypath/method
         */
        register:function(connObj){
            this.connObj[connObj.method] = connObj
        },

        /**
         * @method builderConnObj
         * @private
         * @description SYNC
         * Builds a this.connObj object and registers it.
         * @param {string} method
         * @param {string} type GET/POST/DELETE
         * @param {string} relativePath relative path in the url
         * @param {boolean} multipleResult in true is managed with progress deferred
         * @param {boolean} auth undefined | true means need auth, false not need 
         */
        builderConnObj:function (method, type, relativePath, multipleResult, auth) {
            if (auth === undefined) auth = true;
            if (multipleResult === undefined) multipleResult = false;
         
            this.register(
                { method: method,
                    type: type,
                    url: appMeta.basePath + relativePath + "/" + method ,
                    multipleResult:multipleResult,
                    auth: auth
                });
        },

        /**
         * @method init
         * @private
         * @description SYNC
         * Initializes the configuration of the routing. For each backend method sets the typeGET/POST, server path, multipleResult
         */
        init:function () {
            // Metodi SOLO PER DEBUG e Unit test
            this.builderConnObj(methodEnum.getDataSetTest, 'GET', 'data', false, true);
            this.builderConnObj(methodEnum.getJsDataQuery, 'GET', 'data', false, true);
            this.builderConnObj(methodEnum.fromJsDataSetToDataset, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.fromJsDataQueryToSql, 'GET', 'data', false, true);
            
            this.builderConnObj(methodEnum.read, 'POST',  'static', false, true);
            
            // metodo di test e2e per le notify asincrone
            this.builderConnObj("testNotify", 'GET', 'data', true,true);

            // METODI LOGIN Autenticazione
            this.builderConnObj(methodEnum.login, 'POST', 'auth', false, false);
            this.builderConnObj(methodEnum.loginSSO, 'POST', 'auth', false, false);
            this.builderConnObj(methodEnum.loginLDAP, 'POST', 'auth', false, false);
            this.builderConnObj(methodEnum.register, 'POST', 'auth', false, false);
            this.builderConnObj(methodEnum.resetPassword, 'GET', 'auth', false, false);
            this.builderConnObj(methodEnum.nuovaPassword, 'GET', 'auth', false, false);
            this.builderConnObj(methodEnum.sendMail, 'POST', 'data', false, true);

            // Metodi vari utilizzati all'interno del codice per recupero dati dal database
            this.builderConnObj(methodEnum.selectCount, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.getPagedTable, 'POST', 'data', false, true);

            this.builderConnObj(methodEnum.getDataSet, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.prefillDataSet, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.fillDataSet, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.multiRunSelect, 'POST', 'data', true, true);
            this.builderConnObj(methodEnum.select, 'POST',  'data', false, true);
            this.builderConnObj(methodEnum.getDsByRowKey, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.createTableByName, 'GET', 'data', false, true);
            this.builderConnObj(methodEnum.getPrimaryTable, 'GET', 'data', false, true);
            this.builderConnObj(methodEnum.doGet, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.saveDataSet, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.getNewRow, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.getNewRowCopyChilds, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.describeColumns, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.describeTree, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.getSpecificChild, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.customServerMethod, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.setUsrEnv, 'POST', 'data', false, true);
            this.builderConnObj(methodEnum.doReadValue, 'POST', 'data', false, true);

            // cambio ruolo
            this.builderConnObj(methodEnum.cambiaRuolo, 'POST', 'data', false, true);

            // gestori attachment
            this.builderConnObj(methodEnum.uploadChunk, 'POST', 'file', false, true);
            this.builderConnObj(methodEnum.remove, 'DELETE', 'file', false, true);
            this.builderConnObj(methodEnum.download, 'GET', 'file', false, true);
            this.builderConnObj(methodEnum.downloadDbField, 'GET', 'file', false, true);

        }
    };

    appMeta.routing = new Routing();
    appMeta.routing.methodEnum = methodEnum;
    appMeta.routing.serverErrorTypeEnum = serverErrorTypeEnum;
}());


