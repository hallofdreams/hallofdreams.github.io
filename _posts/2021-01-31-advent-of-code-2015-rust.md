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
	let str: INPUT_RAW = fs::read_to_string("../Inputs/Day1Input.txt");
}
```
```
error[E0412]: cannot find type `INPUT_RAW` in this scope

let str: INPUT_RAW = fs::read_to_string("../Inputs/Day1Input.txt");
         ^^^^^^^^^ not found in this scope
```
I suspect I messed up the order of `let`, so let's try that again.


**Attempt 0.1:**

```rust
use std::fs;
fn main() {
	let INPUT_RAW: str = fs::read_to_string("../Inputs/Day1Input.txt");
}
```
```
error[E0308]: mismatched types

let INPUT_RAW: str = fs::read_to_string("../Inputs/Day1Input.txt");
               ---   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected `str`, found enum `std::result::Result`
```

I think I have the `let` syntax right this time, but apparently `read_to_string()` doesn't produce a `str`.  Reading a little further, I see that `str` and `String` are actually two different data types, so I'll try that.

**Attempt 0.2:**

```rust
use std::fs;
fn main() {
	let INPUT_RAW: String = fs::read_to_string("../Inputs/Day1Input.txt");
}
```
```
error[E0308]: mismatched types

let INPUT_RAW: String = fs::read_to_string("../Inputs/Day1Input.txt");
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

let INPUT_RAW: String = fs::read_to_string("../Inputs/Day1Input.txt").unwrap();
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
    println!("Time: {} μs", end);
}
```
```
Finished release [optimized] target(s) in 0.00s

Part 1: 280
Part 2: 1797
Time: 39 μs
```

And the first two stars are acquired!

I didn't feel like I got that far into Rust-specific features or documentation (I didn't once get yelled at by a borrow checker), but since this is day 1 that's probably for the best; there will be plenty of time to encounter more varied errors later.  My Mathematica script for this problem ran (including the import) in 80,000 microseconds, and according to `std::time`, this program (including the import) ran in 40 microseconds when compiled for release, which gives me some idea of why in the world low-level programming languages are worth using for anything other than making high-level programming languages.

And my gut feeling is that I could improve this even further; if I understand it correctly, even this program has `input_raw` reading the entire file into a string before doing anything with it, and enumeration in advance is the precise thing `char_indices()` is meant to avoid.  I'll look into reading a file into characters through a buffer next time there's a problem which can benefit.

# [Day 2](https://www.adventofcode.com/2015/day/2)

The problem: you're given a list of dimensions of the form `lxwxh` for an integer length `l`, a width `w`, and a height `h`.

Part 1: Find the total of the surface area plus the area of the smallest side of each rectangular prism .

Part 2: Find the total of the smallest perimeter of any face plus the cubic volume on each rectangular prism.

----

## David

Another very straightforward problem.  Like day 1, the problem can be solved in a single pass through the file, with no need to store anything in memory.  I was going to try `BufReader` to read the file line by line, but reading it, it seems that the file is just too short to be worth the extra overhead.

**Attempt 0.0:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.split("/n");
	for line in lines {
		let mut dims = line.split('x').collect::<Vec<&str>>();
		println!("{:?}", dims); // To make sure the previous line worked.
	}
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.00s
 Running `target/debug/day_1`
```

I was not expecting that to work the first time, but so far so good: I have for each line a vector of strings corresponding to the numerical dimensions.  The next step is to turn those strings into unsigned integers.

**Attempt 0.1:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	for line in lines {
		let dims = line
					.split('x')
					.parse::<usize>
					.collect::<Vec<_>>();
		let length = dims.0;
		println!("Length: {}", length);
	}
}
```
```
error[E0609]: no field `parse` on type `std::str::Split<'_, char>`

.parse::<usize>
^^^^^ unknown field
```

Okay, pretty sure the error there was that I forgot parentheses; the turbofish notation (`::<...>`) that specifies type is appended to the function name, but does not replace the parens for the arguments or lackthereof.

**Attempt 0.2:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	for line in lines {
		let dims = line
					.split('x')
					.parse::<usize>()
					.collect::<Vec<_>>();
		let length = dims.0;
		println!("Length: {}", length);
	}
}
```
```
error[E0599]: no method named `parse` found for struct `std::str::Split<'_, char>` in the current scope

