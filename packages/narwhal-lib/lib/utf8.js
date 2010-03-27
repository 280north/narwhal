
// ported by Kris Kowal

var binary = require('binary');

/*** encode
    converts a Unicode character string into a UTF-8
    character stream.
*/
exports.encode = function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = [];

    for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
            utftext.push(c);
        }
        else if((c > 127) && (c < 2048)) {
            utftext.push((c >> 6) | 192);
            utftext.push((c & 63) | 128);
        }
        else {
            utftext.push((c >> 12) | 224);
            utftext.push(((c >> 6) & 63) | 128);
            utftext.push((c & 63) | 128);
        }

    }

    return binary.ByteString(utftext);
};

/*** decode
    Converts a UTF-8 character string into a
    Unicode character string.
*/
exports.decode = function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while (i < utftext.length) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        } else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        } else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }

    return string;
};

