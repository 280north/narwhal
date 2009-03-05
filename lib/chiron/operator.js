/*file chiron src/base/operator.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var boot = require('./boot');
var type = require('./type');

/**
    High Order Functions
    ====================
*/

/*** invoke
    calls/applies a given function, using the given
    arguments::

        ``inovke(a, b, ...z, continuation)``

    For example::

        invoke(1, 2, 3, add) == add(1, 2, 3)

    The interface of this function may change in the
    future to look more like `args`.
*/
exports.invoke = function () {
    /* cannot reuse arguments variable in Safari */
    var args = list.List(arguments);
    var continuation = args.pop();
    return continuation.apply(this, args.to(array));
};

/*** partial
    returns a function that supports partial application based
    on the number of arguments it accepts.  If additional
    arguments are applied to `partial` those are partially
    applied to the function.

    ``partial(function, [argument, [argument, [...]]]) -> function``
*/
exports.partial = function () {
    var outerArgs = list.array(arguments);
    var continuation = outerArgs.shift();
    if (!continuation.partialLength)
        continuation.partialLength = continuation.length;
    var result = function () {
        var args = outerArgs.concat(list.array(arguments));
        if (args.length >= continuation.partialLength) {
            return continuation.apply(this, args);
        } else {
            return exports.partial.apply(this, [continuation].concat(args));
        }
    };
    result.partialLength = continuation.partialLength - outerArgs.length;
    return result;
};

/**
    Logic
    =====
*/

/*** bool
    casts a value of a native or user defined
    type to a boolean `true` or `false`.
    `bool` defers to the `bool` method
    of any type that defines one.

     - `polymorphic`
*/
exports.bool = type.operator(0, 'bool', function (value) {
    if (boot.no(value)) return false;
    if (type.isInstance(value, Function) || type.isInstance(value, Date))
        return true;
    if (type.isInstance(value, Array) || type.isInstance(value, Object))
        return !!list.len(value);
    return !!value;
});


/**
    Arithmetic
    ==========
*/

/*** number
    converts a value of a native or user defined
    type to a number.

     - `polymorphic`
*/
exports.number = type.operator(0, 'number', function (value, radix) {
    if (boot.no(value)) return 0;
    if (type.isInstance(value, String)) return parseInt(value, radix);
    /* this agrees with eq's behavior, so changes here
     * would impact its correctness. */
    return +value;
    /* unary plus exists in JavaScript only for
     * this toNumber conversion */
});

/*** add
    returns the sum of all of its arguments.

     - `stateless`
     - `polymorphic` on `added`
     - `currys` on less than 2 arguments
     - `commutative`
*/
exports.add = type.operator(2, 'added', function (a, b) {
    if (arguments.length > 2) return exports.sum(arguments);
    if (boot.no(a)) return b;
    if (type.isInstance(a, Number)) return a + exports.number(b);
    if (type.isInstance(a, String)) return a + string.string(b);
    if (type.isInstance(a, Date)) return new Date(a.getTime() + b);
    if (type.isInstance(a, Array)) return Array.prototype.concat(a, list.array(b));
    if (type.isInstance(a, Object)) return dict.Dict(a).added(b).object();
});

/*** sub
    subtracts the the later argument from the former.

     - `stateless`
     - `polymorphic` on `subed`
*/
exports.sub = type.operator(2, 'subed', function (a, b) {
    return a - b;
});

/*** neg
    returns the arithmetic negation (negative) of
    a number.

     - `stateless`
     - `olymorphic` on `neged`
*/
exports.neg = type.operator(1, 'neged', function (x) {return -x});

/*** mul
    returns the multiplicative product of all of its arguments.

     - `stateless`
     - `polymorphic` on `muled`
     - `commutative`
*/
exports.mul = type.operator(2, 'muled', function (a, b) {
    if (arguments.length > 2) return exports.product(arguments);
    if (boot.no(a)) return b;
    if (boot.no(b)) return a;
    if (type.isInstance(a, iter.Iterable)) return each.repeat(a, b).sum();
    if (type.isInstance(a, Array)) return each.repeat(a, b).sum();
    if (type.isInstance(a, Number)) return a * exports.number(b);
    /* stringMul is in boot.js */
    if (type.isInstance(a, String)) return boot.stringMul(a, b);
    throw new TypeError(
        "cannot multiply " + string.enquote(type.getTypeName(a)) +
        " with " + string.enquote(type.getTypeName(b)) + "."
    );
});

/*** div
    returns the quotient of the former over the latter argument.

     - `stateless`
     - `polymorphic` on `dived`
*/
exports.div = type.operator(2, 'dived', function (a, b) {
    return a / b;
});

