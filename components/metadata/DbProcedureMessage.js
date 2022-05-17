/**
 * @module DbProcedureMessage
 * @description
 * Contains a model for a database message object.
 */
(function () {

    /**
     * @constructor DbProcedureMessage
     * @description
     * Accepts all the parameters to build a model for a database message object.
     * @param {String} id
     * @param {String} description
     * @param {String} audit
     * @param {String} severity
     * @param {String} table
     * @param {Boolean} canIgnore
     */
    function DbProcedureMessage(id, description, audit, severity, table, canIgnore) {
        if (this.constructor !== DbProcedureMessage) {
            return new DbProcedureMessage(id, description, audit, severity, table, canIgnore);
        }
        this.id = id; // pre_post + "/" + pm.TableName + "/" + pm.Operation.Substring(0, 1) + "/" + pm.EnforcementNumber.ToString() || dberror
        this.description = description;
        this.audit = audit;
        this.severity = severity; // "Errore" || "Avvertimento" || "Disabilitata"
        this.table = table;
        this.canIgnore = canIgnore; // true/false
        return this;

    }

    DbProcedureMessage.prototype = {
        constructor: DbProcedureMessage
    };

    appMeta.DbProcedureMessage = DbProcedureMessage;

}());
