---
title: Learning Rust via 2015 Advent of Code
author: David & Felipe
date: 2021-01-04 00:00:00 -0500
categories: [Advent of Code, "2015"]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
---

The goal: learn Rust via the error messages, by working through 2015's Advent of Code problems, one at a time.

**David**: I have absolutely no experience with Rust, or for that matter any language lower-level than C++.  I normally use Mathematica, which is about as high-level and loosely typed as it gets, so I know next to nothing about low-level languages or garbage collection or strict typing, let alone borrow checkers.  Joel Sposky wrote in 2005 about how [some types of programmers used to high level languages struggle with pointers](https://www.joelonsoftware.com/2005/12/29/the-perils-of-javaschools-2/), and Eric Sink wrote in 2015 about how [Rust is another level of difficulty beyond that](https://ericsink.com/entries/rust1.html).  I am precisely the kind of naive programmer those two were talking about, so jumping headfirst into this project ought to be fun.

Programming books are for people with patience.  I've done every problem in Mathematica, so I know the algortihms and can make as many test cases as I need to ensure the code's working.  What I don't know is Rust.  I'm going to open the documentation, try some code, have the compiler yell at me, and try again.

# [Day 1](https://www.adventofcode.com/2015/day/1)

The problem: you're given a number of parentheses, with `(` representing `+1` and `)` representing `-1`.

Part 1: Starting at `0` and the first parenthesis, find the total.

Part 2: Find the earliest instance in which the subtotal (starting at `0` and the first parenthesis) is `-1`.

----

## David

The algorithm is simple enough it's hard to describe without simply repeating the problem.  The implementation will be the hard part.

Step 0: importing the data to begin with.  I want an array of characters, so the best bet is to import as a string, convert to a character array, and then index my way through.

**Attempt 0.0:**

```rust
use std::fs;
fn main() {
	let str: INPUT_RAW = fs::read_to_string("../../../Day1Input.txt");
}
```
```
error[E0412]: cannot find type `INPUT_RAW` in this scope

let str: INPUT_RAW = fs::read_to_string("../../../Day1Input.txt");
         ^^^^^^^^^ not found in this scope
```
I suspect I messed up the order of `let`, so let's try that again.


**Attempt 0.1:**

```rust
use std::fs;
fn main() {
	let INPUT_RAW: str = fs::read_to_string("../../../Day1Input.txt");
}
```
```
error[E0308]: mismatched types

let INPUT_RAW: str = fs::read_to_string("../../../Day1Input.txt");
               ---   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected `str`, found enum `std::result::Result`
```

I think I have the `let` syntax right this time, but apparently `read_to_string()` doesn't produce a `str`.  Reading a little further, I see that `str` and `String` are actually two different data types, so I'll try that.

**Attempt 0.2:**

```rust
use std::fs;
fn main() {
	let INPUT_RAW: String = fs::read_to_string("../../../Day1Input.txt");
}
```
```
error[E0308]: mismatched types

let INPUT_RAW: String = fs::read_to_string("../../../Day1Input.txt");
               ------   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected struct `String`, found enum `std::result::Result`
               |
               expected due to this
```

Two pieces of information here.  The first is that the type being returned is not any type of string but `std::result::Result`.  I can see that [the documentation for `read_to_string()`](https://doc.rust-lang.org/std/fs/fn.read_to_string.html) is embedded in a function which returns a `Result`, so maybe `read_to_string()` returns a `Result` and won't work inside a function that doesn't return one?  

Looking further, it seems that `read_to_string()` returns `Result` indicating whether or not the function succeeded in importing.  I'm reasonably certain that this file I manually placed in is indeed present (and if it isn't, then the program is gonig to fail regardless), and I don't know whether or not a kernel panic is 'worse' in some sense than throwing a regular error for a program this small.  It seems that `unwrap()` gets the interior of a successful `Result`, so I'll tell Rust to assume that the result is succesful and worry about error catching later.

**Attempt 0.3:**

```rust
use std::fs;
fn main() {
	let input_raw: String = fs::read_to_string("../../Day1Input.txt").unwrap();
}
```
```
warning: variable `INPUT_RAW` should have a snake case name

let INPUT_RAW: String = fs::read_to_string("../../../Day1Input.txt").unwrap();
    ^^^^^^^^^ help: convert the identifier to snake case: `input_raw`

= note: `#[warn(non_snake_case)]` on by default
```
A warning is certainly better than an error message; and this looks easy enough to fix.  Still, I can definitely feel the culture shock; coming from Mathematica, where anything and everything can be used as a variable name, the idea of throwing a warning if my strings aren't cased normally is a different experience.

**Attempt 0.4:**

```rust
use std::fs;
fn main() {
	let input_raw: String = fs::read_to_string("../../Day1Input.txt").unwrap();
	println!("Raw Input: {}", input_raw);
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.21s
```

Step 0 complete.  The file has been imported as a string.

**Attempt 1.0:**

Next step: get a character array that I can index my way through.  [The Rust documentation](https://doc.rust-lang.org/std/primitive.str.html#method.char_indices) says that `char_indices` is exactly the function I'm looking for.  The big difference from my own experience is in what the function returns.  A function like this in Mathematica would return a list of tuples: `[[1,'('], [2, ')'], ...]`, and it'd load the entire file into the variable that way before returning anything.  In Rust, however, the function is an `iterator`; a function which yields tuples one at a time, and which presumably doesn't load the entire file into the variable first.  Since I only need to go through the file once, this is quite convenient.

```rust
use std::fs;
fn main() {
	let input_raw: String = fs::read_to_string("../../Day1Input.txt").unwrap();
	let mut paren_indices = input_raw.char_indices();
	let mut current_pos: u64 = 0;
	
	for index in paren_indices.into_iter() {
		match index.1 {
			"(" => current_pos += 1,
			")" => current_pos -= 1,
		};
	}
}
```
```
error[E0308]: mismatched types

match index.1 {
      ------- this expression has type `char`
    "(" => current_pos += 1,
    ")" => current_pos -= 1,
    ^^^ expected `char`, found `&str`
```

That's interesting; it seems that double quotes are implicitly used for `str`, and single quotes are implicitly used for `char`.  Good to know.  And it also seems like I'll be seeing `error[E0308]` quite frequently, at this rate.

**Attempt 1.1:**

```rust
use std::fs;
fn main() {
	let input_raw: String = fs::read_to_string("../../Day1Input.txt").unwrap();
	let mut paren_indices = input_raw.char_indices();
	let mut current_pos: u64 = 0;
	
	for index in paren_indices.into_iter() {
		match index.1 {
			'(' => current_pos += 1,
			')' => current_pos -= 1,
		};
	}
}
```
```
error[E0004]: non-exhaustive patterns: `'\u{0}'..='\''`, `'*'..='\u{d7ff}'` and `'\u{e000}'..='\u{10ffff}'` not covered

match index.1 {
      ------- this expression has type `char`
    "(" => current_pos += 1,
    ")" => current_pos -= 1,
    ^^^ expected `char`, found `&str`
```

Unlike Mathematica's `Which[]` statement, this will return an error if there is no match, rather than doing nothing.  I could use an `if` statement, but I think `match` looks cleaner here, and I want to learn how to do a no-op in Rust anyhow.

**Attempt 1.2:**

```rust
use std::fs;
fn main() {
	let input_raw: String = fs::read_to_string("../../Day1Input.txt").unwrap();
	let mut paren_indices = input_raw.char_indices();
	
	let mut current_pos: u64 = 0;
	let mut part1: u64 = 0;
	let mut part2: u64 = 0;
	
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
}
```
```
error[E0308]: mismatched types

part2 = index.0;
        ^^^^^^^ expected `u64`, found `usize`

help: you can convert an `usize` to `u64` and panic if the converted value wouldn't fit
part2 = index.0.try_into().unwrap();
```

The no-op worked.  It seems that indexes of slices of something return `usize` rather than `u32` or `u64`, to make sure that code compiles both on 32-bit and 64-bit machines.  Since I know that the input is much smaller than 2^32 bytes, that's fine by me.

**Attempt 1.3:**
```rust
use std::fs;
fn main() {
	let input_raw: String = fs::read_to_string("../../Day1Input.txt").unwrap();
	let mut paren_indices = input_raw.char_indices();
	
	let mut current_pos: usize = 0;
	let mut part1: usize = 0;
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
}
```
```
error[E0600]: cannot apply unary operator `-` to type `usize`

if current_pos == -1 && part2 == 0 {
                  ^^ cannot apply unary operator `-`

= note: unsigned values cannot be negated
```

Now we're getting way out of my depth.  The idea that `-1` would be treated as a number with a unary operator applied to it rather than just an integer is alien to me, so I forgot that an unsigned integer can't ever be negative in the first place.  `current_pos` and `part_1` can both be negative, so I want to turn them into signed integers, and `part_2`.

Going with `isize`, however, produces the edge case that if there are more than 2 billion parentheses and I were running this on a 32-bit machine, the integer could overflow or underflow.  I can't say I'm overly worried about this, given that my input file is 7 kB, but I'll check the file size anyway and throw an error if it's larger than the largest size we can store with `isize`.

**Attempt 1.4:**
```rust
use std::fs;
fn main() {
	let file = "../../Day1Input.txt";
	let metadata = fs::metadata(file).unwrap();
	assert!(isize::MAX > metadata.len());
}
```
```
error[E0308]: mismatched types

assert!(isize::MAX > metadata.len());
                     ^^^^^^^^^^^^^^ expected `isize`, found `u64`
                     
help: you can convert an `u64` to `isize` and panic if the converted value wouldn't fit
assert!(isize::MAX > metadata.len().try_into().unwrap());
```

Okay, I should have seen that coming.  `try_into()` seems like a useful function to learn how to use, so I'll include it in my imports list and use it.

**Attempt 1.5:**
```rust
use std::fs;
use std::convert::TryInto;

fn main() {
	let file = "../../Day1Input.txt";
	let metadata = fs::metadata(file).unwrap();
	assert!(isize::MAX > metadata.len().try_into().unwrap());

	let input_raw: String = fs::read_to_string(file).unwrap();
	let mut paren_indices = input_raw.char_indices();
	
	let mut current_pos: isize = 0;
	let mut part1: isize = 0;
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
	part1 = current_pos;
	
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
}
```
```
warning: value assigned to `part1` is never read
warning: variable `paren_indices` does not need to be mutable
```

It compiles now, with just two warnings.

The warning about `part1` not being read is straightforward enough; I'll just get rid of the initial declaration and declare the variable at the end.

The warning about `paren_indices` is interesting, however; I'd assumed that an iterator would need to be mutable, since it matches different values whenever it's called, but I suppose that's handled 'internall' to the iterator, and the object itself is the same whenever I call it.

**Final Version:**
```rust
use std::fs;
use std::convert::TryInto;
use std::time::{Instant};

fn main() {
	let start = Instant::now();
	
	let file = "../../Day1Input.txt";
	let metadata = fs::metadata(file).unwrap();
	assert!(isize::MAX > metadata.len().try_into().unwrap());

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
	
	let end = start.elapsed().as_micros();
	
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
    println!("Time: {} us", end);
}
```
```
Finished release [optimized] target(s) in 0.00s

Part 1: 280
Part 2: 1797
Time: 39 us
```

And the first two stars are acquired!

I didn't feel like I got that far into Rust-specific features or documentation (I didn't once get yelled at by a borrow checker), but since this is day 1 that's probably for the best; too much difficulty in reading.  My Mathematica script for this problem ran (including the import) in 80,000 microseconds, and according to `std::time`, this program (including the import) ran in 40 microseconds when compiled for release, which gives me some idea of why in the world low-level programming languages are worth using for anything other than making high-level programming languages.

And my gut feeling is that I could improve this even further; if I understand it correctly, even this program has `input_raw` reading the entire file into a string before doing anything with it, and enumeration in advance is the precise thing `char_indices()` is meant to avoid.  I'll look into reading a file into characters through a buffer next time there's a problem which can benefit.



