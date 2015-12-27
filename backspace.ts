class Keyboard {
    private static _keymaps = [
        {
            name: "default",
            lang: "english",
            displayName: "English",
            direction: "ltr",
            keys: {
                lowercase: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'],
                uppercase: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'],
                numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '@', '#', '$', '%', '&', '-', '+', '(', ')', '*', '"', "'", ':', ';', '!', '?']
            },
            font: "Roboto",
            custom_styles: []
        }
    ];
    private _baseElement: HTMLElement;
    private _editorElement: any;
    private _keyElements: any;
    private _cmdKeys: any;
    private _keyMap: any;
    private _isUpperCase: boolean;
    private _isNumberPad: boolean;
    private _languageIndex: number;
    private _languages: string[];

    private _populate(keymap: any, numpad: boolean, uppercase: boolean) {
        var keys;
        if (!numpad) {
            keys = (uppercase ? keymap.keys.uppercase : keymap.keys.lowercase);
        }
        else {
            keys = keymap.keys.numbers;
        }
        var custom_styles = keymap.custom_styles;
        var font = keymap.font;
        var k = 0, c = 0;
        for (k = 0; k < keys.length; k++) {
            var char = keys[c++];
            var el = (this._keyElements[k] as HTMLElement);
            if (el.hasAttribute("style")) {
                el.removeAttribute("style");
            }
            if (custom_styles && (custom_styles.length > 0)) {
                var style = custom_styles.filter(x => x.char == char)[0];
                for (var prop in style) {
                    if (prop != "char") {
                        el.style.setProperty(prop, style[prop]);
                    }
                }
            }
            if (font) {
                el.style.fontFamily = font;
            }
            el.innerHTML = char;
        }
    }

    private _setKeymap(keymap: any, numpad: boolean, uppercase: boolean) {
        this._populate(keymap, numpad, uppercase);
        this._isNumberPad = numpad;
        this._isUpperCase = uppercase;
        this._keyMap = keymap;
        for (var k = 0; k < this._cmdKeys.length; k++) {
            var keyEl = this._cmdKeys[k] as HTMLElement;
            var binding = keyEl.getAttribute("data-bind").split(":");
            var getProp = binding[0];
            var setProp = binding[1];
            keyEl[setProp] = this._keyMap[getProp];
        }
    }

    private _getCursor(): Range {
        var sel: Selection, range: Range;
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
        }
        return range;
    }

    private _setCursor(range: Range) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    private _isElementValid(element) {
        if (element === this._editorElement) return true;
        return element.parentNode && this._isElementValid(element.parentNode);
    }

    private _insertAtCursor(content: string, isTextNode: boolean, inner: string) {
        var range = this._getCursor(), node;
        if (this._isElementValid(range.startContainer)) {
            if (isTextNode) {
                node = document.createTextNode(content);
            }
            else {
                node = document.createElement(content);
                node.innerHTML = inner;
            }
            range.insertNode(node);
            range.setStartAfter(node);
            this._setCursor(range);
            this._editorElement.normalize();
        }
    }

    private _removeAtCursor() {
        var range = this._getCursor();
        if (this._isElementValid(range.startContainer)) {
            if (range.collapsed) {
                range.setStart(range.startContainer, range.startOffset - 1);
            }
            range.deleteContents();
            this._setCursor(range);
        }
    }

    private _handleKey(key: string) {
        switch (key) {
            case "shift":
                this.SwitchCase();
                break;
            case "numpad":
                this.ToggleNumpad();
                break;
            case "switch":
                this.SwitchLanguage();
                break;
            case "enter":
                this._insertAtCursor('\n', true, null);
                break;
            case "space":
                this._insertAtCursor('\u00a0', true, null);
                break;
            case "backspace":
                this._removeAtCursor();
                break;
            default:
                this._insertAtCursor(key, true, null);
                break;
        }
    }

    public SwitchCase() {
        if (!this._isUpperCase) {
            this._setKeymap(this._keyMap, false, true);
        }
        else {
            this._setKeymap(this._keyMap, false, false);
        }
    }

    public ToggleNumpad() {
        if (!this._isNumberPad) {
            this._setKeymap(this._keyMap, true, false);
        }
        else {
            this._setKeymap(this._keyMap, false, false);
        }
    }

    public SetLanguage(lang: string) {
        var keymap = Keyboard._keymaps.filter(x => x.lang == lang)[0];
        this._setKeymap(keymap, false, false);
    }

    public SwitchLanguage() {
        this._languageIndex++;
        if (this._languageIndex == this._languages.length) {
            this._languageIndex = 0;
        }
        this.SetLanguage(this._languages[this._languageIndex]);
    }

    public Hide() {
        this._baseElement.classList.add("kb-hidden");
    }

    public Show() {
        this._baseElement.classList.remove("kb-hidden");
    }

    public static AddKeymap(keymap: any) {
        this._keymaps.push(keymap);
    }

    public static RemoveKeymap(keymap: any) {
        var index = this._keymaps.indexOf(keymap);
        if (index > -1) {
            this._keymaps.splice(index, 1);
        }
    }

    constructor(editorElement: Element, isContentEditable: boolean, languageList: string[]) {
        var baseElement = document.createElement("div");
        baseElement.id = "kb-base";
        baseElement.classList.add("kb-base");
        baseElement.innerHTML = window.atob(this._elementHTML);
        this._editorElement = editorElement;
        this._keyElements = baseElement.querySelectorAll('.char');
        this._cmdKeys = baseElement.querySelectorAll('.kb-key[data-bind]');
        this._setKeymap(Keyboard._keymaps[0], false, false);
        this._languages = languageList;
        this._languageIndex = 0;

        var handler = (ev: Event) => {
            if (ev.target !== ev.currentTarget) {
                var el = ev.target as HTMLElement;
                if (ev.type == "touchstart" || ev.type == "mousedown") {
                    ev.preventDefault();
                    el.classList.add("kb-pressed");
                }
                else if (ev.type == "touchend" || ev.type == "mouseup") {
                    el.classList.remove("kb-pressed");
                    var attr = el.getAttribute("data-handler");
                    var args = (attr ? attr : el.innerText);
                    this._handleKey(args);
                }
            }
            ev.stopPropagation();
        }
        var supportsTouch = 'ontouchstart' in window
        if (supportsTouch) {
            baseElement.addEventListener("touchstart", handler, false);
            baseElement.addEventListener("touchend", handler, false);
        }
        else {
            baseElement.addEventListener("mousedown", handler, false);
            baseElement.addEventListener("mouseup", handler, false);
        }

        document.body.appendChild(baseElement);
        this._baseElement = baseElement;

        if (isContentEditable) {
            this._editorElement.style.setProperty("white-space", "pre-wrap");
        }
        this._editorElement.focus();
    }

    private _elementHTML = "PGRpdiBjbGFzcz0ia2Itcm93Ij48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGtiLW90aGVyIiBkYXRhLWhhbmRsZXI9ImJhY2tzcGFjZSI+QmFjazwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9ImtiLXJvdyI+IDxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBrYi1vdGhlciIgZGF0YS1oYW5kbGVyPSJlbnRlciI+RW50ZXI8L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1yb3ciPiA8ZGl2IGNsYXNzPSJrYi1rZXkga2Itb3RoZXIiIGRhdGEtaGFuZGxlcj0ic2hpZnQiPlNoaWZ0PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBjaGFyIj48L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkgY2hhciI+PC9kaXY+PGRpdiBjbGFzcz0ia2Ita2V5IGNoYXIiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9ImtiLXJvdyI+IDxkaXYgY2xhc3M9ImtiLWtleSBrYi1vdGhlciIgZGF0YS1oYW5kbGVyPSJudW1wYWQiPj8xMjM8L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkga2Itb3RoZXIiPiw8L2Rpdj48ZGl2IGNsYXNzPSJrYi1rZXkga2Itb3RoZXIga2Itc3BhY2ViYXIiIGRhdGEtaGFuZGxlcj0ic3BhY2UiIGRhdGEtYmluZD0iZGlzcGxheU5hbWU6aW5uZXJUZXh0Ij5TcGFjZTwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBrYi1vdGhlciI+LjwvZGl2PjxkaXYgY2xhc3M9ImtiLWtleSBrYi1vdGhlciIgZGF0YS1oYW5kbGVyPSJzd2l0Y2giPlN3aXRjaDwvZGl2PjwvZGl2Pg==";
}