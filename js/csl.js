function checkLength(data, offset, byteLength) {
    if(byteLength === undefined)
        throw new Error('byteLength not set')
    if(offset + byteLength > data.length)
        throw new Error('Decoding failed: length too short', {
            cause: {
                data,
                offset,
                byteLength
            }
        })
}

function csl_decode_bcd(data, offset) {
    checkLength(data, offset, 1)
    const x = data[offset]
    const l = x % 0x10;
    const h = (x - l) / 0x10;
    if((h <= 9) && (l <= 9))
        return { value: h * 10 + l, byteLength: 1 };
    else
        throw new Error(`Decoding failed: invalid bcd value ${x}`)
}

function csl_encode_bcd(x)
{
    if((x >= 0) && (x < 100)) {
        const l = x % 10;
        const h = (x - l) / 10;
        return h * 0x10 + l;
    }
    else
        throw new Error(`Encoding failed: invalid bcd value ${x}`)
}

function csl_decode_uint8(data, offset) {
    checkLength(data, offset, 1)
    return { value: data[offset], byteLength: 1 }
}

function csl_decode_int8(data, offset) {
    checkLength(data, offset, 1)
    const n = data[offset]
    if(n >= 0 && n <= 127)
        return { value: n, byteLength: 1 }
    else if(n >= 128 && n <= 255)
        return { value: n - 256, byteLength: 1 }
    else
        throw new Error(`Decoding failed: invalid int8 value ${n}`)
}

function csl_encode_int8(x) {
    if((x >= 0) && (x <= 127))
        return x
    else if((x < 0 ) && (x >= -128))
        return x + 256
    else
        throw new Error(`Encoding failed: invalid int8 value ${x}`)
}

function csl_decode_uint16(data, offset, littleEndian) {
    checkLength(data, offset, 2)
    const dv = new DataView(data.buffer)
    return { value: dv.getUint16(offset, littleEndian), byteLength: 2 }
}

function csl_decode_int16(data, offset, littleEndian) {
    checkLength(data, offset, 2)
    const dv = new DataView(data.buffer)
    return { value: dv.getInt16(offset, littleEndian), byteLength: 2 }
}

function csl_decode_uint32(data, offset, littleEndian) {
    checkLength(data, offset, 4)
    const dv = new DataView(data.buffer)
    return { value: dv.getUint32(offset, littleEndian), byteLength: 4 }
}

function csl_decode_int32(data, offset, littleEndian) {
    checkLength(data, offset, 4)
    const dv = new DataView(data.buffer)
    return { value: dv.getInt32(offset, littleEndian), byteLength: 4 }
}

function csl_decode_float32(data, offset, littleEndian) {
    checkLength(data, offset, 4)
    const dv = new DataView(data.buffer)
    return { value: dv.getFloat32(offset, littleEndian), byteLength: 4 }
}

function csl_decode_number(data, offset, config) {
    let result
    switch(config.numberType) {
        case 'bcd':
            result = csl_decode_bcd(data, offset)
            break
        case 'uint8':
            result = csl_decode_uint8(data, offset)
            break
        case 'int8':
            result = csl_decode_int8(data, offset)
            break
        case 'uint16be':
            result = csl_decode_uint16(data, offset, false)
            break
        case 'uint16le':
            result = csl_decode_uint16(data, offset, true)
            break
        case 'int16be':
            result = csl_decode_int16(data, offset, false)
            break
        case 'int16le':
            result = csl_decode_int16(data, offset, true)
            break
        case 'uint32be':
            result = csl_decode_uint32(data, offset, false)
            break
        case 'uint32le':
            result = csl_decode_uint32(data, offset, true)
            break
        case 'int32be':
            result = csl_decode_int32(data, offset, false)
            break
        case 'int32le':
            result = csl_decode_int32(data, offset, true)
            break
        case 'float32be':
            result = csl_decode_float32(data, offset, false)
            break
        case 'float32le':
            result = csl_decode_float32(data, offset, true)
            break
        default:
            throw new Error('Decoding failed: number type not supported', {
                cause: {
                    config
                }
            })
    }
    return result
}

