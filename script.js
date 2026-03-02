class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.justComputed = false; // flag used to reset after an operation
        this.clear();
    }

    clear(){
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
        this.justComputed = false;
    }

    delete(){

    }

    appendNumber(number){
        // if we just computed a result and the user starts typing a new number, replace
        if (this.justComputed) {
            this.currentOperand = '';
            this.justComputed = false;
        }

        // Prevent multiple decimal points
        if (number === '.' && this.currentOperand.includes('.')) return;

        // Convert to string to concatenate numbers
        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    chooseOperation(operation){
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = ''

    }

    compute(){
        // Convert operands to numbers for calculation
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                computation = prev / current;
                break;
            case '^':
                computation = Math.pow(prev, current);
                break;
            case '∜':
                // yth root of x: x^(1/y)
                computation = Math.pow(prev, 1 / current);
                break;
            case 'log':
                // log_y(x) = log(x) / log(y)
                computation = Math.log(prev) / Math.log(current);
                break;
            case 'mod':
                // modulo: prev % current
                computation = prev % current;
                break;
            default:
                return;
        }
        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.justComputed = true; // mark that we finished computing
    }

    updateDisplay(){
        this.currentOperandTextElement.innerText = this.currentOperand;
        if (this.operation != null) {
            this.previousOperandTextElement.innerText = `${this.previousOperand} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = this.previousOperand;
        }
    }   
}

const numberButtons = document.querySelectorAll('[data-number]');
const operatorButtons = document.querySelectorAll('[data-operation]');
// all buttons carrying a data-value attribute (scientific keys)
const scientificButtons = document.querySelectorAll('[data-value]');
const equalsButton = document.querySelector('[data-equals]');
const deleteButton = document.querySelector('[data-delete]');
const clearButton = document.querySelector('[data-all-clear]');
const secondButton = document.querySelector('[data-value="2nd"]');
const previousOperandTextElement = document.querySelector('[data-previous-operand]');
const currentOperandTextElement = document.querySelector('[data-current-operand]');

let secondMode = false; // track if 2nd is active

// mapping of buttons to swap text on 2nd toggle
const buttonSwaps = {
    'xy': { normal: 'xʸ', alternate: 'ʸ√x' },
    '10x': { normal: '10ˣ', alternate: '2ˣ' },
    'log': { normal: 'log x', alternate: 'logᵧ x' },
    'ln': { normal: 'ln x', alternate: 'eˣ' }
};

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement)

// Add event listeners to number buttons
numberButtons.forEach(button => {
  button.addEventListener('click', () => {
    calculator.appendNumber(button.innerText)
    calculator.updateDisplay()
})
})

// Add event listeners to operator buttons
operatorButtons.forEach(button => {
  button.addEventListener('click', () => {
    calculator.chooseOperation(button.innerText)
    calculator.updateDisplay()
})
})

// scientific button handler (unary + exponent + 2nd mode)
scientificButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        
        // handle 2nd button toggle
        if (val === '2nd') {
            secondMode = !secondMode;
            btn.classList.toggle('active');
            
            // swap button text for functions that have alternate modes
            Object.keys(buttonSwaps).forEach(btnVal => {
                const btn2 = document.querySelector(`[data-value="${btnVal}"]`);
                if (btn2) {
                    const swap = buttonSwaps[btnVal];
                    btn2.innerText = secondMode ? swap.alternate : swap.normal;
                }
            });
            
            return;
        }
        
        // handle brackets
        if (val === '(') {
            calculator.currentOperand = (calculator.currentOperand || '0') + '(';
            calculator.updateDisplay();
            return;
        }
        if (val === ')') {
            calculator.currentOperand = (calculator.currentOperand || '0') + ')';
            calculator.updateDisplay();
            return;
        }
        
        // handle scientific functions with 2nd mode variants
        switch (val) {
            case 'xy':
                if (secondMode) {
                    // yth root of x (x^(1/y))
                    calculator.chooseOperation('∜');
                } else {
                    calculator.chooseOperation('^');
                }
                break;
            case '10x':
                if (secondMode) {
                    // 2^x in 2nd mode - apply immediately
                    if (calculator.currentOperand !== '') {
                        calculator.currentOperand = Math.pow(2, parseFloat(calculator.currentOperand)).toString();
                        calculator.justComputed = true;
                    }
                } else {
                    // 10^x - apply immediately
                    if (calculator.currentOperand !== '') {
                        calculator.currentOperand = Math.pow(10, parseFloat(calculator.currentOperand)).toString();
                        calculator.justComputed = true;
                    }
                }
                break;
            case 'log':
                if (secondMode) {
                    // log_y(x) - need 2 operands, treat as binary operation
                    calculator.chooseOperation('log');
                } else {
                    if (calculator.currentOperand !== '') {
                        calculator.currentOperand = Math.log10(parseFloat(calculator.currentOperand)).toString();
                        calculator.justComputed = true;
                    }
                }
                break;
            case 'ln':
                if (secondMode) {
                    // e^x in 2nd mode - apply immediately
                    if (calculator.currentOperand !== '') {
                        calculator.currentOperand = Math.exp(parseFloat(calculator.currentOperand)).toString();
                        calculator.justComputed = true;
                    }
                } else {
                    // ln(x) - apply immediately
                    if (calculator.currentOperand !== '') {
                        calculator.currentOperand = Math.log(parseFloat(calculator.currentOperand)).toString();
                        calculator.justComputed = true;
                    }
                }
                break;
            case 'sqrt':
                if (calculator.currentOperand !== '') {
                    calculator.currentOperand = Math.sqrt(parseFloat(calculator.currentOperand)).toString();
                    calculator.justComputed = true;
                }
                break;
            case 'inv':
                if (calculator.currentOperand !== '') {
                    calculator.currentOperand = (1 / parseFloat(calculator.currentOperand)).toString();
                    calculator.justComputed = true;
                }
                break;
            case 'pi':
                calculator.currentOperand = (calculator.currentOperand ? parseFloat(calculator.currentOperand) * Math.PI : Math.PI).toString();
                break;
            case 'e':
                calculator.currentOperand = (calculator.currentOperand ? parseFloat(calculator.currentOperand) * Math.E : Math.E).toString();
                break;
            case 'x2':
                if (calculator.currentOperand !== '') {
                    calculator.currentOperand = Math.pow(parseFloat(calculator.currentOperand), 2).toString();
                    calculator.justComputed = true;
                }
                break;
            case 'fact':
                // factorial n!
                if (calculator.currentOperand !== '') {
                    const n = parseInt(calculator.currentOperand);
                    if (n >= 0 && Number.isInteger(parseFloat(calculator.currentOperand))) {
                        let factorial = 1;
                        for (let i = 2; i <= n; i++) {
                            factorial *= i;
                        }
                        calculator.currentOperand = factorial.toString();
                        calculator.justComputed = true;
                    }
                }
                break;
            case 'sin':
                // sine (convert degrees to radians)
                if (calculator.currentOperand !== '') {
                    const degToRad = parseFloat(calculator.currentOperand) * (Math.PI / 180);
                    calculator.currentOperand = Math.sin(degToRad).toString();
                    calculator.justComputed = true;
                }
                break;
            case 'cos':
                // cosine (convert degrees to radians)
                if (calculator.currentOperand !== '') {
                    const degToRad = parseFloat(calculator.currentOperand) * (Math.PI / 180);
                    calculator.currentOperand = Math.cos(degToRad).toString();
                    calculator.justComputed = true;
                }
                break;
            case 'tan':
                // tangent (convert degrees to radians)
                if (calculator.currentOperand !== '') {
                    const degToRad = parseFloat(calculator.currentOperand) * (Math.PI / 180);
                    calculator.currentOperand = Math.tan(degToRad).toString();
                    calculator.justComputed = true;
                }
                break;
            case 'mod':
                // modulo - binary operation
                calculator.chooseOperation('mod');
                break;
            default:
                return;
        }
        calculator.updateDisplay();
    });
});

// Add event listener to equals button
equalsButton.addEventListener('click', button => {
    calculator.compute()
    calculator.updateDisplay()
})

// Add event listener to clear button
clearButton.addEventListener('click', button => {
    calculator.clear()
    calculator.updateDisplay()
})

// clear calculation when Escape key is pressed anywhere in the window
window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        calculator.clear();
        calculator.updateDisplay();
    }
});
