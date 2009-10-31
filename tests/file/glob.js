var FILE = require("file"),
    assert = require("test/assert");

// note: need doubled \\ to properly escape in JS

// from RubySpec
function create_mock_dirs(mock_dir) {
    mock_dir = FILE.path(mock_dir);
    var files = [
        ".dotfile",
        ".dotsubdir/.dotfile",
        ".dotsubdir/nondotfile",

        "deeply/.dotfile",
        "deeply/nested/.dotfile.ext",
        "deeply/nested/directory/structure/.ext",
        "deeply/nested/directory/structure/bar",
        "deeply/nested/directory/structure/baz",
        "deeply/nested/directory/structure/file_one",
        "deeply/nested/directory/structure/file_one.ext",
        "deeply/nested/directory/structure/foo",
        "deeply/nondotfile",

        "file_one.ext",
        "file_two.ext",

        "dir_filename_ordering",
        "dir/filename_ordering",

        "nondotfile",

        "subdir_one/.dotfile",
        "subdir_one/nondotfile",
        "subdir_two/nondotfile",
        "subdir_two/nondotfile.ext",

        "special/+",

        "special/^",
        "special/$",

        "special/(",
        "special/)",
        "special/[",
        "special/]",
        "special/{",
        "special/}",
        
        // these three (and corresponding tests) aren't valid on Windows
        "special/*",
        "special/?",
        "special/|"
    ];
    
    files.forEach(function(file) {
        var file = mock_dir.join(file);
        
        file.dirname().mkdirs();
        file.touch();
    });
}

function mockDirs(test) {
    try {
        create_mock_dirs("testGlob");
        test(FILE.path("testGlob"));
    } finally {
        FILE.rmtree("testGlob")
    }
}

var expected_paths = [
    ".",
    "..",
    ".dotfile",
    ".dotsubdir",
    "deeply",
    "dir",
    "dir_filename_ordering",
    "file_one.ext",
    "file_two.ext",
    "nondotfile",
    "special",
    "subdir_one",
    "subdir_two"
];

exports["tests matches both dot and non-dotfiles with '*' and option File::FNM_DOTMATCH"] = function() {
    var expected = [
        ".",
        "..",
        ".dotfile",
        ".dotsubdir",
        "deeply",
        "dir",
        "dir_filename_ordering",
        "file_one.ext",
        "file_two.ext",
        "nondotfile",
        "special",
        "subdir_one",
        "subdir_two"
    ];
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob("*", FILE.FNM_DOTMATCH).sort());
    });
}

exports["tests matches files with any beginning with '*<non-special characters>' and option File::FNM_DOTMATCH"] = function() {
    var expected = [".dotfile", "nondotfile"];
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob("*file", FILE.FNM_DOTMATCH).sort());
    });
}

exports["tests matches any files in the current directory with '**' and option File::FNM_DOTMATCH"] = function() {
    mockDirs(function(dir) {
        assert.eq(expected_paths, dir.glob("**", FILE.FNM_DOTMATCH).sort());
    });
}

exports["tests recursively matches any subdirectories except './' or '../' with '**/' and option File::FNM_DOTMATCH"] = function() {
    var expected = [
        ".dotsubdir/",
        "deeply/",
        "deeply/nested/",
        "deeply/nested/directory/",
        "deeply/nested/directory/structure/",
        "dir/",
        "special/",
        "subdir_one/",
        "subdir_two/"
    ];
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob("**/", FILE.FNM_DOTMATCH).sort());
    });
}

exports["tests matches the literal character '\\' with option File::FNM_NOESCAPE"] = function() {
    FILE.mkdirs('foo?bar');
    try {
        assert.eq(["foo?bar"], FILE.glob('foo?bar', FILE.FNM_NOESCAPE));
        assert.eq([], FILE.glob('foo\\?bar', FILE.FNM_NOESCAPE));
    } finally {
        FILE.rmdir('foo?bar');
    }

    FILE.mkdir('foo\\?bar');
    try {
        assert.eq(["foo\\?bar"], FILE.glob('foo\\?bar', FILE.FNM_NOESCAPE));
    } finally {
        FILE.rmdir('foo\\?bar');
    }
}

