---
title: Learning Rust with Advent of Code - Day 1
author: David & Felipe
date: 2021-01-12 12:00:00 -0500
categories: [Programming, Advent of Code]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
---
<div style="display:none;">2015 Day 1: The simplest problem of the year, done by complete beginners inexperienced with Rust's syntax, types, and error-handling.  Features a 2000x speedup over an equivalent Mathematica program.</div>

The goal: learn Rust via the error messages, by working through 2015's Advent of Code problems, one at a time.

**David**: I have absolutely no experience with Rust, or for that matter any language lower-level than C++.  I normally use Mathematica, which is about as high-level and loosely typed as it gets, so I know next to nothing about low-level languages or garbage collection or strict typing, let alone borrow checkers.  Joel Sposky wrote in 2005 about how [some types of programmers used to high level languages struggle with pointers](https://www.joelonsoftware.com/2005/12/29/the-perils-of-javaschools-2/), and Eric Sink wrote in 2015 about how [Rust is another level of difficulty beyond that](https://ericsink.com/entries/rust1.html).  I am precisely the kind of naive programmer those two were talking about, so jumping headfirst into this project ought to be fun.

Programming books are for people with patience.  I've done every problem in Mathematica, so I know the algortihms and can make as many test cases as I need to ensure the code's working.  What I don't know is Rust.  I'm going to open the documentation, try some code, have the compiler yell at me, and try again.

**Felipe:**

Unlike Dave, I have done some stuff in rust. However I've never actually finished a month of AoC problems, much to my shame. This changes now. 

Dave will be taking on the fun challenge of teaching us rust via error messages, I will be trying something slightly different. One of the issues with AoC is hopping over the cliff between code that "does the thing" and code that actually runs quickly. In the early problems its not a big deal, since generally the leap between an incredible solution and the simplest is a matter of, at most seconds, but as you go into day 25 it starts mattering. So what we'll be doing here is first writing the "obvious" or most natural solution, and bit by bit working towards a more optimized solution. Some days the most natural solution will be the best solution, and on those days we'll explore alternatives, and work out various potential approaches, and see how they work out. This will be an exercise in learning what the rust complier does, via actually using it. I expect the results will both surprise and shock me. 

# [Day 1](https://www.adventofcode.com/2015/day/1)

The problem: you're given a number of parentheses, with `(` representing `+1` and `)` representing `-1`.

Part 1: Starting at `0` and the first parenthesis, find the total.

Part 2: Find the earliest instance in which the subtotal (starting at `0` and the first parenthesis) is `-1`.

# David

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

Looking further, it seems that `read_to_string()` returns `Result` indicating whether or not the function succeeded in importing.  I'm reasonably certain that this file I manually placed in is indeed present (and if it isn't, then the program is going to fail regardless), and I don't know whether or not a kernel panic is 'worse' in some sense than throwing a regular error for a program this small.  It seems that `unwrap()` gets the interior of a successful `Result`, so I'll tell Rust to assume that the result is succesful and worry about error catching later.

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
	let file = "../Inputs/Day1Input.txt";
	let metadata = fs::metadata(file).unwrap();
	assert!(isize::MAX > metadata.len().try_into().unwrap());

	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let start = Instant::now();
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
Time: 24 μs
```

And the first two stars are acquired!

I didn't feel like I got that far into Rust-specific features or documentation (I didn't once get yelled at by a borrow checker), but since this is day 1 that's probably for the best; there will be plenty of time to encounter more varied errors later.  My Mathematica script for this problem ran in 55,000 microseconds, and according to `std::time`, this program (including the import) ran in 25 microseconds when compiled for release, which gives me some idea of why in the world low-level programming languages are worth using for anything other than making high-level programming languages.

And my gut feeling is that I could improve this even further; if I understand it correctly, even this program has `input_raw` reading the entire file into a string before doing anything with it, and enumeration in advance is the precise thing `char_indices()` is meant to avoid.  I'll look into reading a file into characters through a buffer next time there's a problem which can benefit.

# Felipe

The first thing to master when looking at the AoC problems is "what the heck is this asking?" early on, its easy, later you spend a long time looking at it wondering what all the words mean, and pondering the true meaning of "elf". So on a first read, the question seems to be asking, "after looking at the input, what floor will we have ended up on?". But really, that can be translated to "How many ( are there, minus how many )" One way to do this, would be to iterate over everything and count, but we can do so in a much more simple way. Say: 

## Simplest Solution

```rust

