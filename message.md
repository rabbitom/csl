# CSL消息处理类

## JSON文档的规格
数据皆以字段表示，字段由以下几个属性定义：
* id：字符串 - 本字段的唯一标识，在同一文档内不能重复
* name: 字符串 - 本字段的名称，映射为属性名称
* length：整数 - 本字段的长度
* type：字符串 - 字段的类型
  * fixed - 固定内容
  * variable - 可变内容
  * array - 数组，同格式字段的多个值
  * combination - 组合，由多个字段连接而成
  * index - 索引类型，根据取值转换为其他字段解析
* format：字符串 - 字段的二进制编码格式
  * int - 整数，单字节或使用全局默认字节序
  * int.le - 整数，低字节在前
  * int.be - 整数，高字节在前
  * bcd - 用BCD编码表示的整数
  * string - 字符串，默认采用UTF-8编码解析
* value：数组 - 其内容由type决定
  * type = fxied，内容为字节数组的值
  * type = variable, 内容为空，可以省略
  * type = array，内容为数组元素的字段定义
  * type = combination，内容为各字子段的定义
  * type = index，内容为各种情况下的取值和对应的字段ID

## 类名
CSLMessage

## 构造函数
* CSLMessage(json)

## 实例方法
* encode(object, fieldId) - 将对象转换成字节数组，fieldId可省略，默认采用模板中的第一个字段
* decode(buffer, offset, length, fieldId) - 将字节数组转换成对象

## 说明
* 以上方法中，如果buffer本身可以确定长度，则offset、length应当允许省略，处理整个数组
* 不作参数检查和抛出异常，由调用者负责传递合理的参数
