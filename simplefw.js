"use strict";

const path = require('path'),
    http = require('http'),
    express = require('express'),
    requireAll = require('require-all'),
    winston = require('winston'),
    EventEmitter3 = require('eventemitter3'),
    router = require('./lib/router'),
    fwRoot = __dirname;

/**
 * SimpleFW Main
 */
const SimpleFW = {
    /**
     * Initialize SimpleFW app
     * @name SimpleFW.init
     * @param {String} root path to app
     */
    init: function init(root) {
        const app = express();

        let application, config, fw, fwConfig;
        winston.cli();

        try {
            application = requireAll(path.join(root, 'application'), { recursive: true });
            config = requireAll(path.join(root, 'config'), { recursive: true });
            fw = requireAll(path.join(fwRoot, 'fw'), { recursive: true });
            fwConfig = requireAll(path.join(fwRoot, 'config'), { recursive: true });
        } catch (exception) {
            winston.log('error', "Not a SimpleFW app:", root);
            winston.log('error', exception);
            return false;
        }

        winston.log('info', "Initializing SimpleFW app", root);

        // Extend with default config
        for (let key in fwConfig) {
            if (!fwConfig.hasOwnProperty(key))
                continue;

            config[key] = Object.assign({}, fwConfig[key], config[key] || {});
        }

        // Extend with default stuff
        for (let key in fw) {
            if (!fw.hasOwnProperty(key))
                continue;

            application[key] = Object.assign({}, fw[key], application[key] || {});
        }

        application.root = root;
        application.logger = winston;
        application.events = new EventEmitter3();

        global.application = application;
        global.config = config;

        router.registerMiddleware(config.http.middleware, application);
        router.registerRoutes(config.routes, application);

        app.use(router);
        app.use(express.static(path.join(root, 'public')));

        let port = process.env.NODE_PORT || config.http.port;

        winston.log('info', "Listening on", port);
        app.listen(port);
    }
};

module.exports = SimpleFW;