/*** mod
    The ``%`` operator in JavaScript returns the remainder of ``a / b``,
    but differs from some other languages in that the result will
    have the same sign as the dividend. For example,
    ``-1 % 8 == -1``, whereas in some other languages
    (such as Python) the result would be 7. This function emulates
    the more correct modulo behavior, which is useful for certain
    applications such as calculating an offset index in a circular
    list.

     - accepts a `Number`, the dividend
     - accepts a `Number`, the divisor
     - returns a `Number`, ``a % b`` where the result is between
       0 and ``b`` (either ``0 <= x < b`` or ``b < x <= 0``,
       depending on the sign of ``b``).
     - `stateless`
     - `polymorphic` on `moded`
*/
/* some documentation and code from Google Doctype */
exports.mod = type.operator(2, 'moded', function (a, b) {
    var r = a % b;
    /*
        If r and b differ in sign, add b to wrap the result to the
        correct sign.
    */
    return (r * b < 0) ? r + b : r;
});

/*** pow
    returns the latter argument exponentiated on the former argument.

     - `stateless`
     - `polymorphic` on `powed`
     - `commutes` to `exp`
*/
exports.pow = type.operator(2, 'powed', Math.pow);

/*** exp
    returns the former argument exponentiated on the latter argument.

     - `statless`
     - `polymorphic` on `exped`
     - `commutes` to `pow`
*/
exports.exp = type.operator(2, 'exped', function (a, b) {
    return Math.pow(b, a);
});

/*** sum
    returns the arithmetic sum of the values in an `iterable`
    using `add`.

    accepts:
     - ``values`` an iterable of `addable` values.
     - ``basis`` an optional arithmetic identity.
       This defines the sum of empty ``values``, `undefined`
       by default.  Zero is an appropriate arithmetic identity
       for numbers, or an empty string or list for their
       respective types.

     - `stateless`
     - `polymorphic` on `added` via `add`
*/
exports.sum = function (values, basis) {
    var result = basis;
    each.forEach(values, function (value) {
        result = exports.add(result, value);
    });
    return result;
};

/*** product
    returns the multiplicative product of an iterable using `mul`.
    polymorphic by an override on `muled`.

    Accepts
     - ``values`` an iterable of multipliables.
     - ``basis`` an optional multiplicative identity.
       This defines the product of empty ``values``, ``undefined``
       by default.  One is an appropriate multiplicative
       identity for a product of numbers.
*/
exports.product = function (values, basis) {
    var result = basis;
    each.forEach(values, function (value) {
        result = exports.mul(result, value);
    });
    return result;
};


/**
    Comparison
    ==========
*/

/*** not
    returns the logical negation of a value.

     - `polymorphic` on `not` or via `bool`
*/
exports.not = type.operator(1, 'not', function (x) {
    return !exports.bool(x);
});

/*** and
    returns the logical intersection of two values.

     - `polymorphic` on `and` or via `bool`
     - `currys` for fewer than 2 arguments
*/
exports.and = type.operator(2, 'and', function (a, b) {
    return exports.bool(a) && exports.bool(b);
});

/*** or
    returns the logical union of two values.

     - `polymorphic` on `or` or via `bool`
     - `currys` for fewer than 2 arguments
*/
exports.or = type.operator(2, 'or', function (a, b) {
    return exports.bool(a) || exports.bool(b);
});

/*** xor
    returns the logical exclusive union of two values.

     - `polymorphic` on `xor` or via `bool`
     - `currys` for fewer than 2 arguments
*/
exports.xor = type.operator(2, 'xor', function (a, b) {
    return exports.bool(a) != exports.bool(b);
});

/*** eq
    equal.
    returns whether two objects are naturally equal.

     - identical objects (in memory) are equivalent.
     - values from the class of `Undefined` and `Null`
       are all equivalent to one another.
     - values from the class of `Function`, `String`,
       `Number`, and `Boolean` are all equivalent
       if they share the same value and type
       (JavaScript's strict equivalence).
     - `Array` objects are naturally equivalent if
       all of their values, the order of their values,
       and the quantities of values are equal.
     - `Object` instances are naturally equivalent
       if they have exactly the same values.
     - `Date` objects are naturally equivalent if
       their UTC strings are equal.

     - `polymorphic` on `eq`
*/
exports.eq = type.operator(2, 'eq', function (a, b) {
    if (a === b) return true;
    if (boot.no(a)) return boot.no(b);
    if (
        type.isInstance(a, Function) ||
        type.isInstance(a, String) ||
        type.isInstance(a, Number) ||
        type.isInstance(a, Boolean)
    )
        return a === b;
    if (type.isInstance(a, Date))
        return (
            type.isInstance(b, Date) &&
            a.toUTCString() == b.toUTCString()
        );
    if (type.isInstance(a, Array))
        return list.List(a).eq(b);
    if (type.isInstance(a, Object))
        return dict.Dict(a).eq(b);
    return false;
});

