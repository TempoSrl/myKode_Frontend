(function() {
    var TreeNode_Dispatcher = window.appMeta.TreeNode_Dispatcher;
    var Deferred = appMeta.Deferred;
    var TreeNodeUnLeveled = appMeta.TreeNodeUnLeveled;
    function TreeNodeUnLeveled_Dispatcher(descrField, codeString) {
        TreeNode_Dispatcher.apply(this, []);
        this.descrField = descrField;
        this.codeString = codeString;
    }

    TreeNodeUnLeveled_Dispatcher.prototype = _.extend(
        new TreeNode_Dispatcher(),
        {
            constructor: TreeNodeUnLeveled_Dispatcher,

            superClass: TreeNode_Dispatcher.prototype,

            /**
             *
             */
            getNode:function (parentRow, childRow) {
                var def = Deferred("TreeNodeUnLeveled-getNode");

                return def.resolve(new TreeNodeUnLeveled(childRow, this.descrField, this.codeString) );
            }

        });

    appMeta.TreeNodeUnLeveled_Dispatcher = TreeNodeUnLeveled_Dispatcher;

}());
