proccess.chdir(__dirname);

var sails;

try{
  sails = require('sails');
}catch(e){
  console.error("ini error sail tidak ada");
  return;
}

var rc;
try{
  rc = require('rc');
}catch(e0){
  try{
    tc = require('sails/node_modules/rc');
  }catch(e1){
    console.log('depeendency tidak di temukan');
    rc = function() { return {}; }
  }
}

sails.lift(rc('sails'));