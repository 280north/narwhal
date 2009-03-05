/*file chiron src/base.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

/*preamble-google

    with parts from:

    Copyright 2006 Google Inc. <http://code.google.com/p/doctype/>
    All Rights Reserved.
    New BSD License

    The ``mod`` function borrows code and documentation
    from ``math/math``.

*/

/**
    Builds on :module:`boot`, providing a type system,
    base types, and base functions covering iteration,
    collections, and type-insensitive (duck-type) operators.

    :module:`base` publishes the exports of the following modules:

    - :module:`type`
    - :module:`operator`
    - :module:`iter`
    - :module:`list`
    - :module:`set`
    - :module:`dict`
    - :module:`range`
    - :module:`string`
    - :module:`each`

    Provides:

    - a type system

     - class inheritance
     - multiple inheritance
     - mixins
     - linear method resolution order
     - polymorphism including super-type
       implementations of methods
     - encapsulation: public and private, methods
       and data, using closures and context objects
     - callable instances

    - iteration

     - an `Iter` type for creating raw iterations from
       a `next` function and the `StopIteration` exception

     - a polymorphic, type-insensitive `iter` that can
       iterate on `Object`, `Array`, `String`,
       `Set`, `Dict`, `List`, `Range`, `Sequence`
       and any type that provides a custom `iter` method.

     - an `Iterable` mixin that adds convenient functions

      - a host of functions for manipulating iterations including
        `forEach`, `each`, `where`, `zip`, `transpose`,
        `enumerate`, `reduce`, `cycle`, `flatten`,
        `compact`, `without`, `group`, `sort`, `add`,
        `min`, `max`, `sum`, `product`,
        `any`, `all`, `join`, and type-conversions,
        lazy, stateless, and variadic versions of the
        above as appropriate.

      - all iterables are callable, so they can be used
        as a relation function, mapping their domain of keys 
        to their range of values.

    - base types: `List`, `Dict`, `Set`, `Range`,
      `Iterable`, `Iter`, and `Base`

      - sets and dictionaries improve upon the use of native
        JavaScript objects by opening range of values and
        domain of keys to all JavaScript objects instead of
        merely some strings.  These types use a `hash`
        function to map objects to string hash keys and
        prefixed with a tilde internally to prevent any
        collisions with native `Object` members like
        ``__proto__`` or ``toValue``.  All instances of
        `Base` (all types defined with this module's
        type system) implicitly have a random hash string.
      - dictionaries are sets of items (key value pairs)
        hashed and compared by their key instead of the item.
      - lists improve upon native `Array` by providing
        lots of member functions and the full dictionary
        interface.  Lists also implicitly optimize sorts
        if you use a comparator provided by the `by`
        function, nearly doubling their performance with
        a Schwartzian transform.
      - ranges are lazy collections of numbers inside an
        interval on a stride.  Ranges are iterable and
        support most list operations including a fast
        function for testing whether a range `has` a 
        particular value.

    - base functions

      - iteration: many names mentioned already, but also `map`,
        `times`, and `repeat`
      - type conversions: `number`, `bool`, `list`,
        `dict`, `set`, `array`, `object`, `string`,
        `as`, `to`
      - types: `getType`, `getTypeName`, `getTypeFullName`
      - arithmetic operators: `add`, `sub`, `mul`,
        `div`, `sum`, `product`
      - logic operators: `and`, `or`, `not`
      - comparison: `eq`, `lt`, `ne`, `le`, `gt`,
        `ge`, `by`, `compare`, `desc`
      - set operations: `unique`, `hash`, `eq`
      - dictionary operators: `get`, `set`, `has`, `del`,
        `hasKey`, `hasValue`, `update`, `complete`,
        `clear`, `keys`, `values`, `items`
      - list operators: `has`, `len`, `reversed`,
        `sorted`, `sliced`, `join`, `first`, `last`,
        `begins`, `ends`
      - string operators: `trim`, `trimBegin`, `trimEnd`,
        `padBegin`, `padEnd`, `split`, `enquote`,
        `expand`
      - ranges: `count`, `range`
      - functions: `args`, `invoke`, `partial`
      - introspection: `dir`, `repr`, `help`
      - utilities: `index`, `member`, `schedule`,
        `inherit`, `pass`


    Idioms
    ======

    - tolerance of input: functions provide behaviors for all
      meaningful types, including native JavaScript `Object`
      (which are promoted to dictionaries or lists of pairs),
      `Arrays` (which are promoted to lists), `String`, and
      other types that define custom behaviors with polymorphic
      function overload.
    - strictness of output: functions return the most powerful type
      appropriate for their behavior, usually `List`, `Dict`,
      or `Set` instances.  `Array` objects are occasionally used
      like tuples in Python.
    - flexibility: all complex types are easily convertable
      to native JavaScript `Object`, `Array`, and
      `String` instances.
    - laziness: any function that would consume an iteration
      also provides an equivalent lazy implementation that
      returns an iteration that would incrementally consume
      the original iteration to provide each item.  To use
      the lazy version of a greedy function, add `iter` as
      the last term of its name.
    - polymorphism: functions defer to custom 
      polymorphic implementations.
    - currying: to ease the creation of lambdas, or anonymous
      functions, many functions will curry if less than a
      minimum number of arguments are provided.  The curried
      function accepts an object to operate on.
    - copying: all types accept an optional object to shallowly
      copy as theif first argument.
    - conversion: all collection types form conversion rings.
      That is, any collection or iteration can be converted 
      to any other collection type and converted back
      to the same type using the copy constructor.
    - state: many functions distinguish between in-place
      and stateless variants.
   

    Names
    =====

    Most names have been chosen for easy migration from Python.
    Some names from other languages snuck in when they were
    simply more meaningful or filled a void Python left.  All
    names conform to Chiron JavaScript's case conventions
    and avoid the use of superfluous underscores.

    Different than Python:

    - ``strip``: `trim`
    - ``lstrip``: `trimBegin`
    - ``rstrip``: `trimEnd`
    - ``contains``: `has`
    - ``in``: `has` (reverse argument order)
    - ``__getitem__``: `get`
    - ``__setitem__``: `set`
    - ``__hasitem__``: `has`
    - ``__delitem__``: `del`
    - ``__call__``: `invoke`
    - ``filter``: `where` (`filter` has the opposite semantic in English)

    Different than Prototype:

    - ``clone``: `copy`
    - ``collect``: only `each`
    - ``detect``: use `dropWhile` and `next` from `boost`
    - ``eachSlice``: `baled` in `boost`
    - ``entries``: `array`
    - ``findAll``: `where`
    - ``grep``: `where`
    - ``inGroupsOf``: `baled` in `boost`
    - ``include``: `has`
    - ``inspect``: `repr`
    - ``invoke``: `each` with `member` (``invoke`` is ``call`` without ``context``)
    - ``map``: varies from `each` by argument order.  not a member of `Iterables`
    - ``member``: `has`
    - ``partition``: use `group` (returns `Dict`)
    - ``pluck``: `each` with `item`
    - ``select``: `where`
    - ``size``: `len`
    - ``sortBy``: use `sort` and `by`
    - ``toArray``: `array`
    - ``toJSON``: `json` in `json`
    - ``uniq``: `unique`

    ``base`` includes everything you would expect in
    Python's ``itertools`` module.  There are, however, some
    differences of nomenclature and nuances of design:

    - `chain`: same
    - ``count``: `len`.  `count` actually provides an
      iterator on counting numbers
    - `cycle`: same
    - ``dropwhile``: `dropWhile` in `boost`
    - ``groupby``: try `group` and `by`
    - ``ifilter``: try `whereIter`
    - ``ifilterfalse``: try `whereIter`, `compose`, and `not`
    - ``imap``: try `eachIter`
    - ``islice``: try `sliceIter`
    - ``izip``: try `zipIter`
    - `repeat`: same
    - ``starmap``: try `eachApply` or `eachApplyIter`.  ``starmap``,
      while being more terse of a name, uses "star" to imply a hint on the
      Python-specific variadic argument syntax.  In JavaScript,
      Function.apply provides variadic arguments on each item of an
      iteration.
    - ``takewhile``: try `takeWhile`
    - `tee`: same

*/