function csl_encode_number(value, config) {
    let typedArray
    switch(config.numberType) {
        case 'bcd':
            return new Uint8Array([csl_encode_bcd(value)])
        case 'uint8':
            return new Uint8Array([value])
        case 'int8':
            return new Uint8Array([csl_encode_int8(value)])
        case 'uint16be':
        case 'uint16le':
            typedArray = new Uint16Array([value])
            break
        case 'int16be':
        case 'int16le':
            typedArray = new Int16Array([value])
            break
        case 'uint32be':
        case 'uint32le':
            typedArray = new Uint32Array([value])
            break
        case 'int32be':
        case 'int32le':
            typedArray = new Int32Array([value])
            break
        case 'float32be':
        case 'float32le':
            typedArray = new Float32Array([value])
            break
        default:
            throw new Error(`Encoding failed: numberType not supported ${config.numberType}`, {
                cause: config
            })
    }
    const leArray = new Uint8Array(typedArray.buffer)
    if(config.numberType.endsWith('le'))
        return leArray
    else {
        const byteLength = typedArray.byteLength
        const res = new Uint8Array(byteLength)
        for(let i=0; i<byteLength; i++)
            res[i] = leArray[byteLength - 1 - i]
        return res
    }
}

function csl_decode_string(data, offset, config) {
    if(typeof config.byteLength !== 'number')
        throw new Error("Decoding failed: byteLength of string not set", {
            cause: config
        })
    checkLength(data, offset, config.byteLength)
    if(config.encoding === 'hex')
        return { value: csl_util_build_hex_string(Array.from(data.slice(offset, offset + config.byteLength)), config.glue), byteLength: config.byteLength }
    else {
        let stringLength = config.byteLength
        while(stringLength > 0 && data[offset+stringLength-1] === 0)
            stringLength--
        const textDecoder = new TextDecoder()
        return { value: textDecoder.decode(data.slice(offset, offset + stringLength)), byteLength: config.byteLength }
    }
}

function csl_encode_string(str, config) {
    const { byteLength, encoding } = config;
    if(typeof byteLength !== 'number')
        throw new Error('Encoding failed: byte length of string not set', {
            cause: {
                str
            }
        })
    const bytes = []
    let i=0
    if(encoding === 'hex') {
        const hexBytes = csl_util_parse_hex_string(str)
        const stringLength = Math.min(hexBytes.length, byteLength)
        while(i < stringLength) {
            bytes[i] = hexBytes[i]
            i++
        }
    }
    else {
        const textEncoder = new TextEncoder()
        const strBytes = textEncoder.encode(str)
        const stringLength = Math.min(strBytes.length, byteLength)
        while(i < stringLength) {
            bytes[i] = strBytes[i]
            i++
        }
    }
    while(i < byteLength)
        bytes[i++] = 0
    return bytes
}

function csl_decode_bytes(data, offset, config) {
    let { byteLength } = config
    if(typeof byteLength === 'number') {
        checkLength(data, offset, byteLength)
        return { value: data.slice(offset, offset + byteLength), byteLength }
    }
    else if(data.length > offset) {
        byteLength = data.length - offset
        return { value: data.slice(offset, offset + byteLength), byteLength }
    }
    else
        return { value: null, byteLength: 0 }
}

function check_boolean_config(config) {
    let { trueValue, falseValue, defaultValue } = config
    if(trueValue === undefined && falseValue === undefined && defaultValue === undefined) {
        trueValue = 1
        falseValue = 0
        defaultValue = true
    }
    else if(trueValue === undefined || falseValue === undefined || defaultValue === undefined)
        throw new Error('Decoding failed: invalid config for boolean(trueValue, falseValue and defaultValue must be all set or not set)')
    return {
        trueValue,
        falseValue,
        defaultValue
    }
}

