console.log("Code Gen Loaded");

BOOLEAN_TRANSLATION = {};
BOOLEAN_TRANSLATION["false"] = "00";
BOOLEAN_TRANSLATION["true"] = "01";

OUTPUT_STRING = "";
JUMP_TABLE = [];
VARIABLE_TABLE = {};
TEMP_NUM = 0;
HEAP_BEGINNING = 255;
HEAP_STRING = "";
ADDITION_TEMP = "";

function resetCodeGen(){
  ADDITION_TEMP = "";
  OUTPUT_STRING = "";
  HEAP_STRING = "";
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

function lookupSymbolType(id){
  var scope = CURRENT_SCOPE;
  while(scope != -1){
    if(SYMBOL_TABLE[id + scope] != undefined) {
      return SYMBOL_TABLE[id + scope].type;
    }
    scope = PREVIOUS_SCOPE[scope];
  }
}

function lookupVariableTemp(id){
  var scope = CURRENT_SCOPE;
  while(scope != -1){
    if(VARIABLE_TABLE[id + scope] != undefined) {
      return VARIABLE_TABLE[id + scope];
    }
    scope = PREVIOUS_SCOPE[scope];
  }
}

function runCodeGen(){
  writeOutput("\nBeginning Code Generation");
  CURRENT_SCOPE = -1;
  MAX_SCOPE = -1;
  readBlock(AST);
  //OUTPUT_STRING += "00"; Not sure if safety break is needed.
  backpatch();
  fillOutput();
  OUTPUT_STRING = OUTPUT_STRING + HEAP_STRING;
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
    else if(child_type == "If") writeIf(ast_node.children[i]);
    else raiseFatalError("Horrible Code Gen Problem");
  }
  CURRENT_SCOPE = PREVIOUS_SCOPE[CURRENT_SCOPE];
}

function writeVariable(ast_node){
  var temp_id = "T" + TEMP_NUM + "XX";
  VARIABLE_TABLE[ast_node.getChild(1).val + CURRENT_SCOPE] = temp_id;
  console.log("Added Temp: " + temp_id);
  writeOutput("Added Variable: " + ast_node.getChild(1).val + " of scope " + CURRENT_SCOPE + ", temp ID: " + temp_id);
  if(ast_node.getChild(0).val != "string") {
    //We initialize int to 0 and boolean to false.
    writeToOutputString("A9008D" + temp_id);
  }
  TEMP_NUM++;
}

function writeAssignment(ast_node){
  var assign_type = lookupSymbolType(ast_node.getChild(0).val);
  if(assign_type == "int") writeIntAssignment(ast_node);
  else if(assign_type == "string") writeStringAssignment(ast_node);
  else if(assign_type == "boolean") writeBooleanAssignment(ast_node);
  else raiseFatalError("Horrible Code Gen Problem");
}

function writeIntAssignment(ast_node){
  if(ast_node.getChild(1).val == "+"){
    writeAddition(ast_node.getChild(1));
    writeToOutputString("8D" + lookupVariableTemp(ast_node.getChild(0).val));
  }
  else if(ast_node.getChild(1).val.match(/[0-9]/g) == null){
    // Setting to another ID's value
    writeToOutputString("AD" + lookupVariableTemp(ast_node.getChild(1).val));
    writeToOutputString("8D" + lookupVariableTemp(ast_node.getChild(0).val));
  }
  else{
    // Assigning a digit
    writeToOutputString("A90" + ast_node.getChild(1).val + "8D" + lookupVariableTemp(ast_node.getChild(0).val));
  }
}

