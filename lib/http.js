require("narwhal/deprecated").deprecated(
"http has been moved to http-client");
require("narwhal/util").update(exports, require("http-client"));
