"use strict";

describe("GraphControl",
    function () {
        var MetaPage = appMeta.MetaPage;
        var HelpForm = appMeta.HelpForm;
        var graph1;
        var origDoGet; // mock funz doGet

        // invoca la getToolBarManager per instanziare la toolbar, che poi sarà richiamata nei vari freshForm
        beforeAll(function () {
            appMeta.basePath = "base/";
            appMeta.initToolBarManager();
        });

        beforeEach(function () {

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function() {
                return new $.Deferred().resolve();
            };
            origDoGet =  appMeta.getData.doGet;
            appMeta.getData.doGet = function () {
                return new $.Deferred().resolve().promise();
            }
        });

        afterEach(function () {
            appMeta.getData.doGet = origDoGet;
        });

        afterAll(function () {
            //appMeta.basePath = "/";
        });

                it("GraphControl line default fillControl() binded ok", function (done) {
                    // costrusico ogetto stato e ds
                    var state1 = new appMeta.MetaPageState();
                    var state2 = new appMeta.MetaPageState();
                    var ds1 = new jsDataSet.DataSet("temp1");
                    var t1Ds1 = ds1.newTable("table1");

                    // setto le prop delle colonne per t1
                    t1Ds1.setDataColumn("key", "String");
                    t1Ds1.setDataColumn("field1", "Decimal");
                    t1Ds1.setDataColumn("field2", "Decimal");

                    t1Ds1.columns["key"].caption = "key_1";
                    t1Ds1.columns["field1"].caption = "field_1";

                    //
                    var r1 = {key: "key1", field1: 1, field2: 11};
                    var r2 = {key: "key2", field1: 2, field2: 12};
                    var r3 = {key: "key2", field1: 3, field2: 13};
                    var r4 = {key: "key2", field1: 4, field2: 14};
                    r1 = t1Ds1.add(r1).current;
                    r2 = t1Ds1.add(r2).current;
                    r3 = t1Ds1.add(r3).current;
                    r4 = t1Ds1.add(r4).current;

                    // imposto la chiave
                    t1Ds1.key("key");
                    state1.DS = ds1;
                    state1.editedRow = r1.getRow();

                    var  metapage1 = new MetaPage('table1', 'def', true);
                    metapage1.state = state1;
                    state1.meta  = new appMeta.MetaData('table1');
                    // inizializzo la form
                    var helpForm1 = new HelpForm(state1, "table1", "#rootelement");
                    metapage1.helpForm  = helpForm1;

                    var mainwin = '<div id="rootelement"><div id="graph1" data-custom-control="graph" data-tname="table1" data-ycol="field1" data-xcol="field2" data-type="line" data-tag="table1.field1" ></div></div>';
                    $("html").html(mainwin);

                    // aggiungo stili, così a runtime li vedo
                    $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $('body').append('<link rel="stylesheet" href="/base/test/app/styles/app.css">');

                    helpForm1.preScanControls()
                    .then(()=>{
                        helpForm1.addEvents(metapage1);
                        graph1 = $("#graph1").data("customController");
                        graph1.addEvents(null, metapage1);
                        graph1.fillControl($("#graph1"))
                        .then(function() {
                            expect(_.isEqual(graph1.myNewChart.data.datasets[0].data, [1,2,3,4])).toBe(true);
                            expect(_.isEqual(graph1.myNewChart.data.labels, [11,12,13,14])).toBe(true);
                            expect(graph1.myNewChart.config.type).toBe("line");
                            done();
                        });

                    });

                });

                it("GraphControl bar fillControl() binded ok", function (done) {
                    // costrusico ogetto stato e ds
                    var state1 = new appMeta.MetaPageState();
                    var state2 = new appMeta.MetaPageState();
                    var ds1 = new jsDataSet.DataSet("temp1");
                    var t1Ds1 = ds1.newTable("table1");

                    // setto le prop delle colonne per t1
                    t1Ds1.setDataColumn("key", "String");
                    t1Ds1.setDataColumn("field1", "Decimal");
                    t1Ds1.setDataColumn("field2", "Decimal");

                    t1Ds1.columns["key"].caption = "key_1";
                    t1Ds1.columns["field1"].caption = "field_1";

                    //
                    var r1 = {key: "key1", field1: 1, field2: 11};
                    var r2 = {key: "key2", field1: 2, field2: 12};
                    var r3 = {key: "key2", field1: 3, field2: 13};
                    var r4 = {key: "key2", field1: 4, field2: 14};
                    r1 = t1Ds1.add(r1).current;
                    r2 = t1Ds1.add(r2).current;
                    r3 = t1Ds1.add(r3).current;
                    r4 = t1Ds1.add(r4).current;

                    // imposto la chiave
                    t1Ds1.key("key");
                    state1.DS = ds1;
                    state1.editedRow = r1.getRow();

                    var  metapage1 = new MetaPage('table1', 'def', true);
                    metapage1.state = state1;
                    state1.meta  = new appMeta.MetaData('table1');
                    // inizializzo la form
                    var helpForm1 = new HelpForm(state1, "table1", "#rootelement");
                    metapage1.helpForm  = helpForm1;

                    var mainwin = '<div id="rootelement"><div id="graph1" data-custom-control="graph" data-tname="table1" data-ycol="field1" data-xcol="field2" data-type="bar" data-tag="table1.field1" ></div></div>';
                    $("html").html(mainwin);

                    // aggiungo stili, così a runtime li vedo
                    $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $('body').append('<link rel="stylesheet" href="/base/test/app/styles/app.css">');

                    helpForm1.preScanControls()
                    .then(()=>{
                        graph1 = $("#graph1").data("customController");
                        graph1.addEvents(null, metapage1);
                        graph1.fillControl($("#graph1"))
                        .then(function() {
                            expect(_.isEqual(graph1.myNewChart.data.datasets[0].data, [1,2,3,4])).toBe(true);
                            expect(_.isEqual(graph1.myNewChart.data.labels, [11,12,13,14])).toBe(true);
                            expect(graph1.myNewChart.config.type).toBe("bar");
                            done();
                        });
                    });



                });

    });
