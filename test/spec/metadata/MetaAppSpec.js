'use strict';

describe('MetaApp',
    function() {
        var appMeta;
        beforeEach(function() {
            jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
            // inizializzo per ogni test l'oggetto appMeta        
            appMeta = window.appMeta;
            appMeta.init();
            appMeta.basePath = 'base/test/spec/';
            //console.log('beforeEach:');
            $("html").html('<head></head><body></body>');
            loadFixtures('EmptyPage.html');
          
        });

        describe("MetaApp class",
            function() {

                // *** General test appMeta object ***
                it('window.appMeta exists',
                    function() {
                        expect(window.appMeta).toBeDefined();
                    });

                it('window.appMeta is a MetaApp',
                    function() {
                        expect(window.appMeta.constructor.name).toBe("TestApp");
                    });

                describe("addMeta/getMeta ",
                    function() {
                        // *** Test addMeta method ***
                        it('getMeta always returns a metadata',
                            function() {
                                expect(appMeta.getMeta('table')).toBeDefined();
                            });

                        // *** Test getMeta method ***
                        it('addMeta(table,meta) adds a Meta',
                            function() {

                                appMeta.addMeta('tablename', new appMeta.MetaData('tablename'));
                                var mymeta = appMeta.getMeta('tablename');
                                expect(mymeta).toBeDefined();
                            });

                        // verifica che l'oggetto aggiunto tramite addMeta, sia quello corretto
                        it('getMeta returns an instance of the requested Meta',
                            function() {
                                appMeta.addMeta('tablename', new appMeta.MetaData('tablename'));
                                var mymeta1 = appMeta.getMeta('tablenameNot');
                                var mymeta2 = appMeta.getMeta('tablename');
                                expect(Object.getPrototypeOf(mymeta1).constructor.name).toBe('MetaData')
                                expect(mymeta1).toBeDefined();
                                expect(mymeta2).toBeDefined();
                            });
                    });

            });

    });
