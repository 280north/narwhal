
exports.XmlHttpRequest = function () {
    /*

        subscribes to the lazy function definition pattern, since it
        redefines itself as the first method that works on the first
        call.

        Some other AJAX implementations check
         - Msxml2.XMLHTTP.6.0
         - Msxml2.XMLHTTP.5.0
         - Msxml2.XMLHTTP.4.0
         - Msxml2.XMLHTTP.3.0
         - Microsoft.XMLHTTP

        Microsoft.XMLHTTP is an older name-space, but is equivalent to
        the more lucid Msxml2.XMLHTTP.3.0 and only available when the
        latter is available too.

        Msxml2.XMLHTTP.4.0 has been superseded and is currently only
        intended to support legacy applications.

        Msxml2.XMLHTTP.5.0 was shipped with MS Office 2003 and was
        intended for Office applications. IE7 has this component off
        by default in the Internet zone, leading to canary-yellow
        verification dialogs.

        Msxml2.XMLHTTP.6.0 is currently the standard MS is pushing.
        I originally left out 6.0 since it would increase the burden
        of testing for functionality that cannot be trusted to work
        in all browsers.
        However, I've taken Jonathan Snook's advice to check for
        Microsoft's latest and greatest.

        see: http://snook.ca/archives/javascript/xmlhttprequest_activex_ie/

        Msxml2.XMLHTTP.3.0 is the most widely deployed version and is
        serviced regularly with the OS for security and other reasons.
        It is MS's preferred alternative to MSXML6.

        see: http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx

        see: http://www.telerik.com/documents/AJAX%20Page/Ajax-Part1.pdf page 3

    */

    var trials = [
        function () {return new XMLHttpRequest()},
        function () {return new ActiveXObject("Msxml2.XMLHTTP.6.0")},
        function () {return new ActiveXObject("Msxml2.XMLHTTP.3.0")},
        function () {throw new Error("No HTTP Request object available for your environment.")}
    ];

    var trial, result, exception;
    for (var i = 0; i < trials.length; i++) {
        exception = undefined;
        /* redeclare for posterity */
        exports.XmlHttpRequest = trial = trials[i];
        try {
            result = trial();
        } catch (trialException) {
            exception = trialException;
            continue;
        }
        break;
    }

    if (exception) throw exception;
    else return result;
};

