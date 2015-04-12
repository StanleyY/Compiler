console.log("Parser loaded.");

function parser(){
  writeOutput("Beginning Parser.");
  bracesCheck();
  parseProgram();
  writeOutput("Parser completed without errors.");
}

function processTerminalToken(node){
  printToken(TOKENS[PARSE_POSITION]);
  node.addChild(new TreeNode(TOKENS[PARSE_POSITION].value));
  PARSE_POSITION++;
}

function processNonTerminalToken(node, type){
  new_node = new TreeNode(type);
  node.addChild(new_node);
  return new_node;
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
  CST = new TreeNode("Program");
  parseBlock(CST);
  if(TOKENS[PARSE_POSITION].value != "$") raiseFatalError("Expected $, Found " + TOKENS[PARSE_POSITION].value + " instead.");
  printToken(TOKENS[PARSE_POSITION]);
  PARSE_POSITION++;
  if(TOKENS.length > PARSE_POSITION) raiseWarning("Input after EOF has been detected. Discarding all input after EOF.");
}

function parseBlock(node){
  block_node = processNonTerminalToken(node, "Block");
  if(TOKENS[PARSE_POSITION].value != "{") raiseFatalError("Expected {, Found " + TOKENS[PARSE_POSITION].value + " instead.");
  processTerminalToken(block_node);
  parseStatementList(block_node);
  if(TOKENS[PARSE_POSITION].value != "}") raiseFatalError("Expected }, Found " + TOKENS[PARSE_POSITION].value + " instead.");
  processTerminalToken(block_node);
}

function parseStatementList(node){
  stmtList_node = processNonTerminalToken(node, "StmtList");
  if(TOKENS[PARSE_POSITION].value == "}") {
    stmtList_node.addChild(new TreeNode("ε"));
    return; // Epsilon Transition
  }
  else {
    parseStatement(stmtList_node);
    parseStatementList(stmtList_node);
  }
}

function parseStatement(node){
  stmt_node = processNonTerminalToken(node, "Stmt");
  if(TOKENS[PARSE_POSITION].type == "Type") { //VarDecl
    processTerminalToken(stmt_node);
    parseVarDecl(stmt_node);
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

function parseVarDecl(node){
  var_decl_node = processNonTerminalToken(node, "VarDecl");
  parseID(var_decl_node);
}

function parseID(node){
  id_node = processNonTerminalToken(node, "ID");
  if(TOKENS[PARSE_POSITION].type != "Char") raiseFatalError(generateTokenError("Char", TOKENS[PARSE_POSITION]));
  processTerminalToken(id_node);
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