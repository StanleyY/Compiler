console.log("Tree JS loaded.");

function TreeNode(value) {
  this.val = value;
  this.children = [];
  this.getValue = getValue;
  this.addChild = addChild;
}

function getValue(){
  return this.val;
}

function addChild(new_child){
  this.children.push(new_node);
}