'use strict';

describe('Data', function () {
    var conn;
    var ds;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var $q = window.jsDataQuery;
    var methodEnum = appMeta.routing.methodEnum;
    var timeout  = 600000;
    var funCompareDataSetSerDes, checkColumnKeys;
    var defLogin;
    // effettuo login
    beforeAll(function () {
        appMeta.connection.setTestMode(true);
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
                if (res) defLogin.resolve(true);
            });
        return defLogin.promise();
    });

    beforeEach(function () {
        appMeta.common.buildDs1();
        conn = appMeta.connection;
        ds  = appMeta.common.ds1;

        /**
         * Richiamata in 2 punti
         * @param {DataSet} ds
         */
        funCompareDataSetSerDes = function (ds) {

            expect(ds.name).toBe("dsmeta_registry_anagrafica"); // nome aspettato

            // test sullaproprietà isPrimaryKey
            expect(ds.tables.registryreference.columns.idreg.isPrimaryKey).toBe(true); // è chiave
            expect(ds.tables.registryreference.columns.idregistryreference.isPrimaryKey).toBe(true); // è chiave
            expect(ds.tables.registryreference.columns.lt.isPrimaryKey).toBeUndefined(); // una die sempio che NON è chiave

            expect(ds.tables.registryreference.columns.txt.expression).toBe("registryreference.lu");
            expect(ds.tables.registryreference.columns.faxnumber.expression).toBeDefined();
            expect(ds.tables.registryreference.columns.faxnumber.expression.myName).toBe("eq");
            expect(ds.tables.registryreference.columns.faxnumber.expression.myArguments.length).toBe(2);
            expect(ds.tables.registryreference.columns.faxnumber.expression.myArguments[0].myName).toBe("field");
            expect(ds.tables.registryreference.columns.faxnumber.expression.myArguments[1].myName).toBe("constant");

            var rowsLength = ds.tables['registryreference'].rows.length;
            expect( rowsLength).toBeGreaterThan(0);
            expect( ds.tables['registryreference'].rows[0].getRow().state).toBe('modified');
            expect(ds.tables['registryreference'].rows[1].getRow().state).toBe('unchanged');
            expect(ds.tables['registryreference'].rows[2].getRow().state).toBe('deleted');
            expect(ds.tables['registryreference'].rows[rowsLength - 1].getRow().state).toBe('added');

            // Test deserializzazione proprietà di AutoIncrement
            // lato c# popolo struttura in maniera custom. lato js devo trovare stessa struttura
            var col = ds.tables['registryreference'].autoIncrementColumns.idreg;

            expect(col.columnName).toBe('idreg');
            // lato c# se colonna numerica mette idLen=0 e undefined "middleConst" e "prefixField"
            expect(col.idLen).toBe(0);
            // expect(col.middleConst).toBe('MiddleConst');
            //expect(col.prefixField).toBe('PrefixField');

            expect(col.middleConst).toBeUndefined();
            expect(col.prefixField).toBeUndefined();
            expect(col.minimum).toBe(1);
            expect(col.isNumber).toBeTruthy();
            expect(col.selector instanceof Array).toBeTruthy();
            expect(col.selectorMask instanceof Array).toBeTruthy();
            expect(col.selector.length).toBe(3);
            expect(col.selectorMask.length).toBe(3);
            expect(_.isEqual(_.sortBy(col.selector), _.sortBy(["referencename", "cu", "lt"]))).toBeTruthy();
            expect(_.isEqual(_.sortBy(col.selectorMask), _.sortBy(["123","456","789"]))).toBeTruthy();

            // test su colonna non numerica. i valori di "idLen", "middleConst" e "prefixField" sono quelli aspettati, presi dal server
            var colEmail = ds.tables['registryreference'].autoIncrementColumns.email;
            expect(colEmail.idLen).toBe(12);
            expect(colEmail.middleConst).toBe('MiddleConst');
            expect(colEmail.prefixField).toBe('PrefixField');
            expect(colEmail.minimum).toBe(1);
            expect(colEmail.isNumber).toBeFalsy();
            expect(colEmail.selector instanceof Array).toBeTruthy();
            expect(colEmail.selectorMask instanceof Array).toBeTruthy();
            expect(colEmail.selector.length).toBe(3);
            expect(colEmail.selectorMask.length).toBe(3);
            expect(_.isEqual(_.sortBy(colEmail.selector), _.sortBy(["referencename", "cu", "lt"]))).toBeTruthy();
            //expect(_.isEqual(colEmail.selector, ["referencename","cu","lt"])).toBeTruthy();
            expect(_.isEqual(_.sortBy(colEmail.selectorMask), _.sortBy(["123","456","789"]))).toBeTruthy();
        };

        /**
         * Generalizza check sulla proprietà "isPrimaryKey" delle colonne, in base all'array myKey del DataTable
         * @param {DataTable} t
         */
        checkColumnKeys = function (t) {
            _.forEach(t.columns, function (c) {
                // se si trova nell'array delle chiavi allora isPrimaryKey è true
                if (_.indexOf(t.myKey, c.name) !== -1){
                    expect(c.isPrimaryKey).toBe(true);
                }else{
                    expect(c.isPrimaryKey).toBeUndefined();
                }
            })
        }
    });

    afterEach(function () {
        expect(appMeta.Stabilizer.nesting).toBe(0);
    });

    describe("Test DataSet with server",
        function() {

            it('Get ds from server, basic test"',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSetTest,
                            prm: { testClientCode: 'test1' },
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    // creo nuovo jsDataSet da popolare
                                    var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1.name).toBe("dsmeta_registry_anagrafica"); // nome aspettato
                                    expect(Object.keys(ds1.tables['registry'].columns).length).toBeGreaterThan(0);
                                    expect(Object.keys(ds1.tables['registryaddress'].columns).length).toBeGreaterThan(0);
                                    expect(Object.keys(ds1.tables['registryreference'].columns).length).toBeGreaterThan(0);

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err);
                                    expect(err).toBe(0);

                                    done();
                                });
                    });
                }, timeout);

            it('Take custom JsDataSet deserializes it, sends to server and gets again from the server in the answer',
                function(done) {
                    defLogin.then(function () {
                        // forzo lo stato a unchanged.così poi nel successivo for lo metterà a modified
                        // così crea "curr" e "old"
                        _.forEach( ds.tables['table1'].rows,
                            function (r) {
                                r.getRow().acceptChanges();
                            }
                        );

                        _.forEach( ds.tables['table1'].rows,
                            function (r, index) {
                                r["c_name"] =  r["c_name"] + index.toString();
                            }
                        );

                        // setto alcune extendedProperties pee verificare sul server
                        ds.tables['table1'].columns['c_dec'].maxstringlen = 20;
                        ds.tables['table1'].columns['c_dec'].caption = "DecimalColumn";
                        // proprietà expression
                        var c1 = $q.eq("c_dec", 11);
                        var c2 = $q.eq("c_name", "anto");
                        var c3 = $q.eq("c_dec", 12);
                        var c4 = $q.eq("c_name", "ric");
                        var filterOriginal = $q.or($q.and([c1, c2]),$q.and([c3, c4]));
                        ds.tables['table1'].columns['c_dec'].expression = filterOriginal;

                        // view source
                        ds.tables['table1'].columns['c_dec'].viewSource = 'table2';

                        // setto key
                        ds.tables['table3'].key(['c_int16','c_alt']);
                        ds.tables['table1'].key(['c_name']);
                        ds.tables['table2'].key(['c_name']);

                        var cond1 = $q.like("c_name", 'n');
                        var cond2 = $q.eq("c_dec", 11);

                        var staticFilter = $q.and([cond1, cond2]);
                        ds.tables['table1'].staticFilter(staticFilter);

                        var rowsFilter1 = ds.tables['table1'].select(staticFilter);

                        ds.tables['table1'].tableForReading("table1ForReading");
                        ds.tables['table1'].tableForWriting("table1ForWriting");
                        ds.tables['table1'].skipSecurity(true);
                        ds.tables['table2'].skipSecurity(false);
                        ds.tables['table1'].skipInsertCopy(true);
                        ds.tables['table2'].skipInsertCopy(false);
                        ds.tables['table2'].realTable("table1");
                        ds.tables['table2'].viewTable("table3");

                        ds.tables['table1'].isCached = "1";
                        ds.tables['table2'].isCached = "0";
                        appMeta.metaModel.temporaryTable(ds.tables['table1'], true);

                        // set dei defaults
                        ds.tables['table1'].defaults({c_name:"Sdef", c_dec:1234});
                        ds.tables['table3'].defaults({c_date: new Date()});

                        //orderby
                        ds.tables['table1'].orderBy("c_name");

                        //autoincrement
                        ds.tables['table1'].autoIncrement('c_dec', {middleConst: '14', idLen: 6, selector:['c_name'], selectorMask:[123]});


                        // 2. serializzo in object
                        var serMyDs = ds.serialize(true);
                        // 3. creo json da inviare
                        var jsonToSend = JSON.stringify(serMyDs);
                        //console.log(jsonToSend);

                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.fromJsDataSetToDataset,
                            prm: { ds: jsonToSend },
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);
                                    //console.log(res);
                                    // creo nuovo jsDataSet da popolare
                                    var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                    expect(ds1.name).toBe("temp"); // nome aspettato
                                    // mi aspetto 3 tabelle
                                    expect(Object.keys(ds1.tables).length).toBe(4);

                                    // numero colonne aspettatate per ogni tabella
                                    expect(Object.keys(ds1.tables['table1'].columns).length).toBe(3);
                                    expect(Object.keys(ds1.tables['table2'].columns).length).toBe(2);
                                    expect(Object.keys(ds1.tables['table3'].columns).length).toBe(4);

                                    // mi aspetto un determinato numero di righe per ogni tabella
                                    expect(ds1.tables['table1'].rows.length).toBe(2);
                                    expect(ds1.tables['table2'].rows.length).toBe(2);
                                    expect(ds1.tables['table3'].rows.length).toBe(3);

                                    expect(ds1.tables['table1'].rows[0].c_name).toBe("nome10");
                                    expect(ds1.tables['table1'].rows[0].c_dec).toBe(11);
                                    expect(ds1.tables['table1'].rows[0].c_double).toBe(1001);

                                    // il num di defaults è lo stesso del num colonne + testo valori
                                    var defaultsT1 =  ds1.tables["table1"].myDefaults;
                                    expect(Object.keys(defaultsT1).length).toBe(3);
                                    expect(defaultsT1.c_name).toBe("Sdef");
                                    expect(defaultsT1.c_dec).toBe(1234);
                                    expect(defaultsT1.c_double).toBe(null);


                                    // valuto il default sia la data è il giorno dovrebbe essere quello attuale, quindi creo una new date al volo e confronto
                                    var defaultsT3 =  ds1.tables["table3"].myDefaults;
                                    expect(defaultsT3.c_date.constructor.name).toBe("Date");
                                    expect(defaultsT3.c_date.getDate()).toBe(new Date().getDate());
                                    // altri campi senza default in partenza hanno null
                                    expect(defaultsT3.c_alt).toBe(null);
                                    expect(defaultsT3.c_sex).toBe(null);

                                    expect(ds1.tables['table1'].rows[0].getRow().old.c_name).toBe("nome1"); // old value
                                    expect(ds1.tables['table1'].rows[0].getRow().current.c_name).toBe("nome10");
                                    expect(ds1.tables['table1'].rows[0].getRow().current.c_dec).toBe(11);
                                    expect(ds1.tables['table1'].rows[0].getRow().current.c_double).toBe(1001);

                                    expect(ds1.tables['table2'].rows[0].getRow().current.c_name).toBe("nome1");
                                    expect(ds1.tables['table2'].rows[0].getRow().current.c_citta).toBe("roma");
                                    expect(ds1.tables['table2'].rows[1].getRow().current.c_name).toBe("nome2");
                                    expect(ds1.tables['table2'].rows[1].getRow().current.c_citta).toBe("bari");

                                    // test sulle Extended properties delDataTable
                                    expect(ds1.tables['table1'].tableForReading()).toBe("table1ForReading");
                                    expect(ds1.tables['table2'].tableForReading()).toBe("table2");
                                    expect(ds1.tables['table1'].tableForWriting()).toBe("table1ForWriting");
                                    expect(ds1.tables['table2'].tableForWriting()).toBe('table2');

                                    // skypSecurity
                                    expect(ds1.tables['table1'].skipSecurity()).toBe(true);
                                    expect(ds1.tables['table2'].skipSecurity()).toBe(false);
                                    expect(ds1.tables['table3'].skipSecurity()).toBe(false);

                                    // skypSecurity
                                    expect(ds1.tables['table1'].skipInsertCopy()).toBe(true);
                                    expect(ds1.tables['table2'].skipInsertCopy()).toBe(false);
                                    expect(ds1.tables['table3'].skipInsertCopy()).toBe(false);

                                    // test su realTable e ViewTable
                                    expect(ds1.tables['table2'].realTable()).toBe('table1');
                                    expect(ds1.tables['table2'].viewTable()).toBe('table3');

                                    // orderby
                                    expect(ds1.tables['table1'].orderBy()).toBe("c_name");

                                    // isCached
                                    expect(ds1.tables['table1'].isCached).toBe("1");
                                    expect(ds1.tables['table2'].isCached).toBe("0");
                                    expect(ds1.tables['table3'].isCached).toBeUndefined();
                                    expect(appMeta.metaModel.temporaryTable(ds1.tables['table1'])).toBe(true);
                                    expect(appMeta.metaModel.temporaryTable(ds1.tables['table2'])).toBeUndefined();
                                    expect(appMeta.metaModel.temporaryTable(ds1.tables['table3'])).toBeUndefined();

                                    // check sulla deserializzazione dello static filter
                                    var staticFilterDes = ds1.tables['table1'].staticFilter();
                                    var rowsFilter2 = ds.tables['table1'].select(staticFilterDes);
                                    expect(staticFilter.myName).toBe(staticFilterDes.myName);
                                    expect(_.isEqual(rowsFilter1, rowsFilter2)).toBe(true);

                                    expect(ds1.tables['table3'].rows[0].c_alt).toBe(1.5);
                                    expect(ds1.tables['table3'].rows[0].c_int16).toBe(2018);
                                    expect(ds1.tables['table3'].rows[0].c_date.getDate()).toBe(2);
                                    expect(ds1.tables['table3'].rows[0].c_date.getMonth() + 1).toBe(10);
                                    expect(ds1.tables['table3'].rows[0].c_date.getFullYear()).toBe(1980);
                                    expect(ds1.tables['table3'].rows[0].getRow().current.c_alt).toBe(1.5);
                                    expect(ds1.tables['table3'].rows[0].getRow().current.c_int16).toBe(2018);
                                    expect(ds1.tables['table3'].rows[0].getRow().current.c_sex).toBe("maschio");
                                    expect(ds1.tables['table3'].rows[0].getRow().current.c_date.getDate()).toBe(2);
                                    expect(ds1.tables['table3'].rows[0].getRow().current.c_date.getMonth() + 1).toBe(10);
                                    expect(ds1.tables['table3'].rows[0].getRow().current.c_date.getFullYear()).toBe(1980);

                                    // la tabella 1 ha la riga old poichè era stata modificata, mentre la tabella 2 no
                                    expect(Object.keys(ds1.tables['table1'].rows[1].getRow().old)[0]).toBe("c_name");
                                    expect(Object.keys(ds1.tables['table1'].rows[1].getRow().old).length).toBe(1);
                                    expect(Object.keys(ds1.tables['table2'].rows[1].getRow().old).length).toBe(0);

                                    //check sulle chiavi
                                    expect(ds1.tables['table1'].myKey[0]).toBe("c_name");
                                    expect(ds1.tables['table2'].myKey[0]).toBe("c_name");
                                    expect(ds1.tables['table3'].myKey[0]).toBe("c_int16");
                                    expect(ds1.tables['table3'].myKey[1]).toBe("c_alt");

                                    // Check sulle relazioni
                                    expect(ds1.relations.r1).toBeDefined();
                                    expect(ds1.relations.r1.parentTable).toBe('table1');
                                    expect(ds1.relations.r1.childTable).toBe('table2');
                                    expect(ds1.relations.r1.parentCols[0]).toBe('c_name');
                                    expect(ds1.relations.r1.childCols[0]).toBe('c_name');

                                    // check su proprietà colonna
                                    expect(ds.tables['table1'].columns['c_dec'].expression).toBeDefined();
                                    expect(ds.tables['table1'].columns['c_name'].expression).toBeUndefined();

                                    expect(ds.tables['table1'].columns['c_dec'].expression.myName).toBe("or");
                                    expect(ds.tables['table1'].columns['c_dec'].expression.myArguments[0].myName).toBe("and");
                                    expect(ds.tables['table1'].columns['c_dec'].expression.myArguments[1].myName).toBe("and");
                                    expect(ds.tables['table1'].columns['c_dec'].expression).toEqual(filterOriginal);
                                    // test su prop viewSource della colonna
                                    expect(ds1.tables["table1"].columns['c_dec'].viewSource).toBe('table2');
                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore fromJsDataSetToDataset ', 'err: ' , err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            it('Get the typed server DataSet: "Registry"',
                function(done) {
                    defLogin.then(function () {
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSetTest,
                            prm: { testClientCode: 'test1' },
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    // creo nuovo jsDataSet da popolare
                                    var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1.name).toBe("dsmeta_registry_anagrafica"); // nome aspettato
                                    expect(Object.keys(ds1.tables['registry'].columns).length).toBe(43);
                                    expect(Object.keys(ds1.tables['registryaddress'].columns).length).toBe(18);
                                    expect(Object.keys(ds1.tables['registryreference'].columns).length).toBe(22);

                                    checkColumnKeys(ds1.tables['registry']);
                                    checkColumnKeys(ds1.tables['registryaddress']);
                                    checkColumnKeys(ds1.tables['registryreference']);

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err);
                                    expect(err).toBe(0);

                                    done();
                                });
                    });
                }, timeout);

            it('getDataSetTest test1: Get the typed server DataSet: "registryreference" with added and deleted rows',
                function(done) {
                    defLogin.then(function () {
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSetTest,
                            prm: { testClientCode: 'test2' },
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    // creo nuovo jsDataSet da popolare
                                    var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1.name).toBe("dsmeta_registry_anagrafica"); // nome aspettato
                                    var rowsLenght = ds1.tables['registryreference'].rows.length;
                                    expect(rowsLenght).toBeGreaterThan(0);
                                    expect( ds1.tables['registryreference'].rows[0].getRow().state).toBe('modified');
                                    expect(ds1.tables['registryreference'].rows[1].getRow().state).toBe('unchanged');
                                    expect( ds1.tables['registryreference'].rows[2].getRow().state).toBe('deleted');
                                    expect( ds1.tables['registryreference'].rows[rowsLenght -1].getRow().myState).toBe('added');

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            it('getDataSetTest test2: 1. Get "registryreference" from server, 2. send to server 3. and get again, no data loss. AutoIncrementInfo deserialized',
                function (done) {
                    defLogin.then(function () {
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSetTest,
                            prm: { testClientCode: 'test2' },
                            noLogError: true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                //Ci sono 6 righe ove referencename like riccardo%. La prima riga è modified (flagdefault,referencename) , la 3a è deleted, l'ultima è added

                                logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ', res);

                                // creo nuovo jsDataSet da popolare
                                var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                //Ci sono 6 righe ove referencename like riccardo%. La prima riga è modified (flagdefault,referencename) , la 3a è deleted, l'ultima è added
                                // verifico  gli expect
                                funCompareDataSetSerDes(ds1);
                                // 2. serializzo in object
                                //var serMyDs = ds1.serialize(true);
                                // 3. creo json da inviare
                                var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataSet(ds1, true);

                                // 4. creo oggetto per l'invio al server
                                var objConn2 = {
                                    method: methodEnum.fromJsDataSetToDataset,
                                    prm: { ds: jsonToSend },
                                    noLogError: true
                                }
                                // 4. invio la richiesta al server
                                return conn.call(objConn2)

                            },
                                function (err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ', err);
                                    expect(err).toBe(0);
                                    done();
                                })
                            .then(function (res) {

                                // creo nuovo jsDataSet da popolare
                                var ds2 = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                // verifico  gli expect
                                funCompareDataSetSerDes(ds2);

                                done();
                            },
                                function (err) {
                                    logger.log(logType.ERROR, 'Errore fromJsDataSetToDataset ', 'err: ', err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            it('GetDataSet method without required one parameter, must returns error',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry"},
                            noLogError : true
                        };
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    // se entra qui è errore
                                    expect(true).toBe(false);
                                    done();
                                },
                                function(err) {
                                    expect(err.text).toContain("Il campo editType è obbligatorio");
                                    done();
                                });
                    });
                }, timeout);

            it('GetDataSet method with required parameter null, must returns error',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:null},
                            noLogError : true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    // se entra qui è errore
                                    expect(true).toBe(false);
                                    done();
                                },
                                function(err) {
                                    expect(err.text).toContain("Il campo editType è obbligatorio");
                                    done();
                                });
                    });
                }, timeout);

            it('GetDataSet method with required parameter undefined, must returns error',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:undefined},
                            noLogError : true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    // se entra qui è errore
                                    expect(true).toBe(false);
                                    done();
                                },
                                function(err) {
                                    expect(err.text).toContain("Il campo editType è obbligatorio");
                                    done();
                                });
                    });
                });

            it('GetDataSet method return a DataSet (registry_anagrafica), defaults are ok',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1.name).toBe("registry_anagrafica"); // nome aspettato
                                    //no dati
                                    expect(ds1.tables["registry"].rows.length).toBe(0);
                                    expect(ds1.tables["registryaddress"].rows.length).toBe(0);
                                    expect(ds1.tables["registryreference"].rows.length).toBe(0);

                                    expect(Object.keys(ds1.tables['registry'].columns).length).toBe(43);
                                    expect(Object.keys(ds1.tables['registryaddress'].columns).length).toBe(18);
                                    expect(Object.keys(ds1.tables['registryreference'].columns).length).toBe(22);

                                    checkColumnKeys(ds1.tables['registry']);
                                    checkColumnKeys(ds1.tables['registryaddress']);
                                    checkColumnKeys(ds1.tables['registryreference']);

                                    // il num di defualts è lo stesso del num colonne
                                    var defaults =  ds1.tables["registry"].myDefaults;
                                    expect(Object.keys(defaults).length).toBe(43);
                                    // testo alcuni default che mi aspetto, conoscendo i valori del server.
                                    // test stringa, int e data
                                    expect(defaults.active).toBe("S");
                                    expect(defaults.residence).toBe(0);
                                    expect(defaults.ct.constructor.name).toBe("Date");
                                    // valuto il default sia la data è il giorno dovrebbe essere quello attuale, quindi creo una new date al volo e confronto
                                    expect(defaults.ct.getDate()).toBe(new Date().getDate());

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                    expect(err).toBe(false);
                                    done();
                                });
                    });
                }, timeout);

            it('GetDataSet method return a DataSet (registry_reference)',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registryreference", editType:"persone"},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                expect(ds1.name).toBe("registryreference_persone"); // nome aspettato
                                    //no dati
                                    expect(ds1.tables["registryreference"].rows.length).toBe(0);
                                    expect(Object.keys(ds1.tables['registryreference'].columns).length).toBeGreaterThan(0);

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                    expect(err).toBe(false);
                                    done();
                                });
                    });
                }, timeout);

            it('FillDataSet method with Eq filter',
                function(done) {
                    defLogin.then(function () {
                        var filter = $q.eq($q.field("cu"), "assistenza");
                        var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);

                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.fillDataSet,
                            prm: { tableName:"registry", editType:"anagrafica", filter: filterSerialized},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1.name).toBe("registry_anagrafica");

                                    var t = ds1.tables["registry"];
                                    if ( t.rows.length === 0){
                                        logger.log(logType.ERROR, "Non sono tornate righe, il test 'FillDataSet method with Eq filter' non è Attendibile con questi dati");
                                    }

                                    // tutte le righe devono essere filtrare su cu = assistenza
                                    _.forEach(t.rows,function (r) {
                                        expect(r.cu.toUpperCase()).toBe("assistenza".toUpperCase());
                                    });

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore FillDataSet ', 'err: ' , err.text);
                                    expect(err).toBe(null);
                                    done();
                                });
                    });
                }, timeout);

            it('FillDataSet method with AND(eq, eq) filter',
                function(done) {
                    defLogin.then(function () {
                        var filter = $q.and($q.eq($q.field("cu"), "sa"), $q.eq($q.field("residence"), 3));
                        // var filter = $q.eq($q.field("cu"), "sa");
                        var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);

                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.fillDataSet,
                            prm: { tableName:"registry", editType:"anagrafica", filter: filterSerialized},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1.name).toBe("registry_anagrafica");
                                    var t = ds1.tables["registry"];

                                    if ( t.rows.length === 0){
                                        logger.log(logType.ERROR, "Non sono tornate righe, il test 'FillDataSet method with AND(eq, eq) filter' non è Attendibile con questi dati");
                                    }

                                    // verifico che il campo "cu" abbia effettivamente solo "sa" e "residence" solo 3 come da filtro impostato
                                    for (var i = 0 ; i< t.rows.length; i++){
                                        expect(t.rows[i].cu).toBe("sa");
                                    }

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore FillDataSet ', 'err: ' , err.text);
                                    expect(err).toBe(null);
                                    done();
                                });
                    });
                }, timeout);

            it('Select method on table registry returns a DataTable',
                function(done) {
                    defLogin.then(function () {
                        var filter = $q.eq($q.field("cu"), "assistenza");
                        var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.select,
                            prm: { tableName:"registry", columnList:"idreg,active,cu", top:3, filter:filterSerialized},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    var dt = appMeta.getDataUtils.getJsDataTableFromJson(res);
                                    expect(dt.name).toBe("registry"); // nome tabella
                                    expect(dt.rows.length).toBe(3); // top tre righe
                                    expect(Object.keys(dt.columns).length).toBe(3); // solo le 3 colonne richeiste
                                    expect(dt.columns.active).toBeDefined(); // mi aspetto solo le colonne messe in columnList
                                    expect(dt.columns.cu).toBeDefined();
                                    expect(dt.columns.idreg).toBeDefined();

                                    // verifico che il campo cu abbia effettivamente solo "assistenza"
                                    for (var i = 0 ; i< dt.rows.length; i++){
                                        expect((dt.rows[i].cu).toUpperCase()).toBe("assistenza".toUpperCase());
                                    }
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);
                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore select ', 'err: ' , err.text);
                                    expect(err).toBe(null);
                                    done();
                                });
                    });
                }, timeout);

            it('selectCount method returns an integer, table registry, filtered on "cu" field',
                function(done) {

                    defLogin.then(function () {
                        var filter = $q.eq($q.field("cu"), "assistenza");
                        var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.selectCount,
                            prm: { tableName:"registry", filter:filterSerialized},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    // verifico torni un count, non posso utilizzare un coutn preciuso, perchè il db potrebbe cambiare
                                    expect(typeof res).toBe("number");
                                    expect(res).toBeGreaterThan(-1);

                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);
                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore selectCount ', 'err: ' , err.text);
                                    expect(err).toBe(null);
                                    done();
                                });
                    });
                }, timeout);

            it('KeyFilter on DataTable with one key i correctly send to c#, it transform in and of eq',
                function(done) {
                    defLogin.then(function () {
                        var keyfilter = ds.tables.table1.keyFilter(appMeta.common.objrow1);
                        var tfilter1 = ds.tables.table1.select(keyfilter);
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(keyfilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method:  methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                    // riconverto la stringa json proveniente dal server
                                    var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                    var tfilter2 = ds.tables.table1.select(m);
                                    expect(_.isEqual(tfilter1, tfilter2)).toBe(true);
                                    done();
                                },
                                function (err) {
                                    logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    done();
                                });
                    });
                }, timeout);

            xit('Only For DEBUG Read Dataset json server and deserializes in JsDataSet',
                function(done) {
                    defLogin.then(function () {
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.read,
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);

                                    var objParsed = JSON.parse(res);

                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore readDataset ', 'err: ' , err.text);
                                    expect(err).toBe(null);

                                    done();
                                });
                    });

                }, timeout);
        });

});
