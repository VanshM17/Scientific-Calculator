class Calculator {
    constructor(opts) {
        this.expressionDisplay  = opts.expressionDisplay;
        this.previousOperandEl  = opts.previousOperandEl;
        this.currentValueEl     = opts.currentValueEl;
        this.displayEl          = opts.displayEl;

        this.angleMode = 'deg'; // 'deg' | 'rad'
        this.secondMode = false;
        this.clear();
    }

    //State reset
    clear() {
        this.currentOperand  = '';
        this.previousOperand = '';
        this.operation       = undefined;
        this.expression      = '';   // full expression string shown on top row
        this.justComputed    = false;
        this.displayEl.classList.remove('error');
        this.updateDisplay();
    }

    //Delete last char
    delete() {
        if (this.justComputed) { this.clear(); return; }
        if (this.currentOperand === '') return;
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        this.updateDisplay();
    }

    //Append digit / decimal
    appendNumber(number) {
        if (this.justComputed) {
            this.currentOperand = '';
            this.expression = '';
            this.justComputed = false;
        }
        if (number === '.' && this.currentOperand.includes('.')) return;
        // prevent leading multiple zeros
        if (number === '0' && this.currentOperand === '0') return;
        this.currentOperand = this.currentOperand.toString() + number.toString();
        this.updateDisplay();
    }

    //Convert angle based on current mode
    toRad(deg) {
        return this.angleMode === 'deg' ? deg * (Math.PI / 180) : deg;
    }
    fromRad(rad) {
        return this.angleMode === 'deg' ? rad * (180 / Math.PI) : rad;
    }

    //Choose binary operation
    chooseOperation(operation, label) {
        if (this.currentOperand === '' && this.previousOperand === '') return;
        if (this.currentOperand === '' && this.previousOperand !== '') {
            // allow changing operation without entering second operand
            this.operation = operation;
            this.previousOperandEl.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${label || operation}`;
            return;
        }
        if (this.previousOperand !== '') {
            this.compute(true);
            if (this.displayEl.classList.contains('error')) return;
        }
        this.operation       = operation;
        this.previousOperand = this.currentOperand;
        this.expression      += (label || operation);
        this.currentOperand  = '';
        this.updateDisplay();
    }

    /* ── Compute result ── */
    compute(chaining = false) {
        let result;
        const prev    = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (!chaining && (isNaN(prev) || isNaN(current))) return;
        if (chaining && (isNaN(prev) || isNaN(current))) return;

        try {
            switch (this.operation) {
                case '+':    result = prev + current; break;
                case '-':    result = prev - current; break;
                case '×':    result = prev * current; break;
                case '÷':
                    if (current === 0) { this.showError('Div by 0'); return; }
                    result = prev / current;
                    break;
                case '^':    result = Math.pow(prev, current); break;
                case '∜':    result = Math.pow(prev, 1 / current); break;
                case 'log_y':
                    if (current <= 0 || current === 1) { this.showError('Undefined'); return; }
                    result = Math.log(prev) / Math.log(current);
                    break;
                case 'mod':  result = prev % current; break;
                default:     return;
            }

            if (!isFinite(result)) { this.showError('Overflow'); return; }

            // Build full expression for display
            this.expression = `${this.getDisplayNumber(this.previousOperand)} ${this.operation} ${this.getDisplayNumber(this.currentOperand)} =`;
            this.currentOperand  = this.roundResult(result).toString();
            this.operation       = undefined;
            this.previousOperand = '';
            this.justComputed    = true;
        } catch(e) {
            this.showError('Error');
        }
        this.updateDisplay();
    }

    //Apply unary scientific function
    applyUnary(fn, label) {
        if (this.currentOperand === '' && this.previousOperand === '') return;
        const x = parseFloat(
            this.currentOperand !== '' ? this.currentOperand : this.previousOperand
        );
        if (isNaN(x)) return;

        let result;
        try {
            result = fn(x);
        } catch(e) {
            this.showError('Error');
            return;
        }

        if (result === undefined || isNaN(result)) { this.showError('Undefined'); return; }
        if (!isFinite(result))                      { this.showError('Overflow');  return; }

        this.expression     = `${label}(${this.getDisplayNumber(x)}) =`;
        this.currentOperand = this.roundResult(result).toString();
        this.justComputed   = true;
        this.updateDisplay();
    }

    //Round to avoid floating-point noise
    roundResult(n) {
        const str = n.toPrecision(12);
        const back = parseFloat(str);
        // If it's an integer value, return it clean
        if (Number.isInteger(back)) return back;
        return back;
    }

    //Show error state
    showError(msg) {
        this.currentValueEl.innerText = msg;
        this.displayEl.classList.add('error');
        this.previousOperandEl.innerText = '';
        this.expressionDisplay.innerText = '';
        this.currentOperand  = '';
        this.previousOperand = '';
        this.operation       = undefined;
        this.expression      = '';
        this.justComputed    = false;
    }

    //Format number for display
    getDisplayNumber(number) {
        if (number === '' || number === undefined) return '';
        const str = number.toString();
        // Handle negative
        const negative = str.startsWith('-');
        const absStr   = negative ? str.slice(1) : str;
        const parts    = absStr.split('.');
        const intPart  = parseFloat(parts[0]);
        const decPart  = parts[1];

        let intDisplay = '';
        if (!isNaN(intPart)) {
            intDisplay = intPart.toLocaleString('en');
        }
        const result = decPart != null ? `${intDisplay}.${decPart}` : intDisplay;
        return negative ? `-${result}` : result;
    }

    //Update all display elements
    updateDisplay() {
        if (this.displayEl.classList.contains('error')) return;

        // Current value
        const val = this.currentOperand !== ''
            ? this.getDisplayNumber(this.currentOperand)
            : (this.justComputed ? this.getDisplayNumber(this.currentOperand) : '0');
        this.currentValueEl.innerText = val || '0';

        // Auto-shrink font for long numbers
        const len = (val || '0').replace(/[^0-9.]/g, '').length;
        const el  = this.currentValueEl.parentElement;
        el.classList.remove('shrink', 'tiny');
        if (len > 14) el.classList.add('tiny');
        else if (len > 10) el.classList.add('shrink');

        // Previous operand row
        if (this.operation != null) {
            this.previousOperandEl.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operationLabel || this.operation}`;
        } else {
            this.previousOperandEl.innerText = '';
        }

        // Expression row (history)
        if (this.expression) {
            this.expressionDisplay.innerText = this.expression;
        } else {
            this.expressionDisplay.innerText = '';
        }
}}

