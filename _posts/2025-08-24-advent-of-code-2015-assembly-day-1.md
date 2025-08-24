---
title: Learning x86-64 Assembly with Advent of Code - Day 1
author: David
date: 2025-08-24 12:00:00 -0500
categories: [Programming, Advent of Code]
tags: [programming, assembly, david]     # TAG names should always be lowercase
series: Advent of Code in x86-64
---
<div style="display:none;">2015 Day 1 (x86-64): An introduction to x86-64 assembly, using Advent of Code's first problem, the NASM assembler, and a lot of comments.  Features segfaults, stack corruption, and register juggling.</div>

The goal: solve 2015's Advent of Code with Assembly; specifically, NASM, with x86-64 syntax. 

**David**: This is a sequel series to Felipe's and my previous series, [Learning Rust with Advent of Code](../advent-of-code-2015-rust-day-1/).  Back in 2021, I had never touched Rust, and never worked deeply with any low-level language outside small edits to C++ libraries.  But, that series (and its abandonment) led directly to getting the HATETRIS world record in Rust, and now, Rust is my second-favorite and second-most-frequently-used language.  I'm far from an expert, even now, but I know Rust pretty well.

But more importantly, I understand the *concept* of lower-level languages now.  In 2021, they were a mystery to me; I knew that higher-level languages were in some sense 'built' on lower-level ones, and I knew that some languages (e.g. Mathematica, Python) were interpreted, while others (e.g. C, C++, Rust) were 'compiled', but what compilation actually did and how it differed from interpretation, I couldn't have said.  Now, I could.  I understand the layer of abstraction below the languages I usually work with.

