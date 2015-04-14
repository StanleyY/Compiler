AST = null

function run_SA(){
  AST = generateAST(CST);
  writeOutput("AST generated.");
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
  ast_node = generateNewChild(ast_node, "Block");
  // Ignoring the first and last children because they are braces.
  for(var i = 1; i < block_node.children.length - 1; i++){
    generateStmtListAST(ast_node, block_node.getChild(i));
  }
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
  else {
    return;
  }
}

function generateVarDeclAST(ast_node, var_decl_node){
  ast_node = generateNewChild(ast_node, "VarDecl");
  ast_node.addChild(getTypeAST(var_decl_node.getChild(0)));
  ast_node.addChild(getIDAST(var_decl_node.getChild(1)));
}

function generateAssignAST(ast_node, assign_node){
  ast_node = generateNewChild(ast_node, "Assign");
  ast_node.addChild(getIDAST(assign_node.getChild(0)));
  generateExprAST(ast_node, assign_node.getChild(2));
}

function generateExprAST(ast_node, expr_node){
  var type = expr_node.getChild(0).val;
  if(type == "IntExpr") generateIntExprAST(ast_node, expr_node.getChild(0));
  else if(type == "StringExpr") generateStringExprAST(ast_node, expr_node.getChild(0));
  //else if(type == "BooleanExpr") ;
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