function csl_decode_boolean(data, offset, config) {
    checkLength(data, offset, 1)
    const { trueValue, falseValue, defaultValue } = check_boolean_config(config)
    if(data[offset] === trueValue)
        return { value: true, byteLength: 1 }
    else if(data[offset] === falseValue)
        return { value: false, byteLength: 1 }
    else
        return { value: defaultValue, byteLength: 1 }
}

function csl_encode_boolean(value, config) {
    const { trueValue, falseValue } = check_boolean_config(config)
    return new Uint8Array([value ? trueValue : falseValue])
}

function csl_decode_bitmask(data, offset, config, types) {
    const { byteLength, endian, attributes } = config
    checkLength(data, offset, byteLength)
    let x = data[offset]
    if(byteLength > 1) {
        if(endian === 'little')
            for(let i=1; i<byteLength; i++)
                x = x | (data[offset + i] << (8 * i))
        else if(endian === 'big')
            for(let i=1; i<byteLength; i++)
                x = (x  << (8 * i)) | data[offset + i]
        else
            throw new Error('Decoding failed: invalid boolean config - endian must be specified when byteLength > 1')
    }
    const res = {}
    attributes.forEach(attribute => {
        const { mask, name } = attribute
        let { shift } = attribute
        if(shift === undefined) {
            shift = 0;
            while(((1 << shift) & mask) == 0)
                shift++
        }
        const attrByte = (x & mask) >> shift;
        const attrResult = csl_decode([attrByte], 0, attribute, types)
        res[name] = attrResult.value
    })
    return { value: res, byteLength }
}

function csl_encode_bitmask(value, config, types) {
    let b = 0
    const { attributes, byteLength, endian } = config
    attributes.forEach(attribute => {
        const { mask, name } = attribute
        const attrData = csl_encode(value[name], attribute, types)
        const attrValue = attrData[0]
        let maskShift = 0;
        while(((1 << maskShift) & mask) == 0)
            maskShift++;
        b |= attrValue << maskShift
    })
    const res = new Uint8Array(byteLength)
    if(endian === 'little')
        for(let i=0; i<byteLength; i++)
            res[i] = (b >> (8 * i)) & 0xFF
    else if(endian === 'big')
        for(let i=0; i<byteLength; i++)
            res[i] = (b >> (8 * (byteLength - 1 - i))) & 0xFF
    else if(endian === undefined && byteLength === 1)
        res[0] = b
    else
        throw new Error('Encoding failed: invalid boolean config - endian must be specified when byteLength > 1')
    return res
}

function csl_get_index_type(value, config) {
    const indexValue = value[config.indexName]
    if(indexValue !== undefined) {
        const { types } = config
        return types.find(t => parseInt(t.indexValue) === indexValue)
    }
    else
        throw new Error(`csl get index type failed: index could not be determined for ${config.name}`)
}

function csl_decode_index(value, data, offset, config, types) { 
    const type = csl_get_index_type(value, config)
    if(type !== undefined)
        return csl_decode(data, offset, type, types)
    if(!config.optional)
        throw new Error("csl decode index failed: index type not found")
    return { value: undefined, byteLength: 0 }
}

function csl_decode_object(data, offset, config, types) {
    const { byteLength, attributes } = config
    if(typeof byteLength === 'number')
        checkLength(data, offset, byteLength)
    const res = {}
    let totalLength = 0
    for(let attribute of attributes) {
        const { name, byteLength, lengthFunc, type } = attribute
        if(byteLength === undefined && lengthFunc) {
            attribute = {
                ...attribute,
                byteLength: csl_evaluate(res, lengthFunc)
            }
        }
        if(type === "index") {
            const attributeResult = csl_decode_index(res, data, offset + totalLength, attribute, types)
            if(attributeResult.value !== undefined)
                res[name] = attributeResult.value
            totalLength += attributeResult.byteLength
        }
        else {
            const attributeResult = csl_decode(data, offset + totalLength, attribute, types)
            res[name] = attributeResult.value
            totalLength += attributeResult.byteLength
        }
        if(offset + totalLength === data.length)
            break
    }
    return { value: res, byteLength: totalLength }
}

