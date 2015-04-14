console.log("Tree JS loaded.");

JSON_TEMPLATE = '{"id": "{0}",  "name": "{1}",  "data": {}, "children": {2} }';

function TreeNode(value) {
  this.val = value;
  this.children = [];
  this.addChild = addChild;
  this.getChild = getChild;
}

function addChild(new_child){
  this.children.push(new_child);
}

function getChild(index){
  return this.children[index];
}

function printTree(root){
  var current_level = [];
  var next_level = [];
  var current_node = null;
  current_level.push(root);
  var output_string = "";

  while(current_level.length != 0){
    current_node = current_level.shift();
    output_string += current_node.val + ", ";
    if(current_node.children.length > 0){
      next_level.push.apply(next_level, current_node.children);
    }
    if(current_level == 0) {
      console.log(output_string);
      output_string = "";
      current_level = next_level;
      next_level = [];
    }
  }
}

function generateNewChild(parent, child_value){
  var new_node = new TreeNode(child_value);
  parent.addChild(new_node);
  return new_node;
}

function generateJSONFromTree(root){
  var node_num = 0;
  function generateJSONFromNode(node){
    var id = "node" + node_num;
    node_num++;
    var name = node.val;
    if(name == "\""){
      name = "\\\"";
    }
    var children = "[]";

    if(node.children.length != 0){
      children = "[";
      for(var i = 0; node.getChild(i) != undefined; i++){
        children += generateJSONFromNode(node.getChild(i)) + ",";
      }
      children = children.substring(0, children.length - 1); // remove extra comma
      children += "]";
    }
    return JSON_TEMPLATE.format(id, name, children);
  }

  return generateJSONFromNode(root);

}
