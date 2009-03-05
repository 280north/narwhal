/*file chiron src/boot.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

/*status works in Firefox 2, Safari 2 and 3, and Explorer 6 */
/*quality .9 */
/*step 1 */

/** provides low level, type-sensitive functions for
    ``base.js`` and any module that is interested in low-footprint,
    higher-performance convenience functions.
*/

"use iojs";

/*** print
    prints a message and label to the environment's console,
    if one is available.
*/
exports.print = function () {
    if (environment.print) {
        return environment.print.apply(this, arguments);
    }
};

/*** bind
    returns a function that will unconditionally
    use the given context object (the ``this`` variable
    inside the function).
*/
exports.bind = function (context, continuation) {
    if (exports.no(continuation))
        return continuation;
    var result = function () {
        return continuation.apply(context, arguments);
    };
    result.bound = continuation;
    return result;
};

/*** alias
*/
exports.alias = function (self, name, continuation) {
    return function () {
        return continuation.apply(self[name], arguments);
    };
};

/*** aliaser
    returns a function that creates aliases for the methods
    of a given instance.  The alias is polymorphic.
*/
exports.aliaser = function (self) {
    return function (name) {
        return function () {
            return self[name].apply(self, arguments);
        };
    };
};

/*** ed
    returns a past tense (stateless) version
    of a given function.
*/
exports.ed = function (continuation) {
    return function (value) {
        value = exports.copy(value);
        continuation(value);
        return value;
    };
};

/*** eder
    returns an ``ed`` function for a given ``object``.
    The ``ed`` function returns the past-tense or
    "stateless" form of a member function by its name.
    The ``ed`` function creates a copy of the given
    object, applies the stateful member function,
    and returns the result.

    ``eder -> object -> name:String -> arguments* -> result``
*/
exports.eder = function (object) {
    return function (name) {
        return function () {
            var result = exports.copy(object);
            result[name].apply(object, arguments);
            return result;
        };
    };
};

/*** no
    tests whether it would be unsafe to dereference
    members of an object; that is, whether the object
    is ``null`` or ``undefined``.
*/
exports.no = function (object) {
    return object === undefined || object === null;
};

/*** copy
    creates a shallow copy of any copiable object.

    ``copy(value)``

    If the given object provides a user-defined
    ``copy`` method, returns the result of that.

*/
exports.copy = function (object) {
    if (exports.no(object))
        return object;
    if (object.copy && object.copy !== exports.copy)
        return object.copy();
    if (
        object instanceof Number ||
        typeof object == 'number' ||
        typeof object == 'NaN'
    ) {
        /* would you believe that NaN is Not a Number?  Well,
         * it quacks like a duck, so we treat it like a duck. */
        return object.valueOf();
    }
    if (object instanceof Array || object.callee) {
        var result = Array.prototype.slice.call(object, 0);
        if (object.callee)
            result.callee = object.callee;
        return result;
        /* catch Arguments objects as well as Arrays [#arguments]_. */
        /* note that the variadic constructor for Array would not work
         * as a copy constructor since Array.apply([], [0]) would
         * return [undefined] */
    }
    if (object instanceof Function) {
        var result = function () {return object.apply(this, arguments);};
        /* Object.constructor.call didn't work here, surprise surprise */
        for (var key in object)
            if (Object.prototype.hasOwnProperty.call(object, key))
                result[key] = object[key];
        return result;
    }
    if (object instanceof Object) {
        /* note that the Object constructor would not work as a copy
         * constructor since the Object would be referentially equivalent
         * to the old one. */
        /* respect types that inherit from Object by returning
         * an object of the same type */
        var result = new object.constructor();
        for (var key in object)
            if (Object.prototype.hasOwnProperty.call(object, key))
                result[key] = object[key];
        return result;
    }
    return new object.constructor(object);
};

