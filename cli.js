#!/usr/bin/env node
var cli = require('cli'),
    prompt = require('cli-prompt'),
    fs = require('fs'),
    flags = {
        prompt: [false, 'Use prompts instead of arguments', 'boolean', false],
        serverPath: [false, 'Path to server.js (relative to CWD)', 'path', '/server/server.js'],
        modelConfigPath: [false, 'Path to model-config.json (relative to CWD)', 'path', '/server/model-config.json'],
        modelDir: [false, 'Path to models folder (relative to CWD)', 'path', '/server/models'],
        dataSource: [false, 'Name of the data source from data sources.json (required)', 'string', 'db'],
        allNewModels: [false, 'Discover and create all models not in modelDir', 'boolean', 'false' ],
        modelName:  [false, 'Name of a single model/table/collection to create (if not all models)', 'string' ],
        owner: [false, 'Name of owner/schema/database for the models', 'string'],
        relations: [false, 'Include relations', 'boolean',  'false'],
        allOwners: [false, 'Include All Owners', 'boolean',  'false'],
        views: [false, 'Include views', 'boolean',  'false'],
        skip: [false, 'Comma separate model names to skip when discovering new models', 'string', '']
    };

cli.width = 120;
cli.parse(flags);

cli.main(function checkPrompt(args, options) {
    if (options.prompt) {
        // map cli flags into cli-prompt options
        prompt.multi(Object.keys(flags)
            .filter(function(key){
                return key !== 'prompt';
            })
            .map(function(key) {
                var flag = flags[key];
                return {
                    key: key,
                    label: flag[1],
                    type: flag[2],
                    default: flag[3]
                }
            }), main);
        return;
    }
    main(options);
});

function main(options) {
    var serverPath = process.cwd() + options.serverPath,
        modelConfigPath = process.cwd() + options.modelConfigPath,
        modelsPath = process.cwd() + options.modelDir,
        dataSource,
        discoveryOptions = {
            owner: options.owner,
            relations: options.relations !== 'false',
            all: options.allOwners !== 'false',
            views: options.views !== 'false'
        };

    try {
        server = require(serverPath);
        dataSource = server.dataSources[options.dataSource];
    } catch(e) {
        cli.error(e);
        cli.fatal('Unable to require() server.js from ' + serverPath);
    }

    if (!dataSource) {
        cli.fatal('data source ' + options.dataSource + ' not found on server object.');
    }

    if (options.allNewModels !== 'false') {
        var currentModels = fs.readdirSync(modelsPath)
                .filter(function(fname){
                    return fname.match(/.*.json/g)
                })
                .map(function(fname){
                    return fs.readFileSync(modelsPath + '/' + fname);
                })
                .map(function(contents){
                    return JSON.parse(contents).name.toLowerCase();
                }),
            skips = (options.skip || '').split(',').map(function(name){
                    return name.trim().toLowerCase();
                });



        dataSource.discoverModelDefinitions(discoveryOptions, function(err, models){
            if (err) {
                cli.fatal(err);
            } else if (!models || models.length === 0) {
                cli.info('No models found in data source with options:',JSON.stringify(discoveryOptions));
                process.exit();
            }

            var callCnt = models.length;

            models.forEach(function (def) {
                dataSource.discoverSchema(def.name, { owner: discoveryOptions.owner }, function (err, schema) {
                    if (err) {
                        cli.fatal(err);
                    }

                    // doesn't already exist and not skipping
                    if (currentModels.indexOf(schema.name.toLowerCase()) === -1) {
                        if (skips.indexOf(schema.name.toLowerCase()) === -1) {
                            cli.ok('Writing new model files for ' + schema.name);
                            writeFilesForModelSchema(schema);
                        } else {
                            cli.info(schema.name + ' skipped.');
                        }
                    } else {
                        cli.info(schema.name + ' already exists.');
                    }

                    callCnt--;
                    if (callCnt === 0) {
                        process.exit();
                    }
                });
            });
        });
    } else if (options.modelName) {
        dataSource.discoverSchema(options.modelName, { owner: discoveryOptions.owner }, function (err, schema) {
            if (err) {
                cli.fatal(err);
            }

            cli.info('Writing new model files for ' + schema.name);
            writeFilesForModelSchema(schema);
            process.exit();
        });
    } else {
        cli.fatal('You must either specify --allNewModels or --modelName <model/table/collection>');
    }

    function convertModelNameToFileName(modelName) {
        return modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    function defaultJsFileContents(modelName) {
        return 'module.exports = function(/*'+modelName+'*/){};'
    }

    function updateModelConfig(schema) {
        var cfg = JSON.parse(fs.readFileSync(modelConfigPath));

        cfg[schema.name] = {
            dataSource: options.dataSource,
            public: true
        };

        fs.writeFileSync(modelConfigPath, JSON.stringify(cfg, null, 2));
    }

    function writeFilesForModelSchema(schema) {
        var filePath = modelsPath + '/' + convertModelNameToFileName(schema.name);
        fs.writeFileSync(filePath + '.json', JSON.stringify(schema,null,2));
        fs.writeFileSync(filePath + '.js', defaultJsFileContents(schema.name));
        updateModelConfig(schema);
    }
}