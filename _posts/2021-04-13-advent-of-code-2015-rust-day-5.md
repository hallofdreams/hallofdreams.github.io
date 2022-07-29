---
title: Learning Rust with Advent of Code - Day 5
author: David & Felipe
date: 2021-04-13 12:00:00 -0500
categories: [Programming, Advent of Code]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
---

# [Day 5](https://www.adventofcode.com/2015/day/5)

The problem: you're given a list of strings, each sixteen characters long.

**Part 1**: Count the strings matching all of the following criteria:
- Contains at least three vowels.
- Contains at least one letter appearing twice in a row (such as `xx`).
- Does not contain the strings `ab`, `cd`, `pq`, or `xy`.

**Part 2**: Count the strings matching all of the following criteria:
- Contains at least one letter which repeats with exactly one letter in between (such as `xyx`).
- Contains a pair of two letters which appear at least twice without overlap.

----

# David

Computationally, the second requirement of part 2 is going to be the most expensive one; I'll have to either check every pair of strings or create a `HashMap` for every string.  I'll probably do the latter; I can initialize the `HashMap` with exactly the size I need (and I'll throw in an `!assert()` to make sure that there aren't any strings longer than 16 characters), and fill it in as I go.  But I'll start with part 1, regardless.

## Attempt 0.0
```rust
use std::fs;

fn is_vowel(c: &char) -> bool {
	matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u')
}

fn main() {
    let file = "../Inputs/Day5Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let s = 'f';
	let check: bool = is_vowel(&s);
	println!("Check on {} returns {}.",s,check);
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.20s
 Running `target/debug/day_5`
Check returns false.
```

So far, so good.  I'm starting to understand the concept of references and ownership: by defining my `is_vowel()` function as operating on references instead of values, I can check if a character is a vowel without taking it out of scope.  With that function in place, let me set up the basic framework for the rest of the problem.

## Attempt 0.1
```rust
use std::fs;

fn is_vowel(c: &char) -> bool {
	matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u')
}

fn main() {
    let file = "../Inputs/Day5Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let lines = input_raw.lines();
	let mut part1: u32 = 0;
	
	for line in lines {
		let mut vowel_count: u32 = 0;
		let chars = line.chars();
		
		for c in chars {
			if is_vowel(&c) {vowel_count += 1;}
		};

		if vowel_count >= 3 {
			part1 += 1;
		};
	}
	
	println!("Part 1: {}", part1);
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.26s
 Running `target/debug/day_5`
Part 1: 614
```
Not the right answer, of course, since I'm only checking one of the three requirements for part 1, but the code runs without error.  Now, the second requirement.

## Attempt 0.2
```rust
use std::fs;

fn is_vowel(c: &char) -> bool {
	matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u')
}

fn main() {
    let file = "../Inputs/Day5Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let lines = input_raw.lines();
	let mut part1: u32 = 0;
	
	for line in lines {
		let mut vowel_count: u32 = 0;
		let chars = line.chars();
		let mut last_char: char = ' ';
		let mut double: bool = false;
		
		for c in chars {
			if is_vowel(&c) {vowel_count += 1;};
			if !double && &c == &last_char {double = true};
			last_char = c.clone();
		};

		if vowel_count >= 3 && double {
			part1 += 1;
		};
	}
	
	println!("Part 1: {}", part1);
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.27s
 Running `target/debug/day_5`
Part 1: 269
```
Second requirement for part 1 complete; let's get the third.

## Attempt 0.3
```rust
fn is_illegal_pair(c1: &char, c2: &char) -> bool {
	s = [c1, c2].iter().collect::<String>();
	matches!(s, "ab" | "cd" | "pq" | "xy")
}
```
```
error[E0277]: a value of type `String` cannot be built from an iterator over elements of type `&&char`

s = [c1, c2].iter().collect::<String>();
                    ^^^^^^^ value of type `String` cannot be built from `std::iter::Iterator<Item=&&char>`
```
Okay, that was careless.  I forgot that since I was already passing in `&` references, and `.iter()` creates references, I needed to dereference them with `*` first, or else I'd have a reference to a reference.

