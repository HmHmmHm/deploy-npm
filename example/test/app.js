let deployNpm = require('./../../');
//In user case, You can simply write it.
//let deployNpm = require('deploy-npm');

let startCallback = () =>{
  console.log('started!');
}

deployNpm.callback(startCallback);
deployNpm.automatic();