exports["tests returns nil for directories current user has no permission to read"] = function() {
    FILE.mkdirs('no_permission');
    FILE.chmod('no_permission', 0);

    try {
        assert.eq(null, FILE.glob('no_permission/*'));
    } finally {
        FILE.rmdir('no_permission')
    }
}

// exports["tests converts patterns with to_str"] = function() {
//   obj = mock('file_one.ext')
//   obj.should_receive(:to_str).and_return('file_one.ext')
// 
//   Dir.send(@method, obj).should == %w[file_one.ext]
// }

exports["tests matches non-dotfiles with '*'"] = function() {
    var expected = [
        "deeply",
        "dir",
        "dir_filename_ordering",
        "file_one.ext",
        "file_two.ext",
        "nondotfile",
        "special",
        "subdir_one",
        "subdir_two"
    ];
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob("**").sort());
    });
}

exports["tests returns empty array when empty pattern provided"] = function() {
    mockDirs(function(dir) {
        assert.eq([], dir.glob("").sort());
    });
}

exports["tests matches regexp special +"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/+'], dir.glob('special/+').sort());
    });
}

exports["tests matches regexp special *"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/*'], dir.glob("special/\\*").sort());
    });
}

exports["tests matches regexp special ?"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/?'], dir.glob("special/\\?").sort());
    });
}

exports["tests matches regexp special |"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/|'], dir.glob("special/|").sort());
    });
}

exports["tests matches regexp special ^"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/^'], dir.glob("special/^").sort());
    });
}

exports["tests matches regexp special $"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/$'], dir.glob("special/$").sort());
    });
}

exports["tests matches regexp special ("] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/('], dir.glob("special/(").sort());
    });
}

exports["tests matches regexp special )"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/)'], dir.glob("special/)").sort());
    });
}

exports["tests matches regexp special ["] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/['], dir.glob("special/\\[").sort());
    });
}

exports["tests matches regexp special ]"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/]'], dir.glob('special/]').sort());
    });
}

exports["tests matches regexp special {"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/{'], dir.glob("special/\\{").sort());
    });
}

exports["tests matches regexp special }"] = function() {
    mockDirs(function(dir) {
        assert.eq(['special/}'], dir.glob("special/\\}").sort());
    });
}

exports["tests matches dotfiles with '.*'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['.','..','.dotfile','.dotsubdir'], dir.glob('.*').sort());
    });
}

exports["tests matches non-dotfiles with '*<non-special characters>'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['nondotfile'], dir.glob('*file').sort());
    });
}

exports["tests matches dotfiles with '.*<non-special characters>'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['.dotfile'], dir.glob('.*file').sort());
    });
}

exports["tests matches files with any ending with '<non-special characters>*'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['file_one.ext','file_two.ext'], dir.glob('file*').sort());
    });
}

exports["tests matches files with any middle with '<non-special characters>*<non-special characters>'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one'], dir.glob('sub*_one').sort());
    });
}

exports["tests matches files with multiple '*' special characters"] = function() {
    mockDirs(function(dir) {
        assert.eq(['dir_filename_ordering','nondotfile','file_one.ext','file_two.ext'].sort(), dir.glob('*fi*e*').sort());
    });
}

exports["tests matches non-dotfiles in the current directory with '**'"] = function() {
    var expected = [
        "deeply",
        "dir",
        "dir_filename_ordering",
        "file_one.ext",
        "file_two.ext",
        "nondotfile",
        "special",
        "subdir_one",
        "subdir_two"
    ];

    mockDirs(function(dir) {
        assert.eq(expected, dir.glob('**').sort());
    });
}

exports["tests matches dotfiles in the current directory with '.**'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['.','..','.dotfile','.dotsubdir'], dir.glob('.**').sort());
    });
}

exports["tests recursively matches any nondot subdirectories with '**/'"] = function() {
    var expected = [
        "deeply/",
        "deeply/nested/",
        "deeply/nested/directory/",
        "deeply/nested/directory/structure/",
        "dir/",
        "special/",
        "subdir_one/",
        "subdir_two/"
    ]
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob('**/').sort());
    });
}

