#!/usr/bin/env ruby

# FIXME: make this a Narwhal program!

DEFAULT_LAYOUT_TEMPLATE = '_layouts/default-template.html'
DEFAULT_LAYOUT = '_layouts/default.html'

`git checkout master doc`

articles = ""

docs = Dir.glob "doc/**/*.md"
docs.each do |doc|
  partial_path = doc.match(/doc\/([^.]+)\.md/)[1]
  title = partial_path.gsub(/-/, ' ').gsub(/\//, ' - ')
  
  articles += "- name: #{title.gsub(/-/,'/')}\n  link: \"/doc/#{partial_path}.html\"\n"
  
  text = File.read(doc)
  File.open(doc, 'w') do |f|
    f.write("---\nlayout: default\ntitle: #{title}\n---")
    f.write(text)
  end
end

layout = File.read(DEFAULT_LAYOUT_TEMPLATE)
header = <<EOS
---
github_url: "http://github.com/tlrobinson/narwhal"
articles:
- name: Introduction
  link: "/"
- name: Getting Started With Narwhal
  link: "/getting-started-with-narwhal.html"
#{articles}
- name: jack & jsgi
  link: "http://jackjs.org/"
---
EOS

File.open(DEFAULT_LAYOUT, 'w') do |f|
  f.write(header)
  f.write(layout)
end