/*globals sqlFormatter, Environment, define, quote, global, module, exports,_ ,require */
/*jslint nomen: true*/
/*jslint bitwise: true */
/*jsLint -W016 */


(function(_) {

    /**
     * Escapes special characters in a string
     * @method myRegExpEscape
     * @private
     * @param str the string to be escaped
     * @return {String} escaped string
     */
    const myRegExpEscape = function (str) {
        return str.replace(/([.*+?\^=!:${}()\|\[\]\/\\])/g, '\\$1'); // str.replaceAll(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    };

    // function escapeRegExp(string) {
    //     return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    // }
    // function replaceAll(str, match, replacement){
    //     return str.replace(new RegExp(escapeRegExp(match), 'g'), ()=>replacement);
    // }


    /** Used to determine if values are of the language type `Object`. (thanks lodash)*/
    const objectTypes = {
        'function': true,
        'object': true
    };

    /**
     * Used as a reference to the global object. (thanks lodash)
     *
     * The `this` value is used if it is the global object to avoid Greasemonkey's
     * restricted `window` object, otherwise the `window` object is used.
     */
    let root = (objectTypes[typeof window] && window !== (this && this.window)) ? window : this;

    /** Detect free variable `exports`. (thanks lodash) */
    const freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. (thanks lodash)*/
    const freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
    const freeGlobal = freeExports && freeModule && typeof global === 'object' && global;
    if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
        root = freeGlobal;
    }

    /** Detect the popular CommonJS extension `module.exports`. Thanks lodash */
    const moduleExports = freeModule && freeModule.exports === freeExports && freeExports;


    function isAngularField(f) {
        return (f.substr(0, 2) === '$$');
    }



    /**
     * Function with ability to be converted to sql. When invoked gives a result depending on the arguments.
     * @function sqlFun
     * @class function
     * @public
     * @constructor
     */
    function sqlFun(){
        /**
         * constant true if it is a constant expression, false otherwise
         * @property constant
         * @public
         * @type boolean
         */
        this.constant = false;

        /**
         * name of this field in the select result
         * @property fieldName
         * @public
         * @type string
         **/
        this.fieldName= 'dummy';

        /**
         * Converts a SqlFun into a string
         * @method toSql
         * @public
         * @param {sqlFormatter} formatter  used to obtain details about making the expression,
         *      see sqlFormatter for an example
         * @param {Environment} env  is the environment into which the expression have to be evaluated
         * @return {string} //the sql representation of the expression
         */
        this.toSql= function(formatter, env){

        };

        /**
         * true if the function is the true constant
         * @property isTrue
         * @public
         * @type boolean
         **/
        this.isTrue = false;

        /**
         * true if the function is the false constant
         * @property isFalse
         * @public
         * @type boolean
         **/
        this.isFalse= false;

        /**
         *  table to which this field has been taken in a select
         * @property  tableName
         * @public
         * @type string
         */
        this.tableName= 'dummy';
    }





    /**
     * Check if an object is the null or undefined constant
     * @method isNullOrUndefined
     * @param {sqlFun|undefined|null|object} o
     * @return {boolean} true if o is null or undefined
     */
    function isNullOrUndefined(o) {
        return _.isNull(o) || _.isUndefined(o);
    }


    /**
     * Adds some useful methods and properties to a function in order to transform it into a sqlFun
     * @private
     * @method toSqlFun
     * @param {function} f
     * @param {function} toSql
     * @return {sqlFun}
     */
    function toSqlFun(f, toSql) {
        let tryInvoke = f();
        if (tryInvoke !== undefined) {
            //noinspection JSValidateTypes
            if (Array.isArray(tryInvoke)){
                return  tryInvoke;
            } //don't wrap an array in a constant
            f = constant(tryInvoke);
        } else {
            f.constant = false;
            f.toSql = toSql;
        }
        /**
         * Establish the output name for an expression
         * @method as
         * @param {string} fieldName
         * @return {sqlFun}
         */
        f.as = function(fieldName){
            f.fieldName= fieldName;
            //noinspection JSValidateTypes
            return f;
        };
        //noinspection JSValidateTypes
        return f;
    }

    /**
     * Provides utility functions to filter data and to create sql condition over database.<br>
     *
     * Every function returns a function f where:<br>
     *<ul>
     * <li>f ( r, environment )  = true if r matches condition in the given environment</li>
     * <li>f( r, environment ) = result  evaluated in the given environment if f is a computation function</li>
     * <li>f.isTrue = true if f is always true</li>
     * <li>f.isFalse = true if f is always false</li>
     * <li>f ( r, environment) = undefined if there is no sufficient data to evaluate f</li>
     * </ul>
     * null fields and undefined fields are all considered (and returned) as null values (so they compare equal).<br/>
     * f.toSql(formatter, environment)  = a string representing the underlying condition to be applied to a database.
     *  formatter is used to obtain details about the sql dialect to use, see [sqlFormatter](jsSqlServerFormatter.js)
     *   for an example <br/>
     *  [environment] is the environment into which the expression have to be evaluated
     *  @module jsDataQuery
     */



    /**
     * Transforms a generic function into a sqlFun, returning a similar function with some additional methods
     * @function context
     * @param {string|function} environmentVariable  Environment variable path or function
     * @return {sqlFun}
     * @example if environment = {a:1, b:2} and environmentFunction = function (env){return env.a}
     *   context(environmentFunction) applied to environment will return 1
     */
    function context(environmentVariable) {
        const f = function (r, environment) {
            if (environment === undefined) {
                return undefined;
            }
            if (typeof(environmentVariable)==='string'){
                return _.get(environment,environmentVariable);
            }
            if (typeof(environmentVariable)==='function'){
                return environmentVariable(environment);
            }
        };
        f.toSql = function(formatter, environment) {
            //noinspection JSUnresolvedFunction
            if (typeof(environmentVariable)==='string'){
                return formatter.quote(environment[environmentVariable]);
            }
            if (typeof(environmentVariable)==='function'){
                return formatter.quote(environmentVariable(environment));
            }
        };
        f.as = function(fieldName){
            f.fieldName= fieldName;
            return f;
        };
        f.constant = false;
        f.toString = function() {
            if (typeof(environmentVariable)==='string'){
                return 'context(' + environmentVariable + ')';
            }
            if (typeof(environmentVariable)==='function'){
                return environmentVariable.toString(); //'context(' + environmentVariable.name + ')';
            }

        };

        f.myName = 'context';
        f.myArguments = arguments;

        return f;
    }

    /**
     * Gets a field from an object. This is a very important function to distinguish between generic strings and
     *  field names.
     * @param {string} fieldName
     * @param {string} [tableName]
     * @return {sqlFun} f such that
     *  f(r) = r[fieldName]
     *  f.toSql() = 'fieldName' or 'tableName.fieldName' where tableName is specified
     *
     */
    function field(fieldName, tableName) {
        const f = function (r) {
            if (isNullOrUndefined(r)) {
                return undefined;
            }
            if (r.hasOwnProperty(fieldName)) {
                return r[fieldName];
            }
            return null;
        };
        f.tableName = tableName;
        f.fieldName = fieldName;
        f.toString = function() {
            if (tableName) {
                return tableName+'.'+fieldName;
            }
            return fieldName;
        };
        const toSql = function (formatter) {
            //noinspection JSUnresolvedFunction
            return formatter.field(fieldName, tableName);
        };

        f.myName = 'field';
        f.myArguments = arguments;

        return toSqlFun(f, toSql);
    }


    /**
     * transform strings into fields, leaves other things unchanged
     * For example 'a' becomes f(r)-> r['a'],
     *  12 is returned unchanged,
     *  a function is returned  unchanged
     * @method autofield
     * @private
     * @param {sqlFun|string|object} p
     * @return {sqlFun}
     */
    function autofield(p) {
        if (_.isString(p)) {
            return field(p); //p is considered a field name
        }
        return p;
    }


    /**
     * Defines a constant function. The toSql method invokes the formatter.quote function
     * @method constant
     * @param {object} value is a literal
     * @return {sqlFun} f such that f()= k, f.toSql()= formatter.quote(k)
     */
    function constant(value) {
        let k = value;
        if (k === undefined) {
            k = null;
        }
        const f = function () {
            return k;
        };
        f.toString = function() {
            if (f.isTrue) {
                return "(1=1)";
            }
            if (f.isFalse) {
                return "(1=0)";
            }
            if (typeof k === 'string'){
                return  "'"+k.replace(/'/g,"''")+"'";
            }
            return k.toString();
        };

        f.constant = true;
        f.as = function(fieldName){
            f.fieldName= fieldName;
            return f;
        };

        f.myName = 'constant';
        f.myArguments = arguments;

        if (k === true) {
            f.isTrue = true;
            f.toSql = function(formatter) {
                return formatter.eq(1, 1);
            };
            return f;
        }

        if (k === false) {
            f.isFalse = true;
            f.toSql = function(formatter) {
                return formatter.eq(1, 0);
            };
            return f;
        }


        /**
         * The .toSql method of a constant calls directly the quote method of the formatter. HERE is where the
         * tree top-down scan ends.
         * @param {sqlFormatter} formatter
         * @returns {*}
         */
        f.toSql = function(formatter) {
            //noinspection JSUnresolvedFunction
            return formatter.quote(k);
        };
        return f;
    }


    /**
     * Evaluates an expression in a given environment
     * @method calc
     * @param expr function representing a generic expression
     * @param {object} r
     * @param {Environment} environment
     * @return {Object|string|null|undefined} expr(r) evaluated in the given environment
     *  undefined are returned as null constant
     */
    function calc(expr, r, environment) {
        if (isNullOrUndefined(expr)) {
            return expr;
        }
        //if expr has .toSql extension, it can be directly evaluated with a simple invoke. If it is called with
        // undefined, and it is not a constant, it must return undefined. In no other case undefined is
        // allowed as return value from sqlFun invocation
        //noinspection JSUnresolvedVariable
        if (expr.toSql) {
            return expr(r, environment);
        }
        //if expr is an array, a new array is returned where each element is the evaluation of the
        // corresponding element in the original array
        if (_.isArray(expr)) {
            return _.map(expr, function(el) {
                return calc(el, r, environment);
            });
        }
        //any other object is returned as is
        return expr;
    }

    /**
     * Check if an expression evaluates to null
     * @method isNull
     * @param {sqlFun|string|object} expr1
     * @return {sqlFun} f where f(expr) = true if expr evaluates to null
     *  f.toSql() = something like '(EXPR is null)' where EXPR is the sql representation of the given expr
     */
    function isNull(expr1) {
        const expr = autofield(expr1);
        const f = function (r, environment) {
            if (expr === undefined) {
                return undefined;
            }
            if (expr === null) {
                return true;
            }

            const res = calc(expr, r, environment);
            if (res === undefined) {
                return undefined;
            }
            return (res === null);
        };

        f.toString = function() {
            return expr.toString()+" is null";
        };

        f.myName = 'isNull';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.isNull(expr, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Check if an expression does not evaluate to null
     * @method isNotNull
     * @param {sqlFun|string|object} expr1
     * @return {sqlFun} f where f(expr) = true if expr does not evaluate to null
     *  f.toSql() = something like '(EXPR is not null)' where EXPR is the sql representation of the given expr
     */
    function isNotNull(expr1) {
        const expr = autofield(expr1);
        const f = function (r, environment) {
            if (expr === undefined) {
                return undefined;
            }
            if (expr === null) {
                return false;
            }
            const res = calc(expr, r, environment);
            if (res === undefined) {
                return undefined;
            }
            return (res !== null);
        };

        f.toString = function() {
            return expr.toString()+" is not null";
        };

        f.myName = 'isNotNull';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.isNotNull(expr, environment);
        };
        return toSqlFun(f, toSql);
    }



    /**
     * @method minus
     * @param {sqlFun|string|object} expr1
     * @return {sqlFun} f where f(r) = - r. r should evaluate into a number
     */
    function minus(expr1) {
        const expr = autofield(expr1);
        const f = function (r, environment) {
            const v1 = calc(expr, r, environment);
            if (isNullOrUndefined(v1)) {
                return v1;
            }
            return -v1;
        };
        f.toString = function() {
            return '-' + expr.toString();
        };

        f.myName = 'minus';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.minus(expr, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * @method not
     * @param {sqlFun|string|object} expr1
     * @return {sqlFun} f where f(r) = not r. r should evaluate into a boolean
     */
    function not(expr1) {
        let expr = autofield(expr1);
        let f = function (r, environment) {
            let v1 = calc(expr, r, environment);
            if (isNullOrUndefined(v1)) {
                return v1;
            }
            return !v1;
        };
        f.toString = function() {
            return 'not(' + expr.toString() + ')';
        };

        f.myName = 'not';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.not(expr, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Check if the nth bit of expression is set
     * @method bitSet
     * @param {sqlFun|string|object}  expression note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} nbit
     * @return {sqlFun}
     */
    function bitSet(expression, nbit) {
        const expr = autofield(expression),
            f = function (r, environment) {
                if (r === undefined) {
                    return undefined;
                }
                const v1 = calc(expr, r, environment),
                    v2 = calc(nbit, r, environment);
                if (v1 === null || v2 === null) {
                    return null;
                }
                if (v1 === undefined || v2 === undefined) {
                    return undefined;
                }
                return (v1 & (1 << v2)) !== 0;
            };
        f.toString = function() {
            return 'bitSet(' + expr.toString() + ',' + nbit.toString() + ')';
        };

        f.myName = 'bitSet';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.bitSet(expr, nbit, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Check if the nth bit of expression is not set
     * @method bitClear
     * @param {sqlFun|string} expression note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} nbit
     * @return {sqlFun}
     */
    function bitClear(expression, nbit) {
        const expr = autofield(expression),
            f = function (r, environment) {
                if (r === undefined) {
                    return undefined;
                }
                const v1 = calc(expr, r, environment),
                    v2 = calc(nbit, r, environment);

                if (v1 === null || v2 === null) {
                    return null;
                }
                if (v1 === undefined || v2 === undefined) {
                    return undefined;
                }
                return (v1 & (1 << v2)) === 0;
            };
        f.toString = function() {
            return 'bitClear(' + expr.toString() + ',' + nbit.toString() + ')';
        };

        f.myName = 'bitClear';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.bitClear(expr, nbit, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * check if expr1 & mask === val & mask
     * @method testMask
     * @param {sqlFun|string} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} mask
     * @param {sqlFun|object} val
     * @return {sqlFun}
     */
    function testMask(expr1, mask, val) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2, v3;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(mask, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                v3 = calc(val, r, environment);
                if (v3 === undefined) {
                    return undefined;
                }
                if (v3 === null) {
                    return false;
                }
                return ((v1 & v2) === (v3 & v2));
            };

        f.toString = function() {
            return 'testMask(' + expr.toString() + ',' + mask.toString() + ',' + val.toString() + ')';
        };

        f.myName = 'testMask';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.testMask(expr, mask, val, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * Check if expr1 evaluates between min and max
     * @method between
     * @param {sqlFun|string|object} expr1  note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} min
     * @param {sqlFun|object}  max
     * @returns {sqlFun}
     */
    function between(expr1, min, max) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2, v3;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(min, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                v3 = calc(max, r, environment);
                if (v3 === undefined) {
                    return undefined;
                }
                if (v3 === null) {
                    return false;
                }
                return (v1 >= v2) && (v1 <= v3);
            };
        f.toString = function() {
            return  expr.toString() + ' BETWEEN ' + min.toString() + ' AND ' + max.toString() ;
        };

        f.myName = 'between';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.between(expr, min, max, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Checks if expr1 is (sql-like) mask, where mask can contain * and _ characters
     * @method like
     * @param {sqlFun|string|object} expr1  expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} mask  mask is a string or a function that evaluates into a string
     * @returns {sqlFun}
     * @example like('a','s%') compiles into (a like 's%')
     *        like(const('a'),'s%') compiles into ('a' like 's%')
     */
    function like(expr1, mask) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                let likeExpr;
                const v1 = calc(expr, r, environment),
                    v2 = calc(mask, r, environment);

                if (v1 === null || v2 === null) {
                    return null;
                }
                if (v1 === undefined || v2 === undefined) {
                    return undefined;
                }
                if (!_.isString(v1) || !_.isString(v2)) {
                    return false;
                }

                likeExpr = myRegExpEscape(v2);
                return (new RegExp(likeExpr.replace(new RegExp('%', 'g'), ".*").replace(new RegExp('_', 'g'), ".")).exec(v1) !== null);
            };
        f.toString = function() {
            return expr.toString() + ' LIKE ' + mask.toString();
        };

        f.myName = 'like';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.like(expr, mask, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Finds distinct values of a field
     * @method distinctVal
     * @param {object[]} arr
     * @param fieldname
     * @returns {object[]|undefined}
     */
    function distinctVal(arr, fieldname) {
        if (arr === undefined) {
            return undefined;
        }
        if (fieldname) {
            return _.uniq(_.map(arr, fieldname));
        }
        return _.uniq(arr);
    }

    /**
     * Finds distinct values of a list of fields
     * @method distinctVal
     * @param {Array<(sqlFun|object)>} exprList
     * @returns {sqlFun}
     */
    function distinct(exprList) {
        const f = function (arr, environment) {
            if (arr === undefined) {
                return undefined;
            }
            let someUndefined = false;
            const res = _.map(arr, function (a) {
                return _.reduce(exprList, function (accumulator, expr) {
                    const o = calc(expr, a, environment);
                    if (o === undefined) {
                        someUndefined = true;
                    }
                    accumulator.push(o);
                    return accumulator;

                }, []);
            });
            if (someUndefined) {
                return undefined;
            }
            return _.uniq(res);
        };
        f.toString = function() {
            return 'distinct(' + joinString(exprList) + ')';
        };

        f.myName = 'distinct';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.distinct(exprList, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * checks if expr1 is in the array list
     * @method isIn
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {Array.<(sqlFun|object)>} list  Array or function that evaluates into an array
     * @returns {sqlFun}
     */
    function isIn(expr1, list) {
        let a=list;
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v = calc(expr, r, environment);
                let l;
                if (v === undefined) {
                    return undefined;
                }
                if (v === null) {
                    return false;
                }

                l = calc(list, r, environment);
                if (l === undefined) {
                    return undefined;
                }
                if (l === null) {
                    return false;
                }
                return (_.indexOf(l, v) >= 0);
            };
        f.toString = function() {
            return  expr.toString()  + ' in (' + joinString(a) + ')';
        };

        f.myName = 'isIn';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.isIn(expr, a, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if expr1 is not in the array list
     * @method isNotIn
     * @param {sqlFun|string|object}expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun[]|object[]} list {Array} Array or function that evaluates into an array
     * @returns {sqlFun}
     */
    function isNotIn(expr1, list) {
        let a=list;
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v = calc(expr, r, environment);
                let l;
                if (v === undefined) {
                    return undefined;
                }
                if (v === null) {
                    return false;
                }

                l = calc(list, r, environment);
                if (l === undefined) {
                    return undefined;
                }
                if (l === null) {
                    return false;
                }
                return (_.indexOf(l, v) < 0);
            };
        f.toString = function() {
            return  expr.toString()  + ' not in (' + joinString(a) + ')';
        };

        f.myName = 'isNotIn';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.isNotIn(expr, a, environment);
        };
        return toSqlFun(f, toSql);
    }

    function toString(o) {
        if (o === undefined) {
            return 'undefined';
        }
        if (o === null) {
            return 'null';
        }
        return o.toString();
    }

    /**
     * checks if expr1 evaluates equal to expr2
     * @method eq
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function eq(expr1, expr2) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2;
                if (v1 === undefined) {
                    return undefined;
                }
                v2 = calc(expr2, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if ((v1 instanceof Date) && (v2 instanceof Date)) {
                    return v1.valueOf() === v2.valueOf();
                }
                return v1 === v2;
            };


        f.toString = function() {
            return  toString(expr) + '==' + toString(expr2) ;
            //return '(' + toString(expr) + '==' + toString(expr2) + ')';
        };

        f.myName = 'eq';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.eq(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if expr1 evaluates different from expr2
     * @method ne
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function ne(expr1, expr2) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2;
                if (v1 === undefined) {
                    return undefined;
                }
                v2 = calc(expr2, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if ((v1 instanceof Date) && (v2 instanceof Date)) {
                    return v1.valueOf() !== v2.valueOf();
                }

                return v1 !== v2;
            };
        f.toString = function() {
            return  + expr.toString() + '!=' + expr2.toString() + ')';
        };

        f.myName = 'ne';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.ne(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * checks if expr1 evaluates less than from expr2
     * @method lt
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function lt(expr1, expr2) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(expr2, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                if ((v1 instanceof Date) && (v2 instanceof Date)) {
                    return v1.valueOf() < v2.valueOf();
                }
                return v1 < v2;
            };
        f.toString = function() {
            return expr.toString() + '<' + expr2.toString() ;
        };

        f.myName = 'lt';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.lt(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if expr1 evaluates less than or equal to from expr2
     * @method le
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function le(expr1, expr2) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }

                v2 = calc(expr2, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                if ((v1 instanceof Date) && (v2 instanceof Date)) {
                    return v1.valueOf() <= v2.valueOf();
                }

                return v1 <= v2;
            };
        f.toString = function() {
            return expr.toString() + '<=' + expr2.toString() ;
        };

        f.myName = 'le';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.le(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if expr1 evaluates greater than expr2
     * @method gt
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function gt(expr1, expr2) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(expr2, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                if ((v1 instanceof Date) && (v2 instanceof Date)) {
                    return v1.valueOf() > v2.valueOf();
                }

                return v1 > v2;
            };
        f.toString = function() {
            return   expr.toString() + '>' + expr2.toString() ;
        };

        f.myName = 'gt';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.gt(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if expr1 evaluates greater than or equal to expr2
     * @method ge
     * @param  {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param  {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function ge(expr1, expr2) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                let v2;
                if (v1 === undefined) {
                    return undefined;
                }
                if (v1 === null) {
                    return false;
                }
                v2 = calc(expr2, r, environment);
                if (v2 === undefined) {
                    return undefined;
                }
                if (v2 === null) {
                    return false;
                }
                if ((v1 instanceof Date) && (v2 instanceof Date)) {
                    return v1.valueOf() >= v2.valueOf();
                }
                return v1 >= v2;
            };

        f.toString = function() {
            return toString(expr) + '<=' + toString(expr2) ;
        };

        f.myName = 'ge';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.ge(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if at least one of supplied expression evaluates to a truthy value
     * @method or
     * @param {sqlFun[]|object[]} arr  array or list of expression
     * @returns {sqlFun}
     */
    function or(arr) {
        let a = arr;
        let alwaysTrue = false;
        let f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        const optimizedArgs = _.filter(a,
            function (el) {
                if (el === undefined) {
                    return false;
                }
                if (el === null) {
                    return true;
                }

                if (el === false || el.isFalse) {
                    return false;
                }

                if (el === true || el.isTrue) {
                    alwaysTrue = true;
                }
                return true;
            });
        if (alwaysTrue) {
            return constant(true);
        }
        if (optimizedArgs.length === 0) {
            return constant(false);
        }

        f = function (r, environment) {
            let i,
                someUndefined = false,
                someNull = false;
            for (i = 0; i < optimizedArgs.length; i += 1) {
                const x = calc(optimizedArgs[i], r, environment);
                if (x === true) {
                    return true;
                }
                if (x === null) {
                    someNull = true;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            if (someNull) {
                return null;
            }
            return false;
        };
        f.toString = function () {
            return joinString(a,' OR ');
        };

        f.myName = 'or';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.joinOr(_.map(optimizedArgs, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }

    /**
     * return the first object not null in the  array parameter
     * @param {sqlFun[]|object[]} arr
     * @returns {sqlFun}
     */
    function coalesce(arr) {
        let a = arr,
            f;
        if (a.myName==="list"){
            a = a.paramList;
        }
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function(r, environment) {
            let i;
            for (i = 0; i < a.length; i += 1) {
                const x = calc(a[i], r, environment);
                if (x === undefined) {
                    return undefined;
                }
                if (x !== null) {
                    return x;
                }
            }
            return null;
        };
        f.toString = function() {
            if (a.length===2){
                return 'isnull(' + joinString(a) + ')';
            }
            return 'coalesce(' + joinString(a) + ')';
        };

        f.myName = 'coalesce';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.coalesce(_.map(a, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }


    /**
     * checks if expr1 is null or equal to expr2
     * @method isNullOrEq
     * @param  {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param  {sqlFun|object} expr2
     * @return {sqlFun}
     */
    function isNullOrEq(expr1, expr2) {
        const expr = autofield(expr1);
        return or(isNull(expr), eq(expr, expr2));
    }

    /**
     * checks if expr1 is null or greater than expr2
     * @method isNullOrGt
     * @param  {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param   {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function isNullOrGt(expr1, expr2) {
        const expr = autofield(expr1);
        return or(isNull(expr), gt(expr, expr2));
    }

    /**
     * checks if expr1 is null or greater than or equal to expr2
     * @method isNullOrGe
     * @param expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param expr2
     * @return {sqlFun}
     */
    function isNullOrGe(expr1, expr2) {
        const expr = autofield(expr1);
        return or(isNull(expr), ge(expr, expr2));
    }

    /**
     * checks if expr1 is null or less than expr2
     * @method isNullOrLt
     * @param  {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param  {sqlFun|object} expr2
     * @return {sqlFun}
     */
    function isNullOrLt(expr1, expr2) {
        const expr = autofield(expr1);
        return or(isNull(expr), lt(expr, expr2));
    }

    /**
     * checks if expr1 is null or less than or equal to expr2
     * @method isNullOrLe
     * @param {sqlFun|string|object} expr1 note: this is autofield-ed, so if you can use a field name for it
     * @param {sqlFun|object} expr2
     * @returns {sqlFun}
     */
    function isNullOrLe(expr1, expr2) {
        const expr = autofield(expr1);
        return or(isNull(expr), le(expr, expr2));
    }

    /**
     * Evaluates the maximum value of an expression in a table. If any undefined is found, return undefined.
     * Null are skipped. If all is null return null
     * @method max
     * @param {sqlFun|string|object} expr1
     * @returns {sqlFun}
     */
    function max(expr1) {
        const expr = autofield(expr1),
            f = function (arr, environment) {
                if (arr === undefined) {
                    return undefined;
                }
                let m = null;
                _.forEach(arr, function (el) {
                    const val = calc(expr, el, environment);
                    if (val === undefined) {
                        m = undefined; //if any undefined is found, return undefined
                        return false;
                    }
                    if (m === null) {
                        m = val;
                        return undefined;
                    }
                    if (val === null) {
                        return undefined;
                    }
                    if (val > m) {
                        m = val;
                    }
                    return undefined;
                });
                return m;
            };
        f.toString = function() {
            return 'max(' + expr.toString() + ')';
        };

        f.myName = 'max';
        f.myArguments = arguments;

        f.grouping = true;
        const toSql = function (formatter, environment) {
            return formatter.max(expr, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Evaluates the minimum value of an expression in a table. If any undefined is found, return undefined.
     * Null are skipped. If all is null return null
     * @method min
     * @param {sqlFun|string|object} expr1
     * @returns {sqlFun}
     */
    function min(expr1) {
        const expr = autofield(expr1),
            f = function (arr, environment) {
                if (arr === undefined) {
                    return undefined;
                }
                let m = null;
                _.forEach(arr, function (el) {
                    const val = calc(expr, el, environment);
                    if (val === undefined) {
                        m = undefined; //if any undefined is found, return undefined
                        return false;
                    }
                    if (m === null) {
                        m = val;
                        return undefined;
                    }
                    if (val === null) {
                        return undefined;
                    }
                    if (val < m) {
                        m = val;
                    }
                    return undefined;
                });
                return m;
            };
        f.toString = function() {
            return 'min(' + expr.toString() + ')';
        };

        f.myName = 'min';
        f.myArguments = arguments;

        f.grouping = true;
        const toSql = function (formatter, environment) {
            return formatter.min(expr, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * @method substring
     * @param {sqlFun|string|object} expr1
     * @param {sqlFun|object} start
     * @param {sqlFun|object} len
     * @returns {sqlFun}
     */
    function substring(expr1, start, len) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                if (r === undefined) {
                    return undefined;
                }
                const vExpr = calc(expr, r, environment);
                let vStart, vLen;
                if (vExpr === undefined) {
                    return undefined;
                }
                if (vExpr === null) {
                    return null;
                }

                vStart = calc(start, r, environment);
                if (vStart === undefined) {
                    return undefined;
                }
                if (vStart === null) {
                    return null;
                }
                vStart -= 1; //javascript substring starting index is 0, sql is 1
                vLen = calc(len, r, environment);
                if (vLen === undefined) {
                    return undefined;
                }
                if (vLen === null) {
                    return null;
                }
                if (vStart < 0) {
                    vStart = 0;
                }
                return vExpr.substr(vStart, vLen);
            };
        f.toString = function() {
            return 'substring(' + toString(expr) + ',' + toString(start) + ',' + toString(len) + ')';
        };

        f.myName = 'substring';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.substring(expr, start, len, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Converts a generic expression into an integer
     * @method convertToInt
     * @param {sqlFun|string|object} expr1
     * @returns {sqlFun}
     */
    function convertToInt(expr1) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                if (r === undefined) {
                    return undefined;
                }
                const vExpr = calc(expr, r, environment);
                if (vExpr === undefined) {
                    return undefined;
                }
                if (vExpr === null || vExpr === '') {
                    return null;
                }
                return parseInt(vExpr, 10);
            };
        f.toString = function() {
            return 'convertToInt(' + expr.toString() + ')';
        };

        f.myName = 'convertToInt';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.convertToInt(expr, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Converts a generic expression into a string
     * @method convertToString
     * @param {sqlFun|string|object} expr1
     * @param {int} maxLen maximum string len
     * @returns {sqlFun}
     */
    function convertToString(expr1, maxLen) {
        const expr = autofield(expr1),
            f = function (r, environment) {
                if (r === undefined) {
                    return undefined;
                }
                const vExpr = calc(expr, r, environment);
                if (vExpr === undefined) {
                    return undefined;
                }
                if (vExpr === null) {
                    return null;
                }
                return vExpr.toString().substr(0, maxLen);
            };
        f.toString = function() {
            return 'convertToString(' + expr.toString() + ',' + maxLen.toString() + ')';
        };

        f.myName = 'convertToString';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.convertToString(expr, maxLen, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * checks if all supplied expression evaluate to truthy values
     * @method and
     * @param {sqlFun[]|object[]} arr array or list of expression
     * @return {sqlFun}
     */
    function and(arr) {
        let a = arr;
        let alwaysFalse = false;
        let f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        const optimizedArgs = _.filter(a, function (el) {
            if (el === undefined) {
                return false;
            }
            if (el === null) {
                return false;
            }
            if (el === true || el.isTrue) {
                return false;
            }

            if (el === false || el.isFalse) {
                alwaysFalse = true;
            }
            return true;
        });

        if (alwaysFalse) {
            return constant(false);
        }

        if (optimizedArgs.length === 0) {
            return constant(true);
        }

        f = function(r, environment) {
            let i,
                someUndefined = false,
                someNull = false;
            for (i = 0; i < optimizedArgs.length; i += 1) {
                const x = calc(optimizedArgs[i], r, environment);
                if (x === false) {
                    return false;
                }
                if (x === null) {
                    someNull = true;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            if (someNull) {
                return null;
            }
            return true;
        };
        f.toString = function() {
            return joinString(a,' AND ') ;
        };

        f.myName = 'and';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.joinAnd(_.map(optimizedArgs, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };

        return toSqlFun(f, toSql);
    }


    /**
     * Compares a set of keys of an object with an array of values or with fields of another object
     *  values can be an array or an object
     * @method mcmp
     * @param {string[]|object[]} keys
     * @param {sqlFun[]|object[]|object} values
     * @param {string} [alias]
     * @return {sqlFun} f(r) = true if :
     *  case values is an array: r[keys[i]] = values[i] for each i=0..keys.length-1
     *  case values is an object: r[keys[i]] = values[keys[i]] for each i=0..keys.length-1
     */
    function mcmp(keys, values, alias) {
        if (keys.length === 0) {
            return constant(true);
        }
        const myValues = _.clone(values);
        let //stabilizes input!!
            picked;

        if (_.isArray(values)) {
            picked = values; //_.map(values, function(v) {return formatter.toSql(v, environment);});
        } else {
            picked = _.map(keys, function(k) {
                return values[k];
            });
        }

        if (_.includes(picked, null)) {
            return constant(false);
        }

        const f = function (r, environment) {
            if (r === undefined) {
                return undefined;
            }
            let i, field, value;
            for (i = 0; i < keys.length; i += 1) {
                field = keys[i];
                if (_.isArray(myValues)) {
                    value = calc(myValues[i], r, environment);
                }
                else {
                    value = myValues[field];
                }

                if (isNullOrUndefined(r[field]) || isNullOrUndefined(value)) {
                    return false;
                }
                if ((r[field] instanceof Date) && (value instanceof Date)) {
                    if (r[field].valueOf() !== value.valueOf()) {
                        return false;
                    }
                    continue;
                }

                if (r[field] !== value) {
                    return false;
                }
            }
            return true;
        };
        f.toString = function() {
            return 'mcmp(' + arrayToString(keys) + ',' + arrayToString(picked) + ')';
        };

        f.myName = 'mcmp';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            let k, v;

            //noinspection JSUnresolvedFunction
            return formatter.joinAnd(
                _.map(
                    _.zip(keys, picked),
                    function (pair) {
                        k = pair[0];
                        v = pair[1];
                        if (isNullOrUndefined(v)) {
                            return formatter.isNull(field(k, alias), environment);
                        }
                        return formatter.eq(field(k, alias), v, environment);
                    }
                )
            );
        };
        return toSqlFun(f, toSql);
    }

    /**
     * Compares a set of keys of an object with an array of values or with fields of another object
     * @method mcmpLike
     * @param {object} example
     * @param {string} [alias] eventually table alias to use in conjunction with example field names
     * @return {sqlFun} f(r) = true if  for each non empty field of r:
     *  case field is a string containing a %:  field LIKE example[field]
     *  otherwise: field = example[field]
     */
    function mcmpLike(example, alias) {
        if (example === null || example === undefined) {
            return constant(true);
        }

        const exprArr = [],
            myValues = _.clone(example);

        _.forEach(_.keys(example), function(k) {
            if (myValues[k] === undefined || myValues[k] === '' || myValues[k] === null) {
                return;
            }
            if (_.isString(myValues[k])) {
                exprArr.push(like(field(k, alias), myValues[k]));

            } else {
                exprArr.push(eq(field(k, alias), myValues[k]));
            }
        });
        return and(exprArr);
    }

    /**
     * Compares a set of keys of an object with an array of values or with fields of another object
     * @method mcmpEq
     * @param {object} example
     * @param {string} [alias]
     * @return {sqlFun} f(r) = true if  for each non empty field of r:
     *  case field is null :    field is null
     *  otherwise: r[field] = example[field]
     */
    function mcmpEq(example, alias) {
        if (example === null || example === undefined) {
            return constant(true);
        }

        const exprArr = [],
            myValues = _.clone(example);

        _.forEach(_.keys(example), function(k) {
            if (myValues[k] === undefined) {
                return;
            }
            if (myValues[k] === '' || myValues[k] === null) {
                exprArr.push(isNull(field(k, alias)));
                return;
            }
            exprArr.push(eq(field(k, alias), myValues[k]));
        });
        return and(exprArr);
    }

    /**
     * returns a functions that does a subtraction
     * @method sub
     * @param {sqlFun|string|object} expr1
     * @param {sqlFun|object} expr2
     * @return {sqlFun}
     */
    function sub(expr1, expr2) {
        const expr = autofield(expr1);
        let f;
        f = function(r, environment) {
            if (r === undefined) {
                return undefined;
            }
            const x = calc(expr, r, environment),
                y = calc(expr2, r, environment);

            if (x === null || y === null) {
                return null;
            }
            if (x === undefined || y === undefined) {
                return undefined;
            }
            return x - y;
        };
        f.toString = function() {
            return expr.toString() + '-' + expr2.toString();
        };

        f.myName = 'sub';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.sub(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * returns a functions that does a division
     * @method div
     * @param {sqlFun|string|object} expr1
     * @param {sqlFun|object} expr2
     * @return {sqlFun}
     */
    function div(expr1, expr2) {
        const expr = autofield(expr1);
        let a = [expr1,expr2],
            f;
        f = function(r, environment) {
            let i,
                prod = null,
                someUndefined = false,
                ops= [];
            for (i = 0; i < a.length; i += 1) {
                ops[i] = calc(a[i], r, environment);
                if (ops[i] === null) {
                    return null;
                }
                if (ops[i] === undefined) {
                    someUndefined = true;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return ops[0] / ops[1];
        };
        f.toString = function() {
            return + expr.toString() + '/' + expr2.toString();
        };

        f.myName = 'div';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.div(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * returns a functions that evaluates the sum of a list or array of values given when it is CREATED
     * @param {sqlFun[]|object[]} values
     * @return {sqlFun}
     */
    function add(values) {
        let a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function(r, environment) {
            let i,
                sum = null,
                someUndefined = false;
            for (i = 0; i < a.length; i += 1) {
                const x = calc(a[i], r, environment);
                if (x === null) {
                    return null;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
                if (sum === null) {
                    sum = x;
                } else {
                    sum += x;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return sum;
        };
        f.toString = function() {
            return  joinString(a,'+') ;
        };

        f.myName = 'add';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.add(a, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * returns a functions that evaluates the concatenation of a list or array of strings given when it is CREATED
     * @method concat
     * @param {sqlFun[]|object[]} values
     * @return {sqlFun}
     */
    function concat(values) {
        let a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function(r, environment) {
            let i,
                seq = null;
            for (i = 0; i < a.length; i += 1) {
                const x = calc(a[i], r, environment);
                if (x === undefined) {
                    return undefined;
                }
                if (seq === null) {
                    seq = x;
                } else {
                    if (x !== null) {
                        seq += x;
                    }
                }
            }
            return seq;
        };
        f.toString = function() {
            return 'concat(' + joinString(values) + ')';
        };

        f.myName = 'concat';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.concat(a, environment);
        };
        return toSqlFun(f, toSql);
    }


    /**
     * Evaluates the sum of an array of element given at run time
     * @method sum
     * @param {sqlFun|string|object} expr1
     * @returns {sqlFun}
     */
    function sum(expr1) {
        const expr = autofield(expr1),
            f = function (values, environment) {
                if (values === undefined) {
                    return undefined;
                }
                if (values === null) {
                    return null;
                }
                let a = values;
                if (!_.isArray(a)) {
                    a = [].slice.call(arguments);
                }

                let i,
                    sum = null;
                for (i = 0; i < a.length; i += 1) {
                    const x = calc(expr, a[i], environment);
                    if (x === undefined) {
                        return undefined;
                    }
                    if (sum === null) {
                        sum = x;
                    }
                    else {
                        if (x !== null) {
                            sum += x;
                        }
                    }
                }
                return sum;
            };
        f.toString = function() {
            return 'sum(' + expr.toString() + ')';
        };

        f.myName = 'sum';
        f.myArguments = arguments;

        f.grouping = true;
        const toSql = function (formatter, environment) {
            return formatter.sum(expr, environment);
        };

        return toSqlFun(f, toSql);
    }


    /**
     * returns a functions that evaluates the multiply of a list or array of values
     * If some operand is 0, returns the always 0 function
     * @method mul
     * @param {sqlFun[]|object[]} values
     * @return {sqlFun}
     */
    function mul(values) {
        let a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        f = function(r, environment) {
            let i,
                prod = null,
                someUndefined = false;
            for (i = 0; i < a.length; i += 1) {
                const x = calc(a[i], r, environment);
                if (x === null) {
                    return null;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
                if (prod === null) {
                    prod = x;
                } else {
                    prod *= x;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return prod;
        };

        f.toString = function() {
            return  joinString(values,'*') ;
        };

        f.myName = 'mul';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.mul(_.map(a, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }

    function joinString(arr,separator) {
        separator = separator||',';
        return _.map(arr, function (value) {
            return toString(value);
        }).join(separator) ;
    }

    function arrayToString(arr,separator) {
        separator = separator||',';
        return '[' + _.map(arr, function(value) {
            return toString(value);
        }).join(separator) + ']';
    }

    /**
     * Converts a sqlFun to an plain object.
     * @param {sqlFun|sqlFun[]|object|object[]} obj
     * @returns {object}
     */
    function toObject(obj) {
        if (_.isFunction(obj)) {
            const name = obj.myName;
            const args = _.map(obj.myArguments, function (arg) {
                return toObject(arg);
            });

            return { name: name, args: args, alias:obj.alias };
        }

        if (_.isArray(obj)) {
            const arr = _.map(obj, function (item) {
                return toObject(item);
            });
            return { array: arr };
        }

        return { value: obj };
    }

    /**
     * Converts an object back to a sqlFun
     * @param {object} obj
     * @returns {sqlFun|sqlFun[]|object|object[]}
     */
    function fromObject(obj) {
        if (!_.isObject(obj)) {
            throw "Must be an object";
        }

        if (obj.hasOwnProperty('value')) {
            return obj.value;
        }

        if (obj.hasOwnProperty('array')) {
            return _.map(obj.array, function(item) {
                return fromObject(item);
            });
        }

        if (obj.hasOwnProperty('name') && obj.hasOwnProperty('args')) {
            const name = obj.name;
            const args = _.map(obj.args, function (arg) {
                return fromObject(arg);
            });

            const f = q[name];
            const result = f.apply(this, args);
            result.alias = obj.alias;
            return result;
        }

        return null;
    }

    /**
     * returns an array list from the parameters if all the parameters are legal.
     * Oterwise it returns undefined or null.
     * @method list
     * @param {sqlFun[]|object[]} values
     * @return {sqlFun}
     */
    function list(values) {
        let a = values,
            f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }


        f = function(r, environment) {
            const outputList = [];
            let someNull = false,
                i;

            for (i = 0; i < a.length; i += 1) {
                const x = calc(a[i], r, environment);

                if (x === undefined) {
                    return undefined;
                }
                if (x === null) {
                    someNull = true;
                }
                outputList.push(x);
            }
            if (someNull) {
                return null;
            }
            return outputList;
        };

        f.toString = function() {
            return '(' + joinString(values) + ')';
        };
        f.paramList = a;
        f.myName = 'list';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.list(_.map(a, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }

    /**
     * @method bitwiseNot
     * @param {sqlFun|string|object|function}  expression note: this is auto-field, so if you can use a field name for it
     * @return {sqlFun}
     */
    function bitwiseNot(expression) {
        const expr = autofield(expression),
            f = function (r, environment) {
                const v1 = calc(expr, r, environment);
                if (isNullOrUndefined(v1)) {
                    return v1;
                }
                if (!!v1 === v1) { //checks if (typeof n === 'boolean')
                    return !v1;
                }
                return ~v1;
            };
        f.toString = function() {
            return '~(' + expr.toString() + ')';
        };

        f.myName = 'bitwiseNot';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.bitwiseNot(expr, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * @method bitwiseAnd
     * @param {sqlFun[]|object[]} arr array or list of expression
     * @return {sqlFun}
     */
    function bitwiseAnd(arr) {
        let a = arr,
            f;

        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }

        const optimizedArgs = _.filter(a, function (el) {
            if (el === undefined) {
                return false;
            }
            return el !== null;

        });

        if (optimizedArgs.length === 0) {
            return constant(null);
        }

        f = function(r, environment) {
            let result = null,
                someUndefined = false,
                i;

            for (i = 0; i < optimizedArgs.length; i += 1) {
                const x = calc(optimizedArgs[i], r, environment);
                if (x === null) {
                    return null;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
                if (result === null) {
                    result = x;
                } else {
                    result = result & x;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return result;
        };

        f.toString = function() {
            return '(' + joinString(a,'&') + ')';
        };

        f.myName = 'bitwiseAnd';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.bitwiseAnd(_.map(optimizedArgs, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }

    /**
     * @method bitwiseOr
     * @param {sqlFun[]|object[]} arr array or list of expression
     * @return {sqlFun}
     */
    function bitwiseOr(arr) {
        let a = arr,
            f;

        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }

        const optimizedArgs = _.filter(a, function (el) {
            if (el === undefined) {
                return false;
            }
            return el !== null;

        });

        if (optimizedArgs.length === 0) {
            return constant(null);
        }

        f = function(r, environment) {
            let result = null,
                someUndefined = false,
                i;

            for (i = 0; i < optimizedArgs.length; i += 1) {
                const x = calc(optimizedArgs[i], r, environment);
                if (x === null) {
                    return null;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
                if (result === null) {
                    result = x;
                } else {
                    result = result | x;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return result;
        };

        f.toString = function() {
            return  joinString(a,'|');
        };

        f.myName = 'bitwiseOr';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.bitwiseOr(_.map(optimizedArgs, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }

    /**
     * @method bitwiseXor
     * @param {sqlFun[]|object[]} arr array or list of expression
     * @return {sqlFun}
     */
    function bitwiseXor(arr) {
        let a = arr,
            f;

        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }

        const optimizedArgs = _.filter(a, function (el) {
            if (el === undefined) {
                return false;
            }
            return el !== null;

        });

        if (optimizedArgs.length === 0) {
            return constant(null);
        }

        f = function(r, environment) {
            let result = null,
                someUndefined = false,
                i;

            for (i = 0; i < optimizedArgs.length; i += 1) {
                const x = calc(optimizedArgs[i], r, environment);
                if (x === null) {
                    return null;
                }
                if (x === undefined) {
                    someUndefined = true;
                }
                if (result === null) {
                    result = x;
                } else {
                    result = result ^ x;
                }
            }
            if (someUndefined) {
                return undefined;
            }
            return result;
        };

        f.toString = function() {
            return joinString(a,'^');
        };

        f.myName = 'bitwiseXor';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.bitwiseXor(_.map(optimizedArgs, function (v) {
                //noinspection JSUnresolvedFunction
                return formatter.toSql(v, environment);
            }));
        };
        return toSqlFun(f, toSql);
    }


    /**
     * returns a functions that does the modulus
     * @method modulus
     * @param {sqlFun|string|object} expr1
     * @param {sqlFun|object} expr2
     * @return {sqlFun}
     */
    function modulus(expr1, expr2) {
        const expr = autofield(expr1);
        let f;
        f = function(r, environment) {
            if (r === undefined) {
                return undefined;
            }
            const x = calc(expr, r, environment),
                y = calc(expr2, r, environment);

            if (x === null || y === null) {
                return null;
            }
            if (x === undefined || y === undefined) {
                return undefined;
            }
            return x % y;
        };
        f.toString = function() {
            return 'modulus(' + expr.toString() + ',' + expr2.toString() + ')';
        };

        f.myName = 'modulus';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            //noinspection JSUnresolvedFunction
            return formatter.modulus(expr, expr2, environment);
        };
        return toSqlFun(f, toSql);
    }

    /**
     * returns the result of internal expression
     * @method doPar
     * @param {sqlFun|string|object} expr
     * @return {sqlFun}
     */
    function doPar(expr) {
        let a = expr;
        let alwaysFalse = false;
        let f;
        if (!_.isArray(a)) {
            a = [].slice.call(arguments);
        }
        const optimizedArgs = _.filter(a, function (el) {
            if (el === undefined) {
                return false;
            }
            if (el === null) {
                return false;
            }
            if (el === true || el.isTrue) {
                return false;
            }
            if (el === false || el.isFalse) {
                alwaysFalse = true;
            }
            return true;
        });

        if (alwaysFalse) {
            return constant(false);
        }

        if (optimizedArgs.length === 0) {
            return constant(true);
        }

        f = function(r, environment) {
            return calc(optimizedArgs[0], r, environment);
        };
        f.toString = function(){
            return '(' + joinString(a,'+') + ')';
        }

        f.myName = 'doPar';
        f.myArguments = arguments;

        const toSql = function (formatter, environment) {
            return formatter.doPar(a, environment);
        };
        return toSqlFun(f, toSql);
    }

    function jsDataQuery(){

    }

    jsDataQuery.prototype = {
        constructor: jsDataQuery,
        context: context,
        calc: calc,
        add: add,
        concat: concat,
        sub: sub,
        div: div,
        minus: minus,
        mul: mul,
        mcmp: mcmp,
        mcmpLike: mcmpLike,
        mcmpEq: mcmpEq,
        isNull: isNull,
        isNotNull: isNotNull,
        constant: constant,
        and: and,
        or: or,
        field: field,
        eq: eq,
        ne: ne,
        gt: gt,
        ge: ge,
        lt: lt,
        le: le,
        not: not,
        isNullOrEq: isNullOrEq,
        isNullOrGt: isNullOrGt,
        isNullOrGe: isNullOrGe,
        isNullOrLt: isNullOrLt,
        isNullOrLe: isNullOrLe,
        bitClear: bitClear,
        bitSet: bitSet,
        isIn: isIn,
        isNotIn: isNotIn,
        distinctVal: distinctVal,
        distinct: distinct,
        like: like,
        between: between,
        testMask: testMask,
        max: max,
        min: min,
        substring: substring,
        convertToInt: convertToInt,
        convertToString: convertToString,
        sum: sum,
        coalesce: coalesce,
        toObject: toObject,
        fromObject: fromObject,
        list : list,
        bitwiseNot: bitwiseNot,
        bitwiseAnd : bitwiseAnd,
        bitwiseOr: bitwiseOr,
        bitwiseXor : bitwiseXor,
        modulus : modulus,
        doPar:doPar,
        myLoDash: _ //for testing purposes
    };

    let q = new jsDataQuery();

    if (freeExports && freeModule) {
        // Export for Node.js or RingoJS.
        if (moduleExports) {
            (freeModule.exports = q).jsDataQuery = q;
        }
        // Export for Narwhal or Rhino -require.
        else {
            freeExports.jsDataQuery = q;
        }
    } else {
        // Export for a browser or Rhino.
        root.jsDataQuery = q;
    }
}).call(this,
    (typeof _ === 'undefined') ? require('lodash') : _
);
