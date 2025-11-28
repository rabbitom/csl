// 字段的定义
type CSLFieldType = {
    // 通用
    name?: string;  // 字段名称
    value?: any;  // 字段默认值
    type: "string" | "number"; // 字段值的类型
    offset?: number; // 字节偏移量
    length?: number; // 字节长度
    // number类型专用
    format?: "uint8" | "int8" | "uint16" | "int16" | "uint32" | "int32" | "float32" | "bcd"; // number类型的格式
    endian?: "le" | "be"; // 字节序
    // string类型专用
    encoding?: "utf8" | "hex"; // string类型的编码
}

// 字段编解码的实现
interface CSLField {
    name?: string;  // 字段名称
    value?: any;  // 字段默认值
    type: "string" | "number"; // 字段值的类型
    offset?: number; // 字节偏移量
    length?: number; // 字节长度
    encode(value: any, array: Uint8Array) : void; // 将字段值编码为字节数组
    decode(bytes: Uint8Array) : any; // 将字节数组解码为字段值
}

interface CSLString extends CSLField {
    encoding: "utf8" | "hex"; // string类型的编码
}

interface CSLNumber extends CSLField {
    format: "uint8" | "int8" | "uint16" | "int16" | "uint32" | "int32" | "float32" | "bcd"; // number类型的格式
    endian: "le" | "be"; // 字节序
}

class CSLStringUtf8 implements CSLString {
    name?: string;
    value?: string;
    type: "string";
    encoding: "utf8";
    offset: number;
    length?: number;
    constructor({name, value, offset, length}: CSLFieldType) {
        this.name = name;
        this.value = value;
        this.type = "string";
        this.encoding = "utf8";
        this.offset = offset === undefined ? 0 : offset;
        this.length = length;
    }

    // 编码字符串到指定的字节数组中，根据offset确定写入位置，根据length裁剪或填充
    encode(value: any, array: Uint8Array) : void {
        if(value === undefined) {
            if(this.value === undefined)
                throw Error("CSLStringUTF8 - encodeInArray: value is undefined");
            value = this.value;
        }
        if(this.length === undefined)
            throw Error("CSLStringUTF8 - encodeInArray: length is undefined");
        const bytes = new TextEncoder().encode(value)
        if(this.length <= bytes.length)
            array.set(bytes.slice(0, this.length), this.offset);
        else {
            array.set(bytes, this.offset);
            array.fill(0, this.offset + bytes.length, this.offset + this.length);
        }
    }

    decode(bytes: Uint8Array): string {
        const array = this.length === undefined ? bytes.slice(this.offset) : bytes.slice(this.offset, this.offset + this.length);
        let length = array.length;
        while(length > 0 && array[length - 1] === 0)
            length--;
        return new TextDecoder().decode(array.slice(0, length));
    }
}