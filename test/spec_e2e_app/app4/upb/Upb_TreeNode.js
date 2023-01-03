(function() {
    var TreeNode = window.appMeta.TreeNode;

    function Upb_TreeNode(dataRow, descrField, codeString) {
        TreeNode.apply(this, arguments);
        this.descrField = descrField;
        this.codeString = codeString;
    }

    Upb_TreeNode.prototype = _.extend(
        new TreeNode(),
        {
            constructor: Upb_TreeNode,

            superClass: TreeNode.prototype,

            nodeText:function () {
                var stext = "";
                if (this.rowExists()) {
                    var r = this.dataRow.getRow();
                    if (this.descrField && r.table.columns[this.descrField]) {
                        if (this.codeString && r.state !== jsDataSet.dataRowState.added) {
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

    appMeta.Upb_TreeNode = Upb_TreeNode;
}());
