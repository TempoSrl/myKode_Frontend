/**
 * Custom Control for the graph.
 * @module UploadControl
 * @description
 * Manages the graphics and the logic of a numeric slider
 */
(function() {

    var Deferred = appMeta.Deferred;

    /**
     *
     * @param {html node} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table
     * @param {DataTable} primaryTable
     * @param {string} listType
     * @constructor
     */
    function GraphControl(el, helpForm, table, primaryTable, listType) {
        this.helpForm = helpForm;
        this.el = el;
      

        //this.xaxestime = (typeof $(el).data("xaxestime") !== "undefined"); non si capisce a cosa serve, lo rimuovo
        // ---> può essere "bar" o "line"
        this.type = (typeof $(el).data("type") === "undefined") ? 'line' : $(el).data("type");
        this.ycol = $(el).data("ycol");
        this.xcol = $(el).data("xcol");
        this.tname = $(el).data("tname");
        this.title = (typeof $(el).data("title") === "undefined") ? 'graph' : $(el).data("title");

        $(el).css('border', '1px solid lightgrey');
        $(el).css('padding', '5px');
        $(el).css('background-color', 'white');
        $(el).css('border-radius', '10px');
        $(el).css('box-shadow', '0px 2px 4px lightgrey');

        // costruisce la grafica del controllo
        this.buildTemplateHtml();
    }

    GraphControl.prototype = {
        constructor: GraphControl,

        /**
         * @method buildTemplateHtml
         * @private
         * @description SYNC
         * Builds the graph control with empty values
         */
        buildTemplateHtml:function () {
            var uniqueid = appMeta.utils.getUniqueId();
            this.idGraph = "graph_" + uniqueid;
            var htmlCodeTemplate = '';
            htmlCodeTemplate = '<div></div><canvas id="' + this.idGraph + '"></canvas></div>' ;
            // appendo al controllo padre
            $(this.el).append(htmlCodeTemplate);
            var ctx = document.getElementById(this.idGraph).getContext("2d");
            var config = {
                    type: this.type,
                    options: {}
            };
            this.myNewChart = new Chart(ctx, config);
            this.updateGraph([], []);
        },


        // QUI INZIANO METODI DI INTERFACCIA Del CUSTOM CONTROL

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Fills the control.
         */
        fillControl:function(el){
            var def = Deferred("graph-fillControl");
            //  label che appare se l'allegato è caricato
            var table = this.metaPage.state.DS.tables[this.tname];
            var xvalues = this.getXValues(table.rows);
            var yvalues = this.getYValues(table.rows);
            this.updateGraph(xvalues, yvalues);
            return def.resolve();
        },

        getXValues:function(rows) {
            var self = this;
            return rows.map(function (row) {
                //if (self.xaxestime && row[self.xcol]) {
                //    return moment(row[self.xcol]).format("DD-MM-YYYY");
                //}
                return row[self.xcol];
            });
        },

        getYValues:function(rows) {
            var self = this;
            return rows.map(function (row) {
                return row[self.ycol];
            });
        },

        updateGraph: function(xvalues, yvalues) {
            var data = {
                labels: xvalues,
                datasets: [{
                    label: this.title,
                    data: yvalues,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255,99,132,1)'
                    ],
                    borderWidth: 1
                }]
            };
            this.myNewChart.data = data;
            this.myNewChart.update();
        },

        /**
         * @method getControl
         * @public
         * @description ASYNC
         */
        getControl: function(el, r, field) {
            // r[field] = this.getValue();
        },

        /**
         * @method clearControl
         * @public
         * @description ASYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         * @returns {Deferred}
         */
        clearControl: function() {
            var def = Deferred("graph-clearControl");
            this.updateGraph([], []);
            return def.resolve();
        },

        /**
         * @method addEvents
         * @public
         * @description ASYNC
         * @param {html node} el
         * @param {MetaPage} metaPage
         * @param {boolean} subscribe
         */
        addEvents: function(el, metaPage, subscribe) {
            this.metaPage = metaPage;
        },

        /**
         * @method preFill
         * @public
         * @description ASYNC
         * Executes a prefill of the control
         * @param {Html node} el
         * @param {Object} param {tableWantedName:tableWantedName, filter:filter, selList:selList}
         * @returns {Deferred}
         */
        preFill: function(el, param) {
            var def = Deferred("preFill-graph");
            return def.resolve();
        },

        /**
         * @method getCurrentRow
         * @private
         * @description SYNC
         * @returns {{table: *, row: *}}
         */
        getCurrentRow: function() {return null},

        /**
         * @method setCurrentRow
         * @private
         * @description SYNC
         * Used when the user click the event to set the current row. read from metapage with getCurrentRow() method
         * @param {ObjectRow} row
         */
        setCurrentRow:function (row) {}
    };

    window.appMeta.CustomControl("graph", GraphControl);

}());
