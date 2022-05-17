/* global beforeEach, afterEach,describe,jasmine,it,expect,inject,spyOn,$,jsDataSet,appMeta,_ */


describe("FormProcedureMessage",
    function () {
        var stabilize = appMeta.stabilize;
        var common = appMeta.common;

        var formProcedureMessages;
        
        beforeEach(function () {
            
            //jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";
            appMeta.basePath = "base/";

            // sovrascrivo html di prova
            var mainwin = '<div id="rootelement">' +
                "</div>";
            $("html").html(mainwin);
            $("body").append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
            $("body").append('<link rel="stylesheet" href="/base/app/styles/app.css" />');
            
            // abliatre solo per vederne la grafica
           // $("head").append('<script defer src="/base/app/styles/fontawesome/fontawesome-all.js"></script>');
           // $("head").append('<script defer src="/base/bower_components/jquery/dist/jquery.js"></script>');
           // $("head").append('<script defer src="/base/app/styles/bootstrap/js/bootstrap.js"></script>');
        });

        afterEach(function () {
            appMeta.basePath = "/";
        });

        describe("methods work",
            function () {

                xit("fillControl() is ASYNC. click button ignore, return true on deferred",function (done) {
                    var messages = [];
                    var metaPage = new appMeta.MetaPage('table', 'editType', true)
                    formProcedureMessages = new appMeta.FormProcedureMessage($("#rootelement"), messages, true, metaPage);

                    common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                        .then(function () {
                            // test sull' html
                            expect($(".procedureMessage_btn_ignoreandsave").is(":visible")).toBe(true);
                            expect($("table > tr").length).toBe(1); // c'è solo l'header
                            var s = stabilize();
                            $(".procedureMessage_btn_ignoreandsave").click(); // clicco
                            return s;
                        })
                        .then(function () {
                            expect($("table > tr").length).toBe(0);
                            done();
                        });

                    formProcedureMessages.fillControl();
                }, 5000);
             
                xit("fillControl() is ASYNC and control is populated. message all ignorable, buttons are showed",function (done) {
                    var messages = [];
                    var m1 = new appMeta.DbProcedureMessage("id1", "LongMessage1" ,"audit1", "errorType1", "tableName1",  true);
                    var m2 = new appMeta.DbProcedureMessage("id2", "LongMessage2" ,"audit2", "errorType2", "tableName2",  true);
                    messages.push(m1);
                    messages.push(m2);
                    var metaPage = new appMeta.MetaPage('table', 'editType', true)
                    formProcedureMessages = new appMeta.FormProcedureMessage($("#rootelement"), messages, true, metaPage);

                    common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                        .then(function () {
                            // test sull' html
                            expect( $("table > tr").length).toBe(3); // header + 2 row
                            expect($(".procedureMessage_btn_ignoreandsave").is(":visible")).toBe(true);
                            var s = stabilize();
                            $(".procedureMessage_btn_ignoreandsave").click(); // clicco
                            return s;
                        })
                        .then(function () {
                            expect($("table > tr").length).toBe(0);
                            done();
                        });

                    formProcedureMessages.fillControl();
                }, 5000);

                xit("fillControl() is ASYNC and control is populated. message not all ignorable, button Ignore is hidden",function (done) {
                    var messages = [];
                    var m1 = new appMeta.DbProcedureMessage("id1", "LongMessage1" ,"audit1", "errorType1", "tableName1",  true);
                    var m2 = new appMeta.DbProcedureMessage("id2", "LongMessage2" ,"audit2", "errorType2", "tableName2",  true);
                    messages.push(m1);
                    messages.push(m2);
                    var metaPage = new appMeta.MetaPage('table', 'editType', true)
                    formProcedureMessages = new appMeta.FormProcedureMessage($("#rootelement"), messages, false, metaPage);

                    common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                        .then(function () {
                            // test sull' html
                            expect( $("table > tr").length).toBe(3); // header + 2 row
                            expect($(".procedureMessage_btn_ignoreandsave").is(":visible")).toBe(false);
                            expect($(".procedureMessage_btn_nosave").is(":visible")).toBe(true);
                            var s = stabilize();
                            $(".procedureMessage_btn_nosave").click(); // clicco
                            return s;
                        })
                        .then(function () {
                            expect($("table > tr").length).toBe(0);
                            done();
                        });

                    formProcedureMessages.fillControl();
                }, 5000);
                
            });
    });
