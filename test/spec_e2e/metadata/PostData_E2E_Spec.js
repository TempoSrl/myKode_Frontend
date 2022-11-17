'use strict';

describe('PostData e2e', function () {
    var postData;
    var conn;
    var ds;
    var $q = window.jsDataQuery;
    var methodEnum = appMeta.routing.methodEnum;
    var timeout  = 50000;
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
        appMeta.common.buildDs1();
        conn = appMeta.connection;
        ds = appMeta.common.ds1;
        postData = appMeta.postData;

        appMeta.basePath = "base/";
        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
    });

    afterEach(function () {
    });

    describe("Test methods that save and return DB data from server. sometimes the have to return message errors",
        function() {

            it('Method saveDataSet() is ASYNC (1 row updated, null messages parameter): 1. getDataSet empty from server; 2.fillDataSet; 3. Launch method saveDataSet() -> value is updated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry",
                                editType:"anagrafica"
                            }
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                var filter =  $q.eq($q.field("idreg"), 1);

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {
                                        var field = "annotations"; //il campo annotations è 400 caratteri
                                        var newValue = "a"; // concateno al valore una "a"
                                        var tregistryaddress = dsTarget.tables.registryaddress;
                                        var rowTested = tregistryaddress.rows[0];

                                        // modifico il valore di una riga
                                        var originalValue = rowTested[field];
                                        tregistryaddress.assignField(rowTested, field ,originalValue + newValue);
                                        tregistryaddress.rows[0].getRow().state  = jsDataSet.dataRowState.modified;

                                        // chiamo metodo server
                                        postData.saveDataSet(dsTarget, "registry", "anagrafica", null)
                                            .then(function (dsTarget2, messages, success, canIgnore) {

                                                expect((dsTarget2!==false)).toBe(true);
                                                expect(messages.length).toBe(0); //non ci sono messaggi
                                                expect(success).toBe(true); // metodo esegue correttamente
                                                expect(canIgnore).toBe(true); // non ci son0o messaggi, quindi anche canIgnore è true
                                                // verifico che tornino dei dati
                                                var tRegistryAddress = dsTarget2.tables["registryaddress"];

                                                // verifico almeno 1 riga, altrimenti test non è attendibile
                                                expect(tRegistryAddress.rows.length).toBeGreaterThan(0);

                                                _.forEach(tRegistryAddress.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });

                                                // mi aspetto che il valore sia cambaito
                                                expect(tRegistryAddress.rows[0][field]).toBe(originalValue + newValue);
                                                done();
                                            });
                                    });
                            });
                    });
                }, timeout);

            it('Method saveDataSet() is ASYNC (1 row added and the deleted): 1. getDataSet empty from server; 2.fillDataSet; 3. Launch method saveDataSet() -> values are added',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
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

                                var filter =  $q.eq($q.field("idreg"), 1);

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {
                                        var field = "lu"; //ilc mapo annotations è 400 caratteri
                                        var tregistryaddress = dsTarget.tables.registryaddress;
                                        var oldCountRows = tregistryaddress.rows.length;

                                        // costrusco date, senza orario e gmt nullo
                                        var start = new Date();
                                        start.setUTCHours(0, 0, 0, 0);

                                        // aggiungo una riga, not null sono i valore della chaive più edito campo "lu"
                                        var newRow = tregistryaddress.add({idreg:1, idaddresskind:4, start: start, lu:"Roma"});

                                        // chiamo metodo server
                                        postData.saveDataSet(dsTarget, "registry", "anagrafica", null)
                                            .then(function (dsTarget2,  messages, success, canignore) {

                                                if (success){
                                                    expect((dsTarget2!==false)).toBe(true);
                                                    // verifico che tornino dei dati
                                                    var tRegistryAddress = dsTarget2.tables["registryaddress"];

                                                    // verifico almeno 1 riga, altrimenti test non è attendibile
                                                    expect(tRegistryAddress.rows.length).toBeGreaterThan(0);

                                                    _.forEach(tRegistryAddress.rows,function (r) {
                                                        expect(r.idreg).toBe(1);
                                                    });

                                                    var newCountRows = tRegistryAddress.rows.length;

                                                    // mi aspetto 1 riga in più, è testo il campo
                                                    expect(newCountRows).toBe(oldCountRows + 1);
                                                    expect(tRegistryAddress.rows[newCountRows - 1][field]).toBe("Roma");

                                                    // cancello al riga appena inserita. così testo la delete, inoltre evito righe con chiave duplicate nei successivi lanci
                                                    tRegistryAddress.rows[newCountRows - 1].getRow().del();

                                                    postData.saveDataSet(dsTarget2, "registry", "anagrafica", null)
                                                        .then(function (dsTarget3) {
                                                            expect((dsTarget3!==false)).toBe(true);
                                                            // verifico che tornino dei dati
                                                            var tRegistryAddress3 = dsTarget3.tables["registryaddress"];
                                                            var newCountRows = tRegistryAddress3.rows.length;
                                                            // mi aspetto che il valore sia quello originale
                                                            expect(newCountRows).toBe(oldCountRows);
                                                            done();
                                                        })
                                                } else {
                                                    expect(messages.length).toBe(1);
                                                    expect(messages[0].description.length).toBeGreaterThan(10);
                                                    done();
                                                }

                                            });
                                    });
                            });
                    });
                }, timeout);

            it('Method saveDataSet() is ASYNC (more row update more orw added and deleted): 1. getDataSet empty from server; 2.fillDataSet; 3. Launch method saveDataSet() -> value is updated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
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
                                var countRows;
                                var filter =  $q.eq($q.field("idreg"), 1);

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {

                                        var tregistryaddress = dsTarget.tables.registryaddress;
                                        countRows = tregistryaddress.rows.length;
                                        var start = new Date();
                                        start.setUTCHours(0, 0, 0, 0);

                                        var start2 = new Date();
                                        start2.setDate(start2.getDate() + 1)
                                        start2.setUTCHours(0, 0, 0, 0);

                                        // ADD
                                        tregistryaddress.add({idreg:1, idaddresskind:4, start: start, lu:"Roma"});
                                        tregistryaddress.add({idreg:1, idaddresskind:4, start: start2, lu:"Roma"});

                                        // chiamo metodo server
                                        postData.saveDataSet(dsTarget, "registry", "anagrafica", null)
                                            .then(function (dsTarget2, messages, success, canignore) {
                                                if (success){
                                                    expect((dsTarget2!==false)).toBe(true);
                                                    // verifico che tornino dei dati
                                                    var tRegistryAddress = dsTarget2.tables["registryaddress"];
                                                    var countRowsNew = tRegistryAddress.rows.length;
                                                    // verifico ci siano 2 righe in più
                                                    expect(countRowsNew).toBe(countRows + 2);

                                                    // EDIT
                                                    var field = "annotations"; //il campo annotations è 400 caratteri
                                                    var newValue = "a"; // concateno al valore una "a"
                                                    var rowTested = tRegistryAddress.rows[0];
                                                    var originalValue = rowTested[field];
                                                    tRegistryAddress.assignField(rowTested, field ,originalValue + newValue);
                                                    tRegistryAddress.rows[0].getRow().state  = jsDataSet.dataRowState.modified;

                                                    // DELETE delle 2 righe appena inserite, così testo la delete multipla e resetto alla situaizone iniziale
                                                    tRegistryAddress.rows[countRowsNew - 1].getRow().del();
                                                    tRegistryAddress.rows[countRowsNew - 2].getRow().del();

                                                    // chiamo metodo server
                                                    postData.saveDataSet(dsTarget2, "registry", "anagrafica", null)
                                                        .then(function (dsTarget3, messages, success, canignore) {

                                                            expect((dsTarget3!==false)).toBe(true);

                                                            // verifico che tornino dei dati
                                                            var tRegistryAddress = dsTarget3.tables["registryaddress"];
                                                            var countRowsNew = tRegistryAddress.rows.length;
                                                            // verifico almeno 1 riga, altrimenti test non è attendibile
                                                            expect(countRowsNew).toBeGreaterThan(0);

                                                            _.forEach(tRegistryAddress.rows,function (r) {
                                                                expect(r.idreg).toBe(1);
                                                            })

                                                            // mi aspetto che il valore sia cambaito
                                                            expect(tRegistryAddress.rows[0][field]).toBe(originalValue + newValue);
                                                            // stesso numero di righe dell'inizio, poichè aggiunte e cancellate
                                                            expect(countRowsNew).toBeGreaterThan(countRows);

                                                            done();
                                                        });
                                                } else {
                                                    expect(messages.length).toBe(2);
                                                    expect(messages[0].description.length).toBeGreaterThan(10);
                                                    done();
                                                }

                                            });
                                    });
                            });
                    });
                }, timeout);

            it('Method saveDataSet()-> test isValid() is ASYNC (1 row added):' +
                '1. getDataSet empty from server; 2.fillDataSet;' +
                '3. Launch method saveDataSet() -> obtains error message on "title"' ,
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
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

                                var filter =  $q.eq($q.field("surname"), 'Caprilli');

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {
                                        var tregistry = dsTarget.tables.registry;
                                        var oldCountRows = tregistry.rows.length;
                                        // aggiungo una riga, not null sono i valore della chaive più edito campo "lu"
                                        var newRow = tregistry.add({idreg:99990001,
                                            surname:'Caprilli',
                                            forename: 'test e2e',
                                            annotation : 'test e2e' + (oldCountRows + 1).toString()
                                        });

                                        // chiamo metodo server
                                        postData.saveDataSet(dsTarget, "registry", "anagrafica", null)
                                            .then(function (dsTarget2,  messages, success, canIgnore) {

                                                expect(success).toBeFalsy();
                                                expect(canIgnore).toBeFalsy();
                                                expect(messages.length).toBe(1);
                                                expect(messages[0].canIgnore).toBeFalsy();
                                                expect(messages[0].description).toBe('field: title  err: Un determinato campo non può essere vuoto. (title)');
                                                expect(messages[0].id).toBe("pre/registry/A/Validazione");
                                                expect(messages[0].severity).toBe("Errore");
                                                tregistry = dsTarget2.tables["registry"];

                                                // la riga è ancora in stao added
                                                expect(tregistry.rows[oldCountRows].getRow().state).toBe(jsDataSet.dataRowState.added);
                                                done();
                                            });
                                    });
                            });
                    });
                }, timeout);

            it('Method saveDataSet()-> test isValid() is ASYNC (2 row added): ' +
                '1. getDataSet empty from server; 2.fillDataSet; ' +
                '3. Launch method saveDataSet() -> obtains 2 error message: 1fs on "title", 2nd on "idregistryclass"',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
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

                                var filter =  $q.eq($q.field("surname"), 'Caprilli');

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {
                                        var tregistry = dsTarget.tables.registry;
                                        var oldCountRows = tregistry.rows.length;
                                        // aggiungo una riga, not null sono i valore della chaive più edito campo "lu"
                                        var newRow = tregistry.add({idreg:99990001,
                                            surname:'Caprilli',
                                            forename: 'test e2e',
                                            annotation : 'test e2e' + (oldCountRows + 1).toString()
                                        });

                                        var newRow = tregistry.add({idreg:99990002,
                                            surname:'Caprilli',
                                            forename: 'test e2e',
                                            title:'test e2e Caprilli',
                                            annotation : 'test e2e error on registryclass' + (oldCountRows + 1).toString()
                                        });

                                        // chiamo metodo server
                                        postData.saveDataSet(dsTarget, "registry", "anagrafica", null)
                                            .then(function (dsTarget2,  messages, success, canIgnore) {

                                                expect(success).toBeFalsy();
                                                expect(canIgnore).toBeFalsy();
                                                expect(messages.length).toBe(2);
                                                expect(messages[0].canIgnore).toBeFalsy();
                                                expect(messages[0].description).toBe('field: title  err: Un determinato campo non può essere vuoto. (title)');
                                                expect(messages[0].id).toBe("pre/registry/A/Validazione");
                                                expect(messages[0].severity).toBe("Errore");

                                                expect(messages[1].canIgnore).toBeFalsy();
                                                expect(messages[1].description).toBe('field: idregistryclass  err: Attenzione! Selezionare la Tipologia.');
                                                expect(messages[1].id).toBe("pre/registry/A/Validazione");
                                                expect(messages[1].severity).toBe("Errore");

                                                tregistry = dsTarget2.tables["registry"];

                                                // le 2 righe inserite in sono ancora in stato added
                                                expect(tregistry.rows[oldCountRows].getRow().state).toBe(jsDataSet.dataRowState.added);
                                                expect(tregistry.rows[oldCountRows + 1].getRow().state).toBe(jsDataSet.dataRowState.added);
                                                done();
                                            });
                                    });
                            });
                    });
                }, timeout);


            it('Method saveDataSet() custom DS, read from json',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        // recupero ds vuoto
                        var jsonPath = "base/test/spec_midway/jstest/dataset.json" ;
                        var json = $.getJSON({'url': jsonPath, 'async': false});
                        var dsToSave = appMeta.getDataUtils.getJsDataSetFromJson(json.responseText);
                        // chiamo metodo server
                        postData.saveDataSet(dsToSave, "registry", "docenti", null)
                            .then(function (dsTarget2,  messages, success, canignore) {
                                expect(success).toBeTruthy();
                                done();
                            });

                    });
                }, timeout);



        });
});
