(function() {
    var MetaPage = window.appMeta.MetaPage;

    function metaPage_table1(tableName,editType) {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_table1';

    }

    metaPage_table1.prototype = _.extend(
        new MetaPage('table1', 'def', false),
        {
            constructor: metaPage_table1,
            method3: function(d) {
                return this.superClass.method3.call(this, d) * 2;
            },
            superClass: MetaPage.prototype           
        });

    window.appMeta.addMetaPage('table1', 'def', metaPage_table1);
   
}());
