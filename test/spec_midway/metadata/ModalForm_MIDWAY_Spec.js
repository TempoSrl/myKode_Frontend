"use strict";

describe("ModalForm",
    function () {
        var ModalForm = appMeta.ModalForm;
        var mf;
        var common = appMeta.common;

        beforeEach(function () {
            appMeta.basePath = "base/";
            
            var mainwin = '<head></head><div id="rootelement">' +
                "</div>";
            $("html").html(mainwin);
            $("head").append('<script defer src="/base/app/styles/fontawesome/fontawesome-all.js"></script>');
            $("body").append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
            $("body").append('<link rel="stylesheet" href="/base/app/styles/app.css" />');


        });

        afterEach(function () {

        });

        describe("methods work",

            function () {

                it("ModalForm constructor , simple html is attached to modal",function () {
                    var html = "<div>Added html<div>";
                    mf = new ModalForm($("#rootelement"), html);
                    mf.show();
                    expect( $(".modal .modal-body").html()).toContain(html);
                });

                it("ModalForm constructor , complex html is attached to modal",function (done) {
                    
                    var htmlFileName =  "base/test/spec_midway/fixtures/tabTest.html";
                    
                    // carico html esterno
                    $.get(htmlFileName)
                        .done(
                            function (data) {
                                // aggancio al mio rootElement
                                mf = new ModalForm($("#rootelement"), data);
                                mf.show();
                                expect( $(".modal .modal-body").html()).toMatch("Html Test for Tab Control");
                                done();
                            })
                        .fail(
                            function (e) {
                                console.log(e);
                                expect(true).toBe(false);
                            });
                    
                });
                

            });
    });
