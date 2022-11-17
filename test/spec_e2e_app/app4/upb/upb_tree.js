(function() {
    var MetaPage = window.appMeta.MetaPage;
   
    function metaPage_upb() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_upb';
        this.isList = true;
        this.isTree = true;
    }

    metaPage_upb.prototype = _.extend(
        new MetaPage('upb', 'tree', false),
        {
            constructor: metaPage_upb,

            superClass: MetaPage.prototype
        }
    );

    window.appMeta.addMetaPage('upb', 'tree', metaPage_upb);
}());
