import { expect, test } from 'vitest'
import { csl_decode, csl_encode, csl_util_parse_hex_string, csl_util_find_subarr } from './csl.js'

test('decode/encode number', () => {
    const cases = [
        ['bcd', [0x28], 28],
        ['uint8', [0xFF], 0xFF],
        ['int8', [0xFF], -1],
        ['uint16be', [0x01,0x00], 0x0100],
        ['uint16le', [0x01,0x00], 0x0001],
        ['int16be', [0xFF,0xFE], -2],
        ['int16le', [0xFE,0xFF], -2],
        ['uint32be', [0x01,0x02,0x03,0x04], 0x01020304],
        ['uint32le', [0x01,0x02,0x03,0x04], 0x04030201],
        ['int32be', [0xFF,0xFF,0xFF,0xFE], -2],
        ['int32le', [0xFE,0xFF,0xFF,0xFF], -2],
        ['float32be', [0x40, 0xD0, 0x00, 0x00], 6.5],
        ['float32le', [0x00, 0x00, 0xD0, 0x40], 6.5]
    ]
    // decode
    cases.forEach(([numberType, arr, n]) => {
        const decodeResult = {}
        const res = csl_decode(arr,0,{type:'number', numberType},decodeResult)
        expect(res).toBe(n)
        expect(decodeResult.length).toBe(arr.length)
    })
    // encode
    cases.forEach(([numberType, arr, n]) => {
        const res = csl_encode(n, {type:'number', numberType})
        expect(Array.from(res), numberType).toStrictEqual(arr)
    })
})

