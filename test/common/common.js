(function () {
    
    function Common() {
        this.ds1;
        this.tParent;
        this.t1;
        this.t2;
        this.t3;
        this.objrow1;
        this.objrow2;
        this.objrow3;
        this.objrow4;
        this.objrow5;
        this.objrow6;
        this.objrow7;
        this.objrow1Parent;
        this.objrow2Parent;
        this.cName = "c_name";
        this.cDec = "c_dec";
        this.cCitta = "c_citta";
        this.cSex = "c_sex";
        this.cAlt = "c_alt";
        this.cDate = "c_date";
        this.cDouble = "c_double";
        this.cInt16 = "c_int16";
        
        this.pIvatoSearch = "016";
        
        this.buildDs1();
    }
    
    Common.prototype = {
        constructor:Common,
        
        buildDs1:function () {
            // costrusico ogetto stato e ds
            this.ds1 = new jsDataSet.DataSet("temp");
            this.tParent =  this.ds1.newTable("tParent");
            this.t1 = this.ds1.newTable("table1");
            this.t2 = this.ds1.newTable("table2");
            this.t3 = this.ds1.newTable("table3");
            this.tParent.setDataColumn(this.cName, "String");
            this.tParent.setDataColumn(this.cDec, "Decimal");
            this.tParent.setDataColumn(this.cDouble, "Double");
            // setto le prop delle colonne per t1
            this.t1.setDataColumn(this.cName, "String");
            this.t1.setDataColumn(this.cDec, "Decimal");
            this.t1.setDataColumn(this.cDouble, "Double");
            // setto le prop delle colonne per t2
            this.t2.setDataColumn(this.cName, "String");
            this.t2.setDataColumn(this.cCitta, "String");
            // setto le prop delle colonne per t3
            this.t3.setDataColumn(this.cAlt, "Decimal");
            this.t3.setDataColumn(this.cSex, "String");
            this.t3.setDataColumn(this.cDate, "DateTime");
            this.t3.setDataColumn(this.cInt16, "Int16");

            this.tParent.columns[this.cName].caption = this.cName;
            this.tParent.columns[this.cDec].caption = this.cDec;
            this.tParent.columns[this.cDouble].caption = this.cDouble;

            this.t1.columns[this.cName].caption = this.cName;
            this.t1.columns[this.cName].caption = this.cName;
            this.t1.columns[this.cName].caption = this.cName;

            this.t2.columns[this.cName].caption = this.cName;
            this.t2.columns[this.cCitta].caption = this.cCitta;

            this.t3.columns[this.cAlt].caption = this.cAlt;
            this.t3.columns[this.cSex].caption = this.cSex;
            this.t3.columns[this.cDate].caption = this.cDate;
            this.t3.columns[this.cInt16].caption = this.cInt16;
            

            this.objrow1Parent = { c_name: "nome1Parent", c_dec: 1122, c_double: 5001 };
            this.objrow2Parent = { c_name: "nome2", c_dec: 22, c_double: 6001 };

            // aggiungo 2 righe alla t1
            this.objrow1 = { c_name: "nome1", c_dec: 11, c_double: 1001 };
            this.objrow2 = { c_name: "nome2", c_dec: 22, c_double: 2002 };

            // righe tabella t2 child. c_name è la stessa
            this.objrow3 = { c_name: "nome1", c_citta: "roma" };
            this.objrow4 = { c_name: "nome2", c_citta: "bari" };

            // righe tab t3
            this.objrow5 =
            {
                c_alt: 1.5,
                c_sex: "maschio",
                c_date: new Date("1980-10-02"),
                c_int16: 2018
            }; // ISO 8601 syntax (YYYY-MM-DD)
            this.objrow6 =
            {
                c_alt: 1.6,
                c_sex: "femmina",
                c_date: new Date("1981-10-02"),
                c_int16: 2019
            }; // ISO 8601 syntax (YYYY-MM-DD)
            this.objrow7 =
            {
                c_alt: 1.7,
                c_sex: null,
                c_date: new Date("1981-10-02"),
                c_int16: 2020
            }; // ISO 8601 syntax (YYYY-MM-DD)

            // aggiungo righe tab 1
            this.tParent.add(this.objrow1Parent);
            this.tParent.add(this.objrow2Parent);
            // aggiungo righe tab 1
            this.t1.add(this.objrow1);
            this.t1.add(this.objrow2);
            // aggiungo righe tab 2
            this.t2.add(this.objrow3);
            this.t2.add(this.objrow4);
            // aggiungo righe tab 3
            this.t3.add(this.objrow5);
            this.t3.add(this.objrow6);
            this.t3.add(this.objrow7);
            this.t1.key(this.cName);
            this.t2.key(this.cName);
            // aggiungo relazione. table 2 è collegata a table 1 tramite la colonna c_name
            this.ds1.newRelation("r1", "table1", [this.cName], "table2", [this.cName]);
            this.ds1.newRelation("r2", "tParent", [this.cName, this.cDec], "table1", [this.cName,  this.cDec]);
        },

        /**
         * @method getRegistryAnagraficaMockDataSet
         * @public
         * @description SYNC
         * Get an empty mocked "Registry_Anagrafica" dataset, Data are read fromjson file
         * @returns {jsDataSet}
         */
        getRegistryAnagraficaMockDataSet:function () {
             var jsonPath = "base/test/spec_midway/jstest/registry_anagrafica.json" ;
            //var jsonPath = "../../../test/spec_midway/jstest/registry_anagrafica.json" ;
            var json = $.getJSON({'url': jsonPath, 'async': false});
            var ds = appMeta.getDataUtils.getJsDataSetFromJson(json.responseText);
            return ds;
        },

        /**
         * @method getRegistryAnagraficaMockDataSetFilled
         * @public
         * @description SYNC
         * Gets a mocked "Registry_Anagrafica" dataset, Data are read fromjson file
         * Filled with rtf=null and cu=sa
         * @returns {jsDataSet}
         */
        getRegistryAnagraficaMockDataSetFilled:function () {
            var jsonPath = "base/test/spec_midway/jstest/registry_anagrafica._rtf_null_cu_sa.json" ;
            // var jsonPath = "../../../test/spec_midway/jstest/registry_anagrafica._rtf_null_cu_sa.json" ;
            var json = $.getJSON({'url': jsonPath, 'async': false});
            var ds = appMeta.getDataUtils.getJsDataSetFromJson(json.responseText);
            return ds;
            // N.B per utilizzare questi metodi in test , devi settare appMeta.basePath = "base/";
        },


        /**
         * @method eventWaiter
         * @public
         * @description ASYNC
         * Subscribes an event triggered by a metaPage. When the callback is invoked it unsubscribes the event and resolves the deferred.
         * Used in test case to wait for an event
         * @param {MetaPage} page
         * @param {string}eventName
         * @returns {Deferred}
         */
        eventWaiter:function(page, eventName) {
            var def = $.Deferred();
            var that = this;
            var f = function () {
                page.eventManager.unsubscribe(eventName, f, that);
                def.resolve();
            };
            page.eventManager.subscribe(eventName, f, that);
            return def;
        },

        /**
         * @method eventWaiter
         * @public
         * @description ASYNC
         * Subscribes an event triggered by a metaPage. When the callback is invoked it unsubscribes the event and resolves the deferred.
         * Used in test case to wait for an event
         * @param {MetaPage} page
         * @param {string}eventName
         * @returns {Deferred}
         */
        eventGlobalWaiter:function(page, eventName) {
            var def = $.Deferred();
            var that = this;
            var f = function () {
                appMeta.globalEventManager.unsubscribe(eventName, f, that);
                def.resolve();
            };
            appMeta.globalEventManager.subscribe(eventName, f, that);
            return def;
        },

    };
    
    appMeta.common = new Common();
    
}());