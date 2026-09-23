# 通用序列化库 Common Serialization Library

有时应用需要以字节数组的形式与外界交换数据，在代码中就要实现字节数组与内部数据的转换，这个库可以帮助程序员处理这类任务。

## 文件目录

- js: JavaScript版本
- ts: TypeScript版本
- oc: Objective-C版本
- java: Java版本
- legacy: 2017-2018年设计的旧版本的存档

以JavaScript版本作为基准。

## 使用方法

* 定义数据结构 config: JSON对象，写在代码中或从文件导入、从接口获取，属性定义见[SPEC](./SPEC.md)
* 编码 encode: 将数据转换成字节数组
* 解码 decode: 将字节数组转换成数据

## TODO

- 完善SPEC.md与JavaScript版本
- 在JavaScript版本上编写测试、示例（加载config对象，编码，解码）
- config编辑器gui，可保存、加载config文件，带编解码功能，调用JavaScript版本实现
- 增加其他语言版本：scala（函数式）、c#
- 完善各语言版本的测试和示例