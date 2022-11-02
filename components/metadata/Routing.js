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
        setUsrEnv: "setUsrEnv",
        doReadValue: "doReadValue",
        customServerMethod: "customServerMethod",

        read : "read",
       

        uploadChunk: "uploadChunk",
        remove : "remove",
        download : "download",

        downloadDbField: "downloadDbField",
       
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
        this.services  = {};
        this.init();
        this.backendUrl = "";
    }

    Routing.prototype = {
        constructor: Routing,


        /**
         * @method setUrlPrefix
         * @public
         * @description SYNC
         * Utilizzata nei file html di debug. Ad esempio quelli sotto "test/testViewsHtml"
         * assegna la url passata per tuti i metodi
         * @param {string} prefixUrl the ip and port of the server for example http://localhost:54471
         */
        setUrlPrefix:function (prefixUrl) {
            this.backendUrl = prefixUrl;
            //_.forEach(this.services, function (s) {
            //    s.url = prefixUrl + s.url;
            //})
        },

        /**
         * @method getMethod     //ex methodRegistered
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
        getMethod:function (method) {
            var ss = this.services[method];
            if (!ss) return ss;
            var service = _.clone(ss)
            service.url = this.backendUrl+service.url;
            return service;
        },

        /**
         * @method register
         * @public
         * @description SYNC
         * Called to register a new method, with custom url
         * @param {object} service {method type, url, multipleResult} type can be GET/POST/DELETE, url is absolute url for example http://mysite/mypath/method
         */
        register:function(service){
            this.services[service.method] = service
        },

        /**
         * @method registerService
         * @private
         * @description SYNC
         * Invokes register with service params
         * @param {string} method
         * @param {string} type GET/POST/DELETE
         * @param {string} relativePath relative path in the url
         * @param {boolean} multipleResult in true is managed with progress deferred
         * @param {boolean} auth undefined | true means need auth, false doesn't need 
         */
        registerService:function (method, type, relativePath, multipleResult, auth) {
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

        builderConnObj:function (method, type, relativePath, multipleResult, auth) {
            this.registerService(method, type, relativePath, multipleResult, auth);
        },
        /**
         * @method init
         * @private
         * @description SYNC
         * Initializes the configuration of the routing. For each backend method sets the typeGET/POST, server path, multipleResult
         */
        init:function () {
            // Metodi SOLO PER DEBUG e Unit test
            this.registerService(methodEnum.getDataSetTest, 'GET', 'data', false, true);
            this.registerService(methodEnum.getJsDataQuery, 'GET', 'data', false, true);
            this.registerService(methodEnum.fromJsDataSetToDataset, 'POST', 'data', false, true);
            this.registerService(methodEnum.fromJsDataQueryToSql, 'GET', 'data', false, true);
            
            this.registerService(methodEnum.read, 'POST',  'static', false, true);
            
            // metodo di test e2e per le notify asincrone
            this.registerService("testNotify", 'GET', 'data', true,true);

         

            // Metodi vari utilizzati all'interno del codice per recupero dati dal database
            this.registerService(methodEnum.selectCount, 'POST', 'data', false, true);
            this.registerService(methodEnum.getPagedTable, 'POST', 'data', false, true);

            this.registerService(methodEnum.getDataSet, 'POST', 'data', false, true);
            this.registerService(methodEnum.prefillDataSet, 'POST', 'data', false, true);
            this.registerService(methodEnum.fillDataSet, 'POST', 'data', false, true);
            this.registerService(methodEnum.multiRunSelect, 'POST', 'data', true, true);
            this.registerService(methodEnum.select, 'POST',  'data', false, true);
            this.registerService(methodEnum.getDsByRowKey, 'POST', 'data', false, true);
            this.registerService(methodEnum.createTableByName, 'GET', 'data', false, true);
            this.registerService(methodEnum.getPrimaryTable, 'GET', 'data', false, true);
            this.registerService(methodEnum.doGet, 'POST', 'data', false, true);
            this.registerService(methodEnum.saveDataSet, 'POST', 'data', false, true);
            this.registerService(methodEnum.getNewRow, 'POST', 'data', false, true);
            this.registerService(methodEnum.describeColumns, 'POST', 'data', false, true);
            this.registerService(methodEnum.describeTree, 'POST', 'data', false, true);
            this.registerService(methodEnum.getSpecificChild, 'POST', 'data', false, true);
            this.registerService(methodEnum.customServerMethod, 'POST', 'data', false, true);
            this.registerService(methodEnum.setUsrEnv, 'POST', 'data', false, true);
            this.registerService(methodEnum.doReadValue, 'POST', 'data', false, true);

          

            // gestori attachment
            this.registerService(methodEnum.uploadChunk, 'POST', 'file', false, true);
            this.registerService(methodEnum.remove, 'DELETE', 'file', false, true);
            this.registerService(methodEnum.download, 'GET', 'file', false, true);
            this.registerService(methodEnum.downloadDbField, 'GET', 'file', false, true);

        }
    };

    appMeta.routing = new Routing();
    appMeta.routing.methodEnum = methodEnum;
    appMeta.routing.serverErrorTypeEnum = serverErrorTypeEnum;
}());


