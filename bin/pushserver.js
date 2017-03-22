#!/usr/bin/env node
/**
 * Created with JetBrains WebStorm.
 * User: smile
 * Date: 14/06/13
 * Time: 15:45
 * To change this template use File | Settings | File Templates.
 */

let dotenv = require('dotenv').config();

var config = require('../lib/Config'),
    web = require('../lib/Web'),
    pack = require('../package'),
    program = require('commander'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

function collect(val, memo) {
    var m = /^[^=]+=[^=]+$/.exec(val);
    if(!m) {
        console.log('Incorrect value "' + val + '": override option should be of the form key=value or key.subKey=value. If the value begins with process.env, it is evaluated.');
    } else {
      memo.push(val);
    }
    return memo;
}

program.version(pack.version)
    .option('-c, --config <configPath>', 'Path to config file')
    .option('-o, --override [overrideValue]', 'Overrides a config value. [overrideValue] should be of the form key=value or key.subKey=value. If the value begins with process.env, it is evaluated.', collect, [])
    .parse(process.argv);

var configPath = program.config;

if (configPath) {
    configPath = configPath.indexOf('/') === 0 ? configPath : path.join(process.cwd(), configPath);
    if (!fs.existsSync(configPath)) {
        console.log('The configuration file doesn\'t exist.');
        return program.outputHelp();
    }
} else {
    console.log('You must provide a configuration file.');
    return program.outputHelp();
}

var overrideValues = {};
_.forEach(program.override, function(valueParam){
    var array = valueParam.split('=');
    var key = array[0];
    var value = array[1];

    var configElement = overrideValues;
    var keys = key.split('.');
    for(var i = 0 ; i < keys.length - 1 ; i++) {
      var k = keys[i];
      configElement[k] = configElement[k] || {};
      configElement = configElement[k];
    }
    var k = keys[keys.length - 1];
    configElement[k] = value;
});

config.initialize(configPath, overrideValues);
web.start();