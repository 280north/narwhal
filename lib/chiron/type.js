/*file chiron src/base/type.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var boot = require('./boot');

/* use curryId only if the module loader provides it */
var curryId = require.xChironCurryId;
if (!curryId) curryId = function (callback) {
    return function () {
        return callback.apply(
            this,
            [undefined].concat(Array.prototype.slice.call(arguments))
        );
    };
};

/**
    Types
    =====
*/

/*** type
    returns a new, mixable, callable, type object for
    a type that inherits from an optional array or list
    of base types and a constructor function.

    ``type(constructor)`` or
    ``type(bases, constructor)``

    All types implicitly inherit from `Base`.  When
    you create a type, the type function linearizes your
    inheritance tree to produce a "method resolution
    order" (MRO).  `Base` is always the last type in the
    MRO, and the returned type object is always
    the first type in the MRO.  The linearization
    algorithm is the same as that for Python's new-style
    classes and does not permit ambiguity in the order
    of base types.  `type` will throw a `TypeError`
    if you attempt to construct a type from bases
    that have the same ancestors in different orders.
    The method resolution order algorithm is similar
    to a topological sort, which only works for
    trees, that is, graphs with no cycles.

    Type objects are functions that, when called, 
    produce instances of that type.  You can not
    use the ``new`` operator, and type objects are
    accepted anywhere functions are called.

    When you construct an instance, you effectively
    get a new Function object (so that all instances
    can also be callable) that has been decorated
    in layers by the constructor functions of all of
    the super-types in its MRO, from bottom (`Base`)
    to top.  Then, your new instance's `init`
    function gets called with the same arguments
    you provided to the type function.

    The constructor function receives the new instance
    as its first argument, conventionally named
    ``self``.  The second argument is a snapshot of the
    instance after the super-type's constructor function
    was applied to the instance, conventionally named
    ``supr``.  You can use the ``supr`` object to call
    a base type's definition of a function that you 
    override.

    You can define the an instance's function
    call behavior by defining an `invoke` method
    that will receive the arguments and return
    its result.  This is analogous to defining
    ``__call__`` in Python.

*/
exports.type = curryId(function (moduleId) {

    var bases;
    var construct;
    var name;
    var count = 0;

    if (arguments.length == 1) {
        bases = [];
        construct = function () {};
    } else if (arguments.length == 2) {
        bases = [];
        construct = arguments[1];
    } else if (arguments.length == 3) {
        bases = arguments[1];
        construct = arguments[2];
    } else {
        throw TypeError("Invalid type declaration");
    }

    /* if the base type were specified dynamically using a List
     * or some such object, convert them to an array */
    if (!(bases instanceof Array)) {
        bases = list.array(bases);
    }

    /* create a type function.  this is a function that
     * returns new instances of the type and carries the type's
     * member functions */
    var self = function () {

        /* create an instance function.  this function
         * defers to a user-defined "invoke" function and
         * carries the public interface of the instance. */

        /*
            to make possible the idea that objects should be callable 
            and be able to override callability, the ``Object``
            for the instance is actually a function.  This function
            only exists to call the instance's invoke method.
        */
        var instance = function () {
            if (boot.no(instance.invoke))
                throw new Error(self.repr() + " cannot be called as a function.");
            return instance.invoke.apply(instance, arguments);
        };

        instance.getType = function () {
            return self;
        };

        /* for convenience */
        var alias = boot.aliaser(instance);
        var ed = boot.eder(instance);
        var layer;

        /* establish a set of instances for each type in the mro */
        for (var i = 0; i < reversedMro.length; i++) {
            var baseType = reversedMro[i];

            baseType.getConstruct().call(
                instance /* this */,
                instance /* self */,
                layer /* super */,
                alias, ed
            );

            layer = function () {
                return layer.invoke.apply(instance, arguments);
            };

            /* binding each function to the instance caused
            massive performance degredation in Internet Explorer
            (up to 8 beta), so we require methods to use "self"
            from closures.  Probably a good idea anyway. */
            for (var key in instance) {
                layer[key] = instance[key];
            }

        }

        instance.init.apply(instance, arguments);

        return instance;
    };

    var alias = boot.aliaser(self);

    /**** constructor
        a reference to `type` so that types can be
        identified as "instances" of type.  This is an
        implementation detail that powers `repr` in its
        ability to represent types, and the `isInstance`
        ability to identify them.
    */
    self.constructor = exports.type;

    /**** getName
        returns the name of the type as it was declared
        in its originating module.  If the type was
        not declared publically in its originating module
        (attributed to the module object), returns
        a number that is guaranteed to be the same
        for all instances of the same type as long
        as a module remains loaded.

        `getName` will return either a `String` or
        a `Number`.

        The first time `getName` is called, it searches
        for the type's name in its declaring
        module.  Failing that, it assigns a number
        to the type.  `getName` then redefines
        itself so that it returns the same name
        to all future calls.
    */
    self.getName = function () {

        if (construct.name)
            name = construct.name;

        if (moduleId !== undefined) {
            var module = require(moduleId);

            /* scan the containing module for a name
             * for this type */
            for (var key in module) {
                var value = module[key];
                if (value === self) {
                    name = key;
                }
            }
        }

        /* if there was no name in the module, the type
         * is anonymous.  give the type a hearty new
         * number for a name. */
        if (boot.no(name)) {
            if (!annonymousTypeCounters[moduleId])
                annonymousTypeCounters[moduleId] = 0;
            name = '<anonymous#' + (annonymousTypeCounters[moduleId]++) + '>';
        }

        /* cheap cache */
        self.getName = function () {return name;};

        return name;
    };

    /**** getFullName
        the `moduleUrl` (relative to `modulesUrl`)
        of the declaring module with the name of the
        type in the anchor (following ``#``).
    */
    self.getFullName = function () {
        return (moduleId || '') + '#' + self.getName();
    };

    /**** getModule
        the module object for the module that the
        type was declared in.
    */
    self.getModule = function () {
        return require(moduleId);
    };

    /**** isType
        returns whether this type is or inherits
        from another type.
    */
    self.isType = function (otherType) {
        return boot.arrayAny(boot.arrayEach(mro, function (baseType) {
            return baseType === otherType;
        }));
    };

    /**** getBases
        returns a `List` of `type` objects for
        this type's immidiate super-types.
    */
    self.getBases = function () { return list.List(bases); };

    /**** getBasesArray
        `getBases` but returns a native `Array`
        instead of a `List`.

        an internal function used by the type system to
        construct types using native arrays since
        List may not have been defined yet or causes
        infinite recursion.
    */
    self.getBasesArray = function () { return boot.copy(bases); };

    /**** getMro
        returns a `List` including the transitive closure
        of this type and each member's super-types in their
        order of precedence.  Thus, this type is always the
        first element, and `Base` is always the last.
    */
    self.getMro = function () { return list.List(mro); };

    /**** getMroArray
        `getMro` but returns a native `Array` 
        instead of a `List`.

        an internal function used by the type system to
        construct types using native arrays since
        List may not have been defined yet or causes
        infinite recursion.
    */
    self.getMroArray = function () { return boot.copy(mro); };

    /**** getConstruct
        Returns the constructor function for this `type`.
        When a new instance is created, all of the constructor
        functions in members of this type's method resolution
        order are applied to the new instance `Function`
        object in reverse order, so `Base`'s constructor
        runs first, and the return value of `getConstruct`
        is applied last.
    */
    self.getConstruct = function () { return construct; };

    /**** repr
        prints a representation of the type.
    */
    self.repr = function () {
        return '<type ' + self.getFullName() + '>';
    };

    /**** string
        alias of `repr` by default.
    */
    self.string = boot.alias('repr');

    /**** toString
        alias of `repr` by default.
    */
    self.toString = boot.alias('repr');

    /**** nextHash
        returns a unique hash for an instance.
    */
    self.nextHash = function () {
        return count++;
    };

    /* calculate the method resolution order */
    var mro = getMro(self);

    /* an optimization so we don't have to reverse the mro for every instantiation */
    var reversedMro = boot.arrayReversed(mro);

    return self;
});

