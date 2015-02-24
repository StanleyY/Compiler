console.log("Main JS file loaded");
//Globals
OUTPUT = null;
INPUT = null;
INPUT_LINES = null;
TOKENS = [];

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
  var string_mode = false;
  var re_blocks = /[\{\}\(\)]/g;
  var re_digits = /[0-9]/g;
  var re_string = /[ a-z]/g;

  while(line < INPUT_LINES.length){
    while(pos < INPUT_LINES[line].length){
      current_token = INPUT_LINES[line].charAt(pos);

      if(string_mode == false){
        if(current_token.match(re_blocks) != null) generateToken(current_token, "Block");
        else if(current_token.match(re_digits) != null) generateToken(current_token, "Digit");
        else if(current_token == "+") generateToken(current_token, "IntOp");

        else if(current_token == "\"") {
          generateToken(current_token, "Quote");
          string_mode = true;
        }

        else if (current_token == "=") {
          if(INPUT_LINES[line].charAt(pos + 1) == "=") {
            generateToken("==", "BoolOp");
            pos++;
          }
          else generateToken(current_token, "Assignment");
        }

        else if (current_token == "!") {
          if(INPUT_LINES[line].charAt(pos + 1) == "=") {
            generateToken("!=", "BoolOp");
            pos++;
          }
          else raiseFatalError("Invalid symbol at line: " + line); // This should never be reached due to checkInvalids.
        }

        //else raiseFatalError("Invalid symbol at line " + line); // If you reaches here, something has gone horribly wrong.
      }
      else{ //String Mode
        if(current_token.match(re_string) != null) generateToken(current_token, "Char");
        else if(current_token == "\"") { // Ending Quote
          generateToken(current_token, "Quote");
          string_mode = false;
        }
        else raiseFatalError("Unclosed String.");
      }
      pos++;
    }
    pos = 0;
    line++;
  }
  printTokens();
}

function generateToken(val, given_type){
  //console.log("Pushing Token: " + val + " of type: " + given_type);
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
  var re_invalid = /.*([=]{3,}|(!={2,})|\+{2,}|!(?!=)|[^a-z0-9\+\{\}\(\)"!=$ ]).*/g;
  var line = 0;
  var invalid_check;

  while(line < INPUT_LINES.length){
    invalid_check = re_invalid.exec(INPUT_LINES[line]);
    if(invalid_check != null) {
      console.log(invalid_check);
      raiseFatalError("Invalid symbol: " + invalid_check[1] + " found at line: " + (line + 1)
                      + " position: " + (re_invalid.lastIndex - invalid_check[1].length));
    }
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