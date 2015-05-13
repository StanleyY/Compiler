console.log("Code Gen Loaded");

BOOLEAN_TRANSLATION = {};
BOOLEAN_TRANSLATION["false"] = "00";
BOOLEAN_TRANSLATION["true"] = "01";

OUTPUT_STRING = "";
JUMP_TABLE = [];
VARIABLE_TABLE = {};
TEMP_NUM = 0;
JUMP_NUM = 0;
HEAP_BEGINNING = 255;
HEAP_STRING = "";
TEMP_INT = "";

function resetCodeGen(){
  TEMP_INT = "";
  OUTPUT_STRING = "";
  HEAP_STRING = "";
  JUMP_TABLE = [];
  VARIABLE_TABLE = {};
  JUMP_NUM = 0;
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
  writeToOutputString("00");
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
    else if(child_type == "While") writeWhile(ast_node.children[i]);
    else raiseFatalError("Horrible Code Gen Problem");
  }
  CURRENT_SCOPE = PREVIOUS_SCOPE[CURRENT_SCOPE];
}

function writeVariable(ast_node){
  var temp_id = "T" + TEMP_NUM + "XX";
  VARIABLE_TABLE[ast_node.getChild(1).val + CURRENT_SCOPE] = temp_id;
  writeOutput("Added Variable: " + ast_node.getChild(1).val + " of scope " + CURRENT_SCOPE + ", temp ID: " + temp_id);
  if(ast_node.getChild(0).val != "string") {
    //We initialize int to 0 and boolean to false.
    loadAccConst("00");
    storeAccMem(temp_id);
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
    storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
  }
  else if(ast_node.getChild(1).val.match(/[0-9]/g) == null){
    // Setting to another ID's value
    loadAccMem(lookupVariableTemp(ast_node.getChild(1).val));
    storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
  }
  else{
    // Assigning a digit
    loadAccConst("0" + ast_node.getChild(1).val)
    storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
  }
}

function writeAddition(ast_node){
  // The total sum is stored in the accumulator.
  checkTempIntExistence();
  var original = ast_node;
  while(ast_node.getChild(1).val == "+"){
    ast_node = ast_node.getChild(1);
  }
  if(ast_node.getChild(1).val.match(/[0-9]/g) == null){
    //The right child is an ID.
    loadAccMem(lookupVariableTemp(ast_node.getChild(1).val));
    storeAccMem(TEMP_INT);
  }
  else{
    //The right child is a digit.
    loadAccConst("0" + ast_node.getChild(1).val);
    storeAccMem(TEMP_INT);
  }

  ast_node = original;
  while(ast_node.getChild(1).val == "+"){
    ast_node = ast_node.getChild(1);
    loadAccConst("0" + ast_node.getChild(0).val);
    addMemToAcc(TEMP_INT);
    storeAccMem(TEMP_INT);
  }
  loadAccConst("0" + original.getChild(0).val);
  addMemToAcc(TEMP_INT);
}

function writeStringAssignment(ast_node){
  loadAccConst(writeStringToHeap(ast_node.getChild(1)));
  storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
}

function writeStringToHeap(ast_node){
  //Returns the address of the String.
  var s = ast_node.val;
  var heap = "";
  for(var i = 2; i < (s.length - 2); i++){
    heap = heap + s.charCodeAt(i).toString(16).toUpperCase();
  }
  heap = heap + "00";
  HEAP_STRING = heap + HEAP_STRING;
  HEAP_BEGINNING = HEAP_BEGINNING - (heap.length / 2);
  var address = (HEAP_BEGINNING + 1).toString(16).toUpperCase();
  writeOutput("Wrote String \"{0}\" to heap at address {1}".format(s.substring(2, s.length-2), address));
  return address;
}

function writeBooleanAssignment(ast_node){
  if(ast_node.getChild(1).val.match(/^true$|^false$/g) != null){
    loadAccConst(BOOLEAN_TRANSLATION[ast_node.getChild(1).val]);
    storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
  } else if(ast_node.getChild(1).val.match(/[a-z]/g)){
    loadAccMem(lookupVariableTemp(ast_node.getChild(1).val));
    storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
  } else{
    resolveComparison(ast_node.getChild(1));
    loadAccConst("00");
    jumpBytes("02");
    loadAccConst("01");
    storeAccMem(lookupVariableTemp(ast_node.getChild(0).val));
  }
}

