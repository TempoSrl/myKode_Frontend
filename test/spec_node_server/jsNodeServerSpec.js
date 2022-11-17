'use strict';

describe('javascript call NODEJS backend',
    function() {

        var timeout = 100000;

        beforeEach(function() {
        
        });

        describe('auth methods',
            function () {

                it('login username and password', function (done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile)
                        .then(function (res) {
                            expect(res).toBeTruthy();
                            done();
                        });
                }, timeout)
            });

        describe('CRUD methods:',
            function() {

                it("getPagedTable",
                    function (done) {
                        var q = jsDataQuery;
                        var filter = q.and(q.eq('idreg',1));
                        appMeta.getData.getPagedTable('registry',2, 10, filter, "default" )
                            .then(function (dt, totpage, totrows) {
                                expect(dt.name).toBe('registry');
                                expect(dt.columns.idreg.isPrimaryKey).toBeTruthy();
                                expect(totpage).toBe(1);
                                expect(totrows).toBe(1);
                                done();
                            });
                    }, timeout);

                it("getDataSet",
                    function (done) {
                        appMeta.getData.getDataSet('registry', "anagrafica" )
                            .then(function (ds) {
                                expect(ds.name).toBe('registry_anagrafica');
                                expect(ds.tables.registry).toBeDefined();
                                expect(Object.keys(ds.relations).length).toBeGreaterThan(0);
                                done();
                            });
                    }, timeout);

                it("select",
                    function (done) {
                        var q = jsDataQuery;
                        var filter = q.or(q.eq('idreg',1) ,q.eq('idreg',2), q.eq('idreg',3));
                        appMeta.getData.runSelect('registry', "idreg,cf", filter,2 )
                            .then(function (dt) {
                                expect(dt.name).toBe('registry');
                                expect(dt.rows.length).toBe(2);
                                done();
                            });
                    }, timeout);

                it("multiRunSelect",
                    function (done) {
                        const q = jsDataQuery;
                        const ds = new jsDataSet.DataSet("temp");
                        const t1name = 'registry';
                        const t2name = 'geo_city';
                        const filter1 = q.or(q.eq('idreg',1) ,q.eq('idreg',2), q.eq('idreg',3));
                        const filter2 = q.eq('idcity',1);
                        ds.newTable(t1name);
                        ds.newTable(t2name);
                        const selBuilderArray = [];
                        selBuilderArray.push({ filter: filter1, top: null, tableName: t1name, table: ds.tables[t1name] });
                        selBuilderArray.push({ filter: filter2, top: null, tableName: t2name, table: ds.tables[t2name] });
                        appMeta.getData.multiRunSelect(selBuilderArray)
                            .then(function (res) {
                                expect(ds.name).toBe('temp');
                                expect(ds.tables.registry).toBeDefined();
                                expect(ds.tables.geo_city).toBeDefined();
                                expect(ds.tables.registry.rows.length).toBe(3);
                                expect(ds.tables.geo_city.rows.length).toBe(1);
                                done();
                            });
                    }, timeout);

                it("getDsByRowKey",
                        function (done) {
                                // recupera un dataset e poi lo popola a aprtire dalla riga principale
                                appMeta.getData.getDataSet('registry', "anagrafica" )
                                    .then(function (ds) {
                                            const objrow1 = { idreg: 1};
                                            ds.tables.registry.add(objrow1);
                                            ds.tables.registry.acceptChanges();
                                            const dtRow = objrow1.getRow();
                                            appMeta.getData.getDsByRowKey(dtRow, ds.tables.registry, "anagrafica" )
                                                .then(function (ds) {
                                                        expect(ds.name).toBe('registry_anagrafica');
                                                        expect(ds.tables.registry).toBeDefined();
                                                        expect(ds.tables.registry.rows.length).toBe(1);
                                                        expect(ds.tables.registryreference.rows.length).toBe(1);
                                                        expect(ds.tables.registryaddress.rows.length).toBe(1);
                                                        // test su nomi colonna e valori
                                                        expect(ds.tables.registryreference.rows[0].idreg).toBe(1);
                                                        expect(ds.tables.registry.rows[0].idreg).toBe(1);
                                                        expect(ds.tables.registryaddress.rows[0].idreg).toBe(1);

                                                        // check sui campi di tipo data
                                                       /* var lt = ds.tables.registryaddress.rows[0].lt;
                                                        expect(lt.getHours()).toBe(13);
                                                        expect(lt.getMinutes()).toBe(51);
                                                        expect(lt.getDate()).toBe(3);*/
                                                        done();
                                                });
                                    });

                        }, timeout);

                it("saveDataSet",
                    function (done) {
                        // 1. recupera un dataset e poi lo popola a aprtire dalla riga principale
                        appMeta.getData.getDataSet('registry', "anagrafica" )
                            .then(function (ds) {
                                const objrow1 = { idreg: 1};
                                ds.tables.registry.add(objrow1);
                                ds.tables.registry.acceptChanges();
                                const dtRow = objrow1.getRow();

                                // 2. prendo ds popolato
                                appMeta.getData.getDsByRowKey(dtRow, ds.tables.registry, "anagrafica" )
                                    .then(function (ds) {

                                        // 3. modifico il dataset
                                        var field = "annotations"; // il campo annotations è 400 caratteri
                                        var tregistryaddress = ds.tables.registryaddress;
                                        var rowTested = tregistryaddress.rows[0];
                                        var characterToAdd ="%";
                                        // evito di aggiugneread ogni lancio dit est il "newValue", quindi se la stringa contiene come ultimo carattere "newValue"
                                        // lo rimuovo, altrimenti lo concateno (la volta successiva così lo rimuovo)
                                        var originalValue = rowTested[field];
                                        var newValue;
                                        if (!!originalValue &&
                                            originalValue.slice( rowTested[field].length - 1) === characterToAdd) {
                                            newValue = originalValue.slice(0, -1)
                                        } else {
                                            newValue = (!originalValue ? '' : originalValue) + characterToAdd;
                                        }

                                        tregistryaddress.assignField(rowTested, field , newValue);
                                        tregistryaddress.rows[0].getRow().state  = jsDataSet.dataRowState.modified;

                                        // 4. chiamo metodo server per salvare il dataset
                                        appMeta.postData.saveDataSet(ds, "registry", "anagrafica", [])
                                            .then(function (dsTarget2, messages, success, canignore) {

                                                expect((dsTarget2!==false)).toBe(true);
                                                expect(messages.length).toBe(0); //non ci sono messaggi
                                                expect(success).toBe(true); // metodo esegue correttamente
                                                expect(canignore).toBe(true); // non ci son0o messaggi, quindi anche canignore è true
                                                // verifico che tornino dei dati
                                                var tRegistryAddress = dsTarget2.tables["registryaddress"];

                                                // verifico almeno 1 riga, altrimenti test non è attendibile
                                                expect(tRegistryAddress.rows.length).toBeGreaterThan(0);

                                                _.forEach(tRegistryAddress.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });

                                                // mi aspetto che il valore sia cambiato
                                                expect(tRegistryAddress.rows[0][field]).toBe(newValue);
                                                done();
                                            });
                                    });
                            });

                    }, timeout);

                it("doGet empty ds",
                    function (done) {
                        // recupera un dataset e poi lo popola a aprtire dalla riga principale
                        appMeta.getData.getDataSet('registry', "anagrafica" )
                            .then(function (ds) {
                                const objrow1 = { idreg: 1};
                                ds.tables.registry.add(objrow1);
                                ds.tables.registry.acceptChanges();
                                const dtRow = objrow1.getRow();
                                appMeta.getData.doGet(ds, dtRow, 'registry', true )
                                    .then(function (ds) {
                                        expect(ds.name).toBe('registry_anagrafica');
                                        expect(ds.tables.registry).toBeDefined();
                                        expect(ds.tables.registry.rows.length).toBe(1);
                                        expect(ds.tables.registryreference.rows.length).toBe(1);
                                        expect(ds.tables.registryaddress.rows.length).toBe(1);
                                        // test su nomi colonna e valori
                                        expect(ds.tables.registryreference.rows[0].idreg).toBe(1);
                                        expect(ds.tables.registry.rows[0].idreg).toBe(1);
                                        expect(ds.tables.registryaddress.rows[0].idreg).toBe(1);
                                        done();
                                    });
                            });

                    }, timeout);

                it("doGet already filled ds",
                    function (done) {
                        // recupera un dataset e poi lo popola a aprtire dalla riga principale
                        appMeta.getData.getDataSet('registry', "anagrafica" )
                            .then(function (ds) {
                                const objrow1 = { idreg: 1};
                                ds.tables.registry.add(objrow1);
                                ds.tables.registry.acceptChanges();
                                const dtRow1 = objrow1.getRow();
                                appMeta.getData.getDsByRowKey(dtRow1, ds.tables.registry, "anagrafica" )
                                    .then(function (ds) {
                                        const dtRow2 = ds.tables.registry.rows[0].getRow();
                                        appMeta.getData.doGet(ds, dtRow2, 'registry', true )
                                            .then(function (ds) {
                                                expect(ds.name).toBe('registry_anagrafica1');
                                                expect(ds.tables.registry).toBeDefined();
                                                expect(ds.tables.registry.rows.length).toBe(1);
                                                expect(ds.tables.registryreference.rows.length).toBe(1);
                                                expect(ds.tables.registryaddress.rows.length).toBe(1);
                                                // test su nomi colonna e valori
                                                expect(ds.tables.registryreference.rows[0].idreg).toBe(1);
                                                expect(ds.tables.registry.rows[0].idreg).toBe(1);
                                                expect(ds.tables.registryaddress.rows[0].idreg).toBe(1);
                                                done();
                                            });
                                        done();
                                    });
                            });

                    }, timeout);

                xit("saveDataSet with messages",
                    function (done) {
                        // 1. recupera un dataset e poi lo popola a aprtire dalla riga principale
                        appMeta.getData.getDataSet('registry', "anagrafica" )
                            .then(function (ds) {
                                const objrow1 = { idreg: 1};
                                ds.tables.registry.add(objrow1);
                                ds.tables.registry.acceptChanges();
                                const dtRow = objrow1.getRow();

                                // 2. prendo ds popolato
                                appMeta.getData.getDsByRowKey(dtRow, ds.tables.registry, "anagrafica" )
                                    .then(function (ds) {

                                        // 3. modifico il dataset
                                        var field = "annotations"; // il campo annotations è 400 caratteri
                                        var tregistryaddress = ds.tables.registryaddress;
                                        var rowTested = tregistryaddress.rows[0];
                                        var characterToAdd ="%";
                                        // evito di aggiugneread ogni lancio dit est il "newValue", quindi se la stringa contiene come ultimo carattere "newValue"
                                        // lo rimuovo, altrimenti lo concateno (la volta successiva così lo rimuovo)
                                        var originalValue = rowTested[field];
                                        var newValue;
                                        if (!!originalValue &&
                                            originalValue.slice( rowTested[field].length - 1) === characterToAdd) {
                                            newValue = originalValue.slice(0, -1)
                                        } else {
                                            newValue = (!originalValue ? '' : originalValue) + characterToAdd;
                                        }

                                        tregistryaddress.assignField(rowTested, field , newValue);
                                        tregistryaddress.rows[0].getRow().state  = jsDataSet.dataRowState.modified;

                                        var messages = buildSaveDataSetMessage();

                                        // 4. chiamo metodo server per salvare il dataset
                                        appMeta.postData.saveDataSet(ds, "registry", "anagrafica", messages)
                                            .then(function (dsTarget2, messages, success, canignore) {

                                                expect((dsTarget2!==false)).toBe(true);
                                                expect(messages.length).toBeGreaterThan(0); //non ci sono messaggi
                                                expect(success).toBe(false); // metodo esegue correttamente
                                                expect(canignore).toBe(false); // non ci son0o messaggi, quindi anche canignore è true
                                                // verifico che tornino dei dati
                                                var tRegistryAddress = dsTarget2.tables["registryaddress"];

                                                // verifico almeno 1 riga, altrimenti test non è attendibile
                                                expect(tRegistryAddress.rows.length).toBeGreaterThan(0);

                                                _.forEach(tRegistryAddress.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });

                                                // mi aspetto che il valore sia cambiato
                                                expect(tRegistryAddress.rows[0][field]).not.toBe(newValue);
                                                done();
                                            });
                                    });
                            });

                    }, timeout);

                function buildSaveDataSetMessage() {
                    var  messages = [];
                    var m1 = new appMeta.DbProcedureMessage(1, 'descr 1', 'audit 1', 'errore', 'registryaddress', true);
                    var m2 = new appMeta.DbProcedureMessage(2, 'descr 2', 'audit 2', 'errore', 'registryaddress', true);
                    messages.push(m1);
                    messages.push(m2);
                    return messages;
                }
            });
    });
