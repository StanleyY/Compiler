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

function parser(){
  writeOutput("Beginning Parser.");
  bracesCheck();
  parseProgram();
  writeOutput("Parser completed without errors.");
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

function parseProgram(){
  parseBlock();
  var temp_token = TOKENS[PARSE_POSITION];
  if(temp_token.value != "$") raiseFatalError("Expected $, Found " + temp_token.value + " instead.");
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
  if(TOKENS.length > PARSE_POSITION) raiseWarning("Input after EOF has been detected. Discarding all input after EOF.");
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
  }
  else if(TOKENS[PARSE_POSITION].type == "Char") {//AssignmentStatement
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parseAssignment();
  }
  else if(TOKENS[PARSE_POSITION].value == "print") { //PrintStatement
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parsePrint();
  }
  else if(TOKENS[PARSE_POSITION].value == "while") {//WhileStatement
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parseWhile();
  }
  else if(TOKENS[PARSE_POSITION].value == "if") {//IfStatement
    printToken(TOKENS[PARSE_POSITION]);
    PARSE_POSITION++;
    parseIf();
  }
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

function parseWhile(){
  parseBooleanExpr();
  parseBlock();
}

function parseIf(){
  parseBooleanExpr();
  parseBlock();
}

function parsePrint(){
  if(TOKENS[PARSE_POSITION].value != "(") raiseFatalError(generateTokenError("(", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;

  parseExpr();

  if(TOKENS[PARSE_POSITION].value != ")") raiseFatalError(generateTokenError(")", TOKENS[PARSE_POSITION]));
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
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