@echo off
setlocal
set HERE=%~dp0
call "%HERE%narwhal.cmd" "%HERE%..\lib\narwhal\tusk.js" %*

