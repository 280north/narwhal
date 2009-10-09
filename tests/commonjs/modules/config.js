(function (env) {
    try {
        var sandbox = require('chiron/sandbox').sandbox;
        var base = require('chiron/base');
        var log = base.List();
        sandbox('test/iojs/program', {print: log.push});
        return [200, {'Content-type': 'text/plain'}, log.eachIter(base.add("\n"))];
    } catch (exception) {
        return [500, {'Content-type': 'text/plain'}, [''+(exception.message || exception)]];
    }
});
