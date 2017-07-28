# 通用序列化库 Common Serialization Library

有时应用需要以字节数组的形式与外界交换数据，在代码中就要实现字节数组与内部对象的转换，这个库可以帮助程序员处理这类任务。

## 使用方法
1. 写JSON文档定义数组的结构；
1. 设计与JSON文档相对应的数据类；
1. 加载JSON文档并实例化解析器；
1. 调用解析器的编码方法，将对象转换成字节数组；或调用解码方法，将字节数组转换成对象。

## 支持的编程语言
* C#
* [Java](https://github.com/rabbitom/csl-java)
* Objective-C
* [JavaScript](https://github.com/rabbitom/csl-js)
* Python

## 接口规格：

### 命名空间或包名
net.erabbit.csl

### 类
* [CSLUtility](utility.md)：公共的工具类
* [CSLMessage](message.md)：消息处理，实现JSON文档与字节数组的转换
* CSLBitMap：位映射，将需要按位（bit）处理的内容映射成字节（byte）数组
* CSLFrame：定义帧格式，用于在流式信道（如串口或TCP连接）中定帧