//DOM references
const expressionDisplay    = document.getElementById('expression-display');
const previousOperandEl    = document.getElementById('previous-operand');
const currentValueEl       = document.getElementById('current-value');
const displayEl            = document.querySelector('.display');
const calcGrid             = document.querySelector('.calculator-grid');
const equalsButton         = document.querySelector('[data-equals]');
const deleteButton         = document.querySelector('[data-delete]');
const clearButton          = document.querySelector('[data-all-clear]');
const secondButton         = document.querySelector('[data-value="2nd"]');
const degButton            = document.querySelector('[data-value="deg"]');
const angleModePill        = document.getElementById('angle-mode-pill');
const numberButtons        = document.querySelectorAll('[data-number]');
const operatorButtons      = document.querySelectorAll('[data-operation]');
const scientificButtons    = document.querySelectorAll('[data-value]');

//Calculator instance
const calculator = new Calculator({
    expressionDisplay,
    previousOperandEl,
    currentValueEl,
    displayEl,
});

//2nd mode swaps
const buttonSwaps = {
    'x2':   { normal: 'x²',    alt: 'x³',     normalTitle: 'Square',         altTitle: 'Cube' },
    'xy':   { normal: 'xʸ',    alt: 'ʸ√x',    normalTitle: 'x to power y',   altTitle: 'y-th root of x' },
    '10x':  { normal: '10ˣ',   alt: '2ˣ',     normalTitle: '10 to power x',  altTitle: '2 to power x' },
    'log':  { normal: 'log',   alt: 'logᵧ',   normalTitle: 'Log base 10',    altTitle: 'Log base y' },
    'ln':   { normal: 'ln',    alt: 'eˣ',     normalTitle: 'Natural log',     altTitle: 'e to power x' },
    'sin':  { normal: 'sin',   alt: 'sin⁻¹',  normalTitle: 'Sine',           altTitle: 'Arcsine' },
    'cos':  { normal: 'cos',   alt: 'cos⁻¹',  normalTitle: 'Cosine',         altTitle: 'Arccosine' },
    'tan':  { normal: 'tan',   alt: 'tan⁻¹',  normalTitle: 'Tangent',        altTitle: 'Arctangent' },
};

