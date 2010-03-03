
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

// vim: ft=javascript ts=2 sw=2 et:

/**
 * Low-level file system API.
 *
 * An implementation of the CommonJS specification,
 * http://wiki.commonjs.org/wiki/Filesystem/A/0.
 */

/*spec

http://wiki.commonjs.org/wiki/Filesystem/A/0

Version: http://wiki.commonjs.org/index.php?title=Filesystem/A/0&oldid=1995

'''STATUS: PROPOSAL, TRIAL IMPLEMENTATIONS'''

The "fs-base" module exports a minimal, engine-specific interface for
manipulating a file system and constructing raw byte streams.  The [[IO|IO
stream API]] is beyond the scope of this specification.  It is the intent of
this specification to provide exactly and only the components of a file system
API that cannot be implemented in pure JavaScript.  

''Pending the ratification of [[Filesystem/A]]: Implementations may opt to
provide more methods, matching the interfaces specified in [[Filesystem/A]], if
they can be implemented with better performance natively than in pure
JavaScript based on the methods specified here.''

*/

var BOOTSTRAP = require("fs-bootstrap");
var IO = require("io").IO;
var OS = require('os');
var SYSTEM = require("system");
var UTIL = require("util");

var javaPath = function (path) { // XXX was JavaPath in file-engine
    return new java.io.File(String(path) || ".");
};

var cLib;
var getCLib = function () {
    var jna = Packages.com.sun.jna;
    cLib = jna.NativeLibrary.getInstance(
        jna.Platform.isWindows() ? "msvcrt" : "c"
    );
    getCLib = function () {
        return cLib;
    };
    return cLib;
};

/*spec

= Specification =

== Types ==

Arguments used throughout this document will have the following types, unless
explicitly specified otherwise:

* '''path''' is either a String, an Object with a toString() method, or an
Object with a valueOf() method that returns an Object with a toString() method.
In the case where path is an Object, the object must return the same string for
the same path on the same system, provided the path in canonicalizable.

* '''mode''' is an Object describing the open mode for a file. Each property is
subject to a true or falsey test. Meaningful properties include read, write,
append, truncate, create, and exclusive.  ''Note: any value is equivalent to
false if the property is omitted.''

* '''permissions''' is an instance of Permissions, or a duck-type thereof.

The "fs-base" module exports the following constructors:

* '''Permissions''', a class that describes file system permissions. Instances
of Permissions are initially deep copies of all transitively owned properties
of Permissions.default and have a eponymous property for the optional
"constructor" argument of the constructor.
** Mandatory properties on all platforms are Boolean values owner.read and
owner.write. 
** Mandatory properties on UNIX platforms platforms are Boolean values
owner.{read, write, execute}, group.{read, write, execute} and other.{read,
write, execute}. 
** Permissions.default must initially reflect the current default file creation
permissions in the host environment; i.e. in a UNIX environment,
Permissions.default would reflect the inverse of umask. Where this is not
possible, compliant implementations must initialize Permissions.default to
{{owner: {read: true, write: true}}

*/

exports.Permissions = function (permissions, constructor) {
    this.update(exports.Permissions['default']);
    this.update(permissions);
    this.constructor = constructor;
};

exports.UNIX_BITS = Array.prototype.concat.apply(
    [['setUid', undefined], ['setGid', undefined], ['sticky', undefined]],
    ['owner', 'group', 'other'].map(function (user) {
        return ['read', 'write', 'execute'].map(function (permission) {
            return [user, permission];
        });
    })
);

exports.UNIX_BITS_REVERSED = UTIL.reversed(exports.UNIX_BITS);

// XXX beyond spec
exports.Permissions.prototype.update = function (permissions) {
    var self = this;
    if (typeof permissions == "number") {
        // XXX beyond spec
        UTIL.forEachApply(UTIL.zip(
            exports.UNIX_BITS_REVERSED,
            UTIL.reversed(permissions.toString(2))
        ), function (userPermissionPair, bit) {
            self.grant.apply(self, userPermissionPair.concat([bit === "1"]));
        });
    }
    for (var user in permissions) {
        if (UTIL.has(permissions, user)) {
            this[user] = this[user] || {};
            for (var permission in permissions[user]) {
                if (UTIL.has(permissions[user], permission)) {
                    this[user][permission] = permissions[user][permission];
                }
            }
        }
    }
};

