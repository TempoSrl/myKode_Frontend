/**
 * @module CssDefault
 * @description
 * Contains the default css class name of the app. The class are defined  in app/style/app.css
 */
(function () {

    /**
     * @constructor CssDefault
     * @description
     */
    function CssDefault() {
        "use strict";
    }

    CssDefault.prototype = {

        constructor: CssDefault,
        selectedRow:  "selectedRow",
        //odd: "odd",
        listManagerFooterCont: "listManagerFooterCont",
        listManagerFooter: "listManagerFooter",
        autoChoose: "autoChoose",
        btnPushed: "btnPushed",
        detailPage: "detailPage",
        alignNumericColumn: "alignNumericColumn",
        alignStringColumn : "alignStringColumn",

        /**
         * @method getColumnsAlignmentCssClass
         * @private
         * @description SYNC
         * Returns the css style of the column depending on the column type
         * @param {DataColumn} c
         * @returns {string}
         */
        getColumnsAlignmentCssClass: function (ctype) {
            switch (ctype) {
                case "Decimal":
                case "Double":
                case "Int16":
                case "Single":
                case "Int32":
                case "DateTime":
                    return this.alignNumericColumn;
                case "String":
                    return this.alignStringColumn;
                default:
                    return this.alignStringColumn;
            }
        },
    };

    appMeta.cssDefault = new CssDefault();
}());
