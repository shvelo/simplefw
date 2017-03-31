"use strict";
const winston = require('winston'),
    moment = require('moment'),
    chalk = require('chalk'),
    pad = require('pad'),
    util = require('util');

module.exports = {
    levelColors: {
        error: chalk.bgRed.bold,
        info: chalk.bgBlue.bold,
        warn: chalk.bgYellow.bold,
        verbose: chalk.bgCyan.bold,
        silly: chalk.bgMagenta.bold,
        debug: chalk.bgBlack.bold
    },
    colorizeLevel: function (level) {
        let colorFunc = module.exports.levelColors[level];
        level = pad(7, level);
        return colorFunc ? colorFunc(level) : chalk.bold.inverse(level);
    },
    logger: new winston.Logger({
        transports: [
            new winston.transports.Console({
                level: 'silly',

                timestamp: function () {
                    return moment().format("D/M/YY H:m:s");
                },

                formatter: function (options) {
                    return [chalk.inverse(options.timestamp()),
                        module.exports.colorizeLevel(options.level),
                        (options.message ? options.message : ''),
                        (options.meta && Object.keys(options.meta).length ? '\n\t' +
                            util.inspect(options.meta, {
                                showHidden: true,
                                colors: true
                            }) : '' )].join(' ');
                }
            })
        ]
    })
};