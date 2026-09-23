# config properties

必选属性：
- type - 数据类型

可选属性：
- name - 属性名

以下根据type的值定义具体的必选和可选属性

## number

必选属性:
- numberType: uint8 | uint16be | uint16le | int16be | int16le | uint32be | uint32le | int32be | int32le | float32le - 根据numberType自动确定byteLength

可选属性:
- scale - 缩放因子，解码时乘，编码时除
- offset - 偏移值，解码时加，编码时减
- decimals - 小数位数

TODO: 
- 删除对这些可选属性的支持，由应用代码处理
- 增加对BCD编码的支持（加一个encoding属性，与numberType独立，支持部分numberType）

## string

必选属性:
- byteLength - 字节长度，编码后如果长度不足byteLength，自动填充0x00；如果长度超过byteLength，则自动截断

TODO: 不自动截断，报错处理

可选属性:
- stringEncoding
    - hex - 将 [0x31, 0x32] 编码成字符串 "3132"
    - default(ascii/utf8) - 将 [0x31, 0x32] 编码成字符串 "12"

## bytes

直接提取字节数组

必选属性:
- byteLength

## boolean

说明:
- byteLength固定为1
- 0: false, other: true

## object

必选属性:
- attributes - 数组，对象各属性的config

可选属性:
- byteLength
- objectType: bitmask - 以位掩码方式定义各个属性
- remap: 将解码后的对象按字段名的路径映射为另一个对象

说明：
- object attribute的type为variable

TODO:
- 将bitmask转为一种独立的type，支持多字节
- 去掉remap功能，在应用代码中实现
- 将variable转为一种独立的type

## array

必选属性:
- byteLength
- arrayItem - 数组元素的config
