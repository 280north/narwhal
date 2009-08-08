@echo off
setlocal

:: NARWHAL_HOME is the parent the bin directory
set NARWHAL_HOME=%~dp0..

:: use Rhino as the default if none is specified in narwhal.conf
set NARWHAL_DEFAULT_ENGINE=rhino

:: TODO: load narwhal.conf if it exists

:: if NARWHAL_ENGINE isn't yet set, set it to the default engine, and export it
if "%NARWHAL_ENGINE%" == "" (
	set NARWHAL_ENGINE=%NARWHAL_DEFAULT_ENGINE%
)

:: build the executable name for the engine
set EXECUTABLE_NAME=narwhal-%NARWHAL_ENGINE%.cmd

:: search for the engine home directory
:: TODO: look for more, including ".exe"?
if exist %NARWHAL_HOME%\engines\%NARWHAL_ENGINE%. (
	set NARWHAL_ENGINE_HOME=%NARWHAL_HOME%\engines\%NARWHAL_ENGINE%
) else (
	echo "Can't find executable for %NARWHAL_ENGINE%"
	exit
)

call %NARWHAL_ENGINE_HOME%\bin\%EXECUTABLE_NAME% %*
