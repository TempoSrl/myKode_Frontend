(function() {
    var MetaPage = window.appMeta.MetaPage;
    var q = window.jsDataQuery;
    
    function metaPage_registryreference() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registryreference';   
        this.startFilter = q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6), q.eq('idreg',4), q.eq('idreg',5));
    }

    metaPage_registryreference.prototype = _.extend(
        new MetaPage('registry', 'reference', true),
        {
            constructor: metaPage_registryreference,

            superClass: MetaPage.prototype
        });

    window.appMeta.addMetaPage('registry', 'reference', metaPage_registryreference);
}());
