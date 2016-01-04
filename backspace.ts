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
            numpadText: ["?123", "ABC"],
            rowLengths: [10, 9, 7],
            font: "Roboto",
            custom_styles: []
        }
    ];
    private _keyMap: any;
    private _editorElement: any;
    private _baseElement: HTMLElement;
    private _isUpperCase: boolean;
    private _isNumberPad: boolean;
    private _isKeyPressed: boolean;
    private _addSwitchKey: boolean;
    private _pressedHandle: number;
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
        var rows = this._baseElement.querySelectorAll(".kb-row");
        var custom_styles = keymap.custom_styles;
        var font = keymap.font;
        var k = 0, c = 0;
        for (var r = 0; r < 3; r++) {
            (rows[r] as HTMLElement).innerHTML = null;
            for (k = 0; k < keymap.rowLengths[r]; k++) {
                var char = keys[c++];
                var el = document.createElement("div");
                el.classList.add("kb-key", "char");
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
                var cb = () => {
                    rows[r].appendChild(el);
                }
                var appended = this._insertCmdKey(k, keymap.rowLengths[r], r, rows, cb);
                if (!appended) {
                    cb();
                }
            }
        }
    }

    private _insertCmdKey(k, l, r, rows, cb): boolean {
        // The first key (left) in the third row.
        // Adding Shift key
        if (r == 2 && k == 0) {
            var shift = document.createElement("div");
            shift.classList.add("kb-key", "kb-other");
            shift.innerHTML = "Shift";
            var attr = document.createAttribute("data-handler");
            attr.value = "shift";
            shift.attributes.setNamedItem(attr);
            rows[r].appendChild(shift);
            cb(); // appended key after shift
            return true;
        }
        // The last key (right) in the third row.
        // Adding Backspace key
        if (r == 2 && k == (l - 1)) {
            cb(); // appended key before backspace
            var bksp = document.createElement("div");
            bksp.classList.add("kb-key", "kb-other", "kb-flip");
            bksp.innerHTML = "&#8998;";
            var attr = document.createAttribute("data-handler");
            attr.value = "backspace";
            bksp.attributes.setNamedItem(attr);
            rows[r].appendChild(bksp);
            return true;
        }
        return false;
    }

    private _setKeymap(keymap: any, numpad: boolean, uppercase: boolean) {
        this._populate(keymap, numpad, uppercase);
        this._isNumberPad = numpad;
        this._isUpperCase = uppercase;
        this._keyMap = keymap;
        var numpadKey = document.querySelector(".kb-key[data-handler='numpad']") as HTMLElement;
        if (numpadKey) {
            numpadKey.innerHTML = this._keyMap.numpadText[this._isNumberPad ? 1 : 0];
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
            if (range.collapsed && range.startOffset > 0) {
                range.setStart(range.startContainer, range.startOffset - 1);
            }
            range.deleteContents();
            this._setCursor(range);
        }
    }

    private _handleKey(key: string, source: HTMLElement) {
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
                if (this._isUpperCase) {
                    this.SwitchCase();
                }
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

    private _setPressedInterval(initialTimeout: number, handlerAttr: string, element: HTMLElement) {
        var timeout = initialTimeout;
        clearInterval(this._pressedHandle);
        this._pressedHandle = setInterval(() => {
            if (this._isKeyPressed) {
                timeout = Math.min(Math.abs(timeout - 50), 100);
                this._handleKey(handlerAttr, element);
                this._setPressedInterval(timeout, handlerAttr, element);
            }
        }, timeout);
    }

    private _populateLastRow() {
        var rows = this._baseElement.querySelectorAll(".kb-row");
        var lr = rows[rows.length - 1];
        var keysToAdd = [
            {
                value: this._keyMap.numpadText[0],
                handler: "numpad",
                extraClass: null
            },
            {
                value: ",",
                handler: null,
                extraClass: null
            },
            {
                value: "Space",
                handler: "space",
                extraClass: "kb-spacebar"
            },
            {
                value: ".",
                handler: null,
                extraClass: null
            }
        ];
        var switchKeyObject = {
            value: "\uD83C\uDF10\uFE0E",
            handler: "switch",
            extraClass: null
        };
        var enterKeyObject = {
            value: "\u23CE",
            handler: "enter",
            extraClass: "kb-enter"
        };
        if (this._addSwitchKey) {
            keysToAdd.push(switchKeyObject);
        }
        keysToAdd.push(enterKeyObject);
        for (var i = 0; i < keysToAdd.length; i++) {
            var ko = keysToAdd[i];
            var ke = document.createElement("div");
            ke.classList.add("kb-key", "kb-other");
            if (ko.extraClass) {
                ke.classList.add(ko.extraClass);
            }
            ke.innerText = ko.value;
            var handler = ko.handler;
            if (handler) {
                var attr = document.createAttribute("data-handler");
                attr.value = handler;
                ke.attributes.setNamedItem(attr);
            }
            lr.appendChild(ke);
        }
    }

    constructor(editorElement: Element, isContentEditable: boolean, languageList: string[]) {
        var baseElement = document.createElement("div");
        baseElement.id = "kb-base";
        baseElement.classList.add("kb-base");
        for (var r = 0; r < 4; r++) {
            var rowElement = document.createElement("div");
            rowElement.classList.add("kb-row");
            baseElement.appendChild(rowElement);
        }
        this._editorElement = editorElement;
        this._addSwitchKey = (languageList.length > 1);
        this._languages = languageList;
        this._languageIndex = 0;

        var handler = (ev: Event) => {
            if (ev.target !== ev.currentTarget) {
                var el = ev.target as HTMLElement;
                if (ev.type == "touchstart" || ev.type == "mousedown") {
                    ev.preventDefault();
                    el.classList.add("kb-pressed");
                    var handlerAttr = el.getAttribute("data-handler");
                    if (handlerAttr && handlerAttr == "backspace") {
                        this._isKeyPressed = true;
                        this._setPressedInterval(300, handlerAttr, el);
                    }
                }
                else if (ev.type == "touchend" || ev.type == "mouseup") {
                    el.classList.remove("kb-pressed");
                    if (this._isKeyPressed) {
                        clearInterval(this._pressedHandle);
                        this._isKeyPressed = false;
                        this._pressedHandle = null;
                    }
                    var attr = el.getAttribute("data-handler");
                    var args = (attr ? attr : el.innerText);
                    this._handleKey(args, el);
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
        this._setKeymap(Keyboard._keymaps[0], false, false);
        this._populateLastRow();

        if (isContentEditable) {
            this._editorElement.style.setProperty("white-space", "pre-wrap");
        }
        this._editorElement.focus();
    }
}