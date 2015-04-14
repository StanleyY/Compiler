AST = null

function run_SA(){
  AST = generateAST(CST);
  writeOutput("AST generated.");
  printTree(AST);
}

function generateAST(cst){
  // The first node will be a program node with only a single block child.
  if(CST.children[0].val != "Block") raiseFatalError("Horrible things happened");
  var root = new TreeNode("root");
  generateBlockChildren(root, CST.getChild(0));
  return root;
}

function generateBlockChildren(ast_node, cst_node){
  var block_node = generateNewChild(ast_node, "Block");
  var temp_node;
  // Ignoring the first and last children because they are braces.
  for(var i = 1; i < block_node.children.length - 1; i++){
    temp_node = generateStmtListChildren(block_node, cst_node.getChild(i));
    if(temp_node != undefined) block_node.addChild(temp_node);
  }
}

function generateStmtListChildren(ast_node, stmt_list_node){
  if(stmt_list_node.children.length === 2) {
    generateStmtChildren(ast_node, stmt_list_node.getChild(0));
    generateStmtListChildren(ast_node, stmt_list_node.getChild(1));
  }
  else{
    // Epsilons are not added to the AST.
  }
}

function generateStmtChildren(ast_node, stmt_node){
  if(stmt_node.getChild(0).val == "Block") return generateBlockChildren(ast_node, stmt_node.getChild(0));
  else {
    return;
  }
}