function csl_encode_object(value, config, types) {
    const { attributes } = config
    let attributeBytes = {}
    const attributesToEvaluate = []
    for(let attribute of attributes) {
        let attributeValue = attribute.value
        if(attributeValue === undefined) {
            attributeValue = value[attribute.name]
            if(attributeValue === undefined) {
                if(attribute.valueFunc)
                    attributesToEvaluate.push(attribute)
                else if(attribute.optional)
                    continue
                else
                    throw new Error(`Encoding failed: value not found of ${attribute.name || 'anonymous attribute'}`, {
                        value,
                        attribute
                    })
            }
        }
        if(attribute.type === 'index') {
            const attributeType = csl_get_index_type(value, attribute)
            if(attributeType === undefined)
                throw new Error(`Encoding failed: index type not found for ${attribute.name}`)
            attributeBytes[attribute.name] = csl_encode(attributeValue, attributeType, types)
        }
        else
            attributeBytes[attribute.name] = csl_encode(attributeValue, attribute, types)
    }
    for(const attribute of attributesToEvaluate) {
        const attributeValue = csl_evaluate(attributeBytes, attribute.valueFunc)
        attributeBytes[attribute.name] = csl_encode(attributeValue, attribute, types)
    }
    const bytes = attributes.reduce((acc, attribute) => acc.concat(Array.from(attributeBytes[attribute.name] || [])), [])
    return new Uint8Array(bytes)
}

function csl_decode_array(data, offset, config, types) {
    const { byteLength, item } = config
    if(typeof byteLength !== 'number')
        throw new Error("Decoding failed: byteLength of array not set", {
            cause: config
        })
    checkLength(data, offset, byteLength)
    let totalLength = 0
    const res = []
    while(totalLength < byteLength) {
        const itemResult = csl_decode(data, offset + totalLength, item, types)
        res.push(itemResult.value)
        totalLength += itemResult.byteLength
    }
    return { value: res, byteLength: totalLength }
}

function csl_encode_array(value, config, types) {
    const { item } = config
    let data = []
    for(const itemValue of value) {
        const itemData = csl_encode(itemValue, item, types)
        data = data.concat(Array.from(itemData))
    }
    return new Uint8Array(data)
}

export function csl_decode(data, offset, config, types) {
    if(!(data instanceof Uint8Array)) {
        if(data instanceof Array || data instanceof ArrayBuffer)
            data = new Uint8Array(data)
        else
            throw new Error('Decoding failed: data is not instance of Uint8Array/Array/ArrayBuffer', {
                cause: {
                    data
                }
            })
    }  
    switch(config.type) {
        case 'number':
            return csl_decode_number(data, offset, config)
        case 'string':
            return csl_decode_string(data, offset, config)
        case 'bytes':
            return csl_decode_bytes(data, offset, config)
        case 'boolean':
            return csl_decode_boolean(data, offset, config)
        case 'bitmask':
            return csl_decode_bitmask(data, offset, config, types)
        case 'object': 
            return csl_decode_object(data, offset, config, types)
        case 'array':
            return csl_decode_array(data, offset, config, types)
        default:
            const type = types[config.type]
            if(type)
                return csl_decode(data, offset, type, types)
            else
                throw new Error(`Decoding failed: type ${config.type} not supported`, {
                    cause: {
                        config
                    }
                })
    }
}

export function csl_encode(value, config, types) {
    switch(config.type) {
        case 'number':
            return csl_encode_number(value, config)
        case 'string':
            return csl_encode_string(value, config)
        case 'bytes':
            if(value instanceof Uint8Array || value instanceof Array)
                return new Uint8Array(value)
            else
                throw new Error('Encoding failed: value not instanceof Uint8Array or Array', {
                    cause: {
                        value
                    }
                })
        case 'boolean':
            return csl_encode_boolean(value, config)
        case 'bitmask':
            return csl_encode_bitmask(value, config, types)
        case 'object':
            return csl_encode_object(value, config, types)
        case 'array':
            return csl_encode_array(value, config, types)
        default:
            const type = types[config.type]
            if(type)
                return csl_encode(value, type, types)
            else
                throw new Error(`Encoding failed: type ${config.type} not supported`, {
                    cause: {
                        config
                    }
                })
    }
}

