/**
 * @module TreeNodeUnLeveled
 * @description
 * Contains the structure to manage a node in a treeview unleveled structure
 */
(function() {
    var TreeNode = window.appMeta.TreeNode;
    var dataRowState = jsDataSet.dataRowState;
    /**
     * 
     * @param {ObjectRow} dataRow
     * @param descrField
     * @param codeString
     * @constructor
     */
    function TreeNodeUnLeveled(dataRow, descrField, codeString) {
        TreeNode.apply(this, [dataRow]);
        this.descrField = descrField;
        this.codeString = codeString;

        this.state = {};
        // popola la proprietà "text" eseenziale per fsr vededre il nodo
        this.nodeText();
    }

    TreeNodeUnLeveled.prototype = _.extend(
        new TreeNode(),
        {
            constructor: TreeNodeUnLeveled,

            superClass: TreeNode.prototype,

            /**
             * @method tooltip
             * @public
             * @description SYNC
             * Gets the tooltip string
             * @returns {string}
             */
            tooltip:function () {
                if (!this.rowExists())  return "";
                if (this.descrField)  return this.dataRow[this.descrField];
                if (this.codeString)  return this.dataRow[this.codeString];
                return "";
            },

            nodeText:function () {
                var stext = "";
                if (this.rowExists()) {
                    var r = this.dataRow.getRow();
                    if (this.descrField && r.table.columns[this.descrField]) {
                        if (this.codeString && r.state !== dataRowState.added) {
                            if (stext !== "") stext += " ";
                            stext += r.current[this.codeString];
                        }
                        if (r.table.columns[this.descrField] !== "") {
                            if (stext !== "") stext += " ";
                            stext += r.current[this.descrField];
                        }
                    } else if (this.codeString) {
                            if (stext !== "") stext += " ";
                            stext += r.current[this.codeString];
                    }
                }

                this.text = stext;
                return stext;
            }

        });

    appMeta.TreeNodeUnLeveled = TreeNodeUnLeveled;
}());
