'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject,spyOn,$,jsDataSet,appMeta,_ */

describe('javascript core test',
    function() {
        
        beforeEach(function() {
        
        });


        it("baseField value is there",
            function () {
                const ds = new jsDataSet.DataSet('temp');
                const tableA = ds.newTable('a'),
                    tableB = ds.newTable('b'),
                    tableC = ds.newTable('c'),
                    tableD = ds.newTable('d');
                tableA.key('idA');
                tableB.key('idA', 'idB');
                tableC.key('idA', 'idB', 'idC');
                tableD.key('idD');
                tableA.defaults({g0:0,g1:1,g2:2});
                tableA.autoIncrement('idA', {});
                tableB.autoIncrement('idB', {selector: ['idA'],idLen:5});
                tableC.autoIncrement('idC', {selector: ['idA','idB']});
                ds.newRelation('ab', 'a', 'idA', 'b', 'idA');
                ds.newRelation('bc', 'b', 'idA,idB', 'c', 'idA,idB');

                spyOn(ds.tables.b, "makeChild").and.callThrough();
                const rA = ds.tables.a.newRow(),
                    rB = ds.tables.b.newRow({}, rA);
                expect(ds.tables.b.makeChild).toHaveBeenCalled();
                expect(rB.idB).toBe('00001');
            });

        //test true
        describe('assigning prototype',
            function() {

                function baseClass() {
                    this.A = 'base';
                    this.C = 'baseC';
                }

                baseClass.prototype = {
                    constructor: baseClass,
                    method1: function() {
                        return this.A;
                    },
                    setBaseC: function(x) {
                        this.C = x;
                    },
                    getBaseC: function() {
                        return this.C;
                    },
                    method3: function(x) {

                        return x + this.C;
                    }
                };

                function DerivedClass() {
                    baseClass.apply(this, arguments);
                    this.B = 'derived';
                    this.A = 'derived';
                }

                DerivedClass.prototype = _.extend(
                    new baseClass(),
                    {
                        constructor: DerivedClass,
                        method2: function(d) {
                            this.A = d;
                        },
                        method3: function(d) {
                            return this.superClass.method3.call(this, d) * 2;
                        },
                        superClass: baseClass.prototype
            });

                
                it("baseField value is there",              
                    function () {
                        const der = new DerivedClass();
                        expect(der.B).toEqual('derived');
                        expect(der.C).toEqual('baseC');
                    });

                it("derived Field value is there",
                    function () {
                        const der = new DerivedClass();
                        expect(der.A).toEqual('derived');
                    });
                it("base  Method call refers to derived method",
                    function () {
                        const der = new DerivedClass();
                        expect(der.method1()).toEqual('derived');
                    });

                it("multiple instance derived  Method call refers to different data instance",
                    function () {
                        const der1 = new DerivedClass();
                        const der2 = new DerivedClass();
                        der1.method2(7);
                        der2.method2(12);
                        expect(der1.method1()).toEqual(7);
                        expect(der2.method1()).toEqual(12);
                    });

                it("multiple instance base  Method call  refers to different data instance",
                    function () {
                        const der1 = new DerivedClass();
                        const der2 = new DerivedClass();
                        der1.setBaseC(7);
                        der2.setBaseC(12);
                        expect(der1.getBaseC()).toEqual(7);
                        expect(der2.getBaseC()).toEqual(12);
                    });

                it("base class method call is available",
                    function() {
                        const der1 = new DerivedClass();
                        der1.setBaseC(10);
                        expect(der1.method3(1)).toEqual(22);

                    });
            });

        describe('$.Deferred',
            function () {
                beforeEach(function () {
                    jasmine.clock().install();
                });

                afterEach(function () {
                    jasmine.clock().uninstall();
                });


                it('then() are chainable - with deferred results',
                    function(done) {
                        let calledA = false,
                            calledB = false,
                            calledC = false;

                        function A(x) {
                            calledA = true;
                            expect(x).toBeUndefined();
                            return $.Deferred().resolve(2).promise();
                        }

                        function B(x) {
                            calledB = true;
                            expect(x).toBe(2);
                            return 3;
                        }

                        function C(x) {
                            calledC = true;
                            expect(x).toBe(3);
                            return $.Deferred().resolve(4).promise();
                        }

                        const def = A()
                            .then(B)
                            .then(C);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeFalsy();
                        expect(calledC).toBeFalsy();
                        jasmine.clock().tick(1);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeTruthy();
                        expect(calledC).toBeTruthy();

                        

                        done();
                    });

                it('then() are chainable - with sync results',
                    function (done) {
                        let calledA = false,
                            calledB = false,
                            calledC = false;

                        function A(x) {
                            calledA = true;
                            expect(x).toBeUndefined();
                            return $.Deferred().resolve(2).promise();
                        }

                        function B(x) {
                            calledB = true;
                            expect(x).toBe(2);
                            return 3;
                        }

                        function C(x) {
                            calledC = true;
                            expect(x).toBe(3);
                            return 4;
                        }

                        const def = A()
                            .then(B)
                            .then(C);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeFalsy();
                        expect(calledC).toBeFalsy();
                        jasmine.clock().tick(1);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeTruthy();
                        expect(calledC).toBeTruthy();



                        done();
                    });

                it('then() are chainable - with rejection pos.1',
                    function (done) {
                        let calledA = false,
                            calledB = false,
                            calledC = false,
                            calledD = false;

                        function A(x) {
                            calledA = true;
                            expect(x).toBeUndefined();
                            return $.Deferred().reject(2).promise();
                        }

                        function B(x) {
                            calledB = true;
                            expect(x).toBe(2);
                            return 3;
                        }

                        function C(x) {
                            calledC = true;
                            expect(x).toBe(3);
                            return $.Deferred().resolve(4).promise();
                        }
                        function D(x) {
                            calledD = true;
                            expect(x).toBe(2);
                        }

                        let def = A()
                            .then(B)
                            .then(C)
                            .fail(D);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeFalsy();
                        expect(calledC).toBeFalsy();
                        expect(calledD).toBeFalsy();
                        jasmine.clock().tick(1);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeFalsy();
                        expect(calledC).toBeFalsy();
                        expect(calledD).toBeTruthy();
                        done();
                    });

                it('then() are chainable - with rejection pos.2',
                    function (done) {
                        let calledA = false,
                            calledB = false,
                            calledC = false,
                            calledD = false;

                        function A(x) {
                            calledA = true;
                            expect(x).toBeUndefined();
                            return $.Deferred().resolve(2).promise();
                        }

                        function B(x) {
                            calledB = true;
                            expect(x).toBe(2);
                            return $.Deferred().reject(3).promise();
                        }

                        function C(x) {
                            calledC = true;
                            expect(x).toBe(3);
                            return $.Deferred().resolve(4).promise();
                        }
                        function D(x) {
                            calledD = true;
                            expect(x).toBe(3);
                        }

                        const def = A()
                            .then(B)
                            .then(C)
                            .fail(D);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeFalsy();
                        expect(calledC).toBeFalsy();
                        expect(calledD).toBeFalsy();
                        jasmine.clock().tick(1);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeTruthy();
                        expect(calledC).toBeFalsy();
                        expect(calledD).toBeTruthy();
                        done();
                    });

                it('then() are chainable - with rejection pos.2 (no jasmine clock)',
                    function (done) {
                        jasmine.clock().uninstall();
                        let calledA = false,
                            calledB = false,
                            calledC = false,
                            calledD = false;

                        function A(x) {
                            calledA = true;
                            expect(x).toBeUndefined();
                            return $.Deferred().resolve(2).promise();
                        }

                        function B(x) {
                            calledB = true;
                            expect(x).toBe(2);
                            return $.Deferred().reject(3).promise();
                        }

                        function C(x) {
                            calledC = true;
                            expect(x).toBe(3);
                            return $.Deferred().resolve(4).promise();
                        }
                        function D(x) {
                            calledD = true;
                            expect(x).toBe(3);

                             expect(calledA).toBeTruthy();
                             expect(calledB).toBeTruthy();
                             expect(calledC).toBeFalsy();
                             expect(calledD).toBeTruthy();
                            done();
                        }

                        const def = A()
                            .then(B)
                            .then(C)
                            .fail(D);

                    });


                it('then() are chainable - with rejection pos.3',
                    function (done) {
                        let calledA = false,
                            calledB = false,
                            calledC = false,
                            calledD = false;

                        function A(x) {
                            calledA = true;
                            expect(x).toBeUndefined();
                            return $.Deferred().resolve(2).promise();
                        }

                        function B(x) {
                            calledB = true;
                            expect(x).toBe(2);
                            return $.Deferred().resolve(3).promise();
                        }

                        function C(x) {
                            calledC = true;
                            expect(x).toBe(3);
                            return $.Deferred().reject(4).promise();
                        }
                        function D(x) {
                            calledD = true;
                            expect(x).toBe(4);
                        }

                        const def = A()
                            .then(B)
                            .then(C)
                            .fail(D);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeFalsy();
                        expect(calledC).toBeFalsy();
                        expect(calledD).toBeFalsy();
                        jasmine.clock().tick(1);
                        expect(calledA).toBeTruthy();
                        expect(calledB).toBeTruthy();
                        expect(calledC).toBeTruthy();
                        expect(calledD).toBeTruthy();
                        done();
                    });

                it('Deferred resolved + called then more times',
                    function (done) {
                        let numCheck = 0;
                        const def = $.Deferred();
                        def.resolve(2, false, {a:3});


                        def.done(function (res1, res2, res3) {
							numCheck++;
                            expect(res1).toBe(2);
                            expect(res2).toBe(false);
                            expect(res3.a).toBe(3);
                        });

                        def.done(function (res1, res2, res3) {
							numCheck++;
							expect(numCheck).toBe(2);
                            expect(res1).toBe(2);
                            expect(res2).toBe(false);
                            expect(res3.a).toBe(3);
                            done();
                        });
                        

                    });

                it("Resolved Promises are awaitable", function(done) {
                    const dd = Promise.resolve(2);
                    let result;
	                async function f(){
		                result = await dd;
		                expect(result).toBe(2);
		                done();
	                }
	                f();
	                
                });

                it("Deferred then executes on resolve", async function() {
                    jasmine.clock().uninstall();
	                let dd = $.Deferred();

                    let tt= dd.promise().then(function(x) {
		                return x+2;
	                });

	                dd.resolve(4);
	                let result = await tt;
                    expect(result).toBe(6);

                });

                it("Deferred are  awaitable",
	                function(done) {
                        jasmine.clock().uninstall();
                        let dd = $.Deferred();
                        let res=0;
                        setTimeout(() => {
                            dd.resolve(1);
                        }, 10);
                        async function waitFun(){
                            res= await dd;
                            expect(res).toBe(1);
                            done();
                        }
                        waitFun();

                    });

                it("Deferred are  awaitable (with async jasmine)",
                    async function() {
                        jasmine.clock().uninstall();
                        let dd = $.Deferred();
                        let res=0;
                        setTimeout(() => dd.resolve(1), 10);
                        res = await dd;
                        expect(res).toBe(1);

                    });

                it("jQuery promises are  awaitable",
                    function(done) {
                        jasmine.clock().uninstall();
                        let dd = $.Deferred();
                        let res=0;
                        setTimeout(() => {
                            dd.resolve(1);
                        }, 10);
                        async function waitFun(){
                            res= await dd.promise();
                            expect(res).toBe(1);
                            done();
                        }
                        waitFun();

                    });

                it("async function return thenable",
                    function(done) {
                        jasmine.clock().uninstall();
                        let dd = $.Deferred();
                        let res=0;
                        setTimeout(() => {
                            dd.resolve(1);
                            done();
                        }, 10);
                        async function waitFun(){
                            res= await dd.promise();
                        }
                        let p = waitFun();
                        expect(p.then).toBeDefined();

                    });

                it("async function throws when promise is rejected and the rejected value is given in the exception",
                    function(done) {
                        jasmine.clock().uninstall();
                        let dd = $.Deferred();
                        let res=0;
                        setTimeout(() => {
                            dd.reject("xx");
                        }, 10);
                        async function waitFun(){
                            let exc;
                            try {
                                res= await dd;
                            }
                            catch (e) {
                                exc=e;
                            }

                            expect(res).toEqual(0);
                            expect(exc).toBe("xx");
                            done();
                        }
                        waitFun();

                    });

            });

        describe('jquery data()',
            function(){

               it( 'get/set preserve js type + camelCase', function () {
                   const mainwin = '<div id="root1" data-tag="miastringa"></div>' +
                       '<div id="root2"></div>' +
                       '<div id="root3"></div>' +
                       '<div id="root4" data-displayMember="dmember4"></div>' +
                       '<div id="root5" data-displaymember="dmember5"></div>' +
                       '<div id="root6" data-display-member="dmember6"></div>';
                   $("html").html(mainwin);
                   expect($('#root1').data("tag").constructor.name).toBe("String");
                   expect($("#root1").data("tag")).toBe("miastringa");

                   $('#root2').data("tag",12);
                   expect($("#root2").data("tag").constructor.name).toBe("Number");
                   expect($("#root2").data("tag")).toBe(12);

                   $("#root3").data("tag",new Date("1980-10-02"));
                   expect($("#root3").data("tag").constructor.name).toBe("Date");
                   expect($("#root3").data("tag").getDate()).toBe(2);
                   expect($("#root3").data("tag").getMonth() + 1).toBe(10);
                   expect($("#root3").data("tag").getFullYear()).toBe(1980);

                   // uppercase sono convertite in lowercase
                   // il trattino viene rimpiazzato e la prima lettera va uppercase

                   expect($("#root4").data("displayMember")).toBeUndefined();
                   expect($("#root4").data("display-member")).toBeUndefined();
                   expect($("#root4").data("displaymember")).toBeDefined();

                   expect($("#root5").data("displaymember")).toBeDefined();
                   expect($("#root5").data("displaymember")).toBe("dmember5");

                   expect($("#root6").data("display-member")).toBeDefined();
                   expect($("#root6").data("displayMember")).toBeDefined();
                   expect($("#root6").data("displayMember")).toBe("dmember6");
                });

            });

        describe('jsDataQuery methods',
            function(){

                it( 'isNull() filter on null value rows', function () {

                    const c_name = "c_name";
                    const c_dec = "c_dec";
                    const c_citta = "c_citta";

                    const ds = new jsDataSet.DataSet("temp");
                    const t1 = ds.newTable("table1");
                    const $q = window.jsDataQuery;
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_citta, "Double");

                    const objrow1 = {c_name: "nome1", c_dec: 11, c_double: 1001};
                    const objrow2 = {c_name: "nome2", c_dec: 22, c_double: 2002};
                    const objrow3 = {c_name: "nome3", c_dec: null, c_double: 2002};

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);

                    const filter = $q.isNull($q.field(c_dec));
                    const rows = t1.select(filter);
                    expect(rows.length).toBe(1);
                    expect(rows[0].c_name).toBe("nome3");
                });

                it( 'eq and mcmp of jsDataQuery used in keyFilter compare right values', function () {

                    appMeta.basePath = 'base/';
                    
                    // recupeor 2 ds di test
                    const ds1 = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                    const ds2 = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                    expect(ds1.name).toBe("registry_anagrafica");
                    expect(ds2.name).toBe("registry_anagrafica");

                    // test del keyFilter sulla tab "registry", va solo su idreg
                    const rowsRegistry = ds1.tables.registry.rows;
                    const rSearchARegistry = ds2.tables.registry.rows[0];
                    const filteredRowsAddress = _.filter(rowsRegistry, ds1.tables.registry.keyFilter(rSearchARegistry));
                    expect(filteredRowsAddress.length).toBe(1);
                    
                    // testo eq e keyfilter su 2 campi di tipo "data" della tabella "registryaddress"
                    const rowsRegistryAdressDS1 = ds1.tables.registryaddress.rows;
                    const rSearchRegistryAddress = ds2.tables.registryaddress.rows[0];
                    const $q = window.jsDataQuery;
                    const x = ds2.tables.registryaddress.rows[0].start,
                        y = ds1.tables.registryaddress.rows[0].start,
                        f = $q.eq($q.constant(x), y);
                    expect(f({})).toBeTruthy();
                    
                    // la keyfilter funziona
                    const filteredRowsRegAdd = _.filter(rowsRegistryAdressDS1, ds1.tables.registryaddress.keyFilter(rSearchRegistryAddress));
                    expect(filteredRowsRegAdd.length).toBe(1);

                    appMeta.basePath = '/';
                });

                it( 'constant(true) and filter, then win filter condition', function () {

                    const c_name = "c_name";
                    const c_dec = "c_dec";
                    const c_citta = "c_citta";

                    const ds = new jsDataSet.DataSet("temp");
                    const t1 = ds.newTable("table1");
                    const $q = window.jsDataQuery;
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_citta, "Double");

                    const objrow1 = {c_name: "nome1", c_dec: 11, c_double: 1001};
                    const objrow2 = {c_name: "nome2", c_dec: 22, c_double: 2002};
                    const objrow3 = {c_name: "nome3", c_dec: null, c_double: 2002};

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);

                    const filter = $q.and(
                        $q.eq($q.field(c_dec), 11),
                        $q.constant(true));
                    let rows = t1.select(filter);
                    expect(rows.length).toBe(1);
                    expect(rows[0].c_name).toBe("nome1");

                    // 33 non exsit
                    const filter2 = $q.and(
                        $q.eq($q.field(c_dec), 33),
                        $q.constant(true));
                     rows = t1.select(filter2);
                    expect(rows.length).toBe(0);

                });

            });

        describe('jsDataSet methods',
            function(){
                
                it( 'ObjectRow and DataRow object are populated', function () {

                    const c_name = "c_name";
                    const c_dec = "c_dec";
                    const c_citta = "c_citta";

                    const ds = new jsDataSet.DataSet("temp");
                    const t1 = ds.newTable("table1");
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_citta, "Double");

                    const objrow1 = {c_name: "nome1", c_dec: 11, c_double: 1001};
                    const objrow2 = {c_name: "nome2", c_dec: 22, c_double: 2002};
                    const objrow3 = {c_name: "nome3", c_dec: null, c_double: 2002};

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);
                    t1.acceptChanges();

                    const nomeMod = "nomeModificato";

                    t1.rows[1]["c_name"] = nomeMod; // OK

                    const dtRow2 = t1.rows[2].getRow();
                    dtRow2["c_name"] = nomeMod; // NOK
                     dtRow2.current["c_dec"] = 99; // OK
                    
                     expect(t1.rows[1].getRow().current["c_name"]).toBe(nomeMod); // OK
                     expect(t1.rows[2]["c_dec"]).toBe(99);                        // OK
                    
                     expect(t1.rows[1].getRow()["c_name"]).not.toBe(nomeMod);         // NOK 
                     expect(t1.rows[2]["c_name"]).not.toBe(nomeMod);                  // NOK
                   
                });

                it( 'ds modified and rejectChanges. ds has not row modified', function () {

                    const c_name = "c_name";
                    const c_dec = "c_dec";
                    const c_citta = "c_citta";

                    const ds = new jsDataSet.DataSet("temp");
                    const t1 = ds.newTable("table1");
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_citta, "Double");

                    let objrow1 = {c_name: "nome1", c_dec: 11, c_double: 1001};
                    let objrow2 = {c_name: "nome2", c_dec: 22, c_double: 2002};
                    let objrow3 = {c_name: "nome3", c_dec: null, c_double: 2002};

                    // aggiungo righe tab1
                    objrow1 = t1.add(objrow1).current;
                    objrow2 = t1.add(objrow2).current;
                    objrow3 = t1.add(objrow3).current;

                    t1.acceptChanges();

                    const nomeMod = "nomeModificato";
                    expect(objrow2.getRow().state).toBe("unchanged");
                    objrow2["c_name"] = nomeMod; // OK

                    expect(t1.rows[1].getRow().state).toBe("modified");

                    ds.rejectChanges();

                    expect(objrow2.getRow().state).toBe("unchanged");

                });

                it( 'patchTo on DataRow assigns values on fields', function () {

                    const c_name = "c_name";
                    const c_dec = "c_dec";
                    const c_citta = "c_citta";

                    const ds = new jsDataSet.DataSet("temp");
                    const t1 = ds.newTable("table1");
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_citta, "Double");

                    const objrow1 = {c_name: "nome1", c_dec: 11, c_double: 1001};
                    const objrow2 = {c_name: "nome2", c_dec: 22, c_double: 2002};
                    const objrow3 = {c_name: "nome3", c_dec: null, c_double: 2002};

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);
                    t1.acceptChanges();

                    const nomeMod = "nomeModificato";
                    const dtRow1 = objrow1.getRow();
                    dtRow1.patchTo({c_name:nomeMod});

                    const dtRow2 = objrow2.getRow();
                    dtRow2.patchTo({c_name:null, c_dec:123});

                    expect(objrow1["c_name"]).toBe(nomeMod);
                    expect(objrow2["c_name"]).toBeNull();
                    expect(objrow2["c_dec"]).toBe(123);
                    expect(objrow2["c_double"]).toBe(2002);
                });

            });

        describe('lodash function',
            function(){

                it( 'map + filter take care of null object, map with shorthand no', function () {

                    const objs = [
                        {'f1': 'one_f1', 'f3': 'one_f3'},
                        {'f2': 'two_f2',},
                        {'f1': 'three_f1', 'f4': 'three_f4'}
                    ];
                    // devo applicare un filter per escludere le proprietà non definite
                    const res = _.map(
                        _.filter(objs, function (o) {
                            return o.f1;
                        }), function (o) {
                            return o.f1;
                        });

                    const res2 = _.map(objs, 'f1');

                    expect(res.length).toBe(2);
                    expect(_.isEqual(res, ['one_f1','three_f1'])).toBe(true);
                    expect(res2.length).toBe(3);
                    expect(_.isEqual(res2, ['one_f1',undefined,'three_f1'])).toBe(true);
                })

                it( 'reduce on string localized', function () {

                    const sinpunt = "S%field1%S S%field2%S sono tradotte da S%field3%S";
                    const objs = {field1: "v1", field2: "v2", field3: "v3"};

                    const fReplace = function (needle, newval, stringToSearch) {
                        return stringToSearch.replace('S%' + needle + '%S', newval);
                    };
                    // devo applicare un filter per escludere le proprietà non definite
                    const res = _.reduce(objs, function (res, value, key) {
                        return fReplace(key, value, res);
                    }, sinpunt);

                    expect(res).toBe("v1 v2 sono tradotte da v3");


                })

            });

        it('array of deferred is resolved in when; loops on the arguments value, get the deferred results',
            function (done) {
                // dichiaro array di deferred
                const defArray = [];
                // popolo array
                for (let i = 0; i < 5; i++){
                    defArray.push(new $.Deferred().resolve({primo:"Uno" + i.toString(), secondo:i}).promise());
                }

                $.when.apply($, defArray)
                    .then(function() {
                       
                        for (let j = 0; j < arguments.length; j++){
                            const currObj = arguments[j];
                            expect(currObj.primo).toBe("Uno" + j.toString()) ;
                            expect(currObj.secondo).toBe(j)
                        }   
                        
                        done();
                    });
            });
    });
