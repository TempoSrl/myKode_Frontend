/**
 * @module TypedObject
 * @description
 * Contains utility methods to manage the conversion beetwen db and javascript types. It manages also the correct display format for each type
 */
(function () {

    var numberDecimalSeparator = ",";       // Separatore decimale
    var numberGroupSeparator = ".";         // Separatore delle migliaia
    var currencyDecimalSeparator = ",";     // Separatore decimale currency
    var currencyGroupSeparator = ".";       // Separatore Migliaia Currency
    var currencySymbol = String.fromCharCode(8364); // Simbolo di currency (€)

    /**
     * @constructor TypedObject
     * @description
     * Initializes a TypedObject. It does some logic depending on the DB type "string", "number", "double"
     * @param {string} typeName
     * @param {object|string} s if s is string, it is converted to an object
     * @param {string} [tag] optional tag
     * @return {object}
     */
    function TypedObject(typeName, s, tag) {

        this.typeName = typeName;
        this.value = null;
        if (typeName === null) s = "";
        if (s === null || s === undefined) return this;
        var fmt = getFormatfromTag(tag);
        if (!fmt) fmt = null;
        if (fmt === "") fmt = null;

        if (typeof s !== "string") {
            this.value = s;
            return this;
        }

        try {
            var prefix;
            var sdec;
            var suffix;
            var dec;
            var sscale;
            var scale;
            var aa;
            var year;
            var cc;
            switch (typeName) {
                case "String":
                case "string":
                    this.value = s;
                    return this;
                case "Char":
                    this.value = s.charAt(0);
                    return this;
                // Double, Single and Decimal are always treated as Float
                case "Double":
                case "Single":
                case "Decimal":
                case "number":
                    if (s === "") return this;
                    var d;
                    if (fmt === null || isStandardNumericFormatStyle(fmt)) {
                        d = parseFloat(toJsNumber(s, getNumberStyles(fmt)));
                        if (isNaN(d)) return this;
                        this.value = d;
                        return this;
                    }

                    if (fmt === "fixed") {
                        tag = getStandardTag(tag);
                        sdec = getFieldLower(tag, 3);
                        prefix = getFieldLower(tag, 4);
                        suffix = getFieldLower(tag, 5);
                        if (prefix !== "") s = s.replace(prefix, "");
                        if (suffix !== "") s = s.replace(suffix, "");
                        s = toJsNumber(s, getNumberStyles(fmt));
                        dec = parseInt(sdec);
                        sscale = getFieldLower(tag, 6);
                        d = parseFloat(s);
                        if (isNaN(d)) return this;
                        d = parseFloat(d.toFixed(dec)); //restituisce una stringa

                        scale = 0;
                        if (sscale) {
                            scale = parseFloat(sscale);
                            if (isNaN(scale)) return this;
                        }
                        if (scale) d = d / scale;
                        this.value = d;
                    }
                    return this;


                //DateTime right now just implements the "d" format
                case "DateTime":
                    if (s === "") return this;
                    // Convert S into a Date
                    // Not sure if it has to work this way... maybe the If can be removed...
                    //if (!isStandardDateFormatStyle(fmt)) {
                    //    fmt = "dd";
                    //}
                    this.value = fromStringToDate(s, fmt);
                    return this;


                //The following formats wi11 always return an int datatype...
                case "int":
                case "Byte":
                case "Int16":
                case "Int32":


                    if (s === "") return this;
                    var i = parseInt(s);
                    if (isNaN(i)) return this;
                    this.value = i;
                    if (fmt === null || isStandardNumericFormatStyle(fmt)) return this;
                    if (fmt === "year") {
                        if (i >= 100) return this;
                        year = new Date().getFullYear();
                        aa = (year % 100);
                        cc = (year - aa);
                        i = (i + cc);
                        if (aa > 50) {
                            i = (i + 100);
                        }
                        this.value = i;
                    }
                    return this;


                default:
                    this.value = "'" + s + "'";
            }
        } catch (e) {
            alert("Error " + e + " converting " + s + " into " + typeName + " fmt = " + fmt);
        }
        return this;
    }

    TypedObject.prototype = {
        constructor: TypedObject,

        /**
         * @method stringValue
         * @public
         * @description SYNC
         * Returns the string representation of an object
         * @param {string} tag
         * @returns {string}
         */
        stringValue: function (tag) {
            /*
             StringValue è la funzione duale di TypedObject(). A partire da pObject,
             che consta di due membri (TypeName e Obj descritti nella funzione precedente)
             fornisce in output una stringa formattata secondo pTag.
             */

            if (this.value === null || this.value === undefined) return "";

            var fmt = getFormatfromTag(tag);
            if (this.typeName === "DateTime") {
                if (isStandardDateFormatStyle(fmt)) {
                    return fromDateToString(this.value,fmt);
                }
                return fromDateToString(this.value, "d");
            }

            var d;
            if (this.typeName === "Decimal" || this.typeName === "Single" || this.typeName === "Double") {
                if (fmt === null || isStandardNumericFormatStyle(fmt)) {
                    return fromNumberToString(this.value, appMeta.config.defaultDecimalPrecision, getNumberStyles(fmt));
                }

                if (fmt === "fixed") {
                    tag = getStandardTag(tag);
                    // tabella.campo.fixed.pos_decimali.prefix.suffix.scale
                    d = parseFloat(this.value);
                    var sdec = getFieldLower(tag, 3);
                    var prefix = getFieldLower(tag, 4);

                    if (prefix == null) prefix = "";
                    var suffix = getFieldLower(tag, 5);
                    if (suffix == null) suffix = "";

                    var dec = parseInt(sdec);

                    var sscale = getFieldLower(tag, 6);
                    if (sscale == null) sscale = 0;
                    var scale = parseFloat(sscale);
                    if (scale !== 0 && !isNaN(scale)) d = d * scale;
                    var news = fromNumberToString(d, dec, getNumberStyles(fmt));

                    if (prefix !== "") news = prefix + " " + news;
                    if (suffix !== "") news = news + " " + suffix;
                    return news;
                }
            }
            return this.value.toString();
        }
    }

    function getFormatfromTag(tag){
        var fmt = getField(tag, 2);
        if (fmt) fmt = fmt.split("?")[0]; // caso sia seguito da un searchTag
        return fmt;
    }

    /**
     * @method getStandardTag
     * @public
     * @description SYNC
     * Gets standard tag from a "tag" object
     * @param  {string} tag
     * @returns {string}
     */
    function getStandardTag(tag) {
        if (!tag) return null;
        var s = tag.toString().trim();
        var pos = s.indexOf("?");
        if (pos === -1) return blankToNull(s);
        return blankToNull(s.substring(0, pos));
    }

    /**
     * @method blankToNull
     * @private
     * @description SYNC
     * Converts blank values to null
     * @param {string} s
     * @returns {string|null}
     */
    function blankToNull(s) {
        if (s === null || s === undefined) return null;
        s = s.trim();
        if (s === "") return null;
        return s;
    }

    /**
     * @method fromDateToString
     * @private
     * @description SYNC
     * Converts a Date into a string representation
     * @param {Date} value
     * @param {string} pStdDateFormat
     * @returns {string}
     */
    function fromDateToString(value, pStdDateFormat) {
        /*
         Funzione duale della precedente. Dato un pObject (presumibilmente di tipo Date Javascript)
         ed un formato data pStdDateFormat (i formati supportati al momento sono “d” e “g” di cui sopra),
         ritorna una stringa formattata secondo pStdDateFormat.
         */

        var strDay;
        var strMonth;
        var strYear;
        var strHours;
        var strMinutes;

        if (value === null || value===undefined) return null;

        var myDate = value;
        //Year=TmpDate.getYear();
        var year = myDate.getFullYear();
        var month = myDate.getMonth() + 1;
        var day = myDate.getDate();

        switch (pStdDateFormat) {
            case "d":
            {
                // dd/mm/yyyy
                //Pad Zeroes to the left of "Day" and "Month" (if necessary)
                strDay = day.toString();
                if (strDay.length === 1)
                    strDay = "0" + strDay;
                strMonth = month.toString();
                if (strMonth.length === 1)
                    strMonth = "0" + strMonth;
                strYear = year.toString();
                return  strDay + "/" + strMonth + "/" + strYear;
            }

            // html input=date. accetta valori di data solo nel formato yyyy-MM-dd
            case "dd":
            {
                // for input date html5. it accepts yyyy-MM-dd
                strDay = day.toString();
                if (strDay.length === 1)
                    strDay = "0" + strDay;
                strMonth = month.toString();
                if (strMonth.length === 1)
                    strMonth = "0" + strMonth;
                strYear = year.toString();
                return  strYear + "-" + strMonth + "-" + strDay;
            }

            case "D":
            {
                // Not yet implemented
                return null;
            }


            case "g":
            {
                // dd/mm/yyyy hh:mm:ss -- needs to be implemented NOW
                var hours = myDate.getHours();
                var minutes = myDate.getMinutes();
                //			Seconds=TmpDate.getSeconds();

                strDay = day.toString();
                if (strDay.length === 1)
                    strDay = "0" + strDay;
                strMonth = month.toString();
                if (strMonth.length === 1)
                    strMonth = "0" + strMonth;
                strYear = year.toString();
                strHours = hours.toString();
                //if (StrHours.length==1)
                //	StrHours = "0" + StrHours;
                strMinutes = minutes.toString();
                if (strMinutes.length === 1)
                    strMinutes = "0" + strMinutes;
                //			StrSeconds=Seconds.toString();
                //			if (StrSeconds.length==1)
                //				StrSeconds = "0" + StrSeconds;

                return strDay + "/" + strMonth + "/" + strYear + " " + strHours + "." + strMinutes;

            }

        }
        return null;

    }

    /**
     * @method fromNumberToString
     * @private
     * @description SYNC
     * Transforms a number into a js friendly string
     * @param {int} pNumber
     * @param {int} pPrecision
     * @param {string} pNumberStyle
     * @returns {string}
     */
    function fromNumberToString (pNumber, pPrecision, pNumberStyle) {
        /*
         Dato un pNumber (numero Javascript), una precisione pPrecision ed un pNumberStyle,
         lo converte dal formato Javascript in stringa. Ad es. 1234673.33 verrà convertito
         in 1.234.673,33. Se pNumberStyle vale “Currency”, aggiunge anche il simbolo di valuta.
         Questa funzione viene richiamata da StringValue.
         */

        var pArray;
        var intPart; // Stores the Integer part of a "number"
        var decimalPart; // Stores the Decimal part of a "number"
        var pFloat;
        var decSeparator;
        var hasNegativeSign;
        var currSymbol = "";

        // Convert the input number into a float to obtain the desired precision
        // (maybe this passage is useless)
        if (pNumber === null) return null;
        if (pNumber === "") pNumber = "0";
        pFloat = parseFloat(pNumber);

        if (parseInt(pPrecision) > 0)
            pFloat = pFloat.toFixed(parseInt(pPrecision));
        else
            pFloat = pFloat.toFixed(0);

        // il tofixed trasforma in string
        pNumber = pFloat;

        if (pNumber.indexOf("-") !== -1) {
            hasNegativeSign = true;
            pNumber = pNumber.replace("-", "");
        }
        if (pNumber.indexOf(".") !== -1) {
            pArray = pNumber.split(".");

            intPart = pArray[0];
            decimalPart = pArray[1];

            decSeparator = numberDecimalSeparator;

        } else {
            intPart = pNumber;
            decSeparator = "";
            decimalPart = "";
        }

        // Parse Decimal Part and put NumberGroupSeparators
        if (intPart.length > 3) {

            var counter = 1;
            var destinationString = "";
            for (var i = intPart.length - 1; i >= 0; i--) {
                if ((counter % 3) === 0 && (i !== 0))
                    destinationString = numberGroupSeparator + intPart.charAt(i) + destinationString;
                else
                    destinationString = intPart.charAt(i) + destinationString;
                counter++;
            }
            intPart = destinationString;
        }


        if (pNumberStyle === "Currency") {
            currSymbol = currencySymbol + " ";
            decSeparator = currencyDecimalSeparator;
        }

        if (hasNegativeSign)
            return "-" + currSymbol + intPart + decSeparator + decimalPart;
        else
            return currSymbol + intPart + decSeparator + decimalPart;
    }

    /**
     * @method stringFromJsObj
     * @public
     * @description SYNC
     * Returns the string representation given the pType of the column
     * @param {string} pType
     * @param {object} val to convert to string representation
     * @returns {string}
     */
    function stringFromJsObj  (pType, val) {
        switch (pType) {
            case "String":
            case "string":
                return val;
            case "Char":
                return val.charAt(0).toString();
            case "Decimal":
            case "Double":
            case "Single":
                return val.toString();
            case "int":
            case "Int16":
            case "Int32":
            case "Int64":
            case "Byte":
                return val.toString();
            case "DateTime":
            case "Date":
                return fromDateToString(val, "d");
            default:
                return val.toString();
        }
    }

    /**
     * @method jsObjFromString
     * @public
     * @description SYNC
     * Given the string "s" and the column type "pType", returns the appropriate js object
     * @param pType column types: “String”, “Char”, “Double”, “Single”, “Decimal”, “DateTime”, “Byte”, “Int16”, “Int32”
     * @param s string to convert
     * @returns {any}
     */
    function jsObjFromString (pType, s) {

        if (s === null || s === undefined) return null;

        switch (pType) {
            case "String":
            case "string":
                return s;
            case "Char":
                return s.charAt(0);
            case "Decimal":
            case "number":
            case "Double":
            case "Single":
                return parseFloat(s);
            case "int":
            case "Int16":
            case "Int32":
            case "Int64":
            case "Byte":
                return parseInt(s);
            case "DateTime":
            case "Date":
                // utilizzo la funz. già implementata passando d
                return fromStringToDate(s, "d");
            default:
                return s;
        }
    }

    /**
     * @method toJsNumber
     * @private
     * @description SYNC
     * Transforms a custom formatted string "s" in a js friendly like string
     * @param {string} s
     * @param {string} pNumberStyle. can be "Currency"
     * @returns {string}
     */
    function toJsNumber (s, pNumberStyle) {
        /*
         Data una string pString ed un pNumberStyle (che specifica se si tratti di currency o altro),
         rimuove il simbolo di valuta “€”, il separatore delle migliaia “.” e rimpiazza la virgola con il punto.
         Restituisce la stringa così ottenuta. Viene richiamata dalla GetObjectFromString.
         Utilizza le variabili globali CurrencySymbol, CurrencyGroupSeparator e CurrencyDecimalSeparator.
         */

        if (s === undefined || s === null || s === "") return null;

        switch (pNumberStyle) {
            case "Currency":
                s = s.replace(currencySymbol, "");
                while (s.indexOf(".") !== -1) {
                    s = s.replace(currencyGroupSeparator, "");
                }
                if (currencyDecimalSeparator !== ".") s = s.replace(currencyDecimalSeparator, ".");
                return s;
            case "Any":
            default:
                while (s.indexOf(".") !== -1) {
                    s = s.replace(numberGroupSeparator, "");
                    if (s === undefined || s === null || s === "") return null;
                }
                if (numberDecimalSeparator!==".") s = s.replace(numberDecimalSeparator, ".");
                return s;
        }

    }

    /**
     * @method isStandardNumericFormatStyle
     * @private
     * @description SYNC
     * Returns true if "fmt" format is a standard numeric format
     * @param {string} fmt
     * @returns {boolean}
     */
    function isStandardNumericFormatStyle (fmt) {

        switch (fmt) {
            case "n":
            case "c":
            case "d":
            case "e":
            case "f":
            case "g":
            case "x":
            case "p":
                return true;
            default:
                return false;
        }
    }

    /**
     * @method getNumberStyles
     * @private
     * @description SYNC
     * Returns a string that contains number style for the format "fmt"
     * @param {string} fmt
     * @returns {string}
     */
    function getNumberStyles (fmt) {

        switch (fmt) {
            case "n":return "Number";
            case "c":return "Currency";
            case "d":return "Integer";
            case "e":return "Float";
            case "f":return "Float";
            case "g":return "Any";
            case "x":return "HexNumber";
            case "p":return "Number";
        }
        return "Any";
    }

    /**
     * @method getField
     * @public
     * @description SYNC
     * Gets the "tagNumber"th field in a list of dot separated fields
     * @param {string} tag input string
     * @param {number} tagNumber 0 for first field
     * @returns {string} null if field not found
     */
    function getField(tag, tagNumber) {
        if (tag === null || tag === "" || tag === undefined) return null;
        var tagArray = tag.split(".");
        if (tagNumber >= tagArray.length) return null;
        return tagArray[tagNumber];
    }

    /**
     * @method getFieldLower
     * @public
     * @description SYNC
     * "tag" is a list of fields dot separated.
     * Returns the filed at the postion "pTagNumber" (returns empty string if "pTagNumber" > tag length).
     * convert it in lower case
     * @param {string} tag
     * @param {number} tagNumber
     * @returns {string}
     */
    function getFieldLower (tag, tagNumber) {
        return getField(tag, tagNumber) ? getField(tag, tagNumber).toLowerCase() : null;
    }

    /**
     * @method fromStringToDate
     * @public
     * @description SYNC
     * Converts a string into a js Date
     * @param {string} pString
     * @param {string} pStdDateFormat
     * @returns {Date}
     */
    function fromStringToDate (pString, pStdDateFormat) {
        /*
         Converte una stringa pString, ritornando una data Javascript,
         avendo in input pStdDateFormat come formato data. Al momento i
         formati data supportati (i.e. pStdDateFormat) sono 2:
         -	“d”: DD/MM/YYYY;
         -	“g”: DD/MM/YYYY HH:MM (o HH.MM).
         */

        if (pString == null)
            return null;
        pString = pString.trim();
        if (pString !== "") {
            var pArray;
            switch (pStdDateFormat) {
                case "d": //	Schema di data breve.
                {
                    if (pString.indexOf("/") !== -1)
                        pString = pString.replace(/\//g, " "); // removes slashes
                    if (pString.indexOf("-") !== -1)
                        pString = pString.replace(/\-/g, " "); // removes dashes
                    pString = pString.replace(/\s+/g, ' '); // removes multiple spaces
                    pArray = pString.split(" ");
                    if (isNaN(parseFloat(parseYear(pArray[2]))) ||
                        isNaN(parseFloat(pArray[1])) ||
                        isNaN(parseFloat(pArray[0])))
                        return null;
                    return new Date(parseYear(pArray[2]), parseFloat(pArray[1]) - 1, parseFloat(pArray[0]));
                }

                case "dd": //	Schema di data breve.
                {
                    if (pString.indexOf("-") !== -1)
                        pString = pString.replace(/\//g, " "); // removes slashes
                    if (pString.indexOf("-") !== -1)
                        pString = pString.replace(/\-/g, " "); // removes dashes
                    pString = pString.replace(/\s+/g, ' '); // removes multiple spaces
                    pArray = pString.split(" ");
                    if (isNaN(parseFloat(parseYear(pArray[0]))) ||
                        isNaN(parseFloat(pArray[1])) ||
                        isNaN(parseFloat(pArray[2].substring(0,2))))
                        return null;
                    return new Date(parseYear(pArray[0]), parseFloat(pArray[1]) - 1, parseFloat(pArray[2].substring(0,2)));
                }

                case "g": //Schema di data/ora generale (ora estesa).
                {
                    var pIsTime = false;

                    if (pString.indexOf(":") !== -1 || pString.indexOf(".") !== -1) {
                        pString = pString.replace(/\:/g, " "); // removes colon
                        pString = pString.replace(/\./g, " "); // removes dots
                        pIsTime = true;
                    }

                    if (pString.indexOf("/") !== -1)
                        pString = pString.replace(/\//g, " "); // removes slashes
                    if (pString.indexOf("-") !== -1)
                        pString = pString.replace(/\-/g, " "); // removes dashes
                    pString = pString.replace(/\s+/g, ' '); // removes multiple spaces
                    pArray = pString.split(" ");
                    var sDate;
                    switch (pArray.length) {
                        case 2:
                        {
                            if (pIsTime) {
                                // First get today's date, then add time from the array
                                sDate = new Date();
                                var pYear = parseYear(sDate.getFullYear().toString());
                                var pMonth = sDate.getMonth();
                                var pDate = sDate.getDate();

                                var pHours = pArray[0];
                                var pMinutes = pArray[1];
                                if (isNaN(parseFloat(pYear)) ||
                                    isNaN(parseFloat(pMonth)) ||
                                    isNaN(parseFloat(pDate)) ||
                                    isNaN(parseFloat(pHours)) ||
                                    isNaN(parseFloat(pMinutes)))
                                    return null;
                                sDate = new Date(pYear, pMonth, pDate, pHours, pMinutes);
                            } else {
                                if (isNaN(parseYear(pArray[2])) ||
                                    isNaN(parseFloat(pArray[1])) ||
                                    isNaN(parseFloat(pArray[0])))
                                    return null;
                                sDate = new Date(parseYear(pArray[2]),
                                    parseFloat(pArray[1]) - 1,
                                    parseFloat(pArray[0]));
                            }
                        }
                            break;
                        case 3:
                            if (isNaN(parseYear(pArray[2])) ||
                                isNaN(parseFloat(pArray[1])) ||
                                isNaN(parseFloat(pArray[0])))
                                return null;
                            sDate = new Date(parseYear(pArray[2]),
                                parseFloat(pArray[1]) - 1,
                                parseFloat(pArray[0]),
                                0,
                                0);
                            break;
                        case 5:
                            if (isNaN(parseYear(pArray[2])) ||
                                isNaN(parseFloat(pArray[1])) ||
                                isNaN(parseFloat(pArray[0])) ||
                                isNaN(parseFloat(pArray[3])) ||
                                isNaN(parseFloat(pArray[4])))
                                return null;
                            sDate = new Date(parseYear(pArray[2]),
                                parseFloat(pArray[1]) - 1,
                                parseFloat(pArray[0]),
                                parseFloat(pArray[3]),
                                parseFloat(pArray[4]));
                            break;

                    }
                    return sDate;

                }
            }

            return null;
        } else {
            return null;
        }
    }

    /**
     * @method parseYear
     * @public
     * @description SYNC
     * Given a pYear (with 2 digits), converts it in year, following these rules:
     * -	if pYear >=0 e <=29, returns 2000 + pYear;
     * -	if pYear>=30 e <=99, returns 1900 + pYear.
     * @param {string} pYear
     * @returns {number}
     */
    function parseYear(pYear) {
        if (pYear === null || pYear === undefined || pYear.trim() === "") {
            pYear = new Date().getFullYear();
        }

        var intYear = parseFloat(pYear);
        if (intYear >= 0 && intYear <= 29)
            return 2000 + intYear;
        if (intYear >= 30 && intYear <= 99)
            return 1900 + intYear;
        return intYear;
    }

    /**
     * @method isStandardDateFormatStyle
     * @private
     * @description SYNC
     * returns true if fmt Date format i standard
     * @param {string} fmt format of Date
     * @returns {boolean}
     */
    function isStandardDateFormatStyle (fmt) {
        /*
         Ritorna true se il formato data fmt è standard. False altrimenti.
         */
        switch (fmt) {
            case "d":
            case "dd":
                return true; //short date format. -- Main Format

            //case "D":
            //    return true; //long date format

            //case "t":
            //    return true; //time using the 24-hour format

            //case "T":
            //    return true; //long time format

            //case "f":
            //    return true; // long date and short time

            //case "F":
            //    return true; //  long date and long time

            case "g":
                return true; //  short date and short time

            //case "G":
            //    return true; //4/3/93 05:34 PM.

            //case "m":
            //    return true; // month and the day of a date

            //case "M":
            //    return true; // month and the day of a date

            //case "r":
            //    return true; // date and time as Greenwich Mean Time (GMT)

            //case "R":
            //    return true; // date and time as Greenwich Mean Time (GMT)

            //case "s":
            //    return true; // date and time as a sortable index.

            //case "u":
            //    return true; // date and time as a GMT sortable index

            //case "U":
            //    return true; // date and time with the long date and long time as GMT.

            //case "y":
            //    return true; // year and month.

            //case "Y":
            //    return true; // year and month.

            default:
                return false;
        }
    }

    appMeta.numberDecimalSeparator = numberDecimalSeparator;
    appMeta.numberGroupSeparator = numberGroupSeparator;
    appMeta.currencyDecimalSeparator = currencyDecimalSeparator;
    appMeta.currencyGroupSeparator = currencyGroupSeparator;
    appMeta.currencySymbol = currencySymbol;

    //sono duali 
    appMeta.jsObjFromString = jsObjFromString;
    appMeta.stringFromJsObj = stringFromJsObj;

    appMeta.TypedObject = TypedObject;
}());
