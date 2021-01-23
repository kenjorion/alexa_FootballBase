const util = require('./util');
var https = require('https');


const httpGet = () => {
  return new Promise(((resolve, reject) => {
    var options = {
        host: '118515842376.ngrok.io',
        //port: 443,
        path: '/',
        method: 'GET',
    };
    
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
};

module.exports = {
    httpGet
}