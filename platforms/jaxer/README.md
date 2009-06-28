Narwhal Jaxer Platform
======================

This is the beginning of an implementation of Narwhal on Aptana Jaxer.

Usage
-----

In your Jaxer configuration (/local_jaxer/conf/config.js), set 

<pre>
Jaxer.Config.NARWHAL_HOME = "/path/to/your/narwhal";
</pre>

Put narwhal or a link to it in your web directory and in a page:

<pre>
<script runat="server" src="narwhal/platforms/jaxer/bootstrap.js"></script>
</pre>

Many features are not implemented, but the some of basics should work.
