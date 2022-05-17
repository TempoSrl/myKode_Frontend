/**
 * @module MetaPageState
 * @description
 * Represents the state of the MetaPage
 */
(function() {

    /**
     * @constructor
     * @description
     * Initializes the status of the MetaPage
     */
    function MetaPageState() {
        "use strict";

        /**
         * Linked metaData
         * @type {MetaData}
         */
        this.meta = null;
        
        /**
         * Extra parameters inherited from parent table
         */
        this.extraParameters = null;

        //Optional manage parameters
        this.manageParams = {};

        /**
         * Used in parent page, and copied to child properties on activation
         */
        this.toInherit = {}

        /**
         * All the parameters that have to be move from parent to detail MetaPage
         * @type {{}}
         */
        this.callingParameters = {};

        /**
         * Page State of caller page
         * @type {PageState}
         */
        this.callerState = null;


        /**
         * Page State of caller page
         * @type {MetaPage}
         */
        this.callerPage = null;

        /**
         * ObjectRow selected in the called page (usually invoking a mainselect command)
         */
        this.calledPageSelectedRow = null;

        /**
         * Row of this form actually being edited in a child page
         * @type {DataRow}
         */
        this.editedRow = null;      // nel form chiamato diventa (this.)sourceRow()

        /**
         * called page should return a row
         * @type {boolean}
         */
        this.wantsRow = null;

        this.customVars = {};


        /**
         *
         * @type {DataSet}
         */
        this.DS = null;

        /**
         * Current edited row in the main table
         */
        this.currentRow = null;

        /**
         * SubEntity list
         * @type {}
         */
        this.extraEntities = {};

        /**
         * Hash of webAutoInfo
         * @type {{}}
         */
        this.AE = {};

        this.setSearchState();

        /**
         *
         * Used to manager leave events
         * last valid value of the focused input text (if any)
         * @type {string}
         */
        this.lastTextNotFound = "#";

        this.closeDisabled = false;

        return this;
    }

    MetaPageState.prototype = {
        constructor: MetaPageState,
        
        clearCallingParameter: function() {
	        this.callingParameters = {};
        },
        /**
         * gets the parameter set on parent page when calling this page
         * @param {string} paramName
         */
        getCallingParameter: function(paramName) {
	        if (!this.callerState) return undefined;
	        return this.callerState.callingParameters[paramName];
        },

        /**
         * Sets a parameter to be used in the next page call
         * @param {string} paramName
         * @param {object} value
         */
        setCallingParameter: function(paramName,value) {
	        this.callingParameters[paramName] = value;
        },


        /**
         * @method addExtraEntity
         * @public
         * @description SYNC
         * Add the table "tableName" to the extraEntities collection
         * @param tableName
         */
        addExtraEntity: function (tableName) {
            this.extraEntities[tableName] = tableName;
        },

        /**
         * @method setSearchState
         * @public
         * @description SYNC
         * Sets the state of the form to "search"
         */
        setSearchState: function() {
            this.formState = "search";
        },

        /**
         * @method isSearchState
         * @public
         * @description SYNC
         * Returns true if the state of the form is "search", false otherwise
         * @returns {boolean}
         */
        isSearchState: function() {
            return this.formState === "search";
        },

        /**
         * method setEditState
         * @public
         * @description SYNC
         * Sets the state of the form to "edit"
         */
        setEditState: function() {
            this.formState = "edit";
        },

        /**
         * @method isEditState
         * @public
         * @description SYNC
         * Returns true if the state of the form is "edit", false otherwise
         * @returns {boolean}
         */
        isEditState: function() {
            return this.formState === "edit";
        },

        /**
         * @method setInsertState
         * @public
         * @description SYNC
         * Sets the state of the form to "insert"
         */
        setInsertState: function() {
            this.formState = "insert";
        },

        /**
         * @method isInsertState
         * @public
         * @description SYNC
         * Returns true if the state of the form is "insert", false otherwise
         * @returns {boolean}
         */
        isInsertState: function() {
            return this.formState === "insert";
        },

        /**
         * @method sourceRow
         * @public
         * @description SYNC
         * Returns the edited row of the caller state.
         * @returns {DataRow}
         */
        sourceRow: function () {
            if (!this.callerState) return null;
            return this.callerState.editedRow;
        }

    };

    window.appMeta.MetaPageState = MetaPageState;
}
());
