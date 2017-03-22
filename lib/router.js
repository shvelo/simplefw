"use strict";

const express = require('express'),
    http = require('http'),
    utils = require('./utils'),
    router = express.Router();

/**
 * @name router.registerRoutes
 * Register routes for application
 * @param {Object} routes
 * @param {Object} application
 */
router.registerRoutes = function registerRoutes(routes, application) {
    for (let key in routes) {
        if (!routes.hasOwnProperty(key))
            continue;

        if (typeof routes[key] === 'object') {
            module.exports.registerRoutes(routes[key], application);
            continue;
        }

        application.logger.log('verbose', "Registering route:", key, routes[key]);

        // Split definition: "<method> <path>"
        let definition = key.split(' '),
            method = definition[0],
            path = definition[1],
            controller = utils.byString(application.controllers, routes[key]);

        if (!controller) {
            application.logger.log('error', "Controller not found", routes[key]);
            continue;
        }

        // Support path-only routes
        if (!path) {
            path = method;
            method = 'all';
        }

        method = method.toLowerCase();

        if (http.METHODS.map(m => m.toLowerCase()).indexOf(method) === -1) {
            application.logger.log('error', "Unsupported HTTP method:", method);
            continue;
        }

        // Register the controller as route handler
        router[method](path, controller);
    }
};

/**
 * Register middleware for application
 * @name router.registerMiddleware
 * @param {Object} middleware
 * @param {Object} application
 */
router.registerMiddleware = function registerMiddleware(middleware, application) {
    middleware.forEach(function (name) {
        application.logger.log('verbose', "Registering middleware:", name);

        let middlewareFunction = utils.byString(application.middleware, name);
        if (!middlewareFunction) {
            application.logger.log('error', "Middleware not found:", name);
            return;
        }

        router.use(middlewareFunction);
    });
};

module.exports = router;