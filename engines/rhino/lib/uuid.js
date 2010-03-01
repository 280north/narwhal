
// -- kriszyp Kris Zyp
// -- tlrobinson Tom Robinson

exports.randomUUID = function(){
    require("narwhal").deprecated("randomUUID is deprecated in favor of uuid");
    return String(java.util.UUID.randomUUID());
};

// compatible with Narwhal's main UUID module
exports.uuid = function(){
    return String(java.util.UUID.randomUUID()).toUpperCase();
};

