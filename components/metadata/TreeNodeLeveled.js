/**
 * @module TreeNodeLeveled
 * @description
 * Contains the structure to manage a node in a treeview leveled structure
 */
(function() {
    var TreeNode = window.appMeta.TreeNode;
    var dataRowState = jsDataSet.dataRowState;
    var Deferred = appMeta.Deferred;
    
    function TreeNodeLeveled(dataRow, 
                             level_table,
                             level_field,
                             descr_level_field,
                             selectable_level_field,
                             descr_field, 
                             code_string) {
        
        TreeNode.apply(this, [dataRow]);
        
        this.level_table = level_table;
        this.level_field = level_field;
        this.descr_level_field = descr_level_field;
        this.selectable_level_field = selectable_level_field;
        this.code_string = code_string;
        this.descr_field = descr_field;

        // popola la proprietà "text" essenziale per fsr vedere il nodo
        this.nodeText();
    }

    TreeNodeLeveled.prototype = _.extend(
        new TreeNode(),
        {
            constructor: TreeNodeLeveled,

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
                if (this.descr_field)  return this.dataRow[this.descr_field];
                if (this.code_string)  return this.dataRow[this.code_string];
                return "";
            },

            /**
             * @method canSelect
             * @public
             * @description SYNC
             * @returns {Deferred(boolean)}
             */
            canSelect:function () {
                var def = Deferred("TreeNodeLeveled_CanSelect")
                if (!this.rowExists()) return def.resolve(false);
                if (!this.selectable_level_field) return  def.resolve(true);
                var levRow = this.levelRow();
                if (!levRow) return  def.resolve(true);
                if (levRow[this.selectable_level_field].toLowerCase() === "n")  return def.resolve(false);
                if (this.hasAutoChildren()) return  def.resolve(false);
                return def.resolve(true);
            },

            /**
             *
             */
            nodeText:function () {
                var stext = this.descrLevel();
                if (this.rowExists()){
                    var r = this.dataRow.getRow();
                    if (this.descr_field && r.table.columns[this.descr_field]) {
                        if (this.code_string) {
                            if (stext !== "") stext += " ";
                            stext += r.current[this.code_string];
                        }
                        if (r.table.columns[this.descr_field] !== "") {
                            if (stext !== "") stext += " ";
                            stext += r.current[this.descr_field];
                        }
                    } else {
                        if (this.code_string) {
                            if (stext !== "") stext += " ";
                            stext += r.current[this.code_string];
                        }
                    }
                }

                this.text = stext;
                return stext;
            },

            rowExists:function(){
                if (!this.dataRow) return false;
                if (!this.dataRow.getRow) return false;
                if (this.dataRow.getRow().state === dataRowState.deleted || this.dataRow.getRow().state === dataRowState.detached ) return false;
                return true;
            },

            /**
             *
             * @returns {DataRow[]}
             */
            levelRow:function () {
                if (!this.rowExists()) return null;
                var self = this;
                var r = this.dataRow.getRow();
                var rowsFound = null;
                _.forEach( r.table.parentRelations(), function (rel) {
                    if (rel.parentTable === self.level_table) {
                        rowsFound = r.getParentRows(rel.name);
                        return false;
                    }
                });

                return rowsFound;
            },

            /**
             *
             * @returns {boolean}
             */
            hasAutoChildren:function () {
                var rfound = null;
                var r = this.dataRow.getRow();
                _.forEach( r.table.parentRelations(), function (rel) {
                    if (rel.parentTable === r.table.name){
                        rfound = rel;
                    }
                });
                if (!rfound) return false;
                return (r.getChildRows(rfound.name).length > 0);
            },

            /**
             *
             * @returns {string}
             */
            descrLevel:function(){
                if (!this.rowExists()) return "";
                var levRows = this.levelRow();
                if (!levRows) return "";
                if (!levRows.length) return "";
                return levRows[0][this.descr_level_field];
            },

        });

    appMeta.TreeNodeLeveled = TreeNodeLeveled;
}());
