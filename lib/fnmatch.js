
var exports = require("file");

/*String.prototype.glob = function (pattern, flags) 
{
    if (!this.isDirectory())
        return [];

    pattern = exports.join(this, pattern);
    print(pattern);
    print(this.toString());
    var paths = exports.listTree(this).map(function(fileName){return exports.join(this, fileName);}, this),
        results = [];
    
    while (paths.length)
    {
        var path = paths.pop(),
            match = exports.fnmatch(pattern, path, flags|exports.FNM_PATHNAME|exports.);
        print(path+" "+match);
        if (match)
            results.push(path);
    }

    return results;
}*/

exports.FNM_LEADING_DIR = 1 << 1;
exports.FNM_PATHNAME    = 1 << 2;
exports.FNM_PERIOD      = 1 << 3;
exports.FNM_NOESCAPE    = 1 << 4;
exports.FNM_CASEFOLD    = 1 << 5;

exports.FNM_NOMATCH     = false;
exports.FNM_MATCH       = true;

exports.fnmatch = function(/*String*/pattern, /*String*/string, /*int*/flags)
{
    //debugger;
    pattern = String(pattern) || "";
    string = String(string) || "";

    var patternLength = pattern.length,
        stringLength = string.length,
        n = 0,
        c, charAtN;

    for ( var p = 0;  p < patternLength;  p++ )
    {
        c = pattern.charAt(p);
        c = fold(c, flags);
        
        charAtN = string.charAt(n);
        
        switch (c)
        {
            case '?':
            
                if (stringLength === n)
                    return exports.FNM_NOMATCH;
                if (charAtN === exports.SEPARATOR && (flags & exports.FNM_PATHNAME))
                    return exports.FNM_NOMATCH;
                if (charAtN === "." && !(flags & exports.FNM_PERIOD) &&
                    (n == 0 || ((flags & exports.FNM_PATHNAME) && string.charAt(n - 1) === exports.SEPARATOR)))
                    return exports.FNM_NOMATCH;

                break;
            
            case '*':

                if (charAtN === "." && !(flags & exports.FNM_PERIOD) &&
                    (n === 0 || ((flags & exports.FNM_PATHNAME) && string.charAt(n - 1) === exports.SEPARATOR)))
                    return exports.FNM_NOMATCH;

                for (; p < patternLength && (c === '?' || c === '*'); c = pattern.charAt(p++), charAtN = string.charAt(++n))
                {
                    if (((flags & exports.FNM_PATHNAME) && charAtN === exports.SEPARATOR) ||
                        (c === '?' && stringLength === n))
                        return exports.FNM_NOMATCH;
                }

                if (p === patternLength)
                {
                    if ((flags & exports.FNM_PATHNAME) && string.substring(n).indexOf(exports.SEPARATOR) >= 0)
                        return (flags & exports.FNM_LEADING_DIR) ? exports.FNM_MATCH : exports.FNM_NOMATCH;
                    else
                        return exports.FNM_MATCH;
                }

                var c1 = fold((!(flags & exports.FNM_NOESCAPE) && c === '\\') ? pattern.charAt(p) : c, flags);
        
                for (--p; stringLength !== n; charAtN = string.charAt(++n))
                {
                    if ((c === '[' || fold(charAtN, flags) === c1) && 
                        exports.fnmatch(pattern.substring(p), 
                                         string.substring(n), 
                                         flags /*& ~exports.FNM_PERIOD*/) === exports.FNM_MATCH)
                        return exports.FNM_MATCH;
                }

                return exports.FNM_NOMATCH;
                
            case '[':
                
                if (stringLength === n)
                    return exports.FNM_NOMATCH;

                if (charAtN === '.' && !(flags & exports.FNM_PERIOD) && 
                    (n === 0 || (flags & exports.FNM_PATHNAME && string.charAt(n-1) === exports.SEPARATOR)))
                    return exports.FNM_NOMATCH;

                c = fold(pattern.charAt(++p), flags);

                var inverted = pattern.charAt(p) === '!' || pattern.charAt(p) === '^',
                    matched = false;

                if (inverted)
                    c = fold(pattern.charAt(++p), flags);

                while (!matched && c !== ']')
                {
                    var start = fold(c, flags),
                        end = start;

                    if (c === '\\' && !(flags & exports.FNM_NOESCAPE))
                        start = end = fold(pattern.charAt(++p), flags);

                    if (p === patternLength)
                        return exports.FNM_NOMATCH;

                    c = fold(pattern.charAt(++p), flags);

                    if (c === exports.SEPARATOR && flags & exports.FNM_PATHNAME)
                        return exports.FNM_NOMATCH;

                    if (c === '-' && pattern.charAt(p) !== ']')
                    {
                        end = fold(pattern.charAt(++p), flags);
                        if (end === '\\' && !(flags & exports.FNM_NOESCAPE))
                            end = fold(pattern.charAt(p++), flags);

                        if (p === patternLength)
                            return exports.FNM_NOMATCH;
                            
                        c = pattern.charAt(p++);
                    }

                    var c1 = fold(charAtN, flags);
                    matched = inverted ? (c1 < start || c1 > end) : (c1 >= start && c1 <= end);
                }

                if (!matched)
                    return exports.FNM_NOMATCH;//break;
                
                c = pattern.charAt(p);

                while (c !== ']')
                {
                    if (p === patternLength)
                        return exports.FNM_NOMATCH;
                    
                    c = pattern.charAt(++p);

                    if (c === '\\' && !(flags & exports.FNM_NOESCAPE))
                        ++p;
                }

                break;
                
            case '\\':
                
                if (!(flags & exports.FNM_NOESCAPE))
                    c = fold(pattern.charAt(++p), flags);
                
                if (fold(charAtN, flags) !== c)
                    return exports.FNM_NOMATCH;

                break;
                
            default:
            
                if (c !== fold(charAtN, flags))
                    return exports.FNM_NOMATCH;

                break;            
        }
        
        charAtN = string.charAt(++n);
    }
    
    if (stringLength === n || (charAtN === exports.SEPARATOR && flags & exports.FNM_LEADING_DIR))
        return exports.FNM_MATCH;
    else
        return exports.FNM_NOMATCH;
}

var fold = function (c, flags)
{
    return (flags & exports.FNM_CASEFOLD) != 0
        ?  c.toLowerCase(c)
        :  c;
}
