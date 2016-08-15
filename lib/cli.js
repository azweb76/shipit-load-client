'use strict'

const LoadClient     = require('./client').LoadClient;
const ArgumentParser = require('argparse').ArgumentParser;
const pkg            = require('../package');

class Cli{
  constructor(){

  }
  _start(args){
    this.loadClient = new LoadClient(args);
    this.loadClient.runTest(args.config)
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
      })
  }
  static parseArgs(){
    const parser = new ArgumentParser({
      version: pkg.version,
      addHelp:true,
      description: 'ShipIt load testing client.'
    });
    parser.addArgument(
      [ '-u', '--url' ],
      {
        help: 'Url to ShipIt load API (or use LOAD_API_URL env variable).',
        defaultValue: process.env.LOAD_API_URL
      }
    );
    parser.addArgument(
      [ '-c', '--config' ],
      {
        help: 'Path to Taurus configuration file.',
        required: true
      }
    );
    parser.addArgument(
      [ '-a', '--agents' ],
      {
        help: 'Number of agents to use.',
        defaultValue: 1
      }
    );
    return parser.parseArgs();
  }
  static start(){
    const cli = new Cli();
    const args = Cli.parseArgs();
    cli._start(args);
  }
}

Cli.start();
