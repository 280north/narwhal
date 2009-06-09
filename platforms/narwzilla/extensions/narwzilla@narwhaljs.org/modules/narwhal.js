/**
 * Module exposes narwhals global, system, require, print to the scope it is being loaded
 * Simple import this module as in example.
 * @example
 * Components.utils.import('resource://narwzilla/narwhal.js');
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 */
EXPORTED_SYMBOLS = ["global", "require", "print", "system"];
const Cc = Components.classes;
const Ci = Components.interfaces;
var global = Cc["@narwhaljs.org/narwzilla/global;1"].createInstance(Ci.nsINarwhal);
function require(module) {
    return global.require(module);
}
function print(message) {
    return global.print(message);
}
var system = global.system;
var global = global.global;
