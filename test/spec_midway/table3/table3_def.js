(function() {
    var MetaPage = window.appMeta.MetaPage;

    function metaPage_table3() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_table3';
    }

    metaPage_table3.prototype = _.extend(
        new MetaPage('table3', 'def', false),
        {
            constructor: metaPage_table3,
            method3: function(d) {
                return this.superClass.method3.call(this, d) * 2;
            },
            superClass: MetaPage.prototype           
        });

    window.appMeta.addMetaPage('table3', 'def', metaPage_table3);
}());
