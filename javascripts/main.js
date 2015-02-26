console.log("Main JS file loaded");

/*
Token Object Structure
{
  value: the literal char for the token.
  type: the type of token it is. Example: Type, Char, Boolean.
  line: the line it was found on.
  pos: the position on the above line it was found at.
}
*/

//Globals
OUTPUT = null;
INPUT = null;
INPUT_LINES = null;
TOKENS = [];
PARSE_POSITION = 0;

RE_TYPE = /^(int|string|boolean)/g;
RE_KEYWORD = /^(if|while|print)/g;
RE_BOOLEAN = /^(true|false)/g;

function init(){
  $('#inputTextArea').linedtextarea();
  resetPage();
}

function resetPage(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
  INPUT_LINES = INPUT.val().split("\n");
  TOKENS = [];
  PARSE_POSITION = 0;
  OUTPUT.empty();  // Clear the output text area.
}

function test(){
  resetPage();
  lexer();
  parser();
}

function parser(){
  writeOutput("Beginning Parser.");
  bracesCheck();
  parseProgram();
  writeOutput("Parser completed without errors.");
}

function lexer(){
  checkInvalids();
  generateTokens();
}

function bracesCheck(){
  var index = 0;
  var stack = new Array();
  var re_braces = /[\{\(]/g;

  for (index = 0; index < TOKENS.length; index++){
    current_token = TOKENS[index].value;
    if(current_token.match(re_braces) != null) stack.push(current_token);
    else if(current_token == "}") {
      if(stack.length < 1) raiseFatalError("Unmatched } on Line: " + TOKENS[index - 1].line + ", Position: " + TOKENS[index - 1].pos);
      if(stack.pop() != "{") raiseFatalError("Unexpected } found on Line: " + TOKENS[index].line + ", Position: " + TOKENS[index].pos);
    }
    else if(current_token == ")") {
      if(stack.length < 1) raiseFatalError("Unmatched ) on Line: " + TOKENS[index - 1].line + ", Position: " + TOKENS[index - 1].pos);
      if(stack.pop() != "(") raiseFatalError("Unexpected ) found on Line: " + TOKENS[index].line + ", Position: " + TOKENS[index].pos);
    }
  }
  if(stack.length > 0) raiseFatalError("Unmatched " + stack.pop() + " on Line: " + TOKENS[index - 1].line + ", Position: " + TOKENS[index - 1].pos);
}

function generateTokens(){
  var line = 0;
  var pos = 0;
  var current_token;
  var EOF_found = false;
  var string_mode = false;

  var re_blocks = /[\{\}\(\)]/g;
  var re_digits = /[0-9]/g;
  var re_chars = /[a-z]/g;
  var re_string = /[ a-z]/g;

  while(line < INPUT_LINES.length){
    while(pos < INPUT_LINES[line].length){
      current_token = INPUT_LINES[line].charAt(pos);

      if(string_mode == false){
        if (current_token.match(/\s/g)); // Strip whitespace when not in string mode.
        else if(current_token.match(re_blocks) != null) generateToken(current_token, "Block", line, pos);
        else if(current_token.match(re_digits) != null) generateToken(current_token, "Digit", line, pos);
        else if(current_token == "+") generateToken(current_token, "IntOp", line, pos);

        else if(current_token == "\"") {
          generateToken(current_token, "Quote", line, pos);
          string_mode = true;
        }

        else if (current_token == "=") {
          if(INPUT_LINES[line].charAt(pos + 1) == "=") {
            generateToken("==", "BoolOp", line, pos);
            pos++;
          }
          else generateToken(current_token, "Assignment", line, pos);
        }

        else if (current_token == "!") {
          if(INPUT_LINES[line].charAt(pos + 1) == "=") {
            generateToken("!=", "BoolOp", line, pos);
            pos++;
          }
          else raiseFatalError("Invalid symbol at line: " + line); // This should never be reached due to checkInvalids.
        }

        else if(current_token.match(re_chars) != null) pos = pos + keywordCheck(current_token, line, pos);

        else if(current_token == "$") {generateToken(current_token, "EOF", line, pos); EOF_found = true;}

        // If you reaches here, something has gone horribly wrong.
        else raiseFatalError("Invalid symbol: " + current_token + " at line " + line);
      }
      else{ //String Mode
        if(current_token.match(re_string) != null) generateToken(current_token, "Char", line, pos);
        else if(current_token == "\"") { // Ending Quote
          generateToken(current_token, "Quote", line, pos);
          string_mode = false;
        }
        else if(current_token.match(re_string) == null) raiseFatalError("Invalid or unclosed string on line " + line + ". Only characters and space allowed.");
      }
      pos++;
    }
    pos = 0;
    line++;
  }

  if(EOF_found == false) {
    raiseWarning("Reached EOF but $ not found. Added and continuing to parse.");
    generateToken("$", "EOF", line, pos);
  }
  console.log(printTokens());
  writeOutput("Lexer completed without errors.");
}

function keywordCheck(letter, line, pos){
  // keywordCheck returns how far to move the position pointer.
  var temp = INPUT_LINES[line].substr(pos);
  if(temp.match(RE_TYPE) != null){
    if(letter == "b"){
      generateToken("boolean", "Type", line, pos);
      return 6;
    }
    else if(letter == "i"){
      generateToken("int", "Type", line, pos);
      return 2;
    }
    else if(letter == "s"){
      generateToken("string", "Type", line, pos);
      return 5;
    }
  }
  else if (temp.match(RE_BOOLEAN) != null){
    if(letter == "f"){
      generateToken("false", "BoolVal", line, pos);
      return 4;
    }
    else if(letter == "t"){
      generateToken("true", "BoolVal", line, pos);
      return 3;
    }
  }
  else if (temp.match(RE_KEYWORD) != null){
    if(letter == "i"){
      generateToken("if", "Keyword", line, pos);
      return 1;
    }
    else if(letter == "p"){
      generateToken("print", "Keyword", line, pos);
      return 4;
    }
    else if(letter == "w"){
      generateToken("while", "Keyword", line, pos);
      return 4;
    }
  }
  generateToken(letter, "Char", line, pos);
  return 0;
}

function generateToken(val, given_type, given_line, given_pos){
  TOKENS.push({value:val, type:given_type, line:given_line + 1, pos:given_pos + 1});
}

function printTokens(printTypes){
  printTypes = printTypes || false; // Hacky way of optional parameter
  var output = [];
  var index;
  for(index = 0; index < TOKENS.length; index++){
    if(printTypes) output.push("" + TOKENS[index].value + ", " + TOKENS[index].type);
    else output.push(TOKENS[index].value);
  }
  return output;
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
}

function parseProgram(){
  parseBlock();
  var temp_token = TOKENS[PARSE_POSITION];
  if(temp_token.value != "$") raiseFatalError("Expected $, Found " + temp_token.value + " instead.");
  printToken(TOKENS[PARSE_POSITION]);
}

function parseBlock(){
  var temp_token = TOKENS[PARSE_POSITION];
  if(temp_token.value != "{") raiseFatalError("Expected {, Found " + temp_token.value + " instead.");
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
  parseStatementList();
  temp_token = TOKENS[PARSE_POSITION];
  if(temp_token.value != "}") raiseFatalError("Expected }, Found " + temp_token.value + " instead.");
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
}

function parseStatementList(){
  if(TOKENS[PARSE_POSITION].value == "}") return; // Epsilon Transition
  else {
    parseStatement();
    parseStatementList();
  }
}

function parseStatement(){
  if(TOKENS[PARSE_POSITION].type == "Type") { //VarDecl
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parseVarDecl();
    return;
  }
  else if(TOKENS[PARSE_POSITION].type == "Char") {//AssignmentStatement
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parseAssignment();
    return;
  }
  //else if(TOKENS[PARSE_POSITION].value == "print") return;//PrintStatement
  //else if(TOKENS[PARSE_POSITION].value == "while") return; //WhileStatement
  //else if(TOKENS[PARSE_POSITION].value == "if") return; //IfStatement
  else if(TOKENS[PARSE_POSITION].value == "{") parseBlock(); //Block
  else raiseFatalError(generateUnexpectedTokenError(TOKENS[PARSE_POSITION]));
}

function parseVarDecl(){
  parseID();
}

function parseID(){
  if(TOKENS[PARSE_POSITION].type != "Char") raiseFatalError(generateTokenError("Char", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
}


function parseAssignment(){
  if(TOKENS[PARSE_POSITION].type != "Assignment") raiseFatalError(generateTokenError("Assignment", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
  parseExpr();
}

function parseExpr(){
  if(TOKENS[PARSE_POSITION].type == "Digit") parseIntExpr();
  else if(TOKENS[PARSE_POSITION].type == "Quote") parseStringExpr();
  else if(TOKENS[PARSE_POSITION].type == "BoolVal" || TOKENS[PARSE_POSITION].value == "(") parseBooleanExpr();
  else if(TOKENS[PARSE_POSITION].type == "Char") parseID();
  else raiseFatalError(generateUnexpectedTokenError(TOKENS[PARSE_POSITION]));
}

function parseIntExpr(){
  if(TOKENS[PARSE_POSITION].type != "Digit") raiseFatalError(generateTokenError("Digit", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
  if(TOKENS[PARSE_POSITION].type == "IntOp") {
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parseExpr();
  }
}

function parseBooleanExpr(){
  if(TOKENS[PARSE_POSITION].type == "BoolVal") {
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
  }
  else if(TOKENS[PARSE_POSITION].value == "(") {
    // Expected: ( Expr boolop Expr )
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;

    parseExpr();

    if(TOKENS[PARSE_POSITION].type != "BoolOp") raiseFatalError(generateTokenError("BoolOp", TOKENS[PARSE_POSITION]));
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;

    parseExpr();

    if(TOKENS[PARSE_POSITION].value != ")") raiseFatalError(generateTokenError(")", TOKENS[PARSE_POSITION]));
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
  }
  else raiseFatalError(generateTokenError("BoolVal", TOKENS[PARSE_POSITION]));
}

function parseStringExpr(){
  // Mismatched quotes should never show up here if the lexer is working properly.
  if(TOKENS[PARSE_POSITION].type != "Quote") raiseFatalError(generateTokenError("Quote", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
  while(TOKENS[PARSE_POSITION].type == "Char"){
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
  }
  if(TOKENS[PARSE_POSITION].type != "Quote") raiseFatalError(generateTokenError("Quote", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
}

function printToken(token){
  writeOutput("Found " + token.type + " token. [" + token.value + "]");
}

function generateUnexpectedTokenError(token){
  return ("Unexpected token: [" + token.value + "] of type: " + token.type +
          " on line: " + token.line + ", Position: " + token.pos);
}

function generateTokenError(expected, token){
  return ("Expected token of type: " + expected + ". Got " +  token.type +
          " instead. Line: " + token.line + ", Position: " + token.pos);
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
  throw new Error(message);
}