var annonymousTypeCounters = {};

/*
    construct a monotonic method resolution order for a given type [#mro]_.
    An internal function of the type system modeled after Python's
    method resolution order calculation.
*/
/*todo consider improving the brevity, performance, and elegance
 * of this algorithm after an exhaustive test suite is ready */
var getMro = function (type) {
    var merge = function (rows) {
        var result = [];
        while (true) {
            var nonEmptyRows = boot.arrayWhere(rows, function (row) {
                return row.length > 0;
            });
            if (nonEmptyRows.length === 0) {
                return result;
            }
            var candidate = null;
            boot.arrayEach(nonEmptyRows, function (row) {
                candidate = row[0];
                if (
                    boot.arrayAny(boot.arrayEach(nonEmptyRows, function (row) {
                        return boot.arrayHas(boot.arraySliced(row, 1), candidate);
                    }))
                ) {
                    candidate = null;
                } else {
                    throw boot.stopIteration;
                }
            });
            if (!candidate) {
                throw TypeError("Inconsistent hierarchy");
            }
            result.push(candidate);
            boot.arrayEach(nonEmptyRows, function (row) {
                if (row[0] === candidate) {
                    row.shift();
                }
            });
        }
        return result;
    };

    try {
        var basesArray = boot.arrayAdded(
            [[type]],
            boot.arrayEach(type.getBasesArray(), function (baseType) {
                return baseType.getMroArray();
            }),
            [type.getBasesArray()]
        );
        if (exports.Base) {
            basesArray = boot.arrayAdded(
                basesArray,
                [[exports.Base]]
            );
        }
        return merge(basesArray);
    } catch (exception) {
        if (exception instanceof TypeError) {
            throw TypeError(
                "Inconsistent hierarchy for " + 
                string.enquote(type.getName()) + "."
            );
        } else {
            throw exception;
        }
    }

};

