function checkLength(data, offset, byteLength, decodeResult) {
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

function csl_decode_uint8(data, offset, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    return data[offset]
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
        case 'uint8':
            n = csl_decode_uint8(data, offset, decodeResult)
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
    if(config.scale)
        n *= config.scale
    if(config.offset)
        n += config.offset
    if(config.decimals)
        n = parseFloat(n.toFixed(config.decimals))
    return n
}

function csl_encode_number(value, config) {
    if(config.offset)
        value -= config.offset
    if(config.scale)
        value /= config.scale
    let typedArray
    switch(config.numberType) {
        case 'uint8':
            return new Uint8Array([value])
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
        case 'float32le':
            typedArray = new Float32Array([value])
            break
        default:
            throw new Error('Encoding failed: number type not supported', {
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
    if(config.stringEncoding === 'hex')
        return Array.from(data.slice(offset, offset + config.byteLength)).map(n => (n < 16 ? '0' : '') + n.toString(16).toUpperCase()).join(config.hexByteConnector || '')
    else {
        let stringLength = config.byteLength
        while(stringLength > 0 && data[offset+stringLength-1] === 0)
            stringLength--
        const textDecoder = new TextDecoder()
        return textDecoder.decode(data.slice(offset, offset + stringLength))
    }
}

function csl_encode_string(str, length, encoding) {
    if(typeof length !== 'number')
        throw new Error('Encoding failed: byte length of string not set', {
            cause: {
                str
            }
        })
    const bytes = []
    let i=0
    if(encoding === 'hex') {
        const hexBytes = csl_parse_hex_string(str)
        const stringLength = Math.min(hexBytes.length, length)
        while(i < stringLength) {
            bytes[i] = hexBytes[i]
            i++
        }
    }
    else {
        const textEncoder = new TextEncoder()
        const strBytes = textEncoder.encode(str)
        const stringLength = Math.min(strBytes.length, length)
        while(i < stringLength) {
            bytes[i] = strBytes[i]
            i++
        }
    }
    while(i < length)
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

function csl_decode_boolean(data, offset, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    return data[offset] !== 0
}

function csl_encode_boolean(value) {
    return new Uint8Array([value ? 1 : 0])
}

function csl_decode_bitmask(data, offset, attributes, decodeResult) {
    checkLength(data, offset, 1, decodeResult)
    const res = {}
    attributes.forEach(attribute => {
        const { mask, name } = attribute
        let maskShift = 0;
        while(((1 << maskShift) & mask) == 0)
            maskShift++;
        const attrByte = (data[offset] & mask) >> maskShift;
        res[name] = csl_decode([attrByte], 0, attribute)
    })
    return res
}

function csl_encode_bitmask(value, attributes) {
    let b = 0
    attributes.forEach(attribute => {
        const { mask, name } = attribute
        const attrData = csl_encode(value[name], attribute)
        const attrValue = attrData[0]
        let maskShift = 0;
        while(((1 << maskShift) & mask) == 0)
            maskShift++;
        b |= attrValue << maskShift
    })
    return new Uint8Array([b])
}

function csl_get_variable_type(value, config) {
    const typeIndex = value[config.typeIndex]
    if(typeIndex) {
        const { types } = config
        const type = types.find(t => t.index === typeIndex)
        if(type === undefined)
            throw new Error("csl get variable type failed: variable type not found")
        return type
    }
    else
        throw new Error("csl get variable type failed: type could not be determined")
}

function csl_remap_attributes(value, map) {
    const res = {}
    map.forEach(entry => {
        if(typeof entry === 'object') {
            const { key, attributes } = entry
            const obj = {}
            attributes.forEach(attribute => {
                obj[attribute] = value[attribute]
            })
            res[key] = obj
        }
        else if(typeof entry === 'string')
            res[entry] = value[entry]
        else
            throw new Error("decoding failed: map entry should be a string or dictionary", {
                cause: {
                    map
                }
            })
    })
    return res
}

function csl_unmap_attributes(value, map) {
    const res = {}
    map.forEach(entry => {
        if(typeof entry === 'object') {
            const { key, attributes } = entry
            const obj = value[key]
            attributes.forEach(attribute => {
                res[attribute] = obj[attribute]
            })
        }
        else if(typeof entry === 'string')
            res[entry] = value[entry]
        else
            throw new Error("encoding failed: map entry should be a string or dictionary", {
                cause: {
                    map
                }
            })
    })
    return res
}

function csl_decode_object(data, offset, config, decodeResult) {
    const { byteLength, attributes } = config
    if(typeof byteLength === 'number')
        checkLength(data, offset, byteLength)
    const res = {}
    let totalLength = 0
    for(let attribute of attributes) {
        const { name, type } = attribute
        if(type === "variable")
            attribute = csl_get_variable_type(res, attribute)
        const attributeDecodeResult = {}
        res[name] = csl_decode(data, offset + totalLength, attribute, attributeDecodeResult)
        totalLength += attributeDecodeResult.length
        if(offset + totalLength === data.length)
            break
    }
    decodeResult.length = totalLength
    return res
}

function csl_encode_object(value, attributes) {
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
    const { byteLength, arrayItem } = config
    if(typeof byteLength !== 'number')
        throw new Error("Decoding failed: byteLength of array not set", {
            cause: config
        })
    checkLength(data, offset, byteLength)
    let totalLength = 0
    const res = []
    while(totalLength < byteLength) {
        const itemDecodeResult = {}
        const itemValue = csl_decode(data, offset + totalLength, arrayItem, itemDecodeResult)
        res.push(itemValue)
        totalLength += itemDecodeResult.length
    }
    decodeResult.length = totalLength
    return res
}

function csl_encode_array(value, itemConfig) {
    let data = []
    for(const itemValue of value) {
        const itemData = csl_encode(itemValue, itemConfig)
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
            return csl_decode_boolean(data, offset, decodeResult)
        case 'object': {
                let obj
                if(config.objectType === 'bitmask')
                    obj = csl_decode_bitmask(data, offset, config.attributes, decodeResult)
                else
                    obj = csl_decode_object(data, offset, config, decodeResult)
                if(config.remap)
                    return csl_remap_attributes(obj, config.remap)
                else
                    return obj
            }
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
            return csl_encode_string(value, config.byteLength, config.stringEncoding)
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
            return csl_encode_boolean(value)
        case 'object':
            if(config.remap)
                value = csl_unmap_attributes(value, config.remap)
            if(config.objectType === 'bitmask')
                return csl_encode_bitmask(value, config.attributes)
            else
                return csl_encode_object(value, config.attributes)
        case 'array':
            return csl_encode_array(value, config.arrayItem)
        default:
            throw new Error('Encoding failed: type not supported', {
                cause: {
                    config
                }
            })
    }
}

export function csl_parse_hex_string(str) {
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

export function csl_format_hex_string(arr) {
    return csl_decode(arr, 0, {
        type: "string",
        byteLength: arr.length || arr.byteLength,
        stringEncoding: "hex",
        hexByteConnector: "-"
    })
}

export function csl_find_subarr(arr, offset, subarr) {
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