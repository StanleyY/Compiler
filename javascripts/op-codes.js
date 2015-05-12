console.log("Op Codes loaded");

function loadAccConst(value){
  writeToOutputString("A9" + value);
}

function loadAccMem(address){
  writeToOutputString("AD" + address);
}

function storeAccMem(address){
  writeToOutputString("8D" + address);
}

function loadXConst(value){
  writeToOutputString("A2" + value);
}

function loadXMem(address){
  writeToOutputString("AE" + address);
}

function loadYConst(value){
  writeToOutputString("A0" + value);
}

function loadYMem(address){
  writeToOutputString("AC" + address);
}

function compareMemToX(address){
  writeToOutputString("EC" + address);
}

function jumpBytes(value){
  writeToOutputString("D0" + value);
}

function addAccToMem(address){
  writeToOutputString("6D" + address);
}

function sysCall(){
  writeToOutputString("FF");
}