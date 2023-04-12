
describe("MultiSelectControl",
    function () {
        var stabilizeToCurrent = appMeta.stabilizeToCurrent;
        var timeout = 40000;


        // effettuo login
        beforeAll(function () {
            appMeta.basePath = "base/";
            appMeta.serviceBasePath = "/"; // path relativo dove si trovano i servizi
            appMeta.globalEventManager = new appMeta.EventManager();
            appMeta.localResource.setLanguage("it");
            appMeta.logger.setLanguage(appMeta.LocalResource);

            defLogin = appMeta.Deferred("login");
            appMeta.authManager.login(
                appMeta.configDev.userName,
                appMeta.configDev.password,
                appMeta.configDev.datacontabile)
                .then(function (res) {
                    if (res) defLogin.resolve(true)
                });
            return defLogin.promise();
        });

        beforeEach(function () {
            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function () {
                return new $.Deferred().resolve();
            };

        });

        afterEach(function () {
            expect(appMeta.Stabilizer.nesting).toBe(0);
        });


        describe("methods work",
            function () {

                it("fillControl() is ASYNC and grids are populated", function (done) {
                    // costruisco ogetto stato e ds
                    var state = new appMeta.MetaPageState();
                    var ds = new jsDataSet.DataSet("temp");
                    var tableName = "registry";
                    var t1 = ds.newTable(tableName);
                    // setto le prop delle colonne per t1
                    t1.setDataColumn("idreg", "Int32");
                    t1.setDataColumn("cu", "String");
                    t1.setDataColumn("gender", "String");

                    t1.columns["idreg"].caption = "IdReg";
                    t1.columns["cu"].caption = "Cu";
                    t1.columns["gender"].caption = "Gender";

                    t1.key("idreg");

                    state.DS = ds;

                    var meta = new appMeta.MetaData();
                    state.meta = meta;

                    var metapage = new appMeta.MetaPage(tableName, 'def', false);
                    metapage.state = state;

                    var helpForm = new window.appMeta.HelpForm(state, tableName, "#rootelement");
                    metapage.helpForm = helpForm;

                    var q = window.jsDataQuery;
                    var filter = q.and(q.eq(q.field("gender"), "F"), q.eq(q.field("cu"), "sa"));

                    // sovrascrivo html di prova
                    var mainwin = '<div id="rootelement">' +
                        "</div>";
                    $("html").html(mainwin);
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                    var el = $("#rootelement");

                    var multiSelectControl = new appMeta.MultiSelectControl(el, metapage, t1, filter, "listingType");
                    var countRowInitGridToAdd = 0;
                    var countRowInitGridAdded = 0;
                    multiSelectControl.fillControl()
                        .then(function () {
                            // test var interna al grid control
                            countRowInitGridToAdd = multiSelectControl.gridToAdd.gridRows.length;
                            countRowInitGridAdded = multiSelectControl.gridAdded.gridRows.length;
                            expect(countRowInitGridToAdd).toBeGreaterThan(0);
                            expect(countRowInitGridAdded).toBe(0);

                            // test sull' html
                            expect($(".gridToAdd").find("table > tr").length).toBe(countRowInitGridToAdd + 1); // header + 1 row
                            expect($(".gridAdded").find("table > tr").length).toBe(countRowInitGridAdded + 1); // header
                            done();
                        })
                }, timeout);

                it("1. fillControl(), 2. row selected on upper grid, 3. Add_button pressed, -> moves the row from toAddTable to addedTable",
                    function (done) {
                        // costruisco ogetto stato e ds
                        var state = new appMeta.MetaPageState();
                        var ds = new jsDataSet.DataSet("temp");
                        var tableName = "registry"
                        var t1 = ds.newTable(tableName);
                        // setto le prop delle colonne per t1
                        t1.setDataColumn("idreg", "Int32");
                        t1.setDataColumn("cu", "String");
                        t1.setDataColumn("gender", "String");

                        t1.columns["idreg"].caption = "IdReg";
                        t1.columns["cu"].caption = "Cu";
                        t1.columns["gender"].caption = "Gender";

                        t1.key("idreg");

                        state.DS = ds;

                        var meta = new appMeta.MetaData();
                        state.meta = meta;

                        var metapage = new appMeta.MetaPage(tableName, 'def', false);
                        metapage.state = state;

                        var helpForm = new window.appMeta.HelpForm(state, tableName, "#rootelement");
                        metapage.helpForm = helpForm;

                        var q = window.jsDataQuery;
                        var filter = q.and(q.eq(q.field("gender"), "F"), q.eq(q.field("cu"), "sa"));

                        // sovrascrivo html di prova
                        var mainwin = '<div id="rootelement">' +
                            "</div>";
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                        var el = $("#rootelement");

                        var multiSelectControl = new appMeta.MultiSelectControl(el, metapage, t1, filter, "listingType");
                        var countRowInitGridToAdd = 0;
                        var countRowInitGridAdded = 0;
                        multiSelectControl.fillControl()
                            .then(function () {
                                countRowInitGridToAdd = multiSelectControl.gridToAdd.gridRows.length;
                                countRowInitGridAdded = multiSelectControl.gridAdded.gridRows.length;
                                // test var interna al grid control
                                expect(countRowInitGridToAdd).toBeGreaterThan(0);
                                expect(countRowInitGridAdded).toBe(0);
                                // test sull' html
                                expect($(".gridToAdd").find("table > tr").length).toBe(countRowInitGridToAdd + 1); // header + 1 row
                                expect($(".gridAdded").find("table > tr").length).toBe(countRowInitGridAdded + 1); // header

                                // costruisco jquery event per simulare il mouseDown con ctrl
                                var e = $.Event("mousedown", { keyCode: 91, ctrlKey: true });
                                var s = stabilizeToCurrent();
                                // eseguo mousedown sulla prima riga, cioè seleziono
                                $(".gridToAdd").find("table > tr").eq(1).trigger(e);
                                return s;
                            })
                            .then(() => {
                                // mi aspetto che la riga abbia il css selezionato
                                expect($(".gridToAdd").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);

                                // eseguo il click del bottone Aggiungi
                                s = stabilizeToCurrent();
                                $(".multiSelect_btn_add").click();
                                return s;
                            })
                            .then(() => {
                                // mi aspetto lo swap della riga
                                expect(multiSelectControl.gridToAdd.gridRows.length).toBe(countRowInitGridToAdd - 1);
                                expect(multiSelectControl.gridAdded.gridRows.length).toBe(1);

                                // test sull' html
                                expect($(".gridToAdd").find("table > tr").length).toBe(countRowInitGridToAdd + 1 - 1); // + header - una riga
                                expect($(".gridAdded").find("table > tr").length).toBe(2); // header + 1 row spostata
                                done();
                            });
                    }, timeout);

                it("1. fillControl(), 2. row with ctrl, 3. row with shift, 4. Add_button pressed, -> moves the rows from toAddTable to addedTable",
                    function (done) {
                        // costrusico ogetto stato e ds
                        var state = new appMeta.MetaPageState();
                        var ds = new jsDataSet.DataSet("temp");
                        var tableName = "registry"
                        var t1 = ds.newTable(tableName);
                        // setto le prop delle colonne per t1
                        t1.setDataColumn("idreg", "Int32");
                        t1.setDataColumn("cu", "String");
                        t1.setDataColumn("gender", "String");

                        t1.columns["idreg"].caption = "IdReg";
                        t1.columns["cu"].caption = "Cu";
                        t1.columns["gender"].caption = "Gender";

                        t1.key("idreg");

                        state.DS = ds;

                        var meta = new appMeta.MetaData();
                        state.meta = meta;

                        var metapage = new appMeta.MetaPage(tableName, 'def', false);
                        metapage.state = state;

                        var helpForm = new window.appMeta.HelpForm(state, tableName, "#rootelement");
                        metapage.helpForm = helpForm;

                        var q = window.jsDataQuery;
                        // questo filtro recupera 27 righe
                        var filter = q.and(q.eq(q.field("gender"), "F"), q.eq(q.field("cu"), "sa"));

                        // sovrascrivo html di prova
                        var mainwin = '<div id="rootelement">' +
                            "</div>";
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                        var el = $("#rootelement");

                        var multiSelectControl = new appMeta.MultiSelectControl(el, metapage, t1, filter, "listingType");
                        var countRowInitGridToAdd = 0;
                        var countRowInitGridAdded = 0;
                        multiSelectControl.fillControl()
                            .then(function () {
                                countRowInitGridToAdd = multiSelectControl.gridToAdd.gridRows.length;
                                countRowInitGridAdded = multiSelectControl.gridAdded.gridRows.length;
                                // test var interna al grid control
                                expect(countRowInitGridToAdd).toBeGreaterThan(6); // adffinchèilt est sia buono, devoa vere almeno 6 righe
                                expect(countRowInitGridAdded).toBe(0);
                                // test sull' html
                                expect($(".gridToAdd").find("table > tr").length).toBe(countRowInitGridToAdd + 1); // header + 1 row
                                expect($(".gridAdded").find("table > tr").length).toBe(countRowInitGridAdded + 1); // header

                                // costruisco jquery event per simulare il mouseDown con ctrl
                                var e = $.Event("mousedown", { keyCode: 91, ctrlKey: true });
                                var s = stabilizeToCurrent();
                                // eseguo mousedown sulla prima riga, cioè seleziono
                                $(".gridToAdd").find("table > tr").eq(1).trigger(e);

                                return s;
                            })
                            .then(function () {
                                // mi aspetto che la riga abbia il css selezionato
                                expect($(".gridToAdd").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);

                                // costruisco jquery event per simulare il mouseDown con shift
                                var eShift = $.Event("mousedown", { shiftKey: true });
                                s = stabilizeToCurrent();
                                // eseguo mousedown sulla 5a riga
                                $(".gridToAdd").find("table > tr").eq(5).trigger(eShift);

                                return s;
                            })
                            .then(function () {
                                // eseguo il click del bottone Aggiungi
                                s = stabilizeToCurrent();
                                $(".multiSelect_btn_add").click();
                                return s;
                            })
                            .then(function () {
                                // mi aspetto lo swap della riga
                                expect(multiSelectControl.gridToAdd.gridRows.length).toBe(countRowInitGridToAdd - 5);
                                expect(multiSelectControl.gridAdded.gridRows.length).toBe(5); // 5 righe selezionate con lo shift

                                // test sull' html
                                expect($(".gridToAdd").find("table > tr").length).toBe(countRowInitGridToAdd + 1 - 5); // header - 5 rows
                                expect($(".gridAdded").find("table > tr").length).toBe(countRowInitGridAdded + 1 + 5); // header + 5 rows spostata
                                done();
                            });
                    });
            }
        );
    });
   
