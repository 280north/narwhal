@echo off
setlocal

set SHELL=cmd.exe

set PACKAGE_HOME=%~dp0\..

call %PACKAGE_HOME%\bin\activate.cmd

set OLDSEA=%SEA%
set SEA=%PACKAGE_HOME%
set /a SEALVL=%SEALVL% + 1

if "%1" == "" (
    echo SEALVL=%SEALVL%
    echo SEA=%SEA%
    echo PATH=%PATH%
    %SHELL%
) else (
    %SHELL% %*
)

set /a SEALVL=%SEALVL% - 1
echo SEALVL=%SEALVL%
echo SEA=%OLDSEA%
