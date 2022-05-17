(function() {
    var TreeNodeUnLeveled_Dispatcher = window.appMeta.TreeNodeUnLeveled_Dispatcher;
    var Deferred = appMeta.Deferred;
    var SimpleUnLeveled_TreeNode = appMeta.SimpleUnLeveled_TreeNode;
    function SimpleUnLeveled_TreeNode_Dispatcher(descrField, codeString) {
        TreeNodeUnLeveled_Dispatcher.apply(this, arguments);
        this.descrField = descrField;
        this.codeString = codeString;
    }

    SimpleUnLeveled_TreeNode_Dispatcher.prototype = _.extend(
        new TreeNodeUnLeveled_Dispatcher(),
        {
            constructor: SimpleUnLeveled_TreeNode_Dispatcher,

            superClass: TreeNodeUnLeveled_Dispatcher.prototype,

            /**
             * 
             */
            getNode:function (parentRow, childRow) {
                var def = Deferred("SimpleUnLeveled_TreeNode_Dispatcher-getNode");
                return def.resolve(new SimpleUnLeveled_TreeNode(childRow, this.descrField, this.codeString) );
            }

        });
    
    appMeta.SimpleUnLeveled_TreeNode_Dispatcher = SimpleUnLeveled_TreeNode_Dispatcher;

}());
