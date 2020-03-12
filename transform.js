#!/usr/bin/env node

const fs = require('fs');
const ArgumentParser = require('argparse').ArgumentParser;
const chalk = require('chalk');
const path = require('path');
const util = require('util');
const { parseFudomo, transform, FudomoComputeException, TransformationContext } = require('fudomo-transform');

const { loadModel } = require('fudomo-transform/src/model-io-node.js');
const { getRunnerClassById, getRunnerClassByFileExtension, addToArgumentParser } = require('fudomo-transform/src/runners-node.js');

var enableLog = true;
var _logIndent = '';

function indentLog() {
  _logIndent += '  ';
}

function dedentLog() {
  _logIndent = _logIndent.slice(0, -2);
}

function log(...message) {
  if (enableLog) {
    if (message.length > 1) {
      console.log(_logIndent + message[0], ...message.slice(1));
    } else {
      console.log(_logIndent + message[0]);
    }
  }
}

var argumentParser = new ArgumentParser({ version: '0.1.0', addHelp: true, description: 'Compute decomposition' });
argumentParser.addArgument([ '--verbose' ], { help: 'enable debugging output', required: false, defaultValue: false, action: 'storeTrue' });
argumentParser.addArgument('decomposition', { help: 'decomposition file' });
argumentParser.addArgument('functions-module', { help: 'js module implementing decomposition functions' });
argumentParser.addArgument('data-file', { help: 'data file (js module or oyaml)' });
addToArgumentParser(argumentParser);

var args = argumentParser.parseArgs();

enableLog = args['verbose'];

const externalFunctionsFilename = path.resolve(args['functions-module']);
const FunctionRunner = getRunnerClassByFileExtension(path.extname(externalFunctionsFilename).slice(1));
const functionRunner = new FunctionRunner('.', { functions: externalFunctionsFilename, ...args });

const transformationFilename = args['decomposition'];
const transformationSource = fs.readFileSync(transformationFilename, 'utf-8');

const transformation = parseFudomo(transformationSource, path.resolve(transformationFilename));

if (transformation.hasError) {
  console.error('Transformation has syntactical errors:');
  for (const error of transformation.errors) {
    console.error(`${error.location.position[0][0]}:${error.location.position[0][1]} ${error.severity}: ${error.excerpt}`);
  }
  process.exit(1);
}

const dataFilename = args['data-file'];
let model = loadModel(dataFilename);

const context = new TransformationContext(transformation, model, functionRunner);
context.log = log;
context.indentLog = indentLog;
context.dedentLog = dedentLog;

log(chalk.bold.red(dataFilename));
transform(context).then(result => {
  console.log(result);
}).catch(error => {
   console.error(error.toString(path.resolve('.')));
});
