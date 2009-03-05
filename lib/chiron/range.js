/*file chiron src/base/range.js */
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
var list = require('./list');
var set = require('./set');
var dict = require('./dict');
var each = require('./each');


/**
    Arithmetic Iterations
    =====================
*/

/*** range
    returns an ordinal `Range`.

    ``range(end)``
      the range of numbers [0, end)

    ``range(begin, end)``
      the range of numbers [begin, end)

    ``range(begin, end)``
      the range of numbers [begin, end) incrementing by step

*/
exports.range = function (begin, end, step) {
    return exports.Range(begin, end, step, exports.ordinal);
};

/*** count
    returns a cardinal `Range`.

    ``count(end)``
        counts from [1, end]

    ``count(begin, end)``
        counts from [begin, end]

    ``count(begin, end, step)``
        counts from [begin, end] incrementing by step
*/

exports.count = function (begin, end, step) {
    return exports.Range(begin, end, step, exports.cardinal);
};

/*** cardinal
    Denotes an interval that includes its bound.

    This variable may change name.
*/
exports.cardinal = '[]';

/*** ordinal
    Denotes an interval that excludes its bound.

    This variable may change name.
*/
exports.ordinal = '[)';

/*** Range
    a representation of an integral, bounded linear
    region.

    The domain of a range contains discrete integers,
    can be cardinal or ordinal, and can have a "step"
    between each pair of numbers like a "frequency".
    Cardinal ranges are inclusive of their terminal, "end",
    value and by default begin with one.
    Ordinal ranges are exclusive of their terminal, "end",
    value and by default begin with zero.

     - is `Iterable`

*/

exports.Range = type.type([iter.Iterable], function Range(self, supr, alias) {
    var begin, end, step, cardinality;

    self.init = function (_begin, _end, _step, _cardinality) {
        begin = _begin;
        end = _end;
        step = _step;
        cardinality = _cardinality;
        if (boot.no(cardinality)) {
            cardinality = false;
        }
        if (boot.no(begin)) {
            _cardinality = boot.no(_cardinality) ? exports.ordinal : _cardinality;
            begin = _cardinality === exports.ordinal ? 0 : 1;
            end = Infinity;
            _step = 1;
        }
        if (boot.no(end)) {
            end = begin;
            if (cardinality == exports.cardinal) {
                begin = 1;
            } else {
                begin = 0;
            }
            if (boot.no(step)) {
                step = 1;
            }
        }
        if (boot.no(step)) {
            step = begin == end ? 0 : begin < end ? 1 : -1;
        }
    };

    /**** hasValue
        returns whether the range includes
        a given value.

        O(1): constant time; does not
        iterate over the range.  Guaranteed
        to return a value even for unbounded
        ranges like ``Range(-Infinity, Infinity)``.
    */
    self.hasValue = function (value) {
        if (step < 0)
            return self.reversed().hasValue(value);
        if (
            value < begin || 
            (
                cardinality == exports.cardinal ? 
                value > end :
                value >= end
            )
        )
            return false;
        if (step == 0)
            return value == begin;
        if (begin % step != value % step)
            return false;
        return true;
    };

    /**** has
        returns whether range includes
        a given value.

         - aliases `hasValue`
    */
    self.has = alias('hasValue');

    /**** get
        returns the nth value in the range.
        if the index does not exist within
        the bounds of the range, throws
        a `KeyError`.
    */
    self.get = function (key) {
        var value = begin + key * step;
        if (!self.has(value))
            throw new boot.KeyError(key);
        return value;
    };

    /**** iter
        returns an iteration of the values
        in the range.
    */
    self.iter = function () {
        var n = begin;
        return iter.Iter(function () {
            if (
                end != null && (
                    step < 0 ? (
                        cardinality == exports.cardinal ? n < end : n <= end
                    ) : (
                        cardinality == exports.cardinal ? n > end : n >= end
                    )
                )
            ) {
                throw boot.stopIteration;
            } else {
                var result = n;
                n += step;
                return step < 0 && ! cardinality == exports.cardinal ? n : result;
            }
        });
    };

    /**** eq */
    self.eq = function (other) {
        if (boot.no(other)) return false;
        if (type.isInstance(other, exports.Range))
            return operator.eq(self.getComponents(), other.getComponents());
        if (type.isInstance(other, Array) || type.isInstance(other, iter.Iterable))
            return operator.eq(self.array(), list.array(other));
        return false;
    };

    /**** reversed */
    self.reversed = function () {
        return exports.Range(end, begin, -step, cardinality);
    };

    /**** repr
    */
    self.repr = function () {
        return (
            self.getTypeName() + '(' +
                type.repr(begin) + ', ' +
                type.repr(end) + ', ' +
                type.repr(step) + ', ' +
                type.repr(cardinality ? exports.cardinal : exports.ordinal) +
            ')'
        );
    };

    /**** getComponents
        returns an array of the
        ``[begin, end, step, and cardinal]``
        internal variables.
    */
    self.getComponents = function () {
        /* normalize */
        if (cardinality == exports.cardinal && !(step % 1))
            return [begin, end + 1, step, exports.ordinal];
        return [begin, end, step, cardinality];
    };

});

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

