
exports.assert = function (guard, message) {
    if (guard) {
        print('PASS ' + message, 'pass');
    } else {
        print('FAIL ' + message, 'fail');
    }
};

