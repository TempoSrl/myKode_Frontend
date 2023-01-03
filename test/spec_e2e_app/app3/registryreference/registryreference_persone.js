(function() {
    var MetaPage = window.appMeta.MetaPage;
    var q = window.jsDataQuery;
    
    function metaPage_registryreference_persone() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registryreference_persone';
        //this.startFilter = q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6), q.eq('idreg',4), q.eq('idreg',5));
    }

    metaPage_registryreference_persone.prototype = _.extend(
        new MetaPage('registryreference', 'persone', true),
        {
            constructor: metaPage_registryreference_persone,

            superClass: MetaPage.prototype
        });
    window.appMeta.addMetaPage('registryreference', 'persone', metaPage_registryreference_persone);
}());
