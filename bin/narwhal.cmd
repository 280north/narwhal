@echo off
setlocal

:: NARWHAL_HOME is the parent the bin directory
set NARWHAL_HOME=%~dp0..

:: use Rhino as the default if none is specified in narwhal.conf
set NARWHAL_DEFAULT_PLATFORM=rhino

:: TODO: load narwhal.conf if it exists

:: if NARWHAL_PLATFORM isn't yet set, set it to the default platform, and export it
if "%NARWHAL_PLATFORM%" == "" (
	set NARWHAL_PLATFORM=%NARWHAL_DEFAULT_PLATFORM%
)

:: build the executable name for the platform
set EXECUTABLE_NAME=narwhal-%NARWHAL_PLATFORM%.cmd

:: search for the platform home directory
:: TODO: look for more, including ".exe"?
if exist %NARWHAL_HOME%\platforms\%NARWHAL_PLATFORM%. (
	set NARWHAL_PLATFORM_HOME=%NARWHAL_HOME%\platforms\%NARWHAL_PLATFORM%
) else (
	echo "Can't find executable for $NARWHAL_PLATFORM"
	exit
)

call %NARWHAL_PLATFORM_HOME%\bin\%EXECUTABLE_NAME% %*
