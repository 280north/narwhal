/*file chiron src/base/iter.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var boot = require('./boot');
var type = require('./type');
var operator = require('./operator');

/**
    Iteration
    =========
*/

/*** Iterable
    a mixin that adds convenience functions to types
    that implement `iter`.
*/

exports.Iterable = type.type(function Iterable(self, supr, alias, ed) {

    /* create methods dynamically */
    for (var i = 0; i < exports.Iterable.memberNames.length; i++) {
        var name = exports.Iterable.memberNames[i];
        self[name] = type.method(
            each[name] || 
            type[name] ||
            list[name] ||
            dict[name] ||
            operator[name] ||
            set[name] ||
            string[name] ||
            exports[name],
            name
        );
    }

    /**** reduced */
    self.reduced = ed('reduce');

    /**** flattened */
    self.flattened = alias('flatten');

    /**** added */
    self.added = alias('chain');

    /**** nextCatch
        same as `next` except that it 
        returns `undefined` instead of throwing
        a `StopIteration` eexception.

        alternatly, accepts a default value
        to return instead of throwing `StopIteration`.
    */
    self.nextCatch = function (defaultNext) {
        try {
            return self.next();
        } catch (exception) {
            if (type.isInstance(exception, boot.StopIteration))
                return defaultNext;
            throw exception;
        }
    };

    /**** iter
        since iterations are obviously iterable, returns
        itself.  If you need a copy of an iteration,
        look into using `tee`.
    */
    self.iter = function () {
        return self;
    };

    /**** len
        returns the number of values in the iteration.

         - `stateful` (consumes the iteration)
    */
    self.len = function () {
        var length = 0;
        each.forEach(self, function () {
            length++;
        });
        return length;
    };

    /**** list
        creates a `List` of values from this iteration.

         - `stateful` (consumes the iteration)
         - `chainable`
    */
    self.list = type.method(list.List);

    /**** dict
        creates a `Dict` dictionary from the values
        or items (tuples) in this iteration.

         - `stateful` (consumes the iteration)
         - `chainable`
    */
    self.dict = type.method(dict.Dict);

    /**** unique
        returns a `Set` (collection of unique values)
        constructed from the values in this iteration.

         - `stateful` (consumes the iteration)
         - `chainable`
    */
    self.unique = type.method(set.Set);

    /**** string
        returns a string of the joined values
        in the iteration.

         - `stateless`
    */
    self.string = type.method(string.join);

    /**** number
        returns the length of an iterable object.

         - `stateful` (consumes an iteration)
         - `chainable`
    */
    self.number = alias('len');

    /**** bool
        returns whether the iteraction contains any
        values.

         - `stateful` (consumes one iteration)
    */
    self.bool = function () {
        try {
            exports.iter(self).next();
        } catch (exception) {
            if (type.isInstance(exception, boot.StopIteration)) {
                return false;
            } else {
                throw exception;
            }
        }
        return true;
    };

    /**** array
        constructs an `Array` from the values in this
        iteration.

         - `stateful` (consumes one iteration)
    */
    self.array = type.method(list.iterArray);

    /**** object
        returns an `Object` that represents an associative 
        array of the items in this iteration, or items implied
        by the index of each value.

         - `stateless`
    */
    self.object = function () {
        var result = {};
        self.eachApply(function (key, value) {
            result[key] = value;
        });
        return result;
    };

    /**** sliced
        accepts either:
        
        - an optional ``start`` offset Number.
        - ``length`` Number of items.

    */
    self.sliced = function () {
        var iteration = exports.iter(self);
        var start, length;
        if (arguments.length == 1) {
            start = 0;
            length = arguments[0];
        } else {
            start = arguments[0];
            length = arguments[1];
        }
        each.forTimes(start, iteration.next);
        return each.times(length, iteration.next);
    };

    /**** range
        accepts the same arguments as the `Range` object
        and returns a list of the values corresponding
        to the indicies provided by that range by consuming
        an iteration of this object.
    */
    self.range = function () {
        var iteration = exports.iter(self);
        var accumulator = [];
        return range.Range.apply(undefined, arguments).each(function (n) {
            while (accumulator.length <= n)
                accumulator[accumulator.length] = iteration.next();
            return accumulator[n];
        });
    };

});

exports.Iterable.memberNames = [

    /**** forEach */ 'forEach',
    /**** forEachApply */ 'forEachApply',

    /**** eachIter */ 'eachIter',
    /**** each */ 'each',
    /**** eachApplyIter */ 'eachApplyIter',
    /**** eachApply */ 'eachApply',

    /**** whereIter */ 'whereIter',
    /**** where */ 'where',
    /**** whereApplyIter */ 'whereApplyIter',
    /**** whereApply */ 'whereApply',

    /**** args */ 'args',

    /**** zipIter */ 'zipIter',
    /**** zip */ 'zip',
    /**** transposeIter */ 'transposeIter',
    /**** transpose */ 'transpose',
    /**** enumerateIter */ 'enumerateIter',
    /**** enumerate */ 'enumerate',

    /**** reduce */ 'reduce',
    /**** cycle */ 'cycle',

    /**** flatten */ 'flatten',
    /**** compactIter */ 'compactIter',
    /**** compact */ 'compact',
    /**** withoutIter */ 'withoutIter',
    /**** without */ 'without',

    /**** group */ 'group',

    /**** sorted */ 'sorted',
    /**** reversed */ 'reversed',
    ///**** reversedIter */ 'reversedIter',

    ///**** added */ 'added',
    /**** chain */ 'chain',

    /**** min */ 'min',
    /**** max */ 'max',
    /**** sum */ 'sum',
    /**** product */ 'product',

    /**** all */ 'all',
    /**** any */ 'any',

    /**** join */ 'join',

    /**** object */ 'object'

];

