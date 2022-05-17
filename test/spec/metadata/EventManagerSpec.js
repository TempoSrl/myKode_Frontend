/* global beforeEach, afterEach,describe,jasmine,it,expect,inject,spyOn,$,jsDataSet,appMeta,_ */


describe("Stabilizer",
    function() {
        var Stabilizer = appMeta.Stabilizer;
        var Deferred = appMeta.Deferred;
        var stabilize = appMeta.stabilize;
        beforeEach(function () {
            Stabilizer.nesting = 0;
        });

        it("exists", function () {
            expect(Stabilizer).toBeDefined();
        });


        it("Deferred should return a Deferred", function () {
            var def = Deferred();
            expect(def).toBeDefined();
            expect(def.resolve).toBeDefined();
        });

        it("creating a Deferred should increase nesting", function () {
            var def = Deferred();
            expect(Stabilizer.nesting).toBe(1);
        });

        it("creating multiple Deferred should increase nesting", function () {
            var def = Deferred();
            expect(Stabilizer.nesting).toBe(1);
            for (var i = 0; i < 10; i++) {
                var d = Deferred();
            }
            expect(Stabilizer.nesting).toBe(11);
        });

        it("resolving a Deferred should decrease nesting", function (done) {
            var def = Deferred();
          
          
            def.resolve(1);
            var defs = [];
            for (var i = 0; i < 10; i++) {
                defs.push( Deferred());
            }
            for (var i = 0; i < 10; i++) {
                defs[i].resolve();
            }

            stabilize(true)
                .then(function () {
                    expect(Stabilizer.nesting).toBe(0);
                    done();
                });
        });
    });



describe("EventManager",
    function () {
        var EventManager = appMeta.EventManager;
        var evMngr;
        var c1, c2, c3;

        beforeEach(function () {
            evMngr = new EventManager();

            // Controllo 1 di test
            c1 = function control1(v,p) {
                this.v = v;
                this.p = p;
                this.name = 'c1';
            };
            c1.prototype = {
                constructor: c1,
                f1:function () {
                    return evMngr.trigger("testEvent", this, this.v,this.p);
                }
            }

            // Controllo 2 di test
            c2 = function control2() {
                this.myobj = null;
                this.name = 'c2';
            };
            c2.prototype = {
                constructor: c2,
                f2:function (sender, obj,p) {
                    this.myobj = "sono "+this.name+" - vsender=" + obj+"-p:"+p;
                }
            }

            // Controllo 2 di test
            c3 = function control3() {
                this.myobj = null;
                this.name = 'c3';
            };
            c3.prototype = {
                constructor: c3,
                f3:function (sender, obj,p) {
                    this.myobj = "sono "+this.name+" - vsender=" + obj+"-p:"+p;
                }
            }

        });

        it("exists", function () {
            expect(evMngr).toBeDefined();
        });
        it("subscribe exists", function () {
            expect(evMngr.subscribe).toBeDefined();
        });
        it("trigger exists", function () {
            expect(evMngr.trigger).toBeDefined();
        });


        describe("subscribe/invoke",
            function () {
                // *** General test appMeta object ***
                it("subscribe/trigger invokes something",
                    function() {
                        var arg = "riccardo";
                        var checkValue = null;
                        var myf = function(sender, nome) {
                            checkValue = nome;
                        }
                        evMngr.subscribe("sel", myf.bind(this));
                        evMngr.trigger("sel", this, arg)
                            .then(function() {
                                expect(checkValue).toBe(arg);
                            });
                        
                    });

                it("subscribe/trigger invokes delegates", function (done) {

                    var v = 123;
                    var p = 32;
                    var myc1 = new c1(v,p);
                    var myc2 = new c2();
                    var myc3 = new c3();

                    // Secondo test con 2 controlli custom
                    evMngr.subscribe("testEvent", myc2.f2,myc2);
                    evMngr.subscribe("testEvent", myc3.f3,myc3);
                    myc1.f1() // eseguirà il trigger di "testEvent" con parametri v e p
                        .then(function() {
                            expect(myc2.myobj).toBe("sono c2 - vsender=" + v + "-p:" + p);
                            expect(myc3.myobj).toBe("sono c3 - vsender=" + v + "-p:" + p);
                            done();
                        }); 
                });

                it("subscribe/trigger does not invokes wrong delegates", function (done) {

                    var v = 123;
                    var p = 32;
                    var myc1 = new c1(v, p);
                    var myc2 = new c2();
                    var myc3 = new c3();

                    // Secondo test con 2 controlli custom
                    evMngr.subscribe("testEvent2", myc2.f2, myc2);
                    evMngr.subscribe("testEvent3", myc3.f3, myc3);
                    myc1.f1() // eseguirà il trigger di "testEvent" con parametri v e p
                        .then(function() {
                            expect(myc2.myobj).toBeNull();
                            expect(myc3.myobj).toBeNull();
                            done();
                        }); 
                });

                it("subscribe/unsubscribe/trigger stops invoking of delegates", function (done) {

                    var v = 123;
                    var p = 32;
                    var myc1 = new c1(v, p);
                    var myc2 = new c2();                
                    var myc3 = new c3();
                    var myc3Bis = new c3();

                    // Secondo test con 2 controlli custom
                    evMngr.subscribe("testEvent", myc2.f2, myc2);
                    evMngr.subscribe("testEvent", myc3.f3, myc3);
                    evMngr.subscribe("testEvent", myc3Bis.f3, myc3Bis);
                    evMngr.unsubscribe("testEvent", myc3.f3,myc3);
                    myc1.f1() // eseguirà il trigger di "testEvent" con parametri v e p
                        .then(function() {
                            expect(myc2.myobj).toBe("sono c2 - vsender=" + v + "-p:" + p);
                            expect(myc3.myobj).toBeNull();
                            expect(myc3Bis.myobj).toBe("sono c3 - vsender=" + v + "-p:" + p);
                            done();
                        });
                });
            });

        
    });