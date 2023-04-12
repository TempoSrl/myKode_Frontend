/*globals ObjectRow,DataRelation,define,self,jsDataSet,jsDataQuery,metaModel,appMeta,_ */


/**
 * @module Utils
 * @description
 * Collection of utility functions
 */
(function (Deferred, OriginaDeferred, when) {


    /** Detect free variable `global` from Node.js. */
    let freeGlobal = typeof global === 'object' && global && global.Object === Object && global;
    /** Detect free variable `self`. */
    let freeSelf = typeof self === 'object' && self && self.Object === Object && self;
    /** Used as a reference to the global object. */
    let root = freeGlobal || freeSelf || Function('return this')();
    /** Detect free variable `exports`. */
    let freeExports = typeof exports === 'object' && exports && !exports.nodeType && exports;
    /** Detect free variable `module`. */
    let freeModule = freeExports && typeof module === 'object' && module && !module.nodeType && module;
    //noinspection JSUnresolvedVariable
    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
    let moduleExports = freeModule && freeModule.exports === freeExports;

    let utils = {};

    /**
     * @function callOptAsync
     * @public
     * @description ASYNC
     * Calls a function fn that may have a callback parameter and returns a deferred value that will receive the result of fn
     * If fn has the parameter it is considered a callback that will receive the optional result as first parameter
     * If fn has no parameter it is considered a sincronous function its result is used  to fullfill the deferred.
     * If fn returns a deferred, its inner result is used to fullfill the result
     * The averall result is always a deferred value
     * @param {function} fn
     * @returns {Promise}
     */
    utils.callOptAsync = function (fn) {
        let res = Deferred("utils.callOptAsync");
        if (fn.length > 0) {
            //fn has a parameter, it is considered a callback
            try {
                fn(function(resValue) {
                    res.resolve(resValue);
                });
            } catch (err) {
                return res.reject(err);
            }
        } else {
            setTimeout(function () {
                    try {
                        let result = fn();
                        if (result === null || result === undefined) {
                            res.resolve(result);
                            return;
                        }
                        //check if value is a deferred
                        if (typeof result.then === "function") {
                            result.then(function (innerResult) {
                                res.resolve(innerResult); //fullfill the result with the deferred result
                            }, function (error) {
                                res.reject(error);
                            });
                            return;
                        }
                        res.resolve(result);
                    } catch (err) {
                        //if (err) console.log(err.message, err.stack);
                        res.reject(err);
                    }
                },
                0);
        }
        return res.promise();

    };

    /**
     * @function optionalDeferred
     * @public
     * @description ASYNC
     * Optionally executes a Deferred function, otherwise returns a deferred resolved with defaultValue
     * @param {boolean} condition
     * @param {function} func
     * @param {object} defaultValue
     * @returns {Promise}
     */
    utils.optionalDeferred = function(condition, func, defaultValue) {
        if (!condition) return Deferred("utils.optionalDeferred").resolve(defaultValue).promise();
        return func();
    };

    /**
     * @function skipRun
     * @public
     * @description ASYNC
     * returns deferred function that accepts a parameter
     * @param {function} func
     * @returns {Promise}
     */
    utils.skipRun = function(func) {
        return function(result) {
            let res = func(result);
            if (res.then) {
                return res.then(utils.fConst(result));
            }
            return OriginaDeferred().resolve(result).promise();
        };
    };

    /**
     * @function optBind
     * @public
     * @description SYNC
     * Returns function "fun" binded to "obj" or null if fun is null. Arguments can be provided
     * @param {function} fun  function to bind
     * @param {object} obj   object to use as "this"
     * @param {object} [args]  optional arguments
     * @returns {function}
     */
    utils.optBind = function(fun, obj, args) {
        if (!fun) return function() {};
        let rest = Array.prototype.slice.call(arguments, 1);
        if (rest.length > 1) {
            return fun.bind.apply(fun, rest);
        }
        return fun.bind(obj);
    };



    /**
     * @function fConst
     * @public
     * @description SYNC
     * Returns a constant function
     * @param {type} k
     */
    utils.fConst = function(k) {
        return function() { return k; };
    };

    /**
     * @function  sequence
     * @public
     * @description SYNC
     * This works like a $.When with optional async functions
     * @param {object} thisObject
     * @param {object[]} funArgs
     * @returns {function}
     */
    utils.sequence = function (thisObject, funArgs) {
        return when(_.map(arguments,
            function (f, index) {
                if (index === 0) return true;
                return utils.callOptAsync(f);
            }));
    };

    /**
     * @function _if
     * @public
     * @description ASYNC
     * Builds an object chainable with these methods: .then().else().run() and eventually you can call .then() after run()
     * @param {boolean} condition
     * @returns {IfThenElse} {_if: function, _then:function, _else:function,run:function  }
     */
    utils._if  = function(condition) {
        let self = this;

        /**
         * Utility class to chain an if - then - else construct
         * @class IfThenElse
         * @constructor
         */
        function IfThenElse() {
            /**
             * @function _then
             * @param {function} then_clause
             * @return {IfThenElse}
             * @public
             */
            this._then = function(then_clause) {
                this._thenClause = then_clause;
                return this;
            };

            /**
             * @function _else
             * @param {function} else_clause
             * @return {Deferred}
             * @public
             */
            this._else = function(else_clause) {
                this._elseClause = else_clause;
                return this.run();
            };

            /**
             * @function run
             * @return {Deferred}
             */
            this.run = function() {
                if (condition) {
                    return self.asDeferred(this._thenClause());
                } else {
                    if (this._elseClause) {
                        return self.asDeferred(this._elseClause());
                    }
                }
                return self.asDeferred(undefined);
            };

            this.done = function(f) {
                return this.run().done(f);
            };

            this.then = function(doneFilter,failFilter,progressFilter) {
                return this.run().then(doneFilter,failFilter,progressFilter);
            };
        }

        return new IfThenElse();
    };

    /**
     * @function thenSequence
     * @public
     * @description ASYNC
     * Builds a chained function, chaining each the Deferred function with "then"
     * @param {Function[]} allDeferred.It is an array of function that must be return a deferred
     * @returns {Deferred}
     */
    utils.thenSequence = function(allDeferred) {
        // inizializzo primo elemento della catena di then
        let f = OriginaDeferred().resolve(true).promise();

        // concateno con then ogni deferred dell'array di input
        _.forEach(
            allDeferred,
            function(def) {
                f = f.then(def);
            });

        return f;
    };

    /**
     * @function filterArrayOnField
     * @public
     * @description SYNC
     * Returns the array of field value, taken from an object array, where field is not null or undefined
     * @param {object[]} arr
     * @param {string} field
     * @returns {object[]}
     */
    utils.filterArrayOnField = function(arr, field){
        return _.map(
            _.filter(arr, function(o) {
                return o[field];
            }), function (o) {
                return o[field];
            });
    };


    /**
     * @function asDeferred
     * @public
     * @description ASYNC
     * Evaluates the expression. if it is a deferred function then returns it, otherwise returns a Deferred
     * @param {Function} expression
     * @returns {Promise}
     */
    utils.asDeferred = function(expression) {

        if (expression && typeof expression.then === "function") {
            return expression;
        }
        if (typeof expression === "function") {
            return new OriginaDeferred().resolve(expression).promise();
        }
        return new OriginaDeferred().resolve(expression).promise();
    };

    let uniqueId=0;

    /**
     * @method getUnivoqueId
     * @private
     * @description SYNC
     * Returns a progressive number. This number will be attached eventually to the id of the modal, to assure that each control is univoque.
     * @returns {number}
     */
    utils.getUniqueId = function () {
        uniqueId++;
        return uniqueId;
    };



    /**
     * @method isBrowserIE, this can only be invoked by frontend
     * @private
     * @description SYNC
     * Returns true if the browser is InternetExplorer
     * @returns {boolean}
     */
    utils.isBrowserIE = function () {
        try {
            if (typeof window === "undefined") {
                return  false;
            }
            let ua = window.navigator.userAgent;
            let msie = ua.indexOf("MSIE ");
            if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) return true;
            return false;
        } catch (e){
            return false;
        }
    };

    /**
     * Returns true if "str" is a valid url
     * @param {string} str
     * @returns {boolean}
     */
    utils.validURL = function(str) {
        let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    };

// Some AMD build optimizers like r.js check for condition patterns like the following:
    //noinspection JSUnresolvedVariable
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        // Export for a browser or Rhino.
        if (root.appMeta) {
            root.appMeta.utils = utils;
        }
        else {
            // Expose lodash to the global object when an AMD loader is present to avoid
            // errors in cases where lodash is loaded by a script tag and not intended
            // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
            // more details.
            root.utils = utils;

            // Define as an anonymous module so, through path mapping, it can be
            // referenced as the "underscore" module.
            //noinspection JSUnresolvedFunction
            define(function () {
                return utils;
            });
        }
    }
    // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
    else if (freeExports && freeModule) {
        if (moduleExports) { // Export for Node.js or RingoJS.
            (freeModule.exports = utils).utils = utils;
        }
        else { // Export for Narwhal or Rhino -require.
            freeExports.utils = utils;
        }
    }
    else {
        // Export for a browser or Rhino.
        if (root.appMeta){
            root.appMeta.utils = utils;
        }
        else {
            root.utils=utils;
        }

    }

}(  (typeof appMeta === 'undefined') ? require('./EventManager').Deferred : appMeta.Deferred,
    (typeof $ === 'undefined') ? require('JQDeferred') : $.Deferred,
    (typeof $ === 'undefined') ? require('JQDeferred').when : $.when
));

