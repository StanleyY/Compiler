console.log("Code Gen Loaded");

OUTPUT_STRING = "";
JUMP_TABLE = [];
VARIABLE_TABLE = {};
TEMP_NUM = 0;
HEAP_BEGINNING = 255;
ADDITION_TEMP = "";

function resetCodeGen(){
  ADDITION_TEMP = "";
  OUTPUT_STRING = "";
  JUMP_TABLE = [];
  VARIABLE_TABLE = {};
  TEMP_NUM = 0;
  HEAP_BEGINNING = 255;
}

function writeToCodeOutput(message){
  CODE_OUTPUT.append(message);
}

function writeToOutputString(new_commands){
  OUTPUT_STRING = OUTPUT_STRING + new_commands;
  if(OUTPUT_STRING.length > HEAP_BEGINNING * 2){
    // Max Image Size is 256 so 512 characters.
    raiseImageSizeError();
  }
}

function raiseImageSizeError(){
  CODE_OUTPUT.append("Max Image Size Exceeded");
  throw new Error("Max Image Size Exceeded");
}

function runCodeGen(){
  writeOutput("\nBeginning Code Generation");
  CURRENT_SCOPE = -1;
  MAX_SCOPE = -1;
  readBlock(AST);
  //OUTPUT_STRING += "00"; Not sure if safety break is needed.
  backpatch();
  fillOutput();
  // adds a space every two chars to OUTPUT_STRING.
  writeToCodeOutput(OUTPUT_STRING.match(/(\w\w)/g).join(" "));
  writeOutput("\nFinished Code Generation");
}

function readBlock(ast_node){
  MAX_SCOPE++;
  CURRENT_SCOPE = MAX_SCOPE;
  for(var i = 0; i < ast_node.children.length; i++){
    var child_type = ast_node.children[i].val;
    if(child_type == "Block") readBlock(ast_node.children[i]);
    else if(child_type == "VarDecl") writeVariable(ast_node.children[i]);
    else if(child_type == "Assign") writeAssignment(ast_node.children[i]);
    else if(child_type == "Print") writePrint(ast_node.children[i]);
    else raiseFatalError("Horrible Code Gen Problem");
  }
  CURRENT_SCOPE = PREVIOUS_SCOPE[CURRENT_SCOPE];
}

function writeVariable(ast_node){
  var temp_id = "T" + TEMP_NUM + "XX";
  VARIABLE_TABLE[ast_node.getChild(1).val + CURRENT_SCOPE] = temp_id;
  console.log("Added Temp: " + temp_id);
  writeOutput("Added Variable: " + ast_node.getChild(1).val + " of scope " + CURRENT_SCOPE + ", temp ID: " + temp_id);
  if(ast_node.getChild(1).val == "int") {
    //We initialize int to 0
    writeToOutputString("A9008D" + temp_id);
  }
  TEMP_NUM++;
}

function writeAssignment(ast_node){
  var assign_type = SYMBOL_TABLE[ast_node.getChild(0).val + CURRENT_SCOPE].type;
  if(assign_type == "int") writeIntAssignment(ast_node);
  //else if(assign_type == "string") writeStringAssignment(ast_node);
  else raiseFatalError("Horrible Code Gen Problem");
}

function writeIntAssignment(ast_node){
  if(ast_node.getChild(1).val == "+"){
    writeAddition(ast_node.getChild(1));
    writeToOutputString("8D" + VARIABLE_TABLE[ast_node.getChild(0).val + CURRENT_SCOPE]);
  }
  else if(ast_node.getChild(1).val.match(/[0-9]/g) == null){
    // Setting to another ID's value
    writeToOutputString("AD" + VARIABLE_TABLE[ast_node.getChild(1).val + CURRENT_SCOPE]);
    writeToOutputString("8D" + VARIABLE_TABLE[ast_node.getChild(0).val + CURRENT_SCOPE]);
  }
  else{
    // Assigning a digit
    writeToOutputString("A90" + ast_node.getChild(1).val + "8D" + VARIABLE_TABLE[ast_node.getChild(0).val + CURRENT_SCOPE]);
  }
}

function writeAddition(ast_node){
  if(ADDITION_TEMP.length == 0) {
    // Only reserves heap space if addition is used.
    ADDITION_TEMP = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
  }
  var original = ast_node;
  while(ast_node.getChild(1).val == "+"){
    ast_node = ast_node.getChild(1);
  }
  if(ast_node.getChild(1).val.match(/[0-9]/g) == null){
    //The right child is an ID.
    writeToOutputString("AD" + VARIABLE_TABLE[ast_node.getChild(1).val + CURRENT_SCOPE]);
    writeToOutputString("8D" + ADDITION_TEMP);
  }
  else{
    //The right child is a digit.
    writeToOutputString("A90" + ast_node.getChild(1).val);
    writeToOutputString("8D" + ADDITION_TEMP);
  }

  ast_node = original;
  while(ast_node.getChild(1).val == "+"){
    ast_node = ast_node.getChild(1);
    writeToOutputString("A90" + ast_node.getChild(0).val);
    writeToOutputString("6D" + ADDITION_TEMP);
    writeToOutputString("8D" + ADDITION_TEMP);
  }
  writeToOutputString("A90" + ast_node.getChild(0).val);
  writeToOutputString("6D" + ADDITION_TEMP);
}

function writePrint(ast_node){
  writeToOutputString("AC" + VARIABLE_TABLE[ast_node.getChild(0).val + CURRENT_SCOPE] + "A201FF");
}

function backpatch(){
  var current_cell = (OUTPUT_STRING.length / 2) + 1;
  for (var key in VARIABLE_TABLE) {
    if (VARIABLE_TABLE.hasOwnProperty(key)) {
      if(current_cell > HEAP_BEGINNING) raiseImageSizeError();
      fixTemp(VARIABLE_TABLE[key], current_cell.toString(16).toUpperCase());
      current_cell++;
    }
  }
}

function fixTemp(temp, address){
  if(address.length == 1) address = "0" + address;
  address = address + "00";
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp(temp, 'g'), address);
  writeOutput("Swapped temp ID: {0} with address: {1}".format(temp, address));
}

function fillOutput(){
  OUTPUT_STRING = OUTPUT_STRING + Array((HEAP_BEGINNING * 2) - OUTPUT_STRING.length + 3).join("0");
}