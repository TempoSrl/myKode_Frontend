'use strict';
/*global $, beforeEach, afterEach, describe, jasmine, it, expect, inject,loadFixtures */




describe('Test Page html and Jasmine method', function () {
    var fix;
    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
        loadFixtures('HtmlPageTest.html');
    });


    //test true
    describe('toHaveText method', function () {

        it("toHaveText", function () {
            expect($('#my-fixture')).not.toHaveText('some words');
        });
        it("toHaveText", function () {
            expect($('#my-fixture')).toHaveText('Test sample');
        });


    });


    //test true
    describe('toBeChecked method', function () {

        it("toBeChecked", function () {
            expect($('#check1')).not.toBeChecked();
        });


    });


    //error
    describe('ToHaveValue method', function () {

        it("ToHaveValue", function () {
            expect($('#txt')).toHaveValue('some text');
        });


    });



    //error
    describe('toHaveLength method', function () {

        it("toHaveLength", function () {
            expect($('#anchor_01 > ul > li')).toHaveLength(3);
        });
        
    });

    

    //error
    describe('toHaveHtml  jasmine', function () {
        
        it("toHaveHtml", function () {
            expect($('#my-fixture')).toHaveHtml('<div><p>Test sample</p></div>');
        });

    });

    describe("method invoke",
        function() {
           

            it('getANumber exists',
                function() {
                    expect(getANumber).toBeDefined();
                });

            it('getANumber works',
                function () {
                    expect(getANumber(1)).toBe(2);
                });
        });

    describe("lodash",
        function() {
            it('_.bind does not preserve arguments',
                function() {
                    function oneArg(x) {
                        return this.a * x;
                    }

                    var obj = { a: 2 };
                    var fObj = _.bind(oneArg, obj);
                    expect(oneArg.length).toBe(1);
                    expect(fObj(3)).toBe(6);
                    expect(fObj.length).toBe(0);
                });


        });

});