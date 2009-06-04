Narwhal Platform: Prototype implementation
===========================================================

in the extensions folder you can find prototype extension which can be installed on any xulrunner based application. 
For a current prototype extension should be installed on firefox (alternatively you can just copy narwhal.js from extension folder to the firefox's components folder)
after firefox restart you should be able to run narwhal with narwzilla platform.

-----------------------
<pre>
<code>
NARWHAL_PLATFORM='narwzilla'
export NARWHAL_PLATFORM
narhwal
</code>
</pre>
-------------------------
P.S.: Currently narwhal runner uses firefox's "Development" profile in order create one you can run firefox with command line argument -P