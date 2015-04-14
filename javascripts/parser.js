console.log("Parser loaded.");

function parser(){
  writeOutput("Beginning Parser.");
  bracesCheck();
  parseProgram();
  writeOutput("Parser completed without errors.");
}

function processTerminalToken(node){
  printToken(TOKENS[PARSE_POSITION]);
  var new_node = new TreeNode(TOKENS[PARSE_POSITION].value);
  new_node.line = TOKENS[PARSE_POSITION].line;
  new_node.pos = TOKENS[PARSE_POSITION].pos;
  node.addChild(new_node);
  PARSE_POSITION++;
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
  var block_node = generateNewChild(node, "Block");
  if(TOKENS[PARSE_POSITION].value != "{") raiseFatalError("Expected {, Found " + TOKENS[PARSE_POSITION].value + " instead.");
  processTerminalToken(block_node);
  parseStatementList(block_node);
  if(TOKENS[PARSE_POSITION].value != "}") raiseFatalError("Expected }, Found " + TOKENS[PARSE_POSITION].value + " instead.");
  processTerminalToken(block_node);
}

function parseStatementList(node){
  var stmtList_node = generateNewChild(node, "StmtList");
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
  var stmt_node = generateNewChild(node, "Stmt");
  if(TOKENS[PARSE_POSITION].type == "Type") { //VarDecl
    parseVarDecl(stmt_node);
  }
  else if(TOKENS[PARSE_POSITION].type == "Char") {//AssignmentStatement
    parseAssignment(stmt_node);
  }
  else if(TOKENS[PARSE_POSITION].value == "print") { //PrintStatement
    parsePrint(stmt_node);
  }
  else if(TOKENS[PARSE_POSITION].value == "while") {//WhileStatement
    parseWhile(stmt_node);
  }
  else if(TOKENS[PARSE_POSITION].value == "if") {//IfStatement
    parseIf(stmt_node);
  }
  else if(TOKENS[PARSE_POSITION].value == "{") parseBlock(stmt_node); //Block
  else raiseFatalError(generateUnexpectedTokenError(TOKENS[PARSE_POSITION]));
}

function parseType(node){
  var type_node = generateNewChild(node, "Type");
  processTerminalToken(type_node);
}

function parseVarDecl(node){
  var var_decl_node = generateNewChild(node, "VarDecl");
  parseType(var_decl_node);
  parseID(var_decl_node);
}

function parseChar(node){
  var char_node = generateNewChild(node, "Char");
  processTerminalToken(char_node);
}

function parseSpace(node){
  var space_node = generateNewChild(node, "Space");
  processTerminalToken(space_node);
}

function parseID(node){
  var id_node = generateNewChild(node, "ID");
  if(TOKENS[PARSE_POSITION].type != "Char") raiseFatalError(generateTokenError("Char", TOKENS[PARSE_POSITION]));
  parseChar(id_node);
}


function parseAssignment(node){
  var assignment_node = generateNewChild(node, "AssignStmt");
  parseID(assignment_node);
  if(TOKENS[PARSE_POSITION].type != "Assignment") raiseFatalError(generateTokenError("Assignment", TOKENS[PARSE_POSITION]));
  processTerminalToken(assignment_node);
  parseExpr(assignment_node);
}

function parseWhile(node){
  var while_node = generateNewChild(node, "WhileStmt");
  processTerminalToken(while_node);
  parseBooleanExpr(while_node);
  parseBlock(while_node);
}

function parseIf(node){
  var if_node = generateNewChild(node, "IfStmt");
  processTerminalToken(if_node);
  parseBooleanExpr(if_node);
  parseBlock(if_node);
}

function parsePrint(node){
  var print_node = generateNewChild(node, "PrintStmt");
  processTerminalToken(print_node);
  if(TOKENS[PARSE_POSITION].value != "(") raiseFatalError(generateTokenError("(", TOKENS[PARSE_POSITION]));
  processTerminalToken(print_node);
  parseExpr(print_node);

  if(TOKENS[PARSE_POSITION].value != ")") raiseFatalError(generateTokenError(")", TOKENS[PARSE_POSITION]));
  processTerminalToken(print_node);
}