// XXX beyond spec
exports.Permissions.prototype.grant = function (what, permission, value) {
    if (value === undefined)
        value = true;
    if (!permission) {
        this[what] = value;
    } else {
        this[what] = this[what] || {};
        this[what][permission] = value;
    }
};

// XXX beyond spec
exports.Permissions.prototype.deny = function (what, permission, value) {
    if (value === undefined)
        value = false;
    if (!permission) {
        this[what] = value;
    } else {
        this[what] = this[what] || {};
        this[what][permission] = value;
    }
};

// XXX beyond spec
exports.Permissions.prototype.can = function (what, permission) {
    if (!permission)
        return !!this[what];
    if (!this[what])
        return false;
    return !!this[what][permission];
};

// XXX beyond spec
exports.Permissions.prototype.toUnix = function () {
    var self = this;
    return parseInt(
        exports.UNIX_BITS.map(function (userPermissionPair) {
            return self.can.apply(self, userPermissionPair) ? '1' : '0';
        }).join(''),
        2
    );
};

exports.Permissions['default'] = new exports.Permissions(
    ~parseInt(getCLib().getFunction("umask").invokeInt([]), 8) & 0777
);

/*spec

== Files ==

; openRaw(path, mode, permissions)
: returns a raw byte stream object with the given mode and permissions from the
[[IO]] system. The details of this object are unspecified, except 
* it has a "close" method that closes any operating-system level resources
allocated by "openRaw", and 
* the garbage collector must finalize the stream by performing an equivalent
operation to the "close" method to prevent resource leaks.

"openRaw" throws an exception when "path" cannot be opened, or "path" refers to
a directory.
* "openRaw" interprets the '''mode''' object's properties as follows
** '''read''': open for reading
** '''write''': open for writing
** '''append''': open for writing: the file position is set to the end of the
file before every write. An exception is thrown when append is not used in
conjunction with write.
** '''create''': create the file if it does not exist
** '''exclusive''': used only in conjunction with create, specifies that the if
the file already exists that the open should fail. "openRaw" must implement
"exclusive" with atomic file system primitives. "openRaw" must throw an
exception when "path" is a symbolic link, and when "exclusive" is used without
"create".
** '''truncate''': used only in conjunction with "write" or "append", specifies
that if the path exists, it must be truncated (not replaced) by "openRaw".
"openRaw" must throw an exception when "truncate" is used without "write".
* When creating a file, the '''permissions''' object passed to "openRaw" is
used as the argument to the Permissions constructor. The resultant Permissions
instance is used to open this file.

*/

/**
 *  fs_base.openRaw(name[, mode[, perms]]) -> io.File
 *  - name (String): filename
 *  - mode (String | Object): file open mode (read/write etc)
 *  - perms (?): file creation permissions -- not currently supported.
 *
 *  Open a file for reading
 **/

