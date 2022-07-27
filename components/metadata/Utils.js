/**
 * @module Utils
 * @description
 * Collection of utility functions
 */
(function () {
    var Deferred = appMeta.Deferred;
    var utils = {};

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
     * @returns {Deferred}
     */
    utils.callOptAsync = function (fn) {
        var res = Deferred("utils.callOptAsync");
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
            window.setTimeout(function () {
                    try {
                        var result = fn();
                        if (result === null || result === undefined) {
                            res.resolve(result);
                            return;
                        }
                        //check if value is a deferred
                        if ($.isFunction(result.then)) {
                            result.then(function (innerResult) {
                                res.resolve(innerResult); //fullfill the result with the deferred result
                            }, function (error) {
                                res.reject(error);
                            });
                            return;
                        }
                        res.resolve(result);
                    } catch (err) {
                        if (err) console.log(err.message, err.stack);
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
     * @param {Deferred} func
     * @param {object} defaultValue
     * @returns {Deferred}
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
     * @returns {Deferred}
     */
    utils.skipRun = function(func) {
        return function(x) {
            var res = func(x);
            if (res.then) {
                return res.then(utils.fConst(x));
            }
            return $.Deferred().resolve(x).promise();
        }
    };

    /**
     * @function optBind
     * @public
     * @description SYNC
     * Returns function "fun" binded to "obj" or null if fun is null. Arguments can be provided
     * @param {function} fun  function to bind
     * @param {object} obj   object to use as "this"
     * @param {object} args  optional arguments
     * @returns {function}
     */
    utils.optBind = function(fun, obj, args) {
        if (!fun) return function() {};
        var rest = Array.prototype.slice.call(arguments, 1);
        if (rest.length > 1) return fun.bind.apply(fun, rest);
        return fun.bind(obj);
    };

    /**
     * @function asinc
     * @public
     * @description SYNC
     * @param {function} fun
     */
    utils.asinc = function(fun) {
        return function() {
            return utils.callOptAsync(fun);
        }
    };

    /**
     * @function fConst
     * @public
     * @description SYNC
     * Returns a constant function
     * @param {type} k
     */
    utils.fConst = function(k) {
        return function() { return k };
    };

    /**
     * @function  sequence
     * @public
     * @description SYNC
     * This works like a $.When with optional async functions
     * @param {} thisObject
     * @param {} funArgs
     * @returns {}
     */
    utils.sequence = function (thisObject, funArgs) {
        return $.when(_.map(arguments,
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
     * @returns {IfThenElse}
     */
    utils._if  = function(condition) {
        var self = this;
        function IfThenElse() {
            var _thenClause, _elseClause;
            this._then = function(then_clause) {
                this._thenClause = then_clause;
                return this;
            };
            this._else = function(else_clause) {
                this._elseClause = else_clause;
                return this.run();
            };
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
            }
        }

        return new IfThenElse();
    };

    /**
     * @function thenSequence
     * @public
     * @description ASYNC
     * Builds a chained function, chaining each the Deferred function with "then"
     * @param {Function []} allDeferred.It is an array of function that must be return a deferred
     * @returns {Deferred}
     */
    utils.thenSequence = function(allDeferred) {
        // inizializzo primo elemento della catena di then
        var f = $.Deferred().resolve(true).promise();

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
     * Returns the array of fields, where field is not null, or not undefined
     * @param {[]} arr
     * @param {string} field
     * @returns {array|[]}
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
     * @returns {Deferred}
     */
    utils.asDeferred = function(expression) {

        if (expression && $.isFunction(expression.then)) {
            return expression;
        }
        if ($.isFunction(expression)) {
            return new $.Deferred().resolve(expression).promise();
        }
        return new $.Deferred().resolve(expression).promise();
    };
    
    /**
     * @method getUnivoqueId
     * @private
     * @description SYNC
     * Returns a progressive number. This number will be attached eventually to the id of the modal, to assure that each control is univoque.
     * @returns {number}
     */
    utils.getUnivoqueId = function () {
        appMeta.UnivoqueId = (appMeta.UnivoqueId === undefined) ? 0 : appMeta.UnivoqueId;
        var univoqueId = appMeta.UnivoqueId;
        appMeta.UnivoqueId++;
        return univoqueId;
    };

    /**
     * @method isBrowserIE
     * @private
     * @description SYNC
     * Returns true if the browser is InternetExplorer
     * @returns {boolean}
     */
     utils.isBrowserIE = function () {
            try {
                var ua = window.navigator.userAgent;
                var msie = ua.indexOf("MSIE ");
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
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    };


    appMeta.utils = utils;
}());

