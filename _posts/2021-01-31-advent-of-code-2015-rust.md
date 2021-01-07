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

The algorithm is simple enough it's hard to describe without simply repeating the problem.  The implementation will be the hard part.

Step 0: importing the data to begin with.  I want an array of characters, so the best bet is to import as a string, convert to a character array, and then index my way through.

## Attempt 0.0

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


## Attempt 0.1

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

## Attempt 0.2

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

## Attempt 0.3

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

## Attempt 0.4

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

## Attempt 1.0

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

## Attempt 1.1

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

## Attempt 1.2

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

## Attempt 1.3
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

## Attempt 1.4
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

## Attempt 1.5
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

## Final Version
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

## Attempt 0.0
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

## Attempt 0.1
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

## Attempt 0.2
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

## Attempt 0.3

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

## Attempt 0.4

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

## Attempt 1.0

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

## Attempt 1.1
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

## Attempt 1.2
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

## Attempt 1.3
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

## Attempt 1.4
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

## Final Version
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

# [Day 3](https://adventofcode.com/2015/day/3)

The problem: you're given a number of one-character cardinal directions, with `^` representing `north`, `v` representing `south`, `>` representing `east`, and `<` representing `west`.

Part 1: Starting at `0,0`, find how many grid positions are visited at least once by an agent following all directions.

Part 2: Starting at `0,0`, find how many grid positions are visited at least once by either of two agents, who take turns following all directions.

## David

This problem will be a bit harder than the previous one to run fast, but it shouldn't be too hard to at least get a slow solution going.  The pure brute-force way would be to create a 2D array of booleans, all initialized with `false`, but that feels like the obviously inefficient way to do it, so I'm going to use a `HashMap` instead, along with a counter variable.

First things first, let's make the framework for the direction-parsing, that the rest of the code will be built off.

## Attempt 0.0

```rust
use std::fs;

fn main() {
    let file = "../Inputs/Day3Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let dir_indices = input_raw.chars();
	let mut x: isize = 0;
	let mut y: isize = 0;
	for direction in dir_indices {
		let increment = match direction {
			'^' => (1,0),
			'v' => (-1,0),
			'<' => (0,1),
			'>' => (0,-1),
			_ => (0,0),
		};
		x += increment.0;
		y += increment.1;
	}
	println!("Current position: {}, {}",x,y);
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.22s
 Running `target/debug/day_3`

Current position: -95, -41
```

No error messages yet, because this is all stuff we've done before.  Now we need to add the `HashMap`; I'll try turning `x` and `y` into string, concatenating them with a comma in between, and then using the resulting string as a key.  

## Attempt 0.1

```rust
use std::fs;
use std::collections::HashMap;

fn main() {
    let file = "../Inputs/Day3Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let dir_indices = input_raw.chars();
	let mut x: isize = 0;
	let mut y: isize = 0;
	
	let mut santa_1 = HashMap::new();
	let mut part1: usize = 1;
	
	for direction in dir_indices {
		let increment = match direction {
			'^' => (1,0),
			'v' => (-1,0),
			'<' => (0,1),
			'>' => (0,-1),
			_ => (0,0),
		};
		x += increment.0;
		y += increment.1;
		let k = concat!(x.to_string(), ",", y.to_string());
		if !santa_1.contains_key(k) {
			santa_1.insert(k,true);
			part1 += 1;
		};
	}
	println!("Part 1: {}",part1);
}
```
```
error: expected a literal

let k = concat!(x.to_string(), ",", y.to_string());
                ^^^^^^^^^^^^^       ^^^^^^^^^^^^^
= note: only literals (like `"foo"`, `42` and `3.14`) can be passed to `concat!()`
```

