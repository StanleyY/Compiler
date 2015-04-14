console.log("Main JS file loaded");

//Globals
OUTPUT = null;
INPUT = null;
INPUT_LINES = null;
TOKENS = [];
PARSE_POSITION = 0;
CST = null;

// This format function was taken from StackOverflow.
String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};

function init(){
  $('#inputTextArea').linedtextarea();
  resetPage();
  defaultTestCase();
  generateGraph(new TreeNode("Welcome"));
}

function resetPage(){
  OUTPUT = $('#outputTextArea');
  INPUT = $('#inputTextArea');
  INPUT_LINES = INPUT.val().split("\n");
  TOKENS = [];
  PARSE_POSITION = 0;
  SYMBOL_TABLE = {};
  AST = null;
  CST = null;
  $('#graph-switch').prop('checked', true);
  OUTPUT.empty();  // Clear the output text area.
}

function run(){
  resetPage();
  lexer();
  parser();
  OUTPUT.scrollTop(0);
  generateGraph(CST);
  run_SA();
}

function writeOutput(message){
  OUTPUT.append(message + "\n");
}

function raiseWarning(message){
  message = "Warning: " + message;
  writeOutput(message);
}

function raiseFatalError(message){
  message = "Fatal Error: " + message;
  writeOutput(message);
  OUTPUT.scrollTop(OUTPUT[0].scrollHeight); // Scroll to the bottom.
  throw new Error(message);
}

function graphSwitch(){
  if(CST == null) return;
  // Checked is CST, unchecked is AST
  if($('#graph-switch').is(':checked')) generateGraph(CST);
  else generateGraph(AST);
}

function generateGraph(tree){
  $('#infovis').empty(); // Reset Graph
  //If your browser doesn't support JSON, I don't think you should be using my compiler.
  var json = JSON.parse(generateJSONFromTree(tree));

  var st = new $jit.ST({
      injectInto: 'infovis',
      orientation: "top",
      duration: 500,
      transition: $jit.Trans.Quart.easeInOut,
      constrained: false,
      levelsToShow: 200,
      levelDistance: 10,
      Navigation: {
        enable:true,
        panning:true
      },
      Node: {
          height: 20,
          width: 60,
          type: 'rectangle',
          color: '#aaa',
          overridable: true
      },

      Edge: {
          type: 'bezier',
          overridable: true
      },

      onCreateLabel: function(label, node){
          label.id = node.id;
          label.innerHTML = node.name;
          var style = label.style;
          style.width = 60 + 'px';
          style.height = 17 + 'px';
          style.cursor = 'pointer';
          style.color = '#333';
          style.fontSize = '0.8em';
          style.textAlign= 'center';
          style.paddingTop = '3px';
      },
  });
  st.loadJSON(json);
  st.compute();
  st.onClick(st.root);
}