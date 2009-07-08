#!/usr/bin/env ruby

def wiki2md(src, dest)
  text = File.read(src)

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

  File.open(dest, "w") do |f|
    f.write(text)
  end
end

if $0 == __FILE__
  wiki2md(ARGV[0], ARGV[1])
end
