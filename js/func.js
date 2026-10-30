// const lengthFunc = "len(command)+len(params)"
// const checksumFunc = "0x100-(sum(header)+sum(length)+sum(command)+sum(params))&0xFF"

const lengthFunc = "len(command,params)"
const checksumFunc = "0x100-sum(header,length,command,params)&0xFF"

function calc(obj, func) {
    // console.log("calc:", func)
    if(typeof func === 'number')
        return func
    let parts = func.match(/((len|sum)\([A-Za-z_,]+\))|(0x[0-9A-F]+)|(\d+)|([+-\\&])|(\(.+\))/g)
    while(parts.length > 1) {
        // console.log("parts:",parts)
        const partsWithIndex = parts.map((part, index) => ({ part, index }))
        const operators = partsWithIndex.filter(item => /^(\+|-|&)$/.test(item.part))
        // console.log("operators:", operators)
        if(operators.length === 0)
            throw new Error("invalid expression: no operator")
        const operatorPriorities = ["&", "+", "-"]
        operators.sort((a, b) => operatorPriorities.indexOf(a.part) - operatorPriorities.indexOf(b.part))
        const operator = operators[0]
        if(operator.index === 0 && operator.part !== '-')
            throw new Error(`invalid operator: ${operator.part} at beginning`)
        else if(operator.index === parts.length - 1)
            throw new Error(`invalid operator: ${operator.part} at end`)
        let calculatedPart
        switch(operator.part) {
            case "&":
                calculatedPart = calc(obj,parts[operator.index - 1]) & calc(obj,parts[operator.index + 1])
                break
            case "+":
                calculatedPart = calc(obj,parts[operator.index - 1]) + calc(obj,parts[operator.index + 1])
                break
            case "-":
                calculatedPart = (operator.index > 0 ? calc(obj,parts[operator.index - 1]) : 0) - calc(obj,parts[operator.index + 1])
        }
        parts = [...parts.slice(0,operator.index-1), calculatedPart, ...parts.slice(operator.index+2)]
    }
    const part = parts[0]
    if(typeof part === 'number')
        return part
    function arr(obj, keys) {
        return keys.split(',').reduce((acc, key) => [...acc, ...(obj[key] || [])], [])
    }
    const lenMatch = part.match(/^len\(([A-Za-z_,]+)\)$/)
    if(lenMatch)
        return arr(obj, lenMatch[1]).length || 0
    const sumMatch = part.match(/^sum\(([A-Za-z_,]+)\)$/)
    if(sumMatch)
        return arr(obj, sumMatch[1]).reduce((acc, val) => acc + val, 0) || 0
    const hexMatch = part.match(/^0x([0-9A-Fa-f]+)$/)
    if(hexMatch)
        return parseInt(hexMatch[0], 16)
    const decMatch = part.match(/(\d+)/)
    if(decMatch)
        return parseInt(decMatch[0], 10)
    const bracketMatch = part.match(/^\((.+)\)$/)
    if(bracketMatch)
        return calc(obj, bracketMatch[1])
    throw new Error(`invalid operand: ${part}`)
}

const value = {
    header: [0x43],
    length: [0x01],
    command: [0x10]
}

console.log("result of lengthFunc:", "0x" + calc(value, lengthFunc).toString(16))
console.log("result of checksumFunc:", "0x" + calc(value, checksumFunc).toString(16))
