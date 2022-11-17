(function() {
    var TreeNode_Dispatcher = window.appMeta.TreeNode_Dispatcher;
    var Deferred = appMeta.Deferred;
    var Upb_TreeNode = appMeta.Upb_TreeNode;
    function Upb_TreeNode_Dispatcher(descrField, codeString) {
        TreeNode_Dispatcher.apply(this, arguments);
        this.descrField = descrField;
        this.codeString = codeString;
    }

    Upb_TreeNode_Dispatcher.prototype = _.extend(
        new TreeNode_Dispatcher(),
        {
            constructor: Upb_TreeNode_Dispatcher,

            superClass: TreeNode_Dispatcher.prototype,

            /**
             * 
             */
            getNode:function (parentRow, childRow) {
                var def = Deferred("Upb_TreeNode_Dispatcher-getNode");

                return def.resolve(new Upb_TreeNode(this.descrField, this.codeString, childRow) );
            }

        });
    
    appMeta.Upb_TreeNode_Dispatcher = Upb_TreeNode_Dispatcher;

}());