/*** operator

    - returns a currying polymorphic operator.
    - accepts a minimum number arguments for full application.
    - accepts a member function name for the polymoprhic equivalent,
      e.g., "added" for "add", "list" for "list".
    - accepts a continuation to call if the given object does not override
      the named function.

    The returned operator will curry once if fewer arguments are supplied
    than the requested minimum.  this function will accept one argument,
    the object to apply on, reapply the operator with the given object
    as the first argument and previously given arguments following, and
    return the result.  Thus::

        set("key", "value")(object)

    is equivalent to::

        set(object, "key", "value")

    Since `set` is defined as a polymorphic currying operator::

        self.set = operator(3, "set", function (object, key, value) {
            ...
        });
        
*/
exports.operator = function (n, name, fallback) {
    var result = function (object) {
        var self = this;
        /* curry if there are too few arguments */
        if (arguments.length < n) {
            var args = Array.prototype.slice.call(arguments, 0);
            /* curry on the arguments following the first
             * so that gt(10)(x) means x > 10,
             * and set("a", 10") means set(o, "a", 10) */
            return function (object) {
                return result.apply(self, [object].concat(args));
            };
        }
        if (
            exports.isInstance(object, exports.Base) &&
            object[name] &&
            object[name].bound !== result
        )
            return object[name].apply(object, boot.arraySliced(arguments, 1));
        /* i decided NOT to put special logic for function composition here
         * (like add(f, g) == \x add(f(x), g(x))) because it would cause
         * existing code to break where Function objects were being
         * treated as real Objects for operations like update, complete,
         * dir &c.  might as well be explicit about composition anyway;
         * i'm sure there's a better way even though implicit would be
         * most terse. */
        return fallback.apply(this, arguments);
    };
    result.on = function (object) {
        return function () {
            return result.apply(object, [object].concat(arguments));
        };
    };
    result.to = function (toFunctor) {
        return exports.operator(n, name, exports.to(fallback, toFunctor));
    };
    /* it is necessary to name the function
     * so it's accessible for the curry */
    return result;
};

/*** method
    returns a method based on the name of a function
    provided in the module that `method` is called
    in.  The module function should accept the
    method's context object as its first argument.
*/
exports.method = function (continuation, name) {
    if (continuation === undefined) {
        throw new Error('base/type#method: continuation undefined for ' + name);
    }
    var method = function () {
        return continuation.apply(
            undefined,
            [this.valueOf()].concat(list.array(arguments))
        );
    };
    method.bound = continuation;
    return method;
};

/*** member
    returns a function that will return a member of an
    object, calling an accessor function by name.
    accepts the name of the desired member.
    the returned function accepts the desired object.
    `member`, `by`, and `sorted` make an excellent team
    for sorting an array of objects by their respective
    values for a given member: ``sorted(lists, by(member('len')))``.
*/
exports.member = function (name) {
    var args = list.array(arguments).slice(1);
    return function (object) {
        if (!object[name])
            throw new Error(
                "Cannot find member " +
                string.enquote(name) +
                " of " +
                exports.repr(object)
            );
        if (!object[name].apply)
            throw new Error(
                "Member " +
                string.enquote(name) +
                " of " +
                exports.repr(object) + 
                " is not a function"
            );
        return object[name].apply(object, args);
    }
};

