'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */


describe('utils',
    function() {
        var appMeta;

        describe('methods',
            function () {
                beforeEach(function () {
                    // inizializzo per ogni test l'oggetto appMeta        
                    appMeta = window.appMeta;
                    appMeta.init();

                    appMeta.basePath = 'base/test/spec/';
                    //console.log('beforeEach:');
                    $("html").html('<head></head><body></body>');
                    //console.log($('html').html());
                    jasmine.clock().install();
                    //window.testGetPageOneTimeScript = 0;

                });
                afterEach(function () {
                    jasmine.clock().uninstall();
                });

                it("callOptAsync should be defined",
                    function() {
                        expect(appMeta.utils.callOptAsync).toBeDefined();

                    });

                it("callOptAsync should be a function",
                    function () {
                        expect(appMeta.utils.callOptAsync).toEqual(jasmine.any(Function));
                    });

                it("should call sync function and return deferred",
                    function(done) {
                        function syncFun() {
                            return 10;
                        }

                        appMeta.utils.callOptAsync(syncFun)
                            .then(function (result) {
                                expect(result).toBe(10);
                                done(); 
                            })
                            .fail(function(error) {
                                expect(error).toBeUndefined();
                                done();
                            });
                        jasmine.clock().tick(200);

                    }, 1000);

                it("should call deferred function and return deferred",
                    function (done) {
                        function syncFun() {
                            var res = $.Deferred();
                            setTimeout(function () {
                                    res.resolve(50);
                                },
                                100);
                            return res.promise();
                        }                        
                        appMeta.utils.callOptAsync(syncFun)
                            .done(function (result) {
                                expect(result).toBe(50);
                                done();
                            })
                            .fail(function (error) {
                                expect(error).toBeUndefined();
                                done();
                            });
                        jasmine.clock().tick(200);

                    }, 2000);

                it("should call resolved deferred function and return deferred, usable with done ",
                    function (done) {
                        function syncFun() {
                            var res = $.Deferred();
                            res.resolve(50);                            
                            return res.promise();
                        }
                        appMeta.utils.callOptAsync(syncFun)
                            .done(function (result) {
                                expect(result).toBe(50);
                                done();
                            })
                            .fail(function (error) {
                                expect(error).toBeUndefined();
                                done();
                            });
                        jasmine.clock().tick(200);

                    }, 2000);

                it("should call resolved deferred function and return deferred, usable with done - two phase",
                    function (done) {
                        function syncFun() {
                            var res = $.Deferred();
                            res.resolve(50);
                            return res.promise();
                        }

                        var def = appMeta.utils.callOptAsync(syncFun);
                        jasmine.clock().tick(200);
                        def.done(function (result) {
                                expect(result).toBe(50);
                                done();
                            })
                            .fail(function (error) {
                                expect(error).toBeUndefined();
                                done();
                            });
                        

                    }, 2000);

                it("should call resolved deferred function and return deferred, usable with then ",
                    function (done) {
                        function syncFun() {
                            var res = $.Deferred();
                            res.resolve(50);
                            return res.promise();
                        }
                        appMeta.utils.callOptAsync(syncFun)
                            .then(function (result) {
                                expect(result).toBe(50);
                                done();
                            })
                            .fail(function (error) {
                                expect(error).toBeUndefined();
                                done();
                            });
                        jasmine.clock().tick(200);
                        jasmine.clock().tick(200);

                    }, 2000);

                it("should call resolved deferred function and return deferred, usable with then - two phase",
                    function (done) {
                        function syncFun() {
                            var res = $.Deferred();
                            res.resolve(50);
                            return res.promise();
                        }

                        var def = appMeta.utils.callOptAsync(syncFun);
                        jasmine.clock().tick(200);

                        def.then(function (result) {
                                expect(result).toBe(50);
                                done();
                            })
                            .fail(function (error) {
                                expect(error).toBeUndefined();
                                done();
                            });
                        jasmine.clock().tick(200);

                    }, 2000);

                it("transforms blocking functions in non blocking functions, returning a Deferred",
                    function (done) {
                        var state = 0;
                        function blockingFun() {
                            var res = 0;
                            setTimeout(function () {
                                    res = 1;
                                },
                                3000);//wait a lot
                            while (res === 0) {
                                $.noop();                                
                            };
                            state = 1;
                        }

                        var res = appMeta.utils.callOptAsync(blockingFun);
                        expect(state).toEqual(0);
                        expect(res.then).toEqual(jasmine.any(Function));
                        done();
                    }, 100);

                it("should transform blocking functions in non blocking functions, not running bf immediately",
                    function (done) {
                        var state = 0;
                        function blockingFun() {
                            var res = 0;
                            setTimeout(function () {
                                    res = 1;
                                },
                                100);//wait
                            var tt = 0;
                            while (res === 0) {
                                tt++;
                                jasmine.clock().tick(1);
                            };
                            state = 1;
                            return 10;
                        }
                        var res = appMeta.utils.callOptAsync(blockingFun);
                        expect(state).toEqual(0); //blockingFun has not been called yet
                        jasmine.clock().tick(150);
                        expect(state).toEqual(1); //blockingFun has been called and has returned a value
                        expect(res.then).toEqual(jasmine.any(Function));
                        done();
                    }, 1000);

                it("should get result from blocking functions in resolve() method",
                    function (done) {
                        var state = 0;
                        function blockingFun() {
                            var res = 0;
                            setTimeout(function () {
                                    res = 1;
                                },
                                500);//wait
                            var tt = 0;
                            while (res === 0) {
                                tt++;
                                jasmine.clock().tick(1);
                            };
                            state = 1;
                            return 20;
                        }

                        var promise = appMeta.utils.callOptAsync(blockingFun)
                            .then(function (innerRes) {
                                expect(innerRes).toEqual(20);
                                done();
                            })
                            .fail(function () {
                                expect(1).toEqual(0);
                                done();
                            });
                        expect(state).toEqual(0);//blockingFun has not been called yet
                        expect(promise.state()).toBe("pending");
                        jasmine.clock().tick(501);
                        expect(promise.state()).toBe("resolved");
                        expect(state).toEqual(1); //blockingFun has been called and has returned a value
                        
                    }, 1000);

                it("sync functions: should reject on exceptions", function(done) {
                    function fn(callback) {
                        throw "exception 1";
                    }

                    appMeta.utils.callOptAsync(fn)
                        .then(function () {
                            expect("then clause should not be called").toBeNull();
                            done();
                        }, function (err) {
                            expect(err).toBe("exception 1");
                            done();
                        }
                    );
                    jasmine.clock().tick(0);//necessary to make deferred raise event
                });

                it("sync functions: should reject on rejected deferred result", function (done) {
                    function fn() {
                        var c = $.Deferred();
                        c.reject("exception 2");
                        return c.promise();
                    }

                    appMeta.utils.callOptAsync(fn)
                        .then(function () {
                                expect("then clause should not be called").toBeNull();
                                done();
                            }, function (err) {
                                expect(err).toBe("exception 2");
                                done();
                            }
                        );
                    jasmine.clock().tick(1);
                });

                it("async functions: should reject on exceptions", function (done) {
                    function fn() {
                        throw "exception 1";
                    }

                    appMeta.utils.callOptAsync(fn)
                        .then(function () {
                                expect("then clause should not be called").toBeNull();
                                done();
                            }, function (err) {
                                expect(err).toBe("exception 1");
                                done();
                            }
                        );
                    jasmine.clock().tick(1);//necessary to make deferred raise event
                });

                it('optBind() called with a function, an obj that should be "this" of function and without args',
                    function () {
                        function oneArg(x,y) {
                            return this.a * x+y;
                        }

                        var obj = { a: 2 };
                        var fObj = appMeta.utils.optBind(oneArg, obj);
                        var fObj2 = oneArg.bind(obj);
                        expect(oneArg.length).toBe(2);
                        expect(fObj(3,10)).toBe(16);
                        expect(fObj.length).toBe(2);
                        expect(fObj2.length).toBe(2);
                    });

                it('optBind() called with a function, an obj that should be "this" of function and with args',
                    function () {
                        function oneArg(x,y,z) {
                            return this.a * x+y+z;
                        }

                        var obj = { a: 2 };
                        var fObj = appMeta.utils.optBind(oneArg, obj, 4); // il prm 4 sarà il primo parametro passato alla funzione oneArg(x,y,z)
                        var fObj2 = oneArg.bind(obj);
                        expect(oneArg.length).toBe(3);
                        expect(fObj(3,10)).toBe(21); // 2*4 = 8, che sarebbe  (this.a * x) poi faccio + y + z, cioè i prm passati 3+10 , quidi 8+13 = 21.
                        expect(fObj.length).toBe(2);
                        expect(fObj2.length).toBe(3);
                    });

                it('asDeferred() take a deferred function returns a Deferred',
                    function (done) {

                        var value = "a";
                        var f = function () {
                            return new $.Deferred().resolve(value).promise();
                        }
                        
                        appMeta.utils.asDeferred(f())
                            .done(function (res) {
                                expect(res).toBe(value);
                                done();
                        })
                        
                        
                    });

                it('asDeferred() take a sync function returns a Deferred',
                    function (done) {
                        var value = "a";
                        var f = function () {
                            return value;
                        }

                        appMeta.utils.asDeferred(f())
                            .done(function (res) {
                                expect(res).toBe(value);
                                done();
                            })


                    });

                it('_if() with two sync func builds a chainable object; condition=true',
                    function (done) {
                        var valueThen = "a";
                        var valueElse = "b";
                        var fthen = function () {
                            return valueThen;
                        }

                        var felse = function () {
                            return valueElse;
                        }

                        appMeta.utils._if(true)
                            ._then(fthen)
                            ._else(felse)
                            .done(function (res) {
                                expect(res).toBe(valueThen);
                                done();
                            })


                    });

                it('_if() with async then func builds a chainable object; condition=true',
                    function (done) {
                        var valueThen = "a";
                        var valueElse = "b";
                        var fthen = function () {
                            return new $.Deferred().resolve(valueThen).promise();
                        }

                        var felse = function () {
                            return valueElse;
                        }

                        appMeta.utils._if(true)
                            ._then(fthen)
                            ._else(felse)
                            .done(function (res) {
                                expect(res).toBe(valueThen);
                                done();
                            })


                    });

                it('_if() with async then func, and sync void fu builds a chainable object; condition=false',
                    function (done) {
                        var valueThen = "a";
                        var valueElse = "b";
                        var fthen = function () {
                            return new $.Deferred().resolve(valueThen).promise();
                        }

                        var felse = function () {
                             valueElse = valueThen;
                        }
                        var self  = this;
                        appMeta.utils._if(false)
                            ._then(fthen)
                            ._else(felse)
                            .done(function (res) {
                                expect(valueElse).toBe(valueThen);
                                done();
                            })


                    });

                it('filterArrayOnField filters array on field, and returns it',
                    function () {
                        var objs = [
                            { 'f1': 'one_f1', 'f3': 'one_f3' },
                            { 'f2': 'two_f2', },
                            { 'f1': 'three_f1', 'f4': 'three_f4'}
                        ];

                        var res = appMeta.utils.filterArrayOnField(objs, 'f1');
                        expect(res.length).toBe(2);
                        expect(_.isEqual(res, ['one_f1','three_f1'])).toBe(true);

                    });
                
                it("syncLoad() is sync and return html",
                    function() {
                        var url = "base/components/template/mainToolBar_Template.html";
                        var res = appMeta.getData.cachedSyncGetHtml(url);
                        // ossevo se contiene almeno un pezzo di html che mi aspetto
                        expect(res.indexOf('div id="maintoolbar1" class=')).not.toBe(-1);
                    });
            });
    });