function parseExpr(node){
  var expr_node = generateNewChild(node, "Expr");
  if(TOKENS[PARSE_POSITION].type == "Digit") parseIntExpr(expr_node);
  else if(TOKENS[PARSE_POSITION].type == "Quote") parseStringExpr(expr_node);
  else if(TOKENS[PARSE_POSITION].type == "BoolVal" || TOKENS[PARSE_POSITION].value == "(") parseBooleanExpr(expr_node);
  else if(TOKENS[PARSE_POSITION].type == "Char") parseID(expr_node);
  else raiseFatalError(generateUnexpectedTokenError(TOKENS[PARSE_POSITION]));
}

function parseDigit(node){
  var digit_node = generateNewChild(node, "Digit");
  processTerminalToken(digit_node);
}

function parseIntOp(node){
  var intop_node = generateNewChild(node, "IntOp");
  processTerminalToken(intop_node);
}

function parseIntExpr(node){
  var int_node = generateNewChild(node, "IntExpr");
  if(TOKENS[PARSE_POSITION].type != "Digit") raiseFatalError(generateTokenError("Digit", TOKENS[PARSE_POSITION]));
  parseDigit(int_node);
  if(TOKENS[PARSE_POSITION].type == "IntOp") {
    parseIntOp(int_node);
    parseExpr(int_node);
  }
}

function parseBooleanVal(node){
  var boolval_node = generateNewChild(node, "BoolVal");
  processTerminalToken(boolval_node);
}

function parseBoolOp(node){
  var boolop_node = generateNewChild(node, "BoolOp");
  processTerminalToken(boolop_node);
}

function parseBooleanExpr(node){
  var boolean_node = generateNewChild(node, "BoolExpr");
  if(TOKENS[PARSE_POSITION].type == "BoolVal") {
    parseBooleanVal(boolean_node);
  }
  else if(TOKENS[PARSE_POSITION].value == "(") {
    // Expected: ( Expr boolop Expr )
    processTerminalToken(boolean_node);

    parseExpr(boolean_node);

    if(TOKENS[PARSE_POSITION].type != "BoolOp") raiseFatalError(generateTokenError("BoolOp", TOKENS[PARSE_POSITION]));
    parseBoolOp(boolean_node);

    parseExpr(boolean_node);

    if(TOKENS[PARSE_POSITION].value != ")") raiseFatalError(generateTokenError(")", TOKENS[PARSE_POSITION]));
    processTerminalToken(boolean_node);
  }
  else raiseFatalError(generateTokenError("BoolVal", TOKENS[PARSE_POSITION]));
}

function parseStringExpr(node){
  var string_node = generateNewChild(node, "StringExpr");
  // Mismatched quotes should never show up here if the lexer is working properly.
  if(TOKENS[PARSE_POSITION].type != "Quote") raiseFatalError(generateTokenError("Quote", TOKENS[PARSE_POSITION]));
  processTerminalToken(string_node);
  parseCharList(string_node);
  if(TOKENS[PARSE_POSITION].type != "Quote") raiseFatalError(generateTokenError("Quote", TOKENS[PARSE_POSITION]));
  processTerminalToken(string_node);
}

function parseCharList(node){
  var char_list_node = generateNewChild(node, "CharList");
  if(TOKENS[PARSE_POSITION].type == "Quote") {// Epsilon
    char_list_node.addChild(new TreeNode("ε"));
    return;
  }
  if(TOKENS[PARSE_POSITION].type != "Char") raiseFatalError(generateTokenError("Char", TOKENS[PARSE_POSITION]));
  if(TOKENS[PARSE_POSITION].value == " ") {
    parseSpace(char_list_node);
    parseCharList(char_list_node);
  }
  else {
    parseChar(char_list_node);
    parseCharList(char_list_node);
  }
}