
/**
 * @class ConnMockServer
 * @summary ConnMockServer
 * @description
 *
 */
function ConnMockServer() {
    "use strict";
}

ConnMockServer.prototype = {

    /**
     * Override of call method
     * @method callGet
     * @public
     * @param {string} method
     * @param {Object} prm
     * @returns {Promise}
     */
    call:function (objConn) {
        if (this[objConn.method]) return this[objConn.method](objConn.prm);
        throw  "method " + method + " not defined on ConnMockServer" ;
    },


    // ********** Private methods. Tey are customized based on unit test **********
    /**
     * Returns the number of the rows in a table
     * @param prm
     * @returns {Promise}
     */
    selectCount:function (prm) {
        return $.Deferred().resolve(100).promise();
    },

    /**
     * get rows of paginated table
     * @param {Object} prm
     * @returns {Promise}
     */
    getPagedTable:function (prm) {
        // recupero parametro
        var nPage = prm.nPage;
        var nrowperpage = prm.nRowPerPage;

        var ds = new jsDataSet.DataSet("temp");
        var t = ds.newTable("table1");
        t.setDataColumn("c_name", "String");
        t.setDataColumn("c_dec", "Single");
        t.setDataColumn("c_citta", "String");
        t.columns["c_name"].caption = "Name";
        t.columns["c_dec"].caption = "Age";
        t.columns["c_citta"].caption = "Citta";
        var init = ( nPage - 1 ) * nrowperpage;
        for (var i = init; i < init + nrowperpage; i++){
            var cname;
            if (i % 3 ===0){
                cname= "Long nameeeeeeeeeeeeeeeeee" + i;
            }else{
                cname= "nome" + i;
            }
            var objrow = {c_name: cname , c_dec: i, c_citta: "citta" + i};
            t.add(objrow);
        }

        return $.Deferred().resolve(t).promise();
    }
};

