---
title: "about glibc"
published: 2026-05-21T15:00:00+08:00
description: "有关glibc的一些基础知识"
tags:
  - "PWN"
  - "libc"
  - "Linux"
category: "PWN"
draft: false
---

## 前言
在做pwn题时总会遇到一些有关glibc的问题，于是重新学习了一下glibc，总结了一些知识点以及在做题时遇到glibc版本问题的解决方法。

## glibc概要
glibc（GNU C Library）是 Linux 发行版上使用最广泛的 C 标准库实现（同类还有 musl、bionic 等）。它不仅实现了 C 标准库函数，还实现了 POSIX 接口与大量 GNU 扩展，提供文件操作、内存管理、字符串处理、数学运算等基础功能。更重要的是，它把应用程序与内核交互的底层细节（系统调用）封装成普通函数调用，让程序员不必深入了解内核即可完成开发。  [Linux C标准库简介](https://c.biancheng.net/view/v0y7bcr.html)

初学 pwn 时可以这样理解：glibc 就是一个"工具箱"，把最基础的功能（输入输出、内存分配、字符串处理等）封装成一个个函数；同时它也在持续演进——为了修 bug、打安全补丁、加新功能，函数的内部实现、它在库中的相对地址（符号偏移）、以及 malloc 等组件的内部数据结构，都会随版本变化。

glibc 的变化可以分两个层面来看：

- **函数接口（API/ABI）层面基本稳定**：函数签名几乎不变，`write` 永远是 `write`  (API：函数名与参数类型；ABI：寄存器与内存布局，二者都严格向后兼容，所以老程序不重编译也能跑)
- **实现与偏移层面经常变**：同一个 `write` 在不同版本里编译出的代码长度与布局不同，因此在 libc 中的偏移也产生不同（例如：同为 2.35，仅补丁号不同，`write` 的偏移能够差出 0x60）；malloc 的堆块结构、可用 hook、以及 tcache、safe-linking 等机制，也都随版本引入或改变

所以漏洞怎么利用、能不能利用，往往由 glibc 版本决定——这也是做题前必须先确认目标 libc 版本的原因。





## 做题时遇到的实际问题与解决方法
做 pwn 题时，目标 libc 的版本直接影响漏洞的利用手法与成败。除二进制之外，题目通常还会额外附一份 `libc.so.6`——它通常与远端靶机中题目文件使用的libc版本一致，但与本地系统自带的 libc 可能并不一致。为了能在本地复现远端环境，你需要让本地进程加载这份随题 libc，而不是系统自带的版本。

笔者在初学时常有这样的疑惑：为什么本地调试明明成功了，换到远端却打不通？

最常见的原因之一，就是**本地进程实际加载的 libc 与远端不一致**：

- 远端泄露出来的是"远端 libc 中函数的真实地址"
- 而你用"本地 libc 的函数偏移"去减，两者不匹配
- 结果算出的 libc 基址是错的，`system`、`/bin/sh` 等一切后续地址自然全错。

这个错误有个很直观的判据：**真实的 libc 基址必然按页对齐（低 12 位为 0）**。如果算出来的 base 末尾不是 `000`，基本可以断定 libc 版本用错了

解决办法是让本地进程真正加载随题提供的这份 libc（必要时连带与之版本匹配的动态链接器 `ld-xxx.so`）。用 `patchelf` 修改**二进制**即可让它"认准"随题 libc：

### **patchelf使用指南**

1 指定 ld（改 ELF interpreter）：

```
patchelf --set-interpreter /ld文件路径 ./file_name
# 注：interpreter 不支持 $ORIGIN（内核加载时不展开变量），只能写绝对路径或相对当前工作目录的路径
# ld 与 libc 版本必须匹配，否则启动即报 _dl_call_libc_early_init 断言失败
```

2.1 指定 libc（改 rpath，让 NEEDED 的 libc.so.6 从同目录找）:

```
#一般情况下，随题libc名为"libc.so.6"且与题目附件放在同一路径下，可以使用以下指令：
patchelf --set-rpath '$ORIGIN' ./file_name  
# '$ORIGIN' = ELF文件所在目录
```

2.2 将ELF文件绑定目标替换为指定libc：

```
patchelf --replace-needed libc.so.6 libc_name ./file_name
#注：第二个参数(libc_name)直接填新库的文件名，而不是库文件的路径(不能带'/')
#为什么不能带'/'：当名字不含'/'时，加载器才走搜索顺序(LD_LIBRARY_PATH → RUNPATH → 默认目录)
#因此需配合 2.1 的 rpath 或 LD_LIBRARY_PATH 才能定位到该库
```