Now that's interesting.  I figured that `.to_string()` would convert to a string, which it does, but it apparently does *not* convert to a string literal.  I don't know the difference between those two things, but [the documentation](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-string-type) says that string literals are immutable and stored inside the binary (such as my `println!()` statement at the end), while Strings are mutable and created within the program, and their contents are not known at compile time.  I know that functions like `println!()` can create new strings from integers on the fly, so poking around, I see that `display()` does the same thing without printing the result, but saving it as a `String`.

## Attempt 0.2

```rust
use std::fs;
use std::collections::HashMap;

fn main() {
    let file = "../Inputs/Day3Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let dir_indices = input_raw.chars();
	let mut x: isize = 0;
	let mut y: isize = 0;
	
	let mut santa_1 = HashMap::new();
	let mut part1: usize = 1;
	
	for direction in dir_indices {
		let increment = match direction {
			'^' => (1,0),
			'v' => (-1,0),
			'<' => (0,1),
			'>' => (0,-1),
			_ => (0,0),
		};
		x += increment.0;
		y += increment.1;
		let k = format!("{},{}", x, y);
		if !santa_1.contains_key(k) {
			santa_1.insert(k,true);
			part1 += 1;
		};
	}
	println!("Part 1: {}",part1);
}
```
```
error[E0308]: mismatched types

if !santa_1.contains_key(k) {
                         ^
                         |
                         expected reference, found struct `String`
                         help: consider borrowing here: `&k`
= note: expected reference `&_`
              found struct `String`
```

