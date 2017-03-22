"use strict";

/**
 * @name utils
 * @type {Object}
 */
const utils = {
    /**
     * Access deep object property by string key
     * @param {Object} object
     * @param {String} string
     * @returns {*}
     */
    byString: function (object, string) {
        string = string.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        string = string.replace(/^\./, '');           // strip a leading dot
        let a = string.split('.');
        for (let i = 0, n = a.length; i < n; ++i) {
            let k = a[i];
            if (k in object) {
                object = object[k];
            } else {
                return;
            }
        }
        return object;
    }
};

module.exports = utils;