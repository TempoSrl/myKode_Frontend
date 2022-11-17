
describe("Tachimetro",
    function (){
        var MetaPage = appMeta.MetaPage;
        var HelpForm = appMeta.HelpForm;
        var tachimetro;
        var origDoGet; // mock funz doGet

        // invoca la getToolBarManager per instanziare la toolbar, che poi sarà richiamata nei vari freshForm
        beforeAll(function (){
            appMeta.basePath = "base/";
            appMeta.currApp.initToolBarManager();
        });

        beforeEach(function (){
            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function (){
                return new $.Deferred().resolve();
            };
            origDoGet = appMeta.getData.doGet;
            appMeta.getData.doGet = function (){
                return new $.Deferred().resolve().promise();
            };
        });

        afterEach(function (){
            appMeta.getData.doGet = origDoGet;
        });

        afterAll(function (){
            //appMeta.basePath = "/";
        });

        it("tachimetro fillControl() binded ok", function (done){
            // costrusico ogetto stato e ds
            var state1 = new appMeta.MetaPageState();
            var state2 = new appMeta.MetaPageState();
            var ds1 = new jsDataSet.DataSet("temp1");
            var ds2 = new jsDataSet.DataSet("temp2");
            var t1Ds1 = ds1.newTable("table1");
            var t2Ds2 = ds2.newTable("table2");

            // setto le prop delle colonne per t1
            t1Ds1.setDataColumn("key", "String");
            t1Ds1.setDataColumn("field1", "Decimal");

            t2Ds2.setDataColumn("key", "String");
            t2Ds2.setDataColumn("field1", "Decimal");

            t1Ds1.columns["key"].caption = "key_1";
            t1Ds1.columns["field1"].caption = "field_1";
            t2Ds2.columns["key"].caption = "key_2";
            t2Ds2.columns["field1"].caption = "field_2";

            //
            var r1 = {key: "key1", field1: 21};
            var r2 = {key: "key2", field1: 22};
            r1 = t1Ds1.add(r1).current;
            r2 = t1Ds1.add(r2).current;

            var r3 = {key: "key1", field1: 11};
            var r4 = {key: "key2", field1: 12};
            r3 = t2Ds2.add(r3).current;
            r4 = t2Ds2.add(r4).current;

            // imposto la chiave
            t1Ds1.key("key");
            t2Ds2.key("key");
            state1.DS = ds1;
            state1.editedRow = r1.getRow();

            state2.DS = ds2;
            state2.callerState = state1;
            state2.setInsertState();
            state2.currentRow = r3;

            // inizializzo metapage, usata in AddEvents

            var metapage2 = new MetaPage('table2', 'def', true);
            metapage2.state = state2;
            state2.meta = new appMeta.MetaData('table2');
            // inizializzo la form
            var helpForm2 = new HelpForm(state2, "table2", "#rootelement");
            metapage2.helpForm = helpForm2;

            var mainwin = '<div id="rootelement"><div id="tach1" data-custom-control="tachimetro" data-max="100" data-th1="50" data-th2="90" data-tag="table2.field1" ></div></div>';
            $("html").html(mainwin);

            // aggiungo stili, così a runtime li vedo
            $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
            $('body').append('<link rel="stylesheet" href="/base/test/app/styles/app.css">');

            helpForm2.preScanControls()
            .then(() => {
                tachimetro = $("#tach1").data("customController");
                tachimetro.addEvents(null, metapage2);
                tachimetro.fillControl($("#tach1"))
                .then(function (){
                    expect(state2.currentRow).toBe(r3);
                    expect(tachimetro.gauge.displayedValue).toBe(11);
                    expect(tachimetro.gauge.maxValue).toBe(100);
                    expect(tachimetro.gauge.minValue).toBe(0);
                    done();
                });
            });
        });

        it("tachimetro fillControl() binded ok with format fixed 2", function (done){

            // costrusico ogetto stato e ds
            var state1 = new appMeta.MetaPageState();
            var state2 = new appMeta.MetaPageState();
            var ds1 = new jsDataSet.DataSet("temp1");
            var ds2 = new jsDataSet.DataSet("temp2");
            var t1Ds1 = ds1.newTable("table1");
            var t2Ds2 = ds2.newTable("table2");

            // setto le prop delle colonne per t1
            t1Ds1.setDataColumn("key", "String");
            t1Ds1.setDataColumn("field1", "Decimal");

            t2Ds2.setDataColumn("key", "String");
            t2Ds2.setDataColumn("field1", "Decimal");

            t1Ds1.columns["key"].caption = "key_1";
            t1Ds1.columns["field1"].caption = "field_1";
            t2Ds2.columns["key"].caption = "key_2";
            t2Ds2.columns["field1"].caption = "field_2";

            //
            var r1 = {key: "key1", field1: 21};
            var r2 = {key: "key2", field1: 22};
            r1 = t1Ds1.add(r1).current;
            r2 = t1Ds1.add(r2).current;

            var r3 = {key: "key1", field1: 11};
            var r4 = {key: "key2", field1: 12};
            r3 = t2Ds2.add(r3).current;
            r4 = t2Ds2.add(r4).current;

            // imposto la chiave
            t1Ds1.key("key");
            t2Ds2.key("key");
            state1.DS = ds1;
            state1.editedRow = r1.getRow();

            state2.DS = ds2;
            state2.callerState = state1;
            state2.setInsertState();
            state2.currentRow = r3;

            // inizializzo metapage, usata in AddEvents

            var metapage2 = new MetaPage('table2', 'def', true);
            metapage2.state = state2;
            state2.meta = new appMeta.MetaData('table2');
            // inizializzo la form
            var helpForm2 = new HelpForm(state2, "table2", "#rootelement");
            metapage2.helpForm = helpForm2;

            var mainwin = '<div id="rootelement"><div id="tach1" data-custom-control="tachimetro" data-max="100" data-th1="50" data-th2="90" data-tag="table2.field1.fixed.2" ></div></div>';
            $("html").html(mainwin);

            // aggiungo stili, così a runtime li vedo
            $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
            $('body').append('<link rel="stylesheet" href="/base/test/app/styles/app.css">');

            helpForm2.preScanControls()
            .then(() => {

                tachimetro = $("#tach1").data("customController");
                tachimetro.addEvents(null, metapage2);
                tachimetro.fillControl($("#tach1"))
                .then(function (){
                    expect(state2.currentRow).toBe(r3);
                    expect(tachimetro.gauge.displayedValue).toBe(11);
                    expect(tachimetro.gauge.maxValue).toBe(100);
                    expect(tachimetro.gauge.minValue).toBe(0);
                    // set del valore decimale. Sulla label essendo il tag fixed 2 devo vedere "1,12"
                    r3.field1 = 1.123;
                    tachimetro.fillControl($("#tach1"))
                    .then(function (){
                        expect(tachimetro.gauge.displayedValue).toBe(1.123);
                        expect($("#" + tachimetro.idLbValue).text()).toBe("1,12");
                        done();
                    });
                });
            });
        });



    });