/*file chiron src/base/each.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

var boot = require('./boot');
var type = require('./type');
var operator = require('./operator');

/** 

    Operating on Iterables
    ======================

*/

/*** forEach
    calls a function for each value in a given iteration,
    a variant of `each` that does not return a `List`
    of results.

    Accepts:

    - ``values``, an iterable object
    - ``relation``, a callable object that accepts an ``value``

*/
/*
    Also accepts, but is not guaranteed to accept,
    a `collect` argument which is used to generalize
    the following consuming iterators whether they
    collect and return their results or not.
*/
exports.forEach = function (values, relation, collect) {

    var results;

    if (collect)
        results = list.List();

    var iteration = iter.iter(values);

    try {
        /*todo optimize for Arrays with or without collection */
        while (true) {
            try {
                var result = relation.call(this, iteration.next());
                if (collect) {
                    results.push(result);
                }
            } catch (exception) {
                if (type.isInstance(exception, boot.SkipIteration)) {
                } else {
                    throw exception;
                }
            }
        }
    } catch (exception) {
        if (type.isInstance(exception, boot.StopIteration)) {
        } else {
            throw exception;
        }
    }

    if (collect)
        return results;
    return values;
};

/*** forEachApply
    iterates over an iteration of arrays, calling a given
    function with each array as variadic arguments.
    The iterands may be any iterable; they will be
    converted to arrays.

    Accepts:

    - an `iterable` object that contains 
      iterable arguments objects.
    - a `Function`

    returns the original iterable.
*/
exports.forEachApply = function (values, relation) {
    return exports.forEach.call(this, values, function (value) {
        relation.apply(this, list.array(value));
    });
};

/*** each
    returns a `List` of values produced from a
    given iteration and a relation on each value.

    Accepts:

    - an `iterable` containing source values.
    - a `relation`, a function that accepts one
      value from some domain and returns a
      corresponding value in a range.

    `Dict` objects are relations by virtue of
    their callable behavior.  Dictionary lookup
    can be performed by calling the dictionary
    like a function, passing in a key.
*/
exports.each = function (values, relation) {
    return exports.forEach.call(this, values, relation, true);
};

/*** eachIter
    returns an iteration that produces values
    through a relation from a given iterable.
    This is a lazy form of `each`; it consumes
    only as many values from the source as are
    consumed by the user.  The source iteration
    may be indefinite, like the Fibonacci
    Sequence.
*/
exports.eachIter = function (values, relation) {
    var iteration = iter.iter(values);
    var context = this;
    return iter.Iter(function () {
        return relation.call(context, iteration.next());
    });

};

/*** eachApplyIter
*/
exports.eachApplyIter = function (values, relation) {
    return exports.eachIter.call(this, values, function (value) {
        return relation.apply(this, list.array(value));
    });

};

/*** eachApply
*/
exports.eachApply = function () {
    return list.List(exports.eachApplyIter.apply(this, arguments));
};

/*** whereIter
*/
exports.whereIter = function (values, relation) {
    var iteration = iter.iter(values);
    var context = this;
    return iter.Iter(function () {
        while (true) {
            var value = iteration.next();
            if (relation.apply(context, [value])) {
                return value;
            }
        }
        /*
            the infinite while loop, above, will run until it
            either returns, or iteration.next() throws a
            StopIteration.  Or...it will run forever, but in
            any case, execution will never make it down to
            this return.
        */
        return;
    });
};

/*** where
*/
exports.where = function () {
    return list.List(exports.whereIter.apply(this, arguments));
};

/*** whereApplyIter
*/
exports.whereApplyIter = function (values, relation) {
    return exports.whereIter.call(this, values, function (value) {
        return relation.apply(this, list.array(value));
    });
};

/*** whereApply
*/
exports.whereApply = function () {
    return list.List(exports.whereApplyIter.apply(this, arguments));
};

/*** mapIter
*/
exports.mapIter = function (relation, values) {
    /* permute the arguments */
    return exports.eachIter.call(this, values, relation);
};

