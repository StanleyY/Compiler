console.log("Test cases loaded");

TEST_CASE_0 = "{\nint x\nx = 1\n\nx = 1 + x\n\nstring s\ns = \"te st\"\n\nboolean b\nb = true\n\nif (x == 1) {\nprint(s)\n}\n\nwhile false {}\n} $";

TEST_CASE_1 = "{\n  int x\n  x=9\n  x = 1 + 1 + 1\n  print(x)\n\n  string s\n  s      =\"\"\n  s =         \"long    s p a c e s\"\n  print(s)\n\n  boolean b\n  b =     true\n  b   =      false\n  b = ((true == true) != false)\n  if(b == true){\n    print(\"true\")\n  }\n  if(b == false){\n    print(\"false\")\n  }\n} $";

TEST_CASE_2 = "{\nboolean b\nb= true\n\nif (b == true){}\nwhile false {}\nif ( (true == false) != (true == true) ) {\n  print(\"true\")\n}\n\nprint ( 1 )\n} $";

TEST_CASE_3 = "{{{{{{{{{\n{{{\n{{\n}}\n}}}\n}}}}}}}}} $";

TEST_CASE_4 = "{\nint f int if=1\n}$";

TEST_CASE_5 = "{\n  int x\n  print(x)\n  {\n    string x\n    {\n      x = \"my string\"\n      print(x)\n    }\n  }\n  {\n    boolean x\n    x = true\n    if(x == true){\n      print(\"true\")\n    }\n  }\n  x = 3\n  print(1 + x)\n}$"

TEST_CASE_6 = "{\nint u\nboolean b\n\nstring s\nprint(s)\n\nint x\nint y\nx = 1\nx = y\ny = 2\n}";

TEST_CASE_7 = "{\nboolean b\n\nb = ((true == (((true == true) != (true != false)) == false)) == (true != false))\n\nprint(b)\n\n}";

TEST_CASE_8 = "{\n  int i\n  int j\n  j = 4\n\n  while(i != 3){\n    print(\"loop\")\n    print(i)\n    print(\" \")\n    int j\n    j = 1\n    while(j != 4){\n      print(j)\n      j = 1 + j\n    }\n    print(\" \")\n    i = 1 + i\n  }\n  print(\"done\")\n} $";

TEST_CASE_9 = "{\n  string s\n  s = \"aaa\"\n  if(s != \"aa\"){\n    print(\"aaa is not equal to aa\")\n  }\n} $";

TEST_CASES = [TEST_CASE_0, TEST_CASE_1, TEST_CASE_2, TEST_CASE_3, TEST_CASE_4, TEST_CASE_5, TEST_CASE_6, TEST_CASE_7, TEST_CASE_8, TEST_CASE_9];

function changeTestCase(){
  INPUT.val(TEST_CASES[$('#testCaseSelection').val()]);
  resetPage();
}

function defaultTestCase(){
  INPUT.val(TEST_CASE_0);
}