export function csl_util_parse_hex_string(str) {
    const res = [];
    let i = 0;
    if(str.substring(0,2) === "0x")
        i = 2;
    while(i < str.length) {
        let n = parseInt(str.charAt(i++),16);
        if(!isNaN(n)) {
            if(i < str.length) {
                let n1 = parseInt(str.charAt(i++),16);
                if(!isNaN(n1))
                    n = n * 16 + n1;
            }
            res.push(n)
        }
    }
    return res;
}

export function csl_util_build_hex_string(arr, glue) {
    return arr.map(n => n.toString(16).padStart(2, '0').toUpperCase()).join(glue || '')
}

export function csl_util_find_subarr(arr, offset, subarr) {
    if(!(arr instanceof Uint8Array))
        arr = new Uint8Array(arr)
    if(!(subarr instanceof Uint8Array))
        subarr = new Uint8Array(subarr)
    while(offset + subarr.length <= arr.length) {
        let subIndex = 0
        while(subIndex < subarr.length) {
            if(arr[offset + subIndex] !== subarr[subIndex])
                break
            subIndex++
        }
        if(subIndex === subarr.length)
            return offset
        offset++
    }
    return -1
}

export function keysSet(obj) {
    return Object.keys(obj).filter(key => obj[key])
}

function csl_evaluate(obj, func) {
    // console.log("evaluate:", func)
    if(typeof func === 'number')
        return func
    let parts = func.match(/((len|sum|val)\([A-Za-z_,]+\))|(0x[0-9A-F]+)|(\d+)|([+-x\\&])|(\(.+\))/g)
    while(parts.length > 1) {
        // console.log("parts:",parts)
        const partsWithIndex = parts.map((part, index) => ({ part, index }))
        const operators = partsWithIndex.filter(item => /^(\+|-|&|x)$/.test(item.part))
        // console.log("operators:", operators)
        if(operators.length === 0)
            throw new Error("invalid expression: no operator")
        const operatorPriorities = ["&", "x", "+", "-"]
        operators.sort((a, b) => operatorPriorities.indexOf(a.part) - operatorPriorities.indexOf(b.part))
        const operator = operators[0]
        if(operator.index === 0 && operator.part !== '-')
            throw new Error(`invalid operator: ${operator.part} at beginning`)
        else if(operator.index === parts.length - 1)
            throw new Error(`invalid operator: ${operator.part} at end`)
        let calculatedPart
        switch(operator.part) {
            case "&":
                calculatedPart = csl_evaluate(obj,parts[operator.index - 1]) & csl_evaluate(obj,parts[operator.index + 1])
                break
            case "+":
                calculatedPart = csl_evaluate(obj,parts[operator.index - 1]) + csl_evaluate(obj,parts[operator.index + 1])
                break
            case "-":
                calculatedPart = (operator.index > 0 ? csl_evaluate(obj,parts[operator.index - 1]) : 0) - csl_evaluate(obj,parts[operator.index + 1])
                break
            case "x":
                calculatedPart = csl_evaluate(obj,parts[operator.index - 1]) * csl_evaluate(obj,parts[operator.index + 1])
                break
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
    const valMatch = part.match(/^val\(([A-Za-z_,]+)\)$/)
    if(valMatch)
        return obj[valMatch[1]]
    const hexMatch = part.match(/^0x([0-9A-Fa-f]+)$/)
    if(hexMatch)
        return parseInt(hexMatch[0], 16)
    const decMatch = part.match(/(\d+)/)
    if(decMatch)
        return parseInt(decMatch[0], 10)
    const bracketMatch = part.match(/^\((.+)\)$/)
    if(bracketMatch)
        return csl_evaluate(obj, bracketMatch[1])
    throw new Error(`invalid operand: ${part}`)
}

export function csl_load_types(typesArray) {
    return typesArray.reduce((acc, type) => ({ ...acc, [type.name]: type }), {})
}