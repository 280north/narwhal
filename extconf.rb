#!/usr/bin/env ruby


# Choose the best default engine for this platform and make it if needed.

NARWHAL_ROOT = File.expand_path(File.dirname(__FILE__))
CONF_PATH = File.join(NARWHAL_ROOT, 'narwhal.conf')
MAKEFILE = File.join(NARWHAL_ROOT, 'Makefile')

TEST_PATH = File.join("", "System", "Library", "Frameworks", "JavaScriptCore.framework")
JSC_ENGINE = File.join(NARWHAL_ROOT, 'engines', 'jsc')

# Detect JSC
if File.exists?(TEST_PATH) && File.exists?(JSC_ENGINE)
  puts "Using JavaScript Core Engine"

  fp = File.open(CONF_PATH, 'w+')
  fp.write %(NARWHAL_ENGINE="jsc"\n)
  fp.write %(NARWHAL_ENGINE_HOME="engines/jsc"\n)
  fp.close

  fp = File.open(MAKEFILE, 'w+')
  fp.write %(default:\n)
  fp.write %(\tcd #{JSC_ENGINE}; make\n)
  fp.write %(\n)

  fp.write %(install:\n)
  fp.write %(\t# do nothing\n)
  fp.close
  
# Fallback  
else
  puts "Using Default Rhino Engine"
  fp = File.open(MAKEFILE, 'w+')
  fp.write %(default:\n)
  fp.write %(\n)
  fp.write %(install:\n)
  fp.write %(\n)
  fp.close
end

  
  
  