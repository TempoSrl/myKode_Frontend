(function() {
    var MetaPage = window.appMeta.MetaPage;
    var q = window.jsDataQuery;
    function metaPage_registry() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registry';
        
    }

    metaPage_registry.prototype = _.extend(
        new MetaPage('registry', 'anagrafica', false),
        {
            constructor: metaPage_registry,

            superClass: MetaPage.prototype,

            /**
             * Metodo eridato da farne l'override
             */
            afterLink:function () {
               
                // OK 10.
                // metto uno staticFilter sulla tabella, per avere pochi record sulla combo
                 var startFilter = q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6), q.eq('idreg',1040471));
                 this.state.DS.tables.registry.staticFilter(startFilter);
            }
        });

    window.appMeta.addMetaPage('registry', 'anagrafica', metaPage_registry);
}());
