/**
 * @module getDataUtilsNode. overrides getDataUtils methods for node backend
 * @description
 * Collection of utility functions for GetData
 */

(function () {
    let getDataUtils = appMeta.getDataUtils;

    //2017-12-11T13:21:38.890Z
    const dateFormat =  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    // vecchio formato senza millisecondi /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

    function dataTransform(key, value) {
        if (typeof value === "string" && dateFormat.test(value)) {
            //console.log("date found:"+value);
            //console.log("date found:"+value);
            return  new Date(value);
            //value =  getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(value), false); //) new Date(new Date(value).getTime() + (new Date().getTimezoneOffset() * 60000));
        }
        return value;
    }

    /**
     * @method normalizeDataWithoutOffsetTimezone
     * @public
     * @description SYNC
     * When js convert to JSON, JSON uses Date.prototype.toISOString that doesn't represent local hour but the UTC +offset.
     * So the string will be modified with a new date. In this function we avoid this behaviour, it adds the offset to the date.
     * succesive stringify() doesn't change the date
     * @param {Date} date
     */
    getDataUtils.normalizeDataWithoutOffsetTimezone = function (date, normalize) {
        //return date;
        //Client side is necessary to normalize date
        if (normalize){
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        } else{
            return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        }

    };


    /**
     * @function getJsObjectFromJson
     * @public
     * @description SYNC
     * Given a json representation of the DataSet/DataTable returns a javascript object
     * @param {string} json
     * @returns {object} an object (DataTable or DataSet)
     */
    appMeta.getDataUtils.getJsObjectFromJson = function (json) {
        //console.log("the method getJsObjectFromJson is NODE")
        // riconverto la stringa json proveniente dal server
        if (typeof json === 'string') {
            //console.log("parsing string "+json)
            return JSON.parse(json, dataTransform);
        }
       return json;
       //return JSON.parse(json);
    };


    /**
    * @method normalizeDataWithoutOffsetTimezone
    * @public
    * @description SYNC
    * When js convert to JSON, JSON uses Date.prototype.toISOString that doesn't represent local hour but the UTC +offset.
    * So the string will be modified with a new date. In this function we avoid this behaviour, it adds the offset to the date. succesive stringfy() doesn't change the date
    * @param {DataTable} date
    */
    appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone = function (date, normalize) {
        // nel caso nodejs, la parse toglie offset, la stringify lo aggiunge quindi non è necessario normalizzare
        return date;
    };

}());

