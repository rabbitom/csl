# CSLUtility

## 说明
* 所有方法中，参数buffer, offset, length表示字节数组，起始偏移和长度；其中length可以省略或传-1，处理从offset开始的剩余部分，offset也可以省略，默认从0开始。
* 不做参数检查，由调用者负责传递合理的参数。

## 静态方法

### toIntLE - 将字节数组转换为整数，低字节在前
* 参数：buffer, offset, length
* 返回：int（具体语言实现中默认的int类型）
* 测试：
    ```
    toIntLE([1,2,3], 0, 3) == 0x030201
    toIntLE([1,2,3], 0, 2) == 0x0201
    toIntLE([1,2,3], 1, 2) == 0x0302
    ```

### writeIntLE - 将整数写入字节数组，低字节在前
* 参数：value, buffer, offset, length
* 返回：无
* 测试：
    ```
    array = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    writeIntLE(200, array, 2, 1)
    array == [0xFF, 0xFF, 200, 0xFF, 0xFF]

    array = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    writeIntLE(200, array, 2, 2)
    array == [0xFF, 0xFF, 200, 0, 0xFF]

    array = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    writeIntLE(2000, array, 2, 2)
    array == [0xFF, 0xFF, 0xD0, 7, 0xFF]
    ```

### toIntBE - 将字节数组转换为整数，高字节在前
* 参数：buffer, offset, length
* 返回：int（具体语言实现中默认的int类型）
* 测试：
    ```
    toIntBE([1,2,3], 0, 3) == 0x010203
    toIntBE([1,2,3], 0, 2) == 0x0102
    toIntBE([1,2,3], 1, 2) == 0x0203
    ```

### writeIntBE - 将整数写入字节数组，高字节在前
* 参数：value, buffer, offset, length
* 返回：无
* 测试：
    ```
    array = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    writeIntBE(200, array, 2, 1)
    array == [0xFF, 0xFF, 200, 0xFF, 0xFF]

    array = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    writeIntBE(200, array, 2, 2)
    array == [0xFF, 0xFF, 0, 200, 0xFF]

    array = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    writeIntBE(2000, array, 2, 2)
    array == [0xFF, 0xFF, 7, 0xD0, 0xFF]
    ```

### toHexString - 构造十六进制字符串
* 参数：buffer, offset, length, glue - 字符之间的连接符
* 返回：字符串
* 测试：
    ```
    toHexString([1,10,255], 0, 3, "") == "010AFF"
    toHexString([1,10,255], 0, 3, "-") == "01-0A-FF"
    toHexString([1,10,255], 0, 2, "-") == "01-0A"
    toHexString([1,10,255], 1, 2, "-") == "0A-FF"
    ```

### fromHexString - 解析十六进制字符串
* 参数：字符串
* 返回：字节数组
* 测试：
    ```
    fromHexString("120AFF") == [0x12, 0x0A, 0xFF]
    fromHexString("120aff") == [0x12, 0x0A, 0xFF]
    fromHexString("F") == [0x0F]
    fromHexString("12-0-AF") == [0x12, 0x00, 0xAF]
    ```