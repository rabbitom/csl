# Config Properties

config规定了编码和解码的具体方法，可以是一个字段或一个类型，当作为types数组的元素时就是类型。

公共属性：
- type: string - 必选，解码后的数据类型，可以是内置类型或自定义类型
- name: string - 字段名或类型名
- byteLength: number - 字段的字节长度，如果值可以通过type推断的话可省略
- values: { value: any, name: string }[] - 字段取值列表，值只能是其中一个，可实现为枚举
- types: string[] | config[] - 字段类型列表
- optional: 当前字段可忽略，否则编码时如果没有相应字段值会报错

以下属性用于值固定的字段，编码时直接使用，解码时与提供的字节数组或数据值对比：
- bytes: number[] - 字节数组，编码的结果
- value: any - 数据值，解码的结果

以下属性用于需要引入外部函数的字段：
- valueFunc: 函数名 - 常用于长度字段和校验字段，编码时调用相应函数动态计算字段值
- lengthFunc: 函数名 - 用于可变长度的字段，解码时调用相应函数动态计算字段长度

常见字段组合模式：
- 数据长度+数据：一个长度字段，后面根指定长度的数据
- 数组长度+数组：一个长度字段，后面跟数组内容，数组内容的长度是数组长度乘元素长度
- 数据+校验和：一段数据后跟一个校验和字段，校验和的值根据数据内容按指定算法计算

以下根据type的值定义具体的属性含义

## number

- numberType: bcd | uint8 | int8 | uint16be | uint16le | int16be | int16le | uint32be | uint32le | int32be | int32le | float32be | float32le - 根据numberType自动确定byteLength

## string

- byteLength - 必选，字节长度，编码后如果长度不足byteLength，自动填充0x00；如果长度超过byteLength则报错
- encoding - 编码格式
    - hex - 解码时将 [0x31, 0x32] 转换成字符串 "3132"
    - base64 - 解码时将字节数组转换成base64字符串
    - default(ascii/utf8) - 解码时将 [0x31, 0x32] 转换成字符串 "12"

## bytes

直接提取字节数组，数组长度通过byteLength指定，或通过lengthFunc计算，或自动推断（剩余字节数）。

## boolean

- byteLength: 忽略，固定为1

以下属性要么全部设置，要么全部不设置：
- trueValue: number - 此值表示true
- falseValue: number  - 此值表示false
- defaultValue: boolean - trueValue或falseValue以外的值表示为true或false

默认：0解码为false，非0值解码为true；true编码为1，false编码为0
- trueValue: 1
- falseValue: 0
- defaultValue: true

## object

- attributes: config[] - 对象各属性的config

## bitmask

实际类型为object。

- byteLength: 必选
- endian: little | big - 字节序，byteLength大于1时必选
- attributes: {mask: number, shift: number, ...}[] - 指定各字段的掩码和偏移，解码时先将二进制值与mask做and，再用shift向右移，然后再继续处理。其中shift可忽略，根据mask的值自动确定。

## index

此字段必须位于object的attribute当中，其type根据object中其他字段的值确定。

- indexName: string - 指定同一层级其他字段的名称，根据其值在types数组中查找对应的字段定义
- types: {indexValue: any, ...config}[] - 根据indexValue的值与indexName指定字段的值进行匹配

## array

- item: config - 数组元素的config