/*** Base
    All instances returned by types return by `type`
    inherit from `Base`.  `Base` provides functions
    that all instances implement with some default
    behavior.
*/

exports.Base = exports.type(function (self, supr, alias) {

    /* the hash key is a string containing the mantissa
     * of a random number */
    var hashKey = self.getType().nextHash();

    /**** init
        an empty initializer so that all derived types can
        safely assume that ``supr.init()``
        will work.
    */
    self.init = function () {
    };

    /**** getType
        returns the type function object that created this
        instance.
    */
    /* this method is provided by the ``type``.

    /**** isInstance
        returns whether a given type is one of
        this instance's type or any of its 
    */
    self.isInstance = function (otherType) {
        return self.getType().isType(otherType);
    };

    /**** getTypeName
        returns the name of this instance's type.
    */
    self.getTypeName = function () {
        return self.getType().getName();
    };

    /**** getTypeFullName
        returns the full name of this instance's type.
    */
    self.getTypeFullName = function () {
        return self.getType().getFullName();
    };

    /**** repr
        returns a `String` representation of the
        instance for debugging purposes.
    */
    self.repr = self.string = function () {
        return '<instance ' + self.getTypeFullName() +
            ' ' + hashKey + '>';
    };

    /**** string
        an alias of `repr` by default.
    */
    self.string = alias('repr');

    /**** hash
        provides a default, random hash to identify 
        the instance.
    */
    self.hash = function () {
        return hashKey + self.getTypeName();
    };

    /**** eq
        returns whether this instance is equivalent
        to another instance.  Overrided forms of
        `eq` should perform a deep comparison.
        The default behavior is ``this === self``,
        which returns whether they are exactly
        the same object in memory.
    */
    self.eq = function (other) {
        return self === other;
    };

    /**** ne
        returns whether an object is not equal to
        another, deferring to `eq` if not
        overridden.
    */
    self.ne = function (other) {
        return !self.eq(other);
    };

    /**** string
        converts the instance to a string.  The
        default behavior provided by `Base` is
        to defer to `repr`.
    */
    self.string = alias('repr');

    /**** bool
        a default implementation that always
        returns `true`.
    */
    self.bool = function () {
        return true;
    };

    /**** not 
        defers to the logical negation of `bool`.
    */
    self.not = function () {
        return !self.bool();
    };

    /**** toString
        defers to `string`.  Provided so that native
        JavaScript functions gain the benefits of derived
        types with `string` type functions.
    */
    self.toString = alias('repr');

    /**** copy
        returns a shallow copy of this object.  The
        default behavior is to defer to the 
        constructor, passing this instance as an
        argument to `init`.
    */
    self.copy = function () {
        return self.getType()(self);
    };

    /**** to
        calls a given function with this object as an argument
        and returns the result.  this is similar to `as`
        except that it's guaranteed to return a new copy
        of the object.
    */
    self.to = function () {
        /* modules.js#include provides these names to functions
         * that were included from another module */
        var args = list.array(arguments);
        var constructor = args.shift();
        return constructor.apply(undefined, [self].concat(args));
    };

    /*** given
        applies a stateful function on itself and returns
        itself.  This function may not exist in future versions,
        `given` its limited utility.

        - `experimental`
    */
    self.given = function (continuation) {
        continuation.call(self, self);
        return self;
    };

});

/*** Undefined
    A constructor for the `undefined` constant.

    The value `undefined` is not a member of the type system,
    but for orthogonality, we provide an `Undefined` type.
    This feature preserves the following identities:

    - ``isInstance(undefined, Undefined)``
    - ``getType(undefined) === Undefined``
    - ``getType(undefined)() === undefined``
    - ``getTypeName(undefined) === 'Undefined'``
*/

exports.Undefined = function () {
    return void(0);
};

/*** Null
    A constructor for the `null` constant, analgous
    to `Undefined`.
*/
exports.Null = function () {
    return null;
};

