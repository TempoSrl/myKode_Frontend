'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */



describe('GetData', function () {
    var getData;
    var localResource = appMeta.localResource;
    var metaModel = appMeta.metaModel;
    var q = window.jsDataQuery;
    var dataRowState = jsDataSet.dataRowState;
    var getDataUtils = appMeta.getDataUtils;

    beforeEach(function() {
        //jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
        getData = appMeta.getData;
    })

    describe("getData class",
        function () {

            it('exists getData',
                function () {
                    expect(getData).toBeDefined();
                });

            it('exists metaModel',
                function () {
                    expect(metaModel).toBeDefined();
                });

            it('exists metaexpression',
               function () {
                   expect(q).toBeDefined();
               });

            it('GetData constructor is GetData ',
               function () {
                   expect(getData.constructor.name).toBe("GetData");
               });
         
            it('GetData selectBuilderArraySerialize is defined ',
                function () {
                    expect(getData.selectBuilderArraySerialize).toBeDefined();
                });

            it('GetData selectBuilderArraySerialize work ',
                function () {
                    var ds = new jsDataSet.DataSet("DS");
                    var t1 = ds.newTable("table1");
                    t1.setDataColumn("colonna1", "String");
                    t1.setDataColumn("colonna2", "String");
                    t1.columns["colonna1"].caption = "colonna1";
                    t1.columns["colonna2"].caption = "colonna2";

                    var t2 = ds.newTable("table2");
                    t2.setDataColumn("colonna1_2", "String");
                    t2.setDataColumn("colonna2_2", "String");
                    t2.columns["colonna1_2"].caption = "colonna1_2";
                    t2.columns["colonna2_2"].caption = "colonna2_2";

                    var SelBuilderArray = new Array();
                    var x = 1;
                    var y = 2;
                    var z = "Z";
                    var k = "K";
                    SelBuilderArray[0] = { filter: q.eq(x, y), top: "top1", tableName: "Table1Name", table: t1 };
                    SelBuilderArray[1] = { filter: q.eq(z, k), top: "top2", tableName: "Table2Name", table: t2 };
                    var result = getData.selectBuilderArraySerialize(SelBuilderArray);
                    //alert(result);
                    var obj = JSON.parse(result);
                    expect(obj["arr"].length).toBe(2);
                    expect(obj["arr"][0].tableName).toBe("table1")
                });

            it('GetData MetaExpression alias serialization ',
                function () {
                    var f = q.field("field1");
                    f.alias = "aliasOfField1";
                    var mSer = getDataUtils.getJsonFromJsDataQuery(f);
                    var obj = JSON.parse(mSer);
                    expect(obj.alias).toBe("aliasOfField1");

                    var m = q.eq(1, 2);
                    m.alias = "1=2";
                    mSer = getDataUtils.getJsonFromJsDataQuery(m);
                    obj = JSON.parse(mSer);
                    expect(obj.alias).toBe("1=2");

                    m = q.eq(1, 2);
                    mSer = getDataUtils.getJsonFromJsDataQuery(m);
                    //alert(mSer);
                    obj = JSON.parse(mSer);
                    expect(obj.alias).toBeUndefined();
                });

            it('GetData selectBuilderArraySerialize more complex with rows and row state ',
               function () {
                   var ds = new jsDataSet.DataSet("temp1");
                   var t1 = ds.newTable("table1");
                   var t2 = ds.newTable("table2");
                   ds.newRelation("r1", "table1", ["key"], "table2", ["key"]);

                   // setto le prop delle colonne per t1
                   t1.setDataColumn("key", "String");
                   t1.setDataColumn("field1", "String");

                   t2.setDataColumn("key", "String");
                   t2.setDataColumn("field1", "String");

                   t1.columns["key"].caption = "key_1";
                   t1.columns["field1"].caption = "field_1";
                   t2.columns["key"].caption = "key_2";
                   t2.columns["field1"].caption = "field_2";

                   //
                   var r1 = { key: "key1", field1: "f1" };
                   var r2 = { key: "key2", field1: "f2" };
                   t1.add(r1);
                   t1.add(r2);

                   var r3 = { key: "key1", field1: "f3" };
                   var r4 = { key: "key2", field1: "f4" };
                   var r5 = { key: "key2", field1: "f5" };
                   t2.add(r3);
                   t2.add(r4);
                   t2.add(r5);

                   // imposto la chiave
                   t1.key("key");
                   t2.key("key");

                   t1.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                   t1.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                   t2.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                   t2.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                   t2.rows[2].getRow().state = jsDataSet.dataRowState.unchanged;


                   var SelBuilderArray = new Array();
                   var x = 1;
                   var y = 2;
                   var z = "Z";
                   var k = "K";
                   SelBuilderArray[0] = { filter: q.eq(x, y), top: "top1", tableName: "Table1Name", table: t1 };
                   SelBuilderArray[1] = { filter: q.eq(z, k), top: "top2", tableName: "Table2Name", table: t2 };
                   var result = getData.selectBuilderArraySerialize(SelBuilderArray);
                   //alert(result);
                   var obj = JSON.parse(result);
                   expect(obj.arr.length).toBe(2);
                   var t = getDataUtils.getJsDataTableFromJson(obj.arr[0].table);
                   expect(t.rows[0].getRow().state).toBe(dataRowState.unchanged);
                   expect(obj.arr[0].tableName).toBe("table1")
               });

            it('getWhereKeyClause() builds a jsDataQuery and filters and returns correct rows doing a select on a table',
                function () {

                    var c_name = "c_name";
                    var c_dec = "c_dec";
                    var c_double = "c_double";
                    var c_age = "c_age";
                    var ds = new jsDataSet.DataSet("temp");
                    var t1 = ds.newTable("table1");
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_double, "Double");
                    t1.setDataColumn(c_age, "Single");

                    var objrow1 = { c_name: "nome1", c_dec: 11, c_double: 2001 , c_age :1};
                    var objrow2 = { c_name: "nome2", c_dec: 22, c_double: 2002 , c_age :2};
                    var objrow3 = { c_name: "nome3", c_dec: null, c_double: 2003, c_age :3 };
                    var objrow4 = { c_name: "nome4", c_dec: null, c_double: 2004, c_age :4 };
                    var objrow5 = { c_name: "nome5", c_dec: 55, c_double: 2003, c_age :5 };
                    var objrow6 = { c_name: "nome3", c_dec: null, c_double: 2003, c_age :6 };

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);
                    t1.add(objrow4);
                    t1.add(objrow5);
                    t1.add(objrow6);
                    t1.key(["c_name", "c_double"]);
                    
                    var filter  = getData.getWhereKeyClause(objrow3.getRow(),t1, t1);
                    expect(filter).toBeDefined();

                    var rows = t1.select(filter); // aspetto esattamente le 2 righe che corrisppsondono ai valori di objrow3
                    expect(rows.length).toBe(2);
                    expect(rows[0].c_age).toBe(3);
                    expect(rows[1].c_age).toBe(6);
                });

            it('addRowToTable() adds rows to the table',
                function () {

                    var c_name = "c_name";
                    var c_dec = "c_dec";
                    var c_citta = "c_citta";
                    var c_age = "c_age";
                    var ds = new jsDataSet.DataSet("temp");
                    var t1 = ds.newTable("table1");
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_citta, "String");
                    t1.setDataColumn(c_age, "Single");

                    var t2 = ds.newTable("table2");
                    t2.setDataColumn(c_name, "String");
                    t2.setDataColumn(c_dec, "Decimal");
                    t2.setDataColumn(c_citta, "String");
                    t2.setDataColumn(c_age, "Single");


                    var objrow1 = { c_name: "nome1", c_dec: 11, c_citta: "Roma" , c_age :1};
                    var objrow2 = { c_name: "nome2", c_dec: 22, c_citta: "Napoli" , c_age :2};
                    var objrow3 = { c_name: "nome3", c_dec: null, c_citta: "Bari", c_age :3 };
                    
                    var objrow4 = { c_name: "nome4", c_dec: null, c_citta: "Torino", c_age :4 };
                    var objrow5 = { c_name: "nome5", c_dec: 55, c_citta: "Milano", c_age :5 };
                    var objrow6 = { c_name: "nome3", c_dec: null, c_citta: "Firenze", c_age :6 };

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);

                    t2.add(objrow4);
                    t2.add(objrow5);
                    t2.add(objrow6);

                    expect(t1.rows.length).toBe(3);
                    
                    getData.addRowToTable(t1, objrow4);
                    getData.addRowToTable(t1, objrow5)
                    getData.addRowToTable(t1, objrow6)
                    
                    expect(t1.rows.length).toBe(6);
                   
                });

        });

});
