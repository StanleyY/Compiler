console.log("Code Gen Loaded");

OUTPUT_STRING = "";
JUMP_TABLE = [];
VARIABLE_TABLE = {};
TEMP_NUM = 0;
HEAP_BEGINNING = 256;

function resetCodeGen(){
  OUTPUT_STRING = "";
  JUMP_TABLE = [];
  VARIABLE_TABLE = {};
  TEMP_NUM = 0;
}

function writeToCodeOutput(message){
  CODE_OUTPUT.append(message);
}

function writeToOutputString(new_commands){
  OUTPUT_STRING = OUTPUT_STRING + new_commands;
  if(OUTPUT_STRING.length > 512){
    // Max Image Size is 256 so 512 characters.
    raiseImageSizeError();
  }
}

function raiseImageSizeError(){
  CODE_OUTPUT.append("Max Image Size Exceeded");
  throw new Error("Max Image Size Exceeded");
}

function runCodeGen(){
  CURRENT_SCOPE = -1;
  MAX_SCOPE = -1;
  readBlock(AST);
  backpatch();
  // adds a space every two chars to OUTPUT_STRING.
  writeToCodeOutput(OUTPUT_STRING.match(/(\w\w)/g).join(" "));
}

function readBlock(ast_node){
  MAX_SCOPE++;
  CURRENT_SCOPE = MAX_SCOPE;
  for(var i = 0; i < ast_node.children.length; i++){
    var child_type = ast_node.children[i].val;
    if(child_type == "Block") readBlock(ast_node.children[i]);
    else if(child_type == "VarDecl") writeVariable(ast_node.children[i]);
    else if(child_type == "Assign") writeAssignment(ast_node.children[i]);
    else raiseFatalError("Horrible Code Gen Problem");
  }
  CURRENT_SCOPE = PREVIOUS_SCOPE[CURRENT_SCOPE];
}

function writeVariable(ast_node){
  var temp_id = "T" + TEMP_NUM + "XX";
  VARIABLE_TABLE[ast_node.getChild(1).val + CURRENT_SCOPE] = {temp: temp_id};
  console.log("Added Temp: " + temp_id);
  writeToOutputString("A9008D" + temp_id);
  TEMP_NUM++;
}

function backpatch(){
  var current_cell = (OUTPUT_STRING.length / 2) + 1;
  for (var key in VARIABLE_TABLE) {
    if (VARIABLE_TABLE.hasOwnProperty(key)) {
      if(current_cell > HEAP_BEGINNING) raiseImageSizeError();
      fixTemp(VARIABLE_TABLE[key].temp, current_cell.toString(16).toUpperCase());
      current_cell++;
    }
  }
}

function fixTemp(temp, address){
  if(address.length == 1) address = "0" + address;
  console.log(OUTPUT_STRING);
  OUTPUT_STRING = OUTPUT_STRING.replace(new RegExp(temp, 'g'), address + "00");
  console.log(OUTPUT_STRING);
}