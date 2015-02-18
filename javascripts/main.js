console.log("Main JS file loaded");
//Globals
OUTPUT = null;
INPUT = null;

// setup the globals
function init(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
}

function test(){
  lexer(INPUT.val());
}

function lexer(input){
  console.log(input);
  raiseFatalError(input);
}

function raiseFatalError(message){
  OUTPUT.append("Fatal Error: " + message + "\n");
}