## Attempt 0.4
```rust
fn is_illegal_pair(c1: &char, c2: &char) -> bool {
	let s = [*c1, *c2].iter().collect::<String>();
	matches!(s, "ab" | "cd" | "pq" | "xy")
}
```
```
error[E0308]: mismatched types

matches!(s, "ab" | "cd" | "pq" | "xy")
         -  ^^^^ expected struct `String`, found `&str`
         |
         this expression has type `String`
```
This is a problem; if I were using an `if` statement, I could just call `.to_string()` on each of the illegal substrings and convert them from `&str`, but the `matches!` macro doesn't allow for in-place functions like that, only primitives.  We'll have to do it the hard way:

## Attempt 0.5
```rust
use std::fs;

fn is_vowel(c: &char) -> bool {
	matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u')
}

fn is_illegal_pair(c1: &char, c2: &char) -> bool {
	let s = [*c1, *c2].iter().collect::<String>();
	["ab","cd","pq","xy"]
		.iter()
		.any(|&i| i==s)
}

fn main() {
    let file = "../Inputs/Day5Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let lines = input_raw.lines();
	let mut part1: u32 = 0;
	
	for line in lines {
		let mut vowel_count: u32 = 0;
		let chars = line.chars();
		let mut last_char: char = ' ';
		let mut double: bool = false;
		let mut all_legal: bool = true;
		
		for c in chars {
			if is_vowel(&c) {vowel_count += 1;};
			if !double && &c == &last_char {double = true};
			if is_illegal_pair(&last_char, &c) {all_legal = false};
			last_char = c.clone();
		};

		if vowel_count >= 3 && double && all_legal {
			part1 += 1;
		};
	}
	
	println!("Part 1: {}", part1);
}
```
```
Finished dev [unoptimized + debuginfo] target(s) in 0.29s
 Running `target/debug/day_5`
Part 1: 255
```
First star acquired!  I'm trying to get used to making functions, passing in arguments, using iterators, and all the other idiomatic Rust ways of doing things; not only will doing so help me understand other people's Rust code, but it should hopefully run faster to boot.  Next up is the first requirement of part 2, the requirement for a character to appear twice with exactly one character between.

## Attempt 1.0
```rust
use std::fs;

fn is_vowel(c: &char) -> bool {
	matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u')
}

fn is_illegal_pair(c1: &char, c2: &char) -> bool {
	let s = [*c1, *c2].iter().collect::<String>();
	["ab","cd","pq","xy"]
		.iter()
		.any(|&i| i==s)
}

fn main() {
	let file = "../Inputs/Day5Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let lines = input_raw.lines();
	let mut part1: u32 = 0;
	let mut part2: u32 = 0;
	
	for line in lines {
		let mut vowel_count: u32 = 0;
		let chars = line.chars();
		let mut last_char: char = ' ';
		let mut double: bool = false;
		let mut all_legal: bool = true;
		
		let mut second_to_last_char: char = ' ';
		let mut offset_double: bool = false;
		
		for c in chars {
			if is_vowel(&c) {vowel_count += 1;};
			if !double && &c == &last_char {double = true};
			if all_legal && is_illegal_pair(&last_char, &c) {all_legal = false};
			
			if !offset_double && &c == &second_to_last_char {offset_double = true};
			
			second_to_last_char = last_char.clone();
			last_char = c.clone();
		};

		if vowel_count >= 3 && double && all_legal {
			part1 += 1;
		};
		if offset_double {
			part2 += 1;
		}
	}
	println!("Part 1: {}", part1);
	println!("Part 2: {}", part2);
}
```
```
Finished release [optimized] target(s) in 0.35s
 Running `target/release/day_5`
Part 1: 255
Part 2: 412
```
So far, so good, but that was the easy part.  Right now, I'm initializing my buffer characters with `' '`; if the strings contained spaces, this could be bad, but I'm willing to take the shortcut because I know that they don't.  Having buffer characters will also make the next step easier.

## Attempt 1.1
```rust
use std::fs;

fn main() {
...
		let mut substrings = HashMap::new();
		let mut contains_repeat: bool = false;
...
			if !contains_repeat && substrings.contains_key([last_char, c].iter().collect::<String>()) {contains_repeat = true};		
			substrings.insert(
				[second_to_last_char, last_char].iter().collect::<String>()
			);
...
}
```
```
error[E0433]: failed to resolve: use of undeclared type `HashMap`
let mut substrings = HashMap::new();
                     ^^^^^^^ not found in this scope
```
Of all things, I forget to import the `HashMap` type.  Okay, let's try again.

