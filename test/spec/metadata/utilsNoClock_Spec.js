'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */


describe('utilsNoClock',
    function() {
        var appMeta;
        describe('methods',
            function () {
                beforeEach(function () {
                    // inizializzo per ogni test l'oggetto appMeta        
                    appMeta = window.appMeta;
                    appMeta.init();
                    appMeta.basePath = 'base/test/spec/';

                });
                afterEach(function () {
                });
                
                it('thenSequence builds a function chained',
                    function (done) {
                        var allDef = [];
                        var res = "";
                        var f1 = function () {
                            res = res + "f1";
                            return new appMeta.Deferred("f1").resolve("1").promise()
                        };
                        var f2 = function () {
                            res = res + "f2";
                            return new appMeta.Deferred("f2").resolve("2").promise()
                        };
                        var f3 = function () {
                            res = res + "f3";
                            return new appMeta.Deferred("f3").resolve("3").promise()
                        };

                        /*f1()
                            .then(f2())
                            .then(f3());*/

                        allDef.push(f1);
                        allDef.push(f2);
                        allDef.push(f3);

                       return  appMeta.utils.thenSequence(allDef).then(function () {
                           expect(res).toBe("f1f2f3");
                           done();
                       })

                    });
                
            });
    });