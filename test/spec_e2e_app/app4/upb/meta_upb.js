(function() {
    var MetaData = window.appMeta.MetaData;
    var getData = window.appMeta.getData;
    var getDataUtils = window.appMeta.getDataUtils;
    var Deferred = window.appMeta.Deferred;
    function meta_upb() {
        MetaData.apply(this, ["upb"]);
        this.name = 'meta_upb';
    }

    meta_upb.prototype = _.extend(
        new MetaData(),
        {
            constructor: meta_upb,

            superClass: MetaData.prototype,

            /**
             * @method describeColumns
             * @public
             * @description SYNC
             * Describes a listing type (captions, column order, formulas, column formats and so on)
             * @param {DataTable} table
             * @param {string} listType
             * @returns {Deferred}
             */
            describeTree: function (table, listType) {
                var def = Deferred("meta_upb-describeTree");

                // lato server torna rootcondition e poi vedremo cosa altro
                var resDef = getData.describeTree(table.name, listType)
                // N.B: ----> quando ritorno al treeview chiamante, torno le proprietà cusotm che si aspetta.
                // il default si aspetta solo  "rootCondition"
                    .then(function (res) {

                        var maxDepth = res.maxDepth;
                        var withdescr = res.withdescr;
                        var rootCondition = getDataUtils.getJsDataQueryFromJson(res.rootCondition);

                        // instanzio il dispatcher giusto
                        var nodedispatcher = new appMeta.Upb_TreeNode_Dispatcher("title", "codeupb");

                        // torno al treeviewManger che ha invocato la resove con i prm attesi, che sono tutti e solo quelli che utilizza
                        def.resolve({
                            rootCondition:rootCondition,
                            nodeDispatcher: nodedispatcher
                        })
                    });

                return def.from(resDef).promise();
            }

        });

    window.appMeta.addMeta('upb', new meta_upb('upb'));
}());
