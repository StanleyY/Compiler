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
  else {
    return;
  }
}

function generateVarDeclAST(ast_node, var_decl_node){
  ast_node = generateNewChild(ast_node, "VarDecl");
  ast_node.addChild(getTypeAST(var_decl_node.getChild(0)));
  ast_node.addChild(getIDAST(var_decl_node.getChild(1)));
}

function getTypeAST(node){
  return node.getChild(0);
}

function getIDAST(node){
  return node.getChild(0).getChild(0);
}