---
title: Learning Rust with Advent of Code - Day 4
author: David & Felipe
date: 2021-02-11 12:00:00 -0500
categories: [Programming, Advent of Code]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
series: Advent of Code in Rust
---
<div style="display:none;">2015 Day 4: Brute-force search through strings to find those whose MD5 hashes have leading 0s.  After solving the problem using Rust's MD5 crate, we analyze MD5's algorithm to find possible speedups.</div>

# [Day 4](https://www.adventofcode.com/2015/day/4)

The problem: you're given a string, to which you'll append integers `1`, `2`, `3`, ...

**Part 1**: Find the lowest number which, when appended to the string, produces an MD5 hash with five leading zeroes.

**Part 2**: Find the lowest number which, when appended to the string, produces an MD5 hash with six leading zeroes.

# David

This one is probably going to be my largest speedup of 2015's Advent of Code: Mathematica's built-in MD5 function was so slow that I didn't use it for future MD5 problems, just this one.  It took 120.07 seconds to get part 2 with the built-in function in Mathematica: I'd like to see a thousand-fold speedup, at least.

## Attempt 0.0

```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 1;
	let mut hash = Md5::new()
		.chain(input_raw)
		.chain(i.to_string())
		.finalize();
	
	println!("First MD5: {}",hash);
}
```
```
    Updating crates.io index
  Downloaded typenum v1.12.0
  Downloaded generic-array v0.9.0
  Downloaded digest v0.7.6
  Downloaded byte-tools v0.2.0
  Downloaded block-buffer v0.3.3
  Downloaded arrayref v0.3.6
  Downloaded md-5 v0.7.0
  Downloaded 7 crates (91.9 KB) in 0.56s
   Compiling typenum v1.12.0
   Compiling byte-tools v0.2.0
   Compiling arrayref v0.3.6
   Compiling block-buffer v0.3.3
   Compiling generic-array v0.9.0
   Compiling digest v0.7.6
   Compiling md-5 v0.7.0
   Compiling day_4 v0.1.0 (/home/david/Programming/Advent of Code/2015/Rust/day_4)
error[E0599]: no method named `chain` found for struct `Md5` in the current scope
   |
10 |         .chain(input_raw)
   |          ^^^^^ method not found in `Md5`
   | 
  ::: /home/david/.cargo/registry/src/github.com-1ecc6299db9ec823/md-5-0.7.0/src/lib.rs:29:1
   |
29 | pub struct Md5 {
   | -------------- doesn't satisfy `Md5: Iterator`
   |
   = note: the method `chain` exists but the following trait bounds were not satisfied:
           `Md5: Iterator`
           which is required by `&mut Md5: Iterator`
```
First issue: there are actually two packages which implement `MD5` in Rust: `md5` and `md-5`.  The latter is part of a wider network of [cryptographic Rust functions and crates](https://github.com/RustCrypto/hashes), so I think that's the one I want, but the confusion isn't great.

More concerningly, though, is the second issue: the syntax (which I copied straight from the documentation) does not work.  Since the documentation lists the `digest()` function as well, perhaps we can get away with concatenating the string inside the digest and doing it that way.

## Attempt 0.1
```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 1;
	let mut hash = Md5::digest(input_raw + i.to_string());

	println!("First MD5: {:x}",hash);
}
```
```
error[E0308]: mismatched types

let mut hash = Md5::digest(input_raw + i.to_string());
                                       ^^^^^^^^^^^^^
                                       |
                                       expected `&str`, found struct `String`
                                       help: consider borrowing here: `&i.to_string()`

error[E0308]: mismatched types

let mut hash = Md5::digest(input_raw + i.to_string());
                           ^^^^^^^^^^^^^^^^^^^^^^^^^ expected `&[u8]`, found struct `String`
```

This tells me that `digest` expects a vector of 8-bit numbers, which shouldn't be difficult.  It also tells me that `+` works as a concatenation operator if I pass in a reference; good to know for later.  According to the documentation, [`as_bytes`](https://doc.rust-lang.org/std/string/struct.String.html#method.as_bytes) returns a vector of bytes from a `String`, and I can preallocate that vector of bytes.

## Attempt 0.2
```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 1;
	let mut hash = Md5::digest((input_raw + &i.to_string()).as_bytes());

	println!("First MD5: {:x}",hash);
}
```
```
Finished release [optimized] target(s) in 0.37s
 Running `target/release/day_4`
First MD5: 71a54df5b9348fb5e473970ba9e36453
```

Okay!  That went better than expected.  Time to try a loop.

## Attempt 0.3

```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 1;
	
	while i < 10 {
	let mut hash = Md5::digest((input_raw + &i.to_string()).as_bytes());
	println!("MD5 {}: {:x}",i,hash);
	i += 1;
	}
}
```
```
error[E0382]: use of moved value: `input_raw`

let input_raw: String = fs::read_to_string(file).unwrap();
    --------- move occurs because `input_raw` has type `String`, which does not implement the `Copy` trait
...
let mut hash = Md5::digest((input_raw + &i.to_string()).as_bytes());
                            ^^^^^^^^^ value moved here, in previous iteration of loop
```

This is what I was worried about; the concatenation operator works, but it borrows the original string.  Fortunately, even though `String` does not implement the `Copy` trait, it does implement the `Clone` trait (I'm unsure of the difference), so I can just use that.

## Attempt 0.4
```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 1;
	
	while i < 10 {
		let hash = Md5::digest((input_raw.clone() + &i.to_string()).as_bytes());
		println!("MD5 {}: {:x}",i,hash);
		i += 1;
	};
}
```
```
Compiling day_4 v0.1.0 (/home/david/Programming/Advent of Code/2015/Rust/day_4)
 Finished release [optimized] target(s) in 0.38s
  Running `target/release/day_4`
MD5 1: 71a54df5b9348fb5e473970ba9e36453
MD5 2: bb9eb4a19114eb25c0fb75f45688c562
MD5 3: 997acccc1d4f625dc6e8318725dce7e3
MD5 4: c1a1c0bd9881ac01e00d24c39b8a37b9
MD5 5: 96c90020ef3e3ae00d6dfae8031aeb19
MD5 6: 6bfd2b83794f3b22d35aa5bd17e5e7f0
MD5 7: 3a45dceb179828a206150e5b9f88bc74
MD5 8: 7cb64e4f857d76f49e3d55706c122d96
MD5 9: a8290c156e6003f803d530787cddf969
```

The code works and I have my MD5 hashes.  Let me try moving the print statement after the while loop, so it only prints once.

## Attempt 1.0

```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 1;
	
	while i < 10 {
		let hash = Md5::digest((input_raw.clone() + &i.to_string()).as_bytes());
		println!("MD5 {}: {:x}",i,hash);
		i += 1;
	};
}
```
```
error[E0425]: cannot find value `hash` in this scope

println!("MD5 10: {:x}",hash);
                        ^^^^ not found in this scope
```

This is fascinating, and this is one of the many differences between a high-level and low-level language.  Rust apparently assigns a `scope` to every variable, and if a variable is created inside a `while` loop, it can't be referenced outside that `while` loop.  If I did something similar in Mathematica, I could use a `Module[]` to define a local variable, but here I suppose that scopes are everywhere.  I could fix this by defining `hash` before the loop, but that was only ever a debug statement anyway, so I may as well crack on with the problem.

## Attempt 1.1
```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 0;
	let part1: u64 = 0;
	let part2: u64 = 0;
		
	while i < 100_000 {
		i += 1;
		let mut hash = Md5::digest((input_raw.clone() + &i.to_string()).as_bytes());
		
		for j in 0..4 {
			if hash.pop() != 0 { continue};
		};
		if part1 == 0 {
			part1 = i;
			break;
		}
	};
	println!("Part 1: {:x}",part1);
}
```
```
error[E0599]: no method named `pop` found for struct `generic_array::GenericArray<u8, typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UTerm, typenum::bit::B1>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>>` in the current scope

if hash.pop() != 0 {
       ^^^ method not found in `generic_array::GenericArray<u8, typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UInt<typenum::uint::UTerm, typenum::bit::B1>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>, typenum::bit::B0>>`
```

I tried to be clever and use the built-in `pop()` method for `Vec`, not realizing that what `digest()` returns is not a `Vec` but in fact a `GenericArray`, which is a fixed-length array.  So much for cleverness, I suppose.

## Attempt 1.2

```rust
use std::fs;
use md5::{Md5, Digest};

fn main() {
	let file = "../Inputs/Day4Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut i: u64 = 0;
	let mut part1: u64 = 0;
	let mut part2: u64 = 0;
		
	'outer while i < 100_000 {
		i += 1;
		let hash = Md5::digest((input_raw.clone() + &i.to_string()).as_bytes());
		
		for j in 1..=5 {
			if hash[j] != 0 { continue 'outer};
		};
		if part1 == 0 {
			part1 = i;
			break;
		}
	};
	println!("Part 1: {:x}",part1);
}
```
```
error: labeled expression must be followed by `:`

      'outer while i < 100_000 {
      ^------ help: add `:` after the label
      |
 _____the label
|
|         i += 1;
|         let hash = Md5::digest((input_raw.clone() + &i.to_string()).as_bytes());
|         
|
|         }
|     };
|_____^
|
   = note: labels are used before loops and blocks, allowing e.g., `break 'label` to them
```

I'm a bit disappointed that I didn't get a numbered error message for this one; I'm only at 13 unique error codes out of the [422 possible compiler error codes emitted in this version of Rust](https://doc.rust-lang.org/error-index.html), and I'll really need to pick up the pace if I want a decent score by the end of the month.  I realized while fixing the last issue that my `continue` only exited the innermost loop, and so I tried to label the outermost loop to specify the which loop should be jumped to.

I'll fix that, of course, but now I see another problem.  The digest is in `Vec<u8>`, which means that I'm checking pairs of hexadecimal digits rather than individual hexadecimal digits.  While this works fine for part 2 - I could just check three pairs - I'll have to modify it a little bit.  Also, vectors in Rust are 0-indexed, meaning that I have to change that bit too.  But I'm close.

## Final Version
```rust
use std::fs;
use md5::{Md5, Digest};
use std::time::{Instant};

fn main() {
	let start = Instant::now();
	
	let file = "../Inputs/Day4Input.txt";
	let mut input_raw: String = fs::read_to_string(file).unwrap();
	let len = input_raw.len();
	input_raw.truncate(len - 1); // Normally I filter out the trailing newline, but here it's too annoying.
	
	let mut i: u64 = 0;
	let mut part1: u64 = 0;
	let mut part2: u64 = 0;
		
	'outer: loop {
		i += 1;
		let hash = Md5::digest((input_raw.clone() + &i.to_string()).as_bytes());
		
		for j in 0..=1 {
			if hash[j] != 0 { continue 'outer};
		};
		if hash[2] < 16 {
			if part1 == 0 { part1 = i;}
			if hash[2] == 0 {part2 = i; break;}
		}
	};
	let end = start.elapsed().as_micros();
	
	println!("Part 1: {}",part1);
	println!("Part 2: {}",part2);
    println!("Time: {} μs", end);
}
```
```
Part 1: 254575
Part 2: 1038736
Time: 199189 μs
```
I skipped to the end here, because my remaining troubles were with realizing that `read_to_string()` includes a trailing newline for some reason, and getting a program which ran but returned the wrong answer.  So, stars 7 and 8 acquired!  The program runs in 199 ms, for a speedup of 600x over my Mathematica script, and unlike the previous days where the difference was between milliseconds and microseconds, this time the program went from "takes a noticeable and annoying amount of time to run" to "does not take any appreciable time to run".

I was hoping for a thousand-fold speedup, but it's hard to see how to improve upon this much; the only easy thing I thought of is to precompute the `input_raw.clone()` into its `as_bytes()` form, but trying that, the runtime only went down to 185 ms.  To get much further, I think I'd need a deeper understanding of Md5 and the way Rust allocates vectors; maybe create a new fixed-length vector every power of 10, and change only the specific elements that need changing whenever `i` increases?  I don't even know if that would work, let alone if that'd be faster.

So, beating ~185 ns per Md5 hash is going to be difficult for these problems, but all in all, I'm happy with that.

# Felipe

## Understanding MD5

I promised we'd do things in parallel today, and we shall, but first, lets try to solve the base problem. Essentially what we're being asked to do is compute a large amount of static content that is not depenendent on previous content. Specifically we're looking at md5 hashes, which is a one way transformation applied to a specific string. We don't need to understand the algorithm fully since we have a crate to implement it for us... but we probably should at least look at it. Because sometimes we can find shortcuts for our specific use-case. 

Like all challenging problems, we start by looking for an explanation of what the heck we're dealing with. Usually this means wikipedia. A quick search takes us [here](https://en.wikipedia.org/wiki/MD5). We should read carefully in case there's a footnote pointing to "by the way there's a super known vulnerability that happens to answer your problem", but alas that's not the case. Some neat info and what I can only describe as a bunch of mathematical mumbo-jumbo. I'm sure if I were Dave this would make perfect sense, but I don't have the same math background. 

What I do know however, is that generally you can *understand* what mathmaticans are trying to say if you just realize that more often than not they're tying to be hyper-precise. This applies doubly to cryptographers, who are really just mathmaticians in diguise. This might not make any sense right now: 

<img=https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/MD5_algorithm.svg/450px-MD5_algorithm.svg.png></img>

But we can probably reach a point where it makes enough sense to us. Lets read the bits around it first. 

`MD5 processes a variable-length message into a fixed-length output of 128 bits.` 

Ok, so no matter how long our message is, at the end we're going to have 128 bits. Having played around with the md5 crate and putting random inputs into it, we can see that's true. Our output is always the same length. Immediately we might think "since we only care about the first x characters being 0's, can we just not care about the other 122 bits?". An instinct we'll soon see is misguided, since the hash is generated using the full text, but a good instinct to have. We should *always* be thinking about how to make the problem shorter, care about fewer things. 

Technically, we could probably stop thinking about the particulars of md5 after figuring out we can't really skip looking at the whole text... but maybe for our use-case we could implement a simpler version of md5? Lets read further and see what the algorithm is actually doing. 

`The input message is broken up into chunks of 512-bit blocks (sixteen 32-bit words); the message is padded so that its length is divisible by 512.`

Ok sure, so we take the message and cut it up into blocks, and then cut up those blocks into words. If the message is not long enough, we make it longer. How? 

`The padding works as follows: first a single bit, 1, is appended to the end of the message. This is followed by as many zeros as are required to bring the length of the message up to 64 bits fewer than a multiple of 512. The remaining bits are filled up with 64 bits representing the length of the original message, modulo 2^64.`

A one, followed by some zeroes, followed by the last 64 bits of the message, which are `len(input) % 2^64`. This means that if the message length changes, the final output will change, letting us know we *really* can't take a shortcut like only caring about the first x characters of our input. 

And now we get to the mathy, incomprehensible bit. I'm going to try to make it vaguely understandable. There's a rule about crypto though, if you're ever tempted to implement your own cryptographic function... don't. Unless you're only using it for AoC or something, because fundamentally, crypto is very very hard, and there's a lot of hyper-specialized brilliant minds out there who only work on that. Write your own crypto for fun, never for production. 

Ok, now the math. 

`The main MD5 algorithm operates on a 128-bit state, divided into four 32-bit words, denoted A, B, C, and D.`

Ok this isn't too bad. We have a "state" which implies a mutable variable or collection of variables. In this case its a collection of variables called A, B, C and D. 

`These are initialized to certain fixed constants`

They always start as the same values. Which is good, because it ensures that for the same input we'll always have the same output. Intuitively that makes sense. No randomness here. 

`The main algorithm then uses each 512-bit message block in turn to modify the state`

Aha! So we take out 512 sized message blocks, and use them to modify these variables, A, B, C, D. 

`The processing of a message block consists of four similar stages, termed rounds; each round is composed of 16 similar operations based on a non-linear function F, modular addition, and left rotation.`

Ok so we take these four variables, and for each variable we do one of three opterations, either a non-linear function F, a modular addition, or a left rotation. So we do 64 of these operations and out comes a hash. These are modified by our word blocks that we generated in the first step, which is what makes each hash different.  

Without going any further, two things are clear

1. We have to coumpute the whole thing every time. Since we operate on each word block as an input to modify state. We cannot predict what some of the characters are going to be based on the input without computing the whole thing. No shortcuts there. 

2. Our times is probably best spent not reinventing the wheel. Its unlikely that as a crypto amateur I'm going to somehow discover a better way to do MD5 hashes. 

Still, that was by no means a waste of time. We learned a little about hashing algorithms, and about reading dense mathy looking things. We can now confidently use the md5 crate without it being a black box. 

***EDIT:** Felipe missed a trick here.  Stopping at iteration 61 would allow us to shortcut through three unnecessary steps, for a speedup of ~4.5%.  The key is in the [Wikipedia pseudocode](https://en.wikipedia.org/wiki/MD5#Pseudocode) for MD5 (specifically, the very end of the `for i from 0 to 63` loop), and the fact that for this specific problem we only need the first quarter of the 512 bit chunk that's being calculated.  The shortcut implementation is left to the reader. -David*

## First Attempt

So lets get back to code. Lets write the base, simple implementation of what our algorithm might look like. As a reminder, we're trying to compute the smallest value which appended to our input, results in an md5 hash starting with 5 zeroes for part 1, and 6 zeroes for part 2.

A very basic approach looks like this

```rust 
use std::time::{Instant};
use std::fs;
use md5::{Md5, Digest};
use std::str;

fn main(){
       
        let file ="../input.txt";
        let mut input_string: String = fs::read_to_string(file).unwrap();
        let start = Instant::now();
        input_string.truncate(input_string.len() - 1); 
        let mut i: u64 = 1;
        let mut p1_done = false;
        let res_arr_p1: [u8; 2] = [00; 2]; 
        let res_arr_p2: [u8; 3] = [00; 3]; 
        while true {
            let hash = Md5::digest((input_string.clone() + &i.to_string()).as_bytes());
            // println!("MD5 {}: {:x}",i,hash);
            i += 1;
           
            let a = hash.as_slice();
            if !p1_done{
                if  a[0..2] == res_arr_p1{
                    if a[2] < 16 {
                        p1_done = true;
                        println!("P1 {}: {:x}",i-1,hash);
                    }
                }
            }
            
            if a[0..3] == res_arr_p2{
                println!("P2 {}: {:x}",i-1,hash);
                break;
            }
        };
        let end = start.elapsed().as_micros();
        println!("\n execution time in microseconds {}", end);
}
```

The only tricky bit is the `res_array` bit. It turns out that the hash function in the crate produces a bit array of base 16 value numbers (whcih makes some sense now that we understand md5 better!). We want to match the binary representation of those, so instead of doing a conversion we make an array of similar base 16 values. Dave's take is more elegant, but mine makes more sense to me. 

We run this code, and what do we get? Two stars and a execution time of 568560 microseconds,or about half a second. Not bad for computing over a million md5 hashes, but we can *absolutely* do better. 

When I was prepping for this blog series, I knew this problem would either take the form of reinventing MD5, or parallelism, because hash calculations can be done without knowing the result of the previous operation, and because we're working in a serially increasing problem space. Now that we know we're not out to reinvent md5, we can try to make things work in parallel. 

## Parallelization
What does that even mean? What exactly are we doing and how do we know to do it here? 

For starters, parallelization takes advantage of the fact that modern computers can run serveral CPU threads. Each thread can be thought of as its own computing stream, not blocking other threads from doing their own thing. If a program is a factory, with a shared floor, then the threads are different converyor belts. 

We want to use parallel processes when a few conditions are met: 

1. The results of each thread can be independent of each other. For example, if we were calculating the md5 hash of the previous md5 hash, this would not work at all, since we'd need to wait on the results of one computation before moving on to the next. 

1. The process is cpu bound. Ram is still a global resource, if you're using all the ram in your machine up with one thread, adding more will only complicate things more. 

1. The process is long running. There is a cost to spawning a thread, you would not want to do just one computation and then terminate the thread. 

This will become more clear as we examine some code. This is also the first time we're really breaking our code up into discrete functions. Its good practice to do so, as it mantains logical separation,  and we'll be doing it more aggresively from here on out. 

```rust
use std::time::{Instant};
use std::fs;
use md5::{Md5, Digest};
use std::str;
use std::thread;
use std::thread::JoinHandle;

fn thread_spawner(input_string: String, start: u64, end: u64, p1_done: bool) -> JoinHandle<(Option<u64>,Option<u64>)>{
    let t = thread::spawn(move || {
		return calc_hashes(input_string, start, end, p1_done)
    });
    return t
}

fn calc_hashes(input_string: String, start: u64, end: u64, p1_done: bool) -> (Option<u64>,Option<u64>) {
    let res_arr_p1: [u8; 2] = [00; 2]; 
    let res_arr_p2: [u8; 3] = [00; 3];
    let mut result1: Option<u64> = None;
    let mut result2: Option<u64> = None;
    for i in start..end {
        let hash = Md5::digest((input_string.clone().to_string() + &i.to_string()).as_bytes());
        let a = hash.as_slice();
        if !p1_done{
            if  a[0..2] == res_arr_p1{
                if a[2] < 16 {
                        result1 = Some(i);
                        if a[2] == 0{
                            result2 = Some(i);
                            break;
                    } 
                }
            }
        }
    }
    return (result1, result2);
}
fn main(){
       
        let file ="../input.txt";
        let mut input_string: String = fs::read_to_string(file).unwrap();
        let start = Instant::now();
        input_string.truncate(input_string.len() - 1); 
        let mut i: u64 = 0;
        let mut p1_done = false;
        let chunk_size = 100_000;
        let mut offset = 0;
        let mut answer1: u64 = 0;
        let mut answer2: u64 = 0;
		'outer: loop { 
			// println!("Current offset: {}; current answer: {}",offset, answer);
            let mut children = vec![];
            while i < 16 {
                let t = thread_spawner(input_string.to_string(), i*chunk_size+offset, (i+1)*chunk_size+offset, p1_done);
                children.push(t);
                i += 1;
            }

            for child in children {
                let curr = child.join();
                match curr {
                    Ok(options) => {
                        //https://doc.rust-lang.org/reference/expressions/tuple-expr.html
                		match options.0 {
                	        Some(result) =>  {if result < answer1 || answer1 == 0 {answer1 = result;}}
                			None => continue
                        };
                        match options.1 {
                	        Some(result) =>  {if result < answer2 || answer2 == 0 {answer2 = result;}}
                			None => continue
                        };
                    }
                	Err(option) => panic!()
                }
            }
            
            if answer2 == 0 {
		        offset += i*chunk_size;
		        i = 0;
            } else {
            	break;
            }
        }
        let end = start.elapsed().as_micros();
        println!("Part 1: {}",answer1);
        println!("Part 2: {}",answer2);
        println!("\n execution time in microseconds {}", end);
}
```

What the heck is going on here? 

Lets look at the functions, as we're probably better served understanding what each thread is doing first, and then how we control it: 

`thread_spawner`: This functions spawns threads, but what's with its return value? What's a `JoinHandle`? While I'm going to explain things, as usual we are best served by the documentation. In this case the [rust book](https://doc.rust-lang.org/book/ch16-01-threads.html) does an *excellent* job of explaining things. To whit, a thread is an async process. That means its going to go run off, do its own thing, and one day come back with a result. That could be in a microsecond, it could be in a year. Neither we nor the compiler have any way of knowing. That's why we have JoinHandles. JoinHandles are, essentially, blockers. They say "this is a process that will one day return a value". When we call "join" on a JoinHandler, we're saying. "wait here, and give me back whatever result comes out." 

Its actually vitally important that we have blockers like that when we parallelize. Otherwise we can often wind up spawning infinite threads (as our thread spawner doesn't wait for any to finish and just keeps going), slowing down all our threads, or worse, main finishes without waiting for the threads to finish, never giving us our results, and causing the execution to end. Always think about where you're going to block to wait for existing threads to finish when parallelizing. 

`calc_hashes`: This is just our old hash calculation, cut out of main, and tweaked to take some variables so it iterates only over values we care about. It also returns a tuple with answers for p1 and p2, contained in a options block. We've covered option blocks before (or at least Dave has), but in essence, an option block can either be None or a Result. Usually in our case it'll be None, unless we've found an answer within the specific value range we've given this function. 

The key thing to notice about `calc_hashes` is that it iterates over a range of values, meaning we can spawn a thread for something like 1001-2000, without needing to compute the previous values. As mentioned, this is a prerequisite for proper threading. It also needs to be able to return both possible answers, in case we set an absurd range like 10,000,000 and one single thread finds both answers. 

`main`: Now that we understand the other functions, we can look at what `main `is doing. Nothing about it should be that alien. 

First we run the `spawn_thread` function some arbitrary number of times equal to the number of threads we want. This will be determined by your cpu (which will tell you how many threads you can run). You should be trying to match that number, as any higher numbers will result in thread swapping and loss of preformance. It will probably be a base 2 number, but google is your friend here. 

We take those threads and each is responsible for a chunk of numbers, in this case 100,000, after which the thread will return an option with either an answer for p1 or None, and and answer for p2 or None. Theoretically a given thread could find both answers. We make sure to call .join() on each thread so we block for them to be done, then we process all 16 of the threads and look at their answers. We could theoretically do some kind of optimization surrounding the order of calling joins, but that is beyond the scope of our first effort at parallelization. 

The offset is where we start from after a given set of threads have completed. Think of it like a moving index. 

This may *seem* like a lot, but its very possible to do, especially tackling one problem at the time. I suggest trying to get a single thread to spawn, and going from there. You will run into type errors, and all kinds of fun, but all that is part of the system guaranteeing you thread safety. 

Now, with this code under our belt, what does performance time look like? 138,350 microseconds. Not bad, that's a 4x speedup. Now I cheated a little bit, and tried various permutations of threads and ranges. It turns out the optimal time is when you have a number of threads equal to what your cpu can handle and your range is such that you'll find your answer having to spawn threads only once. This was trivial to figure out via trial and error, but I suspect in future problems, we're going to need a more robust approach to that solution. 

Tune in next time, for some password generation (which we will not be able to parallelize).
