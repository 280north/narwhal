@echo off
setlocal
set HERE=%~dp0
call "%HERE%narwhal.cmd" -m tusk tusk %*