test('encode/decode ascii string', () => {
    const str = '123'
    const arr = [0x31, 0x32, 0x33, 0]
    const config = {
        type: 'string',
        byteLength: 4
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toEqual(str)
    expect(decodeResult.length).toBe(config.byteLength)
    expect(csl_encode(str, config)).toStrictEqual(arr)
})

test('parse hex string', () => {
    const cases = [
        ['00:01:02', [0,1,2]],
        ['FF', [0xFF]]
    ]
    cases.forEach(([str,arr]) => {
        expect(csl_util_parse_hex_string(str)).toStrictEqual(arr)
    })
})

test('encode/decode hex string', () => {
    const str = 'FF:12'
    const arr = [0xFF, 0x12]
    const config = {
        type: 'string',
        encoding: 'hex',
        glue: ':',
        byteLength: 2
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toEqual(str)
    expect(decodeResult.length).toBe(config.byteLength)
    expect(csl_encode(str, config)).toStrictEqual(arr)
})

test('encode/decode UTF-8 string', () => {
    const str = 'ab你好1234'
    const arr = [0x61, 0x62, 0xE4, 0xBD, 0xA0, 0xE5, 0xA5, 0xBD, 0x31, 0x32, 0x33, 0x34]
    const config = {
        type: 'string',
        byteLength: 12
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toEqual(str)
    expect(decodeResult.length).toBe(config.byteLength)
    expect(csl_encode(str, config)).toStrictEqual(arr)
})

test('encode/decode bytes', () => {
    const arr = [1,2,3]
    const config = {
        type: 'bytes',
        byteLength: 3
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toStrictEqual(new Uint8Array(arr))
    expect(decodeResult.length).toBe(config.byteLength)
    expect(csl_encode(arr, config)).toStrictEqual(new Uint8Array(arr))
})

test('encode/decode boolean with default config', () => {
    const config = {
        type: 'boolean'
    }
    const decodeResult = {}
    expect(csl_decode([1], 0, config, decodeResult)).toBe(true)
    expect(decodeResult.length).toBe(1)
    expect(csl_decode([2], 0, config, decodeResult)).toBe(true)
    expect(decodeResult.length).toBe(1)
    expect(csl_decode([0], 0, config, decodeResult)).toBe(false)
    expect(decodeResult.length).toBe(1)
    expect(csl_encode(true, config)).toStrictEqual(new Uint8Array([1]))
    expect(csl_encode(false, config)).toStrictEqual(new Uint8Array([0]))
})

test('encode/decode boolean with custom config', () => {
    const config = {
        type: 'boolean',
        trueValue: 0,
        falseValue: 1,
        defaultValue: false
    }
    const decodeResult = {}
    expect(csl_decode([1], 0, config, decodeResult)).toBe(false)
    expect(decodeResult.length).toBe(1)
    expect(csl_decode([2], 0, config, decodeResult)).toBe(false)
    expect(decodeResult.length).toBe(1)
    expect(csl_decode([0], 0, config, decodeResult)).toBe(true)
    expect(decodeResult.length).toBe(1)
    expect(csl_encode(true, config)).toStrictEqual(new Uint8Array([0]))
    expect(csl_encode(false, config)).toStrictEqual(new Uint8Array([1]))
})

test('encode/decode bitmask with 1 byte', () => {
    const arr = [0x21]
    const obj = {
        a: true,
        b: false,
        c: 2
    }
    const config = {
        type: 'bitmask',
        byteLength: 1,
        attributes: [
            {
                name: "a",
                type: "boolean",
                mask: 1
            },
            {
                name: "b",
                type: "boolean",
                mask: 2
            },
            {
                name: "c",
                type: "number",
                numberType: "uint8",
                mask: 0xF0
            }
        ]
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toStrictEqual(obj)
    expect(decodeResult.length).toBe(1)
    expect(csl_encode(obj, config)).toStrictEqual(new Uint8Array(arr))
})

test('encode/decode bitmask with 2 bytes', () => {
    const arr = [0x21, 0x03]
    const obj = {
        a: true,
        b: false,
        c: 2,
        d: 3
    }
    const config = {
        type: 'bitmask',
        byteLength: 2,
        endian: 'little',
        attributes: [
            {
                name: "a",
                type: "boolean",
                mask: 0x01,
                shift: 0,
            },
            {
                name: "b",
                type: "boolean",
                mask: 0x02,
                shift: 1,
            },
            {
                name: "c",
                type: "number",
                numberType: "uint8",
                mask: 0xF0,
                shift: 4,
            },
            {
                name: "d",
                type: "number",
                numberType: "uint8",
                mask: 0x300,
                shift: 8,
            }
        ]
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toStrictEqual(obj)
    expect(decodeResult.length).toBe(2)
    expect(csl_encode(obj, config)).toStrictEqual(new Uint8Array(arr))
})

test('encode/decode object', () => {
    const arr = [1, 0x30, 0x31, 0x32]
    const obj = {
        n: 1,
        s: "012"
    }
    const config = {
        "type":"object",
        "attributes":[
            {"name":"n","type":"number","numberType":"uint8"},
            {"name":"s","type":"string","byteLength":3}
        ]
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toStrictEqual(obj)
    expect(decodeResult.length).eql(arr.length)
    expect(csl_encode(obj, config)).toStrictEqual(new Uint8Array(arr))
})

test('encode/decode variable type in object', () => {
    const config = {
        type: "object",
        attributes: [
            {
                name: "category",
                type: "number",
                numberType: "uint8",
                values: [
                    {
                        name: "book",
                        value: 1
                    },
                    {
                        name: "movie",
                        value: 2
                    }
                ]
            },
            {
                name: "info",
                type: "variable",
                typeIndex: "category",
                types: [
                    {
                        index: 1,
                        type: "object",
                        attributes: [
                            {
                                name: "pages",
                                type: "number",
                                numberType: "uint8"
                            }
                        ]
                    },
                    {
                        index: 2,
                        type: "object",
                        attributes: [
                            {
                                name: "minutes",
                                type: "number",
                                numberType: "uint8"
                            }
                        ]
                    }
                ]
            }
        ]
    }
    const arr = [1,180]
    const obj = {
        category: 1,
        info: {
            pages: 180
        }
    }
    const decodeResult = {}
    expect(csl_decode(arr, 0, config, decodeResult)).toStrictEqual(obj)
    expect(decodeResult.length).toBe(arr.length)
    expect(csl_encode(obj, config)).toStrictEqual(new Uint8Array(arr))
})

test('encode/decode array', () => {
    const data = new Uint8Array([1,2,3])
    const arr = [1,2,3]
    const config = {
        "type":"array",
        "byteLength":3,
        "item":{
            "type":"number",
            "numberType":"uint8"
        }
    }
    const decodeResult = {}
    expect(csl_decode(data, 0, config, decodeResult)).toStrictEqual(arr)
    expect(decodeResult.length).eql(data.length)
    expect(csl_encode(arr, config)).toStrictEqual(data)
})

test('encode int16be array', () => {
    const data = new Uint8Array([0, 1, 0, 2, 0, 3])
    const arr = [1,2,3]
    const config = {
        "type":"array",
        "byteLength":6,
        "item":{
            "type":"number",
            "numberType":"int16be"
        }
    }
    expect(csl_encode(arr, config)).toStrictEqual(data)
})

test('find subarr', () => {
    const arr = [0xF4, 0x80, 0xF4, 0x66, 0x30, 0xD3, 0x75, 0x04, 0xFA, 0xFA, 0xF4, 0x80, 0xF4, 0x00, 0x00, 0x00, 0x00]
    const subarr = [0xF4, 0x80, 0xF4]
    expect(csl_util_find_subarr(arr, 0, subarr)).toBe(0)
    expect(csl_util_find_subarr(arr, 3, subarr)).toBe(10)
    expect(csl_util_find_subarr(arr, 13, subarr)).toBe(-1)
})