/*** map

    Accepts:

    - a relation `Function`
    - iterable values

    returns a `List` of respective values.

*/
exports.map = function (relation, values) {
    return exports.forEach.call(this, values, relation, true);
};

/*** forTimes

    Accepts:

    - a number of times to call a function
    - a function or relation that may accept a number
      corresponding to the iteration number
      starting at zero.
    
    returns a range starting at 0 and
    as long as the number of times the
    function was called.

*/
exports.forTimes = function (n, relation) {
    return exports.forEach.call(this, range.range(n), relation);
};

/*** timesIter
    
    Accepts:

    - a number of times to call a function
    - a relation that may accept the iteration
      number, starting at 0.

    returns an `Iter`

*/
exports.timesIter = function (n, callback) {
    return exports.eachIter.call(this, range.range(n), callback);
};

/*** times

    Accepts:

    - a number of times to call a function
    - a relation that may accept the iteration
      number, starting at 0.

    returns a `List`

*/
exports.times = function () {
    return list.List(exports.timesIter.apply(this, arguments));
};

/* transposes for iterations and tables */ 

/* all transposition functions really boil down to one function: */

/*** transposeIter
    returns an iteration of arrays, a row of elements for
    each column of a provided table.

    - accepts an `iterable` of iterables.
*/
exports.transposeIter = function (table) {
    if (arguments.length < 1) {
        throw new TypeError("transposeIter requires a table argument");
    };
    var iterations = exports.each(table, function (row) {
        return iter.iter(row);
    });
    if (iterations.len() < 1) {
        return iter.iter();
    }
    return iter.Iter(function () {
        var exception;
        var result = exports.each(iterations, function (iteration) {
            try {
                return iteration.next();
            } catch (innerException) {
                exception = innerException;
                throw exception;
            }
        });
        if (exception) {
            throw boot.stopIteration;
        } else {
            return result.to(list.array);
        }
    });
}

/*** transpose
    returns the transpose of a rectangular iterable.  The rows of the 
    returned table are the columns of the provided table.

    - accepts an iterable of iterables.
    - returns a `List` of `Array` objects.

*/
exports.transpose = function () {
    return list.List(exports.transposeIter.apply(this, arguments));
};

/*** zip
    returns the `transpose` of its arguments.
*/
exports.zip = function () {
    return exports.transpose.call(this, arguments);
};

/*** zipIter
    returns an iteration of the `transpose` of its arguments.
*/
exports.zipIter = function () {
    return exports.transposeIter.call(this, arguments);
};

/*** enumerateIter

    returns an iteration of enumerated values
    from a given iteration.

    Accepts:

    - an `iterable` of values to enumerate
    - an optional number to start at: by
      default, 0.

    Returns an iteration of array,
    ``[index, value]``, pairs.

*/
exports.enumerateIter = function (values, n) {
    return exports.zipIter(range.range(n, Infinity), values);
};

/*** enumerate
    returns an iteration of duple arrays containing
    a sequential index and the respective value from
    a given iterable starting with zero, or ``n`` if
    provided.

    Accepts:

    - ``values``
    - ``n`` an optional index for the first duple
      of the enumeration.  By default, this value
      is zero.
*/
exports.enumerate = function () {
    return list.List(exports.enumerateIter.apply(this, arguments));
};

/*** reduce

    applies a function of two arguments cumulatively to the values of an
    iterable, from left to right, reducing the values to a single value.

    ``reduce`` has two argument forms.

    - ``reduce(values, recur)``
    - ``reduce(values, basis, recur)``

    For example, ``reduce([1, 2, 3], add)`` calculates ``((1 + 2) + 3)``.

    If one provides a ``basis``, that value primes the accumulator and
    serves as a default return value if the iteration is empty.

    For example, ``reduce([], 0, add)`` returns the arithmetic identity
    of zero, whereas ``reduce([], 1, mul)`` returns the multiplicative
    identity of one.  ``reduce([], [], add)`` returns an empty list,
    the 'list concatonation identity'.
    
    This function defies the conventional order of arguments
    for a reduction to facilitate orthogonality with the
    convention of having relation arguments come last and context
    objects come first.

*/
exports.reduce = function (values, basis, recur) {
    /* copy the list, no matter its type */
    values = list.List(values);

    /* the two argument form omits a basis */
    if (boot.no(recur)) {
        recur = basis;
        basis = undefined;
    }

    if (boot.no(basis)) {
        basis = values.shift();
    }

    while (values.len() > 0) {
        basis = recur(basis, values.shift());
    }

    return basis;
};

