require("../jack");

Jack.MethodOverride = function(app) {
    return function(env) {
        if (env["REQUEST_METHOD"] == "POST") {
            var request = new Jack.Request(env),
                method = request.POST(Jack.MethodOverride.METHOD_OVERRIDE_PARAM_KEY) || env[Jack.MethodOverride.HTTP_METHOD_OVERRIDE_HEADER];
            if (method && Jack.MethodOverride.HTTP_METHODS.includes(method.toUpperCase())) {
                env["jack.methodoverride.original_method"] = env["REQUEST_METHOD"];
                env["REQUEST_METHOD"] = method.toUpperCase();
            }
        }
        return app(env);
    }
}

Jack.MethodOverride.HTTP_METHODS = ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"];
Jack.MethodOverride.METHOD_OVERRIDE_PARAM_KEY = "_method";
Jack.MethodOverride.HTTP_METHOD_OVERRIDE_HEADER = "HTTP_X_HTTP_METHOD_OVERRIDE";
