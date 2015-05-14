console.log("Code Gen Loaded");

BOOLEAN_TRANSLATION = {};
BOOLEAN_TRANSLATION["false"] = "00";
BOOLEAN_TRANSLATION["true"] = "01";

STRING_COMP_MODE = false;
STRING_COMP_RESULT = "";

OUTPUT_STRING = "";
JUMP_TABLE = [];
VARIABLE_TABLE = {};
TEMP_NUM = 0;
JUMP_NUM = 0;
HEAP_BEGINNING = 255;
HEAP_STRING = "";
TEMP_INT = "";
NULL_STRING_CREATED = false;

function resetCodeGen(){
  TEMP_INT = "";
  OUTPUT_STRING = "";
  HEAP_STRING = "";
  JUMP_TABLE = [];
  VARIABLE_TABLE = {};
  JUMP_NUM = 0;
  TEMP_NUM = 0;
  HEAP_BEGINNING = 255;
  STRING_COMP_RESULT = "";
  NULL_STRING_CREATED = false;
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
  writeOutput("Assignment generated for " + ast_node.getChild(0).val);
  if(assign_type == "int") writeIntAssignment(ast_node);
  else if(assign_type == "string") {
    if(!NULL_STRING_CREATED) {
      NULL_STRING_CREATED = true;
      HEAP_STRING = "00" + HEAP_STRING;
      HEAP_BEGINNING = HEAP_BEGINNING - 1;
    }
    writeStringAssignment(ast_node);
  }
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
  writeOutput("Addition Generated");
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
  if(ast_node.getChild(1).val.match(/\"/g) != null){
    loadAccConst(writeStringToHeap(ast_node.getChild(1)));
  }
  else{
    loadAccMem(lookupVariableTemp(ast_node.getChild(1).val));
  }
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
  STRING_COMP_MODE = false;
  checkTempIntExistence();

  resolveLeft(ast_node.getChild(0));

  if(STRING_COMP_MODE){
    // There will never be nested String comparisons.
    resolveStringComparison(ast_node);
  }
  else{
    resolveRight(ast_node.getChild(1));
  }

  if(ast_node.val == "!="){
    flipZ();
  }
}

function resolveLeft(ast_node){
  // Resolves the left child and sets String Comp mode if needed
  if(ast_node.val.match(/^true$|^false$/g) != null){
    loadXConst(BOOLEAN_TRANSLATION[ast_node.val]);
  }
  else if(ast_node.val.match(/\"/g)){
    STRING_COMP_MODE = true;
  }
  else if(ast_node.val.match(/==|!=/g) != null){
    resolveComparison(ast_node);
    loadXConst(BOOLEAN_TRANSLATION["false"]);
    jumpBytes("02");
    loadXConst(BOOLEAN_TRANSLATION["true"]);
  }
  else if(ast_node.val.match(/[a-z]/g) != null){
    if(lookupSymbolType(ast_node.val) == "string"){
      STRING_COMP_MODE = true;
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
  else if(ast_node.val.match(/==|!=/g) != null){
    // Stashing X register in TEMP_X
    var TEMP_X = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    writeOutput("Using : " + TEMP_X + " for storing X register.");
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
    HEAP_STRING = "00" + HEAP_STRING;
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
  }
  else if(ast_node.val.match(/[a-z]/g) != null){
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

function resolveStringComparison(ast_node){
  writeOutput("String Comparison Generated");
  checkTempIntExistence();

  var left = ast_node.getChild(0);
  var right = ast_node.getChild(1);

  var left_address;
  var right_address;

  if(left.val.match(/\"/g) != null){
    //Direct String
    left_address = writeStringToHeap(left) + "00";
  }
  else{
    var left_string_address = extractStringAddress(lookupVariableTemp(left.val));
    if(left_string_address == null) left_string_address = "FE";
    left_address = left_string_address + "00";
  }

  if(right.val.match(/\"/g) != null){
    right_address = writeStringToHeap(right) + "00";
  }
  else{
    var right_string_address = extractStringAddress(lookupVariableTemp(right.val));
    if(right_string_address == null) right_string_address = "FE";
    right_address = right_string_address + "00";
  }

  // Check first characters
  writeCharCheck(left_address, right_address);
  jumpBytes("S4");
  var before_loop = (OUTPUT_STRING.length / 2);
  //Creating While loop to dig through until one of them equals 00.
  var start_location = (OUTPUT_STRING.length / 2);
  loadXConst("00");
  compareMemToX(left_address);
  var left_string_location = generateHex((OUTPUT_STRING.length / 2) - 2);
  flipZ(); // If the char is at break, I need it to be 0 instead of 1.
  jumpBytes("11");
  compareMemToX(right_address);
  var right_string_location = generateHex((OUTPUT_STRING.length / 2) - 2);
  flipZ(); // If the char is at break, I need it to be 0 instead of 1.
  var while_loop_temp = generateJumpTemp();
  jumpBytes(while_loop_temp);

  var comparison_block_size = OUTPUT_STRING.length;

  //Compare the current char
  loadXMem(left_address);
  var left_second_location = generateHex((OUTPUT_STRING.length / 2) - 2);
  compareMemToX(right_address);
  var right_second_location = generateHex((OUTPUT_STRING.length / 2) - 2);

  incrementMem(left_string_location + "00");
  incrementMem(right_string_location + "00");
  incrementMem("S0" + "00");
  incrementMem("S1" + "00");
  incrementMem("S2" + "00");
  incrementMem("S3" + "00");

  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp("S0", 'g'), left_second_location);
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp("S1", 'g'), right_second_location);

  loadAccConst("00");
  jumpBytes("02");
  loadAccConst("01");
  storeAccMem(STRING_COMP_RESULT);

  // Loop if Comparison result is true by setting Z to zero
  loadXConst("00");
  compareMemToX(STRING_COMP_RESULT);
  // Loop back distance
  var current_location = (OUTPUT_STRING.length / 2);
  jumpBytes((254 - current_location + start_location).toString(16).toUpperCase());

  comparison_block_size = (OUTPUT_STRING.length - comparison_block_size) / 2;
  comparison_block_size = comparison_block_size.toString(16).toUpperCase();
  if(comparison_block_size.length == 1) comparison_block_size = "0" + comparison_block_size.toString(16).toUpperCase();
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp(while_loop_temp, 'g'), comparison_block_size);


  before_loop = (OUTPUT_STRING.length / 2) - before_loop;
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp("S4", 'g'), before_loop);
  //Unstash the final Z
  loadXConst("01");
  compareMemToX(STRING_COMP_RESULT);
  jumpBytes("08"); // only do length check most recent chars were a match.
  loadXMem(left_address);
  left_string_location = generateHex((OUTPUT_STRING.length / 2) - 2);
  compareMemToX(right_address);
  right_string_location = generateHex((OUTPUT_STRING.length / 2) - 2);
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp("S2", 'g'), left_string_location);
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp("S3", 'g'), right_string_location);
}

function extractStringAddress(id, limit){
  if(limit == undefined) limit = OUTPUT_STRING.length;
  var test_chunk = OUTPUT_STRING.substring(0, limit);
  var regex = new RegExp("A9(..)8D" + id, 'g');
  var results = regex.exec(test_chunk);
  var output = null;
  while(results != null){
      output = results[1];
      results = regex.exec(test_chunk);
  }
  if(output == null){
    id = extractParentStringAddress(id);
    if(id != null) return extractStringAddress(id[1], id.index);
  }
  return output;
}

function extractParentStringAddress(id, limit){
  if(limit == undefined) limit = OUTPUT_STRING.length;
  var test_chunk = OUTPUT_STRING.substring(0, limit);
  var regex = new RegExp("AD(..XX)8D" + id, 'g');
  var results = regex.exec(test_chunk);
  var output = null;
  while(results != null){
      output = results;
      results = regex.exec(test_chunk);
  }
  return output;
}

function writeCharCheck(left_address, right_address){
  //Only to be used with resolveStringComparison
  //Sets the Z flag appropriately and stores in temp.
  if(STRING_COMP_RESULT.length == 0) {
    // Only reserves heap space if addition is used.
    STRING_COMP_RESULT = HEAP_BEGINNING.toString(16).toUpperCase() + "00";
    HEAP_STRING = "00" + HEAP_STRING;
    HEAP_BEGINNING = HEAP_BEGINNING - 1;
    writeOutput("Byte reserved for String Comparison at " + STRING_COMP_RESULT);
  }

  loadXMem(left_address);
  compareMemToX(right_address);
  loadAccConst("00");
  jumpBytes("02");
  loadAccConst("01");
  storeAccMem(STRING_COMP_RESULT);
}

function flipZ(){
  loadAccConst("00");
  jumpBytes("02");
  loadAccConst("01");
  storeAccMem(TEMP_INT);
  loadXConst(BOOLEAN_TRANSLATION["false"]);
  compareMemToX(TEMP_INT);
}

function writePrint(ast_node){
  writeOutput("Print Statement Generated");
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
    writeOutput("If statement generated");
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
    writeOutput("While loop Generated");
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

function generateHex(value){
  value = value.toString(16).toUpperCase();
  if(value.length == 1) return "0" + value;
  return value;
}