/*file chiron src/optioned.js */
/*preamble

    Copyright (c) 2002-2008 Kris Kowal <http://cixar.com/~kris.kowal>
    MIT License
    
    The license terms are stated in full in <license.rst> and at the end
    of all source files.

*/

"use iojs";

var base = require('./base');

exports.Optioned = base.type(function (self, supr) {
    var options = {};

    /**** init
        must be called, even if overriden
    */
    self.init = function (options) {
        self.setOptions(options);
        supr.init();
    };

    /**** option
        an instance decorator that subtypes can use to specify 
        an option setter.  Accepts an option name and a function
        that takes a corresponding value when that option is set
        either when the instance is initialized (with the default
        `init`) or when `setOption` or `setOptions` are called.
    */
    self.option = function (name, handler) {
        options[name] = handler;
    };

    /**** setOptions
    */
    self.setOptions = function (options) {
        base.items(options).eachApply(self.setOption);
    };

    /**** setOption
    */
    self.setOption = function (key, value) {
        if (options[key]) {
            return options[key](value);
        /* if this is a Signaler (duck-type), all signals are options */
        } else if (self.observe && self.hasSignal && self.hasSignal(key)) {
            self.observe(key, value);
        /*  if this is an Observable (duck-type), all methods are options */
        } else if (self.observe && self[key]) {
            self.observe(key, value);
        } else {
            throw new Error("no " + base.repr(key) + " option.");
        }
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

