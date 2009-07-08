Narwhal Jaxer Platform
======================

This is an implementation of Narwhal on [Aptana Jaxer](http://aptana.com/jaxer/).

Usage
-----

In your Jaxer configuration (/local_jaxer/conf/config.js), set 

<pre>
Jaxer.Config.NARWHAL_HOME = "/path/to/your/narwhal";
</pre>

The Jaxer loader looks for the NARWHAL_HOME environment variable, then the Jaxer.Config property, and finally defaults to `/opt/narwhal`.

Put narwhal or a link to it in your web directory and in a page:

<pre>
&lt;script runat="server" src="narwhal/platforms/jaxer/bootstrap.js"&gt;&lt;/script&gt;
</pre>

Notes
-----

* Many features and objects are not yet implemented, but the some of basics should work.
* The Logger object does not yet use `system.stderr`, but instead outputs to the default Jaxer log (usually in `JAXER_HOME/logs/jaxer.log`.)
