/*
 * Marks a response as private and uncacheable.
 *
 * Anything carrying session state or somebody's own data must not be kept by
 * the browser or an intermediary — otherwise the back button can serve a copy
 * of a page from before the user logged out. Pragma and Expires are the
 * HTTP/1.0 spellings, kept for proxies that ignore Cache-Control.
 */
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
