/**
 * @module MultiSelectControl
 * @description
 * Manages the security of the data actions (insert/update/delete)
 */
(function () {

    var methodEnum = appMeta.routing.methodEnum;
    var Deferred = appMeta.Deferred;

    /**
     * @constructor Security
     * @description
     * Initializes the security objects.
     */
    function Security() {
        "use strict";
        this.sysEnv = {};
        this.usrEnv = {};
    }

    Security.prototype = {
        constructor: Security,

        /**
         * @method init
         * @public
         * @description SYNC
         */
        init:function () {

        },

        /**
         * @method clear
         * @public
         * @description SYNC
         * Empties variables for user and system environment
         */
        clear:function () {
            this.sysEnv = {};
            this.usrEnv = {};
            window.localStorage.removeItem('mdl_usr');
            window.localStorage.removeItem('mdl_sys');
        },

        /**
         * Returns true if environment is not empty
         * @returns {boolean}
         */
        isEnvironmentSet:function() {
            if (this.usrEnv && Object.keys(this.usrEnv).length > 0 ){
                return true;
            }
            return false;
        },

        loadSession:function () {
            this.usrEnv = JSON.parse(window.localStorage.getItem('mdl_usr'));
            this.sysEnv = JSON.parse(window.localStorage.getItem('mdl_sys'));
            // se al momento di settare la sessione, magari quando il browser trova il token ma non le usr env
            // inizializzo a vuoto per evitare eventuali errori di undefiend durante la costruzione
            if (!this.usrEnv) {
                this.usrEnv = {};
            }
            if (!this.sysEnv) {
                this.sysEnv = {};
            }
        },

        saveSession:function () {
            window.localStorage.setItem('mdl_usr', JSON.stringify(this.usrEnv));
            window.localStorage.setItem('mdl_sys', JSON.stringify(this.sysEnv));
        },

        /**
         * @method sys
         * @public
         * @description SYNC
         * Gets/Sets system environment variable
         * @param {string} key
         * @param {object} value
         * @returns {object}
         */
        sys:function (key, value) {
            // TODO. only for debug
            //if (key === "esercizio") return "2019";

            if (value !== undefined) this.sysEnv[key] = value;
            return this.sysEnv[key];
        },

         /**
         * @method usr
         * @internal
         * @description SYNC
         * Sets user environment variable without updating storage
         * @param {string} key
         * @param {object} value
         * @returns {object}
         */
        internalSetUsr: function (key, value) {
            this.usrEnv[key] = value;
        },
        /**
         * @method usr
         * @public
         * @description SYNC
         * Gets/Sets user environment variable updating  
         * @param {string} key
         * @param {object} value
         * @returns {object}
         */
        usr:function (key, value) {
            if (value !== undefined) {
                this.usrEnv[key] = value;
                window.localStorage.setItem('mdl_usr', JSON.stringify(this.usrEnv));
                // osservo se sono filtri sql serializzati in jsDatQuery e li deserializzo
                //if (key.toString().indexOf("cond_sor0") > 0) this.usrEnv[key] = appMeta.getDataUtils.getJsDataQueryFromJson(value);
            }
            return this.usrEnv[key];
        },

        /**
         * @method canSelect
         * @public
         * @description SYNC
         * Returns true if row "r" can be selected
         * @param {DataRow} r
         * @returns {boolean}
         */
        canSelect:function (r) {
            return appMeta.Deferred("Security-canSelect").resolve(true);
        },

        /**
         * @method cantUnconditionallyPost
         * @public
         * @description SYNC
         * @param {DataTable} dt
         * @param {string} opkind
         * @returns {boolean}
         */
        cantUnconditionallyPost:function (dt, opkind) {
            return false;
        },

        /**
         * @method canPost
         * @public
         * @description SYNC
         * Returns true if the rows can be posted
         * @param {DataRow} r
         * @returns {boolean}
         */
        canPost:function (r) {
            return true;
        },

        /**
         * @method isSystemAdmin
         * @public
         * @description SYNC
         * Returns true if current user has sysadmin membership
         * @returns {boolean}
         */
        isSystemAdmin:function () {
            return false;
        },

        /**
         * @method deleteAllUnselectable
         * @public
         * @description SYNC
         * Deletes all rows from "t" that are not allowed to be selected
         * @param {DataTable} t
         */
        deleteAllUnselectable:function (t) {
            // TODO
        },

        /**
         * @method setUsrEnvOnBackend
         * @public
         * @description ASYNC
         * Sets the "value" fro the security environment variable "keyusr"
         * @param {string} keyusr the key of the user environment to set
         * @param {string} value the value tos et for the usr env. variable "keyusr"
         */
        setUsrEnvOnBackend:function (keyusr, value) {
            var def = Deferred("setUsrEnv");

            // set in locale e anche sul backend
            this.usr(keyusr, value);

            var objConn = {
                method: methodEnum.setUsrEnv,
                prm: {
                    key: keyusr,
                    value: value
                }
            };

            appMeta.connection.call(objConn)
                .then(function (jsonRes) {
                    def.resolve(jsonRes);
                },function(err) {
                    console.log("Error setUsrEnv " + err);
                    def.reject(false);
                });

            return def.promise();
        },

        isAdmin: function () {
            // default sarà false
            return true;
        }

    };

    appMeta.security = new Security();
}());


