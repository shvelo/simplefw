"use strict";

const path = require('path'),
    http = require('http'),
    express = require('express'),
    requireAll = require('require-all'),
    winston = require('winston'),
    fwRoot = __dirname;

/**
 * SimpleFW Main
 */
const SimpleFW = {
    /**
     * Initialize SimpleFW app
     * @param {String} root path to app
     */
    init: function (root) {
        const app = express(),
            router = express.Router();
        let application, config, fwConfig;
        winston.cli();

        try {
            application = requireAll(path.join(root, 'application'), { recursive: true });
            config = requireAll(path.join(root, 'config'), { recursive: true });
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

        global.application = application;
        global.config = config;

        Object.byString = function (object, string) {
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
        };

        const registerRoutes = function (routes) {
            for (let key in routes) {
                if (!routes.hasOwnProperty(key))
                    continue;

                if (typeof routes[key] === 'object') {
                    registerRoutes(routes[key]);
                    continue;
                }

                winston.log('verbose', "Registering route:", key, routes[key]);

                // Split definition: "<method> <path>"
                let definition = key.split(' '),
                    method = definition[0],
                    path = definition[1],
                    controller = Object.byString(application.controllers, routes[key]);

                if (!controller) {
                    winston.log('error', "Controller not found", routes[key]);
                    continue;
                }

                // Support path-only routes
                if (!path) {
                    path = method;
                    method = 'all';
                }

                method = method.toLowerCase();

                if (http.METHODS.map(m => m.toLowerCase()).indexOf(method) === -1) {
                    winston.log('error', "Unsupported HTTP method:", method);
                    continue;
                }

                // Register the controller as route handler
                router[method](path, controller);
            }
        };

        const registerMiddleware = function (middleware) {
            middleware.forEach(function (name) {
                winston.log('verbose', "Registering middleware:", name);

                let func = Object.byString(application.middleware, name);
                if (!func) {
                    winston.log('error', "Middleware not found:", name);
                    return;
                }

                router.use(func);
            });
        };

        registerMiddleware(config.http.middleware);
        registerRoutes(config.routes);

        app.use(router);
        app.use(express.static(path.join(root, 'public')));

        let port = process.env.NODE_PORT || config.http.port;

        winston.log('info', "Listening on", port);
        app.listen(port);
    }
};

module.exports = SimpleFW;