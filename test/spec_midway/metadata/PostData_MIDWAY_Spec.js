'use strict';

describe('PostData', function () {
    var MetaPage = appMeta.MetaPage;
    var metapage;
    var state1;
    var Deferred = appMeta.Deferred;
    var postData = appMeta.postData;
    var common = appMeta.common;

    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec_midway/fixtures';
        appMeta.basePath = "base/";
        appMeta.dbClickTimeout = 1;

        metapage = new MetaPage('table1', 'table1_def.json', false);
        
        // costrusico oggetto stato e ds per testare i metodi che fanno operazioni con il dataset
        state1 = new appMeta.MetaPageState();
        var ds1 = new jsDataSet.DataSet("temp1");
        var t1ds1 = ds1.newTable("table1");

        // setto le prop delle colonne per t1
        t1ds1.setDataColumn("key", "String");
        t1ds1.setDataColumn("field1", "String");
        
        t1ds1.columns["key"].caption = "key_1";
        t1ds1.columns["field1"].caption = "field_1";
        
        // imposto la chiave
        t1ds1.key("key");
        
        metapage.state = state1;

    });
    afterEach(function () {
        appMeta.basePath = "/";
        metapage = null;
    });

    describe("MetaPage class",
        function () {

            it( 'doPost(ds, tablename, edittype, []) is recursive; saveDataSet(null, messages, true, true) mocked, not open formProcedureMessages', function (done) {

                metapage = new MetaPage('table1', 'table1_def.json', false);
                state1 = new appMeta.MetaPageState();
                metapage.state = state1;

                var messages = [];
                var m1 = new appMeta.DbProcedureMessage("id1", "LongMessage1" ,"audit1", "errorType1", "tableName1",  true);
                var m2 = new appMeta.DbProcedureMessage("id2", "LongMessage2" ,"audit2", "errorType2", "tableName2",  true);
                messages.push(m1);
                messages.push(m2);

                // mock funz saveDataSet(), torna array di messaggi
                var originalSaveDataSet = metapage.saveDataSet;
                postData.saveDataSet = function () {
                    var def  = Deferred("saveDataSet");
                    return def.resolve(new jsDataSet.DataSet("test"), messages, true, true).promise();
                };

                spyOn(appMeta.FormProcedureMessage.prototype, 'fillControl');
                var inputMessages = [];
                postData.doPost(new jsDataSet.DataSet("test"), null, null, inputMessages, metapage)
                    .then(function () {

                        expect(inputMessages.length).toBe(0);// messaggi non presenti
                        expect(appMeta.FormProcedureMessage.prototype.fillControl).not.toHaveBeenCalled();

                        postData.saveDataSet = originalSaveDataSet;
                        done();
                    })

            });

            it( 'doPost() is recursive; saveDataSet(null, messages, false, true) mocked, open a formProcedureMessages ', function (done) {

                var mainwin = '<div id="metaRoot">' +
                    "</div>";
                $("html").html(mainwin);
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                $("head").append('<script defer src="/base/test/app/styles/fontawesome/fontawesome-all.js"></script>');
               // $("head").append('<script defer src="/base/bower_components/jquery/dist/jquery.js"></script>');
                $("head").append('<script defer src="/base/test/app/styles/bootstrap/js/bootstrap.js"></script>');

                metapage = new MetaPage('table1', 'table1_def.json', false);
                state1 = new appMeta.MetaPageState();
                metapage.state = state1;

                var messages = [];
                var m1 = new appMeta.DbProcedureMessage("id1", "LongMessage1" ,"audit1", "errorType1", "tableName1",  true);
                var m2 = new appMeta.DbProcedureMessage("id2", "LongMessage2" ,"audit2", "errorType2", "tableName2",  true);
                messages.push(m1);
                messages.push(m2);

                // mock funz saveDataSet()
                var originalSaveDataSet = metapage.saveDataSet;
                postData.saveDataSet = function () {
                    var def  = Deferred("saveDataSet");
                    return def.resolve(new jsDataSet.DataSet("test"), messages, false, true).promise();
                };

                var inputMessages = [];
                common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                    .then(function () {
                        expect(inputMessages.length).toBe(0);// messaggi 
                        
                        common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                            .then(function () {
                                expect($(".modal .modal-body")).toBeDefined();
                                expect($(".procedureMessage_grid > table > tr").length).toBe(3); // 1 header + 2 rows
                                postData.saveDataSet = originalSaveDataSet;
                                done();
                            });

                        $(".procedureMessage_btn_ignoreandsave").click(); // clicco
                    });
                
                postData.doPost(new jsDataSet.DataSet("test"), null, null, inputMessages, metapage);

            }, 60000);
            
        });
});
