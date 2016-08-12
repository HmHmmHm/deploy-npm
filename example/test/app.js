let deployNpm = require('./../../');
deployNpm.automatic();
//In user case, You can simply write it.
//require('deploy-npm').automatic();

let startCallback = () =>{
  console.log('started!');
}

deployNpm.callback(startCallback);
