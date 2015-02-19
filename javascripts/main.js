console.log("Main JS file loaded");
//Globals
OUTPUT = null;
INPUT = null;
LINES = null;

//Regex Constants
TYPE = '(int|string|boolean)';
CHAR = 'a-z';
SPACE = '\\s';
DIGIT = '\\d';
BOOLOP = '(?:^|[^!=])([!=]=)(?!=)'; // Matches only == and !=, === and !== fails
BOOLVAL = 'false|true';
INTOP = '\\+';
BLOCKS = "\\" + ["{", "}", "(", ")", "\"", "\""].join("\\"); // Curly Brace,

INVALID = "[^" + CHAR + SPACE + DIGIT + INTOP + BLOCKS + "!" + "=" + "$" + "]";
INVALID_ASSIGNMENT = '.*((int|boolean|string)\\s+(\\d|[a-z]\\w+)).*'


// setup the globals
function init(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
  LINES = INPUT.val().split("\n");
}

function test(){
  init();
  OUTPUT.empty();  // Clear the output text area.
  lexer(INPUT.val());
}

function lexer(input){
  //checkInvalids();
  checkAssignments();
  //console.log(input.split("\n"));
  //raiseFatalError(input);
}

function checkInvalids(){
  var line = 0;
  var invalid_re = new RegExp(INVALID, "g");
  var invalid_check;

  while(line < LINES.length){
    invalid_check = invalid_re.exec(LINES[line]);
    console.log(LINES[line]);
    if(invalid_check != null) raiseFatalError("Invalid character found at line: " + (line + 1) );
    line++;
  }
  writeOutput("No invalid characters found.");
}

function checkAssignments(){
  var line = 0;
  var invalid_re = new RegExp(INVALID_ASSIGNMENT, "g");
  console.log(invalid_re);
  var invalid_check;

  while(line < LINES.length){
    invalid_check = invalid_re.exec(LINES[line]);
    console.log(LINES[line]);
    if(invalid_check != null) raiseFatalError("Invalid assignment found at line: " + (line + 1) );
    line++;
  }
  writeOutput("No invalid assignments found.");
}

function writeOutput(message){
  OUTPUT.append(message + "\n");
}

function raiseFatalError(message){
  message = "Fatal Error: " + message + "\n";
  writeOutput(message);
  throw new Error(message);
}