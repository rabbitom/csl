# 示例

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