
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

require("global-es5");

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.toByteString)
    Object.defineProperty(String.prototype, "toByteString", {
        "value": function(charset) {
            // RHINO bug: it thinks "this" is a Java string (?!)
            var binary = require("binary");
            return new binary.ByteString(String(this), charset);
        },
        "enumerable": false
    });

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.toByteArray)
    Object.defineProperty(String.prototype, 'toByteArray', {
        "value": function(charset) {
            // RHINO bug: it thinks "this" is a Java string (?!)
            var binary = require("binary");
            return new binary.ByteArray(String(this), charset);
        },
        "enumerable": false
    });

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.prototype.charCodes)
    Object.defineProperty(String.prototype, 'charCodes', {
        "value": function () {
            return Array.prototype.map.call(this, function (c) {
                return c.charCodeAt();
            });
        },
        "enumerable": false
    });

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!String.fromCharCodes)
    Object.defineProperty(String, 'fromCharCodes', {
        "value": function (codes) {
            return codes.map(String.fromCharCode).join('');
        },
        "enumerable": false
    });

// https://wiki.mozilla.org/ServerJS/Binary/B
if (!Array.prototype.toByteString)
    Object.defineProperty(Array.prototype, 'toByteString', {
        "value": function(charset) {
            return new require("binary").ByteString(this);
        },
        "enumerable": false
    });

if (!Array.prototype.toByteArray)
    Object.defineProperty(Array.prototype, 'toByteArray', {
        "value": function(charset) {
            return new ByteArray(this);
        },
        "enumerable": false
    });

