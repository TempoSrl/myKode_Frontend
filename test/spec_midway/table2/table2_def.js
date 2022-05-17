(function() {
    var MetaPage = window.appMeta.MetaPage;

    function metaPage_table2() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_table2';
    }

    metaPage_table2.prototype = _.extend(
        new MetaPage('table2', 'def', false),
        {
            constructor: metaPage_table2,
            method3: function(d) {
                return this.superClass.method3.call(this, d) * 2;
            },
            superClass: MetaPage.prototype           
        });

    window.appMeta.addMetaPage('table2', 'def', metaPage_table2);
}());
