# 通用序列化库 Common Serialization Library

有时应用需要以字节数组的形式与外界交换数据，在代码中就要实现字节数组与内部对象的转换，这个库可以帮助程序员处理这类任务。

## 文件目录

- legacy: 2017-2018年设计的旧版本的存档
- js: JavaScript版本
- ts: TypeScript版本
- cs: C#版本
- oc: Objective-C版本

## 使用方法

* 定义数据结构
* 初始化解析器
* 编码和解码
    * 编码：将数据对象转换成字节数组
    * 解码：将字节数组转换成数据对象

## 示例

```typescript
// 定义数据结构
CSLFieldType field = {
    name: "advertisingName",
    type: "string",
    encoding: "utf-8",
    offset: 0,
    length: 14
}
// 初始化解析器
CSLField stringField = new CSLStringUtf8(field);
// 编码
Uint8Array array = new Uint8Array(20);
stringField.encode("Hello World", array);
// 解码
const string = stringField.decode(array);
```
