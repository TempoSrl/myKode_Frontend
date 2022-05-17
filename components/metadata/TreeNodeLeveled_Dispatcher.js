(function() {
    var TreeNode_Dispatcher = window.appMeta.TreeNode_Dispatcher;
    var Deferred = appMeta.Deferred;
    var TreeNodeLeveled = appMeta.TreeNodeLeveled;
    function TreeNodeLeveled_Dispatcher( level_table,
                                         level_field,
                                         descr_level_field,
                                         selectable_level_field,
                                         descr_field,
                                         code_string) {
        TreeNode_Dispatcher.apply(this, []);
        this.level_table = level_table;
        this.level_field = level_field;
        this.descr_level_field = descr_level_field;
        this.selectable_level_field = selectable_level_field;
        this.descr_field = descr_field;
        this.code_string = code_string;
    }

    TreeNodeLeveled_Dispatcher.prototype = _.extend(
        new TreeNode_Dispatcher(),
        {
            constructor: TreeNodeLeveled_Dispatcher,

            superClass: TreeNode_Dispatcher.prototype,

            /**
             * @method getNode
             * @public
             * @description ASYNC
             * To override. It builds the TreeNode starting from the info on the parentRow and childRow
             * @param {DataRow} parentRow
             * @param {DataRow} childRow
             * @returns {Deferred(TreeNodeLeveled)}
             */
            getNode:function (parentRow, childRow) {
                var def = Deferred("TreeNodeLeveled_Dispatcher-getNode");

                return def.resolve(new TreeNodeLeveled(childRow,
                    this.level_table,
                    this.level_field,
                    this.descr_level_field,
                    this.selectable_level_field,
                    this.descr_field,
                    this.code_string));
            }

        });

    appMeta.TreeNodeLeveled_Dispatcher = TreeNodeLeveled_Dispatcher;

}());