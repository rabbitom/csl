# 通用序列化库 Common Serialization Library

当程序需要以自定义的格式通过字节数组与外界交换数据时，可以使用这个库定义数据结构，实现字节数组与内部数据的相互转换。

## 文件目录

- js: JavaScript版本
- ts: TypeScript版本
- oc: Objective-C版本
- java: Java版本
- legacy: 2017-2018年设计的旧版本的存档

以JavaScript版本作为基准。

## 使用方法

* 定义数据结构 config: JSON对象，写在代码中或从文件导入、从接口获取，属性定义见[SPEC](./SPEC.md)
* 创建编解码器 codec: 配置公共参数
    * globalTypes: { [name: string]: config } - 需要重用的字段
    * checksumCalc: function - 计算校验和的函数
* 调用编码函数 encode: 将数据转换成字节数组
* 调用解码函数 decode: 将字节数组转换成数据
