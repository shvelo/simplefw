"use strict";

const path = require('path'),
    http = require('http'),
    express = require('express'),
    requireAll = require('require-all'),
    app = express(),
    router = express.Router(),
    root = __dirname,
    port = process.env.NODE_PORT || 8008,
    application = requireAll(path.join(root, 'application'), { recursive: true }),
    config = requireAll(path.join(root, 'config'), { recursive: true }),
    simplefw = requireAll(path.join(root, 'simplefw'), { recursive: true });

// Extend with default config
for(let key in simplefw.config) {
    if(!simplefw.config.hasOwnProperty(key))
        continue;

    config[key] = Object.assign(simplefw.config[key], config[key] || {});
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

        console.log("Registering route:", key, routes[key]);

        // Split definition: "<method> <path>"
        let definition = key.split(' '),
            method = definition[0],
            path = definition[1],
            controller = Object.byString(application.controllers, routes[key]);

        if (!controller) {
            console.error("ERROR: Controller not found", routes[key]);
            continue;
        }

        // Support path-only routes
        if (!path) {
            path = method;
            method = 'all';
        }

        method = method.toLowerCase();

        if (http.METHODS.map(m => m.toLowerCase()).indexOf(method) === -1) {
            console.error("ERROR: Unsupported HTTP method:", method);
            continue;
        }

        // Register the controller as route handler
        router[method](path, controller);
    }
};

const registerMiddleware = function (middleware) {
    middleware.forEach(function (name) {
        console.log("Registering middleware:", name);

        let func = Object.byString(application.middleware, name);
        if (!func) {
            console.error("ERROR: Middleware not found:", name);
            return;
        }

        router.use(func);
    });
};

registerMiddleware(config.http.middleware);
registerRoutes(config.routes);

app.use(router);
app.use(express.static(path.join(root, 'public')));

console.log("Listening on", port);
app.listen(port);