/*** cycle
    returns an iteration that cycles through
    the values in a given iterable.

    Accepts:

    - an iterable of values to 
      cycle over.
    - an optional number of times to cycle
      through the values: by default, `Infinity`.

    Returns an iteration.
*/
exports.cycle = function (values, count) {
    if (boot.no(count)) count = Infinity;
    count = operator.number(count);
    if (count == 0) return iter.Iter(function () {
        throw boot.stopIteration;
    });

    var buffer = [];
    var i = 0;

    var iteration = iter.iter(values).eachIter(function (value) {
        /* first time around, fill the buffer on demand */
        buffer.push(value);
        return value;
    });

    return iter.Iter(function () {
        try {
            return iteration.next();
        } catch (exception) {
            if (type.isInstance(exception, boot.SkipIteration)) {
            } else if (type.isInstance(exception, boot.StopIteration)) {
                if (!boot.no(count) && ++i > count)
                    throw boot.stopIteration;
                iteration = boot.iter(buffer);
                return iteration.next();
            } else {
                throw exception;
            }
        }

    });

};

/*** chain
    serially chains iterations.  The resultant
    iteration will consume and produce values from
    the first iteration, then consume and produce
    values from each following iteration in turn.
    adding and summing iterations has the same effect.

    If only one argument is passed in, it is presumed
    to be an iterable object containing the iterations
    you desire to chain.

    If more than one argument is passed in, the 
    arguments themselves are presumed to be a list
    of iterations to chain.
*/
exports.chain = function () {

    var iterations;
    if (arguments.length == 1) {
        iterations = iter.iter(arguments[0]);
    } else {
        iterations = iter.iter(arguments);
    }

    var iteration = iter.iter(iterations.next());
    return iter.Iter(function () {
        while (true) {
            try {
                return iteration.next();
            } catch (exception) {
                if (type.isInstance(exception, boot.SkipIteration)) {
                } else if (type.isInstance(exception, boot.StopIteration)) {
                    iteration = iter.iter(iterations.next());
                } else {
                    throw exception;
                }
            }
        }
    });

};

/*** repeat
    returns an iteration that repeats an value a given number
    of times, or indefinitely.

    Accepts:

    - ``value``
    - ``length`` the optional number of times to repeat the ``value``

*/
exports.repeat = function (value, length) {
    var i = 0;
    return iter.Iter(function () {
        if (boot.no(length) || i++ < length) {
            return value;
        } else {
            throw boot.stopIteration;
        }
    });
};

/*** flatten
    returns a list of all of the non-list elements
    recursively contained by a given iterable object.
*/
exports.flatten = function (values) {
    /*todo consider a non-recursive solution #69 */

    var results = list.List();
    exports.forEach(values, function (value) {
        if (
            type.isInstance(value, Array) ||
            type.isInstance(value, iter.Iterable)
        ) {
            exports.forEach(exports.flatten(value), function (value) {
                results.push(value);
            });
        } else {
            results.push(value);
        }
    });

    return results;
};

/*** compactIter
    returns an `Iter` of all of the values
    in a given `Iterable` that are not
    `null` or `undefined`.

    This function exists only to appease
    PrototypeJS afficionados.
*/
exports.compactIter = function (values) {
    return exports.whereIter(values, type.to(boot.no, operator.not));
};

/*** compact
    returns a `List` of all of the values
    in a given iterable that are not
    `null` or `undefined`.

    This function exists only to appease
    PrototypeJS afficionados.
*/
exports.compact = function () {
    return list.List(exports.compactIter.apply(this, arguments));
};