/*** arrayFind
    returns the index of a given value in an array
    or ``-1`` if the value does not exist in the
    array.
*/
if (Array.prototype.indexOf) {
    exports.arrayFind = function (items, value) {
        return items.indexOf(value);
    };
} else {
    exports.arrayFind = function (items, value) {
        for (var index = 0; index < items.length; index++) {
            if (items[index] === value) {
                return index;
            }
        }
        return -1;
    };
}

/*** arrayHas
    returns whether the ``Array``, ``items`` contains
    the given ``value``.

    ``arrayHas(items, value)```
*/
exports.arrayHas = function (items, value) {
    return exports.arrayFind(items, value) >= 0;
};

/*** arrayEach
    a high performance variant of
    ``each`` that accepts only ``Array``s and
    returns an ``Array``.

    ``arrayEach(array, relation)`` or
    ``arrayEach(array, relation, context)``
*/
/* this function is a necessary alternative to
 * each for creating types */
exports.arrayEach = function (array, relation, context) {
    var result = [];
    try {
        for (var i = 0; i < array.length; ++i) {
            result.push(relation.apply(context, [array[i]]));
        }
    } catch (exception) {
        if (exception instanceof exports.StopIteration) {
        } else {
            throw exception;
        }
    }
    return result;
};

/*** arrayWhere
    a high performance variant of ``where``
    that accepts only an ``Array`` and returns
    an ``Array``, rather than any iterable and
    a ``List`` respectively.

    ``arrayWhere(array, relation)`` or
    ``arrayWhere(array, relation, context)``
*/
/* this function is a necessary alternative to
 * where for creating types */
exports.arrayWhere = function (array, relation, context) {
    var result = [];
    try {
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (relation.apply(context, [value])) {
                result.push(value);
            }
        }
    } catch (exception) {
        if (exception instanceof exports.StopIteration) {
        } else {
            throw exception;
        }
    }
    return result;
};

/*** arrayReverse
     - `stateful`
     - `chainable`
*/
exports.arrayReverse = function (array) {
    Array.prototype.reverse.call(array);
    return array;
};

/*** arrayReversed
    returns a new ``Array`` that contains the items
    of a given ``Array`` in reversed order.  This
    function does not affect the state of the given
    array.

     - `stateless`
*/
exports.arrayReversed = exports.ed(exports.arrayReverse);

/*** arrayAny
    returns whether any item of a given array
    is ``true``.
*/
exports.arrayAny = function (array) {
    for (var i = 0; i < array.length; ++i) {
        if (array[i]) {
            return true;
        }
    }
    return false;
};

/*** arrayAll
    returns whether any item of a given array
    is ``true``.
*/
exports.arrayAll = function (array) {
    for (var i = 0; i < array.length; ++i) {
        if (!array[i]) {
            return false;
        }
    }
    return true;
};

/*** arrayAdded
    returns whether all items of a given array
    are ``true``.
*/
exports.arrayAdded = function () {
    var result = [];
    for (var j = 0; j < arguments.length; ++j) {
        var array = arguments[j];
        for (var i = 0; i < array.length; ++i) {
            result.push(array[i]);
        }
    }
    return result;
};

/*** arraySliced
    returns an array of a sliced of an Array
    or Array-like object.

    ``arraySliced(object)`` or
    ``arraySliced(object, start)`` or
    ``arraySliced(object, start, stop)``
*/ /* [#base2]_ */
var arraySlicedPrototype = Array.prototype.slice;
exports.arraySliced = function (object) {
	return arraySlicedPrototype.apply(
        object,
        arraySlicedPrototype.call(arguments, 1)
    );
};

/*** arrayDel
    deletes a value at a given index and moves
    all successive values toward the begining
    to fill the void.  If the user provides an end
    index, deletes all values in a range of indicies.

    accepts:
     - an `Array`
     - a begining index
     - an optional end index

    Indicies may be negative.  If so, the index is an
    offset from the array length.
*/
// Array Remove - By John Resig (MIT Licensed)
exports.arrayDel = function (array, begin, end, step, ordinal) {
    begin = begin < 0 ? array.length + begin : begin;
    if (exports.no(end)) end = begin + 1;
    end = end < 0 ? array.length + end : end;
    if (end < begin) return exports.arrayDel(array, end, begin);
    if (array.length <= begin) throw new exports.KeyError("arrayDel out of bounds");
    if (array.length < end) throw new exports.KeyError("arrayDel out of bounds");
    var remnant = exports.arraySliced(array, end);
    array.length = begin;
    array.push.apply(array, remnant);
    return array;
};