/*** isInstance
    returns whether a given object is an instance of the
    given type.  Works for both native prototype inheritance
    and `type` inheritance.
    currys a partial operator if less than 2 arguments are provided.
    
    Works for boxed types::

        isInstance(1, Number)
        isInstance(Number(1), Number)
        isInstance(new Number(1), Number)
    
    Considers `Arguments` objects to be `Arrays`::

        isInstance(arguments, Array)

    Only reports that `type` instances are `Function`
    objects if they implement `invoke`.

*/
exports.isInstance = function (value, type) {
    if (value === undefined) return type === exports.Undefined;
    if (value === null) return type === exports.Null;

    if (boot.no(type))
        return function (x) {
            return exports.isInstance(x, value);
        };

    if (typeof value == 'function' && type == Function) {
        if (value.isInstance)
            return value.invoke && value.invoke != Function.prototype.invoke;
            /* since our instances and functions are really Functions,
             * only admit to being functions if 'invoke' is implemented */
        return !(value instanceof RegExp);
        /* don't admit that regular expressions are objects since they
         * don't implement call or apply, boo */
    }

    /* necessary to catch string literals */
    if (value.constructor === type) return true;

    /* http://ajaxian.com/archives/working-aroung-the-instanceof-memory-leak */
    if (!value.valueOf) return false;

    if (value instanceof type) return true;

    /* treat Arguments as Arrays [#arguments]_. */
    if (value.callee && type === Array) return true;

    /* some arrays appear to be undetectable */
    //if (value.length !== undefined && type === Array) return true;

    if (typeof value == 'number' || typeof value == 'NaN') 
        return type === Number;

    /* catch isInstance(module, Object)? to avoid infinite recursion */
    if (value.isInstance === exports.isInstance) 
        return type === Object;

    if (value.isInstance) 
        return value.isInstance(type);

    return false;
};

/*** getType
    returns a type object for a given instance.

    `getType`, or the Chiron environment in general,
    attempts to support several idioms.  Foremost,
    `isInstance` and `getType` should cooperate to
    guarantee this axiom::

        isInstance(instance, getType(instance))

    `getType` should also return a constructor and
    copy constructor "factory method" for the instance's
    type::

        isInstance(getType(instance)(), getType(instance))
        eq(getType(instance)(instance), instance)

    These axioms are posed by Chiron types, in so far
    as implementors of Chiron types choose to support them.
    JavaScript native types do not make such guarantees.
    This is a leaky abstraction.

    However, these axioms work even in some odd edge-cases
    that wouldn't otherwise be supported by native
    JavaScript.  For example, the types of `undefined`
    and `null` are this module's `Undefined` and `Null`
    constructor functions.  `isInstance` recognizes
    these types, and calling these types as constructors
    or copy constructors returns their respective instance.

    `Array` instances return the `array` function instead
    of the `Array` constructor.  `array` actually serves
    as a copy constructor instead of the highly overloaded,
    variadic `Array` constructor.  `isInstance` cooperates
    by indicating that `Array` instances do in fact
    instantiate from `array`.  This constructor can also
    construct an `Array` from any iterable.

    Objects that are plain `Object` instances (not
    instances of derrived prototypes) return `object`
    instead of the `Object` constructor.  `isInstance`
    cooperates in the same way as arrays.  The `object`
    function can construct objects from any iterable.

*/
exports.getType = function (value) {
    if (value === undefined) return exports.Undefined;
    if (value === null) return exports.Null;
    if (exports.isInstance(value, exports.Base) && value.getType) try {
        return value.getType();
    } catch (exception) { }
    if (exports.isInstance(value, Array)) return list.array;
    if (value.constructor == Object) return dict.object;
    return value.constructor;
};

