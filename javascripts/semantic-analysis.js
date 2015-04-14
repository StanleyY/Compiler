AST = null;
SYMBOL_TABLE = {};
CURRENT_SCOPE = -1;
MAX_SCOPE = -1;
PREVIOUS_SCOPE = [];

function run_SA(){
  AST = generateAST(CST);
  console.log(SYMBOL_TABLE);
  writeOutput("AST generated.");
}

function insertSymbol(id_type, id_node){
  console.log(id_node);
  if(SYMBOL_TABLE[id_node.val] != undefined) raiseFatalError("Redeclared ID at line: " + id_node.line + " position: " + id_node.pos);
  SYMBOL_TABLE[id_node.val] = {scope: CURRENT_SCOPE, line: id_node.line, type: id_type};
}

function generateAST(cst){
  // The first node will be a program node with only a single block child.
  if(CST.children[0].val != "Block") raiseFatalError("Horrible things happened");
  var root = new TreeNode("root");
  generateBlockAST(root, CST.getChild(0));
  root = root.getChild(0); // Root only exists as a place holder.
  return root;
}

function generateBlockAST(ast_node, block_node){
  MAX_SCOPE++;
  PREVIOUS_SCOPE[MAX_SCOPE] = CURRENT_SCOPE;
  CURRENT_SCOPE = MAX_SCOPE;
  ast_node = generateNewChild(ast_node, "Block");
  // Ignoring the first and last children because they are braces.
  for(var i = 1; i < block_node.children.length - 1; i++){
    generateStmtListAST(ast_node, block_node.getChild(i));
  }
  CURRENT_SCOPE = PREVIOUS_SCOPE[CURRENT_SCOPE];
}

function generateStmtListAST(ast_node, stmt_list_node){
  if(stmt_list_node.children.length === 2) {
    generateStmtAST(ast_node, stmt_list_node.getChild(0));
    generateStmtListAST(ast_node, stmt_list_node.getChild(1));
  }
  else{
    // Epsilons are not added to the AST.
  }
}

function generateStmtAST(ast_node, stmt_node){
  var type = stmt_node.getChild(0).val;
  if(type == "Block") generateBlockAST(ast_node, stmt_node.getChild(0));
  else if(type == "VarDecl") generateVarDeclAST(ast_node, stmt_node.getChild(0));
  else if(type == "AssignStmt") generateAssignAST(ast_node, stmt_node.getChild(0));
  else if(type == "PrintStmt") generatePrintStmtAST(ast_node, stmt_node.getChild(0));
  else if(type == "IfStmt") generateIfStmtAST(ast_node, stmt_node.getChild(0));
  else if(type == "WhileStmt") generateWhileStmtAST(ast_node, stmt_node.getChild(0));
  else {
    raiseFatalError("CST statement node did not match a production");
  }
}

function generateVarDeclAST(ast_node, var_decl_node){
  insertSymbol(getTypeAST(var_decl_node.getChild(0)).val, getIDAST(var_decl_node.getChild(1)));

  ast_node = generateNewChild(ast_node, "VarDecl");
  ast_node.addChild(getTypeAST(var_decl_node.getChild(0)));
  ast_node.addChild(getIDAST(var_decl_node.getChild(1)));
}

function generateAssignAST(ast_node, assign_node){
  ast_node = generateNewChild(ast_node, "Assign");
  ast_node.addChild(getIDAST(assign_node.getChild(0)));
  generateExprAST(ast_node, assign_node.getChild(2));
}

function generatePrintStmtAST(ast_node, print_stmt_node){
  ast_node = generateNewChild(ast_node, "Print");
  generateExprAST(ast_node, print_stmt_node.getChild(2));
}

function generateIfStmtAST(ast_node, if_node){
  ast_node = generateNewChild(ast_node, "If");
  generateBoolExprAST(ast_node, if_node.getChild(1));
  generateBlockAST(ast_node, if_node.getChild(2));
}

function generateWhileStmtAST(ast_node, while_node){
  ast_node = generateNewChild(ast_node, "While");
  generateBoolExprAST(ast_node, while_node.getChild(1));
  generateBlockAST(ast_node, while_node.getChild(2));
}

function generateExprAST(ast_node, expr_node){
  var type = expr_node.getChild(0).val;
  if(type == "IntExpr") generateIntExprAST(ast_node, expr_node.getChild(0));
  else if(type == "StringExpr") generateStringExprAST(ast_node, expr_node.getChild(0));
  else if(type == "BoolExpr") generateBoolExprAST(ast_node, expr_node.getChild(0));
  else ast_node.addChild(getIDAST(expr_node.getChild(0)));
}

function generateIntExprAST(ast_node, int_expr_node){
  if(int_expr_node.children.length == 1) ast_node.addChild(getDigitAST(int_expr_node.getChild(0)));
  else{
    ast_node = generateNewChild(ast_node, getIntOpAST(int_expr_node.getChild(1)));
    ast_node.addChild(getDigitAST(int_expr_node.getChild(0)));
    generateExprAST(ast_node, int_expr_node.getChild(2));
  }
}

function generateStringExprAST(ast_node, string_expr_node){
  ast_node.addChild(new TreeNode(charListToString(string_expr_node.getChild(1))));
}

function generateBoolExprAST(ast_node, bool_expr_node){
  if(bool_expr_node.children.length == 1) ast_node.addChild(getBoolValAST(bool_expr_node.getChild(0)));
  else{
    ast_node = generateNewChild(ast_node, getBoolOpAST(bool_expr_node.getChild(2)));
    generateExprAST(ast_node, bool_expr_node.getChild(1));
    generateExprAST(ast_node, bool_expr_node.getChild(3));
  }
}

function charListToString(char_list_node){
  var temp = "\\\"";
  while(char_list_node.children.length != 1){
    temp += char_list_node.getChild(0).getChild(0).val;
    char_list_node = char_list_node.getChild(1);
  }
  return temp + "\\\"";
}

function getTypeAST(node){
  return node.getChild(0);
}

function getIDAST(node){
  return node.getChild(0).getChild(0);
}

function getDigitAST(node){
  return node.getChild(0);
}

function getIntOpAST(node){
  return node.getChild(0).val;
}

function getBoolValAST(node){
  return node.getChild(0);
}

function getBoolOpAST(node){
  return node.getChild(0).val;
}