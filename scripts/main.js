var editor = document.getElementById('editor');
var languages = ["english"];
var kb = new Keyboard(editor, true, languages);
kb.Hide();

var isShown = false;
function toggleKeyboard() {
    if (isShown) {
        kb.Hide();
        isShown = false;
    }
    else {
        kb.Show();
        isShown = true;
    }
}

var button = document.getElementById("toggleButton");
button.addEventListener("click", function () {
    toggleKeyboard();
    var prefix = !isShown ? "View" : "Hide";
    button.innerText = prefix + " Keyboard";
});