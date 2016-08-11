let deployNpm = require('./../../');
deployNpm.automatic();
//In user case, You can simply write it.
//require('deploy-npm').automatic();

let startCallback = () =>{
  console.log('started!');
}

deployNpm.getEvents().on(deployNpm.ALL_INSTALLED_EVENT, startCallback);
