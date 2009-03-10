/*file chiron src/base/dict.js */
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
var set = require('./set');

/**

    Dictionary
    ==========

    Dictionaries, albeit instances of type `Dict`, are
    like associative arrays or hash tables.

*/

/*** Dict
    an associative array that maps objects to objects,
    a set of itmes that are key and value pairs, and a relation.

    `Dict` is an `Iterable` `Set`.

    Different than Python:

     - ``update``: `add`
     - ``has_key``: `hasKey`
     - ``iteritems``: `itemsIter`
     - ``iterkeys``: `keysIter`
     - ``itervalues``: `valuesIter`
     - ``fromkeys(S, v)``: ``dict(each(S.keys(), function (k) {return [k, v]}))``
     - ``setdefault``: use `set` and `get`
     - ``__del__`` -> `remove`
     - ``__contains__`` -> `has`

    Same as Python:

     - `get`
     - `clear`
     - `copy`
     - `items`
     - `keys`
     - `values`
     - `pop`

*/

exports.Dict = type.type([set.Set], function Dict(self, supr, alias, ed) {

    var parent;

    self.init = function (items, _parent, _eq, _hash) {

        if (boot.no(_eq)) _eq = operator.eq;
        if (boot.no(_hash)) _hash = type.hash;
        supr.init(
            undefined,
            function (a, b) {
                return _eq(a[0], b[0]);
            },
            function (x) {
                return _hash(x[0]);
            }
        );

        if (items) {
            /* makes the iteration reusable */
            items = list.array(items);
            try {
                /* handle lists of tuples */
                each.eachApply(items, function (key, value) {
                    if (arguments.length < 2)
                        throw Error(); /* for control flow */
                    self.set(key, value);
                });
            } catch (exception) {
                /* handle lists of items and
                 * assume positional indexing */
                self.clear();
                each.eachApply(each.enumerate(items), function (key, value) {
                    self.set(key, value);
                });
            }
        }

        parent = _parent;

    };

    /**** keysIter
        returns an `Iter` of keys from the 
        key and value pairs (items) in the dictionary.
        Uses `itemsIter`.

         - `stateless`
    */
    self.keysIter = function () {
        return self.itemsIter().eachIter(exports.get(0));
    };

    /**** keys
        returns a `Set` of keys from the 
        key and value pairs (items) in the dictionary.
        Uses `keysIter` and `itemsIter`.

         - `stateless`
    */
    self.keys = function () {
        return set.Set(self.keysIter());
    };

    /**** valuesIter
        returns an `Iter` of values from the
        key and value pairs (items) in the dictinoary.
        Uses `itemsiter`.

         - `stateless`
    */
    self.valuesIter = function () {
        return self.itemsIter().eachIter(exports.get(1));
    };

    /**** values
        returns a `List` of values from the
        key and value pairs (items) in the dictionary.
        Uses `valuesIter` and `itemsIter`.

         - `stateless`
    */
    self.values = function () {
        return list.List(self.valuesIter());
    };

    /**** itemsIter
        returns an iteration, `Iter`, of the key and
        value pairs (items) in the dictionary.
        Items are represented as native JavaScript
        `Array` objects.
        Uses `iter`, which is defined for the
        `Set` base-type.

         - `stateless`
    */
    self.itemsIter = alias('iter');

    /**** items
        returns a `List` of the key and value
        pairs (items) in the dictionary.
        Items are represnted as native JavaScript
        `Array` objects.
        Uses `itemsIter`.

         - `stateless`
    */
    self.items = function () {
        return list.List(self.itemsIter());
    };

    /**** get

        returns the value of an item in
        the dictionary that has a given
        key.  If there is item for the key,
        attempts to return a default value, 
        checking whether you've specified
        a default value to return as a second
        argument, or deferring to `getDefault`.
        If no acceptable default exists,
        throws a `KeyError`.

        accepts:
         - a key (any object)
         - an optional default value, which
           can be `undefined` or `null`
           if you wish to avoid throwing
           a `KeyError`.

         - `stateless`
    */
    self.get = function (key, value) {
        if (supr.has([key]))
            return self.retrieve([key])[1];
        if (arguments.length < 2)
            return self.getDefault(key);
        else
            return value;
    };

    /**** setDefault
        returns the value for a given key.
        If a value does not yet exist for that key,
        stores and returns the given value.

        Accepts:

        - ``key``
        - ``value``

    */
    self.setDefault = function (key, value) {
        if (!self.has(key))
            self.set(key, value);
        return self.get(key);
    };

    /**** set 
        stores a key and corresponding value
        (an item) in the dictionary.  If
        an item already exists in the dictionary
        that has the same key, it is overwritten.

         - stateful
         - chainable
    */
    self.set = function (key, value) {
        return self.insert([key, value]);
    };

    /**** put
    */
    self.put = function (key, value) {
        if (self.has(key))
            throw new boot.KeyError("KeyError: " + type.repr(key) + " already exists");
        self.set(key, value);
    };

    /**** has
        returns whether a dictionary contains
        a given key.
    */
    self.has = function (key) {
        return supr.has([key]);
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
        deletes the key and value pair (item)
        in the dictionary
        that has a given key.

         - `stateful`
         - `chainable`
    */
    self.del = function (key) {
        return self.remove([key]);
    };

    /**** getDefault
        an overridable function that returns
        a value or throws a KeyError if you
        attempt to `get` an item for a key
        that the dictionary does not contain.

         - `stateless`, but overrides may
           be stateful.
    */
    self.getDefault = function (key) {
        if (boot.no(parent)) {
            throw new boot.KeyError(key);
        } else { 
            return parent.get(key);
        }
    };

    /**** hasValue
        returns whether the dictionary contains
        an item with the given value.

         - `stateless`
    */
    self.hasValue = function (needle, findEq) {
        if (boot.no(findEq))
            findEq = operator.eq;
        return self.valuesIter().whereIter(operator.partial(findEq, needle)).any();
    };

    /**** hasKey
        alias of `has`

         - `stateless`
    */
    self.hasKey = alias('has');

    /**** update
         - `stateful`
         - `chainable`
    */
    self.update = alias('union');

    /**** updated
         - `stateless`
         - `chainable`
    */
    self.updated = alias('unioned');

    /**** complete
         - `stateful`
         - `chainable`
    */
    self.complete = function (other) {
        if (other === self) return self;
        each.eachApply(other, function (key, value) {
            if (!self.has(key)) {
                self.set(key, value);
            }
        });
        return self;
    };

    /**** completed
         - `stateless`
         - `chainable`
    */
    self.completed = ed('complete');

    /**
        List
        ----
    */

    /**** find
         - `stateless`
    */
    self.find = function (value, findEq) {
        if (boot.no(findEq))
            findEq = operator.eq;
        return supr.find([null, value], function (a, b) {
            return findEq(a[1], b[1]);
        })[0];
    };

    /**** findReverse
        since dictionary keys are not ordered, `findReverse` is not
        distinguishable from `find`.

         - `stateless`
    */
    self.findReversed = alias('find');

    /**
        Arithmetic
        ----------
    */

    /**** add
         - `stateful`
         - `chainable`
    */
    self.add = alias('update');

    /**** added
         - `stateless`
         - `chainable`
    */
    self.added = alias('updated');

    /**
        Logic
        -----
    */

    /**** eq
         - `stateless`
    */
    self.eq = function (other) {
        return self === other || (
            self.len() === list.len(other) &&
            self.keysIter().eachIter(function (key) {
                return (
                    exports.has(other, key) &&
                    operator.eq(self.get(key), exports.get(other, key))
                );
            }).all()
        );
    };

    /**
        Base
        ----
    */

    /**** repr
         - `stateless`
    */
    self.repr = function (depth, memo) {
        return self.getTypeName() + '(' + (
            depth <= 0 ?  '...' : 
            type.arrayRepr(list.array(self.items()), depth, memo)
        ) + ')';
    };

    /**
        Conversions
        -----------
    */

    /**** string
         - `stateless`
    */
    self.string = function () {
        return type.objectRepr(self.object());
    };

    /**** hash
         - `stateless`
    */
    self.hash = function () {
        return self.itemsIter().eachApply(function (key, value) {
            return type.hash(key) + type.hash(value);
        }).join(',');
    };

    /**** invoke
    */
    self.invoke = alias('get');

});

/*** dict
*/
exports.dict = type.operator(0, 'dict', exports.Dict);

/*** object
    Creates a new native JavaScript `Object`
    from any instance.

    Defers to any user defined `object` method
    of the given object.  Failing that, defers
    to `dict` to convert the given object to
    a `Dict` and then creates an `Object` from
    that dictionary's key value pairs.

     - `polymorphic`
*/
exports.object = type.operator(0, 'object', function (value) {
    return exports.dict(value).object();
});

/*** hasKey
     - `polymorphic`
*/
exports.hasKey = type.operator(1, 'hasKey', function (items, key) {
    if (type.isInstance(items, Array)) {
        key = operator.number(key);
        return key >= 0 && key < items.length;
    }
    if (type.isInstance(items, Object))
        return items[key] !== undefined;
});

/*** hasValue
     - `polymorphic`
*/
exports.hasValue = type.operator(1, 'hasValue', function (items, value) {
    if (type.isInstance(items, Array))
        return boot.arrayHas(items, value);
    if (type.isInstance(items, Object))
        return boot.arrayHas(boot.objectValues(items), value);
});

/*** update
     - `polymoprhic`
     - `stateful`
     - `chainable`
*/
exports.update = type.operator(1, 'update', boot.objectUpdate);

/*** updated
     - `polymorphic`
     - `stateless`
     - `chainable`
*/
exports.updated = boot.ed(exports.update);

/*** complete
     - `polymoprhic`
     - `stateful`
     - `chainable`
*/
exports.complete = type.operator(1, 'complete', boot.objectComplete);

/*** completed
     - `polymorphic`
     - `stateless`
     - `chainable`
*/
exports.completed = boot.ed(exports.complete);

/*** clear
    removes all key value pairs from list and dict-like objects
    including native Arrays, Objects, and types that override
    the `clear` function like `Dict` and `List`.

     - `polymorphic`
     - `stateful`
     - `chainable`
*/
exports.clear = type.operator(1, 'clear', function (object) {
    if (type.isInstance(object, Array)) object.length = 0;
    else if (type.isInstance(object, Object)) 
        type.dir(object).forEach(function (name) {
            delete object[name];
        });
    return object;
});

/*** keys
     - `polymorphic`
     - `stateless`
*/
exports.keys = type.operator(1, 'keys', function (items) {
    if (boot.no(items)) return list.List();
    if (type.isInstance(items, Array)) return list.List(items).keys();
    if (type.isInstance(items, Object)) return exports.Dict(items).keys();
});

/*** keysIter
     - `polymorphic`
     - `stateless`
*/
exports.keysIter = type.operator(1, 'keysIter', function (items) {
    return iter.iter(exports.keys(items));
});

/*** values
     - `polymorphic`
     - `stateless`
*/
exports.values = type.operator(1, 'values', function (items) {
    if (boot.no(items)) return list.List();
    if (type.isInstance(items, Array)) return list.List(items);
    if (type.isInstance(items, Object)) return exports.Dict(items).values();
});

/*** valuesIter
     - `polymorphic`
     - `stateless`
*/
exports.valueIter = type.operator(1, 'valuesIter', function (items) {
    return iter.iter(exports.values(items));
});

/*** items
     - `polymorphic`
     - `stateless`
*/
exports.items = type.operator(1, 'items', function (items) {
    if (boot.no(items)) return list.List();
    if (type.isInstance(items, Array)) return list.List(items).items();
    if (type.isInstance(items, Object)) return exports.Dict(items).items();
});

/*** itemsIter
     - `polymorphic`
     - `stateless`
*/
exports.itemsIter = type.operator(1, 'itemsIter', function (value) {
    return iter.iter(exports.items(value));
});

/*** has
    returns whether a collection contains a value.
    Different collections may defer to `hasKey` or
    `hasValue` depending on what is most useful.
    `Dict` objects, for example, check keys from their
    contained items.

     - `polymorphic`
     - `stateless`
*/
exports.has = type.operator(2, 'has', function (items, key) {
    if (type.isInstance(items, String)) return items.indexOf(key) != -1;
    if (type.isInstance(items, Array)) return boot.arrayHas(items, key);
    if (type.isInstance(items, Object)) return Object.prototype.hasOwnProperty.call(items, key);
});

/*** get
     - `polymorphic`
     - `stateless`
*/
exports.get = type.operator(2, 'get', function (items, key, value) {
    if (type.isInstance(items, String)) {
        if (!type.isInstance(key, Number))
            throw new TypeError("TypeError: String keys must be Numbers.");
        if (!range.range(items.length).has(key))
            throw new boot.KeyError("KeyError: " + key);
        return items.charAt(key);
    }
    if (!Object.prototype.hasOwnProperty.call(items, key)) {
        if (arguments.length == 3)
            return value;
        throw new boot.KeyError("KeyError: " + type.repr(key));
    } 
    return items[key];
});

/*** set
    sets a value for a given key in an associative mapping like a `Dict`, `Object`,
    `List`, `Array`, or any instance that implements `set`.

     - `polymorphic`
     - `stateful`
     - `chainable`
*/
exports.set = type.operator(3, 'set', function (items, key, value) {
    items[key] = value;
    return items;
});

/*** put
     - `polymorphic` via `put` or `set`
     - `stateful`
     - `chainable`
*/
exports.put = type.operator(3, 'put', boot.arrayPut);

/*** del
    deletes an item from an object for a given key.
    If the object is ordered, an optional second argument can
    specify the exclusive upper bound to the range of keys
    to delete.
    If the object is one-dimensional, like an array, the
    keys are indicies (array offsets) and can be negative
    to indicate an offset from the array's length.  For
    example, ``-1`` is the last index of the array.
    The indicies must monotonically ascend; ``begin`` must be
    less than or equal to ``end``.

    accepts:
     - any object of items including an ``Object``, ``Array``,
       ``List``, or ``Dict``.
     - a ``key`` of any type as long as there is a corresponding
       instance in the object.

    throws a ``KeyError`` if any key does not exist.

    returns the original items.

     - `polymorphic`
     - `stateful`
     - `chainable`
*/
exports.del = type.operator(2, 'del', function (values, begin, end) {
    if (type.isInstance(values, Array)) boot.arrayDel(values, begin, end);
    else delete values[begin];
    return values;
});

/*** cut
     - `polymorphic` via `cut`, `get`, and `del`
     - `stateful`
*/
exports.cut = type.operator(2, 'cut', function (items, key) {
    var result = exports.get(items, key);
    exports.del(items, key);
    return result;
});

/*** find
*/
/*todo account for the fact that arrayFind and objectFind are not
 * impolemented in terms of the "eq" function */
exports.find = type.operator(2, 'find', function (items, value) {
    if (type.isInstance(items, Array)) return boot.arrayFind(items, value);
    return boot.objectFind(items, value);
});

/*** insert
*/
exports.insert = type.operator(2, 'insert', function (items, value) {
    if (it.sInstance(items, Array)) items.push(value);
    throw TypeError("cannot insert on " + type.repr(type.getTypeName(items)));
});

/*** retrieve
*/
exports.retrieve = function (items, value) {
    return exports.get(items, exports.find(items, value));
};

/*** remove
*/
exports.remove = function (items, value) {
    return exports.del(items, exports.find(items, value));
};

/*** discard
*/
exports.discard = function (items, value) {
    try {
        exports.remove(items, value);
    } catch (exception) {
        if (type.isInstance(exception, boot.ValueError)) {
        } else {
            throw exception;
        }
    }
    return items;
};

var iter = require('./iter');
var list = require('./list');
var each = require('./each');
var range = require('./range');

set = require('./set');
list = require('./list');

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

