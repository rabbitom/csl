## 类名
CSLUtility

## 静态方法
* toIntLE(buffer, offset, length) - 返回整数
* toIntBE(buffer, offset, length) - 返回整数
* toHexString(buffer, offset, length, glue) - 返回字符串，glue为字符之间的连接符
* fromHexString(string) - 返回字节数组

## 说明
* 以上方法中，如果buffer本身可以确定长度，则offset、length应当允许省略，处理整个数组
* 不作参数检查和抛出异常，由调用者负责传递合理的参数

## 测试用例
```
toIntLE([1,2,3], 0, 3) = 0x030201
toIntBE([1,2,3], 0, 3) = 0x010203
toHexString([1,10,255], 0, 3, "-") = "01-0A-FF"
fromHexString("120AFF") = [0x12, 0x0A, 0xFF]
fromHexString("120AF") = [0x12, 0x0A, 0x0F]
fromHexString("12-0-AF") = [0x12, 0x00, 0xAF]
```