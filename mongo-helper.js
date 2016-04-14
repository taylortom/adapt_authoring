var auth = require('./lib/auth');
var origin = require('./lib/application')();
var prompt = require('prompt');

origin.run({skipVersionCheck: true, skipStartLog: true});
origin.on('serverStarted', function() {
  prompt.start();

  console.log('Select the function you need:');
  console.log('- unlock');
  console.log('- resetpass');

  prompt.get({ name: 'function', type: 'string', default: '' }, function (error, result) {
    if(error) return console.log(error);
    switch(result.function) {
      case 'unlock':
      unlockUser();
      break;
      case 'resetpass':
      resetPassword();
      break;
      default:
      console.log('Unrecognised function "' + result + '"');
      break;
    }
  });
});

function unlockUser() {
  console.log("Enter the user's details:");
  prompt.get({ name: 'email', description: "User's e-mail address", type: 'string', default: '', required: true }, function (error, result) {
    if (error) return console.log(error);
    origin.usermanager.updateUser({ email: result.email }, { failedLoginCount: 0 }, function(error, data) {
      if (error) return console.log(error);
      console.log('Account', result.email, 'successfully unlocked!');
      process.exit(0);
    });
  });
};

function resetPassword() {
  console.log("Enter the user's details:");
  prompt.get([
    { name: 'email', description: "User's e-mail address", type: 'string', default: '', required: true},
    { name: 'password', description: "Password", type: 'string', default: '', hidden: true, required: true },
    { name: 'password2', description: 'Please retype the password', type: 'string', default: '', hidden: true, required: true }
  ], function (error, result) {
    if (error) return console.log(error);
    if(result.password !== result.password2) {
      console.log("Passwords don't match. Please try again.");
      return resetPassword();
    }
    auth.hashPassword(result.password, function(error, hash) {
      if (error) return console.log(error);
      origin.usermanager.updateUser({ email: result.email }, { password: hash, failedLoginCount: 0 }, function(err) {
        if (error) return console.log(error);
        console.log("Password for", result.email, "successfully changed!");
        process.exit(0);
      });
    });
  });
};