function toggleSecondMode(on) {
    calculator.secondMode = on;
    secondButton.classList.toggle('active', on);
    calcGrid.classList.toggle('second-active', on);

    Object.entries(buttonSwaps).forEach(([val, swap]) => {
        const btn = document.querySelector(`[data-value="${val}"]`);
        if (!btn) return;
        btn.innerText = on ? swap.alt : swap.normal;
        btn.title     = on ? swap.altTitle : swap.normalTitle;
    });
}

//Button flash helper
function flashBtn(btn) {
    if (!btn) return;
    btn.classList.remove('flash');
    void btn.offsetWidth; // reflow
    btn.classList.add('flash');
    btn.addEventListener('animationend', () => btn.classList.remove('flash'), { once: true });
}

//Factorial helper
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity; 
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
}

//Number buttons
numberButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        displayEl.classList.remove('error');
        calculator.appendNumber(btn.innerText.trim());
        flashBtn(btn);
    });
});

//Operator buttons
operatorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        displayEl.classList.remove('error');
        // Map visual minus to minus
        const raw = btn.innerText.trim();
        const op  = raw === '−' ? '-' : raw;
        calculator.operationLabel = raw;
        calculator.chooseOperation(op, raw);
        flashBtn(btn);
    });
});

//Scientific buttons
scientificButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        const sec = calculator.secondMode;

        displayEl.classList.remove('error');
        flashBtn(btn);

        switch (val) {
            /* ── 2nd toggle ── */
            case '2nd':
                toggleSecondMode(!calculator.secondMode);
                return;

            /* ── Deg / Rad toggle ── */
            case 'deg':
                calculator.angleMode = calculator.angleMode === 'deg' ? 'rad' : 'deg';
                const isDeg = calculator.angleMode === 'deg';
                btn.innerText          = isDeg ? 'DEG' : 'RAD';
                btn.classList.toggle('rad', !isDeg);
                angleModePill.innerText = isDeg ? 'DEG' : 'RAD';
                angleModePill.classList.toggle('rad', !isDeg);
                return;

            /* ── Constants ── */
            case 'pi':
                if (calculator.justComputed) { calculator.currentOperand = ''; calculator.justComputed = false; }
                calculator.currentOperand += Math.PI.toString();
                calculator.expression = 'π';
                calculator.updateDisplay();
                return;
            case 'e':
                if (calculator.justComputed) { calculator.currentOperand = ''; calculator.justComputed = false; }
                calculator.currentOperand += Math.E.toString();
                calculator.expression = 'e';
                calculator.updateDisplay();
                return;

            /* ── Brackets ── */
            case '(':
            case ')':
                if (calculator.justComputed) { calculator.currentOperand = ''; calculator.justComputed = false; }
                calculator.currentOperand += val;
                calculator.updateDisplay();
                return;

            /* ── Power & root ── */
            case 'x2':
                if (sec) {
                    calculator.applyUnary(x => Math.pow(x, 3), 'x³');
                } else {
                    calculator.applyUnary(x => Math.pow(x, 2), 'x²');
                }
                break;
            case 'xy':
                if (sec) {
                    calculator.chooseOperation('∜', 'ʸ√');
                } else {
                    calculator.chooseOperation('^', '^');
                }
                break;
            case '10x':
                if (sec) {
                    calculator.applyUnary(x => Math.pow(2, x), '2^');
                } else {
                    calculator.applyUnary(x => Math.pow(10, x), '10^');
                }
                break;

            /* ── Logarithms ── */
            case 'log':
                if (sec) {
                    calculator.chooseOperation('log_y', 'log_y');
                } else {
                    calculator.applyUnary(x => {
                        if (x <= 0) throw new Error();
                        return Math.log10(x);
                    }, 'log');
                }
                break;
            case 'ln':
                if (sec) {
                    calculator.applyUnary(x => Math.exp(x), 'eˣ');
                } else {
                    calculator.applyUnary(x => {
                        if (x <= 0) throw new Error();
                        return Math.log(x);
                    }, 'ln');
                }
                break;

            /* ── Square root / inverse ── */
            case 'sqrt':
                calculator.applyUnary(x => {
                    if (x < 0) throw new Error();
                    return Math.sqrt(x);
                }, '√');
                break;
            case 'inv':
                calculator.applyUnary(x => {
                    if (x === 0) throw new Error();
                    return 1 / x;
                }, '1/');
                break;

            /* ── Trig ── */
            case 'sin':
                if (sec) {
                    calculator.applyUnary(x => calculator.fromRad(Math.asin(x)), 'sin⁻¹');
                } else {
                    calculator.applyUnary(x => Math.sin(calculator.toRad(x)), 'sin');
                }
                break;
            case 'cos':
                if (sec) {
                    calculator.applyUnary(x => calculator.fromRad(Math.acos(x)), 'cos⁻¹');
                } else {
                    calculator.applyUnary(x => Math.cos(calculator.toRad(x)), 'cos');
                }
                break;
            case 'tan':
                if (sec) {
                    calculator.applyUnary(x => calculator.fromRad(Math.atan(x)), 'tan⁻¹');
                } else {
                    calculator.applyUnary(x => Math.tan(calculator.toRad(x)), 'tan');
                }
                break;

            /* ── Mod & Factorial ── */
            case 'mod':
                calculator.chooseOperation('mod', 'mod');
                break;
            case 'fact':
                calculator.applyUnary(x => {
                    const n = Math.round(x);
                    const r = factorial(n);
                    if (!isFinite(r) || isNaN(r)) throw new Error();
                    return r;
                }, 'n!');
                break;

            default:
                return;
        }

        // turn off 2nd mode after use
        if (sec && val !== '2nd') {
            toggleSecondMode(false);
        }
    });
});

    /*Equals */
