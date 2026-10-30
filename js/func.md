
## func.js 分析

[func.js](./func.js) 实现了一个**领域特定的文本表达式求值器**，用于 CSL 协议中的 length 和 checksum 计算。核心功能：

| 特性 | 说明 | 示例 |
|------|------|------|
| 自定义函数 | `len()` 计算数组长度, `sum()` 计算数组元素之和 | `len(command,params)` |
| 运算符 | `+` `-` `&`（按位与） | `0x100-sum(...)&0xFF` |
| 运算符优先级 | `&` > `+` > `-` | — |
| 字面量 | 十六进制 `0x...`, 十进制 | `0x100`, `0xFF` |
| 变量引用 | 从对象中取数组 | `header`, `length`, `command` |
| 括号 | 支持 | `(a+b)&0xFF` |

---

## 类似现成库推荐

### 1. expr-eval（JavaScript）
- **GitHub**: [silentmatt/expr-eval](https://github.com/silentmatt/expr-eval)
- **特点**: 轻量、支持自定义函数和变量、支持位运算
- **适配度**: 高，最容易替代 func.js

```javascript
import { Parser } from 'expr-eval';
const parser = new Parser();
parser.functions.len = (...args) => args.reduce((s, a) => s + (a?.length || 0), 0);
parser.functions.sum = (...args) => args.reduce((s, a) => s + (Array.isArray(a) ? a.reduce((x,y)=>x+y,0) : 0), 0);
const expr = parser.parse('0x100 - sum(header, length, command, params) & 0xFF');
const result = expr.evaluate({ header: [0x43], length: [0x01], command: [0x10], params: [] });
```

### 2. mathjs（JavaScript）
- **网站**: [mathjs.org](https://mathjs.org)
- **特点**: 功能最全的 JS 数学库，内置 `sum`、支持自定义函数

```javascript
import { evaluate, sum, len } from 'mathjs';
// 内置 sum, 支持自定义函数扩展
```

### 3. exp4j（Java）
- **GitHub**: [fasseg/exp4j](https://github.com/fasseg/exp4j)
- **特点**: Java 数学表达式求值，支持自定义函数和变量

```java
Expression e = new ExpressionBuilder("0x100 - mySum(h,l,c,p) & 0xFF")
    .function(new Function("mySum", 4) {
        @Override public double apply(double... args) { /* sum logic */ }
    })
    .variables("h", "l", "c", "p")
    .build()
    .setVariable("h", 0x43).setVariable("l", 0x01)...;
double result = e.evaluate();
```

### 4. EvalEx（Java）
- **GitHub**: [uklimaschewski/EvalEx](https://github.com/uklimaschewski/EvalEx)
- **特点**: BigDecimal 精度，支持自定义函数

### 5. TinyExpr / TinyExpr++（C / C++）
- **GitHub**: [codeplea/tinyexpr](https://github.com/codeplea/tinyexpr)（C）/ [codeplea/tinyexprpp](https://github.com/codeplea/tinyexprpp)（C++）
- **特点**: 极轻量（C 版仅 2 个文件），支持自定义函数和变量，zlib 许可证
- **适配度**: 非常适合嵌入式场景

```c
double my_len(double a, double b) { return a + b; } // 示例
te_variable vars[] = {{"mylen", my_len, TE_FUNCTION2}};
te_expr *expr = te_compile("0x100 - mysum(h,l,c,p) & 0xFF", vars, 1, 0);
double result = te_eval(expr);
```

### 6. exprtk（C++）
- **GitHub**: [ArashPartow/exprtk](https://github.com/ArashPartow/exprtk)
- **特点**: 功能强大的 C++ 表达式库，支持自定义函数、向量运算

### 7. muParser（C++）
- **GitHub**: [beltoforion/muparser](https://github.com/beltoforion/muparser)
- **特点**: 高性能 C++ 数学表达式解析器，MIT 许可证

### 8. simpleeval（Python）
- **GitHub**: [danthedeckie/simpleeval](https://github.com/danthedeckie/simpleeval)
- **特点**: 安全的表达式求值，支持自定义函数

```python
from simpleeval import simple_eval
import math
result = simple_eval(
    "0x100 - mysum(h, l, c, p) & 0xFF",
    functions={"mysum": lambda *a: sum(a)},
    names={"h": 0x43, "l": 0x01, "c": 0x10, "p": 0}
)
```

### 9. py-expression-eval（Python）
- **GitHub**: [AxiaCore/py-expression-eval](https://github.com/AxiaCore/py-expression-eval)
- **特点**: 基于 js-expression-eval 移植，API 与 JS 版一致

### 10. gval（Go）
- **GitHub**: [PaesslerAG/gval](https://github.com/PaesslerAG/gval)
- **特点**: Go 语言通用表达式求值器，支持自定义函数

---

## 对比总结

| 库 | 语言 | 自定义函数 | 位运算 `&` | 十六进制 | 轻量级 | 数组操作 |
|----|------|-----------|-----------|---------|--------|---------|
| **expr-eval** | JS | 支持 | 支持 | 支持 | 是 | 需扩展 |
| **mathjs** | JS | 支持 | 支持 | 支持 | 否(功能全) | 内置 |
| **exp4j** | Java | 支持 | 有限 | 支持 | 是 | 需扩展 |
| **EvalEx** | Java | 支持 | 有限 | 支持 | 是 | 需扩展 |
| **TinyExpr** | C | 支持 | 支持 | 支持 | 极轻(2文件) | 需扩展 |
| **exprtk** | C++ | 支持 | 支持 | 支持 | 否 | 支持向量 |
| **muParser** | C++ | 支持 | 需扩展 | 需扩展 | 是 | 需扩展 |
| **simpleeval** | Python | 支持 | 支持 | 支持 | 是 | 需扩展 |
| **gval** | Go | 支持 | 支持 | 支持 | 是 | 需扩展 |

---

## 建议

func.js 的特殊之处在于它混合了**数组操作函数**（`len`/`sum` 接受逗号分隔的字段名从对象中取数组）和**位运算**。如果你需要多语言统一替换：

1. **最轻量方案**: **TinyExpr**（C/C++）+ **expr-eval**（JS）+ **simpleeval**（Python）— 各自独立但 API 类似
2. **统一生态方案**: **expr-eval** 有 JS 版，**py-expression-eval** 是其 Python 移植版，API 一致；Java 可用 **exp4j**
3. **全功能方案**: **mathjs**（JS）功能最全但体积大；C++ 用 **exprtk** 功能最丰富

如果你的 CSL 项目需要在嵌入式设备（C/C++）上运行，**TinyExpr** 是最佳选择——只有两个文件，零依赖，支持自定义函数和位运算。