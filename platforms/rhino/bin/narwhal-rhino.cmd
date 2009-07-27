@echo off
setlocal

:: NARWHAL_PLATFORM_HOME is the parent the bin directory
set NARWHAL_PLATFORM_HOME=%~dp0..

set BOOTSTRAP=%NARWHAL_PLATFORM_HOME%\bootstrap.js

if "%NARWHAL_HOME%" == "" (
	set NARWHAL_HOME=%NARWHAL_PLATFORM_HOME%\..\..
)

set CLASSPATH=%NARWHAL_PLATFORM_HOME%\jars\js.jar;%NARWHAL_PLATFORM_HOME%\jars\jline.jar
if not "%NARWHAL_CLASSPATH%" == "" (
	set CLASSPATH=%NARWHAL_CLASSPATH%;%CLASSPATH%
)

set JAVA_MAIN=org.mozilla.javascript.tools.shell.Main

:: drop into shell if there are no additional arguments
if "%1" == "" (
	java -cp "%CLASSPATH%" "%JAVA_MAIN%" -f "%BOOTSTRAP%" -f -
) else (
	java -cp "%CLASSPATH%" "%JAVA_MAIN%" "%BOOTSTRAP%" "%0" %*
)
