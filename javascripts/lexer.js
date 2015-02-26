console.log("Lexer loaded");

RE_TYPE = /^(int|string|boolean)/g;
RE_KEYWORD = /^(if|while|print)/g;
RE_BOOLEAN = /^(true|false)/g;

function lexer(){
  checkInvalids();
  generateTokens();
  console.log(printTokens());
}

function generateTokens(){
  var line = 0;
  var pos = 0;
  var current_token;
  var EOF_found = false;
  var string_mode = false;

  var re_blocks = /[\{\}\(\)]/g;
  var re_digits = /[0-9]/g;
  var re_chars = /[a-z]/g;
  var re_string = /[ a-z]/g;

  while(line < INPUT_LINES.length){
    while(pos < INPUT_LINES[line].length){
      current_token = INPUT_LINES[line].charAt(pos);

      if(string_mode == false){
        if (current_token.match(/\s/g)); // Strip whitespace when not in string mode.
        else if(current_token.match(re_blocks) != null) generateToken(current_token, "Block", line, pos);
        else if(current_token.match(re_digits) != null) generateToken(current_token, "Digit", line, pos);
        else if(current_token == "+") generateToken(current_token, "IntOp", line, pos);

        else if(current_token == "\"") {
          generateToken(current_token, "Quote", line, pos);
          string_mode = true;
        }

        else if (current_token == "=") {
          if(INPUT_LINES[line].charAt(pos + 1) == "=") {
            generateToken("==", "BoolOp", line, pos);
            pos++;
          }
          else generateToken(current_token, "Assignment", line, pos);
        }

        else if (current_token == "!") {
          if(INPUT_LINES[line].charAt(pos + 1) == "=") {
            generateToken("!=", "BoolOp", line, pos);
            pos++;
          }
          else raiseFatalError("Invalid symbol at line: " + line); // This should never be reached due to checkInvalids.
        }

        else if(current_token.match(re_chars) != null) pos = pos + keywordCheck(current_token, line, pos);

        else if(current_token == "$") {generateToken(current_token, "EOF", line, pos); EOF_found = true;}

        // If you reaches here, something has gone horribly wrong.
        else raiseFatalError("Invalid symbol: " + current_token + " at line " + line);
      }
      else{ //String Mode
        if(current_token.match(re_string) != null) generateToken(current_token, "Char", line, pos);
        else if(current_token == "\"") { // Ending Quote
          generateToken(current_token, "Quote", line, pos);
          string_mode = false;
        }
        else if(current_token.match(re_string) == null) raiseFatalError("Invalid or unclosed string on line " + line + ". Only characters and space allowed.");
      }
      pos++;
    }
    pos = 0;
    line++;
  }

  if(EOF_found == false) {
    raiseWarning("Reached EOF but $ not found. Added and continuing to parse.");
    generateToken("$", "EOF", line, pos);
  }
  writeOutput("Lexer completed without errors.");
}

function keywordCheck(letter, line, pos){
  // keywordCheck returns how far to move the position pointer.
  var temp = INPUT_LINES[line].substr(pos);
  if(temp.match(RE_TYPE) != null){
    if(letter == "b"){
      generateToken("boolean", "Type", line, pos);
      return 6;
    }
    else if(letter == "i"){
      generateToken("int", "Type", line, pos);
      return 2;
    }
    else if(letter == "s"){
      generateToken("string", "Type", line, pos);
      return 5;
    }
  }
  else if (temp.match(RE_BOOLEAN) != null){
    if(letter == "f"){
      generateToken("false", "BoolVal", line, pos);
      return 4;
    }
    else if(letter == "t"){
      generateToken("true", "BoolVal", line, pos);
      return 3;
    }
  }
  else if (temp.match(RE_KEYWORD) != null){
    if(letter == "i"){
      generateToken("if", "Keyword", line, pos);
      return 1;
    }
    else if(letter == "p"){
      generateToken("print", "Keyword", line, pos);
      return 4;
    }
    else if(letter == "w"){
      generateToken("while", "Keyword", line, pos);
      return 4;
    }
  }
  generateToken(letter, "Char", line, pos);
  return 0;
}

function checkInvalids(){
  var re_invalid = /.*([=]{3,}|(!={2,})|\+{2,}|!(?!=)|[^a-z0-9\+\{\}\(\)"!=$ ]).*/g;
  var line = 0;
  var invalid_check;

  while(line < INPUT_LINES.length){
    invalid_check = re_invalid.exec(INPUT_LINES[line]);
    if(invalid_check != null) {
      console.log(invalid_check);
      raiseFatalError("Invalid symbol: " + invalid_check[1] + " found at line: " + (line + 1)
                      + " position: " + (re_invalid.lastIndex - invalid_check[1].length));
    }
    line++;
  }
}