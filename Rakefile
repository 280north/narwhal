#!/usr/bin/env ruby
# FIXME: make this a Narwhal program!

$:.unshift File.join(File.dirname(__FILE__),'_tools')

require "wiki2md"
require "fileutils"

title_map = {
  "index" => "introduction"
}

exclude = {
  "lib/os/popen" => true
}

DEFAULT_LAYOUT_TEMPLATE = '_layouts/default-template.html'
DEFAULT_LAYOUT = '_layouts/default.html'

task :default => [:build]

task :all => [:checkout, :build, :runserver]

task :checkout do
  puts "Checking out 'docs' from master"
  rm_rf 'docs', :verbose => false
  `git checkout master docs`
  `git checkout master README.md`
  `mv README.md docs/index.md`
end

task :deploy => [:clean, :checkout, :build] do
  `git add $(find . -name "*.md" | xargs)`
  `git commit -a -m 'Deployed on #{Date.today.to_s}'`
  `git push origin gh-pages`
end

task :runserver do
  `jekyll --auto --server`
end

task :build do
  puts "Building"
  
  docs = Dir.glob "docs/**/*.wiki"
  docs.each do |src|
    dest = src.gsub(/\.wiki$/, ".md")
    puts "wiki2md: #{src} => #{dest}"
    wiki2md(src, dest)
  end

  articles = ""

  # find all Markdown files and copy them over, prepending the YAML header
  docs = Dir.glob "docs/**/*.md"
  docs.each do |src|
    partial_path = src.match(/docs\/([^.]+)\.md/)[1]
    next if exclude[partial_path]
    
    dest = "#{partial_path}.md"
    
    puts "prepending yaml header: #{src} => #{dest}"
    
    title = partial_path.gsub(/-/, ' ').gsub(/\//, ' - ')
    title = title_map[title] || title
  
    articles += "- name: #{title.gsub(/-/,'/')}\n  link: \"/#{partial_path}.html\"\n"
  
    mkdir_p File.dirname(dest), :verbose => false
    text = File.read(src)
    File.open(dest, 'w') do |f|
      f.write("---\nlayout: default\ntitle: narwhal - #{title}\n---\n")
      f.write(text)
    end
  end

  layout = File.read(DEFAULT_LAYOUT_TEMPLATE)
  header = <<EOS
---
github_url: "http://github.com/tlrobinson/narwhal"
articles:
#{articles}
links:
- name: jack & jsgi
  link: "http://jackjs.org/"
---
EOS

  File.open(DEFAULT_LAYOUT, 'w') do |f|
    f.write(header)
    f.write(layout)
  end
  
end

task :clean do
  rm_rf "docs"
  rm_rf "_site"
  rm_f DEFAULT_LAYOUT
  Dir.glob("**/*.md").each do |path|
    rm_f path
    # delete empty parent directories
    begin
      until (path = File.dirname(path)) =~ /^(\.|)$/ do
        rmdir path
      end
    rescue
    end
  end
end