function writeAddition(ast_node){
  if(ADDITION_TEMP.length == 0) {
    // Only reserves heap space if addition is used.
    ADDITION_TEMP = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    HEAP_STRING = "00";
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
  }
  var original = ast_node;
  while(ast_node.getChild(1).val == "+"){
    ast_node = ast_node.getChild(1);
  }
  if(ast_node.getChild(1).val.match(/[0-9]/g) == null){
    //The right child is an ID.
    writeToOutputString("AD" + lookupVariableTemp(ast_node.getChild(1).val));
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

function writeStringAssignment(ast_node){
  var s = ast_node.getChild(1).val;
  var heap = "";
  for(var i = 2; i < (s.length - 2); i++){
    heap = heap + s.charCodeAt(i).toString(16).toUpperCase();
  }
  heap = heap + "00";
  console.log("HEAP STRING IS: " + heap);
  HEAP_STRING = heap + HEAP_STRING;
  HEAP_BEGINNING = HEAP_BEGINNING - (heap.length / 2);
  writeToOutputString("A9" + (HEAP_BEGINNING + 1).toString(16).toUpperCase());
  writeToOutputString("8D" + lookupVariableTemp(ast_node.getChild(0).val));
}

function writeBooleanAssignment(ast_node){
  if(ast_node.getChild(1).val.match(/true|false/g) != null){
    writeToOutputString("A9" + BOOLEAN_TRANSLATION[ast_node.getChild(1).val]);
    writeToOutputString("8D" + lookupVariableTemp(ast_node.getChild(0).val));
  } else if(ast_node.getChild(1).val.match(/[a-z]/g)){
    writeToOutputString("AD" + lookupVariableTemp(ast_node.getChild(1).val));
    writeToOutputString("8D" + lookupVariableTemp(ast_node.getChild(0).val));
  } else{
    resolveComparison(ast_node.getChild(1));
    writeToOutputString("8D" + lookupVariableTemp(ast_node.getChild(0).val));
  }
}

function resolveComparison(ast_node){
  // Once this function finishes, the final truth value will be in the accumulator.
  if(ADDITION_TEMP.length == 0) {
    // Only reserves heap space if addition is used.
    ADDITION_TEMP = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    HEAP_STRING = "00";
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
  }
  if((ast_node.getChild(0).val + ast_node.getChild(1).val).match(/(==)|(!=)/g) != null){
    writeToCodeOutput("Nested BoolOp not supported yet");
    raiseFatalError("Nested BoolOp not supported yet");
  }
  if(ast_node.val == "==") {
    if(ast_node.getChild(0).val.match(/true|false/g) == null){
      writeToOutputString("AE" + BOOLEAN_TRANSLATION[ast_node.getChild(0).val]);
    }
    else {
      console.log("STRAIGHT VALUE");
      console.log("A2" + BOOLEAN_TRANSLATION[ast_node.getChild(0).val]);
      writeToOutputString("A2" + BOOLEAN_TRANSLATION[ast_node.getChild(0).val]);
    }
    writeToOutputString("A9" + BOOLEAN_TRANSLATION[ast_node.getChild(1).val]);
    writeToOutputString("8D" + ADDITION_TEMP);
    writeToOutputString("EC" + ADDITION_TEMP);
    writeToOutputString("A9" + "00");
    writeToOutputString("D0" + "02");
    writeToOutputString("A9" + "01");
  }
  else{
    writeToCodeOutput("!= is not supported yet");
    raiseFatalError("!= is not supported yet");
  }
}

function writePrint(ast_node){
  var child = ast_node.getChild(0).val;
  if(child.match(/[a-z]/g) != null){
    var var_type = lookupSymbolType(child);
    writeToOutputString("AC" + lookupVariableTemp(child));
    if(var_type == "string"){
      writeToOutputString("A202FF");
    }
    else{
      writeToOutputString("A201FF");
    }
  }
  else{
    // TODO: Write code for direct prints
  }
}

function writeIf(ast_node){
  var comparison = ast_node.getChild(0).val;
  if(comparison == "false"){
    // Don't bother generating code for "if false" statements
    writeOutput("Found constant false if statement, skipping.");
  }
  else if(comparison == "true"){
    writeOutput("Found constant true if statement, writing.");
    readBlock(ast_node.getChild(1));
  }
  else raiseFatalError("Horrible Code Gen Problem");
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