(function() {
    var MetaPage = window.appMeta.MetaPage;
    var q = window.jsDataQuery;
    
    function metaPage_registry_reference() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registry_reference';
        this.startFilter = q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6), q.eq('idreg',4), q.eq('idreg',5));
    }

    metaPage_registry_reference.prototype = _.extend(
        new MetaPage('registry', 'reference', true),
        {
            constructor: metaPage_registry_reference,

            superClass: MetaPage.prototype
        });

    window.appMeta.addMetaPage('registry', 'reference', metaPage_registry_reference);
}());
