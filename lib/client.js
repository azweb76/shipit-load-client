'use strict'

const http = require('http');
const yaml = require('js-yaml');
const fs   = require('fs');
const url  = require('url');

class LoadClient{
  constructor(options){
    this.options = options;
  }
  readFile(ctx){
    return new Promise((resolve, reject) => {
      fs.readFile(ctx.loadFile, 'utf8', (err, data) => {
        if(err) return reject(err);
        ctx.loadInfo = yaml.safeLoad(data);
        resolve(ctx);
      });
    });
  }
  resolveFiles(ctx){
    const loadInfo = ctx.loadInfo;
    if (loadInfo.execution){
      const execution = loadInfo.execution;
      const promises = execution.map(x => {
        if(x.scenario){
          const scenario = x.scenario;
          if(scenario.script){
            return new Promise((resolve, reject) => {
              fs.readFile(scenario.script, 'utf8', (err, data) => {
                if(err) return reject(err);
                const newFile = utils.tempFile();
                ctx.files.push({
                  name: newFile,
                  content: data
                });
                scenario.script = newFile;
              });
            });
          }
        }
        return Promise.resolve();
      });
      return Promise.all(promises).then(() => Promise.resolve(ctx));
    }
    return Promise.resolve(ctx);
  }
  sendTest(ctx){
    return new Promise((resolve, reject) => {
      const loadApiUrl = url.parse(this.options.url);
      const postData = JSON.stringify({
        info: ctx.loadInfo,
        files: ctx.files,
        agents: this.options.agents || 1
      });

      const options = {
        hostname: loadApiUrl.hostname,
        port: loadApiUrl.port,
        path: '/test',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = http.request(options, (res) => {
        if(res.statusCode === 200){
          var data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data = data + chunk;
          });
          res.on('end', () => {
            console.log('data', data);
            ctx.test = JSON.parse(data);
            resolve(ctx);
          });
        }
        else {
          reject(new Error('unable to run load test [statusCode='+res.statusCode+']'))
        }
      });
      req.on('error', err => {
        reject(err);
      });
      req.end(postData);
    });
  }
  getTest(id){
    return new Promise((resolve, reject) => {
      const loadApiUrl = url.parse(this.options.url);
      const options = {
        hostname: loadApiUrl.hostname,
        port: loadApiUrl.port,
        path: '/test/'+id,
      };
      const req = http.request(options, (res) => {
        if(res.statusCode === 200){
          var data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data = data + chunk;
          });
          res.on('end', () => {
            resolve(JSON.parse(data));
          });
        }
        else {
          reject(new Error('unable to get load test [statusCode='+res.statusCode+']'))
        }
      });
      req.on('error', err => {
        reject(err);
      });
      req.end();
    });
  }
  runTestAndWait(ctx){
    return this.sendTest(ctx).then(ctx => {
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          this.getTest(ctx.test.id).then(test => {
            if(test.status === 'done'){
              console.log('test complete!')
              resolve(ctx);
            }
            else {
              console.log(test);
              setTimeout(checkStatus, this.options.pollInterval || 5000);
            }
          })
        }
        checkStatus();
      });
    });
  }
  runTest(loadFile){
    return Promise.resolve({ loadFile, files: [] })
      .then(ctx => this.readFile(ctx))
      .then(ctx => this.resolveFiles(ctx))
      .then(ctx => this.runTestAndWait(ctx))
      .catch(err => {
        console.log(err);
      });
  }
}

exports = module.exports = {
  LoadClient
};
