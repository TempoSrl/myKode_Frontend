'use strict';

describe('MetaPage e2e', function () {
    var MetaPage = appMeta.MetaPage;
    var metapage;
    var $q = window.jsDataQuery;
    var conn;
    var methodEnum = appMeta.routing.methodEnum;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var timeout  = 30000;
    var common = appMeta.common;

    var defLogin;
    // effettuo login
    beforeAll(function () {
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
        appMeta.basePath = "base/";
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
        conn = appMeta.connection;

        // mock funzione asyn describeColumns()
        appMeta.MetaData.prototype.describeColumns = function() {
            return new $.Deferred().resolve();
        };

    });
    afterEach(function () {
        appMeta.basePath = "/";
        metapage = null;
    });

    describe("MetaPage class",
        function () {

            describe("Retrieve data from server, Methods ",
                function () {

                    it("assureDataSet() called with 'registry', 'anagrafica' should be async and returns a DataSet with empty tables",
                        function (done) {
                            defLogin.then(function () {
                                // costruisco uno stato
                                metapage = new MetaPage('registry', 'anagrafica', false);
                                var s = new appMeta.MetaPageState();
                                metapage.state = s;

                                metapage.assureDataSet().then(function (result) {
                                        expect(result.constructor.name).toBe("DataSet");
                                        expect(result.tables.registry).toBeDefined();
                                        expect(result.tables.registryaddress).toBeDefined();
                                        expect(result.tables.registryreference).toBeDefined();
                                        expect(result.tables.registry.rows.length).toBe(0);
                                        done();
                                    },
                                    function (error) {
                                        console.log(error);
                                        expect(error).toBeDefined();
                                        done();
                                    });
                            });
                        }, timeout);

                    it("init() called with 'registry', 'anagrafica' should be async and returns a DataSet with empty tables, and helForm initialized",
                        function (done) {
                            defLogin.then(function () {
                                // costruisco uno stato
                                metapage = new MetaPage('registry', 'anagrafica', false);
                                var s = new appMeta.MetaPageState();
                                metapage.state = s;

                                metapage.init().then(function (mp) {
                                        expect(mp.constructor.name).toBe("MetaPage");
                                        expect(mp.state.DS.tables.registry).toBeDefined();
                                        expect(mp.state.DS.tables.registryaddress).toBeDefined();
                                        expect(mp.state.DS.tables.registryreference).toBeDefined();
                                        expect(mp.state.DS.tables.registry.rows.length).toBe(0);

                                        // check sull'oggetto helpForm
                                        expect(mp.helpForm).toBeDefined(0);
                                        expect(mp.helpForm.primaryTable.name).toBe("registry");
                                        expect(mp.helpForm.DS.tables.registry).toBeDefined("registry");
                                        expect(mp.helpForm.DS.name).toBe("registry_anagrafica");
                                        done();
                                    },
                                    function (error) {
                                        console.log(error);
                                        expect(error).toBeDefined();
                                        done();
                                    });
                            });
                        }, timeout);

                    it("cmdMainDoSearch() search row. 1 getDataSet; 2. cmdMainDoSearch",
                        function (done) {
                            defLogin.then(function () {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="registry.cu" value="sa"><br>' +
                                    '<input type="text" id="txtBox2" data-tag="registry.p_iva"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                var tableName = 'registry';

                                //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                                var objConn = {
                                    method: methodEnum.getDataSet,
                                    prm: { tableName:tableName, editType:"anagrafica"}
                                };

                                // 1. recupero ds vuoto
                                conn.call(objConn)
                                    .then(function(res) {
                                        // recupero ds vuoto
                                        var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                        // inizializzo oggetti necessari
                                        metapage = new MetaPage(tableName, 'anagrafica', false);
                                        var s = new appMeta.MetaPageState();
                                        s.DS = ds;
                                        s.meta  = new appMeta.MetaData(tableName);

                                        metapage.state = s;
                                        var helpForm = new appMeta.HelpForm(s, tableName, "#rootelement");
                                        metapage.helpForm = helpForm;
                                        metapage.startFilter  = $q.eq('idreg','2');
                                        metapage.additionalSearchCondition = $q.eq('active','N');

                                        // inizializzo static filter
                                        ds.tables[tableName].staticFilter($q.eq('idreg','2'));

                                        /*

                                         QUERY SQL:
                                         // prendi un irreg che soddisfa questo per il test.
                                         SELECT * FROM [Rettorato_Ok].[dbo].[registry]
                                         where  rtf is null and p_iva is not null

                                         SELECT *
                                         FROM [Rettorato_Ok].[dbo].[registry]
                                         where cu = 'sa' and lu = 'PINO' and active ='N' and idreg='2'
                                         */

                                        // Testo il metodo dopo le configurazioni iniziali
                                        metapage.cmdMainDoSearch(appMeta.localResource.maindosearch, "registry.default")
                                            .then(function (result) {
                                                    expect(result).toBe(true);
                                                    expect($('#txtBox2').val()).toBe("01669240028"); // valore di p_iva che torna dal db in base ai criteri scelti
                                                    expect($('#txtBox1').val()).toBe("sa");
                                                    done();
                                                },
                                                function (error) {
                                                    expect(false).toBe(true);
                                                    console.log(error);
                                                    done();
                                                });


                                    });
                            });
                        }, timeout);

                    it("getPrimaryTable() returns dataTable with rows filtered",
                        function (done) {
                            defLogin.then(function () {
                                var tableName = 'registry';

                                //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                                var objConn = {
                                    method: methodEnum.getDataSet,
                                    prm: { tableName:tableName, editType:"anagrafica"}
                                };

                                // 1. recupero ds vuoto
                                conn.call(objConn)
                                    .then(function(res) {
                                        // recupero ds vuoto
                                        var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                        metapage = new MetaPage(tableName, 'anagrafica', false);
                                        metapage.primaryTable = ds.tables[tableName];
                                        var s = new appMeta.MetaPageState();
                                        s.DS = ds;
                                        metapage.state = s;

                                        // Testo il metodo dopo le configurazioni iniziali
                                        metapage.getPrimaryTable($q.eq('idreg','3'))
                                            .then(function () {
                                                    expect( metapage.primaryTable.rows.length).toBe(1); //  ho filtrato su chiave cioè idReg=3, quindi mi aspetto una riga
                                                    done();
                                                },
                                                function (error) {
                                                    expect(false).toBe(true);
                                                    console.log(error);
                                                    done();
                                                });
                                    });
                            });
                        }, timeout);

                    it("filterList() filters and fills the dataTable, no row selected, no fills control ",
                        function (done) {
                            defLogin.then(function () {
                                var mainwin = '<div id="metaRoot">' +
                                    '<input type="text" id="txtBox1" data-tag="registry.cu" value="assistenza"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                var tableName = 'registry';
                                metapage = new MetaPage(tableName, 'anagrafica', false);
                                var s = new appMeta.MetaPageState();
                                s.meta  = new appMeta.MetaData(tableName);
                                metapage.state = s;

                                metapage.init().then(function () {
                                    var filter = $q.eq('gender','F');
                                    metapage.primaryTable = metapage.state.DS.tables[tableName];
                                    // Testo il metodo dopo le configurazioni iniziali
                                    metapage.filterList(filter)
                                        .then(function () {
                                                expect($('#txtBox1').val()).toBe(""); // non c'è riga selezionata,  viene fatto il clear del controllo
                                                done();
                                            },
                                            function (error) {
                                                console.log(error);
                                                expect(false).toBe(true);
                                                done();
                                            });


                                });
                            });
                        }, timeout);

                    it('doPrefill() is ASYNC and prefills a comboBox', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="rootelement">' +
                                '<select id="combo1" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryaddress" data-value-member="idcity"  data-display-member="lu">' +
                                "</select>" +
                                "</div>";
                            $("html").html(mainwin);

                            var s = new appMeta.MetaPageState();
                            metapage = new MetaPage('registry', 'anagrafica', false);
                            metapage.state = s;
                            var filter = $q.eq($q.field('idreg'), 1); // la registryaddress per idreg=1 torna 3 righe per ora

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.assureDataSet().then(function (result) {

                                var helpForm = new appMeta.HelpForm(s, "registry", "#rootelement");
                                metapage.helpForm = helpForm;
                                helpForm.preScanControls();
                                var combo = $("#combo1").data("customController");
                                expect(combo).toBeDefined();

                                metapage.doPreFill(null, filter).then(function () {
                                    expect( $("#combo1 option").length).toBeGreaterThan(2);
                                    expect( parseInt($("#combo1 option")[1].value)).toBeGreaterThan(0);
                                    expect( parseInt($("#combo1 option")[2].value)).toBeGreaterThan(0);
                                    expect( parseInt($("#combo1 option")[3].value)).toBeGreaterThan(0);
                                    expect( $("#combo1 option")[1].text.length).toBeGreaterThan(0);
                                    expect( $("#combo1 option")[2].text.length).toBeGreaterThan(0);
                                    expect( $("#combo1 option")[3].text.length).toBeGreaterThan(0);
                                    // valori veri:
                                    /*expect( $("#combo1 option")[1].value).toBe("12198");
                                     expect( $("#combo1 option")[2].value).toBe("554");
                                     expect( $("#combo1 option")[3].value).toBe("303");
                                     expect( $("#combo1 option")[1].text).toBe("Vercelli");
                                     expect( $("#combo1 option")[2].text).toBe("NINO");
                                     expect( $("#combo1 option")[3].text).toBe("SARA");*/
                                    done();
                                });
                            });
                        });
                    }, timeout);

                    it('doPrefill() prefills two comboBox', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="rootelement">' +
                                '<select id="combo1" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryaddress" data-value-member="idcity"  data-display-member="lu">' +
                                '</select><BR>' +
                                '<select id="combo2" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryreference" data-value-member="idregistryreference"  data-display-member="referencename">' +
                                '</select>' +
                                '</div>';
                            $("html").html(mainwin);
                            var tableName  = "registry";
                            var s = new appMeta.MetaPageState();
                            metapage = new MetaPage(tableName, 'anagrafica', false);
                            metapage.state = s;
                            var filter = $q.eq($q.field('idreg'), 1); // la registryaddress per idreg=1 torna 3 righe per ora

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.assureDataSet().then(function (result) {

                                var helpForm = new appMeta.HelpForm(s, tableName, "#rootelement");
                                metapage.helpForm = helpForm;
                                helpForm.preScanControls();
                                var combo = $("#combo1").data("customController");
                                expect(combo).toBeDefined();

                                metapage.doPreFill(null, filter).then(function () {
                                    expect( $("#combo1 option").length).toBeGreaterThan(2);
                                    expect( parseInt($("#combo1 option")[1].value)).toBeGreaterThan(0);
                                    expect( parseInt($("#combo1 option")[2].value)).toBeGreaterThan(0);
                                    expect( parseInt($("#combo1 option")[3].value)).toBeGreaterThan(0);
                                    expect( $("#combo1 option")[1].text.length).toBeGreaterThan(0);
                                    expect( $("#combo1 option")[2].text.length).toBeGreaterThan(0);
                                    expect( $("#combo1 option")[3].text.length).toBeGreaterThan(0);

                                    expect( $("#combo2 option").length).toBeGreaterThan(1);
                                    expect( parseInt($("#combo2 option")[1].value)).toBeGreaterThan(0);
                                    expect( parseInt($("#combo2 option")[2].value)).toBeGreaterThan(0);
                                    done();
                                });
                            });
                        });
                    }, timeout);

                    it('freshform(true, true, undefined) is ASYNC and refills the form with fresh data', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="metaRoot">' +
                                '<select id="combo1" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryaddress" data-value-member="idcity"  data-display-member="lu">' +
                                '</select><BR>' +
                                '<select id="combo2" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryreference" data-value-member="idregistryreference"  data-display-member="referencename">' +
                                '</select>' +
                                '</div>';
                            $("html").html(mainwin);
                            var tableName  = "registry";

                            var filterMain = $q.and($q.isNull($q.field('rtf')),$q.eq($q.field('cu'), 'sa'));
                            metapage = new MetaPage(tableName, 'anagrafica', false);

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.init().then(function (result) {
                                metapage.state.meta  = new appMeta.MetaData(tableName);
                                appMeta.getData.fillDataSet(metapage.state.DS, tableName, "anagrafica", filterMain).then(function () {
                                    metapage.helpForm.preScanControls();
                                    // seleziono la riga di id1
                                    var filterFill = $q.eq($q.field('idreg'), 1);
                                    var rowRegistryToSel = metapage.helpForm.DS.tables[tableName].select(filterFill);
                                    metapage.helpForm.lastSelected(metapage.helpForm.DS.tables[tableName], rowRegistryToSel[0]);
                                    var combo = $("#combo1").data("customController");
                                    expect(combo).toBeDefined();

                                    metapage.freshForm(true, true).then(function () {
                                        expect( $("#combo1 option").length).toBeGreaterThan(2);
                                        expect( parseInt($("#combo1 option")[1].value)).toBeGreaterThan(0);
                                        expect( parseInt($("#combo1 option")[2].value)).toBeGreaterThan(0);
                                        expect( parseInt($("#combo1 option")[3].value)).toBeGreaterThan(0);
                                        expect( $("#combo1 option")[1].text.length).toBeGreaterThan(0);
                                        expect( $("#combo1 option")[2].text.length).toBeGreaterThan(0);
                                        expect( $("#combo1 option")[3].text.length).toBeGreaterThan(0);

                                        expect( $("#combo2 option").length).toBeGreaterThan(1);
                                        expect( parseInt($("#combo2 option")[1].value)).toBeGreaterThan(0);
                                        expect( parseInt($("#combo2 option")[2].value)).toBeGreaterThan(0);
                                        done();
                                    });
                                });

                            });
                        });
                    }, timeout);

                    it('freshform(true, true, "notExistTableName") is ASYNC and not fill data, cause notExistTableName', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="metaRoot">' +
                                '<select id="combo1" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryaddress" data-value-member="idcity"  data-display-member="lu">' +
                                '</select><BR>' +
                                '<select id="combo2" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryreference" data-value-member="idregistryreference"  data-display-member="referencename">' +
                                '</select>' +
                                '</div>';
                            $("html").html(mainwin);
                            var tableName  = "registry";

                            var filterMain = $q.and($q.isNull($q.field('rtf')),$q.eq($q.field('cu'), 'sa'));
                            metapage = new MetaPage(tableName, 'anagrafica', false);

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.init().then(function (result) {
                                metapage.state.meta  = new appMeta.MetaData(tableName);
                                appMeta.getData.fillDataSet(metapage.state.DS, tableName, "anagrafica", filterMain).then(function () {
                                    metapage.helpForm.preScanControls();
                                    // seleziono la riga di id1
                                    var filterFill = $q.eq($q.field('idreg'), 1);
                                    var rowRegistryToSel = metapage.helpForm.DS.tables[tableName].select(filterFill);
                                    metapage.helpForm.lastSelected(metapage.helpForm.DS.tables[tableName], rowRegistryToSel[0]);
                                    var combo = $("#combo1").data("customController");
                                    expect(combo).toBeDefined();

                                    metapage.freshForm(true, true, "notExistTableName").then(function () {
                                        expect( $("#combo1 option").length).toBe(0);
                                        expect( $("#combo2 option").length).toBe(0);
                                        done();
                                    });
                                });

                            });
                        });
                    }, timeout);

                    it('freshform(true, false, undefined) is ASYNC and refills the form with fresh data', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="metaRoot">' +
                                '<select id="combo1" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryaddress" data-value-member="idcity"  data-display-member="lu">' +
                                '</select><BR>' +
                                '<select id="combo2" data-custom-control="combo" data-tag="registry.idreg"  data-source-name="registryreference" data-value-member="idregistryreference"  data-display-member="referencename">' +
                                '</select>' +
                                '</div>';
                            $("html").html(mainwin);
                            var tableName  = "registry";

                            var filterMain = $q.and($q.isNull($q.field('rtf')),$q.eq($q.field('cu'), 'sa'));
                            metapage = new MetaPage(tableName, 'anagrafica', false);

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.init().then(function (result) {
                                metapage.state.meta  = new appMeta.MetaData(tableName);
                                appMeta.getData.fillDataSet(metapage.state.DS, tableName, "anagrafica", filterMain).then(function () {
                                    metapage.helpForm.preScanControls();
                                    // seleziono la riga di id1
                                    var filterFill = $q.eq($q.field('idreg'), 1);
                                    var rowRegistryToSel = metapage.helpForm.DS.tables[tableName].select(filterFill);
                                    metapage.helpForm.lastSelected(metapage.helpForm.DS.tables[tableName], rowRegistryToSel[0]);
                                    var combo = $("#combo1").data("customController");
                                    expect(combo).toBeDefined();

                                    metapage.freshForm(true, false).then(function () {
                                        //TODO  la tabella non è temporary quindi fa return senza fillare, e' giusto?
                                        expect( $("#combo1 option").length).toBe(0);
                                        expect( $("#combo2 option").length).toBe(0);
                                        done();
                                    });
                                });

                            });
                        });
                    }, timeout);

                    it('choose() command is ASYNC, without filter, listTop=0', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="metaRoot">' +
                                'idreg: <input type="text" name="myname" id="txtBox1" data-tag="registry.idreg" value="k1"><br>' +
                                'cu: <input type="text" name="yourname" id="txtBox2" data-tag="registry.cu" value="k2"><br>' +
                                '</div>';
                            $("html").html(mainwin);
                            $("head").append('<link rel="stylesheet" href="/styles/bootstrap/css/bootstrap.css" />');
                            $("head").append('<link rel="stylesheet" href="/styles/app.css" />');
                            metapage = new MetaPage('registry', 'anagrafica', false);
                            var s = new appMeta.MetaPageState();
                            s.meta  = new appMeta.MetaData('registry');
                            metapage.state = s;
                            metapage.listTop = 0;

                            var originGetPagedTable = appMeta.getData.getPagedTable;

                            //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                            var objConn = {
                                method: methodEnum.getDataSet,
                                prm: { tableName:"registry", editType:"anagrafica"}
                            };

                            // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                            conn.call(objConn)
                                .then(function (res) {

                                        var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                        var ds2  = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                        // imposto filtro sulla chiave
                                        var filter =  $q.eq($q.field("cu"), "assistenza");
                                        appMeta.getData.fillDataSet(ds1, "registry", "anagrafica", filter )
                                            .then(function (dsTarget) {

                                                    expect(dsTarget.name).toBe("registry_anagrafica");

                                                    var tRegistry = dsTarget.tables["registry"];

                                                    var filter = $q.eq($q.field("flag_pa"), "N");
                                                    tRegistry.staticFilter(filter);

                                                    s.DS = dsTarget;
                                                    var helpForm = new appMeta.HelpForm(s, "registry", "#metaRoot");
                                                    metapage.helpForm = helpForm;

                                                    appMeta.getData.getPagedTable = function (prm) {
                                                        tRegistry.orderBy  = function (o) {
                                                            return "idreg";
                                                        }
                                                        return $.Deferred().resolve(tRegistry, 10, 100).promise();
                                                    }

                                                    // con questa configurazione, viene mostrata il listManager in modale,
                                                    // poichè nella select one richiamata (self.listTop !== 0 || filterLocked) entra ma poi result viene > 1
                                                    // quindi va in modale con la lista. al doppio click dovrebbe selezionare e scatenare gli eventi in cascata
                                                    common.pageEventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                                        .then(function() {
                                                            appMeta.getData.getPagedTable  = originGetPagedTable;
                                                            expect($("table:first").find("tr").length).toBeGreaterThan(0); // grid dati 11 righe. 1 header + 10 dati
                                                            expect($("table:first").parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modaleù
                                                            done();
                                                        });
                                                    metapage.choose("choose.registry.anagrafica", filter, "#metaRoot");

                                                    /*.then(
                                                     function () {
                                                     appMeta.getData.getPagedTable  = originGetPagedTable;
                                                     done();
                                                     }
                                                     )*/

                                                } ,
                                                function(err) {
                                                    appMeta.getData.getPagedTable  = originGetPagedTable;
                                                    logger.log(logType.ERROR, err);
                                                    expect(1).toBe(0);
                                                    done();
                                                })
                                    } ,
                                    function(err) {
                                        appMeta.getData.getPagedTable  = originGetPagedTable;
                                        expect(1).toBe(0);
                                        done();
                                    })

                        });
                    }, timeout);

                    it('selectByCondition() is ASYNC, filter="idreg=1" and return dataRow', function (done) {
                        defLogin.then(function () {
                            var tableName  = "registry";

                            var filterMain = $q.and($q.isNull($q.field('rtf')),$q.eq($q.field('cu'), 'sa'));
                            metapage = new MetaPage(tableName, 'anagrafica', false);

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.init().then(function (result) {

                                metapage.state.meta  = new appMeta.MetaData(tableName);

                                appMeta.getData.fillDataSet(metapage.state.DS, tableName, "anagrafica", filterMain).then(function () {

                                    var filter = $q.eq($q.field('idreg'), 1);

                                    metapage.selectByCondition(filter, tableName).then(function (res) {
                                        expect(res).toBeDefined();
                                        expect(res.constructor.name).toBe("DataRow");
                                        expect(res.current.idreg).toBe(1);
                                        done();
                                    });
                                });

                            });
                        });
                    }, timeout);

                    it('selectByCondition() is ASYNC, filter with clause of row not existing return null', function (done) {
                        defLogin.then(function () {
                            var tableName  = "registry";

                            var filterMain = $q.and($q.isNull($q.field('rtf')),$q.eq($q.field('cu'), 'sa'));
                            metapage = new MetaPage(tableName, 'anagrafica', false);

                            // eseguo prima l'assure del dataset, come prerequisito
                            metapage.init().then(function (result) {

                                metapage.state.meta  = new appMeta.MetaData(tableName);

                                appMeta.getData.fillDataSet(metapage.state.DS, tableName, "anagrafica", filterMain).then(function () {

                                    var filter = $q.eq($q.field('idreg'), "abcdefghi");

                                    metapage.selectByCondition(filter, tableName).then(function (res) {
                                        expect(res).toBe(null);
                                        done();
                                    });
                                });

                            });
                        });
                    }, timeout);

                    // TODO risolvere dopo implementazione edit()
                    xit('manage() command is ASYNC', function (done) {
                        defLogin.then(function () {
                            var mainwin = '<div id="metaRoot">' +
                                'idreg: <input type="text" name="myname" id="txtBox1" data-tag="registry.idreg" value="k1"><br>' +
                                'cu: <input type="text" name="yourname" id="txtBox2" data-tag="registry.cu" value="k2"><br>' +
                                '</div>';
                            $("html").html(mainwin);
                            $("head").append('<link rel="stylesheet" href="/styles/bootstrap/css/bootstrap.css" />');
                            $("head").append('<link rel="stylesheet" href="/styles/app.css" />');
                            metapage = new MetaPage('registry', 'anagrafica', false);
                            var s = new appMeta.MetaPageState();
                            s.meta  = new appMeta.MetaData('registry');
                            metapage.state = s;
                            metapage.listTop = 0;
                            appMeta.currApp.initToolBarManager();

                            appMeta.basePath = 'base/test/spec_midway/';

                            //  recupero un ds vuoto
                            var objConn = {
                                method: methodEnum.getDataSet,
                                prm: { tableName:"registry", editType:"anagrafica"}
                            };

                            // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                            conn.call(objConn)
                                .then(function (res) {

                                        var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                        // imposto filtro sulla chiave
                                        var filter =  $q.eq($q.field("cu"), "assistenza");
                                        appMeta.getData.fillDataSet(ds1, "registry", "anagrafica", filter )
                                            .then(function (dsTarget) {

                                                    expect(dsTarget.name).toBe("registry_anagrafica");

                                                    var tRegistry = dsTarget.tables["registry"];

                                                    var filter = $q.eq($q.field("flag_pa"), "N");
                                                    tRegistry.staticFilter(filter);

                                                    s.DS = dsTarget;
                                                    var helpForm = new appMeta.HelpForm(s, "registry", "#metaRoot");
                                                    metapage.helpForm = helpForm;

                                                    metapage.manage("manage.registry.anagrafica", "cu", "sa", filter, "#metaRoot")
                                                        .then(function () {
                                                            appMeta.basePath = "base/";
                                                            done();
                                                        })

                                                } ,
                                                function(err) {
                                                    logger.log(logType.ERROR, err);
                                                    expect(1).toBe(0);
                                                    done();
                                                })
                                    } ,
                                    function(err) {
                                        appMeta.getData.getPagedTable  = originGetPagedTable;
                                        expect(1).toBe(0);
                                        done();
                                    })

                        });
                    }, timeout);

                    // TODO trovare un modo per fare il test delete senza ogni volta cambiare.
                    xit('cmdMainDelete() command is ASYNC', function (done) {

                        /**
                         *
                         *

                         1. select max(idreg) from [Rettorato_Ok].[dbo].[registry]

                         annota il max, fai la insert con idreg=max, poi effettua test manule o automatico con questo id
                         Per il test dovresti aggiugnere dei child con quell'id su regiustryreference e registryaddress

                         2. insert into [Rettorato_Ok].[dbo].[registry]
                         (idreg, annotation, active, ct, cu, lt, lu, title,
                         residence) values (1040472, 'ric_delete_test1', 'S',
                         convert(datetime,'18-07-18 10:34:09 PM',5),
                         'sa',
                         convert(datetime,'18-07-18 10:34:09 PM',5),
                         'ludefault',
                         'mytitle',
                         1
                         )

                         */
                        defLogin.then(function () {
                            var mainwin = '<div id="metaRoot">' +
                                'idreg: <input type="text" id="txtBox00" data-tag="registry.idreg"><br>' +
                                'cu: <input type="text" id="txtBox01" data-tag="registry.cu"><br>' +
                                'gender: <input type="text" id="txtBox02" data-tag="registry.gender"><br>' +
                                'forename: <input type="text" id="txtBox03" data-tag="registry.forename"><br>' +
                                'surname: <input type="text" id="txtBox04" data-tag="registry.surname"><br>' +
                                '</div>';

                            $("head").append('<link rel="stylesheet" href="/styles/bootstrap/css/bootstrap.css" />');
                            $("head").append('<link rel="stylesheet" href="/styles/app.css" />');

                            appMeta.currApp.initToolBarManager();

                            $("html").append(mainwin);

                            metapage = new MetaPage('registry', 'anagrafica', false);
                            var s = new appMeta.MetaPageState();
                            s.meta  = new appMeta.MetaData('registry');
                            metapage.state = s;
                            metapage.listTop = 0;
                            metapage.startFilter = $q.or($q.eq('idreg',1040472) , $q.eq('idreg',2), $q.eq('idreg',6), $q.eq('idreg',4), $q.eq('idreg',5));
                            metapage.init()
                                .then(function () {
                                    metapage.activate()
                                        .then(function () {
                                            metapage.helpForm.lastSelected( metapage.helpForm.DS.tables["registry"],  metapage.helpForm.DS.tables["registry"].rows[4]);
                                            metapage.reFillControls()
                                                .then(function () {

                                                    // costruisco date, senza orario e gmt nullo
                                                    /*var start = new Date();
                                                     start.setUTCHours(0, 0, 0, 0);
                                                     // aggiungo una riga, not null sono i valore della chaive più edito qualche campo
                                                     var newRow = metapage.helpForm.DS.tables["registry"].add({idreg:1040472, annotation:"insert_ric_test", lt: start, lu:"Roma"});
                                                     // chiamo metodo server
                                                     appMeta.postData.saveDataSet(metapage.helpForm.DS, "registry", "anagrafica", null)
                                                     .then(function (dsTarget,  messages, success, canignore) {
                                                     if (success){
                                                     expect((dsTarget!==false)).toBe(true);

                                                     } else {
                                                     done();
                                                     }

                                                     });*/


                                                    done();
                                                });
                                        })
                                })

                        });
                    }, timeout);

                    // TODO capire bene come impostare il test
                    xit("filterList() filters and fills the dataTable, with row selected,  fills control with expected value",
                        function (done) {
                            defLogin.then(function () {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="registry.cu" value="sa"><br>' +
                                    '<input type="text" id="txtBox2" data-tag="registry.lu"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                                var objConn = {
                                    method: methodEnum.getDataSet,
                                    prm: { tableName:"registry", editType:"anagrafica"}
                                };

                                // 1. recupero ds vuoto
                                conn.call(objConn)
                                    .then(function(res) {
                                        // recupero ds vuoto
                                        var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                        // inizializzo oggetti necessari
                                        metapage = new MetaPage('registry', 'anagrafica', false);
                                        var s = new appMeta.MetaPageState();
                                        s.DS = ds;
                                        s.meta  = new appMeta.MetaData('registry');

                                        metapage.state = s;
                                        var helpForm = new appMeta.HelpForm(s, "registry", "#rootelement");
                                        helpForm.pagestate = s;
                                        metapage.helpForm = helpForm;



                                        // imposto filtro sulla chiave, con varie righe tornate
                                        var filter =  $q.or($q.eq('idreg',1) , $q.eq('idreg',2), $q.eq('idreg',6), $q.eq('idreg',4), $q.eq('idreg',1040471));
                                        appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                            .then(function (dsTarget) {

                                                var filterL = $q.eq('idreg', 1);
                                                var dt =  ds.tables['registry'];
                                                helpForm.lastSelected(dt, dt.rows[0]);
                                                // Testo il metodo dopo le configurazioni iniziali
                                                metapage.filterList(filterL)
                                                    .then(function (result) {
                                                            expect($('#txtBox2').val()).toBe(""); // il valore non viene rimpiazzato, con quello presente sul dt con il valore selezionato
                                                            done();
                                                        },
                                                        function (error) {
                                                            console.log(error);
                                                            expect(false).toBe(true);
                                                            done();
                                                        });

                                            })

                                    });
                            }, timeout);
                        });
                });
        });
});