.parse::<usize>()
^^^^^ method not found in `std::str::Split<'_, char>`
```

Okay, it looks like I'm calling `.parse()` on an iterator; I need to map `parse` over the iterator before it'll work, and then I can `collect` the results at the end.
Oh, and lest I forget, `.parse()` returns a `Result`, not a value, so I need to `unwrap()` it before I continue.

**Attempt 0.3:**

```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let length = dims.0;
		println!("Length: {}", length);
	}
}
```
```
error[E0609]: no field `0` on type `Vec<usize>`
let first = dims.0;
                 ^ unknown field
```

Interesting: it looks like `.0` works for tuples but not `Vec`.  That's an easy fix, at least.

**Attempt 0.4:**

```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let length = dims[0];
		println!("Length: {}", length);
	}
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.27s
 Running `target/debug/day_1`
```

It works!  I now can pass through the file, collecting each number in an array as I go; all I have to do is replace the `println!()` argument with the actual requirements of the problem.  First, let me make sure that vector definition works the way I think it does.

**Attempt 1.0:**

```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let l = dims[0];
		let w = dims[1];
		let h = dims[2];
		
		let areas = vec![l*w, l*h, w*h];
		let perims = vec![2*l+2*w, 2*l+2*h, 2*w+2*h];
	}
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.28s
```

I'm almost surprised that it's able to infer the type of the vectors from the type of the components, given that you can easily make something larger than a `usize` by adding or multiplying two `usize` integers together; I know that this particular problem isn't going to encounter such difficulties, but it's something to keep in mind.  

Next, I need to find the minimum area, minimum perimeter, and total area.  Like other functions we've seen like `.map()`, `.min()` and `.sum()` both operate on iterators rather than vectors, so we'll need to use `.into_iter()` again.

**Attempt 1.1:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	
	let mut part1: usize = 0;
	let mut part2: usize = 0;
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let l = dims[0];
		let w = dims[1];
		let h = dims[2];
		
		let areas = vec![l*w, l*h, w*h];
		let perims = vec![2*l+2*w, 2*l+2*h, 2*w+2*h];
		
		let volume: usize = l*w*h;
		let min_area = areas.into_iter().min();
		let sum_area = areas.into_iter().sum();
		let min_perim = perims.into_iter().min();
		
		part1 += min_area;
		part1 += sum_area;
		part2 += min_perim;
		part2 += volume;
	}
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
}
```
```
error[E0277]: cannot add-assign `Option<usize>` to `usize`

part1 += min_area;
      ^^ no implementation for `usize += Option<usize>`
```

I know I need `.unwrap()` at minimum (and even that's the lazy way out; I should in practice be doing more detail error checking) for anything that returns a `Result`; I suppose I need to do the same thing for `Option`s.  Since I've created the vectors myself, I know they're not empty, so I don't expect that to cause trouble.  And I only have to do that for `.min()`; `.sum()` returns whatever type it was called on.

**Attempt 1.2:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	
	let mut part1: usize = 0;
	let mut part2: usize = 0;
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let l = dims[0];
		let w = dims[1];
		let h = dims[2];
		
		let areas = vec![l*w, l*h, w*h];
		let perims = vec![2*l+2*w, 2*l+2*h, 2*w+2*h];
		
		let volume: usize = l*w*h;
		let min_area = areas.into_iter().min().unwrap();
		let sum_area = areas.into_iter().sum();
		let min_perim = perims.into_iter().min().unwrap();
		
		part1 += min_area;
		part1 += sum_area;
		part2 += min_perim;
		part2 += volume;
	}
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
}
```
```
error[E0282]: type annotations needed

let sum_area = areas.into_iter().sum();
    ^^^^^^^^ consider giving `sum_area` a type
```

That's unexpected; why was it fine with the types for `.min()` but not `.sum()`?  Looking at [the documentation for min](https://doc.rust-lang.org/core/iter/trait.Iterator.html#method.min) and [the documentation for sum](https://doc.rust-lang.org/core/iter/trait.Iterator.html#method.sum), the only difference I can see is that since I called `.unwrap()` on `.min()`, I got the inside of `Option<Self::Item>` (which was `Self::Item`), but `.sum()` returns `Sum<Self::Item>`.  So, maybe Rust can't infer a type from the inside of a structure.

**Attempt 1.3:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	
	let mut part1: usize = 0;
	let mut part2: usize = 0;
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let l = dims[0];
		let w = dims[1];
		let h = dims[2];
		
		let areas = vec![l*w, l*h, w*h];
		let perims = vec![2*l+2*w, 2*l+2*h, 2*w+2*h];
		
		let volume: usize = l*w*h;
		let min_area = areas.into_iter().min().unwrap();
		let sum_area: usize = areas.into_iter().sum();
		let min_perim = perims.into_iter().min().unwrap();
		
		part1 += min_area;
		part1 += sum_area;
		part2 += min_perim;
		part2 += volume;
	}
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
}
```
```
error[E0382]: use of moved value: `areas`

25  |         let areas = vec![l*w, l*h, w*h];
    |             ----- move occurs because `areas` has type `Vec<usize>`, which does not implement the `Copy` trait
...
29  |         let min_area = areas.into_iter().min().unwrap();
    |                              ----------- `areas` moved due to this method call
30  |         let sum_area: usize = areas.into_iter().sum();
    |                               ^^^^^ value used here after move
```