## Attempt 1.2
```rust
use std::fs;
use std::collections::HashMap;

fn main() {
...
		let mut substrings = HashMap::new();
		let mut contains_repeat: bool = false;
...
			if !contains_repeat && substrings.contains_key([last_char, c].iter().collect::<String>()) {contains_repeat = true};		
			substrings.insert(
				[second_to_last_char, last_char].iter().collect::<String>()
			);
...
}
```
```
error[E0061]: this function takes 2 arguments but 1 argument was supplied

substrings.insert(
           ^^^^^^ expected 2 arguments
    [second_to_last_char, last_char].iter().collect::<String>()
    ----------------------------------------------------------- supplied 1 argument
```
Since this is the second time the structure has come up, perhaps I should make my own version of a `HashMap`, which only checks for `.contains()` and doesn't need a value associated with it.  But it's easy enough to fix.

## Attempt 1.3
```rust
use std::fs;
use std::collections::HashMap;

fn main() {
...
		let mut substrings = HashMap::new();
		let mut contains_repeat: bool = false;
...
			if !contains_repeat && substrings.contains_key([last_char, c].iter().collect::<String>()) {contains_repeat = true};		
			substrings.insert(
				[second_to_last_char, last_char].iter().collect::<String>(), 
				true
			);
...
}
```
```
error[E0308]: mismatched types

if !contains_repeat && substrings.contains_key([last_char, c].iter().collect::<String>()) {contains_repeat = true};
                                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                               |
                                               expected reference, found struct `String`
                                               help: consider borrowing here: `&[last_char, c].iter().collect::<String>()`
= note: expected reference `&_`
              found struct `String`
```
I could borrow with a reference, as suggested, but that would cause problems with ownership when it comes time to insert the last substring into the list.  I think it'll be easier to just allocate the current pair beforehand and reference that, rather than mess around with a lengthy one-liner.

## Final Version
```rust
use std::fs;
use std::collections::HashMap;
use std::time::{Instant};

fn is_vowel(c: &char) -> bool {
	matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u')
}

fn is_illegal_pair(c1: &char, c2: &char) -> bool {
	let s = [*c1, *c2].iter().collect::<String>();
	["ab","cd","pq","xy"]
		.iter()
		.any(|&i| i==s)
}

fn main() {
	let start = Instant::now();
	
    let file = "../Inputs/Day5Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let lines = input_raw.lines();
	let mut part1: u32 = 0;
	let mut part2: u32 = 0;
	
	for line in lines {
		let mut vowel_count: u32 = 0;
		let chars = line.chars();
		let mut last_char: char = ' ';
		let mut double: bool = false;
		let mut all_legal: bool = true;
		
		let mut second_to_last_char: char = ' ';
		let mut offset_double: bool = false;
		let mut substrings = HashMap::new();
		let mut contains_repeat: bool = false;
		
		for c in chars {
			if is_vowel(&c) {vowel_count += 1;};
			if !double && &c == &last_char {double = true};
			if all_legal && is_illegal_pair(&last_char, &c) {all_legal = false};
			
			if !offset_double && &c == &second_to_last_char {offset_double = true};
			let current_pair = [last_char, c].iter().collect::<String>();
			if !contains_repeat && substrings.contains_key(&current_pair) {contains_repeat = true};
			
			substrings.insert(
				[second_to_last_char, last_char].iter().collect::<String>(),
				true
			);
			second_to_last_char = last_char.clone();
			last_char = c.clone();
		};

		if vowel_count >= 3 && double && all_legal {
			part1 += 1;
		};
		if offset_double && contains_repeat {
			part2 += 1;
		}
	}
	let end = start.elapsed().as_micros();
	
	println!("Part 1: {}", part1);
	println!("Part 2: {}", part2);
    println!("Time: {} μs", end);
}
```
```
Finished release [optimized] target(s) in 0.44s
 Running `target/release/day_5`
Part 1: 255
Part 2: 55
Time: 2398 μs
```
Part 2 complete!

Doing this iteratively wasn't nearly as bad as I thought it was going to be, syntax-wise; despite still making multiple mistakes, I'm starting to anticipate errors before the borrow checker warns me about them, rather than just adding or removing `&` at random and hoping for the best.  And the runtime continues to amaze me; my Mathematica code ran in 0.16 seconds, so this is a speedup of 700x.  I still have five or six tabs open to the documentation at all times, but the frequency at which I check them is, slowly, going down.

# Felipe

