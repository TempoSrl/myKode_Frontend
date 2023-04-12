(function() {
    var MetaData = window.appMeta.MetaData;
    
    function meta_registryreference() {
        MetaData.apply(this, arguments);
        this.name = 'meta_registryreference';

        this.visibleColumns = ["idreg", "email","phonenumber","lu", "referencename","skypenumber"];
    }

    meta_registryreference.prototype = _.extend(
        new MetaData("registryreference"),
        {
            constructor: meta_registryreference,

            superClass: MetaData.prototype,

            /**
             * @method describeColumns
             * @public
             * @description SYNC
             * Describes a listing type (captions, column order, formulas, column formats and so on)
             * @param {DataTable} table
             * @param {string} listType
             * @returns {*}
             */
            describeColumns: function (table, listType) {
                var self = this;
                return this.superClass.describeColumns(table, listType)
                    .then(function () {
                        // In questo esempio nascondo le colonne che non sono nell'array
                        //console.log("describe columns "+listType+" of "+table.name)
                        _.forEach(table.columns, function (c) {
                            if (self.visibleColumns.indexOf(c.name) === -1 ){
                                c.caption = "." + c.name;
                            }
                        });

                        return true;
                    });

            },

            getNewRow:function (parentRow, dtDest) {
                //console.log("invoking getNewRow of registryreference")
                dtDest.autoIncrement('idregistryreference', { selector:["idreg"] });
                let res = this.superClass.getNewRow(parentRow,dtDest);
                //res.then((x)=>console.log(x));
                return res;
            },
            /**
             *
             * @param {DataTable} table
             */
            setDefaults: function(table) {
                //console.log("invoking setDefaults of registryreference")
                // si intende che il datatable sia già corredato dai defaults per come è stato deserializzato dal server
                // questo metodo può contenere al massimo delle personalizzazioni
                // La colonna title su registry in inserimento non accetta null, quindi aggiungo un defualt.
                if(table.columns["cu"]){
                        table.defaults({"cu":this.security.sys('user')});
                }
                if(table.columns["ct"]){
                    table.defaults({"ct":new Date()});
                }
                if(table.columns["lu"]){
                    table.defaults({"lu":this.security.sys('user')});
                }
                if(table.columns["lt"]){
                    table.defaults({"lt":new Date()});
                }

                // Indagare perchè il metaDato del server non ci pensa lui
                if (table.columns["flagdefault"]){
                   table.defaults({flagdefault: "N"}); // la defaults è un _assign, quindi non sovrascrive tutta la coll defaults, ma aggiunge la proprietà
                 }
            }

        });
    //console.log("adding meta registryreference")
    window.appMeta.addMeta('registryreference', new meta_registryreference('registryreference'));
}());
