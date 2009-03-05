/*file chiron src/base/list.js */
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
var iter = require('./iter');

/**
    Lists
    =====
*/

/*** List 
    is `Iterable`

    Different than Python:

    - append: `push`
    - extend: `add`
    - count: `len`
    - index: `find`
    - insert: `put`
    - remove: `del`

    Same as Python:

    - `pop`
    - `sort`
    - `reverse`

*/
exports.List = type.type([iter.Iterable], function List(self, supr, alias, ed) {

    var data = [];

    self.init = function (values) {
        if (!boot.no(values)) {
            each.forEach(values, function (value) {
                data.push(value);
            });
        }
        supr.init();
    };

    /**** iter
        - `stateless`
    */
    self.iter = function () {
        return iter.arrayIter(data);
    };

    /**** len
        - `stateless`
    */
    self.len = function () {
        return data.length;
    };

    /**** push
        - `stateful`
        - `chainable`
    */
    self.push = function (value) {
        data.push(value);
        return self;
    };

    /**** pop
        - `stateful`
    */
    self.pop = function () {
        if (data.length) {
            return data.pop();
        } else {
            throw new boot.ValueError("No elements on the stack.");
        }
    };

    /**** unshift
        - `stateful`
        - `chainable`
    */
    self.unshift = function (value) {
        data.unshift(value);
        return self;
    };

    /**** shift
        - `stateful`
    */
    self.shift = function () {
        if (data.length) {
            return data.shift();
        } else {
            throw new boot.ValueError("No elements in the queue.");
        }
    };

    /**** reverse
        - `stateful`
        - `chainable`
    */
    self.reverse = function () {
        data.reverse();
        return self;
    };

    /**** reversed
        - `stateless`
    */
    self.reversed = ed('reverse');

    /**** reversedIter
        - `stateless`
    */
    self.revsersedIter = function () {
        var i = data.length;
        return iter.Iter(function () {
            if (i == 0) {
                throw boot.stopIteration;
            } else {
                return data[--i];
            }
        });
    };

    /**** sort
        - `stateful`
        - `chainable`
    */
    self.sort = function (compare) {
        if (boot.no(compare))
            compare = operator.compare;
        if (compare.by) {
            /* schwartzian transform optimization */
            data = boot.arrayEach(
                boot.arrayEach(data, function (datum) {
                    return [compare.by(datum), datum];
                }).sort(function (a, b) {
                    return operator.compare(a[0], b[0]);
                }),
                function (pair) {
                    return pair[1];
                }
            );
            
        } else {
            data.sort(compare);
        }
        return self;
    };

    /**** sorted
        - `stateless`
        - `chainable`
    */
    self.sorted = ed('sort');

    /**** slice
        - `stateful`
        - `chainable`
    */
    self.slice = function () {
        /* todo: resolve whether slice will behave like Python or Perl */
        data = data.slice.apply(data, arguments);
        return self;
    };

    /**** sliced
        - `stateless`
        - `chainable`
    */
    self.sliced = ed('slice');

    /**** splice
        - `stateful`
    */
    self.splice = function () {
        return exports.List(data.splice.apply(data, arguments));
    };

    /**** spliced
        - `stateless`
        - `chainable`
    */
    self.spliced = ed('splice');

    /**** clear
        - `stateful`
        - `chainable`
    */
    self.clear = function () {
        data = [];
        return self;
    };

    /**** first
        - `stateless`
    */
    self.first = function (n) {
        if (!data.length) {
            throw new boot.KeyError(0);
        }
        if (boot.no(n))
            return data[0];
        return self.slice(0, n);
    };

    /**** last
        - `stateless`
    */
    self.last = function (n) {
        if (!data.length) {
            throw new boot.KeyError(-1);
        }
        if (boot.no(n)) return data[data.length - 1];
        return self.slice(data.length - n, data.length);
    };

    /**** begins
        returns whether the first elements of
        a given list-like-object are equal, by way of `eq`,
        the respective elements in this list.

        In Python, this function is called ``startswith``.
        This divergence from Python nomenclature is
        a matter of idealism.  Ideally the semantic group
        of `start`, `stop`, `pause`, `resume`,
        and `run` are all temporal verbs, whereas the
        semantic group `begins`, `ends`, `first`,
        `last`, and such all apply to the state of
        spatial segments or lists.

        - `stateless`
    */
    self.begins = function (other) {
        var iteration = iter.iter(other);
        var result = each.zipIter(self, iteration).eachApplyIter(operator.eq).all();
        return iteration.len() == 0 && result;
    };

    /**** ends
        returns whether the last elements of a given
        list-like-object are equal, by way of `eq`,
        the respective elements in this list.

        In Python, this function is called ``endsWith``.
        See ``startsWith`` for the rationale.

        - `stateless`
    */
    self.ends = function (other) {
        var iteration = iter.iter(exports.reversed(other));
        var result = each.zipIter(self.reversed(), iteration).eachApplyIter(operator.eq).all();
        return iteration.len() == 0 && result;
    };

    /**** reduce
        reduce is an in place operation.
        see reduced for a stateless variant

        - `stateful`
        - `chainable`
    */
    self.reduce = function (recur) {
        while (data.length > 1) {
            data.unshift(
                recur(
                    data.shift(),
                    data.shift()
                )
            )
        }
        return self;
    };

    /**
        Dict
        ----
    */

    /**** keysIter
        - `stateless`
    */
    self.keysIter = function () {
        return range.range(data.length).iter();
    };

    /**** keys
        - `stateless`
    */
    self.keys = function () {
        return range.range(data.length).to(set.Set);
    };

    /**** valuesIter
        - `stateless`
    */
    self.valuesIter = alias('iter');

    /**** values
        - `stateless`
    */
    self.values = alias('copy');

    /**** itemsIter
        - `stateless`
    */
    self.itemsIter = function () {
        var key = 0;
        return each.eachIter(data, function (value) {
            return [key++, value];
        });
    };

    /**** items
        - `stateless`
    */
    self.items = function () {
        return self.itemsIter().to(exports.List);
    };

    /**** get
        - `stateless`
    */
    self.get = function (key, value) {
        if (!type.isInstance(key, Number)) {
            throw new boot.KeyError(key);
        } else if (key < data.length) {
            return data[key];
        } else {
            if (arguments.length < 2) {
                throw new boot.KeyError(key);
            } else {
                return value;
            }
        }
    };

    /**** set
        - `stateful`
        - `chainable`
    */
    self.set = function (key, value) {
        data[key] = value;
        return self;
    };

    /**** put
        displaces the item at a given index, sending
        successive elements down the line.

        - `stateful`
        - `chainable`
    */
    self.put = function (key, value) {
        boot.arrayPut(data, key, value);
        return self;
    };

    /**** cut
        - `stateful`
    */
    self.cut = function (key) {
        var result = self.get(key);
        self.del(key);
        return result;
    };

    /**** del
        - `stateful`
        - `chainable`
    */
    self.del = function (begin, end) {
        boot.arrayDel(data, begin, end);
        return self;
    };

    /**** has
        returns whether the list contains
        a given value.

        - `stateless`
    */
    self.has = function (needle) {
        for (var key = 0; key < data.length; ++key) {
            var value = data[key];
            if (operator.eq(needle, value)) {
                return true;
            }
        }
        return false;
    };

    /**** hasKey
        returns whether the list contains a value
        at a given index.

        - `stateless`
    */
    self.hasKey = function (key) {
        return type.isInstance(key, Number) && key < data.length;
    };

    /**** hasValue
        retunrs whether the list contains
        a given value.
        Uses `has`.

        - `stateless`
    */
    self.hasValue = alias('has');

    /**** find
        returns the first index of a given value
        in the list, or throws a `ValueError`
        if none can be found.

        - `stateless`
    */
    self.find = function (value, findEq) {
        if (boot.no(findEq)) findEq = operator.eq;
        for (var key = 0; key < data.length; ++key) {
            if (findEq(data[key], value)) {
                return key;
            }
        }
        throw new boot.ValueError(value);
    };

    /**** findReverse
        returns the last index of a given value
        in the list, or throws a `ValueError`
        if none can be found.

        - `stateless`
    */
    self.findReverse = function (value) {
        for (var key = data.length - 1; key >= 0; --key) {
            if (operator.eq(data[key], value)) {
                return key;
            }
        }
        throw new boot.ValueError(value);
    };


    self.insert = alias('push');
    self.retrieve = type.method(dict.retrieve);
    self.remove = type.method(dict.remove);
    self.discard = type.method(dict.discard);

    /**
        Arithmetic
        ----------
    */

    /**** add
        - `stateful`
        - `chainable`
    */
    self.add = function (values) {
        each.each(values, function (value) {
            data.push(value);
        });
        return self;
    };

    /**** added
        - `stateless`
        - `chainable`
    */
    self.added = ed('add');

    /**** eq
        - `stateless`
    */
    self.eq = function (other) {
        if (self == other) return true;
        if (type.isInstance(other, Array) || type.isInstance(other, iter.Iterable))
            return (
                self.len() == exports.len(other) &&
                self.zipIter(other).eachApplyIter(operator.eq).all()
            );
        return false;
    };

    /**** lt
        - `stateless`
    */
    self.lt = function (other) {
        /*todo condense List.lt */
        if (self == other) return false;
        var a, as = self.iter();
        var b, bs = iter.iter(other);
        while (true) {
            a = as.nextCatch();
            b = bs.nextCatch();
            if (boot.no(a) && boot.no(b)) return false;
            if (operator.eq(a, b)) continue;
            if (operator.lt(a, b)) return true;
            return false;
        }
        return false;
    };

    /**
        Logic
        ---------------
    */

    /**
        String
        ------
    */

    /**** join
        - `stateless`
    */
    self.join = function (delimiter) {
        if (boot.no(delimiter)) delimiter = '';
        return data.join(delimiter);
    };


    /**
        Base
        ----
    */

    /**** repr
        - `stateless`
    */
    self.repr = function (depth, memo) {
        return self.getTypeName() + '(' + type.arrayRepr(data, depth, memo) + ')';
    };

    /**
        Conversions
        -----------
    */

    /**** array
        - `stateless`
    */
    self.array = function () {
        return boot.copy(data); /* copies the internal array */
    };

    /**** hash
        - `stateless`
    */
    self.hash = function () {
        return each.eachIter(self, function (value) {
            return type.hash(value);
        }).join(',');
    };

});

