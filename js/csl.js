function checkLength(data, offset, byteLength, decodeResult) {
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
    if(decodeResult)
        decodeResult.length = byteLength
}

function csl_decode_bcd(data, offset, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    const x = data[offset]
    const l = x % 0x10;
    const h = (x - l) / 0x10;
    if((h <= 9) && (l <= 9))
        return h * 10 + l;
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

function csl_decode_uint8(data, offset, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    return data[offset]
}

function csl_decode_int8(data, offset, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    const n = data[offset]
    if(n >= 0 && n <= 127)
        return n
    else if(n >= 128 && n <= 255)
        return n - 256
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

function csl_decode_uint16(data, offset, littleEndian, decodeResult) {
    checkLength(data, offset, 2, decodeResult)
    const dv = new DataView(data.buffer)
    return dv.getUint16(offset, littleEndian)
}

function csl_decode_int16(data, offset, littleEndian, decodeResult) {
    checkLength(data, offset, 2, decodeResult)
    const dv = new DataView(data.buffer)
    return dv.getInt16(offset, littleEndian)
}

function csl_decode_uint32(data, offset, littleEndian, decodeResult) {
    checkLength(data, offset, 4, decodeResult)
    const dv = new DataView(data.buffer)
    return dv.getUint32(offset, littleEndian)
}

function csl_decode_int32(data, offset, littleEndian, decodeResult) {
    checkLength(data, offset, 4, decodeResult)
    const dv = new DataView(data.buffer)
    return dv.getInt32(offset, littleEndian)
}

function csl_decode_float32(data, offset, littleEndian, decodeResult) {
    checkLength(data, offset, 4, decodeResult)
    const dv = new DataView(data.buffer)
    return dv.getFloat32(offset, littleEndian)
}

function csl_decode_number(data, offset, config, decodeResult) {
    let n
    switch(config.numberType) {
        case 'bcd':
            n = csl_decode_bcd(data, offset, decodeResult)
            break
        case 'uint8':
            n = csl_decode_uint8(data, offset, decodeResult)
            break
        case 'int8':
            n = csl_decode_int8(data, offset, decodeResult)
            break
        case 'uint16be':
            n = csl_decode_uint16(data, offset, false, decodeResult)
            break
        case 'uint16le':
            n = csl_decode_uint16(data, offset, true, decodeResult)
            break
        case 'int16be':
            n = csl_decode_int16(data, offset, false, decodeResult)
            break
        case 'int16le':
            n = csl_decode_int16(data, offset, true, decodeResult)
            break
        case 'uint32be':
            n = csl_decode_uint32(data, offset, false, decodeResult)
            break
        case 'uint32le':
            n = csl_decode_uint32(data, offset, true, decodeResult)
            break
        case 'int32be':
            n = csl_decode_int32(data, offset, false, decodeResult)
            break
        case 'int32le':
            n = csl_decode_int32(data, offset, true, decodeResult)
            break
        case 'float32be':
            n = csl_decode_float32(data, offset, false, decodeResult)
            break
        case 'float32le':
            n = csl_decode_float32(data, offset, true, decodeResult)
            break
        default:
            throw new Error('Decoding failed: number type not supported', {
                cause: {
                    config
                }
            })
    }
    return n
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

function csl_decode_string(data, offset, config, decodeResult) {
    if(typeof config.byteLength !== 'number')
        throw new Error("Decoding failed: byteLength of string not set", {
            cause: config
        })
    checkLength(data, offset, config.byteLength, decodeResult)
    if(config.encoding === 'hex')
        return csl_util_build_hex_string(Array.from(data.slice(offset, offset + config.byteLength)), config.glue)
    else {
        let stringLength = config.byteLength
        while(stringLength > 0 && data[offset+stringLength-1] === 0)
            stringLength--
        const textDecoder = new TextDecoder()
        return textDecoder.decode(data.slice(offset, offset + stringLength))
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

function csl_decode_bytes(data, offset, config, decodeResult) {
    let { byteLength } = config
    if(typeof byteLength === 'number')
        checkLength(data, offset, byteLength, decodeResult)
    else if(data.length > offset) {
        byteLength = data.length - offset
        decodeResult.length = byteLength
    }
    else
        return null
    return data.slice(offset, offset + byteLength)
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

function csl_decode_boolean(data, offset, config, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    const { trueValue, falseValue, defaultValue } = check_boolean_config(config)
    if(data[offset] === trueValue)
        return true
    else if(data[offset] === falseValue)
        return false
    else
        return defaultValue
}

function csl_encode_boolean(value, config) {
    const { trueValue, falseValue } = check_boolean_config(config)
    return new Uint8Array([value ? trueValue : falseValue])
}

function csl_decode_bitmask(data, offset, config, decodeResult) {
    const { byteLength, endian, attributes } = config
    checkLength(data, offset, byteLength, decodeResult)
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
                shift++;
        }
        const attrByte = (x & mask) >> shift;
        res[name] = csl_decode([attrByte], 0, attribute)
    })
    return res
}

function csl_encode_bitmask(value, config) {
    let b = 0
    const { attributes, byteLength, endian } = config
    attributes.forEach(attribute => {
        const { mask, name } = attribute
        const attrData = csl_encode(value[name], attribute)
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

function csl_get_variable_type(value, config) {
    const typeIndex = value[config.typeIndex]
    if(typeIndex !== undefined) {
        const { types } = config
        const type = types.find(t => t.index === typeIndex)
        if(type === undefined)
            throw new Error("csl get variable type failed: variable type not found")
        return type
    }
    else
        throw new Error("csl get variable type failed: type could not be determined")
}

function csl_decode_variable(value, data, offset, config, decodeResult) { 
    const type = csl_get_variable_type(value, config)
    return csl_decode(data, offset, type, decodeResult)
}

function csl_encode_variable(value, config) {
    const type = csl_get_variable_type(value, config)
    return csl_encode(value, type)
}

function csl_decode_object(data, offset, config, decodeResult) {
    const { byteLength, attributes } = config
    if(typeof byteLength === 'number')
        checkLength(data, offset, byteLength)
    const res = {}
    let totalLength = 0
    for(let attribute of attributes) {
        const { name, type } = attribute
        const attributeDecodeResult = {}
        if(type === "variable")
            res[name] = csl_decode_variable(res, data, offset + totalLength, attribute, attributeDecodeResult)
        else
            res[name] = csl_decode(data, offset + totalLength, attribute, attributeDecodeResult)
        totalLength += attributeDecodeResult.length
        if(offset + totalLength === data.length)
            break
    }
    decodeResult.length = totalLength
    return res
}

function csl_encode_object(value, config) {
    const { attributes } = config
    let data = []
    for(let attribute of attributes) {
        let attributeValue = attribute.value
        if(attributeValue === undefined) {
            attributeValue = value[attribute.name]
            if(attributeValue === undefined) {
                if(attribute.optional)
                    continue
                else
                    throw new Error("Encoding failed: value not found", {
                        value,
                        attribute
                    })
            }
        }
        if(attribute.type === 'variable')
            attribute = csl_get_variable_type(value, attribute)
        const attributeData = csl_encode(attributeValue, attribute)
        data = data.concat(Array.from(attributeData))
    }
    return new Uint8Array(data)
}

function csl_decode_array(data, offset, config, decodeResult) {
    const { byteLength, item } = config
    if(typeof byteLength !== 'number')
        throw new Error("Decoding failed: byteLength of array not set", {
            cause: config
        })
    checkLength(data, offset, byteLength)
    let totalLength = 0
    const res = []
    while(totalLength < byteLength) {
        const itemDecodeResult = {}
        const itemValue = csl_decode(data, offset + totalLength, item, itemDecodeResult)
        res.push(itemValue)
        totalLength += itemDecodeResult.length
    }
    decodeResult.length = totalLength
    return res
}

function csl_encode_array(value, config) {
    const { item } = config
    let data = []
    for(const itemValue of value) {
        const itemData = csl_encode(itemValue, item)
        data = data.concat(Array.from(itemData))
    }
    return new Uint8Array(data)
}

export function csl_decode(data, offset, config, decodeResult) {
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
            return csl_decode_number(data, offset, config, decodeResult)
        case 'string':
            return csl_decode_string(data, offset, config, decodeResult)
        case 'bytes':
            return csl_decode_bytes(data, offset, config, decodeResult)
        case 'boolean':
            return csl_decode_boolean(data, offset, config, decodeResult)
        case 'bitmask':
            return csl_decode_bitmask(data, offset, config, decodeResult)
        case 'object': 
            return csl_decode_object(data, offset, config, decodeResult)
        case 'array':
            return csl_decode_array(data, offset, config, decodeResult)
        default:
            throw new Error('Decoding failed: type not supported (' + config.type + ')', {
                cause: {
                    config
                }
            })
    }
}

export function csl_encode(value, config) {
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
            return csl_encode_bitmask(value, config)
        case 'object':
            return csl_encode_object(value, config)
        case 'array':
            return csl_encode_array(value, config)
        case 'variable':
            return csl_encode_variable(value, config)
        default:
            throw new Error('Encoding failed: type not supported', {
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