(function() {
    var TreeNode = window.appMeta.TreeNode;

    function Upb_TreeNode() {
        TreeNode.apply(this, arguments);
    }

    Upb_TreeNode.prototype = _.extend(
        new TreeNode(),
        {
            constructor: Upb_TreeNode,

            superClass: TreeNode.prototype
            
        });

    appMeta.Upb_TreeNode = Upb_TreeNode;
}());
