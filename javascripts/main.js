console.log("Main JS file loaded");
//Globals
OUTPUT = null;
INPUT = null;
INPUT_LINES = null;
TOKENS = [];

//Regex Constants
TYPE = '(int|string|boolean)';
CHAR = 'a-z';
SPACE = '\\s';
DIGIT = '\\d';
BOOLOP = '(?:^|[^!=])([!=]=)(?!=)'; // Matches only == and !=, === and !== fails
BOOLVAL = 'false|true';
INTOP = '\\+';
BLOCKS = "\\" + ["{", "}", "(", ")", "\"", "\""].join("\\"); // Curly Brace,

//RE_BLOCKS = new RegExp(BLOCKS, "g");

INVALID = ".*([=]{3,}|(!={2,})|!(?!=)|" + "[^" + CHAR + SPACE + DIGIT + INTOP + BLOCKS + "!" + "=" + "$" + "]).*";
INVALID_ASSIGNMENT = '.*((int|boolean|string)\\s+(\\d|[a-z]\\w+)).*'


// setup the globals
function init(){
  $('#inputTextArea').linedtextarea();
  resetPage();
}

function resetPage(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
  INPUT_LINES = INPUT.val().split("\n");
  TOKENS = [];
  OUTPUT.empty();  // Clear the output text area.
}

function test(){
  resetPage();
  lexer(INPUT.val());
}

function lexer(input){
  checkInvalids();
  generateTokens();
  //console.log(input.split("\n"));
  //raiseFatalError(input);
}

function generateTokens(){
  var line = 0;
  var pos = 0;
  var current_token;
  var RE_BLOCKS = new RegExp("[\{\}\(\)]", "g");

  while(line < INPUT_LINES.length){
    while(pos < INPUT_LINES[line].length){
      current_token = INPUT_LINES[line].charAt(pos);
      //INPUT_LINES[line] = INPUT_LINES[line].substr(1);
      if(RE_BLOCKS.exec(current_token) != null) generateToken(current_token, "Block");

      else if (current_token == "=") {
        if(INPUT_LINES[line].charAt(pos + 1) == "=") {
          generateToken("==", "BoolOp");
          pos++;
          //INPUT_LINES[line] = INPUT_LINES[line].substr(1);
        }
        else generateToken(current_token, "Assignment");
      }

      else if (current_token == "!") {
        if(INPUT_LINES[line].charAt(pos + 1) == "=") {
          generateToken("!=", "BoolOp");
          pos++;
          //INPUT_LINES[line] = INPUT_LINES[line].substr(1);
        }
        else raiseFatalError("Invalid symbol at line: " + line); // This should never be reached due to checkInvalids.
      }
      pos++;
      //else raiseFatalError("Invalid symbol at line " + line);
    }
    pos = 0;
    line++;
  }
  //console.log(TOKENS);
  printTokens();
}

function generateToken(val, given_type){
  TOKENS.push({value:val, type:given_type});
}

function printTokens(printTypes){
  printTypes = printTypes || false; // Hacky way of optional parameter
  var output = [];
  var index;
  for(index = 0; index < TOKENS.length; index++){
    if(printTypes) output.push("" + TOKENS[index].value + ", " + TOKENS[index].type);
    else output.push(TOKENS[index].value);
  }
  console.log(output);
}

function checkInvalids(){
  var line = 0;
  var invalid_re = new RegExp(INVALID, "g");
  var invalid_check;

  while(line < INPUT_LINES.length){
    invalid_check = invalid_re.exec(INPUT_LINES[line]);
    //console.log(INPUT_LINES[line]);
    if(invalid_check != null) raiseFatalError("Invalid symbol found at line: " + (line + 1) + " position: " + invalid_re.lastIndex);
    line++;
  }
  writeOutput("No invalid symbols found.");
}

function writeOutput(message){
  OUTPUT.append(message + "\n");
}

function raiseFatalError(message){
  message = "Fatal Error: " + message + "\n";
  writeOutput(message);
  throw new Error(message);
}