fn main(){
        // this is where we import our imput file
        let path = Path::new("../input.txt");
        let display = path.display();

        let mut file = match File::open(&path) {
            Err(why) => panic!("couldn't open {}: {}", display, why),
            Ok(file) => file,
        };
    
        let mut input_string = String::new();
        match file.read_to_string(&mut input_string) {
            Err(why) => panic!("couldn't read {}: {}", display, why),
            Ok(_) => (),
        }

        // Lets time our execution
        let start = Instant::now();
        // Part 1!
        let open_paren = input_string.matches("(").count();
        let close_paren = input_string.matches(")").count();

        print!("Result: {}", open_paren - close_paren);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

Now for this exercise, I'm not going to be overly concerned with the file opening speed. There are faster, less safe ways of doing it, and we'll look at that in further optimizations, but for today, we're not going to time that. At a glance, this seems great, if we run it, we get... `execution time in microseconds 1900` which is not bad at all. 

We can, and will do better of course, but before we get to that, lets write a bare-bones solution to part 2.

Now reading the problem for part 2, it seems we want the first time that the net value is =1, *counting the first index as 1*. This bit is key and will get us an off by one error if we don't realize it. 

There are two things I realize right away 

1. We can't get away from just iterating now
2. We can bail as soon as the total equals -1 

Lets write that code 

## Cutting Corners

```rust
        let start = Instant::now();
        let mut total = 0;
        for (i, c) in input_string.chars().enumerate() {
            if c == '('   {
                total += 1;
            }
            if c == ')'{
                total -= 1;
            }

            if total == -1 {
                print!("\n Part2: {}", i + 1);
                let end = start.elapsed().as_micros();
                print!("\n execution time in microseconds {}", end);
                return
            }
        }
```

A neat thing Dave pointed out to me when I was writing this: if we say "(" that refers to the *string* version of the character, if we say '(' that's the character version. It saves us having to do an annoying conversion, so its good to know. 

There's also something I'm doing that's kind of inneficient to avoid sanitizing the text. I use two ifs, instead of an if...else. My expectation is that will raise the evaluation time slightly, since `branch prediction` will treat is as two separate statements, instead of one branching location. (If my understanding is correct, which it may not be! Yell at me on twitter if I'm wrong) 

Our run time is... 180 microseconds, which is an order of magnitude better than our part 1. 

What the heck is going on?

Well, for one, we can surmise that the default iteration speed is *much* faster than the native `.matches()` method. Hazarding a guess why, its because matches takes a regex, and unwraps the string. The code for it in the [rust source](https://doc.rust-lang.org/src/core/macros/mod.rs.html#219-242) seems pretty straight forward, but its clearly designed for a borader use-case than our specific case. 

We also run it twice, which is less than ideal. 

Looking at our part 2, it makes logical sense that we could jam part 1 in there as well. We lose on the bailing out early bit (since we need to count all the parens), but that means out whole program, instead of iterating over the string three times, needs only iterate over it once.

While we're in there lets also get rid of that annoying if...if and make it an if else, and trust that our input is good. I also added a bit to ensure that we only output the result of p2 once, which didn't impact the speed at all it seemed. 

## Single Pass

```rust

use std::fs::File;
use std::io::prelude::*;
use std::path::Path;
use std::time::{Instant};
    

fn main(){
        let path = Path::new("../input.txt");
        let display = path.display();

        let mut file = match File::open(&path) {
            Err(why) => panic!("couldn't open {}: {}", display, why),
            Ok(file) => file,
        };
    
        let mut input_string = String::new();
        match file.read_to_string(&mut input_string) {
            Err(why) => panic!("couldn't read {}: {}", display, why),
            Ok(_) => (),
        }
        
        let start = Instant::now();
        
        let mut total = 0;
        // print!("{}", input_string);
        let mut seen = false;
        for (i, c) in input_string.chars().enumerate() {
            if c == '('   {
                total += 1;
            }else {
                total -= 1;
            }

            if total == -1 && seen == false{
                print!("\n Part2: {}", i + 1);
                seen = true;
            }
        }
        print!("\n Part1: {}",total);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

Running it with `cargo run --release` which builds the relase optimized version we get a run time of 38 microseconds. Not at all bad.