Day 5 is... boring. There's no other word for it. Its a fairly straightforward problem, and it takes someone more clever than I to come up with an exciting optimization. (I'm sure someone has). Dave and I spent a couple hours speculating about potential avenues to optimize, but it turns out its quite hard to improve on doing things in a single pass. 

But enough  bellyaching, lets look at the problem. Day 5 asks us to parse a long list of stings, and count how many of them are naughty, and how many are nice. Instinctually by now, we should know we're going to iterate over the list and do operations on the strings. Scanning the rules: 

```
It contains at least three vowels (aeiou only), like aei, xazegov, or aeiouaeiouaeiou.
It contains at least one letter that appears twice in a row, like xx, abcdde (dd), or aabbccdd (aa, bb, cc, or dd).
It does not contain the strings ab, cd, pq, or xy, even if they are part of one of the other requirements.
```

It looks like those can all be done in one pass of the string. We can count how many vowels we have as we go through the string, we can keep track of the previous letter, and see if it makes a forbidden string, or a double. So far we have a time of O(n). 

The rules for part 2 are different, but can also probably be done in one pass. To whit: 

```
It contains a pair of any two letters that appears at least twice in the string without overlapping, like xyxy (xy) or aabcdefgaa (aa), but not like aaa (aa, but it overlaps).
It contains at least one letter which repeats with exactly one letter between them, like xyx, abcdefeghi (efe), or even aaa.
```

The second rule seems straight forward enough. We can keep track of the current letter, and the letter two letters behind. If those two letters ever  match, we have what I'm calling a tryptich. The first rule is a little trickier. If we don't care about memory complexity, we can just keep a dict of every pair of letters in the in the string. If we're feeling lazy, we can iterate over the string a second time with `word.matches(pair).count() > 1;`. Unless its a matter of life and death, I'm happy to be lazy. Dave does it in a much clever way, but given that we get roughly comparable run times, I don't think it ultimately matters. 

Ultimately, we get a very readable, functional block of code: 

```rust
use std::time::{Instant};
use std::fs;

fn main(){
       
        let file ="../input.txt";
        let mut input: String = fs::read_to_string(file).unwrap();
        let words = input.lines();
        let start = Instant::now();

        let mut p1: u32 = 0;
        let mut p2: u32 = 0;
        
        for word in words {
            let mut vowel_count = 0 ;
            let mut prev_char = ' ';
            let mut two_behind = ' ';
            let mut has_pair = false;
            let mut has_pair_match = false;
            let mut p1_checked = false;
            let mut p2_checked = false;
            let mut has_tryptic = false;
            let mut illegal_p1 = false;
            for c in word.chars() {
                if is_illegal(word){
                    illegal_p1 = true;
                    p1_checked = true;
                }
                if c == prev_char {
                    has_pair = true;
                }
                if is_vowel(&c){
                    vowel_count += 1;
                }
                if has_non_overlapping_pair(word, &[prev_char, c].iter().collect::<String>()){
                    has_pair_match = true
                }
                if is_tryptic([two_behind, prev_char, c].to_vec()){
                    has_tryptic = true
                }

                if vowel_count >= 3 && has_pair && !p1_checked {
                    p1 += 1;
                    p1_checked = true;
                }

                if has_tryptic && has_pair_match && !p2_checked {
                    p2 += 1;
                    p2_checked = true
                }

                if p1_checked && p2_checked {
                    break;
                }

                two_behind = prev_char;
                prev_char = c;
            }
        }
        println!("P1: {}", p1);
        println!("P2: {}", p2);
        let end = start.elapsed().as_micros();
        println!("\n execution time in microseconds {}", end);
}

fn is_vowel(c: &char) -> bool {
    return matches!(*c, 'a' | 'e' | 'i' | 'o' | 'u');
}

fn is_tryptic(arr: Vec<char>) -> bool {
    return arr[0] == arr[2]
}

fn has_non_overlapping_pair(word: &str, pair: &str) -> bool {
    return word.matches(pair).count() > 1;
}

fn is_illegal(word: &str) -> bool {
    return word.contains("ab") || word.contains("cd") || word.contains("pq") || word.contains("xy")
}
```

Nothing super inspiring, but it does teach us one lesson: sometimes the most straightforward path is the best path. We discussed doing things with caching and file reading, but ultimately all approaches seem to require iterating over the list at least once... if we're going to do that, we may as well just solve the problem as we do it. There's no real way to get around actually *reading* the data. 