This is one of the most helpful error messages I've seen yet, as it directly tells me what to do to fix the problem: replace `.contains_key(k)` with `.contains_key(&k)`.  But before I do that, I want to understand *why*.  From the error message, it's clear that `.insert()` expects a reference, not a `String`, but [the documentation for `HashMap`](https://doc.rust-lang.org/beta/std/collections/struct.HashMap.html) doesn't explicitly say this; in fact, it doesn't even say that keys have to be strings, just that keys have to implement the `Eq` and `Hash` traits.  My guess, for now, is that equality is checked by means of references and not string values, but I'm unclear on that.  Still, that gives me enough to finish off the problem.

## Attempt 0.4

```rust
use std::fs;
use std::collections::HashMap;
use std::time::{Instant};

fn main() {
	let start = Instant::now();
	
    let file = "../Inputs/Day3Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let dir_indices = input_raw.chars();
	let mut x1: isize = 0;
	let mut y1: isize = 0;
	let mut x2a: isize = 0;
	let mut y2a: isize = 0;
	let mut x2b: isize = 0;
	let mut y2b: isize = 0;
	
	let mut santa_1 = HashMap::new();
	let mut santa_2 = HashMap::new();
	let mut part1: usize = 1;
	let mut part2: usize = 0;
	let mut odd = true;
	
	for direction in dir_indices {
		let increment = match direction {
			'^' => (1,0),
			'v' => (-1,0),
			'<' => (0,1),
			'>' => (0,-1),
			_ => (0,0),
		};
		x1 += increment.0;
		y1 += increment.1;
		if odd {
			x2a += increment.0;
			y2a += increment.1;
		} else {
			x2b += increment.0;
			y2b += increment.1;
		};
		
		let k1 = format!("{},{}", x1, y1);
		let k2 = match odd {
			true => format!("{},{}", x2a, y2a),
			false => format!("{},{}", x2b, y2b),
		};
		if !santa_1.contains_key(&k1) {
			santa_1.insert(k1,true);
			part1 += 1;
		};
		if !santa_2.contains_key(&k2) {
			santa_2.insert(k2,true);
			part2 += 1;
		};
		odd = !odd;
	}
	let end = start.elapsed().as_micros();
	
	println!("Part 1: {}",part1);
	println!("Part 2: {}",part2);
    println!("Time: {} μs", end);
}
```
```
Finished release [optimized] target(s) in 0.41s
 Running `target/release/day_3`
Part 1: 2592
Part 2: 2360
Time: 1903 μs
```

Two more stars acquired, but I can't say I'm satisfied with it.  I have a lot of repetitive code, which my gut tells me should be compressible, and the code is very slow compared to the previous two days: almost 2 milliseconds, so only a factor of thirty-five times faster than my Mathematica code.  I want to at least try to improve both of these shortcomings.

The first optimization that comes to mind is the `HashMap` initialization.  The HashMap can't possibly store more elements than there are characters in the file, so if I preallocate that many elements, it shouldn't have to reallocate on the fly.

## Attempt 1.0

```rust
fn main {
...
	let metadata = fs::metadata(file).unwrap();
	let file_size: usize = metadata.len().try_into().unwrap();
...
	let mut santa_1 = HashMap::with_capacity(file_size);
	let mut santa_2 = HashMap::with_capacity(file_size);
...
}
```
```
    Finished release [optimized] target(s) in 0.41s
     Running `target/release/day_3`
Part 1: 2592
Part 2: 2360
Time: 1880 μs
```
The code runs, and the preallocation works just fine, but there's an improvement, it's so small I can't tell whether or not it actually exists at all..  My general intuition about what is and is not slowing down the code clearly isn't enough: I need a Rust code profiler, and I'm going to use [`perf`](https://github.com/brendangregg/perf-tools) and [`flamegraph`](https://github.com/flamegraph-rs/flamegraph); I won't bother with more detailed benchmarking just yet, for the simple reason that if I need a detailed benchmark to see if there's been an improvement, then I'm probably not looking at the order-of-magnitude improvements that I think should be possible for this program.

To install them (January 2021; this may be outdated), I used
```
sudo apt install linux-tools-common linux-tools-generic
cargo install flamebench
```

I ran the flamegraph with the (apparently) absurdly high sampling rate of 29.999 kHz, enough to get about a thousand samples.

[![Click to view annotated flamegraph](/assets/img/Rust_AoC_2015_Day_3_1_flamegraph.svg)](/assets/img/Rust_AoC_2015_Day_3_1_flamegraph.svg)

Unfortunately, this is as far as I was able to get.  Clicking on that flamegraph and zooming into `day_3` (most of the rest was the `perf` profiler itself, which we of course can ignore), I see that a full 80% of the time was spent on `core::ops::function::impls::<impl core::ops::function::FnOnce<A> for &F>::call_once` - which, if I understand it, is a function called once and not one of the functions in my loop.  `main`, if I had to guess.  And the breakdown simply doesn't display most of what that `call_once` function is actually doing; I suspect this profiler was designed for code that runs far slower and is far more intricate than mine.  Running the same flamegraph for day 2 showed a similar percentage of time spent on that core function, so that's not the problem, and I can't get any deeper with the profiling capability I have.

## Attempt 1.1

So, I'm going to continue on with at least cleaning the code up, even if I can't speed it up.  The first thing to do is trim down all those coordinates, preferably into some kind of structure that lets me
- Test for equality (for the `HashMap`)
- Compute a hash (for the `HashMap`)
- Add two coordinate pairs together (for easier traversal)
- Initialize with a specific value

According to the documentation, the way to create a structure is with [`struct`](https://doc.rust-lang.org/rust-by-example/custom_types/structs.html) (which includes named tuples: perfect for this), and the way to implement equality tests, hashes, and addition is with either [`derive](https://doc.rust-lang.org/rust-by-example/trait/derive.html) or [`impl Trait`](https://doc.rust-lang.org/rust-by-example/trait/impl_trait.html).

```rust
#[derive(Hash, Eq, PartialEq)]
struct Coords {
	x: i64,
	y: i64,
}
```
```
Finished release [optimized] target(s) in 1.13s
 Running `target/release/day_3`
```

So far, so good; I've derived `Hash` and `Eq`, and things are working well.

## Attempt 1.2
```rust
use std::ops::Add;

#[derive(Hash, Eq, PartialEq)]
struct Coords {
	x: i64,
	y: i64,
}

impl PartialEq for Coords {
	fn eq(&self, other: &Self) -> bool {
		self.x == other.x && self.y == other.y
	}
}

impl Eq for Coords {}

impl Add for Coords {
	fn add(&self, other: &Self) -> Self {
		Self {
			x: self.x + other.x,
			y: self.y + other.y,
		}
	}
}
```
```
error[E0046]: not all trait items implemented, missing: `Output`

impl Add for Coords {
^^^^^^^^^^^^^^^^^^^ missing `Output` in implementation

= help: implement the missing item: `type Output = Type;`
```

Interestingly, it seems that unlike traits such as `Eq` (which return a `bool`), traits like `Add` specify an output type.  The example given is how you can add `Duration` to `SystemTime` to get `SystemTime`; the possibility of adding two different structures together creates the necessity of specifying type, I suppose.

## Attempt 1.3
```rust
use std::ops::Add;

#[derive(Hash, Eq, PartialEq)]
struct Coords {
	x: i64,
	y: i64,
}

impl PartialEq for Coords {
	fn eq(&self, other: &Self) -> bool {
		self.x == other.x && self.y == other.y
	}
}

impl Eq for Coords {}

impl Add for Coords {
	type Output = Coords;
	fn add(&self, other: &Self) -> Self {
		Self {
			x: self.x + other.x,
			y: self.y + other.y,
		}
	}
}
```
```
error[E0053]: method `add` has an incompatible type for trait

fn add(&self, other: &Self) -> Self {
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected struct `Coords`, found `&Coords`

= note: expected fn pointer `fn(Coords, Coords) -> Coords`
           found fn pointer `fn(&Coords, &Coords) -> Coords`
```

Reading the documentation for the [`Add` trait](https://doc.rust-lang.org/std/ops/trait.Add.html#tymethod.add), I saw that there was a method which was required: `fn add()`.  And looking at it, I see that it takes structures, not references - there's no `&` in the whole function.  But I don't understand *why* it doesn't take references; isn't the whole point of a reference to point to something so that you don't have to borrow it?

This is made especially confusing by the fact that equality function in the [`PartialEq` trait](https://doc.rust-lang.org/std/cmp/trait.PartialEq.html#tymethod.eq) does, in fact, take references

```rust
fn eq(&self, other: &Rhs) -> bool
```

But at least, the compiler was helpful enough to tell me how to fix it.

## Attempt 1.3
```rust
use std::ops::Add;

#[derive(Hash, Eq, PartialEq)]
struct Coords {
	x: i64,
	y: i64,
}

impl PartialEq for Coords {
	fn eq(&self, other: &Self) -> bool {
		self.x == other.x && self.y == other.y
	}
}

impl Eq for Coords {}

impl Add for Coords {
	type Output = Coords;
	fn add(self, other: Self) -> Self {
		Self {
			x: self.x + other.x,
			y: self.y + other.y,
		}
	}
}
```
```
Finished release [optimized] target(s) in 0.41s
 Running `target/release/day_3`
```

Well, that should be everything.  Time to put it into the main code.

## Attempt 1.4
```rust
fn main {
...
		coords1 = coords1 + increment;
...
}
```
```
error[E0382]: use of moved value: `coords1`
  --> src/main.rs:50:13
   |
32 |     let mut coords1 = Coords{x:0,y:0};
   |         ----------- move occurs because `coords1` has type `Coords`, which does not implement the `Copy` trait
...
50 |         coords1 = coords1 + increment;
   |                   ^^^^^^^ value used here after move
...
62 |             santa_1.insert(coords1,true);
   |                            ------- value moved here, in previous iteration of loop

```

Oh, right - I completely forgot that `Copy` was a trait that the coordinates need to have.  I'll add that, of course, but that makes me think: how much copying and cloning is going on here?  Could I simplify things a bit by also adding in the `AddAssign` trait?  Most of what I'm doing with the coordinates is changing them, not creating new ones, so I may as well not be wasteful.

Looking at the [`AddAssign` trait](https://doc.rust-lang.org/std/ops/trait.AddAssign.html) documentation, it seems that there is no requirement for an output type (which makes sense - the output type has to be the type on the left-hand side), that the left-hand side must be mutable (also makes sense), and that the syntax is otherwise the same, with the single exception of
```rust
        *self = Self {
```
instead of
```rust
        Self {
```
I hadn't seen the `*` operator before, but it seems to be a dereferencer: you pass in a reference, and `*` allows access to the referenced-to value.  Interesting.  At any rate, shouldn't be hard to make, so let's finally put everything together

## Final Version

```rust
use std::fs;
use std::collections::HashMap;
use std::time::{Instant};
use std::convert::TryInto;
use std::ops::{Add,AddAssign};

#[derive(Hash, PartialEq, Eq, Copy, Clone)]
struct Coords {
	x: i64,
	y: i64,
}

impl Add for Coords {
	type Output = Coords;
	fn add(self, other: Self) -> Self {
		Self {
			x: self.x + other.x,
			y: self.y + other.y,
		}
	}
}

impl AddAssign for Coords {
	fn add_assign(&mut self, other: Self) {
		*self = Self {
			x: self.x + other.x,
			y: self.y + other.y,
		}
	}
}

fn main() {
	let start = Instant::now();
	
    let file = "../Inputs/Day3Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	let metadata = fs::metadata(file).unwrap();
	let file_size: usize = metadata.len().try_into().unwrap();
	
	let dir_indices = input_raw.chars();
	let mut coords1 = Coords{x:0,y:0};
	let mut coords2a = Coords{x:0,y:0};
	let mut coords2b = Coords{x:0,y:0};
	
	let mut santa_1 = HashMap::with_capacity(file_size);
	let mut santa_2 = HashMap::with_capacity(file_size);
	let mut part1: usize = 1;
	let mut part2: usize = 0;
	let mut odd = true;
	
	for direction in dir_indices {
		let increment = match direction {
			'^' => Coords{x:1,y:0},
			'v' => Coords{x:-1,y:0},
			'<' => Coords{x:0,y:1},
			'>' => Coords{x:0,y:-1},
			_ => Coords{x:0,y:0},
		};
		coords1 += increment;
		if odd {
			coords2a += increment;
		} else {
			coords2b += increment;
		};
		
		if !santa_1.contains_key(&coords1) {
			santa_1.insert(coords1,true);
			part1 += 1;
		};
		if odd && !santa_2.contains_key(&coords2a) {
			santa_2.insert(coords2a,true);
			part2 += 1;
		};
		if !odd && !santa_2.contains_key(&coords2b) {
			santa_2.insert(coords2b,true);
			part2 += 1;
		};
		odd = !odd;
	}
	let end = start.elapsed().as_micros();
	
	println!("Part 1: {}",part1);
	println!("Part 2: {}",part2);
    println!("Time: {} μs", end);
}
```
```
Finished release [optimized] target(s) in 0.39s
 Running `target/release/day_3`
Part 1: 2592
Part 2: 2360
Time: 725 μs
```

Not only do we still get the correct answer, but the code is much more readable (if longer), and it runs in only a third of the time!  My Mathematica code ran in 70 ms, so this is an improvement by a factor of 100.  I'll call this a success.

So why did it run so much faster?  My guess is that a lot of it came down to the `Hash` function.  Because I `derive`d `Hash` on the tuple itself rather than generating a new string with `format()`, I suspect the built-in methods were much faster than my ad-hoc solution.  Which is a good lesson for future problems: if built-ins exist, use them.

Coordinates are something which will come up again, and next time they do, I'll figure out how to make a utilities `crate` to put my `Coords` structure in, along with other structures that I'm sure I'll find useful over the course of the month.












