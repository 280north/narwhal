/*file chiron src/base/set.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var boot = require('./boot');
var type = require('./type');
var operatorModule = require('./operator');
var iter = require('./iter');

/**

    Set
    ===

*/

/*** Set

    An unordered collection of unique values.

    The polymorphic member function corresponding to the
    `Set` constructor is `unique` since `Set` objects
    guarantee that their members are distinct.

    `Set` operations operate in constant time best case,
    and linear for degenerate cases.

    accepts:
     - an optional iterable of values to insert
     - an optional override for `eq` for determining
       whether itms with the same hash are the same
       object.
     - an optional override for `hash` for organizing
       potentially equivalent objects.

    If you insert and mutate a List or Dict in a set,
    the original object will be irrecoverable unless you retrieve a
    an object equivalent to the inserted value.
    Most other libraries enforce that only immutable
    objects should be inserted in sets for this reason,
    so be careful.

*/
exports.Set = type.type([iter.Iterable], function Set(self, supr, alias, ed) {

    var data = {};

    var eq;
    var hash;

    self.init = function (values, _eq, _hash) {
        if (boot.no(eq = _eq))
            eq = operatorModule.eq;
        if (boot.no(hash = _hash))
            hash = type.hash;
        if (!boot.no(values)) {
            each.forEach(values, self.insert);
        }
        supr.init.apply(self, boot.arraySliced(arguments, 1));
    };

    /**** insert
        inserts a value in the `Set`. 
        Position is not relevant.  Replaces
        an existing value if the value has the same
        `hash` key and is `eq` to an existing
        value.  The `hash` function and `eq` function
        can be overridden in the `Set` constructor.

         - `stateful`
         - `chainable`
    */
    self.insert = function (value) {
        var hashKey = hash(value);
        if (!Object.prototype.hasOwnProperty.call(data, hashKey))
            data[hashKey] = [];
        var i, bucket = data[hashKey];
        for (i = 0; i < bucket.length; i++) {
            if (eq(bucket[i], value)) {
                bucket[i] = value;
                return;
            }
        }
        /* assert(i == bucket.length) */
        bucket[i] = value;
        return self;
    };

    /**** retrieve
        retrieves a value from the `Set` that has
        the same `hash` key and is `eq` to a given
        value.  `eq` and `hash` can be overridden
        in the `Set` constructor.

         - `stateless`
    */
    self.retrieve = function (value) {
        var hashKey = hash(value);
        if (!Object.prototype.hasOwnProperty.call(data, hashKey)) throw new boot.ValueError();
        var i, bucket = data[hashKey];
        for (i = 0; i < bucket.length; i++) {
            if (eq(bucket[i], value)) {
                return bucket[i];
            }
        }
        throw new boot.ValueError();
    };

    /**** remove
        removes a value from the `Set` if it has
        the same `hash` and is `eq` to the value.
        throws a `ValueError` if no matching value
        can be found.

         - `stateful`
         - `chainable`
    */
    self.remove = function (value) {
        var hashKey = hash(value);
        if (!Object.prototype.hasOwnProperty.call(data, hashKey)) throw new boot.ValueError();
        var i, bucket = data[hashKey];
        for (i = 0; i < bucket.length; i++) {
            if (eq(bucket[i], value)) {
                /* move the value from the end over the deleted position */
                /* typical case: overwrites the target value
                 * and creates a redundant value */
                /* degenerate case: does nothing */
                bucket[i] = bucket[bucket.length - 1];
                /* remove the last value */
                /* typical case: removes the redundant value */
                /* degenerate case: removes the target value */
                bucket.pop();
                /* delete the bucket if it's empty */
                if (!bucket.length) {
                    delete data[hashKey];
                }
                return self;
            }
        }
        throw new ValueError();
    };

    /**** discard
        discards a value from the `Set` if it has
        the same `hash` and is `eq` to the value.
        Unlike `remove`, does not throw a `ValueError`
        if no matching value can be found.

         - `stateful`
         - `chainable`
    */
    self.discard = function (value) {
        try {
            self.remove(value);
        } catch (exception) {
            if (type.isInstance(exception, boot.ValueError)) {
            } else {
                throw exception;
            }
        }
        return self;
    };

    /**** clear
        removes all values in this set.

         - `stateful`
         - `chainable`
    */
    self.clear = function () {
        data = {};
        return self;
    };

    /**** has
        returns whether a set contains a given value.
        uses `eq` and `hash` to attempt to find
        the value in the set.  These functions
        can be overridden in the `Set` constructor.
    */
    self.has = function (value) {
        var hashKey = hash(value);
        if (!Object.prototype.hasOwnProperty.call(data, hashKey))
            return false;
        var i, bucket = data[hashKey];
        for (i = 0; i < bucket.length; i++) {
            if (eq(bucket[i], value)) {
                return true;
            }
        }
        return false;
    };

    /**** find
        searches all of the values in set for one
        that is `eq` to a given value.  returns that
        value.  throws a `ValueError` if no value
        can be found.

         - accepts a value to find
         - accepts an optional override to the `eq` function

         - `stateless`
    */
    self.find = function (value, __eq) {
        var _eq = __eq;
        if (boot.no(__eq)) _eq = eq;
        for (var hashKey in data) {
            if (Object.prototype.hasOwnProperty.call(data, hashKey)) {
                var i, bucket = data[hashKey];
                for (i = 0; i < bucket.length; i++) {
                    if (_eq(bucket[i], value)) {
                        return bucket[i];
                    }
                }
            }
        }
        throw new boot.ValueError("cannot find " + type.repr(value));
    };

    /**** iter */
    self.iter = function () {
        return iter.objectIter(data).eachApplyIter(function (hashKey, bucket) {
            return iter.arrayIter(bucket);
        }).sum(iter.iter());
    };

    /**** eq */
    self.eq = function (other) {
        if (self == other) {
            return true;
        } else if (type.isInstance(other, Array) || type.isInstance(other, iter.Iterable)) {
            return (
                self.len() == list.len(other) &&
                each.eachIter(other, function (value) {
                    return self.has(value);
                }).all()
            );
        } else {
            return false;
        }
    };

    /**** repr */
    self.repr = function (depth, memo) {
        var n = 0;
        return (
            self.getTypeName() + 
            '([' + (
                depth <= 0 ? 
                '...' :
                self.eachIter(function (value) {
                    return type.repr(value, depth, memo);
                }).join(', ')
            ) + '])'
        );
    };

    /**** union
        augments itself with any values that exist in another
        iterable.

         - `stateful`
         - `chainable`
    */
    self.union = function (values) {
        if (values === self) return self;
        each.forEach(values, function (value) {
            self.insert(value);
        });
        return self;
    };

    /**** intersect
         - `stateful`
         - `chainable`
    */
    self.intersect = function (values) {
        values = exports.Set(values);
        self.forEach(function (value) {
            if (!values.has(value)) {
                self.remove(value);
            };
        });
        return self;
    };

    /**** difference
         - `stateful`
         - `chainable`
    */
    self.difference = function (values) {
        each.forEach(values, function (value) {
            self.discard(value);
        });
        return self;
    };

    /**** unioned
        returns all elements that are in itself and another iterable.

         - `stateless`
         - `chainable`
    */
    self.unioned = ed('union');

    /**** intersected
        returns all values that are in
        this set and another.

         - `stateless`
         - `chainable`
    */
    self.intersected = ed('intersect');

    /**** differenced
        returns the set of all values that are
        in this set but not another.

         - `stateless`
         - `chainable`
    */
    self.differenced = ed('difference');

    /**** symmetricDifferenced
        returns the set of all values that are exactly one
        set between itself and another.

         - `stateless`
         - `chainable`
    */
    self.symmetricDifferenced = function (values) {
        return self.getType()(self.unioned(values).whereIter(function (value) {
            return self.has(value) != dict.has(values, value);
        }));
    };

    /**** isSuperSet
        returns whether this set contains all of the values
        in a given container.

         - `stateless`
    */
    self.isSuperSet = function (values) {
        values = exports.Set(values);
        return values.eachIter(function (value) {
            return self.has(value);
        }).all();
    };

    /**** isSubSet
        returns whether a given container contains all of
        this set's values.

         - `stateless`
    */
    self.isSubSet = function (values) {
        values = exports.Set(values);
        return self.eachIter(function (value) {
            return values.has(value);
        }).all();
    };

    /**** added
        alias of `unioned`

         - `stateless`
         - `chainable`
    */
    self.added = alias('unioned');

    /**** add
        alias of `union`

         - `stateful`
         - `chainable`
    */
    self.add = alias('union');

    /**** muled
        alias of `intersected`

         - `stateless`
         - `chainable`
    */
    self.muled = alias('intersected');

    /**** mul
        alias of `intersect`

         - `stateful`
         - `chainable`
    */
    self.mul = alias('intersect');

    /**** subed
        alias of `differenced`

         - `stateless`
         - `chainable`
    */
    self.subed = alias('differenced');

    /**** sub
        alias of `difference`

         - `stateful`
         - `chainable`
    */
    self.sub = alias('difference');

    /**** and
        alias of `intersect`

         - `stateful`
         - `chainable`
    */
    self.and = alias('intersect');

    /**** anded
        alias of `intersected`

         - `stateless`
         - `chainable`
    */
    self.anded = alias('intersected');

    /**** or
        alias of `union`

         - `stateful`
         - `chainable`
    */
    self.or = alias('union');

    /**** ored
        alias of `unioned`

         - `stateless`
         - `chainable`
    */
    self.ored = alias('unioned');

    /**** xor
        alias of `symmetricDifferenced`

         - `stateful`
         - `chainable`
    */
    self.xor = alias('symmetricDifferenced');

    /**** xored
        alias of `symmetricDifferenced`

         - `stateless`
         - `chainable`
    */
    self.xored = alias('symmetricDifferenced');

});

/*** unique
    constructs a `Set` from any given iterable.  This has the
    effect of returning an iterable object containing all of the
    unique elements from any given iteration.

    ``unique`` departs from the convention established by `list`,
    `List`, `dict`, and `Dict` in that you would expect the
    function to be called `set`, the camelCase variant of
    `Set`.  This transgression is necessary since the `set`
    function already exists as one of the "CRUD" operators in
    the company of `get`, `has`, `del`, and `put`.

     - `polymorphic`
*/
exports.unique = type.operator(0, 'unique', exports.Set);

var list = require('./list');
var dict = require('./dict');
var each = require('./each');
var range = require('./range');
var string = require('./string');
var operatorModule = require('./operator');

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

