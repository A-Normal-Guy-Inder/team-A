/* Marks response private, uncacheable */
function setNoStore(res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
}

function noStore(req, res, next) {
    setNoStore(res);
    next();
}

module.exports = noStore;
module.exports.setNoStore = setNoStore;
