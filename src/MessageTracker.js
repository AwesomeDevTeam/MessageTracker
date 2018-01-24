"use strict";

/**
 * Tracker constructor.
 * You can use this function with or without "new" operator
 *
 * @constructor
 * @param {Object} o
 * @param {Number} o.timeout Message timeout in milliseconds
 * @param {Number} [o.checkInterval=1000] Check interval in milliseconds
 */
export default function MessageTracker(o) {

    if ( typeof o === "undefined" || o === null ) {
        throw Error("Missing configuration object");
    }

    if ( ("timeout" in  o ) === false ) {
        throw Error("Required param 'timeout' is not defined");
    }

    var promiseRegister = [],
        globalTimeout = o.timeout,
        checkInterval = o.checkInterval ? o.checkInterval : 1000,
        timer = null;

    function checkOverdue() {

        var now = new Date() / 1000 | 0; // Get seconds and cut milliseconds

        promiseRegister = promiseRegister.filter( function(val) {
            if ( now - val.regTime > val.timeout ) {
                val.reject(val.timeoutRejectWith);
                return false;
            } else {
                return true;
            }
        });

        // Timer is set again only when we have any message
        if ( promiseRegister.length > 0 ) {
            timer = setTimeout(checkOverdue, checkInterval);
        } else {
            clearTimeout(timer);
            timer = null;
        }

    }

    return Object.create(MessageTracker.prototype, {

        globalTimeout : { set : function (val) {
            globalTimeout = val;
        }, get : function(){
            return globalTimeout;
        }},

        register : { value :

        /**
         * Registers message in tracker.
         * Filter function is a function witch should accept one argument as object with following properties<br>
         *     - message - message passed to matchMessage method<br>
         *     - current - iterated message from internal message register)<br>
         *     - resolve - resolving function<br>
         *     - reject - rejecting function)<br>
         *     - params - additional params
         * Filter function is executed on each registered message when you call MessageTracker#matchMessage method
         * If o.context will be passed then filter function will be executed within passed context
         *
         * @param {Object} o
         * @param {Object} o.message
         * @param {Function} o.filter Filter function
         * @param {Number} [o.timeout=this.globalTimeout] Individual timeout in seconds for registered message, if not given, global timeout from constructor will be used
         * @param {Object} o.timeoutRejectWith Overdue messages will be rejected with this object
         * @param {Object} [o.params={}] Additional params which will be passed to filter function
         * @param {Object} [o.context] Context (this) to execute filter function
         * @return Promise
         */
        function (o) {

            var that = this;

            var ret = new Promise(function(resolve, reject) {

                var now = new Date() / 1000 | 0,  // Get seconds and cut milliseconds
                    params = Object.create(null);

                if ("params" in o && typeof params !== "undefined" ) {
                    params = o.params;
                }

                promiseRegister.push( {
                    message : o.message,
                    filter : o.filter,
                    resolve : resolve,
                    reject : reject,
                    regTime :  now,
                    timeout :  o.timeout ? o.timeout : that.globalTimeout,
                    timeoutRejectWith : o.timeoutRejectWith,
                    params : params,
                    context : o.context } );

            });

            // Start timer if it's not started
            if ( timer === null ) {
                timer = setTimeout(checkOverdue, checkInterval);
            }

            return ret;

        }},

        /**
         * Match message passed as argument with registered messages
         * Matching is done by function passed to register method in filter property
         * Function returns true if message was matched
         * @see MessageTracker#register
         * @param {Object} m Message to check
         * @function
         * @return Boolean
         */
        matchMessage : {

            value : function(m) {

                var l = promiseRegister.length,
                    br = false, rejectForFilter, resolveForFilter;


                function resolve(resolveFnc) {
                    return function(res) {
                        resolveFnc(res);
                        br = true;
                    };
                }

                function reject(rejectFnc) {
                    return function(err) {
                        rejectFnc(err);
                        br = true;
                    };
                }

                for(var i=0;i<l;i++) {

                    var val = promiseRegister[i];

                    resolveForFilter = resolve(val.resolve);
                    rejectForFilter = reject(val.reject);

                    val.filter.call(val.context, {
                        message : m,
                        current : val.message,
                        resolve : resolveForFilter,
                        reject : rejectForFilter,
                        params : val.params
                    });

                    if ( br === true ) {
                        promiseRegister.splice(i,1);
                        break;
                    }

                }

                return br;

            }
        }

    });

}
