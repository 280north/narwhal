var Q = require("promise");
Q.when(require.async("util").promise, function (util) {
    print("Hello, World!");
    print(util.keys({"a": 10, "b": 20}).join(', '));
    alert(util.upper('hi'));
});