/*** list
    constructs a List from any given iterable.

    polymorphic: define a `list` or `iter` member function.
*/
exports.list = type.operator(0, 'list', exports.List);

/*** array
    constructs a native JavaScript `Array` from
    any iterable.

    - `polymorphic` on `array` or `iter`
*/
exports.array = type.operator(0, 'array', function (value) {
    if (type.isInstance(value, Array)) return boot.copy(value);
    if (type.isInstance(value, iter.Iterable)) return exports.iterArray(value);
    return exports.List(value).to(exports.array);
});

/*** iterArray
    converts an `Iterable` to an `Array`.
*/
exports.iterArray = function (value) {
    value = iter.iter(value);
    var result = [];
    each.forEach(value, function (value) {
        result[result.length] = value;
    });
    return result;
};

/*** len
    - `polymorphic`
*/
exports.len = type.operator(1, 'len', function (values) {
    if (boot.no(values)) throw TypeError(values + " has no length.");
    if (values.length !== undefined) return values.length;
    if (type.isInstance(values, Object)) return boot.objectKeys(values).length;
    throw TypeError(type.repr(values) + " have no length.");
});

/*** reversed
    returns a `List` of the values from an `Iteration`
    in reversed order.

    - `stateless`
*/
exports.reversed = function (values) {
    return exports.list(values).reversed();
};

/*** sorted
    returns a `List` of the values in a given `Iteration` in
    sorted order.  Accepts an optional override of `compare`.

    - `stateless`
*/
exports.sorted = function (values, compare) {
    var object = exports.list(values);
    return object.sort.apply(object, boot.arraySliced(arguments, 1));
};

/*** slice
    - `polymorphic`
    - `not-curry`
    - `stateless`
*/
exports.slice = type.operator(0, 'sliced', function (value, start, stop) {
    if (boot.no(value)) throw TypeError("Cannot slice " + value);
    if (type.isInstance(value, Array)) return boot.arraySliced(value, start, stop);
    if (type.isInstance(value, String)) return value.slice(start, stop);
    throw TypeError("Cannot slice " + type.getTypeName(value));
});

/*todo splice */

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