/*** is
    returns object identity.
    primitives (elemental data instances) 
    are never identical; this include
    'Undefined', 'Null', `String`, `Number`,
    `Boolean`, and `Date` instances.

     - `polymorphic`
     - `stateless`
*/
exports.is = type.operator(2, 'is', function (a, b) {
    if (
        boot.no(a) ||
        type.isInstance(a, String) || 
        type.isInstance(a, Number) ||
        type.isInstance(a, Boolean) ||
        type.isInstance(a, Date)
    )
        return false;
    return a === b;
});

/*** ne
    not equal.
    returns whether two objects are not naturally
    equivalent.

     - `polymorphic` on `ne` or via `eq`
*/
exports.ne = type.operator(2, 'ne', type.to(exports.eq, exports.not));

/*** lt
    less than.
    returns whether the former argument is naturally less than the
    latter argument.

     - `polymorphic`
     - `not-commutative`
*/
exports.lt = type.operator(2, 'lt', function (a, b) {
    if (boot.no(a) != boot.no(b)) return boot.no(a) > boot.no(b);
    if (type.isInstance(a, Array)) return list.List(a).lt(b);
    if (type.isInstance(a, String) || type.isInstance(b, String)) return string.string(a) < string.string(b);
    return exports.number(a) < exports.number(b);
});

/*** gt
    greater than.
    returns whether the former argument is greater than the
    latter argument.

     - `polymorphic`
     - `not-commutative`
*/
exports.gt = type.operator(2, 'gt', function (a, b) {
    return !(exports.lt(a, b) || exports.eq(a, b));
});

/*** le
    less than or equal.
    returns whether the former argument is less than or equal
    to the latter argument.

     - `polymorphic`
     - `not-commuative`
*/
exports.le = type.operator(2, 'le', function (a, b) {
    return exports.lt(a, b) || exports.eq(a, b);
});

/*** ge
    greater than or equal.
    returns whether the former argument is greater than or
    equal to the latter argument.

     - `polymorphic`
     - `not-commuative`
*/
exports.ge = type.operator(2, 'ge', type.to(exports.lt, exports.not));

/*** compare
    returns a number that is less than, equal to, or greater than
    0 reflecting the relationship between the former and
    latter argument.

     - `polymorphic` on `compare` or via `eq` or `lt`
     - `comparator`
*/
exports.compare = type.operator(2, 'compare', function (a, b) {
    if (boot.no(a) != boot.no(b)) return boot.no(b) - boot.no(a);
    if (type.isInstance(a, Number) && type.isInstance(b, Number)) return a - b;
    return exports.eq(a, b) ? 0 : exports.lt(a, b) ? -1 : 1;
});

/*** desc
    a reverse `comparator`.

     - `polymorphic` on `compare` and `neg`
*/
exports.desc = type.to(exports.compare, exports.neg);

/*** by
    returns a `comparator` that compares
    values based on the values resultant from
    a given `relation`.
    accepts a `relation` and an optional comparator.

    To sort a list of objects based on their
    "a" key::

        objects.sort(by(get("a")))

    To get those in descending order::

        objects.sort(by(get("a")), desc)

    `by` returns a comparison function that also tracks
    the arguments you used to construct it.  This permits
    `sort` and `sorted` to perform a Schwartzian transform
    which can increase the performance of the sort
    by a factor of 2.
*/
exports.by = function (relation, compare) {
    if (boot.no(compare))
        compare = exports.compare;
    var comparator = function (a, b) {
        a = relation(a);
        b = relation(b);
        return compare(a, b);
    };
    comparator.by = relation;
    comparator.compare = compare;
    return comparator;
};

/*** naturally
    a `comparator` that sorts strings in "natural"
    as opposed to "lexical" order.  That is "2"
    appears before "10" in natural order (in lexical
    order, "10" appears before "2" since that is the
    order of their respective first characters).
    `naturally` uses `splitName` to break a string into words,
    then sorts textual words lexically, and numeric
    words numerically.
*/
exports.naturally = exports.by(function (value) {
    return string.splitName(value).each(function (word) {
        if (word == '' + Number(word))
            return Number(word);
        return word;
    });
});

/*** pass
    returns the given argument.

    Accepts a single argument.

    `pass` is the ``K`` combinator of the
    lambda calculus.
*/
exports.pass = function (x) {return x;};

var iter = require('./iter');
var list = require('./list');
var set = require('./set');
var dict = require('./dict');
var each = require('./each');
var range = require('./range');
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

