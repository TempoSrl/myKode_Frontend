/**
 * @module getDataUtilsDotNet
 * @description
 * Collection of utility functions for GetData
 */
(function () {

    var getDataUtils = appMeta.getDataUtils;
    const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    function getDataFormat(){
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        // vecchio formato senza millisecondi /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    }

    //function dataTransform(key, value) {
    //    if (typeof value === "string" && dateFormat.test(value)) {
    //        return new Date(value);
    //    }
    //    return value;
    //}
    function dataTransformToJSON(key, value) {
        //console.log("key:"+key+",value:"+value+" of type "+typeof value);
        //if (Object.prototype.toString.call(value) === '[object Date]') {
        if (typeof value === "string" && dateFormat.test(value)) {
            //console.log("dot net toJSON client old value time is " + value);

            //old 10:35 new 10:35
            //value = getDataUtils.normalizeDataWithoutOffsetTimezone(value, true); //) new Date(new Date(value).getTime() + (new Date().getTimezoneOffset() * 60000));
            date = new Date(value);
            value = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
                //getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(value), true)); //) new Date(new Date(value).getTime() + (new Date().getTimezoneOffset() * 60000));
            
            //console.log("dot net toJSON client new value time is " + value);
        }


        return value;
    }

    function dataTransformFromJSON(key, value) {
        if (typeof value === "string" && dateFormat.test(value)) {
            //console.log("dot net fromJSON client old value time is " + value);

            //old 10:35 new 11:35
            //value = new Date(value);

            //old 10:35 new 10:35
            value = getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(value), false); //) new Date(new Date(value).getTime() + (new Date().getTimezoneOffset() * 60000));

            //old 10:35 new 10:35
            //value = getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(value), true); //) new Date(new Date(value).getTime() + (new Date().getTimezoneOffset() * 60000));

            //console.log("dot net fromJSON client new value time is " + value);
        }
        return value;
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
        //console.log("running getJsObjectFromJson");
      
        
        // riconverto la stringa json proveniente dal server
        var objParsed = JSON.parse(json, dataTransformFromJSON);
        //console.log("obtained objParsed by getJsObjectFromJson");
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
        //console.log("doing .NET  getJsonFromJsDataSet");
        var objser = ds.serialize(serializeStructure);
        //_.forEach(objser.tables, function (objdt) {
        //    getDataUtils.beforeDataTableStringifyJson(objdt, true);
        //});

        var jsonToSend = JSON.stringify(objser, dataTransformToJSON);
        return jsonToSend;
    };

    /**
     * @function getJsonFromDataTable
     * @public
     * @description SYNC
     * Serializes a DataTable with the data and structure
     * @param {DataTable} dt
     * @returns {string} the json string
     */
    getDataUtils.getJsonFromDataTable = function (dt) {
        var objser = dt.serialize(true);
        objser.name = dt.name;
        //getDataUtils.beforeDataTableStringifyJson(objser, true);
        var jsonToSend = JSON.stringify(objser, dataTransformToJSON);
        return jsonToSend;
    };

    ///**
    // * Used on serialized datatable to modify the date timesoffset to avoid the JSON.stringify convert date in utc
    // * @param {DataTable} objdt
    // * @param {boolean} normalize
    // */
    //getDataUtils.beforeDataTableStringifyJson = function (objdt, normalize) {
    //    // Da applicare ogni volta che serializzo il dt verso server, prima della JSON.stringify
    //    _.forEach(objdt.columns, function (c) {
    //        if (c.ctype==="DateTime"){
    //            _.forEach(objdt.rows, function (row){

    //                if (row.curr){
    //                    row.curr[c.name] = row.curr[c.name] ? getDataUtils.normalizeDataWithoutOffsetTimezone(row.curr[c.name], normalize) : row.curr[c.name];
    //                }
    //                if (row.old){
    //                    row.old[c.name] = row.old[c.name] ? getDataUtils.normalizeDataWithoutOffsetTimezone(row.old[c.name], normalize) : row.old[c.name];
    //                }
    //                if (row[c.name]){
    //                    row[c.name] = getDataUtils.normalizeDataWithoutOffsetTimezone(row[c.name], normalize);
    //                }
    //            });
    //        }
    //    })
    //};

    /**
    * @method normalizeDataWithoutOffsetTimezone
    * @public
    * @description SYNC
    * When js convert to JSON, JSON uses Date.prototype.toISOString that doesn't represent local hour but the UTC +offset.
    * So the string will be modified with a new date.
     * In this function we avoid this behaviour, it adds the offset to the date. succesive stringfy() doesn't change the date
    * @param {Date} date
    */
    getDataUtils.normalizeDataWithoutOffsetTimezone = function (date, normalize) {
        // soluzione su https://code.i-harness.com/en/q/16ae8c
        if (normalize){
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        } else{
            return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        }

    };

    appMeta.getDataUtils = getDataUtils;
}());

