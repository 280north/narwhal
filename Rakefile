# ===========================================================================
# Project:   Narwhal Rakefile
# Copyright: ©2009 Apple Inc. and contributors
# ===========================================================================

# Rakefile used to build the Narwhal Gem.  Requires Jeweler to function.

ROOT_PATH = File.dirname(__FILE__)
PKG_NAME  = 'narwhal'

# files to ignore changes in
IGNORE_CHANGES = %w[.gitignore .gitmodules .DS_Store .gemspec VERSION.yml ^pkg ^tmp]

# Get the DISTRIBUTION info
require 'yaml'
DIST = YAML.load File.read(File.expand_path(File.join(ROOT_PATH, 'DISTRIBUTION.yml')))

# Make empty to not use sudo
SUDO = 'sudo'

################################################
## LOAD DEPENDENCIES
##
begin
  require 'rubygems'
  require 'jeweler'
  require 'extlib'
  require 'fileutils'
  require 'spec/rake/spectask'

  $:.unshift(ROOT_PATH / 'lib')
  require 'sproutcore'

rescue LoadError => e
  $stderr.puts "WARN: some required gems are not installed (try rake init to setup)"
  $stderr.puts e
end


################################################
## PROJECT DESCRIPTION
##

Jeweler::Tasks.new do |gemspec|
  gemspec.name = 'sproutit-narwhal'
  gemspec.authors = 'Published by Sprout Systems Inc.  Developed by Tom Robinson and contributors'
  gemspec.email = 'contact@sproutcore.com'
  gemspec.homepage = 'http://www.narwhaljs.com'
  gemspec.summary = "JavaScript Command Line"
  
  gemspec.add_development_dependency 'extlib', ">= 0.9.9"
  gemspec.add_development_dependency 'gemcutter', ">= 0.1.0"
  gemspec.add_development_dependency 'jeweler', ">= 1.0.0"

  gemspec.rubyforge_project = "sproutit-narwhal"
    
  gemspec.files.include *%w[engines/jsc/**/* extconf.rb]
  gemspec.files.exclude *%w[.gitignore .gitmodules .DS_Store tmp .hashinfo .svn .git narwhal.conf Makefile]
  gemspec.files.exclude *%w[engines/jsc/**/*.dylib engines/jsc/**/*.dylib.dSYM engines/jsc/**/*.so engines/jsc/**/*.dll engines/jsc/**/*.o engines/jsc/**/*.s engines/jsc/**/*.ii engines/jsc/bin/*]
  
  gemspec.description = File.read(ROOT_PATH / 'README.md')
  
  # name specifically b/c some of the ones in the bin dir aren't useful as gem
  gemspec.executables = %w(narwhal sea tusk)
  gemspec.extensions = ['extconf.rb']
  gemspec.bindir = 'gem_bin'
  
end

Jeweler::RubyforgeTasks.new do |rubyforge|
  rubyforge.doc_task = 'rdoc'
end

Jeweler::GemcutterTasks.new


def git(path, cmd, log=true)
  $stdout.puts("#{path.sub(ROOT_PATH, '')}: git #{cmd}") if log
  git_path = path / '.git'
  git_index = git_path / 'index'
  
  # The env can become polluted; breaking git.  This will avoid that.
  %x[GIT_DIR=#{git_path}; GIT_WORK_TREE=#{path}; GIT_INDEX_FILE=#{git_index}; git #{cmd}]
end

################################################
## CORE TASKS
##
  
desc "performs an initial setup on the tools.  Installs gems, checkout"
task :init => [:install_gems, 'dist:init', 'dist:update'] 

task :install_gems do
  $stdout.puts "Installing gems (may ask for password)"
  system %[#{SUDO} gem install jeweler gemcutter extlib] # dev req
end

namespace :dist do
  
  desc "checkout any frameworks in the distribution"
  task :init do 
    $stdout.puts "Setup distribution"

    DIST.each do |rel_path, opts|
      path = ROOT_PATH / rel_path
      repo_url = opts['repo']
        
      if !File.exists?(path / ".git")
        $stdout.puts "  Creating repo for #{rel_path}"
        FileUtils.mkdir_p File.dirname(path)

        $stdout.puts "\n> git clone #{repo_url} #{path}"
        system "GIT_WORK_TREE=#{path}; cd #{File.dirname(path)}; git clone #{repo_url} #{File.basename(path)}"
      
      else
        $stdout.puts "Found #{rel_path}"
      end
    end
  end
  
  desc "make the version of each distribution item match the one in VERSION"
  task :update => 'dist:init' do
    $stdout.puts "Setup distribution"

    # Use this to get the commit hash
    version_file = ROOT_PATH / 'VERSION.yml'
    if File.exist?(version_file)
      versions = YAML.load File.read(version_file)
      versions = (versions['dist'] || versions[:dist]) if versions
      versions ||= {}
    end
  
    DIST.each do |rel_path, opts|
      path = ROOT_PATH / rel_path
        
      if File.exists?(path / ".git") && versions[rel_path]
        sha = versions[rel_path]

        $stdout.puts "\n> git fetch"
        $stdout.puts git(path, 'fetch')

        $stdout.puts "\n> git checkout #{sha}"
        $stdout.puts git(path, 'checkout #{sha}')
      else
        $stdout.puts "WARN: cannot fix version for #{rel_path}"
      end
      
    end
  end

end

namespace :release do
  
  desc "tags the current repository and any distribution repositories.  if you can push to distribution, then push tag as well"
  task :tag => :update_version do
    tag_name = "REL-#{RELEASE_VERSION}"
    DIST.keys.push(PKG_NAME).each do |rel_path|
      full_path = rel_path==PKG_NAME ? ROOT_PATH : (ROOT_PATH / rel_path)
      git(full_path, "tag -f #{tag_name}")
    end
  end
  
  task :push_tags => :tag do
    tag_name = "REL-#{RELEASE_VERSION}"
    DIST.keys.push(PKG_NAME).each do |rel_path|
      full_path = rel_path==PKG_NAME ? ROOT_PATH : (ROOT_PATH / rel_path)
      git(full_path, "push origin #{tag_name}")
    end
  end
    
    
  desc "prepare release.  verify clean, update version, tag"
  task :prepare => ['git:verify_clean', :update_version, :tag, :push_tags]
  
  desc "release to rubyforge for old skool folks"
  task :rubyforge => [:prepare, 'rubyforge:release']
  
  desc "release to gemcutter for new skool kids"
  task :gemcutter => [:prepare, 'gemcutter:release']
  
  desc "one release to rule them all"
  task :all => [:prepare, 'release:gemcutter', 'release:rubyforge']

end

desc "computes the current hash of the code.  used to autodetect build changes"
task :hash_content do
  
  require 'yaml'
  require 'digest/md5'

  ignore = IGNORE_CHANGES.map do |x| 
    if x =~ /^\^/
      /^#{Regexp.escape(ROOT_PATH / x[1..-1])}/
    else
      /#{Regexp.escape(x)}/
    end
  end

  # First, get the hashinfo if it exists.  use this to decide if we need to
  # rehash
  hashinfo_path = ROOT_PATH / '.hashinfo.yml'
  hash_date = 0
  hash_digest = nil
  
  if File.exist?(hashinfo_path)
    yaml = YAML.load_file(hashinfo_path)
    hash_date = yaml['date'] || yaml[:date] || hash_date
    hash_digest = yaml['digest'] || yaml[:digest] || hash_digest
  end
  
  # paths to search  
  paths = Dir.glob(File.join(ROOT_PATH, '**', '*')).reject do |path|
    File.directory?(path) || (ignore.find { |i| path =~ i })
  end
  
  cur_date = 0
  paths.each do |path|
    mtime = File.mtime(path)
    mtime = mtime.nil? ? 0 : mtime.to_i
    $stdout.puts "detected file change: #{path.gsub(ROOT_PATH,'')}" if mtime > hash_date
    cur_date = mtime if mtime > cur_date
  end
  
  if hash_digest.nil? || (cur_date != hash_date) 
    digests = paths.map do |path|
      Digest::SHA1.hexdigest(File.read(path))
    end
    digests.compact!
    hash_digest = Digest::SHA1.hexdigest(digests.join)
  end
  hash_date = cur_date
  
  # write cache
  File.open(hashinfo_path, 'w+') do |f|
    YAML.dump({ :date => hash_date, :digest => hash_digest }, f)
  end

  # finally set the hash
  CONTENT_HASH = hash_digest
  $stdout.puts "CONTENT_HASH = #{CONTENT_HASH}"
end
  
desc "updates the VERSION file, bumbing the build rev if the current commit has changed"
task :update_version => 'hash_content' do

  path = ROOT_PATH / 'VERSION.yml'
 
  require 'yaml'
 
  # first, load the current yaml if possible
  major = 1
  minor = 0
  build = 99
  rev   = '-0-'
  dist  = {}
  
  if File.exist?(path)
    yaml = YAML.load_file(path)
    major = yaml['major'] || yaml[:major] || major
    minor = yaml['minor'] || yaml[:minor] || minor
    build = yaml['patch'] || yaml[:patch] || build
    rev   = yaml['digest'] || yaml[:digest] || rev
  end
 
  build += 1 if rev != CONTENT_HASH  #increment if needed
  rev = CONTENT_HASH
  
  # Update distribution versions
  DIST.each do |rel_path, ignored|
    dist_path = ROOT_PATH / rel_path
    if File.exists?(dist_path)
      dist_rev = git(dist_path, "log HEAD^..HEAD")
      dist_rev = dist_rev.split("\n").first.scan(/commit ([^\s]+)/)
      dist_rev = ((dist_rev || []).first || []).first

      if dist_rev.nil?
        $stdout.puts " WARN: cannot find revision for #{rel_path}"
      else
        dist[rel_path] = dist_rev
      end
    end
  end
  
  $stdout.puts "write version #{[major, minor, build].join('.')} => #{path}"
  File.open(path, 'w+') do |f|
    YAML.dump({ 
      :major => major, 
      :minor => minor, 
      :patch => build, 
      :digest => rev,
      :dist   => dist 
    }, f)
  end
  
  RELEASE_VERSION = "#{major}.#{minor}.#{build}"
  
end

desc "cleanup the pkg dir" 
task :clean do
  path = ROOT_PATH / 'pkg'
  FileUtils.rm_r(path) if File.directory?(path)
  `rm #{ROOT_PATH / '*.gem'}`
end

namespace :git do
  
  desc "verifies there are no pending changes to commit to git"
  task :verify_clean do
    DIST.keys.push(PKG_NAME).each do |repo_name|
      full_path = repo_name==PKG_NAME ? ROOT_PATH : (ROOT_PATH / repo_name)

      result = git(full_path, 'status')

      if !(result =~ /nothing to commit \(working directory clean\)/)
        if (repo_name != PKG_NAME) ||
           (!(result =~ /#\n#\tmodified:   VERSION.yml\n#\n/))
          $stderr.puts "\nFATAL: Cannot complete task: changes are still pending in the '#{repo_name}' repository."
          $stderr.puts "       Commit your changes to git to continue.\n\n"
          exit(1)
        end
      end 
    end
  end
  
  desc "Collects the current SHA1 commit hash into COMMIT_ID"
  task :collect_commit do
    log = `git log HEAD^..HEAD`
    COMMIT_ID = log.split("\n").first.match(/commit ([\w]+)/).to_a[1]
    if COMMIT_ID.empty?
      $stderr.puts "\nFATAL: Cannot discover current commit id"
      exit(1)
    else
      $stdout.puts "COMMIT_ID = #{COMMIT_ID}"
    end
  end
  
end

# Write a new version everytime we generate
task 'gemspec:generate' => :update_version
task 'rubyforge:setup' => :update_version

Spec::Rake::SpecTask.new


# EOF