/*** Iter
    an iteration.
    constructs an iterator instance given a successor
    function.  For example::

        var i = 0;
        Iter(function () {
            if (i++ < 10) {
                return i;
            } else 
                throw StopIteration();
            }
        });


    accepts:
     - a `next` funciton, one that returns the next
       value in an iterator or throws a `StopIteration`.
     - an optional ``hasNext`` function, one that
       returns ``true``, ``false``, or ``undefined``.
       By default, ``hasNext`` will always return
       ``undefined``.

*/
exports.Iter = type.type([exports.Iterable], function (self, supr) {
    var next;
    var hasNext;

    self.init = function (_next, _hasNext) {
        next = _next;
        hasNext = _hasNext;
        supr.init.apply(undefined, boot.arraySliced(arguments, 2));
    };

    /**** next
        returns the next element of the iteration.  Throws
        `StopIteration` if there are no more elements
        available.
    */
    self.next = function () {
        return next.call(self);
    };

    /**** hasNext
        returns whether the iteration has a next
        value.  This may be used to avoid using exceptions
        to probe for the end of an iteration.
        If the iteration cannot predict whether it
        has a successive value, returns ``undefined``.

        There are currently no implementations that use
        ``hasNext`` nor corresponding optimizations to 
        use ``hasNext`` implementations.
    */
    self.hasNext = function () {
        if (hasNext)
            return hasNext.call(self);
    };

});

/*** iter
    returns an `iterator` for any iterable type.  Defers to
    any user defined `iter` member function, if provided.
    `Iterable` types include `Object`, for which the iteration
    yields key value pairs, `Array`, `String`, for which
    the iteration yields the successive characters, and DOM
    elements or any type guaranteeing ``firstChild`` and
    ``nextSibling``.

     - `polymorphic`
*/
exports.iter = type.operator(0, 'iter', function (values) {
    if (boot.no(values)) return exports.Iter(function () {throw boot.stopIteration});
    if (type.isInstance(values, String)) return exports.stringIter(values);
    if (type.isInstance(values, Array)) return exports.arrayIter(values);
    if (
        environment.window &&
        environment.window.Node ?
        type.isInstance(values, environment.window.Node) :
        !boot.no(values.firstChild)
    )
        return exports.elementIter(values);
    /* some arrays appear to be undetectable by type; consider ways to
     * remedy this in another way, please */
    if (!boot.no(values.length)) return exports.arrayIter(values);
    if (type.isInstance(values, Object)) return exports.objectIter(values);
    throw new Error("cannot iterate " + type.repr(values));
});

/*** objectIter
    constructs an iteration for native
    JavaScript `Object` instances.
*/
exports.objectIter = function (items) {
    var keys = boot.objectKeys(items);
    var i = 0;
    return exports.Iter(function () {
        if (i < keys.length) {
            var key = keys[i++];
            return [key, items[key]];
        } else {
            throw boot.stopIteration;
        }
    });
};

/*** arrayIter
    constructs an iteration for native
    JavaScript `Array` or array-like
    instances.  Works for any type that
    provides a ``length`` attribute
    and ``array[indexing]`` for successive
    numbers.
*/
exports.arrayIter = function (values) {
    var i = 0;
    return exports.Iter(function () {
        if (i < values.length) {
            return values[i++];
        } else {
            throw boot.stopIteration;
        }
    });
};

/*** stringIter
    construts an iteration for the native
    JavaScript `String` type.

    `stringIter` is necessary because
    Internet Explorer JScript does not
    support string character indexing,
    necessitating the use of ``charAt``.
*/
exports.stringIter = function (values) {
    var i = 0;
    return exports.Iter(function () {
        if (i < values.length) {
            return values.charAt(i++);
        } else {
            throw boot.stopIteration;
        }
    });
};

/*** nodeIter
    constructs an iteration of the child nodes
    of a DOM node.
*/
exports.nodeIter = function (values) {
    var element = values.firstChild;
    return exports.Iter(function () {
        var result = element;
        if (element) element = element.nextSibling;
        if (result) return result;
        else throw boot.stopIteration;
    });
};

/*** elementIter
    returns an iteration of the tag children
    of a DOM element or element-like objects.
    Works for any type that provides
    ``firstChild`` and has children that
    provide ``nextSibling`` attributes.
*/
exports.elementIter = function (values) {
    var element = values.firstChild;
    return exports.Iter(function () {

        while (element && element.nodeType != 1)
            element = element.nextSibling;

        var result = element;
        if (element) element = element.nextSibling;
        if (result) return result;
        else throw boot.stopIteration;
    });
};

var list = require('./list');
var set = require('./set');
var dict = require('./dict');
var each = require('./each');
var string = require('./string');
var range = require('./range');

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

