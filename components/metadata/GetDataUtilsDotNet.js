/**
 * @module getDataUtilsDotNet
 * @description
 * Collection of utility functions for GetData
 */
(function () {

    var getDataUtils = appMeta.getDataUtils;
    function getDataFormat(){
        return  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        // vecchio formato senza millisecondi /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    }

    /**
     * @function getJsObjectFromJson
     * @public
     * @description SYNC
     * Given a json representation of the DataSet/DataTable returns a javascript object
     * @param {string} json
     * @returns {object} an object (DataTable or DataSet)
     */
    getDataUtils.getJsObjectFromJson = function (json) {
        // formato data aspettato
        var dateFormat = getDataFormat();
        function dataTransform(key, value) {
            if (typeof value === "string" && dateFormat.test(value)) {
                value =  getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(value), false); //) new Date(new Date(value).getTime() + (new Date().getTimezoneOffset() * 60000));
            }
            return value;
        }
        // riconverto la stringa json proveniente dal server
        var objParsed = JSON.parse(json, dataTransform);

        return objParsed;
    };


    /**
     * @function getJsonFromJsDataSet
     * @public
     * @description SYNC
     * Given a jsDataSet returns the json string. First it calls the methods serialize() of jsDataSet and then returns the json representation of the dataset object
     * @param {DataSet} ds
     * @param {boolean} serializeStructure. If true it serialize data and structure
     * @returns {string] the json string
     */
    getDataUtils.getJsonFromJsDataSet = function (ds, serializeStructure) {
        var objser = ds.serialize(serializeStructure);
        _.forEach(objser.tables, function (objdt) {
            getDataUtils.beforeDataTableStringfyJson(objdt, true);
        });
        var jsonToSend = JSON.stringify(objser);
        return jsonToSend;
    };

    /**
     * @function getJsonFromJsDataSet
     * @public
     * @description SYNC
     * Serializes a DataTable with the data and structure
     * @param {DataTable} dt
     * @returns {string} the json string
     */
    getDataUtils.getJsonFromDataTable = function (dt) {
        var objser = dt.serialize(true);
        getDataUtils.beforeDataTableStringfyJson(objser, true);
        var jsonToSend = JSON.stringify(objser);
        return jsonToSend;
    };

    /**
     * Used on serialized datatable to modify the date timesoffset to avoid the JSON.stringify convert date in utc
     * @param {DataTable} objdt
     * @param {boolean} normalize
     */
    getDataUtils.beforeDataTableStringfyJson = function (objdt, normalize) {
        // Da applicare ogni volta che serialzizo il dt verso server, prima della JSON.stringfy
       _.forEach(objdt.rows, function (row) {
           _.forEach(objdt.columns, function (c) {
                if (c.ctype==="DateTime"){
                    if (row.curr){
                        row.curr[c.name] = row.curr[c.name] ? getDataUtils.normalizeDataWithoutOffsetTimezone(row.curr[c.name], normalize) : row.curr[c.name];
                    }
                    if (row.old){
                        row.old[c.name] = row.old[c.name] ? getDataUtils.normalizeDataWithoutOffsetTimezone(row.old[c.name], normalize) : row.old[c.name];
                    }
                    if (row[c.name] ){
                        row[c.name] = getDataUtils.normalizeDataWithoutOffsetTimezone(row[c.name], normalize);
                    }
                }
           })
       })
    };

    /**
    * @method normalizeDataWithoutOffsetTimezone
    * @public
    * @description SYNC
    * When js convert to JSON, JSON uses Date.prototype.toISOString that doesn't represent local hour but the UTC +offset.
    * So the string will be modified with a new date. In this function we avoid this behaviour, it adds the offset to the date. succesive stringfy() doesn't change the date
    * @param {Date} date
    */
    getDataUtils.normalizeDataWithoutOffsetTimezone = function (date, normalize) {
        // soluzione su https://code.i-harness.com/en/q/16ae8c
        if (normalize){
            var newDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        } else{
            var newDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        }
       return newDate;
    };

    appMeta.getDataUtils = getDataUtils;
}());

