/*file chiron src/cache.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

/**
    Provides caching and memoization facilities, inspired by Oliver Steele's
    LRU cache implementation.
*/

/*status works.  requires consideration for cached functions throwing exceptions */

var base = require('./boost');
var optioned = require('./optioned');

/*** Cache
*/
exports.Cache = base.type([optioned.Optioned, base.Dict], function (self, supr) {

    var maxLength = 50;
    var cullFactor = .5;

    /**** option maxLength
    */
    self.option('maxLength', function (value) {
        maxLength = base.number(value);
    });

    /**** option cullFactor
    */
    self.option('cullFactor', function (value) {
        cullFactor = base.number(value);
    });

    /**** option init
    */
    self.option('init', function (value) {
        self.update(value);
    });

    /**** insert
    */
    self.insert = function (item) {
        if (self.len() >= maxLength)
            self.cull();
        var key = item[0], value = item[1];
        return supr.insert([key, exports.CacheItem(key, value)]);
    };

    /**** retrieve
    */
    self.retrieve = function (item) {
        var item = supr.retrieve(item);
        var key = item[0], value = item[1];
        value.touch();
        return [key, value.getValue()];
    };

    /**** iter
    */
    self.iter = function () {
        return supr.iter().eachApplyIter(function (key, value) {
            return [key, value.getValue()];
        });
    };

    /**** cull
    */
    self.cull = function () {
        supr.iter().eachIter(base.get(1)).sorted(
            base.by(base.member('getLastAccess'))
        ).forEach(function (item) {
            if (self.len() <= maxLength * cullFactor)
                throw base.stopIteration;
            else
                self.del(item.getKey());
        });
    };

    /**** copy
    */
    self.copy = function () {
        return Cache({
            'maxLength': maxLength,
            'cullFactor': cullFactor,
            'init': self
        });
    };

});

/*** CacheItem
*/
exports.CacheItem = base.type(function (self, supr) {
    var lastAccess;
    var key;
    var value;

    /**** init
    */
    self.init = function (_key, _value) {
        key = _key;
        value = _value;
        self.touch();
    };
    
    /**** getKey
    */
    self.getKey = function () {
        return key;
    };

    /**** getValue
    */
    self.getValue = function () {
        return value;
    };

    /**** getLastAccess
    */
    self.getLastAccess = function () {
        return lastAccess;
    };

    /**** hash
    */
    self.hash = function () {
        return base.hash(value);
    };

    /**** eq
    */
    self.eq = function (other) {
        return base.eq(value, other);
    };

    /**** repr
    */
    self.repr = function () {
        return '<' + self.getTypeName() + ' ' + base.repr(value) + '>';
    };

    /**** touch
    */
    self.touch = function () {
        lastAccess = new Date();
    };

});

/*** memoize
*/
exports.memoize = base.type(function (self, supr) {
    var continuation;
    var cache;

    /**** init
    */
    self.init = function (/* [cache (dict-like),] continuation */) {
        continuation = arguments[arguments.length - 1];
        cache = arguments.length > 1 ? arguments[0] : base.Dict();
    };

    /**** invoke
    */
    self.invoke = function () {
        var args = base.array(arguments);
        if (!base.has(cache, args)) 
            base.set(cache, args, continuation.apply(this, args));
        return base.get(cache, args);
    };

    /**** getCache
    */
    self.getCache = function () {
        return cache;
    };

    /**** getSource
    */
    self.getSource = function () {
        return continuation;
    };

});

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

