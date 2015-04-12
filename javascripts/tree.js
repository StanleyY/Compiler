console.log("Tree JS loaded.");

JSON_TEMPLATE = '{"id": "{0}",  "name": "{1}",  "data": {}, "children": {2} }';

function TreeNode(value) {
  this.val = value;
  this.children = [];
  this.addChild = addChild;
}

function addChild(new_child){
  this.children.push(new_child);
}

function printTree(root){
  current_level = [];
  next_level = [];
  current_node = null;
  current_level.push(root);
  output_string = "";

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

function generateJSONFromTree(root){
  var node_num = 0;
  //This inner function thing is crazy.
  function generateJSONFromNode(node){
    var id = "node" + node_num;
    node_num++;
    var name = node.val;
    var children = "[]";

    if(node.children.length != 0){
      children = "[";
      for(i = 0; i < node.children.length; i++){
        children += generateJSONFromNode(node.children[i]) + ",";
      }
      children = children.substring(0, children.length - 1); // remove extra comma
      children += "]";
    }
    return JSON_TEMPLATE.format(id, name, children);
  }

  return generateJSONFromNode(root);

}
