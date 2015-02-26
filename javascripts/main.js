console.log("Main JS file loaded");

//Globals
OUTPUT = null;
INPUT = null;
INPUT_LINES = null;
TOKENS = [];
PARSE_POSITION = 0;

function init(){
  $('#inputTextArea').linedtextarea();
  resetPage();
  defaultTestCase();
}

function resetPage(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
  INPUT_LINES = INPUT.val().split("\n");
  TOKENS = [];
  PARSE_POSITION = 0;
  OUTPUT.empty();  // Clear the output text area.
}

function run(){
  resetPage();
  lexer();
  parser();
  OUTPUT.scrollTop(0);
}

function writeOutput(message){
  OUTPUT.append(message + "\n");
}

function raiseWarning(message){
  message = "Warning: " + message;
  writeOutput(message);
}

function raiseFatalError(message){
  message = "Fatal Error: " + message;
  writeOutput(message);
  OUTPUT.scrollTop(OUTPUT[0].scrollHeight); // Scroll to the bottom.
  throw new Error(message);
}