exports.openRaw = function (path, mode, permissions) {
    path = javaPath(path);
    // TODO use permissions

    var {
        read: read,
        write: write,
        append: append,
        update: update,
        create: create, // TODO
        exclusive: exclusive, // TODO
        truncate: truncate // TODO
    } = BOOTSTRAP.mode(mode);

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {
        return new IO(null, new Packages.java.io.FileOutputStream(path, append));
    } else if (read) {
        return new IO(new Packages.java.io.FileInputStream(path), null);
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};

/*spec

; move(source, target)
: Moves a file at one path to another. Failure to move the file, or specifying
a directory for target when source is a file must throw an exception. 

* When the files are in the same file system, a compliant implementation must
use the operating system's underlying atomic move or rename function to perform
this operation.
* When the files are not in the same file system, a compliant implementation
may choose to copy-then-remove the original file. This behaviour is encouraged
when there is technical means to accomplish this by system-wide atomic means.
In the case where target is copied, a conforming implementation must
** Overwrite the target file if it exists
** Not create or alter an existing target file unless the entire operation
succeeds
** Transfer permissions from source to target (failure to do so must throw)
** Make an effort to transfer ownership from source to target
** Preserve modification time from source to target (failure to do so must
throw)
** Not remove the source file unless the entire operation succeeds (move does
not throw)

*/

/**
 * fs_base.move(source, target) -> undefined
 * - source (String): source file or directory
 * - target (String): target destination
 *
 * Move the file or directory `source` to `target` using the underlying OS
 * semantics (atomicity, file -> directory etc.)
 **/

exports.move = function (source, target) {
    source = exports.path(source);
    target = exports.path(target);
    source = javaPath(source);
    target = javaPath(target);
    if (!source.renameTo(target))
        throw new Error("failed to rename " + source + " to " + target);
};

/*spec

; remove(path String)
: Removes the file at the given path.  Throws an exception if the path
corresponds to anything that is not a file or a symbolic link.  If "path"
refers to a symbolic link, removes the symbolic link.

*/

/**
 * fs_base.remove(file) -> undefined
 * - file (String): file to remove
 *
 * Attempt to remove the `file` from disk. To remove directories use [[fs_base#removeDirectory]]
 **/

exports.remove = function (path) {
    if (!javaPath(path)['delete']())
        throw new Error("failed to delete " + path);
};

/*spec

; touch(path, mtime_opt Date)
: Sets the modification time of a file or directory at a given path to a
specified time, or the current time.  Creates an empty file at the given path
if no file (special or otherwise) or directory exists, using the default
permissions (as though openRaw were called with no permissions argument).  If
the underlying file system does not support milliseconds, the time is truncated
(not rounded) to the nearest supported unit.   On file systems that support
last-accessed time, this must be set to match the modification time.  Where
possible, the underlying implementation should insure that file creation and
time stamp modification are transactionally related to the same file, rather
than the same directory entry.

*/

/**
 * fs_base.touch(path[, mtime]) -> undefined
 * - path (String): File or directory to touch
 * - mtime (Date): Date to change last modified date to.
 *
 * 'touch' the path, setting the last modified date to `mtime` or now. If there
 * is no file or directory at `path`, an empty file will be created.
 **/

exports.touch = function (path, mtime) {
    if (mtime === undefined || mtime === null)
        mtime = new Date();
    path = javaPath(path);
    path.createNewFile();
    if (!path.setLastModified(mtime.getTime()))
        throw new Error("unable to set mtime of " + path + " to " + mtime);
};

/*spec

== Directories ==

; makeDirectory(path, permissions_opt)
: Create a single directory specified by ''path''. If the directory cannot be
created for any reason an exception must be thrown. This includes if the parent
directories of "path" are not present. The '''permissions''' object passed to
this method is used as the argument to the Permissions constructor. The
resultant Permissions instance is applied to the given path during directory
creation. 

* Conforming implementations must create the directory with the exact
permissions given, rather than applying the permissions after directory
creation. In cases where this is not possible, the directory must be created
with more restrictive permissions than specified, and a subsequent system call
will be used to relax them.

*/

/**
 * fs_base.makeDirectory(dir) -> undefined
 * - dir (String): directory to create
 *
 * Creates a (single) directory. If parent directories do not exist they will
 * not be created by this method.
 **/

exports.makeDirectory = function (path) {
    if (!javaPath(path).mkdir())
        throw new Error("failed to make directory " + path);
};

/*spec

; removeDirectory(path) 
: Removes a directory if it is empty. If path is not empty, not a directory, or
cannot be removed for another reason an exception must be thrown. If path is a
link and refers canonically to a directory, the link must be removed.

*/

/**
 * fs_base.removeDirectory(dir) -> undefined
 * - dir (String): directory to remove
 *
 * Removes an empty directory. A symbolic link is itself removed, rather than
 * the directory it resolves to being removed.
 **/

exports.removeDirectory = function(path) {
    if (!javaPath(String(path))['delete']())
        throw new Error("failed to remove the directory " + path);
};

/*spec

; move(source, target)
: Moves a directory from one path to another on the same file system. Does not
copy the directory under any circumstances. A conforming implementation must
move the directory using the operating system's file-system-atomic move or
rename call. If it cannot be moved for any reason an exception must be thrown.
An exception must be thrown if "target" specifies an existing directory.
: *Note*: this is the same method used to move files. The behaviour differs
depending on whether source is a file or directory.

*/

exports.move = function (source, target) {
    source = exports.path(source);
    target = exports.path(target);
    source = javaPath(source);
    target = javaPath(target);
    if (!source.renameTo(target))
        throw new Error("failed to rename " + source + " to " + target);
};

/*

== Paths ==

; canonical(path) String
: returns the canonical path to a given abstract path.  Canonical paths are
both absolute and intrinsic, such that all paths that refer to a given file
(whether it exists or not) have the same corresponding canonical path.  This
function is equivalent to joining the given path to the current working
directory (if the path is relative), joining all symbolic links along the path,
and normalizing the result to remove relative path (. or ..) references.

* When the underlying implementation is built on a Unicode-aware file system,
Unicode normalization must also be performed on the path using the same normal
form as the underlying file system.

* It is not required that paths whose directories do not exist have a canonical
representation. Such paths will be canonicalized as "undefined". ''Note: this
point has caused some argument, and the exact behaviour in this case needs to
be determined.''

*/

/**
 * fs_base.canonial(path) -> String
 * - path (String):
 *
 * Resolve symlinks and canonicalize `path`. If it is a directory, the returned
 * string will be guarenteed to have a trailing '/'
 **/

exports.canonical = function (path) {
    return String(javaPath(path).getCanonicalPath());
};

/*spec

; workingDirectory() String
: returns the current working directory as an absolute String (not as an object
with a toString method)

*/

/**
 * fs_base.workingDirectory() -> String
 *
 * Get the process's current working directory.
 **/

exports.workingDirectory = function () {
    var jna = Packages.com.sun.jna;
    var cwd = getCLib().getFunction("getcwd");
    var size = 4097;
    var memory = jna.Memory(size);
    var pointer = cwd.invokeInt([memory, size]);
    if (!pointer)
        throw new Error("Could not get working directory: getcwd");
    return memory.getString(0, false);
};

/*spec

; changeWorkingDirectory(path)
: changes the current working directory to the given path, resolved on the
current working directory. Throws an exception if the operation failed. 

* ''Note: It is not required that this method call the operating system's
underlying change-directory system call; virtualizing the appearance of a
working directory at the level of this API to the JavaScript environment is
sufficient for a compliant implementation. Module writers implementing modules
in a language other than JavaScript (i.e. Java or C++) should take care when
interoperating with this module.''

*/

/**
 * fs_base.changeWorkingDirectory(dir) -> undefined
 * - dir (String): new working directory
 *
 * Change the process's current working directory to `dir`.
 **/

exports.changeWorkingDirectory = function (path) {
    path = String(path);
    var error = getCLib().getFunction("chdir").invokeInt([path]);
    if (error)
        throw new Error("Could not change working directory: " + path);
};

/*spec

== Security ==

; owner(path) String
; owner(path) Number ''optional''
: returns the name of the owner of a file with typeof string. Where the owner
name is not defined, a numeric userId with typeof number may be returned
instead. 

*/

// TODO XXX use JNI with stat and getpwnam
exports.owner = function (path) {
    var owner = OS.command(['stat', '-f', '%Su', path]);
    if (/\d+/.match(owner))
        return Number(owner);
    return owner;
};

/*spec

; group(path) String 
; group(path) Number ''optional''
: returns the name of the group owner of a file with typeof string. Where the
group name is not defined, a numeric groupId with typeof number may be returned
instead.  This interface is optional but recommended when Permissions support a
group member; the numeric interface shall not be implemented unless the String
interface is implemented.

*/

// TODO XXX use JNI with stat and getpwnam
exports.group = function (path) {
    var group = OS.command(['stat', '-f', '%Sg', path]);
    if (/\d+/.match(group))
        return Number(group);
    return group;
};

/*spec

; changeOwner(path, name String)
; changeOwner(path, userId Number) ''optional''
: sets the owner of a given file or directory. If path is a symbolic link, the
target file or directory is affected instead. Throws an exception if the
operation fails for any reason (including that current user does not have
permission to change the owner). This method must accept any return values from
the "owner" method.

*/

// TODO use JNI instead of OS.command
exports.changeOwner = function (path, owner, /*XXX beyond spec */ group) {

    if (!owner)
        owner = "";
    else
        owner = String(owner);

    if (group)
        group = String(group);

    if (/:/.test(owner))
        throw new Error("Invalid owner name");
    if (/:/.test(group))
        throw new Error("Invalid group name");

    if (group)
        owner = owner + ":" + String(group);

    OS.command(['chown', owner, path]);
};

/*spec

; changeGroup(path, name String)
; changeGroup(path, userId Number) ''optional''
: sets the group ownership of a given file or directory. If path is a symbolic
link, the target file or directory is affected instead. Throws an exception if
the operation fails for any reason (including that current user does not have
permission to change the group). This method must accept any return values from
the "group" method.  This interface is optional but recommended when
Permissions support a group member; the numeric interface shall not be
implemented unless the String interface is implemented.

*/

// TODO use JNI instead of changeOwner
exports.changeGroup = function (path, group) {
    exports.changeOwner(path, undefined, group);
};

/*spec

; permissions(path) Permissions
: returns a Permissions object describing the current permissions for a given
path. If path is a symbolic link, the returned permissions describe the target
file or directory and not the link file itself.

*/

// XXX TODO use JNI and stat
exports.permissions = function (path) {
    var permissions = parseInt(OS.command(['stat', '-f', '%p']), 8);
    return new exports.Permissions(permissions);
};

/*spec

; changePermissions(path, permissions Permissions)
: sets the permissions for a given path.  The '''permissions''' object passed
to this method is used as the argument to the Permissions constructor. The
resultant Permissions instance is applied to the given path if it is a file or
directory; if path is a symbolic link it will be applied to the link target
instead.

*/

exports.changePermissions = function (path, permissions) {
    permissions = new exports.Permissions(permissions);
    if (!/\bwindows\b/i.test(SYSTEM.os))
        OS.command(['chmod', mode.toUnix().toString(8), path]);
    // XXX Windows code-path
};

/*

== Links ==

Symbolic and hard links must not be emulated with Windows Shortcuts. On systems
where symbolic links are not supported, symbolicLink and readLink must be
undefined. On systems where hard links are not supported, hardLink must be
undefined.

; symbolicLink(source, target)
: creates a symbolic link at the target path that refers to the source path.
Must throw an exception if the target already exists. Conforming
implementations must not rewrite or canonicalize either the source or target
arguments, nor validate that the link target exists, before passing to the
underlying filesystem layer. ''Note: The intent is to allow users to create
directory hierarchies with symbolic links that can be freely moved around a
filesystem and maintain internal referential integrity.''

*/

/**
 * fs_base.symbolicLink(link_target, name) -> undefined
 * - link_target (String): path the symbolic link should point to
 * - name (String): name of symbolic link to create
 *
 * Create a symbolic link in the same manner as `ln -s link_target name` (this
 * function doesn't shell out, this is just an indicator of behaviour.)
 **/

// TODO support Windows with a Junction, presumably using JNI and some DLL
exports.symbolicLink = function (source, target) {
    if (/\bwindows\b/i.test(SYSTEM.os))
        throw new Error("Narwhal on Windows does not support symbolic links.");
    OS.command(['ln', '-s', source, target]);
};

/*spec

; hardLink(source, target)
: creates a hard link at the target path that shares storage with the source
path.  Throws an exception if this is not possible, such as when the source and
target are on separate logical volumes or hard links are not supported by the
volume.

*/

/**
 * fs_base.hardLink(link_target, name) -> undefined
 * - link_target (String): path the hard link should point to
 * - name (String): name of hard link to create
 *
 * Create a hard link in the same manner as `ln link_target name` (this
 * function doesn't shell out, this is just an indicator of behaviour.)
 **/

// TODO windows compatibility, if possible
exports.hardLink = function (source, target) {
    if (/\bwindows\b/i.test(SYSTEM.os))
        throw new Error("Narwhal on Windows does not support hard links.");
    OS.command(['ln', source, target]);
};

/*spec

; readLink(path) String
: returns the immediate target of a symbolic link at a given path.  Throws an
exception if there is no symbolic link at the given path or the link cannot be
read. This function differs from canonical in that it may return a path that
itself is a symbolic link.

*/

/**
 * fs_base.readLink(link) -> String
 * - link (String): symbolic link to read
 *
 * Read the symbolic link and return the (relative) path it links to. Uses
 * [readlink] for the underlying implementation.
 *
 * [readlink]: http://www.opengroup.org/onlinepubs/000095399/functions/readlink.html "POSIX readlink function"
 **/

// XXX TODO use JNI or something to not make a system call
exports.readLink = function (path) {
    return OS.command(['readlink', path]);
};

/*spec

== Tests ==

; exists(path)
: returns true if a file (of any type) or a directory exists at a given path.
If the file is a broken symbolic link, returns false. 

*/

/**
 * fs_base.exists(path) -> Boolean
 * - path (String): path to test
 *
 * Returns true if something exists on the filesystem at the given path, be it
 * a directory, normal file, symlink or special file.
 **/

exports.exists = function (path) {
    return javaPath(path).exists();
};


/*spec

; isFile(path)
: returns true if a path exists and that it, after resolution of symbolic
links, corresponds to a regular file.

*/

/**
 * fs_base.isFile(path) -> Boolean
 * - path (String): path to test
 *
 * Test if `path` is a ordinary file.
 **/

exports.isFile = function (path) {
    try {
        return javaPath(path).isFile();
    } catch (exception) {
    }
    return false;
};

/*spec

; isDirectory(path)
: returns whether a path exists and that it, after resolution of symbolic links, corresponds to a directory.

*/

/**
 * fs_base.isDirectory(path) -> Boolean
 * - path (String): path to test
 *
 * Test if `path` is a directory.
 **/

exports.isDirectory = function (path) {
    try {
        return javaPath(path).isDirectory();
    } catch (exception) {
    }
    return false;
};

/*spec

; isLink(target)
: returns whether a symbolic link exists at "target".  Windows Shortcuts must
not be equated with symbolic links. This function must not follow/resolve
symbolic links.

*/

/**
 * fs_base.isLink(path) -> Boolean
 * - path (String): path to test
 *
 * Test if `path` is a symbolic link.
 **/

exports.isLink = function (path) {
    if (/\bwindows\b/i.test(SYSTEM.os))
        return false;
    return !OS.status(["test", "-L", path]);
};

/*spec

; isReadable(path)
: returns whether a path exists and that it could be opened for reading at the
time of the call using "openRaw" for files or "list" for directories.

*/

/**
 * fs_base.isReadable(path) -> Boolean
 * - path (String): path to test
 *
 * Test if `path` is readable.
 **/

exports.isReadable = function (path) {
    return javaPath(path).canRead();
};

/*spec

; isWriteable(path)
: If a path exists, returns whether a file may be opened for writing, or
entries added or removed from an existing directory.  If the path does not
exist, returns whether entries for files, directories, or links can be created
at its location.

*/

/**
 * fs_base.isWriteable(path) -> Boolean
 * - path (String): path to test
 *
 * Test if `path` is readable.
 **/

exports.isWritable = function (path) {
    return javaPath(path).canWrite();
};

/*spec

; same(pathA, pathB) Boolean
: returns whether two paths refer to the same storage (file or directory),
either by virtue of symbolic or hard links, such that modifying one would
modify the other. In the case where either some or all paths do not exist, we
return false. If we are unable to verify if the storage is the same (such as by
having insufficient permissions), an exception is thrown.

*/

/**
 * fs_base.same(path1, path2) -> Boolean
 * - path1 (String): path to compare
 * - path2 (String): path to compare
 *
 * Compare if the two paths are identical.
 **/

// TODO use JNI stat
exports.same = function (pathA, pathB) {
    // %i is inode
    // %p is the device
    var statA = OS.command(['stat', '-f', '%i,%p', pathA]);
    var statB = OS.command(['stat', '-f', '%i,%p', pathB]);
    return statA === statB;
};

/*spec

; sameFilesystem(pathA, pathB) Boolean
: returns whether two paths refer to an entity on the same filesystem. An
exception will be thrown if it is not possible to determine this.
* In the case where any path does not exist, we yield the same result as though
it did exist, and that any necessary intermediate directories also exist as
real directories and not symbolic links.

*/

// TODO use JNI and stat with clib
exports.sameFilesystem = function () {
    // %p is the device number
    var statA = OS.command(['stat', '-f', '%p', pathA]);
    var statB = OS.command(['stat', '-f', '%p', pathB]);
    return statA === statB;
};

/*spec

== Attributes ==

; size(path) Number
: returns the size of a file in bytes, or throws an exception if the path does
not correspond to an accessible path, or is not a regular file or a link. If
path is a link, returns the size of the final link target, rather than the link
itself. 
: Care should be taken that this number returned is suitably large (i.e. that
we can get useful figures for files over 1GB (30bits+sign bit). If the size of
a file cannot be represented by a JavaScript number, "size" must throw a
RangeError.

*/

/**
 * fs_base.size(path) -> Number
 * - path (String): path
 *
 * Return the size of the file in bytes. Due to the way that ECMAScript
 * behaves, if the file is larger than 65,536 terabytes accuracy will be lost.
 **/

exports.size = function (path) {
    path = javaPath(path);
    return path.length();
};

/*spec

; lastModified(path) Date
: returns the time that a file was last modified as a Date object.

*/

/**
 * fs_base.lastModified(path) -> Date
 * - path (String): path
 *
 * Get the last modification time of `path` as a javascript [[Date]] object.
 **/

exports.lastModified = function (path) {
    path = javaPath(path);
    var lastModified = path.lastModified();
    if (lastModified === 0)
        return undefined;
    return new Date(lastModified);
};

/*spec

== Listing ==

; list(path) Array * String
: returns the names of all the files in a directory, in lexically sorted order.
Throws an exception if the directory cannot be traversed (or path is not a
directory).
: ''Note: this means that <code>list("x")</code> of a directory containing
<code>"a"</code> and <code>"b"</code> would return <code>["a", "b"]</code>, not
<code>["x/a", "x/b"]</code>.''

*/

/**
 * fs_base.list(dir) -> Array
 * - dir (String): directory to list
 *
 * Return an array of the contents of the directory. The elements of the
 * returned list will be prefixed with the directory name, for example:
 *
 *     fs.list('a/b');
 *     // -> ['a/b/c.txt', 'a/b/d.js']
 *
 * The self ('.') and parent ('..') directory entries will not be returned.
 **/

exports.list = function (path) {
    path = javaPath(String(path));
    var listing = path.list();

    if (!(listing instanceof Array)) {
        throw new Error("no such directory: " + path);
    }

    var paths = [];
    for (var i = 0; i < listing.length; i++) {
        paths[i] = String(listing[i]);
    }

    return paths;
};

/*spec

; iterate(path) Iterator * String
: returns an iterator that lazily browses a directory, backward and forward,
for the base names of entries in that directory.

=== Iterator Objects ===

Iterator objects have the following members:

; next() String or Path
: returns the next path in the iteration or throws "StopIteration" if there is none.

; iterator()
: returns itself

; close()
: closes the iteration.  After calling close, all calls to next and prev must throw StopIteration.

*/

// XXX use JNI for low level opendir and readdir
exports.iterate = function (path) {
    var iterator = new Iterator();

    var list = exports.list(path);
    var i = 0; ii = list.length;

    iterator.next = function () {
        if (i < ii)
            return list[i];
        else
            throw StopIteration;
    };

    iterator.iterate = function () {
        return this;
    };

    iterator.close = function () {
        // not relevant since the contents are pre-computed
    };

    // assure that methods are not owned
    // equivalent to Object.create(iterator);

    function Interface () {};
    Interface.prototype = iterator;
    return new Interface();

};

// base type for iterators
var Iterator = function () {
};

/*spec

== Extended Attributes (optional) ==

Extended attribute methods may be defined on systems that may support the
feature on some volumes.  See
[http://en.wikipedia.org/wiki/Extended_file_attributes].

; getAttribute(path, key String, default ByteString) ByteString
: Gets the value of an extended attribute.  If a third argument is provided,
including undefined, and there is no corresponding extended attribute for the
requested key, the default is returned.  Otherwise, if there is no extended
attribute for the requested key, getAttribute must throw an exception. Throws a
ValueError if the volume does not support extended attributes.

; setAttribute(path, key String, value ByteString)
: Sets an extended attribute.  Throws a ValueError if the volume does not
support extended attributes.

; removeAttribute(path, key String)
: Removes the extended attribute for a given key.  If there is no corresponding
key, throws an exception. Throws a ValueError if the volume does not support
extended attributes.

; listAttributeNames(path) Array * String
: returns an Array of Strings of the keys of all extended attributes on a given
path. Throws a ValueError if the volume does not support extended attributes.

== Unicode ==

* Filesystems which are Unicode-compatible shall have their file names
seamlessly translated to and from Strings containing UTF-16BE or UTF-16LE,
depending on the native architecture.

* Filesystems which are not Unicode-compatible shall have file names
represented in JavaScript strings such that all unique filenames generate
unique Strings, and all values returned by the index() method are suitable for
use as a path.

= Notes =

* Conformant implementations working on ''path'' must not alter the permissions
of ''path'''s parent directory to complete an operation, even if altering the
permissions of the parent directory would be necessary for the operation to
succeed.

*/


