/*file chiron src/boost.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

/*status works in Firefox 2, Safari 2 and 3, and Explorer 6 */
/*quality .8 */
/*step 3 */

/**
    Provides everything from :module:`boot` and :module:`base` while adding
    comprehensive polymorphic overloads for comparison, logic, arithmetic,
    and additional tools for iterations.
*/

var boot = require('./boot');
boot.objectUpdate(exports, require('./base'));

/**

    Iterations
    ==========

*/

/*** takeIter
    returns an iteration of the first ``n`` values
    of a given iterable.
*/
exports.takeIter = exports.operator(2, 'takeIter', function (items, n) {
    items = exports.iter(items);
    var i = 0;
    return exports.Iter(function () {
        if (i < n) {
            i++;
            return items.next();
        } else {
            throw exports.stopIteration;
        }
    });
});

/*** take
    returns a list of the first ``n`` values from 
    a given iterable.
*/
exports.take = exports.operator(2, 'take', exports.to(exports.takeIter, exports.List));

/*** dropIter
*/
exports.dropIter = exports.operator(2, 'dropIter', function (items, n) {
    items = exports.iter(items);
    for (var i = 0; i < n; i++) {
        items.next();
    }
    return items;
});

/*** drop
    returns a list of values from an iteration
    past the first ``n``.
*/
exports.drop = exports.operator(2, 'drop', exports.to(exports.dropIter, exports.List));

/*** takeWhile
    returns an iteration that consumes the values
    of a given iteration, producing values
    until one fails to pass a given boolean
    relation.
*/
exports.takeWhile = exports.operator(2, 'takeWhile', function (items, predicate, context) {
    if (exports.no(context)) context = this;
    items = exports.peekable(items);

    return exports.Iter(function () {
        if (predicate.apply(context, [items.peek()])) {
            return items.next();
        } else {
            throw exports.stopIteration;
        }
    });
});

/*** dropWhile
    consumes items of an iteration while a given
    relation returns true on each acquired value.
    returns an iteration that starts on the first
    value that failed.  the consequent iteration
    consumes the source iteration on demand.
*/
exports.dropWhile = exports.operator(2, 'dropWhile', function (items, predicate, context) {
    if (exports.no(context)) context = this;
    items = exports.peekable(items);

    try {
        while (predicate.apply(context, [items.peek()])) {
            items.next();
        }
    } catch (exception) {
        if (exports.isInstance(exception, exports.StopIteration)) {
        } else {
            throw exception;
        }
    }
    return items;
});

/*** shuffle
    returns a list of the values in an iteration
    in random order.
*/
/*todo support a length */
exports.shuffle = function (items) {
    return exports.sorted(items, function () {
        return .5 - Math.random();
    });
};

/*** permuteIter
    returns an iteration of the permutations
    of the values in a given iterable.
*/
exports.permuteIter = function (items, type) {
    var items = exports.list(items);
    if (items.len() < 2) {
        return exports.eachIter(items, function (x) {
            return exports.iter([x]);
        });
    }
    var result = exports.range(items.len()).eachIter(function (i) {
        var tail = exports.array(items);
        var head = tail.splice(i, 1);
        var result = exports.permuteIter(tail).eachIter(function (tail) {
            return exports.add(head, tail);
        }).list();
        return result.iter();
    }).to(exports.sum);
    if (!exports.no(type))
        result = result.eachIter(exports.as(type));
    return result;
};

/*** permute
    returns a list of the permutations
    of the values in a given iterable.
*/
exports.permute = exports.to(exports.permuteIter, exports.List);

/*todo combineIter */
/* combineIter
    returns an iteration of the combinations
    of the values in a given iterable.
*/
exports.combineIter = function (items) {
};

/*todo combine */
/* combine
    returns a set of combinations
    of the values in a given iterable.
*/
exports.combine = function (items) {
};

/*** edges
    returns a list of duple arrays for each pair of adjacent
    items in a given iterable.

*/
/*test
    assertEq(edges([1, 2, 3]), [[1, 2], [2, 3]]);
*/
exports.edges = function (items) {
    return exports.edgesIter(items).to(exports.List);
};

/*** edgesIter
    returns an iteration of duple arrays for each pair of adjacent
    items in a given iterable.
*/
exports.edgesIter = function (items) {
    var i = 0;
    var current;
    items = exports.iter(items);
    try {
        current = items.next();
    } catch (exception) {
        if (exports.isInstance(exception, exports.StopIteration)) {
        } else {
            throw exception;
        }
    }
    return exports.Iter(function () {
        var previous = current;
        current = items.next();
        return [previous, current];
    });
};

/*** frequency
    returns a dictionary that relates
    values from a given iteration to
    the number of times it occurs
    in the iteration.
*/
exports.frequency = function (values) {
    var freq = exports.Dict();
    exports.forEach(values, function (value) {
        freq.set(value, freq.get(value, 0) + 1);
    });
    return freq;
};

/*** baled
    "unflattens" a linear list of values into
    a list of lists of a given width.  If the
    last list would be shorter than the requested
    width, an optional third argument can specify
    a filler value that will be copied into
    any remaining slots of the last pool.

    We're still taking suggestions for better names
    for this function.  That is to say, it's likely
    to change, and you should an email to
    <chironjs@googlegroups.com>.

    Current ideas:
     - baled
     - pooled
     - clumped
     - march
     - assemble
     - fallin
     - segment
     - split

*/
exports.baled = function (items, length, defaultValue) {
    return exports.baledIter.apply(this, arguments).each(exports.List);
};

