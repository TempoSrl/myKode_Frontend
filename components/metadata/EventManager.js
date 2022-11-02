/*globals ObjectRow,DataRelation,define,self,jsDataSet,jsDataQuery,metaModel,appMeta,_ */

/**
 * @module EventManger
 * @description
 * Manages the events communication
 */
(function(logtypeEnum, logger, _, Deferred,when) {

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

    /**
     * List of the event type managed by the framework
     * @type {{ROW_SELECT: string, showModalWindow: string, closeModalWindow: string, listCreated: string, listManagerHideControl: string, insertClick: string, deleteClick: string, editClick: string, unlinkClick: string, textBoxGotFocus: string, toolbarButtonClick: string, mainToolBarLoaded: string, startClearMainRowEvent: string, stopClearMainRowEvent: string, startMainRowSelectionEvent: string, stopMainRowSelectionEvent: string, startRowSelectionEvent: string, stopRowSelectionEvent: string}}
     */
    let eventEnum = {
        ERROR_SERVER: "ERROR_SERVER",
        ROW_SELECT: "RowSelect",
        showModalWindow:"showModalWindow",
        closeModalWindow: "closeModalWindow",
        listCreated : "listCreated",
        listManagerHideControl: "listManagerHideControl",
        insertClick : "insertClick",
        deleteClick : "deleteClick",
        editClick : "editClick",
        unlinkClick : "unlinkClick",
        textBoxGotFocus : "textBoxGotFocus",
        toolbarButtonClick : "toolbarButtonClick",
        mainToolBarLoaded : "mainToolBarLoaded",
        startClearMainRowEvent : "startClearMainRowEvent",
        stopClearMainRowEvent : "stopClearMainRowEvent",
        startMainRowSelectionEvent : "startMainRowSelectionEvent",
        stopMainRowSelectionEvent : "stopMainRowSelectionEvent",  // takes (DataRow, method name)
        startRowSelectionEvent: "startRowSelectionEvent",
        stopRowSelectionEvent: "stopRowSelectionEvent",
        showPage: "showPage",
        commandEnd : "commandEnd",
        buttonClickEnd : "buttonClickEnd",
        expiredCredential: "expiredCredential",
        afterRowSelect: "afterRowSelect",
        afterComboChanged : "afterComboChanged",
        saveDataStart : "saveDataStart",
        saveDataStop : "saveDataStop",
        SSORegistration: "SSORegistration"
    };


    /**
     * @constructor Delegate
     * @description
     * Handler for calling methods of objects
     * @param {function} callBack
     * @param {object} context
     */
    function Delegate(callBack, context) {
        this.callBack = callBack;
        this.context = context;
    }

    Delegate.prototype = {

        constructor: Delegate,

        /**
         * @method invoke
         * @public
         * @description
         * Calls the function "callBack" with "this" the context and as parameters the sender plus other args
         * @param {object} sender specifies the origin of the event
         * @param {*} [args] optional parameters
         */
        invoke: function (sender, args) {
            //console.log("invoke",args);
            return this.callBack.apply(this.context, _.union([sender], args || []));
        }
    };

    /**
     * @constructor Event
     * @description
     * Manages a set of delegates
     */
    function Event(eventName) {
        /**
         * @type Delegate[]
         */
        this.eventName = eventName;
        this.subscribers = [];
    }

    Event.prototype = {
        constructor: Event,

        /**
         * @method register
         * @public
         * @description SYNC
         * Adds a listener to the event. Id adds ea new Delegate object to the subscribers collection
         * @param {function} callBack
         * @param {object} context
         */
        register: function(callBack, context) {
            this.subscribers.push(new Delegate(callBack, context));
        },

        /**
         * @method register
         * @public
         * @description SYNC
         * Removes a listener to the event
         * @param {type} callBack
         * @param {type} context
         */
        unregister: function (callBack, context) {
            _.remove(this.subscribers,
                function(c) {
                    return c.callBack === callBack && c.context === context;
                });
        },

        /**
         * @method trigger
         * @public
         * @description ASYNC
         * Invokes all delegates linked to the event
         * @param {object} sender
         * @param {object[]} [args]
         */
        trigger: function (sender, args) {
            if (this.subscribers.length === 0) return Deferred().resolve(true);

            let chain = when();

            _.forEach(_.clone(this.subscribers), function (sub) {
                chain  = chain.then(function () {
                    return  sub.invoke(sender, args);
                });
            });

            return chain;
        }
    };

    /**
     * @constructor EventManager
     * @description
     * Creates a new instance of an EventManager. Adds or removes event form the event collection
     */
    function EventManager() {

        /* {{Event}} */
        this.events = {};
    }

    EventManager.prototype = {
        constructor: EventManager,

        /**
         * @method subscribe
         * @public
         * @description SYNC
         * Attaches a listener "callback" to an event
         * @param {String} eventType
         * @param {Function} callback
         * @param {Object} context this of the subscriber
         */
        subscribe: function(eventType, callback, context) {
            if (!this.events[eventType]) {
                this.events[eventType] = new Event(eventType);
            }
            this.events[eventType].register(callback, context);
        },

        /**
         * @method subscribe
         * @public
         * @description SYNC
         * Detaches a listener "callback" from an event
         * @param {object} typeEvent
         * @param {function} callback
         * @param {object} context
         */
        unsubscribe: function(typeEvent, callback, context) {
            if (this.events[typeEvent]) {
                this.events[typeEvent].unregister(callback, context);
            }
        },

        /**
         * @method trigger
         * @public
         * @description SYNC
         * Invokes all listener's delegates, this is ASYNC
         * @param {string} type
         * @param {object} sender
         * @paran {object} params
         */
        trigger: function(type, sender) {
            // recupera la lista dei sottoscrittori a questo evento type
            let event = this.events[type];
            if (!event) return Deferred().resolve(true);
            //console.log("trigger arguments sliced:", Array.prototype.slice.call(arguments,2));
            return event.trigger(sender, Array.prototype.slice.call(arguments, 2));
        }

    };

    /**
     * Class that helps waiting for events stabilization after some action, especially used in tests
     * @constructor Stabilizer
     */
    function Stabilizer() {
        this.nesting = 0;
        this.currentDeferred = new Deferred();
        this.isPaused = false;
        this.pauseDeferred = new Deferred().resolve(true);
        this.enabled = true;
        this.evManager = new EventManager();
    }

    Stabilizer.prototype = {
        constructor: Stabilizer,
        /**
         * Detect if d is a Deferred (duck typing)
         * @param {object} d
         * @return {boolean}
         */
        isDeferred: function(d) {
            return d && d.then !== undefined && d.fail !== undefined;
        },

        /**
         * Returns a value and resolves it or fails with it when events are not paused
         * When event is fired, nesting is decreased
         * @param {object} result
         * @returns {Deferred}
         */
        waitRunning: function(result) {
            //console.log("waitRunning called  ");
            if (result && result.__createdByStabilizerWaitRunning) {
                //console.log("not waiting and returning",result);
                return result;
            }
            let res = Deferred();
            this.pauseDeferred.done(function() {
                result.then(function(r) {
                        //console.log("resolve with ", result);
                        res.resolve(r);
                    },
                    function(err) {
                        //console.log("failing with ", result);
                        res.fail(err);
                    });
            });

            res.__createdByStabilizer = true;
            res.__createdByStabilizerWaitRunning = true;
            //console.log("waitRunning returns ", res);
            return res;
        },

        /**
         * Links result of sourceDeferred to targetDeferred so that when source is fired, target follows
         * @param {Deferred} targetDeferred
         * @param {Deferred} sourceDeferred
         * @param {string} eventName
         * @return {Deferred} targetDeferred
         */
        takeFrom: function(targetDeferred, sourceDeferred, eventName) {
            targetDeferred.__eventName = eventName;
            sourceDeferred
                .then(function(data) {
                        //console.log("waited and now:", data);
                        targetDeferred.resolve(data);
                    },
                    function(failResult) {
                        //console.log("at the end fail!");
                        targetDeferred.reject(failResult, true);
                    });
            return targetDeferred;
        },

        /**
         * Creates an encapsulated in order to track the number of open promises
         * @param {string} [eventName]
         * @returns {Deferred}
         */
        encapsulate: function(eventName) {
            const that = this;
            //if (inputDeferred && inputDeferred.__createdByStabilizer) return inputDeferred;
            this.increaseNesting(eventName);

            //we are creating the actual Deferred here
            const outputDeferred = Deferred();

            outputDeferred.__eventName = eventName;
            outputDeferred.from = _.bind(this.takeFrom, this, outputDeferred);

            // called when the Deferred is resolved or rejected.
            outputDeferred
                .always(function() {
                    that.decreaseNesting(eventName);
                });

            outputDeferred.__createdByStabilizer = true;
            //console.log("encapsulate returns ",myDeferred);
            return outputDeferred;
        },

        /**
         * Creates a monitored deferred or encapsulate the input deferred into a monitored one
         * @param {string} [eventName]
         * @returns {Deferred}
         */
        Deferred: function(eventName) {
            if (!this.enabled) {
                return Deferred(); //quello esterno
            }
            return this.encapsulate(eventName); //who owns the handle will pilote the promise

        },

        /**
         * Creates a resolved Deferred
         * @param {object} object
         * @param {string} eventName
         * @returns {type}
         */
        ResolvedDeferred: function(object, eventName) {
            return this.Deferred(eventName).resolve(object);
        },

        /**
         * Increase number of open Deferred
         * @method increaseNesting
         * @public
         * @param {string} [eventName]
         **/
        increaseNesting: function(eventName) {
            this.nesting++;
            logger.log(logtypeEnum.INFO, "increasing nesting", eventName, this.nesting);
            this.evManager.trigger("increase", this, eventName);
        },

        /**
         * Decrease number of open Deferred
         * @method decreaseNesting
         * @public
         * @param {string} [eventName]
         */
        decreaseNesting: function(eventName) {
            this.nesting--;
            logger.log(logtypeEnum.INFO, "decreaseNesting ", eventName, this.nesting);
            if (!this.evManager) console.log("this.evManager is null");
            this.evManager.trigger("decrease", this, eventName);
            if (this.nesting === 0) {
                this.currentDeferred.resolve();
                this.currentDeferred = new Deferred();
            }
            if (this.nesting < 0) throw "Deferred nesting level less than 0";
        },

        pause: function() {
            if (this.isPaused) return;
            this.pauseDeferred = new Deferred();
            this.isPaused = true;
        },

        run: function() {
            if (!this.isPaused) return;
            this.pauseDeferred.resolve();
            this.isPaused = false;
        },

        /**
         * Waits for instability and then for stability. if the counter of the nested deferred is zero then resolves the stabilize method,
         * otherwise instantiates a new DeferredListener
         * @param {bool} dontWaitForInstability  if true waits for stability only
         * @returns {Deferred}
         */
        stabilize: function(dontWaitForInstability) {
            if (this.nesting === 0 && dontWaitForInstability) {
                logger.log(logtypeEnum.INFO, "stabilize invoked: immediately stabilized");
                return Deferred().resolve();
            }
            logger.log(logtypeEnum.INFO, this.nesting > 0 ? "stabilize invoked:  actually unstable:" + this.nesting : "stabilize invoked:  waiting for unstable");
            var listener = new DeferredListener(this);
            return listener.result;
        },

        /**
         * Wait for unstability and then for stability
         * @returns {Deferred}
         */
        stabilizeToCurrent: function() {
            //console.log(this.nesting > 0 ? "stabilize invoked:  actually unstable:" + this.nesting : "stabilize invoked:  waiting for unstable");
            let listener = new DeferredListener(this, this.nesting);
            return listener.result;

        }
    };

    /**
     * @constructor
     * @description
     * Subscribes "increase" and "decrease" events of the stabilizer. In the descrease it resolves the deferred
     * @param {Stabilizer} stabilizer
     * @param {number} desiredNesting
     */
    function DeferredListener(stabilizer, desiredNesting) {
        this.desiredNesting = desiredNesting || 0;
        this.activated = stabilizer.nesting > this.desiredNesting;
        this.result = Deferred();
        this.stabilizer = stabilizer;
        stabilizer.evManager.subscribe("decrease", this.decrease, this);
        if (!this.activated) {
            stabilizer.evManager.subscribe("increase", this.increase, this);
        }
    }

    DeferredListener.prototype = {

        constructor:DeferredListener,

        /**
         *
         * @param source
         * @param {string} eventName
         */
        decrease: function (source, eventName) {
            //logger.log(logtypeEnum.INFO, "decreasing raised ", eventName, this.activated, this.stabilizer.nesting);
            if (this.activated && this.stabilizer.nesting === this.desiredNesting) {
                this.stabilizer.evManager.unsubscribe("decrease", this.decrease, this);
                this.stabilizer.evManager.unsubscribe("increase", this.increase, this);
                this.result.resolve();
                logger.log(logtypeEnum.INFO, "stabilized was done");
            }
        },

        /**
         *
         * @param source
         * @param {string} eventName
         */
        increase: function (source, eventName) {
            this.activated = true;
            //logger.log(logtypeEnum.INFO, "increase raised ", eventName, this.activated, this.stabilizer.nesting);
        }

    };
    const stabilizer = new Stabilizer();
    const myDeferred = _.bind(stabilizer.Deferred, stabilizer);
    myDeferred.when = _.bind(when, stabilizer);


    const toExport = {
        Stabilizer:stabilizer,
        Deferred: myDeferred,
        ResolvedDeferred: _.bind(stabilizer.ResolvedDeferred, stabilizer),
        stabilize: _.bind(stabilizer.stabilize, stabilizer),
        stabilizeToCurrent : _.bind(stabilizer.stabilizeToCurrent, stabilizer),
        EventManager: EventManager,
        EventEnum: eventEnum
    };

    // Some AMD build optimizers like r.js check for condition patterns like the following:
    //noinspection JSUnresolvedVariable
    if (freeExports && freeModule) {
        // Export for a browser or Rhino.
        if (root.appMeta) {
            _.extend(root.appMeta, toExport);
        }
        else {
            if (moduleExports) { // Export for Node.js or RingoJS.
                (freeModule.exports = toExport).EventManager = toExport;
            }
            else { // Export for Narwhal or Rhino -require.
                freeExports.EventManager = toExport;
            }
        }

    }
    else {
        // Export for a browser or Rhino.
        if (root.appMeta){
            _.extend(root.appMeta, toExport);
        }
        else {
            root.EventManager=toExport;
        }

    }

}(  (typeof appMeta === 'undefined') ? require('./Logger').logTypeEnum : appMeta.logTypeEnum,
    (typeof appMeta === 'undefined') ? require('./Logger').logger : appMeta.logger,
    (typeof _ === 'undefined') ? require('lodash') : _,
    (typeof $ === 'undefined') ? require('JQDeferred') : $.Deferred,
    (typeof $ === 'undefined') ? require('JQDeferred').when : $.when
));
