console.log("Main JS file loaded");
//Globals
OUTPUT = null;
INPUT = null;

//Regex Constants
TYPE = 'int|string|boolean';
CHAR = 'a-zA-Z';
SPACE = '\\s';
DIGIT = '\\d';
BOOLOP = '(?:^|[^!=])([!=]=)(?!=)'; // Matches only == and !=, === and !== fails
BOOLVAL = 'false|true';
INTOP = '\\+';
BLOCKS = "\\" + ["{", "}", "(", ")", "\"", "\""].join("\\"); // Curly Brace,

INVALID = "[^" + CHAR + SPACE + DIGIT + INTOP + BLOCKS + "!" + "=" + "$" + "]";


// setup the globals
function init(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
}

function test(){
  OUTPUT.empty();  // Clear the output text area.
  lexer(INPUT.val());
}

function lexer(input){
  checkInvalids();
  //console.log(input.split("\n"));
  //raiseFatalError(input);
}

function checkInvalids(){
  var lines = INPUT.val().split("\n");
  var line = 0;
  var invalid_re = new RegExp(INVALID, "g");
  var invalid_check;

  while(line < lines.length){
    invalid_check = invalid_re.exec(lines[line]);
    console.log(lines[line]);
    if(invalid_check != null) raiseFatalError("Invalid character found at line: " + (line + 1) );
    line++;
  }
  writeOutput("No invalid characters found.");
}

function writeOutput(message){
  OUTPUT.append(message);
}

function raiseFatalError(message){
  message = "Fatal Error: " + message + "\n";
  writeOutput(message);
  throw new Error(message);
}