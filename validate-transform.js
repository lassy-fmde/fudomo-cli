#!/usr/bin/env node

const ArgumentParser = require('argparse').ArgumentParser;

const { parseFudomo, TransformationValidator } = require('fudomo-transform');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

var argumentParser = new ArgumentParser({ version: '0.1.0', addHelp: true, description: 'Validate Fudomo transformation wrt. metamodel.' });
argumentParser.addArgument('metamodel', { help: 'metamodel yaml file' });
argumentParser.addArgument('transformation', { help: 'fudomo transformation file' });
var args = argumentParser.parseArgs();

const metamodel = YAML.parse(fs.readFileSync(args.metamodel, { encoding: 'utf-8' }));
const transformation = parseFudomo(fs.readFileSync(args.transformation, { encoding: 'utf-8' }), path.resolve(args.transformation));
if (transformation.hasError) {
  console.log('Transformation has syntax errors');
  for (const e of transformation.errors) {
    console.log(e);
  }
} else {
  const validator = new TransformationValidator(metamodel, transformation);

  for (const error of validator.errors) {
    console.log(`(${error.location[0][0]}:${error.location[0][1]}) ${chalk.red(error.context)}: ${error.message}`);
  }
}
