console.log("Test cases loaded");

TEST_CASE_0 = "{\nint x\nx = 1\n\nstring s\ns = \"test\"\n\nboolean b\nb = true\n\nif (x == 1) {\nprint(s)\n}\n} $";

TEST_CASE_1 = "{\nint x\nx=9\nx = 1 + 1 + 1\n\nstring s\ns      =\"\"\ns =         \"long    spaces\"\n\nboolean b\nb =     true\nb   =      false\nb = ((true == true) != false)\n} $";

TEST_CASE_2 = "{\nboolean b\nb= true\n\nif (b == true){}\nwhile false {}\nif ( (true == false) != (true == true) ) {}\n\nprint ( 1 )\n} $";

TEST_CASE_3 = "{\nint f int if=1\n}$";

TEST_CASES = [TEST_CASE_0, TEST_CASE_1, TEST_CASE_2, TEST_CASE_3];

function changeTestCase(){
  INPUT.val(TEST_CASES[$('#testCaseSelection').val()]);
  resetPage();
}