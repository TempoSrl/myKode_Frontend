(function() {
    var MetaData = window.appMeta.MetaData;
    var q = window.jsDataQuery;

    function Meta_upb() {
       MetaData.apply(this, ["upb"]);
       this.name = 'meta_upb';
   }



    Meta_upb.prototype = _.extend(
        new MetaData(),
        {
            constructor: Meta_upb,

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

                let treeDescr = null;
                if ( listType === "tree") {
                    // Torno il dt popolato solo con i dati che mi aspetto
                    treeDescr = {
                        "withdescr": false,
                        "rootCondition": q.isNull("paridupb"),
                        "maxDepth": 9
                        };
                }

                // lato server torna rootcondition e poi vedremo cosa altro
                let res = treeDescr;
                // N.B: ----> quando ritorno al treeview chiamante, torno le proprietà custom che si aspetta.
                // il default si aspetta solo "rootCondition"

                let maxDepth = res.maxDepth;
                let withdescr = res.withdescr;
                let rootCondition = res.rootCondition;

                // instanzio il dispatcher giusto
                let nodedispatcher = new appMeta.Upb_TreeNode_Dispatcher("title", "codeupb");

                // torno al treeviewManger che ha invocato la resove con i prm attesi, che sono tutti e solo quelli che utilizza

                return appMeta.Deferred().resolve({
                    rootCondition:rootCondition,
                    nodeDispatcher: nodedispatcher
                }).promise();
            }

        });


    window.appMeta.addMeta('upb', new Meta_upb('upb'));
}());