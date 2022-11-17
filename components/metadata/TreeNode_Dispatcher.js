/**
 * @module TreeNode_Dispatcher
 * @description
 * Contains the strucuture to manage a node in a treeview structure
 */
(function () {
    
    var Deferred = appMeta.Deferred;
    
    /**
     * @constructor
     * Base (empty) class able to create a tree_node, given Parent DataRow and
     * a new Child DataRow.
     * @returns {TreeNode_Dispatcher}
     */
    function TreeNode_Dispatcher() {
        return this;
    }

    TreeNode_Dispatcher.prototype = {
        constructor: TreeNode_Dispatcher,

        /**
         * @method getNode
         * @public
         * @description ASYNC
         * To override. It builds the TreeNode starting from the info on the parentRow and childRow
         * @param {DataRow} parentRow
         * @param {DataRow} childRow
         * @returns {Deferred<TreeNode>}
         */
        getNode:function (parentRow, childRow) {
            var def = Deferred("getNode");
            return def.resolve(null);
        }

    };
    
    appMeta.TreeNode_Dispatcher = TreeNode_Dispatcher;

}());