exports["tests recursively matches any subdirectories including ./ and ../ with '.**/'"] = function() {
    mockDirs(function(dir) {
        var dir = dir.join("subdir_one");
        assert.eq(['./','../'], dir.glob('.**/').sort());
    });
}

exports["tests matches a single character except leading '.' with '?'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one'], dir.glob('?ubdir_one').sort());
    });
}

exports["tests accepts multiple '?' characters in a pattern"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one','subdir_two'], dir.glob('subdir_???').sort());
    });
}

exports["tests matches any characters in a set with '[<characters>]'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one'], dir.glob('[stfu]ubdir_one').sort());
    });
}

exports["tests matches any characters in a range with '[<character>-<character>]'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one'], dir.glob('[a-zA-Z]ubdir_one').sort());
    });
}

exports["tests matches any characters except those in a set with '[^<characters>]'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one'], dir.glob('[^wtf]ubdir_one').sort());
    });
}

exports["tests matches any characters except those in a range with '[^<character>-<character]'"] = function() {
    mockDirs(function(dir) {
        assert.eq(['subdir_one'], dir.glob('[^0-9]ubdir_one').sort());
    });
}

exports["tests matches any one of the strings in a set with '{<string>,<other>,...}'"] = function() {
    mockDirs(function(dir) {
        assert.eq(["subdir_one", "subdir_two"], dir.glob('subdir_{one,two,three}').sort());
    });
}

exports["tests accepts string sets with empty strings with {<string>,,<other>}"] = function() {
    var expected = [
        "deeply/nested/directory/structure/file_one.ext",
        "deeply/nested/directory/structure/file_one"
    ].sort();
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob('deeply/nested/directory/structure/file_one{.ext,}').sort());
    });
}

exports["tests matches dot or non-dotfiles with '{,.}*'"] = function() {
    mockDirs(function(dir) {
        assert.eq(expected_paths, dir.glob('{,.}*').sort());
    });
}

exports["tests matches special characters by escaping with a backslash with '\\<character>'"] = function() {
    mockDirs(function(dir) {
        dir.join('foo^bar').mkdir();
        assert.eq(["foo^bar"], dir.glob('foo?bar'));
        assert.eq([], dir.glob('foo\\?bar'));
        assert.eq(["nondotfile"], dir.glob('nond\\otfile'));
    });
}

exports["tests recursively matches directories with '**/<characters>'"] = function() {
    var expected = [
        "deeply/nested/directory/structure/file_one",
        "deeply/nested/directory/structure/file_one.ext",
        "deeply/nondotfile",
    
        "dir/filename_ordering",
        "dir_filename_ordering",
    
        "file_one.ext",
        "file_two.ext",
    
        "nondotfile",
    
        "subdir_one/nondotfile",
        "subdir_two/nondotfile",
        "subdir_two/nondotfile.ext"
    ]
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob('**/*fil?{,.}*').sort());
    });
}

exports["tests '**/*.ext'"] = function() {
    // FIXME: exclude .dotfile?
    var expected = [
        "deeply/nested/.dotfile.ext",
        "deeply/nested/directory/structure/.ext",
        "deeply/nested/directory/structure/file_one.ext",
        "file_one.ext",
        "file_two.ext",
        "subdir_two/nondotfile.ext"
    ]
    
    mockDirs(function(dir) {
        assert.eq(expected, dir.glob('**/*.ext').sort());
    });
}

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
