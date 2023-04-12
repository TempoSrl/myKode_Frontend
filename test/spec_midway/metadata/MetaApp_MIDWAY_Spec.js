'use strict';

describe('MetaApp',
    function() {
        var appMeta;
        var oldFixture;
        beforeEach(function() {
            oldFixture = jasmine.getFixtures().fixturesPath;
            jasmine.getFixtures().fixturesPath = 'base/test/spec_midway/fixtures';
            // inizializzo per ogni test l'oggetto appMeta        
            appMeta = window.appMeta;
            //appMeta.init(); this has already been executed, when executed breaks registered controllers
            appMeta.basePath = 'base/test/spec_midway/';
            //console.log('beforeEach:');
            $("html").html('<head></head><body></body>');
            loadFixtures('EmptyPage.html');
          
        });
        
        afterEach(function () {
            appMeta.basePath = oldFixture; //'/';
        });

        describe("MetaApp class",
            function() {


                it('get Mocked "Registry Anagrafica" jsDataSet. Useful for Midway test',
                    function() {
                        // relative path  json client\test\spec_midway\jstest\registry_anagrafica.json
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSet();
                        
                        var registryTableName = 'registry';
                        var registryaddressTableName = 'registryaddress';
                        var registryreferenceTableName = 'registryreference';
                        
                        // Test sulle tabelle
                        expect(ds.name).toBe("registry_anagrafica");
                        expect(ds.tables[registryTableName].rows.length).toBe(0);
                        expect(ds.tables[registryaddressTableName].rows.length).toBe(0);
                        expect(ds.tables[registryreferenceTableName].rows.length).toBe(0);

                        expect(Object.keys(ds.tables[registryTableName].columns).length).toBe(42);
                        expect(Object.keys(ds.tables[registryaddressTableName].columns).length).toBe(18);
                        expect(Object.keys(ds.tables[registryreferenceTableName].columns).length).toBe(22);

                        expect(ds.relations["registry_registryaddress"]).toBeDefined();
                        expect(ds.relations["registry_registryreference"]).toBeDefined();

                        // Test sulle relazioni
                        var rel_FK_registryaddress_registry = ds.relations["registry_registryaddress"];
                        var rel_FK_registryreference_registry = ds.relations["registry_registryreference"];

                        expect(rel_FK_registryaddress_registry.childTable).toBe(registryaddressTableName);
                        expect(rel_FK_registryaddress_registry.parentTable).toBe(registryTableName);
                        expect(rel_FK_registryaddress_registry.childCols.length).toBe(1);
                        expect(rel_FK_registryaddress_registry.childCols[0]).toBe("idreg");

                        expect(rel_FK_registryreference_registry.childTable).toBe(registryreferenceTableName);
                        expect(rel_FK_registryreference_registry.parentTable).toBe(registryTableName);
                        expect(rel_FK_registryreference_registry.childCols.length).toBe(1);
                        expect(rel_FK_registryreference_registry.childCols[0]).toBe("idreg");
                        
                    });

                it('get Mocked "Registry Anagrafica filled" jsDataSet. Useful for Midway/e2e test',
                    function() {
                        // relative path  json client\test\spec_midway\jstest\registry_anagrafica.json
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        var registryTableName = 'registry';
                        var registryaddressTableName = 'registryaddress';
                        var registryreferenceTableName = 'registryreference';

                        // Test sulle righe filled delle tabelle
                        expect(ds.name).toBe("registry_anagrafica");
                        expect(ds.tables[registryTableName].rows.length).toBe(486);
                        expect(ds.tables[registryaddressTableName].rows.length).toBe(3);
                        expect(ds.tables[registryreferenceTableName].rows.length).toBe(2);

                        expect(Object.keys(ds.tables[registryTableName].columns).length).toBe(42);
                        expect(Object.keys(ds.tables[registryaddressTableName].columns).length).toBe(18);
                        expect(Object.keys(ds.tables[registryreferenceTableName].columns).length).toBe(22);

                        expect(ds.relations["FK_registryaddress_registry"]).toBeDefined();
                        expect(ds.relations["FK_registryreference_registry"]).toBeDefined();

                        // Test sulle relazioni
                        var rel_FK_registryaddress_registry = ds.relations["FK_registryaddress_registry"];
                        var rel_FK_registryreference_registry = ds.relations["FK_registryreference_registry"];

                        expect(rel_FK_registryaddress_registry.childTable).toBe(registryaddressTableName);
                        expect(rel_FK_registryaddress_registry.parentTable).toBe(registryTableName);
                        expect(rel_FK_registryaddress_registry.childCols.length).toBe(1);
                        expect(rel_FK_registryaddress_registry.childCols[0]).toBe("idreg");

                        expect(rel_FK_registryreference_registry.childTable).toBe(registryreferenceTableName);
                        expect(rel_FK_registryreference_registry.parentTable).toBe(registryTableName);
                        expect(rel_FK_registryreference_registry.childCols.length).toBe(1);
                        expect(rel_FK_registryreference_registry.childCols[0]).toBe("idreg");

                    });
                
                // *** TEST addMetaPage e getMetaPage
                describe("add/getMetaPage",
                    function() {
                        
                        it('after invoking addMetaPage, getMetaPage returns data as a promise',
                            function(done) {
                                // costruisco oggetto metPage()
                                var aMetaPage = function metaPage() {
                                };
                                aMetaPage.prototype = {
                                    constructor: aMetaPage
                                };

                                // eseguo prima l'add di un metaPage
                                appMeta.addMetaPage('table1', 'def', aMetaPage);
                                // verifico che torni il valore esatto che avevo passato
                                appMeta.getMetaPage('table1', 'def').then(function(result) {
                                        // Deve essere definito, cioè la promise mi deve tornare qualcosa
                                        expect(result).toBeDefined();
                                        // verifico il tipo di ritorno sia quello che mi aspetto, cioè quello passato nella add
                                        expect(result.constructor.name).toEqual("metaPage");
                                        done();
                                    },
                                    function(error) {
                                        expect(error).toBeUndefined();
                                        done();
                                    });                                
                            });

                        // test caricamento a runtime, poiché la pagina non è stata instanziata
                        xit('getMetaPage retrieves data from server',
                            function(done) {
                                // verifico che torni il valore esatto che avevo passato
                                appMeta.getMetaPage('table1', 'def').then(function(result) {
                                        // Deve essere definito, cioè la promise mi deve tornare qualcosa
                                        expect(result).toBeDefined();
                                        // verifico siano valorizzati prm del costruttore 
                                        expect(result.primaryTableName).toBeDefined();
                                        expect(result.editType).toBeDefined();
                                        expect(result.detailPage).toBeDefined();
                                        // verifico sia presente un metodo noto del prototipo base (ad esempio propagateChangesToMaster())
                                        expect(result['propagateChangesToMaster']).toBeDefined();
                                    
                                        // verifico il tipo di ritorno sia quelo che mi aspetto, cioè quello passato nella add
                                        expect(result.constructor.name).toEqual("metaPage_table1");
                                        expect(result.name).toEqual("metaPage_table1");
                                        done();
                                    },
                                    function(error) {
                                        console.log('async getMetaPage failed');
                                        expect(true).toBe(false);
                                        done();
                                    });

                            }
                            );
                    });

                describe("add/getPage",
                    function() {

                        // test caricamento a runtime, poichè la pagina non è stata instanziata
                        it('getPage should be async and return data',
                            function(done) {
                                // verifico che torni il valore esatto che avevo passato
                                appMeta.getPage(document.documentElement, 'table1', 'def').then(function(result) {
                                        // Deve essere definito, cioè la promise mi deve tornare qualcosa
                                        expect(result).toBeDefined();

                                        // verifico sia html valido
                                        var doc = $.parseHTML(result);
                                        expect(doc).toBeDefined();
                                        done();
                                    },
                                    function(error) {
                                        console.log(error + 'async getPage failed');
                                        expect(error).toBeUndefined();
                                        done();
                                    });

                            });

                        // test caricamento a runtime, poichè la pagina non è stata instanziata
                        it('getPage should be async and return exact data',
                            function(done) {
                                // dichiaro il mio rootelemnt
                                var rootElement = "#rootElement";
                                // variabili di test che contnegono il testo degli elementi html
                                var pdocinit = 'P doc init';
                                var ddoctarget = 'Sono DIV di MetaPage1';
                                var ddocinit = 'D doc init';

                                // sovrascrivo il mio doc principale per avere un test più chiaro e semplice
                                var mainwin = '<p>' +
                                    pdocinit +
                                    '</p><div id="rootElement">' +
                                    ddocinit +
                                    '</div>';
                                $("#externalDiv").html(mainwin);

                                // verifico che torni il valore esatto che avevo passato
                                appMeta.getPage(rootElement, 'table1', 'def').then(function(result) {
                                        // Deve essere definito, cioè la promise mi deve tornare qualcosa
                                        expect(result).toBeDefined();
                                        // var resExpected = '<head></head><body><p>P doc init</p><div><div>Sono DIV di MetaPage1</div></div></body>';
                                        // Rileggo l'html  il p rimane lo stesso. Significa che il resto dell' html è stato preservato'
                                        expect($("#externalDiv").find('p').first()).toContainText(pdocinit);
                                        // il div viene riempito con il nuovo html atteso
                                        expect($(rootElement).first()).toContainText(ddoctarget);
                                        // il div iniziale non è più presente
                                        expect($(rootElement).first()).not.toContainText(ddocinit);
                                        // verifico si html
                                        var doc = $.parseHTML(result);
                                        expect(doc).toBeDefined();
                                        done();
                                    },
                                    function(error) {
                                        console.log(error + 'async getPage failed');
                                        expect(error).toBeUndefined();
                                        done();
                                    });

                            }
                            );

                        // test caricamento a runtime di pagine multiple con js
                        it('when loading multiple pages, last one overwrites previous',
                            function(done) {
                                window.testGetPageOneTimeScript = 0;
                                // dichiaro il mio rootelemnt
                                var rootElement = "#rootElement";
                                // variabili di test che contnegono il testo degli elementi html
                                var ddocinit = 'D doc init';
                                // sovrascrivo il mio doc principale per avere un test più chiaro e semplice
                                var mainwin = '<div>Testo base</div>';
                                $(rootElement).html(mainwin);

                                // Prendo prima Page2 --> poi Page3
                                appMeta.getPage(rootElement, 'table2', 'def').then(function (result) {
                                    expect($(rootElement).html()).toContainText('Sono DIV di MetaPage2');
                                        // verifico che torni il valore esatto che avevo passato
                                        appMeta.getPage(rootElement, 'table3', 'def').then(function(result) {
                                            // il div viene riempito con il nuovo html atteso
                                                expect($(rootElement).html()).toContainText('Sono DIV di MetaPage3');
                                                delete window.testGetPageOneTimeScript;
                                                done();
                                            },
                                            function (error) {
                                                delete window.testGetPageOneTimeScript;
                                                console.log(error + 'async getPage failed');
                                                expect(error).toBeUndefined();
                                                done();
                                            });                                        
                                    },
                                    function(error) {
                                        console.log(error + 'async getPage failed');
                                        expect(error).toBeUndefined();
                                        done();
                                    });
                            });

                        it('getPage runs javascript contained in the retrieved html',
                            function(done) {
                                window.testGetPageOneTimeScript = 0;
                                // dichiaro il mio rootelemnt
                                var rootElement = "#rootElement";
                                
                                // verifico che torni il valore esatto che avevo passato
                                appMeta.getPage(rootElement, 'table3', 'def').then(function(result) {
                                    // il div viene riempito con il nuovo html atteso
                                    expect(window.testGetPageOneTimeScript).toEqual(1);
                                        delete window.testGetPageOneTimeScript;
                                        done();
                                    },
                                    function (error) {
                                        delete window.testGetPageOneTimeScript;
                                        console.log(error + 'async getPage failed');
                                        expect(error).toBeUndefined();
                                        done();
                                    });
                            }
                            );

                        it('getPage runs javascript contained in the retrieved html every time it is rendered',
                            function(done) {
                                window.testGetPageOneTimeScript = 0;
                                // dichiaro il mio rootelemnt
                                var rootElement = "#rootElement";
                                // variabili di test che contnegono il testo degli elementi html
                                // sovrascrivo il mio doc principale per avere un test più chiaro e semplice
                                

                                // Prendo prima Page2 --> poi Page3
                                appMeta.getPage(rootElement, 'table2', 'def').then(function (result) {
                                        expect(window.testGetPageOneTimeScript).toEqual(1);
                                        // verifico che torni il valore esatto che avevo passato
                                        appMeta.getPage(rootElement, 'table3', 'def').then(function(result) {
                                                // il div viene riempito con il nuovo html atteso
                                            expect(window.testGetPageOneTimeScript).toEqual(2);
                                                delete window.testGetPageOneTimeScript;
                                                done();
                                            },
                                            function (error) {
                                                delete window.testGetPageOneTimeScript;
                                                console.log(error + 'async getPage failed');
                                                expect(error).toBeUndefined();
                                                done();
                                            });

                                    },
                                    function(error) {
                                        console.log(error + 'async getPage failed');
                                        expect(error).toBeUndefined();
                                        done();
                                    });
                            }
                            );
                        
                    });

            });

    });