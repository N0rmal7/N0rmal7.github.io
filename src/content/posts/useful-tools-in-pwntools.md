---
title: "pwntools里的一些实用工具"
published: 2026-09-14T00:00:00+08:00
description: "整理一些常用的pwntools模块内工具的用法"
tags:
  - "PWN"
  - "pwntools"
category: "PWN"
draft: false
---

（不定期更新）



## fmtstr_payload

`fmtstr_payload` 是 pwntools 里**根据「格式串参数偏移 + 目标地址=值」自动生成 `%n` 写入 payload** 的函数

### 1、函数签名（pwntools 4.15 实际签名）

```
fmtstr_payload(
    offset,
    writes,
    numbwritten=0,
    write_size='byte',
    write_size_max='long',
    overflows=16,
    strategy='small',
    badbytes=frozenset(),
    offset_bytes=0,
    no_dollars=False,
)
```

架构（32/64 位）由 `context.bits` 决定，指令格式由 `context.arch` 决定

### 2、参数说明

#### `offset`（必填，int）

- 含义：你完全控制的那段数据作为格式化参数出现的编号，也就是你探测时用来占位的标记出现在第几个 `%p`
- 探测方法：发送一串由"占位标记 + 若干个 `%p`"组成的格式串，观察到代表标记的那个值出现在第几号，那个号就是 `offset`。也可以用 pwntools 自带的自动探测类，它会不断尝试并直接给出结果

#### `writes`（必填，dict）

- 格式：`{地址: 值, 地址2: 值2, ...}`，一次写多个地址

- 值的类型：

  值的类型决定了写入多少字节：

​	a.值给 `int` → 自动按 `long` 长度处理（32 位 4 字节、64 位 8 字节），会覆盖目标后方若干字节；

​	b.只想写 1、2 或 4 字节 → 传 bytes（如 `{addr: b'\x37'}`、`{addr: p16(0x1337)}`、`{addr: p32(0x1337babe)}`）;

​	总结：值给 `int` 就写满 long，值给 `bytes` 就写多少算多少

- **注意**：多个写入地址的区间不能重叠，否则会抛出 `overlap` 一类的错误

#### `numbwritten`（默认 0，int）

- 含义：`printf` 在你输入的格式串之前已经输出的字符数
- 应用场景：当漏洞点的格式串中含有前缀字面量（如 `printf("Hello: " + user)`）时，前缀字符会被计入"已输出字符数"，需要让 pwntools 知道 → `numbwritten=7`(`'Hello: '`占7字节)。
- 常见的 `printf(user)` / `printf(buf)` → 用默认 0。
- 注：填错会导致最终写入值整体偏移

#### `write_size`（默认 `'byte'`，str）

- 取值：`'byte'` / `'short'` / `'int'`/`'long'` （对应 1 / 2 / 4 / 8 字节，指令分别为 `%hhn` / `%hn` / `%n` / `%lln`）

- 决定单次写入的粒度，不是总写入长度：

  | 值      | 指令   | 单块大小 | 建议                   |
  | :------ | :----- | :------- | :--------------------- |
  | `byte`  | `%hhn` | 1 字节   | 输出最少，payload 最长 |
  | `short` | `%hn`  | 2 字节   | 最常用、最稳           |
  | `int`   | `%n`   | 4 字节   | 写地址值必卡，慎用     |

- 写代码地址（如 backdoor）优先用 `short`或 `byte` ：`int` 会吐上亿字符，socket 缓冲塞满就“卡住不动”

- 注意 pwntools 会混用不同粒度以缩短输出（`short` 那条可能带 `%n`），是正常现象

#### `write_size_max`（默认 `'long'`）

- 含义：允许的单原子最大写入宽度上限，配合 `overflows` 在“少输出 / 短格式串”间权衡。一般不用动

#### `overflows`（默认 16，int）

- 含义：允许“多用几个溢出写”来缩短格式串长度的权衡参数
- 值大 → 格式串更短，但运行时会输出更多字符；值小 → 输出少、格式串长
- 应用情景：只有 payload 超长（受输入长度限制）时才需要调

#### `strategy`（默认 `'small'`，str）

- 含义：生成策略
- `'small'`：优先让 payload **短**（默认，够用）
- `'fast'`：写入次数很**多**时优先提速/减输出
- 多地址写入一旦 payload 过长，可以试试 `strategy='fast'`

#### `badbytes`（默认空）

- 含义：禁止在 payload 里出现的字节集合，如 `badbytes=b'\n'`
- 应用场景：输入函数是 `gets`/`read` 且会被 `\n` 截断，或地址中含 `\x00`、`\x20` 等。pwntools 会规避这些字节重新组织格式串。被换行截断时必加 `badbytes=b'\n'`

#### `offset_bytes`（默认 0）

- 含义：`offset` 的字节级微调：当你的可控数据不是从参数对齐边界开始时（例如格式串前面固定偏了 3 个字节），用它来修正参数编号（一般用不上）

#### `no_dollars`（默认 False）

- 含义：设为`True` 时，生成不使用 `$` 位置参数的老式 payload（顺序用 `%c` 一个个顶）
- 场景：目标程序过滤了 `$` 字符（如 `strchr(buf, '$')`）时的绕过手段

### 3.使用示例：

```
#简单使用示例：
offset = 7
printf_got = elf.got['printf']
backdoor = 0x......  #后门函数地址
payload = fmtstr_payload(7, {printf_got: backdoor},write_size='short')
```

### 4.注意要点

a.写代码地址一定要用 `short` 或 `byte`，`int` 会输出上亿字符导致卡死

b.**Full RELRO** 开启的情况下 GOT 只读，所以要另找一个可写、且其内容最终会被当作跳转目标的位置(如栈返回地址或 .bss 函数指针)来利用

c.有 `\n` 截断必须加 `badbytes=b'\n'`，并改用 `send`

d.触发时机：GOT 覆盖要在下一次调用才生效，需要让程序再走一轮

e.payload 不要超过输入长度上限（如 `read(0,buf,255)`），否则尾部地址被截断直接崩溃