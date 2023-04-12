(function() {
    var MetaData = window.appMeta.MetaData;
    
    function metaData_registry() {
        MetaData.apply(this, arguments);
        this.name = 'metaData_registry';

        this.visibleColumns = ["idreg", "annotation","forename","lu", "p_iva","title"];
    }

    metaData_registry.prototype = _.extend( 
        new MetaData("registry"),
        {
            constructor: metaData_registry,

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
                        _.forEach(table.columns, function (c) {
                            if (self.visibleColumns.indexOf(c.name) === -1 ){
                                c.caption = "." + c.name;
                            }
                        });

                        return true;
                    });

            },

            primaryKey: function(){
              return ["idreg"];
            },


            getNewRow:function (parentRow, dtDest) {
                dtDest.autoIncrement('idreg',{minimum:990000});
                return this.superClass.getNewRow(parentRow,dtDest);
            },

            /**
             *
             * @param {DataTable} table
             */
            setDefaults: function(table) {
                // si intende che il datatable sia già corredato dai defaults per come è stato deserializzato dal server
                // questo metodo può contenere al massimo delle personalizzazioni
                // La colonna title su registry in inserimento non accetta null, quindi aggiungo un defualt.

                // Indagare perchè il metaDato del server non ci pensa lui
                if (table.columns["title"]){
                    table.defaults({title: "default title"}); // la defaults è un _assign, quindi non sovrascrive tutta la coll defaults, ma aggiunge la proprietà
                }
            }

        });
    window.appMeta.addMeta('registry', new metaData_registry('registry'));
}());
