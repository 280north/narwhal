@echo off
setlocal

:: NARWHAL_HOME is the parent of the bin directory
set NARWHAL_HOME=%~dp0..

:: use Rhino as the default if none is specified in narwhal.conf
set NARWHAL_DEFAULT_ENGINE=rhino

:: load narwhal.conf if it exists
:: TODO: Doesn't fully mimicks the linux `source` command,
::       but should be enough for loading narwhal.conf
if exist "%NARWHAL_HOME%\narwhal.conf" (
    for /f "eol=# tokens=1,2 delims==" %%i in (%NARWHAL_HOME%\narwhal.conf) do set %%i=%%j
)

:: if NARWHAL_ENGINE isn't yet set, set it to the default engine, and export it
if not defined NARWHAL_ENGINE (
	set NARWHAL_ENGINE=%NARWHAL_DEFAULT_ENGINE%
)

:: build the executable name for the engine
set EXECUTABLE_NAME=narwhal-%NARWHAL_ENGINE%.cmd

:: search for the engine home directory
:: TODO: look for more, including ".exe"?
if exist "%NARWHAL_HOME%\engines\%NARWHAL_ENGINE%." (
	set NARWHAL_ENGINE_HOME=%NARWHAL_HOME%\engines\%NARWHAL_ENGINE%
) else (
	echo Can't find executable for %NARWHAL_ENGINE%
	exit /b 1
)

call "%NARWHAL_ENGINE_HOME%\bin\%EXECUTABLE_NAME%" %*
