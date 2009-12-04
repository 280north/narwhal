@echo off
setlocal
set HERE=%~dp0
call "%HERE%narwhal.cmd" -m "narwhal/tusk" tusk %*