equalsButton.addEventListener('click', () => {
    flashBtn(equalsButton);
    calculator.compute();
});

    /*Clear */
clearButton.addEventListener('click', () => {
    flashBtn(clearButton);
    calculator.clear();
});

    /*Delete */
deleteButton.addEventListener('click', () => {
    flashBtn(deleteButton);
    calculator.delete();
});

/*Full keyboard support*/
window.addEventListener('keydown', e => {
    // Digits & decimal
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        e.preventDefault();
        displayEl.classList.remove('error');
        calculator.appendNumber(e.key);
        highlightKey(e.key);
        return;
    }

    // Operators
    const opMap = { '+': '+', '-': '-', '*': '×', '/': '÷', '^': '^', '%': 'mod'};
    if (opMap[e.key]) {
        e.preventDefault();
        displayEl.classList.remove('error');
        const op = opMap[e.key];
        const display = e.key === '*' ? '×' : e.key === '/' ? '÷' : op;
        calculator.operationLabel = display;
        calculator.chooseOperation(op, display);
        highlightOpKey(display);
        return;
    }

    // Enter / = → compute
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        flashBtn(equalsButton);
        calculator.compute();
        return;
    }

    // Backspace → delete
    if (e.key === 'Backspace') {
        e.preventDefault();
        flashBtn(deleteButton);
        calculator.delete();
        return;
    }

    // Escape → clear
    if (e.key === 'Escape') {
        e.preventDefault();
        flashBtn(clearButton);
        calculator.clear();
        return;
    }
});

/* Visually highlight the matching button on keypress */
function highlightKey(key) {
    numberButtons.forEach(btn => {
        if (btn.innerText.trim() === key) flashBtn(btn);
    });
}

function highlightOpKey(op) {
    operatorButtons.forEach(btn => {
        const raw = btn.innerText.trim();
        const mapped = raw === '−' ? '-' : raw;
        if (mapped === op || raw === op) flashBtn(btn);
    });
}

/* Debounce rapid-fire taps (mobile)*/
let lastTap = 0;
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastTap < 60) { return; }
        lastTap = now;
    }, { capture: true });
});
