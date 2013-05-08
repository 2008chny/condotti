/**
 * Condotti lang module provides the extra utilities to extend the javascript
 * language's ability.
 *
 * @module condotti.lang
 */
Condotti.add('condotti.lang', function (C) {
    
    /**
     * The class version of the original 'lang' namespace, so that the default
     * behaviours can be changed in the child classes, which is normally occurs
     * when the detail implementation requires, for example, the node.js version
     * of inspect supports the Buffer class that is not in the default
     * implementation.
     *
     * @class Language
     * @constructor
     */
    function Language () {
        /**
         * The global console instance
         *
         * @property console
         * @type Object
         */
        this.console = console;
        
    }
    
    /**
     * Inherit the prototype methods from one constructor into another.
     * The `prototype` of the constructor will be set to a new object created
     * from parent constructor.
     * As an additional convenience, parent constructor will be accessible 
     * through the constructor.super_
     *
     * @method inherit
     * @param {Function} child the child constructor to inherit to
     * @param {Function} parent the parent constructor to inherit from
     */
    Language.prototype.inherit = function (child, parent) {
        /**
         * This helper function is used to invoke the constructor of the parent
         * class when initializing an instance of the child class. This method
         * is added to the prototype of the child class.
         *
         * @method super_
         */
        var super_ = function () {
            var c = this.constructor;
            /**
             * Iterate the super chain until the current caller is found as a
             * constructor in the chain.
             * TODO: handle the case that "caller" is not implemented.
             */
            while (c && (c !== arguments.callee.caller)) {
                c = c.super_;
            }
            /* apply the constructor to current instance */
            if (c && c.super_) {
                c.super_.apply(this, arguments);
            }
        };
        child.super_ = parent;
        
        if (Object.create) { // borrowed from the `util` module from node.js
            child.prototype = Object.create(parent.prototype, {
                constructor: {
                    value: child,
                    enumerable: false,
                    writable: true,
                    configurable: true
                },
                super: {
                    value: super_,
                    enumerable: false,
                    writable: false,
                    configurable: true
                }
            });
        } else { // borrowed from the `extend` function of the book
                 // `Pro Javascript Design Patterns`
            var F = function () {};
            F.prototype = parent.prototype;
            child.prototype = new F();
            child.prototype.constructor = child;
            child.prototype.super = super_;
        }
    };
    
    /**
     * Merge the list of objects starting from 2nd to the 1st one.
     *
     * @method merge
     * @param {Object} to the object to be merged to
     * @param {Object} from* 1-n objects to merge from
     * @param {Boolean} overwritten if the data from latter object can overwrite
     *                              the one from the formmer one when conflict
     *                              is detected.
     */
    Language.prototype.merge = function () {
        var params = Array.prototype.slice.call(arguments, 0),
            target = null,
            last = null,
            overwritten = true;
        
        if (params.length <= 1) {
            return;
        }
        
        target = params.shift();
        last = params[params.length - 1];
        if (Boolean === C.lang.reflect.getObjectType(last)) {
            overwritten = params.pop();
        }
        
        params.forEach(function (param, index) {
            var stack = [],
                frame = { path: 'ROOT', target: target, source: param },
                key = null,
                value = null;
            
            while (frame) {
                for (key in frame.source) {
                    if (!frame.source.hasOwnProperty(key)) {
                        continue;
                    }
                    
                    value = frame.source[key];
                    
                    if (!frame.target.hasOwnProperty(key)) {
                        frame.target[key] = value;
                        continue;
                    }
                    
                    if (C.lang.reflect.isPlainObject(value) && 
                        C.lang.reflect.isPlainObject(frame.target[key])) {
                        stack.push({ 
                            path: frame.path + '.' + key, 
                            target: frame.target[key], 
                            source: value 
                        });
                        continue;
                    }
                    
                    if (!overwritten) {
                        throw new Error('Confliction has been detected on ' +
                                        'property ' + frame.path + 
                                        ' when merging the ' + (index + 1) + 
                                        'th param into the target');
                    }
                    
                    // Overwrite
                    frame.target[key] = value;
                }
                
                frame = stack.pop(); // deep first search to ensure that the
                                     // values in later object will absolutely
                                     // overwrite the ones in previous objects
            }
        });
    };
    
    /**
     * Execute the callback function on the next tick
     *
     * @method nextTick
     * @param {Function} callback the callback function to be invoked on next tick
     */
    Language.prototype.nextTick = function(callback) {
        setTimeout(callback, 0); // default version
    };
    
    /**
     * Return a wrapper function of the passed-in function. When the wrapper is 
     * called, the wrapped function is called in next tick.
     *
     * @method async
     * @param {Function} callback the function to be made async
     * @return {Function} the created wrapper function
     */
    Language.prototype.async = function(callback) {
        var self = this;
        return function () {
            var params = Array.prototype.slice.call(arguments, 0);
            self.nextTick(function () {
                callback.apply(null, params);
            });
        };
    };

    /**
     * Clone the required object (deeply)
     *
     * @method clone
     * @param {Object} source the source object to be cloned
     * @param {Boolean} deep deep copy or not, which is false by default
     * @return the cloned object
     */
    Language.prototype.clone = function(source, deep) {
        // now deep copy is not supported
        var cloned = null,
            key = null;

        // TODO: support other data types and deep copy
        if ('object' !== typeof source) {
            throw new TypeError('Method \'clone\' only clones objects, ' +
                                'but not ' + typeof source);
        }
        
        cloned = {};
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                cloned[key] = source[key];
            }
        }
        
        return cloned;
    };
    
    C.lang = new Language();
    
}, '0.0.1', {});
