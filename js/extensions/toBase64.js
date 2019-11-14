let toBase64 = function(bytes) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
}