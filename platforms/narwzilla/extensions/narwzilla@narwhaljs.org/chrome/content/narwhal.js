/**
 * Script exposes narwhals global, system, require, print to the scope it is being included
 * Simply include this file in your overlay.xml or main.xul file:
 * @example
 * <script src="chrome://narwzilla/content/narwhal.js" type="application/x-javascript"/>
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 */
var require = global.require;
var print = global.print;
var system = global.system;
var global = global.global;
