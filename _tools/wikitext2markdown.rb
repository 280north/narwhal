#!/usr/bin/env ruby

text = File.read(ARGV[0])

text = text.gsub(/^;;\s*/, "\n* ")
text = text.gsub(/^;\s*([^\n]+)\n/, "\n`\\1`\n\n")
text = text.gsub(/^:\s*/, '')
text = text.gsub(/^\*\*/, '  *')

#text = text.gsub(/\n[ \t]*\={3}\s*([^=]*?)\s*\={3}[ \t]*\n/) do |match|
#  "\n#{$1}\n" + ("="*$1.length) + "\n"
#end
#text = text.gsub(/\n[ \t]*\={4}\s*([^=]*?)\s*\={4}[ \t]*\n/) do |match|
#  "\n#{$1}\n" + ("-"*$1.length) + "\n"
#end
text = text.gsub(/\n[ \t]*(\={1,6})\s*([^=]*?)\s*\1[ \t]*\n/) do |match|
  "\n" + ("#" * $1.length) + " " + $2 + "\n"
end


File.open(ARGV[1], "w") do |f|
  f.write(text)
end