var boot = require('./boot');

/*
    the base modules are tightly coupled.  for exampke, 
    the iter, each, and list modules are all cyclically
    dependent.  For this reason, each of these modules
    can be defined in a linear order, but they must all contain
    the ultimate body of exports for their functions to
    work.  For this reason, we copy the entirety of the
    modules' exports to every module after they have
    been defined.
*/
var moduleUrls = [
    './boot', /* require("./boot") */
    './type', /* require("./type") */
    './operator', /* require("./operator") */
    './iter', /* require("./iter") */
    './list', /* require("./list") */
    './set', /* require("./set") */
    './dict', /* require("./dict") */
    './each', /* require("./each") */
    './range', /* require("./range") */
    './string' /* require("./string") */
];
for (var i = 0; i < moduleUrls.length; i++) {
    boot.objectUpdate(exports, require(moduleUrls[i]));
}


/*

    References
    ==========

    <http://solutoire.com/2007/02/02/efficient-looping-in-javascript/>
    A hint on improving (empty) loop performance by 25%.

    .. _[#mro] <http://www.python.org/download/releases/2.3/mro/>
    Michele Simionato details the process of calculating a type's
    C3, monotonic linearization of base types as implemented in Python
    which provides the basis of this implementation.

    .. _[#expand] http:///stevenlevithan.com
    provided by Steve Levithan.

*/

if (environment.window) {

    /*** Schedule
        accepts a `setTimeout` / `clearTimeout` handle number.
    */
    exports.Schedule = exports.type(function Schedule(self) {
        var handle;

        self.init = function (_handle) {
            handle = _handle;
        };

        /**** dismiss
        */
        self.dismiss = function () {
            if (!exports.no(handle))
                environment.window.clearTimeout(handle);
        };

    });

    /*** schedule
        enqueues a function so that it will run after
        the current thread terminates and the
        browser/environment has been
        given a chance to do other stuff.
    */
    exports.schedule = function schedule(continuation) {
        var args = exports.array(arguments);
        var timeout = 0;
        if (args.length == 2) {
            timeout = args[0];
            continuation = args[1];
        }
        if (timeout == Infinity) return exports.Schedule();
        return exports.Schedule(environment.window.setTimeout(function () {
            try {
                continuation();
            } catch (exception) {
                environment.print(exception, 'error');
            }
        }, timeout));
    };

}

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