But playing around with [Godbolt](https://rust.godbolt.org) led me to realize that there is another layer of abstraction, below *that*, which I don't understand, and that layer is the assembly language which a compiler such as Rust's compiles its code into.  My only experience with assembly languages, ironically, is from the various times pseudo-assembly languages have appeared in Advent of Code.  I might read, now and then, about various interesting or concerning developments in CPU architecture, new features or vulnerabilities or both, but it's all Greek to me.  I'm simply too far removed.

I expect this will not be nearly as useful as learning Rust was, or learning C and C++ to a high level would have been.  I suspect I could go my entire career without ever *needing* to write one line of assembly or machine code.  I'm not doing this because I have any plan of programming in assembly languages *per se*.  I'm dong this because I want to understand this layer of abstraction that higher-level languages are built on.  I might not understand the machine opcodes nor the incredible optimizations the CPU does caching and streamlining and speculative execution and a whole host of other nuances, but I'd be one step closer to understanding those.  I want one fewer gap in my knowledge.

So, the plan is to complete 2015's Advent of Code in NASM (with x84-64 syntax) and Linux system calls, starting from a single template file and nothing else.  No calls to libc, no prebuilt nasm libraries.  If I want macros, I have to make them on my own.  If I want to automate macro production, I'll need to write my own compiler - and I'll need to do it in assembly.  No cheating.

My resources are:

- [The Intel Architectures Software Development Manual](https://software.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-1-manual.pdf).  Goes into extreme detail on all registers, instructions, opcodes, .  It's five thousand pages long, so a bit of a doorstop, but if I can't find what I need to know about instructions or registers anywhere else, this manual **will** have it.
- [NASM — The Netwide Assembler](https://userpages.cs.umbc.edu/chang/cs313.f04/nasmdoc/nasmdoc.pdf).  Details every feature of NASM circa 2003...which, aside from details specific to 64-bit architecture, seems to be enough to cover NASM circa 2025. 
- One template file.

# [The Template File](https://github.com/leto/writing/blob/master/nasm/nasm.md?plain=1)

The one template file I'm allowing is to spare myself *some* pain.  Back in 2021, it took four attempts before I could successfully read a file into a Rust string.  But in NASM, when just starting out...it would take me many, *many* more than just four attempts.  Without some kind of working "Hello World!" program to start with, I could be spinning my wheels for ages reading the two manuals I have and trying to figure out what a working NASM program even looks like.

So, I found an example for reading a file and writing its contents, written as an example by [Jonathan "Duke" Leto](https://duke.leto.net/outline.html), in 2000.  He has [an entire GitHub repo of assembly tools, tricks, macros, and other helpful things](https://github.com/letolabs/nasm), but I am not allowed to use or look at them yet, not even the hardware / operating system portability code.  And, to make things at least somewhat fair, I spent the time to comment every single line, to make sure that I'm not using anything I don't thoroughly understand.

```x86asm
section .data
	bufsize: dd 0x2000		;	8192 in hexadecimal.  Optimal buffer size for reading, apparently.
	newline: db 0x0A		;	ASCII code for a newline.
	
section .bss
	buf: resb 0x2000		;	Reserves 8192 bytes, without assigning them.

section .text
global _start
_start:
	pop ebx					;	argc: The argument count.  Will always be 2, if we're only reading one file.
	pop ebx					;	argv[0]: The first argument, always the program name.
	pop ebx					;	argv[1]: The second argument, the filename.

file_descriptor:
	mov eax, 5				;	System call number for Open is 5.
							;	Filename is already in ebx.
	mov ecx, 0				;	Flag for 'read-only', since we are not modifying the file.
	int 0x80				;	Call the kernel to open the file.

	test eax, eax			;	Tests file descriptor (in this case, we care about the first bit).
	jns file_load			;	If the file descriptor does not have the sign flag, jump to file_load.

	mov ebx, eax			;	We didn't jump, so there must have been an error.
	mov eax, 1				;	System call number for Exit is 1.
							;	Return flag is already set to ebx
	int 0x80

file_load:
	mov ebx, eax			;	Move file descriptor into ebx.
	mov eax, 3				;	System call number for Read is 3.
							;	Filename is already in ebx.
	mov ecx, buf			;	Move the *address* of buf to ecx.
	mov edx, bufsize		;	Move the *address* of bufsize to edx.
	int 0x80				;	Call the kernel to read the file.

	test eax, eax			;	Test the number of bytes which were successfully read.
							;	TODO: cmp eax, bufsize 
							;	TODO: jz nextfile
							;	TODO: js error

cat:
	mov edx, eax			;	Save the number of bytes actually read in edx.
	mov eax, 4				;	System call for Write is 4.
	mov ebx, 1				;	Flag for STDOUT is 1.
							;	ecx already has the address of the buffer.
							;	edx already has the address of the number of bytes read.
	int 0x80				;	Call the kernel to write out the file.

print_newline:
	mov eax, 4				;	System call for Write is 4.
	mov ebx, 1				;	Flag for STDOUT is 1.
	mov ecx, newline		;	Move the *address* of the newline into `ecx`.
	mov edx, 1				;	We're only printing one byte.
	int 0x80

exit:
	mov eax, 1				;	System call for Exit is 1.
	mov ebx, 0				;	Returns 0.
	int 0x80				;	Call the kernel to exit the program.

```

This file, and the others I will be using throughout the series, can be saved to `path/to/file.asm` and assembled with:

```
nasm -f elf64 path/to/file.asm
ld -melf_x86_64 path/to/file.o -o path/to/file.bin
path/to/file.bin args
```

All in all, I don't regret skipping ahead; it would not have been easy to figure most of this out without *something* to work from.  And now, we can work on solving the actual problem.

# Version 1.0 - [Solving the Problem](https://www.adventofcode.com/2015/day/1)

The problem: you're given a number of parentheses, with `(` representing `+1` and `)` representing `-1`.
- Part 1: Starting at `0` and the first parenthesis, find the total.
- Part 2: Find the earliest instance in which the subtotal (starting at `0` and the first parenthesis) is `-1`.

## Version 0.1: Printing File Size (Backwards)

Right now, we have a file, whose contents get stored in memory in the `buf` variable, and then printed to STDOUT.  But not *all* of its contents, necessarily - just the first 8192 bytes.  To find out if 8192 bytes is enough for this problem, let's print the number of bytes read instead of the contents.

There's just one problem.  The number of bytes read (whose address is currently stored in the four-byte register `edx`) is in base-256, and we can't read base-256.  We need to convert the address into a sequence of bytes we can actually read.  To convert a number into base 10, we integer-divide that number by 10 to get a quotient and remainder, save the remainder, and continue dividing the resulting quotient by 10 until the quotient is zero.  The list of remainders is the list of digits, stored back-to-front.  So, let's replace `cat:` with `print_len:`, requiring only one change in `section .bss`:

```x86asm
section .bss
...
	digit: resb 1			;	Reserves 1 byte of memory for the digit.

...

file_load:
	...

print_len:
	mov edx, 0				;	Clear `edx`, since `edx` acts as the top 32 bits for 'div'.
	mov ebx, 10				;	Move the dividend into a register; won't work as a raw 'div 10' command, even though 'add' works that way.
	div ebx					;	Divide the buffer size by the dividend (10).  Quotient is stored in `eax`, remainder is stored in `edx`.
	add edx, 0x30			;	Add 0x30 (48 in decimal) to convert the remainder into an ASCII digit from 0-9.

	mov esi, eax			;	Move the quotient into another register, so we can use `eax` for the system call.
	mov byte[digit], dl		;	Move the lowest byte of the remainder out of the register, into the holding cell.

	mov eax, 4				;	System call for Write is 4.
	mov ebx, 1				;	Flag for STDOUT is 1.
	mov ecx, digit			;	Buffer is pointing to the holding cell for the digit.
	mov edx, 1				;	Only one byte.
	int 0x80				;	Call the kernel to write out the base-10 digit of the file length.

	mov eax, esi			;	Bring the quotient back into `eax`.
	test eax, eax			;	Tests how large the quotient is, setting ZF to whether `eax` is 0.
	jnz print_len			;	If the quotient is not yet 0 (checking ZF), continue printing digits.
```

```
$ day_01.bin Inputs/Day_01_Input.txt
0007
```

The logic is fairly simple.  After file_load, the number of bytes read successfully is already stored in `eax`.  We repeatedly divide `eax` by 10, and each time, we take the remainder from `edx`, add 48 to make it an ASCII digit, store that digit in memory, and then write that digit from memory.  This, of course, means that we're printing backwards; a result of `0007` means that the file actually has `7000` bytes, and a quick check confirms that it does.  We can now confirm that, with less than 8192 bytes in the file, we have everything we need to solve the problem.

## Version 0.2: Printing File Size (Forwards)

But being only able to print backwards feels like giving up too soon.  We want to print the most significant digit first, and since we won't know the most significant digit until the end of the computation, we need to compute every digit first.  Fortunately, the **stack** provides a natural way to do that.  The stack, as Leto explains:

> "The stack" as it is ominously referred too, is just your RAM.  That's it.   It is your RAM organized in such a way, so that when you "push" something onto "the stack", all you are doing is saving something in RAM.  And when you "pop" something off of "The stack", you are retrieving the last thing you put in, which is on the top.

We'll use a register, `edi`, to keep track of how many digits we've pushed onto the stack, and then pop that many digits off the stack afterwards.

```x86asm

file_load:
	...
	mov edi, 0				;	Initialize `edi` to prepare for digit count.

push_len:
	mov edx, 0				;	Clear `edx`, since `edx` acts as the top 32 bits for 'div'.
	mov ebx, 10				;	Move the dividend into a register; won't work as a raw 'div 10' command, even though 'add' works that way.
	div ebx					;	Divide the buffer size by the dividend (10).  Quotient is stored in `eax`, remainder is stored in `edx`.
	add edx, 0x30			;	Add 0x30 (48 in decimal) to convert the remainder into an ASCII digit from 0-9.

	push edx				;	Push the entire register containing the remainder onto the stack.
	inc edi					;	Increment the count.

	test eax, eax			;	Tests how large the quotient is, setting ZF to whether `eax` is 0.
	jnz push_len			;	If the quotient is not yet 0 (checking ZF), continue pushing digits onto the stack.

print_len:
	pop eax					;	Pop the digit off the stack into `eax`.
	mov byte[digit], al		;	Move the digit (`al` is the lowest byte of `eax`) into the holding cell. 

	mov eax, 4				;	System call for Write is 4.
	mov ebx, 1				;	Flag for STDOUT is 1.
	mov ecx, digit			;	Point to the holding cell.
	mov edx, 1				;	Only one byte.
	int 0x80				;	Call the kernel to write out the base-10 digit of the file length.

	dec edi					;	One fewer digit in the count.
	test edi, edi			;	Tests how many digits remain, setting ZF to whether `edi` is 0.
	jnz print_len			;	If any digits remain, continue printing.
```
```
$ day_01.bin Inputs/Day_01_Input.txt
7000
```

Success!  We're now printing out the decimal number of bytes in the correct direction.

## Version 0.3: Printing File Size (Macro)

Since turning a number into its decimal representation seems like something we'll be doing a lot, let's use this opportunity to make our first **macro**.  A macro is a piece of code that can be defined once and reused multiple times.  It is defined by `%macro MACRONAME NUM_PARAMS` at the beginning and `%endmacro` at the end, and each parameter can be referenced within the macro as `%1`, `%2`, etc.  We can still use labels for jumps, so long as they are prefaced with `%%`.  When the assembler assembles the code, it will replace every invocation of a macro with its full text.

There's one difficulty.  The way we're currently pulling digits off the stack, we need a `digit` pointer to point to the digit's location in memory, after we've popped it from the stack and stored it in memory.  But we can't reserve the same variable name more than once in an assembly program, so if we define `digit` within the macro, we can't call the macro more than once.  If we define `digit` in `section .bss` *outside* the macro, we can call the macro again and again, but defining it outside the macro means that we can't copy and paste - or `%include` - the macro from one file to another.  Neither is ideal.

There may be a way to reserve local variables only inside macros, but there's a much better way.  Rather than pop the digit off the stack and put it in memory, we can use the `esp` register, which always points to the top of the stack.  Then, *after* we print the digit, we pop the digit off the stack and ignore the result.

```x86asm
section .macros

%macro print_num 1
	mov eax, %1					;	Moves the first parameter into `eax`.
	mov esi, 0					;	Initialize `esi` to prepare for digit count.

	%%push_dig:
		mov edx, 0				;	Clear `edx`, since `edx` acts as the top 32 bits for 'div'.
		mov ebx, 10				;	Move the dividend into a register; won't work as a raw 'div 10' command, even though 'add' works that way.
		div ebx					;	Divide the buffer size by the dividend (10).  Quotient is stored in `eax`, remainder is stored in `edx`.
		add edx, 0x30			;	Add 0x30 (48 in decimal) to convert the remainder into an ASCII digit from 0-9.

		push edx				;	Push the entire register containing the remainder onto the stack.
		inc esi					;	Increment the count.

		test eax, eax			;	Tests how large the quotient is, setting ZF to whether `eax` is 0.
		jnz %%push_dig			;	If the quotient is not yet 0 (checking ZF), continue pushing digits onto the stack.

	%%print_dig:
		mov eax, 4				;	System call for Write is 4.
		mov ebx, 1				;	Flag for STDOUT is 1.
		mov ecx, esp			;	Point to the top of the stack.
		mov edx, 1				;	Only one byte.
		int 0x80				;	Call the kernel to write out the base-10 digit of the file length.

		pop eax					;	Pop the digit off the stack into `eax`
		dec esi					;	One fewer digit in the count.
		test esi, esi			;	Tests how many digits remain, setting ZF to whether `esi` is 0.
		jnz %%print_dig			;	If any digits remain, continue printing.
%endmacro

%macro print_newline 0
	mov eax, 4				;	System call for Write is 4.
	mov ebx, 1				;	Flag for STDOUT is 1.
	mov ecx, newline		;	Move the *address* of the newline into `ecx`.
	mov edx, 1				;	We're only printing one byte.
	int 0x80
%endmacro

...

file_load:
	...
	print_num eax			;	Print `eax`, which is this case contains the number of bytes read from the file.
							;	As a side effect, this overwrites the values of registers `eax` through `edi`.
	print_newline
```

Having `print_num` as a macro is liberating.  I can now directly see - in decimal - the value of any register or double-word of memory.  It's certainly not costless, it only works with 32-bit values, and wiping out the values of the first five registers means that I can't simply throw this into the middle of calculations at will to debug.  But it means that I can, reliably, pass information from inside the program to outside.  It's a good step.

## Version 1.0: Counting Parentheses

Going back to the end of `file_load`, we currently have the number of bytes actually read from the file stored in the register `eax`.  We can store that value in `bufsize`, since the variable's already allocated, and then count bytes from the beginning of `buf` until we've iterated through `bufsize` bytes.

```x86asm
file_load:
	...
	mov [bufsize], eax		;	Move the number of bytes actually read into 'bufsize'.
	mov eax, 0				;	Initialize the current paren total in `eax` to 0, for part 1.
	mov esi, 0				;	Initialize the pointer offset in `esi` to 0.
	
parse_file:
	cmp esi, [bufsize]		;	Check if we've run out of bytes.
	je done					;	If we have, exit the loop.
	
	mov bl, [buf+esi]		;	Move the current char, defined by original buffer and offset, into the lowest byte of `ebx`.
	inc esi					;	Increment the pointer offset.
	cmp ebx, 0x29			;	Compare the current char to the ASCII offset for ')'.
	je right				;	Skip the evaluation of 'left' if it's a right paren.

	left:
		inc eax				;	Increment the current paren total, for part 1.
		jmp parse_file		;	Continue reading the file.
	right:
		dec eax				;	Decrement the current paren total, for part 1.
		jmp parse_file		;	Continue reading the file.

done:
	print_num eax			;	Print part 1: the final paren total.
	print_newline
```
```
$ day_01.bin Inputs/Day_01_Input.txt
280
```

Part 1 solved!

Well, by happenstance.  My answer happened to be positive, but there's no reason it has to be.  If I were to flip `left` and `right` in that code, I'd get:

```
$ day_01.bin Inputs/Day_01_Input.txt
4294967016
```

That corresponds to `2^32 - 280`, since right now my macro has no way of interpreting the two's complement representation.  But, luck is good enough to get the star, so let's keep going.

## Version 1.1: First Time to Basement

At every step, we're storing our current location in `eax` and the step count in `esi`.  We're using `ebx` to analyze the current character and decide what action to take.  That leaves `ecx`, `edx`, `edi`, and `ebp` to work with.  The first two of those are used in `print_num`, but the second two are not, which means we can store data in either one of those registers, print `eax` at the end for part 1, and then print the other register for part 2, without having to push and pop the answer for part 2 on and off the stack.  Checking whether `eax` is equal to -1 is easy enough; all we need now is a way to only save the step count from `esi` on the *first* visit, and none of the subsequent ones.

```x86asm
file_load:
	...
	mov [bufsize], eax		;	Move the number of bytes actually read into 'bufsize'.
	mov eax, 0				;	Initialize the current paren total in `eax` to 0, for part 1.
	mov edi, 0				;	Initialize the position of the first basement visit to 0, for part 2.

	mov esi, 0				;	Initialize the pointer offset in `esi` to 0.
	
parse_file:
	cmp esi, [bufsize]		;	Check if we've run out of bytes.
	je done					;	If we have, exit the loop.
	
	mov bl, [buf+esi]		;	Move the current char, defined by original buffer and offset, into the lowest byte of `ebx`.
	inc esi					;	Increment the pointer offset.
	cmp ebx, 0x29			;	Compare the current char to the ASCII offset for ')'.
	je right				;	Skip the evaluation of 'left' if it's a right paren.

	left:
		inc eax				;	Increment the current paren total, for part 1.
		jmp part_2			;	Go to part 2.
	right:
		dec eax				;	Decrement the current paren total, for part 1.
		jmp part_2			;	Go to part 2.  Not strictly necessary, but makes the code easier for me to follow.

	part_2:
		cmp eax, -1			;	Check if we're at -1.
		jne parse_file		;	If we're not at -1, continue reading the file.
		test edi, edi		;	If we are at -1, compare `edi` against itself.  We can never be at -1 at position 0.
		jnz parse_file		;	If `edi` is not zero, then we've already set it, meaning we're visiting the basement again and don't want to record our position.
		mov edi, esi		;	If `edi` *is* zero, then this is the first time we've been here.  Set `edi` to our current location.

	jmp parse_file			;	Continue reading the file.

done:
	print_num eax			;	Print part 1: the final paren total.
	print_newline			;	Space things out.
	print_num edi			;	Print part 2: the first basement visit.  We conveniently don't use `edi` in `print_num`, so we don't have to save `edi` on the stack.

exit:
	mov eax, 1				;	System call for Exit is 1.
	mov ebx, 0				;	Returns 0.
	int 0x80				;	Call the kernel to exit the program.
```
```
$ day_01.bin Inputs/Day_01_Input.txt
280
1797
```

Both stars acquired!

# Version 2.0: Solving The Problem Less Badly

This code, to put plainly, is bad.  It works, for my specific input, but there are a lot of things I don't like about it:

- The program doesn't use 64-bit mode, so I'm not just giving up register *size*, I'm giving up registers `r8` through `r15`.
- `print_num` overrides all register values, making it useless mid-loop.
- `print_num` can't handle negative numbers.
- `file_load` can't handle files larger than one buffer size.
- There's no way to know how long the program took to run.
- There's no rhyme or reason to which registers I use for what purpose.

Let's tackle these in order before we consider the problem solved.

## Version 2.1: 64-Bit Mode

In theory, this is the easiest change to make; NASM supports `BITS 16/32/64` as command flags in front of the program.  Trying it, we get some errors:

```
$ nasm -f elf day_01/day_01.asm
day_01/day_01.asm:57: error: instruction not supported in 64-bit mode
day_01/day_01.asm:58: error: instruction not supported in 64-bit mode
day_01/day_01.asm:59: error: instruction not supported in 64-bit mode
day_01/day_01.asm:115: error: instruction not supported in 64-bit mode
day_01/day_01.asm:19: ... from macro `print_num' defined here
day_01/day_01.asm:115: error: instruction not supported in 64-bit mode
day_01/day_01.asm:32: ... from macro `print_num' defined here
day_01/day_01.asm:117: error: instruction not supported in 64-bit mode
day_01/day_01.asm:19: ... from macro `print_num' defined here
day_01/day_01.asm:117: error: instruction not supported in 64-bit mode
day_01/day_01.asm:32: ... from macro `print_num' defined here
```

Checking the code, these line numbers represent every single time we've pushed something onto or popped something off the stack.  So, that sounds like all stack memory access must be done with 64-bit operands.  But when we try replacing each call:

```
$ day_01.bin Inputs/Day_01_Input.txt

```

The output is empty.  The code doesn't crash or segfault, and the assembler doesn't refuse to compile it, so it's probably doing *something*.  What happened?

Reading Intel's documentation, it seems that 64-bit mode expects the stack increment in `push` and `pop` to be consistent; if we're pointing to a location on the stack, that location is assumed to be the start of a 64-bit number.  How this works, I don't entirely understand, but since system interrupts can only take 32-bit arguments, we need to find some equivalent which takes 64-bit arguments.

That equivalent can be found in `man syscall`, which explains how system calls are done in Linux.  In the section **Architecture calling conventions**, the man page lists two tables showing how the instructions differ from one architecture to the next.  Up until now, we've been in 32-bit mode of Intel, known as i386, since that was the only mode available in 1999 when Jonathan Leto published his NASM template file.  What we *want* to do is use the x86-64 architecture.

```
Arch/ABI    Instruction           System  Ret  Ret  Error    Notes
									call #  val  val2
───────────────────────────────────────────────────────────────────
...
i386        int $0x80             eax     eax  edx  -
...
x86-64      syscall               rax     rax  rdx  -        5
```

```
Arch/ABI      arg1  arg2  arg3  arg4  arg5  arg6  arg7  Notes
──────────────────────────────────────────────────────────────
...
i386          ebx   ecx   edx   esi   edi   ebp   -
...
x86-64        rdi   rsi   rdx   r10   r8    r9    -
```

So, the change should be pretty easy.  Swap out `eax`, `ebx`, `ecx`, and `edx` in the read and write calls for `rax`, `rdi`, `rsi`, and `rdx`, respectively.  Then, we call `syscall` instead of `int 0x80`, and we're good to go.

```x86asm
section .data
	a: db 0x61

section.text
global _start 
_start:
	mov rax, 4				;	System call for Write is 1.
	mov rdi, 1				;	Flag for STDOUT is 1.
	mov rsi, a				;	Point to the letter 'a'.
	mov rdx, 1				;	Only one byte.
	syscall					;	Call the kernel and print the letter 'a'.

exit:
	mov eax, 1				;	System call for Exit is 1.
	mov ebx, 0				;	Returns 0.
	int 0x80				;	Call the kernel to exit the program.
```
```
$ day_01.bin Inputs/Day_01_Input.txt

```

Nothing happens.

It turns out that the system call for write is different for `syscall` than it is for interrupts.  I actually don't know where to look to find these system calls on my machine itself; fortunately, Ryan Chapman [maintains a table of `syscall` arguments here](https://blog.rchapman.org/posts/Linux_System_Call_Table_for_x86_64/).  `sys_read` is 0, `sys_write` is 1, `sys_open` is 2, and `sys_exit` is 60; those should be all we need for this particular problem.

```x86asm
section .data
	a: db 0x61

section.text
global _start 
_start:
	mov rax, 1				;	syscall for Write is 1.
	mov rdi, 1				;	Flag for STDOUT is 1.
	mov rsi, a				;	Point to the letter 'a'.
	mov rdx, 1				;	Only one byte.
	syscall					;	Call the kernel and print the letter 'a'.

exit:
	mov rax, 60				;	syscall for Exit is now 60.
	mov rdi, 0				;	Returns 0.
	syscall					;	Call the kernel to exit the program.
```
```
$ day_01.bin Inputs/Day_01_Input.txt
a
```

We can print again!  Let's bring back the `print_num` macro, change everything to use 64-bit registers, and test it out.

```x86asm
BITS 64

section .macros
%macro print_num 1
	mov rax, %1					;	Moves the first parameter into `eax`.
	mov rcx, 0					;	Initialize `rcx` to prepare for digit count.

	%%push_dig:
		mov rdx, 0				;	Clear `rdx`, since `rdx` acts as the top 64 bits for 'div'.
		mov rbx, 10				;	Move the dividend into a register; won't work as a raw 'div 10' command, even though 'add' works that way.
		div rbx					;	Divide the buffer size by the dividend (10).  Quotient is stored in `rax`, remainder is stored in `rdx`.
		add rdx, 0x30			;	Add 0x30 (48 in decimal) to convert the remainder into an ASCII digit from 0-9.

		push rdx				;	Push the entire register containing the remainder onto the stack.
		inc rcx					;	Increment the count.

		test rax, rax			;	Tests how large the quotient is, setting ZF to whether `rax` is 0.
		jnz %%push_dig			;	If the quotient is not yet 0 (checking ZF), continue pushing digits onto the stack.

	%%print_dig:
		mov rax, 1				;	System call for Write is 4.
		mov rdi, 1				;	Flag for STDOUT is 1.
		mov rsi, rsp			;	Point to the top of the stack.
		mov rdx, 1				;	Only one byte.
		syscall					;	Call the kernel to write out the base-10 digit.

		pop rax					;	Pop the digit off the stack into `rax`
		dec rcx					;	One fewer digit in the count.
		test rcx, rcx			;	Tests how many digits remain, setting ZF to whether `rcx` is 0.
		jnz %%print_dig			;	If any digits remain, continue printing.
%endmacro

section .text
global _start 
_start:
	print_num 47				;	Print a two-digit number.  How hard could it be?

exit:
	mov rax, 60					;	syscall for Exit is now 60.
	mov rdi, 0					;	Returns 0.
	syscall						;	Call the kernel to exit the program.
```

```
$ day_01.bin Inputs/Day_01_Input.txt
47����fy���
6k���
3Gp�����+@t��
             1BQct�k����
,C`~���BMUn�����;au����Eh���!�d@8
                                        �
�������/bt1tLaIGlHio2mu2aP-1xI/_BRo_DcgfktxMFeaMMN1DSIicTAulma.THhn-ciatD_8O//oa__8T/resFmEEnseLASST4OabW/rntesLdGNPfktEYGTr/ug0Hr/mrD2C/o/ec-r-91c_SdtodMI=eFAURd:6p:53;d0;i3=at:24;r*;c*;z*;4*;m:1x:17:1=.11r:;o*3=.;2*3=.;=.3=.3=.3=.3=.3=.;=.10w10d10j5=.;p50b50p50t50x50t3=.3z*;x*;g*12:1e50m50m3=.50w50r:0f50f50g:;f*;v*;f*;x*;=.;a*;d:0p:0g:;v*;u:0s6UENsNOIf8deG5MOdG=asO/s SCeNp/LINUR-rT/r/l-ytE|iiSd__/rst0kYVTEUA=aM=_MUMYRtLPrcrI/a16/o/ec-r-91c/aeU6ldlodawtxsi-utiRD/0Z_=l=TRE9DShmbas//r/poA1/v/m/noai/i/lndmhib/u/m/bebe.ililnb/i/elmpodt/vnsdo:acGO-ciI__=l:BIAuhs/_DPIGCKEhlseCCURAe01y
```

Something has gone horribly wrong.

## Version 2.2: First Stack Corruption

This isn't quite as bad as it looks.  The first two digits - `47`, in this case - are correct, which means that those numbers were pushed to the stack successfully, passed to `write` successfully, and popped from the stack successfully.  Somewhere along the way, `rcx` was set to a value which was far too high, and remained that way until it chanced to become 0 again.  Since we never explicitly changed `rcx`, the change must have been a side effect of something else we did...and therefore, using a different register might avoid that side effect.  Trying out all the different registers (or at least, the ones we're not already using), we can map when this happens and when it doesn't:

Register | Stack Corrupted?
---------|---------
rax      | -
rbx      | -
rcx      | Yes
rdx      | -
rsi      | -
rdi      | -
rbp      | -
r8       | Yes
r9       | No
r10      | No
r11      | Yes
r12      | No
r13      | No
r14      | No
r15      | No

It seems that `rcx`, `r8`, and `r11` all produce this stack corruption error, while none of the others do.  By process of elimination, we can blame this on `syscall`; none of the other operations we use modify any of those registers.  But why?  And how would we know *before* making this mistake?  Intel's documentation on `syscall` does explain that the instruction overrides (or **clobbers**) `rcx` and `r11`, on a close read:

> SYSCALL invokes an OS system-call handler at privilege level 0. It does so by loading RIP from the IA32_LSTAR MSR **(after saving the address of the instruction following SYSCALL into RCX)**.
> ...
> SYSCALL also **saves RFLAGS into R11** and then masks RFLAGS...

But even Intel doesn't mention that `syscall` also clobbers `r8`, and the `man` page for `syscall` is sufficiently removed from the raw machine code that it likewise doesn't mention it.  Various search results mention `r8`, but I genuinely don't know how I could have figured that out from even diligent study of the thousands of pages in the manual.  

This is what makes programming in Assembly so difficult for novices like me - and probably what makes programming in general so difficult for those new to it.  Learning a programming language - or any language - involves maddening numbers of exceptions and special cases and violations of the Principle of Least Surprise; different languages might be better or worse in this regard, but roadblocks will be with us always.

And in such cases, the best thing to do seems to be to systematically map out the error, and search the Internet to see if anyone else has encountered the same problem.  It's not a great solution, but I think it's the best approach a beginner can take.

## Version 2.3: 64-Bit Mode

Getting back to the code, we can change the counter register in `print_num` to `r15` and avoid the problem.  So, let's incorporate that back into the program, and change all of the calls to use the proper 64-bit registers.

The major stumbling block for this bit of conversion was in memory management, in .data.  NASM by default will place all constants right next to each other, so, for instance:

```x86asm
section .data
	tab 		db 0x09		;	ASCII code for a tab.
	newline		db 0x10		;	ASCII code for a newline.
	right_paren	db 0x29		;	ASCII code for a right paren ')'.

	bufsize		dw 0x2000	;	8192 in hexadecimal.  Optimal buffer size for reading, apparently.
```

will cause `tab`, `newline`, `right_paren`, and `bufsize` to all be packed side-by-side.  This isn't a problem in and of itself, but when reading a constant into a buffer, the constant is read based on the size of the *destination*, not the size of the *source*.  `mov rdx, [bufsize]`, for instance, moves not two bytes but eight bytes into `rdx`.  There are two solutions to this:

- Define all constants to be in multiples of 64-bit numbers (quadwords), and only use full registers.
- Define all constants to be their actual sizes, and use the appropriately-sized register for that constant (e.g. `rdx` for 64-bit quadwords, `edx` for 32-bit doublewords, `dx` for 16-bit words, and `dl` for 8-bit bytes).

In this code, I use the former option; it's less efficient for memory, but with a handful of bytes, memory isn't a huge concern.  Having a single rule makes writing the code far easier.

```x86asm
BITS 64

section .macros
%macro print_char 1
	mov rax, 1				;	System call for Write is 1.
	mov rdi, 1				;	Flag for STDOUT is 1.
	mov rsi, %1				;	Move the parameter passed in to `rsi`.
	mov rdx, 1				;	Only one byte.
	syscall					;	Call the kernel to write out the base-10 digit.
%endmacro

%macro print_num 1
	mov rax, %1				;	Moves the first parameter into `rax`.
	mov r10, 0				;	Initialize `r10` to prepare for digit count.

	%%push_dig:
		mov rdx, 0			;	Clear `rdx`, since `rdx` acts as the top 64 bits for 'div'.
		mov rbx, 10			;	Move the dividend into a register; won't work as a raw 'div 10' command, even though 'add' works that way.
		div rbx				;	Divide the buffer size by the dividend (10).  Quotient is stored in `rax`, remainder is stored in `rdx`.
		add rdx, 0x30		;	Add 0x30 (48 in decimal) to convert the remainder into an ASCII digit from 0-9.

		push rdx			;	Push the entire register containing the remainder onto the stack.
		inc r10				;	Increment the count.

		test rax, rax		;	Tests how large the quotient is, setting ZF to whether `rax` is 0.
		jnz %%push_dig		;	If the quotient is not yet 0 (checking ZF), continue pushing digits onto the stack.

	%%print_dig:
		mov rax, 1			;	System call for Write is 1.
		mov rdi, 1			;	Flag for STDOUT is 1.
		mov rsi, rsp		;	Point to the top of the stack.
		mov rdx, 1			;	Only one byte.
		syscall				;	Call the kernel to write out the base-10 digit.

		pop rax				;	Pop the digit off the stack into `rax`
		dec r10				;	One fewer digit in the count.
		test r10, r10		;	Tests how many digits remain, setting ZF to whether `r10` is 0.
		jnz %%print_dig		;	If any digits remain, continue printing.
%endmacro

section .data
	tab 		dq 0x09		;	ASCII code for a tab.
	newline		dq 0x10		;	ASCII code for a newline.
	right_paren	dq 0x29		;	ASCII code for a right paren ')'.

	bufsize		dq 0x2000	;	8192 in hexadecimal.  Optimal buffer size for reading, apparently.
	
section .bss
	buf			resb 0x2000	;	Reserves 8192 bytes for the filebuffer, without assigning them.

section .text
global _start 
_start:
	pop rdi					;	argc: The argument count.  Will always be 2, if we're only reading one file.
	pop rdi					;	argv[0]: The first argument, always the program name.
	pop rdi					;	argv[1]: The second argument, the filename.

file_descriptor:
	mov rax, 2				;	syscall for sys_open is now 2.
							;	The filename is already in `rdi`.
	mov rsi, 0				;	Flag for 'read-only', defined in fcntl.h.
	syscall					;	Call the kernel to open the file.

	test rax, rax			;	Tests file descriptor (in this case, we only care about the sign flag).
	jns file_load			;	If the file descriptor does not have the sign flag, jump to file_load.


	mov rdi, rax			;	We didn't jump, so there must have been an error.
	mov rax, 0x3c			;	syscall for sys_exit is now 60.
							;	Return flag is already set to `rdi`
	syscall					;	Call the kernel to exit the program.

file_load:
	mov rdi, rax			;	Move file descriptor into `rdx`.
	mov rax, 0				;	syscall for sys_read is now 0.
							;	Filename is already in `rdi`.
	mov rsi, buf			;	Move the *address* of buf to `rsi`.
	mov dx, [bufsize]		;	Move the *address* of bufsize to `rdx`.
	syscall					;	Call the kernel to read the file.

	mov r8, rax				;	Move the number of bytes actually read into `r8`, to compare `rax` against.
	mov rax, 0				;	Initialize the current paren total in `rax` to 0, for part 1.
	mov rdi, 0				;	Initialize the position of the first basement visit to -1, for part 2.
	mov rsi, 0				;	Initialize the pointer offset in `rsi` to 0.
	mov rdx, 0				;	Clear `rdx`, so that we can use it for char comparison.

file_parse:
	cmp rsi, r8				;	Check if we've run out of bytes.
	je done					;	If we have, exit the loop.

	mov dl, [buf+rsi]		;	Move the current char, defined by original buffer and offset, into the lowest byte of `rdx`.
	inc rsi					;	Increment the pointer offset.
	cmp rdx, [right_paren]	;	Compare the current char to the ASCII offset for ')'.
	je right				;	Skip the evaluation of 'left' if it's a right paren.

	left:
		inc rax				;	Increment the current paren total, for part 1.
		jmp part_2			;	Go to part 2.
	right:
		dec rax				;	Decrement the current paren total, for part 1.
		jmp part_2			;	Go to part 2.  Unnecessary, but makes the code easier for me to follow.

	part_2:
		cmp rax, -1			;	Check if the current position is -1.
		jne file_parse		;	If we're not, continue reading the file.
		test rdi, rdi		;	If w are at -1, compare `rdi` against itself.  A position of '0' can never be right.
		jnz file_parse		;	If `rdi` is not zero, then we've already set it, and this is a duplicate visit.
		mov rdi, rsi		;	If `rdi` *is* zero, then this is the first time we've been here.  Save the value.
	
	jmp file_parse			;	Continue reading the file.

done:
	mov r9, rdi				;	Move `rdi` into a spare register so that print_num and syscall won't clobber it.

	print_num rax			;	Print part 1: the final paren total.
	print_char tab			;	Space the answers apart.
	print_num r9			;	Print part 2: the first basement visit.

	print_char newline		;	Pad with a newline before exiting.

exit:
	mov rax, 0x3c			;	syscall for sys_exit is now 60.
	mov rdi, 0				;	Returns 0.
	syscall					;	Call the kernel to exit the program.
```

```$ day_01/day_01.bin Inputs/Day_01_Input.txt
1797    280
```

We are now in 64-bit mode, and I intend to stay there for the rest of Advent of Code.

## Version 2.4: No-Clobber Macros

We now have working 64-bit code and a working `print_num` macro.  This macro means we can print the final result at the end of a function - but, due to clobbering, we can't use it *inside* of a function, at least not if that function has anything important in any of the registers `print_num` calls, or any of the ones `syscall` clobbers.  Having to awkwardly move `rdi` into `r9` in the preceding code is a good example of that, and not being able to debug is another good example.  So, we need a way to preserve and restore the current state of the registers before calling the macro, and since we'll be doing that for every register-altering macro, that preserve and restore functionality ought to be macros themselves.

The most obvious way is to make a macro which pushes every single register - except for `rbp` and `rsp`, since those are the stack pointers - onto the stack, and a second macro which pops them off the stack in reverse order.

```x86asm
%macro save_regs 0
	push rax
	push rbx
	push rcx
	...
	push r13
	push r14
	push r15
%endmacro

%macro load_regs 0		;	The caller must ensure that the stack is in the same state as during 'save_regs`.
	pop r15					;	Registers are popped in reverse order.
	pop r14
	pop r13
	...
	pop rcx
	pop rbx
	pop rax
%endmacro
```

But there are three problems with the 'save everything' approach:

- It's wasteful; most of these registers are not registers actually moved or changed by `print_num`, so saving them just wastes CPU cycles.
- It prevents macros from saving or outputting values to registers if we want them to.
- It prevents macros from accessing anything on the stack.

Ideally, the save and restore macros would only save and restore the arguments we're actually going to modify.  Since there are 16 general-purpose registers (14 of them usable), we could overload `save_regs` and `load_regs` 13 times each:

```x86asm
%macro save_regs 1
	push %1
%endmacro

%macro save_regs 2
	push %1
	push %2
%endmacro

%macro save_regs 3
	push %1
	push %2
	push %3
%endmacro

...
```

But that also feels more inefficient than necessary, and doesn't solve the general problem of wanting to save any intermediate states or values, not just registers.  It's possible to define one macro with a variable number of parameters; if that's the case, parameter reference %0 will be equal to the parameter count.  The NASM manual helpfully states:

> [Argument `%0`] can be used as an argument to `%rep` (see section 4.5) in order to iterate through all the parameters of a macro.  Examples are given in section 4.3.6.

And here, unfortunately, I read section 4.3.6, and it read:

> **4.3.6 `%rotate`: Rotating Macro Parameters**  
>
> Unix shell programmers will be familiar with the `shift` shell command, which allows the arguments passed to a shell script (referenced as `$1`, `$2` and so on) to be moved left by one place, so that the argument previously referenced as `$2` becomes available as `$1`, and the argument previously referenced as `$1` is no longer available at all.  
>
> NASM provides a similar mechanism, in the form of `%rotate`. As its name suggests, it differs from the Unix `shift` in that no parameters are lost: parameters rotated off the left end of the argument list reappear on the right, and vice versa.  
>
> `%rotate` is invoked with a single numeric argument (which may be an expression). The macro parameters are rotated to the left by that many places. If the argument to `%rotate` is negative, the macro parameters are rotated to the right.  
>
> So a pair of macros to save and restore a set of registers might work as follows:  
>
```x86asm
%macro multipush 1−*
	%rep %0
		push %1
	%rotate 1
	%endrep
%endmacro
```

Naturally, an equivalent `multipop` works exactly the same way, and even has the same argument order, thanks to `%rotate -1` going through the list in reverse order:

```x86asm
%macro multipop 1−*
	%rep %0
	%rotate -1
		push %1
	%endrep
%endmacro
```

I did not go to the manual expecting or hoping for an immediate answer, and I'm trying to avoid copying others' code as much as possible...but this solution is so obviously the right solution that I can't unread it.  So, let's steal it - and, since we're going to use these macros in virtually every program we right, let's store them in an `includes.inc` file, which the NASM manual recommends.

```x86asm
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Macro:		multipush                                                    ;
; Arguments:	Any number of discrete pieces of memory.                     ;
; Description:	Push all arguments onto the stack, one-by-one.               ;
; Comments:                                                                  ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

%macro multipush 1-*
	%rep %0				;	Repeats the code %0 times, where %0 is the parameter count.
		push %1			;	Pushes the first parameter onto the stack.
	%rotate 1			;	Rotates the parameter list, so that %2 is now %1, etc.
	%endrep				;	Ends the repetition.
%endmacro

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Macro:		multipop                                                     ;
; Arguments:	Any number of discrete pieces of memory.                     ;
; Description:	Push all arguments onto the stack, one-by-one.               ;
; Comments:		Arguments are given in the same order as 'multipush'.        ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

%macro multipop 1-*
	%rep %0				;	Repeats the code %0 times, where %0 is the parameter count.
	%rotate -1			;	Rotates the parameter list backwards, so that %n is now %1, %1 is now %2, etc.
		pop %1			;	Pops the first parameter off the stack.
	%endrep				;	Ends the repetition.
%endmacro
```

Now that we have these, let's incorporate them into `print_char`:

```
%macro print_char 1
	multipush rax, rdi, rsi, rdx, rcx, r8, r11
	mov rax, 1				;	System call for Write is 1.
	mov rdi, 1				;	Flag for STDOUT is 1.
	mov rsi, %1				;	Move the parameter passed in to `rsi`.
	mov rdx, 1				;	Only one byte.
	syscall					;	Call the kernel to write out the character.
	multipop rax, rdi, rsi, rdx, rcx, r8, r11
%endmacro
```

`multipush` is much better than `save_regs`; we're now only storing those registers we're actually going to use or affect in the macro.  But, of our three original problems with the no-clobber macros, there are still one and a half problems left:

- It prevents macros from saving or outputting values to registers if we want them to.
- It prevents macros from accessing anything on the stack.

We can now print a character whose memory location is pointed to by a register...but only if that register is not `rax`, `rdi`, or `rsi` (since we override those *before* accessing the parameter) or `rbp` or `rsp` (since the stack pointer changes when we `multipush`).  This is still pretty restrictive!  Sure, we're at least not overwriting `rax` et al., but we can't use three of our 14 writeable general-purpose registers.  

So, for now, we'll have to settle for a somewhat uglier approach.  We'll push `rsi` onto the stack, pull the parameter into `rsi`, and then push everything else.  This *still* won't preserve the stack pointers - we can't pass in `rbp` or `rsp` - but if we wanted to save those values to registers, we'd need to have two registers empty, and to guarantee their emptiness, we'd need to back up *those* registers onto the stack, overwriting `rbp` and `rsp` anyway.  I don't currently know how to solve that without the extremely slow process of saving the registers into pre-defined slots of memory.  The NASM manual talks later about **stack contexts**; the x86-64 manual talks about **stack frames** with instructions `ENTER` and `RET`; both talk about the `lea` instruction allowing register swaps without an intermediate.  All of them are probably relevant, and I'm sure the whole thing is doable, but it's a bridge too far at the moment.

For now, we'll simply make a rule that stack pointers can't be passed into macros.  If, down the line, we figure out how to lift that restriction, the existing code we write should still be backwards-compatible.

```x86asm
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Macro:		print_char                                                   ;
; Arguments:	A single pointer to an ASCII character in memory.            ;
; Description:	Prints an ASCII character to STDOUT.                         ;
; Comments:		Will fail if given `rbp` or `rsp` as inputs.                 ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

%macro print_char 1
	push rsi				;	Save `rsi`, before we clobber it.
	mov rsi, %1				;	Move the parameter passed in to `rsi`.
	multipush rax, rdi, rdx, rcx, r8, r11
	mov rax, 1				;	System call for Write is 1.
	mov rdi, 1				;	Flag for STDOUT is 1.
							;	`rsi` is already set.
	mov rdx, 1				;	Only one byte.
	syscall					;	Call the kernel to write out the character.
	multipop rax, rdi, rdx, rcx, r8, r11
	pop rsi
%endmacro
```

Before we use it, let's write a very basic **unit test**.  Now that we have `%rep`, we don't have to write a separate test for every single register - we can pass all non-stack registers in in one macro call.  The test will be to store the number `47` in a register, print the character `h`, and then print that number, followed by a space.  The result should be 14 repetitions of the number `h47`, separated by a space; if it's not, then one of these registers was clobbered.

```x86asm
; Temporary Unit Test for 'multisave' and 'print_char'
%include "includes.inc"

BITS 64

section .macros

%macro test_multisave 1-*
	%rep %0
		mov %1, 47
		print_char space
		print_num %1
		print_char newline
	%rotate 1
	%endrep
%endmacro

section .data
	newline		dq 0x10		;	ASCII code for a newline.
	space		dq 0x30		;	ASCII code for a space.
	
section .bss

section .text
global _start 
_start:
	pop rdi					;	argc: The argument count.  Will always be 2, if we're only reading one file.
	pop rdi					;	argv[0]: The first argument, always the program name.
	pop rdi					;	argv[1]: The second argument, the filename.

test_multisave rax, rbx, rcx, rdx, rdi, rsi, r8, r9, r10, r11, r12, r13, r14, r15

exit:
	mov rax, 0x3c			;	syscall for sys_exit is now 60.
	mov rdi, 0				;	Returns 0.
	syscall					;	Call the kernel to exit the program.
```

```$ day_01/tmp_test.bin
h47 h47 h47 h47 h47 h47 h47 h47 h47 h47 h47 h47 h47 h47
```

It works!  We now have a framework to make macros that don't clobber any registers, and can be inserted anywhere in the program without interference.

## Version 2.5: Building a Better `print_num`

And with that, it's not too difficult to make a version of `print_num` which accepts negative integers as inputs:

1. Check if the number is negative by comparing it with `cmp` to `0`.  If positive (or 0), as found by `jge`, go to step 4.
2. If it is, print a dash (ASCII code `0x2D`).  This is why we need the zero check; without it, we'd print `-0`.
3. Replace the number with its two's complement.
4. Print out the resulting positive number.

And while we're at it, we can save space by using `print_char` instead of manually performing a system call every time.

```x86asm
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Macro:		print_num                                                    ;
; Arguments:	The *value* (not pointer to a value) to be printed.          ;
; Description:	Prints a number to STDOUT in base 10.                        ;
; Comments:		Will fail if given `rbp` or `rsp` as inputs.                 ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

%macro print_num 1
	push rax				;	Save `rax`, before we clobber it.
	mov rax, %1				;	Moves the number we want to print into `rax`.
	multipush rbx, rcx, rdx, rdi
	mov rcx, 0				;	Initialize `rcx` to prepare for digit count.

	%%neg_check:
		cmp rax, 0			;	Subtract the input from 0, but don't store the result, only the flags.
		jge %%push_dig		;	If the input is greater than or equal to 0 (g-e), jump to %%push_dig.

		push 0x2D			;	Push the ASCII code for "-" onto the stack.
		mov rdx, rsp		;	Copies the stack pointer to `rdi`, since we can't pass it into 'print_char'.
		print_char rdx		;	Passes the pointer to the location of "-" in memory to 'print_char'.
		pop rdx				;	Pop the ASCII code for "-" back out, to restore the stack.
		neg rax				;	Take the two's complement of `rax`, and proceed as normal with a positive number.

	%%push_dig:
		mov rdx, 0			;	Clear `rdx`, since `rdx` acts as the top 64 bits for 'div'.
		mov rbx, 10			;	Move the dividend into a register; won't work as a raw 'div 10' command, even though 'add' works that way.
		div rbx				;	Divide the buffer size by the dividend (10).  Quotient is stored in `rax`, remainder is stored in `rdx`.
		add rdx, 0x30		;	Add 0x30 (48 in decimal) to convert the remainder into an ASCII digit from 0-9.

		push rdx			;	Push the entire register containing the remainder onto the stack.
		inc rcx				;	Increment the count.

		test rax, rax		;	Tests how large the quotient is, setting ZF to whether `rax` is 0.
		jnz %%push_dig		;	If the quotient is not yet 0 (checking ZF), continue pushing digits onto the stack.

	%%print_dig:
		mov rdi, rsp		;	Copies the stack pointer to `rdi`, since we can't pass it into 'print_char'
		print_char rdi		;	Prints the digit (already converted into ASCII) to STDOUT.

		pop rax				;	Pop the digit off the stack into `rax`
		dec rcx				;	One fewer digit in the count.
		test rcx, rcx		;	Tests how many digits remain, setting ZF to whether `r10` is 0.
		jnz %%print_dig		;	If any digits remain, continue printing.

	multipop rbx, rcx, rdx, rdi
	pop rax
%endmacro
```

I'm not completely happy with the need to push a character like `-` onto the stack every time we want to print a char literal in a macro, but `print_num` is now good enough to be slotted back into our original code with no changes:

```
$ day_01/day_01.bin Inputs/Day_01_Input.txt
1797    280
```

And the nice thing about having separate macros is that they can be changed later; so long as the end-user behavior remains the same, we can modify one single `includes.inc` file and nothing else when we go back later and improve it.

## Version 2.6: Arbitrary File Size

We have two more problems to solve with this code, and the first is the fact that we're currently limited to files no larger than 8192 bytes.  It is true that for this *specific* day, all files are the same size, at exactly 7,000 bytes.  But it's also true that we'll need to handle larger file sizes than this down the road.  We could easily increase from 8192 to some larger number, but Jonathan Leto recommended 8192 bytes for a reason, and that reason probably has something to do with page size and cache memory size, both of which are concepts I have only a nebulous understanding of.

So, rather than taking the easy way out, let's load and process the file in chunks, properly.  Successive `read()` calls on the same file_descriptor from the same process ID should, if I understand Linux filesystems correctly, result in successive chunks of the file being read into memory, so we only need to rearrange the code such that the same `read()` command can be run again and again.

```x86asm
%include "includes.inc"

BITS 64

section .data
	...
	bufsize		dq 0x2000	;	8192 in hexadecimal.  Optimal buffer size for reading, apparently.
	
section .bss
	buf			resb 0x2000	;	Reserves 8192 bytes for the filebuffer, without assigning them.

section .text
global _start 
_start:
	pop rdi					;	argc: The argument count.  Will always be 2, if we're only reading one file.
	pop rdi					;	argv[0]: The first argument, always the program name.
	pop rdi					;	argv[1]: The second argument, the input filename.

file_descriptor:
	mov rax, 2				;	syscall for sys_open is now 2.
							;	The input filename is already in `rdi`.
	mov rsi, 0				;	Flag for 'read-only', defined in fcntl.h.
	syscall					;	Call the kernel to open the file.

	test rax, rax			;	Tests file descriptor (in this case, we only care about the sign flag).
	mov rbx, rax			;	Save the file descriptor in `rbx`.
	jns file_read			;	If the file descriptor does not have the sign flag, jump to file_load.

	mov rdi, rax			;	We didn't jump, so there must have been an error.
	mov rax, 0x3c			;	syscall for sys_exit is now 60.
							;	Return flag is already set to `rdi`
	syscall					;	Call the kernel to exit the program.

file_read:
.initialize:
	mov rax, 0				;	Initialize the current paren total in `rax` to 0, for part 1.
	mov rdi, 0				;	Initialize the position of the first basement visit to -1, for part 2.
	mov rdx, 0				;	Clear `rdx`, so that we can use it for lower-byte comparison.

	mov r8, -1				;	Clear `r8`; it will be the chunk counter.  Set to -1 because we increment it *before* use.

.load_chunk:
	multipush rax, rdi, rsi, rdx

	mov rax, 0				;	syscall for sys_read is now 0.
	mov rdi, rbx			;	Load the file descriptor from `rbx`.
	mov rsi, buf			;	Move the *address* of buf to `rsi`.
	mov dx, [bufsize]		;	Move the *address* of bufsize to `rdx`.
	syscall					;	Call the kernel to read the file.

file_parse:
	mov rcx, rax			;	Move the number of bytes actually loaded to `rcx`, to compare `rsi` against during .loop.
	inc r8					;	Increment the chunk counter.
	test rax, rax			;	Compare the number of bytes loaded to itself, setting ZF if `rax` is zero.
	multipop rax, rdi, rsi, rdx		;	Pop *now*, so that if we jump, we jump with the correct context.
	jz .done				;	If `rax` is zero, stop looping through the file.
	mov rsi, 0				;	Initialize the buffer pointer in `rsi` to 0.  `rsi` is relative to a chunk, not to the file.

.loop:
	cmp rsi, rcx			;	Check if we've run out of bytes.
	je file_read.load_chunk	;	If we have, load the next chunk.

	mov dl, [buf+rsi]		;	Move the current char, defined by original buffer and offset, into the lowest byte of `rdx`.
	inc rsi					;	Increment the buffer pointer.
	cmp rdx, [right_paren]	;	Compare the current char to the ASCII offset for ')'.
	je .right				;	Skip the evaluation of 'left' if it's a right paren.

	.left:
		inc rax				;	Increment the current paren total, for part 1.
		jmp .part_2			;	Go to part 2.
	.right:
		dec rax				;	Decrement the current paren total, for part 1.
		jmp .part_2			;	Go to part 2.  Unnecessary, but makes the code easier for me to follow.

	.part_2:
		cmp rax, -1			;	Check if the current position is -1.
		jne .loop			;	If we're not, continue reading the file.
		test rdi, rdi		;	If we are at -1, compare part 2's answer against itself.  The default of '0' can never be right.
		jnz .loop			;	If `rdi` is not zero, then we've already set it, and this is a duplicate visit.
							;	If `rdi` *is* zero, then this is the first time we've been here, and we need to figure out absolute position.
							;	Luckily, we are only in this branch once ever, so it can be inefficient.
		multipush rax, rdx	;	Save `rax` and `rdx`, since we need them both to get a 'mul' result.
		mov rax, r8			;	Set `rax` to be equal to the chunk count.
		mul dword[bufsize]	;	Multiply `rax` by the buffer size.
		add rax, rsi		;	Add the relative offset to `rax`.
		mov rdi, rax		;	Now that `rax` equals the absolute position, save it as part 2's answer.
		multipop rax, rdx	;	Restore `rax` and `rdx`
	
	jmp .loop				;	Continue reading the file.

.done:
	print_num rax			;	Print part 1: the first basement visit.
	print_char tab			;	Space the answers apart.
	print_num rdi			;	Print part 2: the final paren total.

exit:
	mov rax, 0x3c			;	syscall for sys_exit is now 60.
	mov rdi, 0				;	Returns 0.
	syscall					;	Call the kernel to exit the program.
```

And there we go.  This would have been very difficult, or at least very tedious, without `multipush` and `multipop`.  Loading the file in chunks means that the registers which track the global state of the program (`rax` for part 1's answer, `rdi` for part 2's answer, `r8` for the chunk count, `rbx` for the chunk count) need to be preserved from one chunk to the next, while chunk-local properties (like `rsi`, the local offset) must be reset, and an unmacroed `syscall` to get the next chunk clobbers `rcx`, `r8`, and `r11`, so we can't rely on them unless we make `load_next_chunk` a macro.  Which I don't want to do quite yet, because this logic does not fully separate out the chunk loading from the rest of the code.

The other big change is in `.part_2`, coming from the need to calculate the absolute position from the relative position and the chunk count to get part 2's answer.  I considered using another register to just store the absolute position, to save space and multiplications, but then I realized that setting the answer for part 2 could only happen once ever, so even if it was ten times slower than the part 1 logic (and it's not), that would be a negligible slowdown.

But negligible compared to what?  The final thing I want to do for today's problem is add in some kind of timer, so we can start understanding what is slow and what is fast.

## Version 2.7: Timing

This was mercifully easy, given two facts:

- Every Intel CPU since the Pentium has an onboard clock cycle counter, which increments by one every time an instruction is called.
- I don't care about absolute time all that much.

My CPU, according to my local "About This Computer" page, is an `Intel® Core™ i7-8565U CPU @ 1.80GHz × 8`.  Assuming the clock frequency doesn't vary all that much from 1.80 GHz, I can get a good approximate time (in nanoseconds) by simply dividing the instruction count by 1.8.  And even if I didn't know what my CPU frequency was, the clock cycle count still gives me good relative and proportional information about how long one code segment takes compared to another.  So, with `rdtsc` (`ReaD Time-Step Counter`) and `print_num`, I can make a drop-in timer to place throughout the code:

```x86asm
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Macro:		store_cycle                                                  ;
; Arguments:	The memory location or register to store the clock count.    ;
; Description:	Stores the current CPU cycle count, *not* the system clock.  ;
; Comments:		Will fail if given `rax`, `rdx`, `rbp`, or `rsp` as inputs.  ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

%macro store_cycle 1
	multipush rax, rdx
	rdtsc				;	Store the time-stamp-counter (TSC) into `rdx:rax`.
	shl rdx, 32			;	Shift `rdx` 32 bits left, since `rdx` is where the high bits are stored.
	or rdx, rax			;	Add `rax`, the low bits, to `rdx, the high bits.
	mov %1, rdx			;	Copy `rdx` to the desired location in memory.
	multipop rax, rdx
%endmacro

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Macro:		print_cycle                                                  ;
; Arguments:	The memory location or register of the previous clock count. ;
; Description:	Prints the difference between the current and stored clock   ;
;               counts.  Unit is CPU cycles, not time.                       ;
; Comments:		Will fail if given `rbp` or `rsp` as inputs.                 ;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

%macro print_cycle 1
	multipush rax, rdx
	rdtsc				;	Store the time-stamp-counter (TSC) into `rdx:rax`.
	shl rdx, 32			;	Shift `rdx` 32 bits left, since `rdx` is where the high bits are stored.
	or rdx, rax			;	Add `rax`, the low bits, to `rdx, the high bits.
	sub rdx, %1			;	Subtract the previous clock count from the current one.
	print_num rdx		;	Print the difference between the current and previous clock cycle.
	multipop rax, rdx
%endmacro
```

Running the two macros next to each other, having saved to a register in between, results in an average of 16 clock cycles, so the resolution won't be able to tell us e.g. whether an `add` takes the same amount of time as a `sub`; anything with a resolution below about 20 clock cycles probably will be washed out by noise.  So, some timings, averaged over 10,000 tests:

| Operation                        | Time (Cycles) | Approx. Time      |
|----------------------------------|---------------|-------------------|
| Store a clock cycle (register)   | 16            | 8.9 ns            |
| Store a clock cycle (stack)      | 16            | 8.9 ns            |
| Load empty file chunk            | 1,627         | 903 ns            |
| Store a clock cycle (memory)     | 3,350         | 1,860 ns          |
| Run `.file_descriptor`           | 5,988         | 3,325 ns          |
| Load 7000 byte file chunk        | 6,183         | 3,435 ns          |
| Print single character to STDOUT | 8,148         | 4,526 ns          |
| **Solve problem (Rust)**         | **???**       | **24,000 ns**     |
| Execute loop (part 1 only)       | 80,796        | 44,887 ns         |
| Execute loop (both parts)        | 76,345        | 42,413 ns         |
| Solve problem (part 1 only)      | 96,158        | 53,421 ns         |
| Solve problem (both parts)       | 88,240        | 49,022 ns         |

The first problem is, clearly, that the timing is inconsistent as soon as large-scale memory reads begin: running one or both parts for 10,000 iterations, and then running it again a minute later, produce very different results.  For fairness, and to avoid cherry-picking, I decided to list the first result of 10,000 iterations, only to discover that by chance, the code for both parts ran slightly faster than the code for one part, both with and without file loading.

And the second problem is that a basic solution in Rust is twice as fast as my handwritten assembly.  Rust's compiler is evidently better at assembly than I am.

# Version 3.0: Compiled Rust

This isn't a segment I planned on including when I began writing this blog post...but in light of the timing results, and to finish off the day, it doesn't seem like a bad idea to see how Rust's compiler solved the problem.

```rust
use std::fs;

#[unsafe(no_mangle)]
pub fn main() {
	
	let file = "../Inputs/Day1Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let paren_indices = input_raw.char_indices();
	
	let mut current_pos: isize = 0;
	let mut part2: usize = 0;
	
	for index in paren_indices.into_iter() {
		match index.1 {
			'(' => current_pos += 1,
			')' => current_pos -= 1,
			_ => ()
		};
		if current_pos == -1 && part2 == 0 {
			part2 = index.0 + 1;
		}
	}
	let part1 = current_pos;
		
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
}
```

```x86asm
core::ptr::drop_in_place<std::io::error::Error>::h2d4ab5053582d4e1:
        push    r15
        push    r14
        push    r12
        push    rbx
        push    rax
        mov     rax, qword ptr [rdi]
        mov     ecx, eax
        and     ecx, 3
        cmp     ecx, 1
        je      .LBB0_1
        add     rsp, 8
        pop     rbx
        pop     r12
        pop     r14
        pop     r15
        ret
.LBB0_1:
        lea     rbx, [rax - 1]
        mov     r14, qword ptr [rax - 1]
        mov     r12, qword ptr [rax + 7]
        mov     rax, qword ptr [r12]
        test    rax, rax
        je      .LBB0_3
        mov     rdi, r14
        call    rax
.LBB0_3:
        mov     rsi, qword ptr [r12 + 8]
        test    rsi, rsi
        je      .LBB0_5
        mov     rdx, qword ptr [r12 + 16]
        mov     rdi, r14
        call    qword ptr [rip + __rustc[5224e6b81cd82a8f]::__rust_dealloc@GOTPCREL]
.LBB0_5:
        mov     esi, 24
        mov     edx, 8
        mov     rdi, rbx
        add     rsp, 8
        pop     rbx
        pop     r12
        pop     r14
        pop     r15
        jmp     qword ptr [rip + __rustc[5224e6b81cd82a8f]::__rust_dealloc@GOTPCREL]
        mov     r15, rax
        mov     rsi, qword ptr [r12 + 8]
        test    rsi, rsi
        je      .LBB0_8
        mov     rdx, qword ptr [r12 + 16]
        mov     rdi, r14
        call    qword ptr [rip + __rustc[5224e6b81cd82a8f]::__rust_dealloc@GOTPCREL]
.LBB0_8:
        mov     esi, 24
        mov     edx, 8
        mov     rdi, rbx
        call    qword ptr [rip + __rustc[5224e6b81cd82a8f]::__rust_dealloc@GOTPCREL]
        mov     rdi, r15
        call    _Unwind_Resume@PLT

main:
        push    rbp
        push    r15
        push    r14
        push    rbx
        sub     rsp, 88
        lea     rsi, [rip + .Lanon.fad58de7366495db4650cfefac2fcd61.2]
        lea     rdi, [rsp + 32]
        mov     edx, 23
        call    qword ptr [rip + std::fs::read_to_string::inner::h4fba2bebc12d4adf@GOTPCREL]
        mov     rbx, qword ptr [rsp + 32]
        mov     rax, rbx
        neg     rax
        jo      .LBB1_1
        mov     r14, qword ptr [rsp + 40]
        mov     rax, qword ptr [rsp + 48]
        mov     qword ptr [rsp + 24], 0
        test    rax, rax
        je      .LBB1_6
        add     rax, r14
        xor     ecx, ecx
        xor     edx, edx
        mov     r8, r14
        xor     esi, esi
        jmp     .LBB1_13
.LBB1_27:
        sub     rdx, rdi
        add     rdx, r8
        cmp     r8, rax
        je      .LBB1_7
.LBB1_13:
        mov     rdi, r8
        movzx   r10d, byte ptr [r8]
        test    r10b, r10b
        js      .LBB1_14
        lea     r8, [rdi + 1]
        mov     r9d, r10d
        cmp     r9d, 40
        jne     .LBB1_23
        jmp     .LBB1_28
.LBB1_14:
        mov     r9d, r10d
        and     r9d, 31
        movzx   ebp, byte ptr [rdi + 1]
        and     ebp, 63
        cmp     r10b, -33
        jbe     .LBB1_15
        movzx   r11d, byte ptr [rdi + 2]
        shl     ebp, 6
        and     r11d, 63
        or      r11d, ebp
        cmp     r10b, -16
        jb      .LBB1_17
        lea     r8, [rdi + 4]
        movzx   r10d, byte ptr [rdi + 3]
        and     r9d, 7
        shl     r9d, 18
        shl     r11d, 6
        and     r10d, 63
        or      r10d, r11d
        or      r9d, r10d
        cmp     r9d, 40
        jne     .LBB1_23
        jmp     .LBB1_28
.LBB1_15:
        lea     r8, [rdi + 2]
        shl     r9d, 6
        or      r9d, ebp
        cmp     r9d, 40
        je      .LBB1_28
.LBB1_23:
        cmp     r9d, 41
        jne     .LBB1_24
        dec     rcx
.LBB1_24:
        cmp     rcx, -1
        je      .LBB1_25
        jmp     .LBB1_27
.LBB1_17:
        lea     r8, [rdi + 3]
        shl     r9d, 12
        or      r9d, r11d
        cmp     r9d, 40
        jne     .LBB1_23
.LBB1_28:
        inc     rcx
        cmp     rcx, -1
        jne     .LBB1_27
.LBB1_25:
        test    rsi, rsi
        jne     .LBB1_27
        lea     rsi, [rdx + 1]
        mov     qword ptr [rsp + 24], rsi
        jmp     .LBB1_27
.LBB1_6:
        xor     ecx, ecx
.LBB1_7:
        mov     qword ptr [rsp + 80], rcx
        lea     rax, [rsp + 80]
        mov     qword ptr [rsp + 8], rax
        mov     rax, qword ptr [rip + core::fmt::num::imp::<impl core::fmt::Display for isize>::fmt::he819bb13af8d3dfe@GOTPCREL]
        mov     qword ptr [rsp + 16], rax
        lea     rax, [rip + .Lanon.fad58de7366495db4650cfefac2fcd61.5]
        mov     qword ptr [rsp + 32], rax
        mov     qword ptr [rsp + 40], 2
        mov     qword ptr [rsp + 64], 0
        lea     r15, [rsp + 8]
        mov     qword ptr [rsp + 48], r15
        mov     qword ptr [rsp + 56], 1
        lea     rdi, [rsp + 32]
        call    qword ptr [rip + std::io::stdio::_print::h86bf21ce6e231958@GOTPCREL]
        lea     rax, [rsp + 24]
        mov     qword ptr [rsp + 8], rax
        mov     rax, qword ptr [rip + core::fmt::num::imp::<impl core::fmt::Display for usize>::fmt::h864583d3ee1a01f1@GOTPCREL]
        mov     qword ptr [rsp + 16], rax
        lea     rax, [rip + .Lanon.fad58de7366495db4650cfefac2fcd61.7]
        mov     qword ptr [rsp + 32], rax
        mov     qword ptr [rsp + 40], 2
        mov     qword ptr [rsp + 64], 0
        mov     qword ptr [rsp + 48], r15
        mov     qword ptr [rsp + 56], 1
        lea     rdi, [rsp + 32]
        call    qword ptr [rip + std::io::stdio::_print::h86bf21ce6e231958@GOTPCREL]
        test    rbx, rbx
        je      .LBB1_11
        mov     edx, 1
        mov     rdi, r14
        mov     rsi, rbx
        call    qword ptr [rip + __rustc[5224e6b81cd82a8f]::__rust_dealloc@GOTPCREL]
.LBB1_11:
        add     rsp, 88
        pop     rbx
        pop     r14
        pop     r15
        pop     rbp
        ret
.LBB1_1:
        mov     rax, qword ptr [rsp + 40]
        mov     qword ptr [rsp + 8], rax
        lea     rdi, [rip + .Lanon.fad58de7366495db4650cfefac2fcd61.1]
        lea     rcx, [rip + .Lanon.fad58de7366495db4650cfefac2fcd61.0]
        lea     r8, [rip + .Lanon.fad58de7366495db4650cfefac2fcd61.9]
        lea     rdx, [rsp + 8]
        mov     esi, 43
        call    qword ptr [rip + core::result::unwrap_failed::h9e4c136384b1cfa3@GOTPCREL]
        ud2
        mov     r15, rax
        test    rbx, rbx
        je      .LBB1_4
        mov     edx, 1
        mov     rdi, r14
        mov     rsi, rbx
        call    qword ptr [rip + __rustc[5224e6b81cd82a8f]::__rust_dealloc@GOTPCREL]
        mov     rdi, r15
        call    _Unwind_Resume@PLT
        mov     r15, rax
        lea     rdi, [rsp + 8]
        call    core::ptr::drop_in_place<std::io::error::Error>::h2d4ab5053582d4e1
.LBB1_4:
        mov     rdi, r15
        call    _Unwind_Resume@PLT
        call    qword ptr [rip + core::panicking::panic_in_cleanup::hb7138e7aeec2c1a7@GOTPCREL]

.Lanon.fad58de7366495db4650cfefac2fcd61.0:
        .quad   core::ptr::drop_in_place<std::io::error::Error>::h2d4ab5053582d4e1
        .asciz  "\b\000\000\000\000\000\000\000\b\000\000\000\000\000\000"
        .quad   <std::io::error::Error as core::fmt::Debug>::fmt::h159a2e470f8e16f6

.Lanon.fad58de7366495db4650cfefac2fcd61.1:
        .ascii  "called `Result::unwrap()` on an `Err` value"

.Lanon.fad58de7366495db4650cfefac2fcd61.2:
        .ascii  "../Inputs/Day1Input.txt"

.Lanon.fad58de7366495db4650cfefac2fcd61.3:
        .ascii  "Part 1: "

.Lanon.fad58de7366495db4650cfefac2fcd61.4:
        .byte   10

.Lanon.fad58de7366495db4650cfefac2fcd61.5:
        .quad   .Lanon.fad58de7366495db4650cfefac2fcd61.3
        .asciz  "\b\000\000\000\000\000\000"
        .quad   .Lanon.fad58de7366495db4650cfefac2fcd61.4
        .asciz  "\001\000\000\000\000\000\000"

.Lanon.fad58de7366495db4650cfefac2fcd61.6:
        .ascii  "Part 2: "

.Lanon.fad58de7366495db4650cfefac2fcd61.7:
        .quad   .Lanon.fad58de7366495db4650cfefac2fcd61.6
        .asciz  "\b\000\000\000\000\000\000"
        .quad   .Lanon.fad58de7366495db4650cfefac2fcd61.4
        .asciz  "\001\000\000\000\000\000\000"

.Lanon.fad58de7366495db4650cfefac2fcd61.8:
        .asciz  "/app/day_01.rs"

.Lanon.fad58de7366495db4650cfefac2fcd61.9:
        .quad   .Lanon.fad58de7366495db4650cfefac2fcd61.8
        .asciz  "\020\000\000\000\000\000\000\000\021\000\000\0006\000\000"

DW.ref.rust_eh_personality:
        .quad   rust_eh_personality
```

Looking at the output (helpfully compiled by Godbolt), it would take me probably as long to comment it thoroughly and understand it as it has to write the entirety of this blog post up until now.  But there are a few things I notice when reading through this compiled code:

- The very beginning of the memory deallocation code, at the start of the file, is a recognizable analog to `multipush` and `multipop`; Rust's compiler obviously does not need macros, but if it did, the code would start `multipush rbx, r12, r14, r15`.
- It uses `call` extensively, including calling a procedure specified by the `rax` register.
- `call` often uses a register called `rip`, which appears to be the instruction pointer.  This register is always offset by some amount, e.g. `[rip + std::io::stdio::_print::h86bf21ce6e231958@GOTPCREL]`, but I'm not sure why it's offset by the current instruction pointer rather than just `call`ing the procedure directly.
- I was quite careful not to modify the stack pointer `rsp`, nor refer to anything on the stack aside from the very top of it via `pop`, but apparently `sub rsp` and `mov r14, qword[rsp + 40]` are both perfectly acceptable commands, and perhaps the standard way of storing 'variables'.
- There are no direct references to data stored in memory; no equivalents of my `[buf+rsi]`.  Every single call is either a register plus a constant, or the instruction pointer plus some reference to core Rust functions.  However it's referencing the raw characters stored in the input file, it's not doing so one byte at a time.
- It *is*, however, doing the parenthesis comparisons one byte at a time, since `.LBB1_15`, `.LBB1_23`, and `.LBB1_17` all reference the ASCII codes for right or left parentheses.  Which means that if there's a way to precalculate all 2^8 = 256 possible combinations of left and right parens, and load in the memory eight bytes at a time instead of just one, it might be possible to go faster.


I can't say I understand it all, but I can't say I understand nothing.  Not bad for my first 'day' in assembly.