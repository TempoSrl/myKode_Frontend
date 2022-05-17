(function() {
    var MetaPage = window.appMeta.MetaPage;

    function metaPage_registry() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registry';
    }

    metaPage_registry.prototype = _.extend(
        {
            constructor: metaPage_registry,
            method3: function(d) {
                return this.superClass.method3.call(this, d) * 2;
            },
            superClass: MetaPage.prototype
        },  new MetaPage("registry", "anagrafica", false));

    window.appMeta.addMetaPage('registry', 'anagrafica', metaPage_registry);
}());