function resolveComparison(ast_node){
  // Once this function finishes, the Z flag should be set appropriately.
  checkTempIntExistence();

  resolveLeft(ast_node.getChild(0));
  resolveRight(ast_node.getChild(1));

  if(ast_node.val == "!="){
    flipZ();
  }
}

function resolveLeft(ast_node){
  if(ast_node.val.match(/^true$|^false$/g) != null){
    loadXConst(BOOLEAN_TRANSLATION[ast_node.val]);
  }
  else if(ast_node.val.match(/\"/g)){
    writeToCodeOutput("String Comparison not supported yet");
    raiseFatalError("String Comparison not supported yet");
  }
  else if(ast_node.val.match(/==|!=/g) != null){
    resolveComparison(ast_node);
    loadXConst(BOOLEAN_TRANSLATION["false"]);
    jumpBytes("02");
    loadXConst(BOOLEAN_TRANSLATION["true"]);
  }
  else if(ast_node.val.match(/[a-z]/g) != null){
    if(lookupSymbolType(ast_node.val) == "string"){
      writeToCodeOutput("String Comparison not supported yet");
      raiseFatalError("String Comparison not supported yet");
    }
    loadXMem(lookupVariableTemp(ast_node.val));
  }
  else if(ast_node.val.match(/[0-9]/g) != null){
    loadXConst("0" + ast_node.val);
  }
  else if(ast_node.val.match(/\+/g) != null){
    writeAddition(ast_node);
    storeAccMem(TEMP_INT);
    loadXMem(TEMP_INT);
  }
  else raiseFatalError("Horrible Code Gen Problem");
}

function resolveRight(ast_node){
  //Resolves the left portion appropriately and sets the Z flag.
  if(ast_node.val.match(/^true$|^false$/g) != null){
    loadAccConst(BOOLEAN_TRANSLATION[ast_node.val]);
    storeAccMem(TEMP_INT);
    compareMemToX(TEMP_INT);
  }
  else if(ast_node.val.match(/\"/g)){
    writeToCodeOutput("String Comparison not supported yet");
    raiseFatalError("String Comparison not supported yet");
  }
  else if(ast_node.val.match(/==|!=/g) != null){
    // Stashing X register in TEMP_X
    var TEMP_X = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
    if((HEAP_BEGINNING * 2) - OUTPUT_STRING.length < 1) raiseImageSizeError();

    loadAccConst(BOOLEAN_TRANSLATION["false"]);
    storeAccMem(TEMP_X);
    compareMemToX(TEMP_X);
    loadAccConst(BOOLEAN_TRANSLATION["true"]);
    jumpBytes("02");
    loadAccConst(BOOLEAN_TRANSLATION["false"]);
    storeAccMem(TEMP_X);

    resolveComparison(ast_node);

    loadXMem(TEMP_X);
    loadAccConst(BOOLEAN_TRANSLATION["false"]);
    jumpBytes("02");
    loadAccConst(BOOLEAN_TRANSLATION["true"]);
    storeAccMem(TEMP_INT);
    compareMemToX(TEMP_INT);

    HEAP_BEGINNING = HEAP_BEGINNING + 1;
  }
  else if(ast_node.val.match(/[a-z]/g) != null){
    if(lookupSymbolType(ast_node.val) == "string"){
      writeToCodeOutput("String Comparison not supported yet");
      raiseFatalError("String Comparison not supported yet");
    }
    compareMemToX(lookupVariableTemp(ast_node.val));
  }
  else if(ast_node.val.match(/[0-9]/g) != null){
    loadAccConst("0" + ast_node.val);
    storeAccMem(TEMP_INT);
    compareMemToX(TEMP_INT);
  }
  else if(ast_node.val.match(/\+/g) != null){
    writeAddition(ast_node);
    storeAccMem(TEMP_INT);
    compareMemToX(TEMP_INT);
  }
  else raiseFatalError("Horrible Code Gen Problem");
}

function flipZ(){
  console.log("Flipping Z");
  loadAccConst("00");
  jumpBytes("02");
  loadAccConst("01");
  storeAccMem(TEMP_INT);
  loadXConst(BOOLEAN_TRANSLATION["false"]);
  compareMemToX(TEMP_INT);
}

function writePrint(ast_node){
  var child = ast_node.getChild(0).val;
  if(child.match(/^true$|^false$/g) != null){
    loadYConst(BOOLEAN_TRANSLATION[child]);
    loadXConst("01");
  }
  else if(child.match(/==|!=/g) != null){
    resolveComparison(ast_node.getChild(0));
    loadYConst(BOOLEAN_TRANSLATION["false"]);
    jumpBytes("02");
    loadYConst(BOOLEAN_TRANSLATION["true"]);
    loadXConst("01");
  }
  else if(child.match(/[0-9]/g) != null){
    loadYConst("0" + child);
    loadXConst("01");
  }
  else if(child.match(/\+/g) != null){
    writeAddition(ast_node.getChild(0));
    storeAccMem(TEMP_INT);
    loadYMem(TEMP_INT);
    loadXConst("01");
  }
  else if(child.match(/\"/g) != null){
    var address = writeStringToHeap(ast_node.getChild(0));
    loadYConst(address);
    loadXConst("02");
  }
  else if(child.match(/[a-z]/g) != null){
    var var_type = lookupSymbolType(child);
    loadYMem(lookupVariableTemp(child));
    if(var_type == "string"){
      loadXConst("02");
    }
    else{
      loadXConst("01");
    }
  }
  sysCall();
}

function writeIf(ast_node){
  var comparison = ast_node.getChild(0).val;
  if(comparison == "false"){
    // Don't bother generating code for "if false" statements
    raiseWarning("Found constant false if statement, skipping.");
  }
  else if(comparison == "true"){
    writeOutput("Found constant true if statement, writing.");
    readBlock(ast_node.getChild(1));
  }
  else{
    resolveComparison(ast_node.getChild(0));
    var jump_temp = generateJumpTemp();
    jumpBytes(jump_temp);
    var distance = OUTPUT_STRING.length / 2;
    readBlock(ast_node.getChild(1));
    distance = (OUTPUT_STRING.length / 2) - distance;
    distance = distance.toString(16).toUpperCase();
    if(distance.length == 1) distance = "0" + distance.toString(16).toUpperCase();
    OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp(jump_temp, 'g'), distance);
  }
}

function writeWhile(ast_node){
  checkTempIntExistence();
  var comparison = ast_node.getChild(0).val;
  var start_location = (OUTPUT_STRING.length / 2);
  if(comparison == "false"){
    // Don't bother generating code for "if false" statements
    raiseWarning("Found constant false while statement, skipping.");
  }
  else if(comparison == "true"){
    raiseWarning("Found infinite while statement.");
    readBlock(ast_node.getChild(1));
    loadAccConst(BOOLEAN_TRANSLATION["false"]);
    storeAccMem(TEMP_INT);
    loadXConst(BOOLEAN_TRANSLATION["true"]);
    compareMemToX(TEMP_INT);
    var current_location = (OUTPUT_STRING.length / 2);
    jumpBytes((254 - current_location + start_location).toString(16).toUpperCase());
  }
  else{
    writeOutput("Found While Loop with comparison");
    resolveComparison(ast_node.getChild(0));

    var jump_temp = generateJumpTemp();
    jumpBytes(jump_temp);
    var while_block_size = OUTPUT_STRING.length;
    readBlock(ast_node.getChild(1));
    // Force the Z to be 0
    loadXConst("00");
    loadAccConst("01");
    storeAccMem(TEMP_INT);
    compareMemToX(TEMP_INT);
    // Loop back
    var current_location = (OUTPUT_STRING.length / 2);
    jumpBytes((254 - current_location + start_location).toString(16).toUpperCase());

    while_block_size = (OUTPUT_STRING.length - while_block_size) / 2;
    while_block_size = while_block_size.toString(16).toUpperCase();
    if(while_block_size.length == 1) while_block_size = "0" + while_block_size.toString(16).toUpperCase();
    OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp(jump_temp, 'g'), while_block_size);
  }
}

function checkTempIntExistence(){
  if(TEMP_INT.length == 0) {
    // Only reserves heap space if addition is used.
    TEMP_INT = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    HEAP_STRING = "00" + HEAP_STRING;
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
    writeOutput("A temporary byte was needed and heap space was reserved at: " + TEMP_INT);
  }
}

function generateJumpTemp(){
  JUMP_NUM++;
  return "J" + JUMP_NUM;
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
  OUTPUT_STRING = OUTPUT_STRING + Array(513 - (HEAP_STRING.length + OUTPUT_STRING.length)).join("0");
}