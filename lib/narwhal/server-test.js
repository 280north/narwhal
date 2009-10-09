var Q = require("ref-send");
Q.when(require.async("util"), function (util) {
    print("Hello, World!");
    print(util.keys({"a": 10, "b": 20}).join(', '));
    //alert(util.upper('hi'));
});