/*** baledIter
    "unflattens" a linear list of values into
    a iteration of iterations of a given width.  If the
    last list would be shorter than the requested
    width, an optional third argument can specify
    a filler value that will be copied into
    any remaining slots of the last pool.
*/
exports.baledIter = function (items, length, defaultValue) {
    var args = arguments;
    items = exports.peekable(items);
    if (exports.no(length))
        length = 2;
    return exports.Iter(function () {
        var pool = [];
        if (!items.hasNext())
            throw exports.stopIteration;
        while (pool.length < length && items.hasNext())
            pool.push(items.next());
        if (args.length == 3)
            while (pool.length < length) 
                pool.push(exports.copy(defaultValue));
        return pool;
    });
};

/*** Peekable
    decorates an iterable such that, using the
    `Peekable` interface (the original iteration
    being consumed and buffered on demand), you
    can call `peek` to simulate a call to `next`
    without actually consuming an element from the
    iteration, or `peekIter` to simulate the
    resultant iteration of `iter` without consuming
    any values from the `Peekable`.  `Peekable`
    uses these methods to provide `hasNext`
    for iterations that wouldn't otherwise be
    able to predict whether they have any more
    values without consuming one.  `Peekable` also
    provides `peekCatch` to maintain orthogonality
    with `Iterable` `nextCatch`.

    Use `tee` to permit multiple consumers of
    one indefinite iteration.
*/
exports.Peekable = exports.type([exports.Iterable], function (self, supr) {
    var self = this;
    var buffer = [];
    var items;

    self.init = function (_items) {
        items = exports.iter(_items);
    };

    /**** iter
    */
    self.iter = function () {
        return self;
    };

    /**** hasNext
    */
    self.hasNext = function () {
        try {
            self.peek();
            return true;
        } catch (exception) {
            if (exports.isInstance(exception, exports.StopIteration))
                return false;
            throw exception;
        }
    };

    /**** next
    */
    self.next = function () {
        if (buffer.length)
            return buffer.shift();
        return items.next();
    };

    /**** peek
    */
    self.peek = function () {
        if (!buffer.length)
            buffer.push(items.next());
        return buffer[0];
    };

    /**** peekCatch
    */
    self.peekCatch = function (defaultNext) {
        try {
            return self.peek();
        } catch (exception) {
            if (exports.isInstance(exception, exports.StopIteration))
                return defaultNext;
            throw exception;
        }
    };

    /**** peekIter
    */
    self.peekIter = function () {
        var i = 0;
        return exports.Iter(function () {
            while (i < buffer.length) {
                buffer.push(items.next());
            }
            return buffer[i++];
        });
    };

});

/*** peekable
*/
exports.peekable = exports.operator(1, 'peekable', exports.Peekable);

/*** tee
    returns a list of iterations that will all independently
    produce the same sequence of elements consumed from a given
    iterable.

    accepts
     - ``source``
     - ``n`` the optional number of iterations to return,
       by default two.
*/
exports.tee = function (source, n) {
    if (exports.no(n)) n = 2;

    source = exports.iter(source);
    var buffer = [];
    var shifted = 0;
    var indicies = exports.repeat(0, n).to(exports.array);

    return exports.each(exports.range(n), function (n) {
        return exports.Iter(function () {
            var index = indicies[n] - shifted;

            while (index >= buffer.length) {
                buffer.push(source.next());
            }

            var result = buffer[index];

            indicies[n]++;

            exports.forTimes(exports.min(indicies) - shifted, function () {
                buffer.shift();
                shifted++;
            });

            return result;
        });
    });
};

/*** seq
    returns an iteration on a sequence as defined 
    in the mathematical sense.   

    A sequence has a "basis" and "recursive step". 
    The first number is the basis, called s[0].
    The recursive step is a function that accepts
    a number, called f.  Each subsequent number, s[n],
    is the recursive step applied on the previous number.
    So, s[n] = f(s[n - 1]).

    ``seq()``
      An empty sequence.

    ``seq(n)``
      The sequence of all numbers starting with
      n and continuing indefinitely.

    ``seq(n, f(n))``
      The sequence of all number starting with
      n, generating subsequent numbers with
      the function n, indefinitely.

    ``seq(a, b, c..., f(a, b, c, ...))``
      The sequence of all numbers starting with
      a subsequence of length n, where each
      following element is a function of the
      previous n elements.

*/

exports.seq = function () {
    var args = exports.where(arguments, function (n) {return !exports.no(n)});
    var bases;
    var recur;

    if (args.len() < 2) {
        recur = function (n) {
            return n + 1;
        };
    } else {
        recur = args.pop();
    }

    if (args.len() === 0) {
        bases = exports.List([0]);
    } else {
        bases = args;
    }

    return exports.Iter(function (iter) {
        if (bases.len()) {
            bases.push(recur.apply(iter, bases.to(exports.array)));
            return bases.shift();
        } else {
            throw exports.stopIteration;
        }
    });
};

/*** dump
    Returns a string containing a hex dump representation of a given byte
    string.
*/
exports.dump = function (source) {
    return exports.baledIter(source, 16).eachIter(function (line) {
        return exports.padEnd(exports.baledIter(line, 8).eachIter(function (quad) {
            return exports.eachIter(quad, function (character) {
                return exports.padBegin(character.charCodeAt().toString(16).toUpperCase());
            }).join(' ');
        }).join('  '), 48, ' ') + '  ' + exports.repr(exports.join(line)) + "\r\n";
    }).join();
};

/*** help
    returns help information for a given function or type.
*/
exports.help = function () {
    return require('./help').help.apply(this, arguments);
};

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