/*** arrayPut
    puts a value at a given index of an array and moves
    all successive elements toward the end one place.
*/
exports.arrayPut = function (array, key, value) {
    array.splice(key, 0, value);
    return array;
};

/*** objectKeys
    returns an ``Array`` of the given object's
    keys.
*/
exports.objectKeys = function (object) {
    var result = [];
    for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key))
            result.push(key);
    }
    return result;
};

/*** objectValues
    returns an ``Array`` of the given object's
    values.
*/
exports.objectValues = function (object) {
    var result = [];
    for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            var value = object[key];
            result.push(value);
        }
    }
    return result;
};

/*** objectItems
    returns an ``Array`` of ``[key, value]`` pairs
    for a given object.  The pairs themselves are
    ``Array`` objects.
*/
exports.objectItems = function (object) {
    var result = [];
    for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            var value = object[key];
            result.push([key, value]);
        }
    }
    return result;
};

/*** objectFind
*/
exports.objectFind = function (object, _value) {
    for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            var value = object[key];
            if (value === _value)
                return value;
        }
    }
    throw TypeError(value);
};

/*** objectUpdate
    copies key value pairs from one object
    over the key value pairs in another object,
    whether they exist or not.
*/
exports.objectUpdate = function (to, from) {
    for (var key in from) {
        if (Object.prototype.hasOwnProperty.call(from, key)) {
            to[key] = from[key];
        }
    }
};

/*** objectComplete
    copies key value pairs from one object
    into another object if no value exists
    for a key.
*/
exports.objectComplete = function (to, from) {
    for (var key in from) {
        if (
            Object.prototype.hasOwnProperty.call(from, key) &&
            !Object.prototype.hasOwnProperty.call(to, key)
        ) {
            to[key] = from[key];
        }
    }
};

/*** beget
    returns an object that "inherits" values from a
    given object using any browser's native
    prototype system.
*/
exports.beget = function (value) {
    if (exports.no(value)) return value;
    var Result = function () {};
    Result.prototype = value;
    var result = new Result();
    return result;
};

/*** stringMul
*/
/* a la http://www.liucougar.net/blog/archives/76 */
/* see: experiment/mul.js#mul6Explorer */
exports.stringMul = function (str, num) {
    var acc = [];
    var strs = [str];
    for (var bit = 1; bit <= num; bit <<= 1) {
        if (bit & num)
            acc.push.apply(acc, strs);
        strs.push.apply(strs, strs);
    }
    return acc.join('');
};

/**
    Exceptions
    ==========
*/

/*** StopIteration
*/
/* stop iteration must be distinct by inheritance from Error
    so that things like the Dict constructor can differentiate
    StopIteration from Error and thus pass the Errors through
    the iteration catch block.
*/
exports.StopIteration = function () {
    if (this.constructor != exports.StopIteration)
        return new exports.StopIteration();
};

/*** stopIteration
    an instance of StopIteration.  Programmers can use this instance
    instead of constructing their own new StopIteration repeatedly.
*/
exports.stopIteration = exports.StopIteration('Stop Iteration');

/*** SkipIteration
*/
exports.SkipIteration = function () {
    if (this.constructor != exports.SkipIteration)
        return new exports.SkipIteration();
};

/*** skipIteration
*/
exports.skipIteration = exports.SkipIteration('Skip Iteration');


/*** KeyError
*/
exports.KeyError = function () {};

/*** ValueError
*/
exports.ValueError = function () {};

/*

    References
    ==========

    .. _[#arguments] http://www.webreference.com/dhtml/column68/
    A hint on detecting whether an object embodies a function call's arguments.

*/


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