/*** getTypeName
    returns the name of an instance's type with due
    dilligence.

    Since this function behaves differently
    in nearly ever environment and certain names
    are not exported by modules in various circumstances,
    its return values are purely informational.
*/
exports.getTypeName = function (value) {
    if (value === undefined)
        return 'Undefined';
    if (value === null)
        return 'Null';
    if (value.getTypeName)
        return value.getTypeName();
    if (value.constructor && value.constructor.toString().search(/ (.*)(?=\()/))
        return value.constructor.toString().match(/ (.*)(?=\()/)[1]
    if (value.constructor && value.constructor.name)
        return value.constructor.name;
    return typeof value;
};

/*** getTypeFullName
    returns the full type name of an instance in so far
    as its power permit.  Like `getTypeName` its
    return values are purely informational.  The usual
    recipie for a full type name is the `moduleUrl` of
    the module that the type was declared in with the exported
    name of the type as its anchor (after the ``#``).

    - `polymorphic`
*/
exports.getTypeFullName = exports.operator(1, 'getTypeFullName', exports.getTypeName);

/*** as
    returns a value in a given type.  if the value
    is already the correct type, returns the
    original object.  if it isn't the correct type,
    converts it returning a shalow copy in the
    new type.

    - `polymorphic`
*/
exports.as = exports.operator(2, 'as', function (value, type) {
    if (exports.isInstance(value, type)) return value;
    if (type === Number) return operator.number(value);
    if (type === Array) return list.array(value);
    if (type === String) return string.string(value);
    return exports.to(value, type);
});

/*** to
    converts an object to a given type, guaranteeing
    a shallow copy is returned.  defers to
    overloads functions in the value with the
    same full name as the given type, short name,
    or the `to` function respectively, if any
    of them are provided.  Otherwise, presumes
    that the type function is a copy constructor.

    alternately, if the first argument is a
    function and not a type, `to` performs
    function composition.  That is::

        to(f, g)(...) == f(g(...))

    If the resultant composed function is called with
    `call` or `apply`, the context object is preserved
    for the latter function::

        to(f, g).call(this, ...) == f(g.call(this, ...))

    - `polymorphic`
*/
exports.to = curryId(exports.operator(3, 'to', function (id, value, type) {
    if (type === undefined)
        throw new Error("type#to: type undefined in " + id);
    if (exports.isInstance(value, Function) && !exports.isInstance(value, exports.Base)) {
        return function () {
            return type(value.apply(this, arguments));
        };
    }
    var args = list.array(arguments);
    id = args.shift();
    value = args.shift();
    type = args.pop();
    if (boot.no(value))
        return type();
    return type.apply(this, [value].concat(args));
}));

/*** args

    Usage::

        args(arguments, continuation)
        args.call(context, arguments, continuation)

    accepts:
    - `value`: iterable of arguments
    - `continuation`: function

    returns the result of ``continuation.apply(context, arguments)``,
    ascertaining that the arguments are converted to an
    array.

    applies a given function, using the given
    arguments such that::

        apply([1, 2, 3], sum) == sum(1, 2, 3)

    Also, composes functions such that the first
    function passes its result into the second
    function as arguments.

*/
exports.args = exports.operator(2, 'args', function (values, continuation) {
    if (exports.isInstance(values, Function) && !exports.isInstance(values, exports.Base)) {
        return function () {
            return continuation.apply(this, list.array(values.apply(this, arguments)));
        };
    }
    return continuation.apply(this, list.array(values));
});

/*** dir
    returns a list of attributes for a given object
    returns a `List` of all of a
    given instance's public member names.

    with no arguments, lists all of the
    public and module scope names in the
    current module.

    - `not-polymorphic`
*/
exports.dir = curryId(function (id, values) {
    if (arguments.length == 0 && id !== undefined)
        return list.sorted(boot.objectKeys(require(id)));
    if (boot.no(values))
        return list.List();
    return list.List(boot.objectKeys(values)).sorted();
});

/* vars
    attempts to implement vars in a fashion that worked
    and was useful all ended with melted CPU's.
    In the end, it was a waste of space.
    Ye be warned.
*/

/*** repr
    returns a string representation of the given object.

    - accepts any object
    - accepts an optional depth (defaults to `maxReprDepth`).
      `repr` will replace any object beneath this depth with
      an ellipsis (``...``).
    - accepts an optional memo `Set` of objects not to expand
      since they've presumably already been visited in the course
      composing a representation string.  `repr` will replace
      any object that's already been visited with a notation
      that there's a cycle, (``<cycle>``).

    `repr` uses these later arguments internally,
    and polymorphic overrides of the `repr` method on
    types constructed with `type` that compose the results
    of recursive `repr` calls are advised to use and
    pass these arguments back into this `repr` function.

    `repr` will fall back on `toString` in the unlikely
    event it can't come up with a reasonable representation
    of an object.  Sometimes this will result in an exception
    being throw.  `repr` sliently catches these exceptions
    and returns ``<unknown>`` with the exception or exception
    message.

    - `polymorphic`
*/
exports.repr = function (value, depth, memo) {
    try {

        /* handle deep recursion */
        if (boot.no(depth))
            depth = exports.maxReprDepth;
        if (depth <= 0)
            return '...';
        depth--;

        /* handle primitives */
        if (exports.isInstance(value, String))
            return string.enquote(value);
        if (
            boot.no(value) ||
            exports.isInstance(value, Number) ||
            exports.isInstance(value, Boolean) ||
            exports.isInstance(value, Date)
        )
            return '' + value;

        /* handle cycles */
        if (boot.no(memo))
            memo = set.Set(undefined, operator.is);

        if (memo.has(value)) {
            return '<cycle>';
        } else {
            memo.insert(value);
        }

        /* handle compound objects */
        if (exports.isInstance(value, exports.Base) || exports.isInstance(value, exports.type))
            return value.repr(depth, memo);
        /* dict would catch Functions without the Function case: */
        if (exports.isInstance(value, Function)) {
            if (value.name)
                return '<function ' + value.name + '>';
            if (value.toString)
                return '<function>';
            return '<built-in-function>';
        }
        if (environment.window && window.Node && exports.isInstance(value, environment.window.Node))
            return exports.nodeRepr(value);
        if (exports.isInstance(value, Array))
            return exports.arrayRepr(value, depth, memo);
        if (exports.isInstance(value, Object))
            return exports.objectRepr(value, depth, memo);

        return value.toString();

    } catch (exception) {
        if (!boot.no(exception) && exception.message)
            return '<unknown due to error: ' + string.enquote(exception.message) + '>';
        return '<unknown ' + exception + '>';
    }
};

/*** maxMemoDepth
    deters inifinite recursion in representations of complex objects.
    used by `repr`.  The default value is ``4``, but this can be
    changed by assigning to this name on the `base` module.
*/
exports.maxReprDepth = 4;

/*** arrayRepr
    supports the same interface as `repr` but only
    operates on arrays.  `repr` uses this function internally.
    `arrayRepr` will perform better in situations where
    an object is guaranteed to be an `Array`.
*/
exports.arrayRepr = function (values, depth, memo) {
    if (depth <= 0)
        return '[...]';
    return (
        '[' +
            boot.arrayEach(values, function (value) {
                return exports.repr(value, depth, memo);
            }).join(', ') +
        ']'
    );
};

/*** objectRepr
    supports the same interface as `repr` but only
    operates on associative array objects.  `repr` uses
    this function internally.
    `objectRepr` will perform better in situations where
    an object is guaranteed to be an `Object`.
*/
exports.objectRepr = function (values, depth, memo) {
    if (depth <= 0)
        return '{...}';
    return (
        '{' +
            boot.arrayEach(boot.objectItems(values), function (pair) {
                return (
                    exports.repr(pair[0], depth, memo) + ': ' +
                    exports.repr(pair[1], depth, memo)
                );
            }).join(', ') +
        '}'
    );
};

/*** nodeRepr
    supports the same interface as `repr` but only
    operates on DOM nodes.  `repr` uses this function internally.
    `nodeRepr` will perform better in situations where
    an object is guaranteed to be a `Node`.
*/
exports.nodeRepr = function (node) {
    if (node.nodeType == 1) 
        return '<' + string.lower(node.nodeName) + '>';
    if (node.nodeType == 3)
        return '<' + string.enquote(node.data) + '>';
    return '<?>';
};

/*** hash
    attempts to return a unique `String`
    for a given object of a native JavaScript or
    Chiron type.

    Defers to `toString` for nearly all JavaScript
    types.  This means that all objects are hashable
    but only make good dictionary or set indicies if
    they are not modified.
*/
/*
    various attempts to optimize hashing for native
    JavaScript objects have all failed.  For example,
    using `repr` resulted in infinite loops.
    One attempt involved dynamically adding a hash
    function to objects that returned a unique
    number.  The side effects were unsightly.
    Given that using objects or event arrays
    as hash keys is inadvisable in any case,
    I opted to stop trying to make it work
    well.
*/
exports.hash = exports.operator(1, 'hash', function (value) {
    try {
        return '' + value;
    } catch (exception) {
        /* some cyclic objects in Safari
         * throw an exception inside toString */
        return '';
    }
});

var operator = require('./operator');
var list = require('./list');
var dict = require('./dict');
var set = require('./set');
var each = require('./each');
var string = require('./string');

/*license

    Legal
    =======
    
    Chiron is a component of the Tale web-game project.
    
    See <credit.txt> for a complete list of
    contributions and their licenses.  All contributions are provided
    under permissive, non-viral licenses including MIT, BSD, Creative Commons
    Attribution 2.5, Public Domain, or Unrestricted.
    
    
    License
    =======
    
    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    
    MIT License
    -----------
    
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.

*/

