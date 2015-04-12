console.log("Tree JS loaded.");

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
    current_node = current_level.pop();
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