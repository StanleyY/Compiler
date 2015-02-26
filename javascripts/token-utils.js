/*
Token Object Structure
{
  value: the literal char for the token.
  type: the type of token it is. Example: Type, Char, Boolean.
  line: the line it was found on.
  pos: the position on the above line it was found at.
}
*/

function generateToken(val, given_type, given_line, given_pos){
  TOKENS.push({value:val, type:given_type, line:given_line + 1, pos:given_pos + 1});
}

function printTokens(printTypes){
  printTypes = printTypes || false; // Hacky way of optional parameter
  var output = [];
  var index;
  for(index = 0; index < TOKENS.length; index++){
    if(printTypes) output.push("" + TOKENS[index].value + ", " + TOKENS[index].type);
    else output.push(TOKENS[index].value);
  }
  return output;
}

function printToken(token){
  writeOutput("Found " + token.type + " token. [" + token.value + "]");
}

function generateUnexpectedTokenError(token){
  return ("Unexpected token: [" + token.value + "] of type: " + token.type +
          " on line: " + token.line + ", Position: " + token.pos);
}

function generateTokenError(expected, token){
  return ("Expected token of type: " + expected + ". Got " +  token.type +
          " instead. Line: " + token.line + ", Position: " + token.pos);
}