/*** withoutIter
    returns an `Iter` of all of the values
    from a given iteration except those that
    are `eq` to a given value.

    Accepts:

    - an `Iterable` of values
    - a value to exclude from the resultant
      iteration

*/
exports.withoutIter = function (values, value) {
    return iter.iter(values).whereIter(operator.ne(value));
};

/*** without
    returns a `List` of all the values
    from a given iteration except those that
    are `eq` to a given value.

    Accepts:

    - an `Iterable` of values
    - a value to exclude from the resultant
      `List`
*/
exports.without = function () {
    return list.List(exports.withoutIter.apply(this, arguments));
};

/*** group
    groups the values in an `Iterable` based on
    the values a given relation returns.

    returns a `Dict` of `Set` objects for each
    class of values from the given iteration
    that returned the same value.  They keys
    of the dictionary are the common value.

    Accepts:
    
    - an `Iterable` of values
    - a relation `Function`

*/
exports.group = function (values, relation, groups) {
    if (boot.no(relation)) relation = operator.pass;
    if (boot.no(groups)) groups = dict.Dict();
    exports.forEach.call(this, values, function (value) {
        var category = relation.call(this, value);
        if (!groups.has(category))
            groups.set(category, set.Set());
        groups.get(category).insert(value);
    });
    return groups;
};

/* a function that builds ``any`` and ``all`` */
var inferer = function (arity) {
    return function (values) {
        if (arguments.length > 1)
            values = iter.iter(arguments);
        var iteration = iter.iter(values);
        try {
            while (true) {
                try {
                    var value = iteration.next();
                } catch (exception) {
                    if (type.isInstance(exception, boot.SkipIteration)) {
                    } else {
                        throw exception;
                    }
                }
                if (operator.bool(value) != arity) {
                    return !arity;
                }
            }
        } catch (exception) {
            if (type.isInstance(exception, boot.StopIteration)) {
            } else {
                throw exception;
            }
        }
        return arity;
    };
};

/*** all
    returns whether all of the values
    in an `Iterable` are true.  Consumes
    only as many values from the
    iteration as necessary.  This means
    that `all` short-circuits on the first
    `false` value.
*/
exports.all = inferer(true);

/*** any
    returns whether any of the values
    in an `Iterable` are true.  Consumes
    only as many values from the
    iteration as necessary.  This means
    that `any` short-circuits on the first
    `true` value.
*/
exports.any = inferer(false);

/* a function that builds ``min`` and ``max`` */
/*** bounder
    returns a boundary searching function for
    a given judge function.  Boundary functions
    use the judge function to find the closest
    value to a given boundary.  ``min`` is a
    boundary function that finds the least
    value of an iteration and ``max`` is a boundary
    function that finds the greatest value
    of an iteration.  The judge functions for
    ``min`` and ``max`` are ``lt`` and ``gt``
    respectively.
*/
exports.bounder = function (judge) {
    return function (values, relation, base) {
        if (boot.no(relation))
            relation = operator.pass;
        exports.forEach(values, function (value) {
            if (boot.no(base) || judge(relation(value), relation(base))) {
                base = value;
            }
        });
        return base;
    };
};

/*** bound
    returns the boundary of an interation
    of values given a judge function (one that
    accepts two values and returns whether the
    former is closer to the boundary than the
    latter), an optional relation function that
    returns an aspect of each value that should
    be judged, and an optional basis: a value
    from which to start searching for the
    boundary.
*/
exports.bound = function (values, judge, relation, base) {
    return exports.bounder(judge)(value, relation, base);
};

/*** min
    returns the least value from a given
    `Iterable`.  Uses `lt` to establish the
    natural order of the values.
*/
exports.min = exports.bounder(operator.lt);

/*** max
    returns the greatest value from a given
    `Iterable`.  Uses `gt` to establish the
    natural order of the values.
*/
exports.max = exports.bounder(operator.gt);

var iter = require('./iter');
var list = require('./list');
var set = require('./set');
var dict = require('./dict');
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

