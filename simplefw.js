"use strict";

const path = require('path'),
    http = require('http'),
    express = require('express'),
    requireAll = require('require-all'),
    winston = require('winston'),
    EventEmitter3 = require('eventemitter3'),
    bodyParser = require('body-parser'),
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
            winston.log('error', "Not a SimpleFW app: '%s'", root);
            winston.log('error', exception);
            return false;
        }

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
        application.logger = config.log.logger || winston;
        application.events = new EventEmitter3();
        application.expressApp = app;
        application.config = config;

        global.application = application;

        router.registerMiddleware(config.http.middleware, application);
        router.registerRoutes(config.routes, application);

        app.set('trust proxy', config.http.trustProxy);
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.use(router);
        app.use(express.static(path.join(root, 'public')));

        app.set('view engine', config.views.engine);
        app.set('views', path.join(root, config.views.root));

        let port = process.env.PORT || config.http.port,
            ip = process.env.IP || config.http.ip;

        application.logger.info("Listening on 'http://%s:%s'", ip, port);
        app.listen(port, ip);

        if(typeof config.startup === 'function')
            config.startup(application);
    }
};

module.exports = SimpleFW;