@echo off
setlocal

:: NARWHAL_ENGINE_HOME is the parent the bin directory
set NARWHAL_ENGINE_HOME=%~dp0..

set BOOTSTRAP=%NARWHAL_ENGINE_HOME%\bootstrap.js

if "%NARWHAL_HOME%" == "" (
	set NARWHAL_HOME=%NARWHAL_ENGINE_HOME%\..\..
)

setlocal ENABLEDELAYEDEXPANSION
set CLASSPATH=
for /R %NARWHAL_ENGINE_HOME%\jars %%g in (*.jar) do set CLASSPATH=!CLASSPATH!;%%g

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
