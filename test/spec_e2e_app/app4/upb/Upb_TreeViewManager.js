(function() {
    var TreeViewManager = window.appMeta.TreeViewManager;

    function Upb_TreeViewManager() {
        TreeViewManager.apply(this, arguments);
        this.doubleClickForSelect = false;
    }

    Upb_TreeViewManager.prototype = _.extend(
        new TreeViewManager(),
        {
            constructor: Upb_TreeViewManager,

            superClass: TreeViewManager.prototype

        });

    appMeta.CustomControl("treeUpb", Upb_TreeViewManager);
    appMeta.Upb_TreeViewManager = Upb_TreeViewManager;
}());