The errors are getting more interesting now.  Apparently `.into_iter()` actually moves the vector it's calling; I had no idea, because I've so far never used it more than once on the same vector.  I can think of two ways around this: find a way to create an iterator which does not move the vector in the process, or find a way to call both `.min()` and `.sum()` on the same iterator.  I'll try the first option first, calling `.iter()` instead of `.into_iter()` to see if that solves it.

**Attempt 1.4:**
```rust
use std::fs;

fn main() {
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	
	let mut part1: usize = 0;
	let mut part2: usize = 0;
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let l = dims[0];
		let w = dims[1];
		let h = dims[2];
		
		let areas = vec![l*w, l*h, w*h];
		let perims = vec![2*l+2*w, 2*l+2*h, 2*w+2*h];
		
		let volume: usize = l*w*h;
		let min_area = areas.iter().min().unwrap();
		let sum_area: usize = areas.into_iter().sum();
		let min_perim = perims.into_iter().min().unwrap();
		
		part1 += min_area;
		part1 += sum_area;
		part2 += min_perim;
		part2 += volume;
	}
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
}
```
```
error[E0505]: cannot move out of `areas` because it is borrowed
  --> src/main.rs:30:25
   |
29 |         let min_area = areas.iter().min().unwrap();
   |                        ----- borrow of `areas` occurs here
30 |         let sum_area: usize = areas.into_iter().sum();
   |                               ^^^^^ move out of `areas` occurs here
...
33 |         part1 += min_area;
   |                  -------- borrow later used here
```

At long last, I've gotten yelled at by a borrow checker!  So, it's time to read up on [what exactly a borrow checker is, and why it's yelling at me](https://doc.rust-lang.org/reference/expressions/operator-expr.html).  A cursory read seems to say that when I call `.iter()` the first time, it operates on the *references* to the values while `.into_iter()` operates on the values directly. Since I don't explicitly let go of the references in `.iter()`, when the borrow checker sees that `.into_iter()` calls the values that I'm potentially still referencing and moves them, it says that this is not acceptable, and tells me to knock it off.

The easy solution: call `.iter()` both times.  Neither `.min()` nor `.sum()` needs to modify anything, so I have no problem with giving both immutable references to the same thing.  Multiple functions getting immutable references to the same thing appeases the borrow checker; neither one can modify anything, so memory allocation is safe.

**Final Version**
```rust
use std::fs;
use std::time::{Instant};

fn main() {
	let start = Instant::now();
	
	let file = "../Inputs/Day2Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let lines = input_raw.lines();
	
	let mut part1: usize = 0;
	let mut part2: usize = 0;
	for line in lines {
		let dims = line
					.split('x')
					.map(|n| n.parse::<usize>().unwrap())
					.collect::<Vec<_>>();
		let l = dims[0];
		let w = dims[1];
		let h = dims[2];
		
		let areas = vec![l*w, l*h, w*h];
		let perims = vec![2*l+2*w, 2*l+2*h, 2*w+2*h];
		
		let volume: usize = l*w*h;
		let min_area = areas.iter().min().unwrap();
		let sum_area: usize = areas.iter().sum();
		let min_perim = perims.iter().min().unwrap();
		
		part1 += min_area;
		part1 += 2*sum_area;
		part2 += min_perim;
		part2 += volume;
	}
	
	let end = start.elapsed().as_micros();
    println!("Part 1: {}", part1);
    println!("Part 2: {}", part2);
    println!("Time: {} μs", end);
}
```
```
Finished release [optimized] target(s) in 0.00s
 Running `target/release/day_2`
Part 1: 1606483
Part 2: 3842356
Time: 132 μs
```

And there it is - two more stars acquired.  I'm fully aware that I don't completely understand borrowing, ownership, and the distinction between reference and value just yet, but I think I'm making progress in that direction.  The speedup from Mathematica was not as drastic today; Mathematica runs this in 50,000 μs, so Rust "only" gives a ~500-fold speedup; I don't expect we'll get to speedups of 10,000x or more until we get to the MD5 problems, but it's still remarkable to see this kind of speed in action.
