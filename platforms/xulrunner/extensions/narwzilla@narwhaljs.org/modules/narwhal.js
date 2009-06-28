/* Copyright (c) 2006 Irakli Gozalishvili <rfobic@gmail.com>
   See the file LICENSE for licensing information. */

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
var global = Cc["@narwhaljs.org/narwzilla/global;1"].createInstance(Ci.nsINarwhal).system.global;
var require = global.require;
var print = global.print;
var system = global.system;
