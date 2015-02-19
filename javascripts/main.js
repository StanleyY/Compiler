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
  console.log(input.split("\n"));
  raiseFatalError(input);
}

function raiseFatalError(message){
  message = "Fatal Error: " + message + "\n";
  OUTPUT.append(message);
  throw new Error(message);
}