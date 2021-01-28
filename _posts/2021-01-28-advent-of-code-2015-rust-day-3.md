---
title: Learning Rust with Advent of Code - Day 3
author: David & Felipe
date: 2021-01-28 12:00:00 -0500
categories: [Advent of Code, "2015"]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
---

# [Day 3](https://adventofcode.com/2015/day/3)

The problem: you're given a number of one-character cardinal directions, with `^` representing `north`, `v` representing `south`, `>` representing `east`, and `<` representing `west`.

Part 1: Starting at `0,0`, find how many grid positions are visited at least once by an agent following all directions.

Part 2: Starting at `0,0`, find how many grid positions are visited at least once by either of two agents, who take turns following all directions.

----

# David

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

No error messages yet, because this is all stuff we've done before.  Now we need to add the `HashMap`; I'll try turning `x` and `y` into a string, concatenating them with a comma in between, and then using the resulting string as a key.  

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

## Attempt 0.3

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

## Attempt 1.4
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

## Attempt 1.5
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

# Felipe

I promised we'd use datastructures wrong today, and while I didn't go *quite* as far as I planned to on that front, we still do some interesting things. 

The problem, as you already know is about Santa visiting houses and keeping track of which houses have been visited. If you've ever done software interviews, you've run into a variation of this problem... letter counting. The way the problem is usually phrased as "Write a program, that given an arbitrary string, will return which letter appears the most frequently." It doesn't *sound* anything like this problem, but its foundationally the same. It requires you to iterate over a string and keep a ledger of some kind tracking the results of each character in the string. If you're *not* super familiar with software, you probably imagined you have to build a map using a 2D array, and keep track of the position of the Santa, and flatten that... but you really don't.

What matters here is 

1. Tracking the location of Santa 
2. Tracking houses that have been visited

You *can* do that by drawing a map, but its a miserable exercise. You can also acomplish that by having a coordinate pair that tells you where Santa is, and a HashMap that keeps track of visited coordinates. The arguments in favor of the HashMap are many, namely we'll be looking at a really fast read and write time (O(1) write, read and insert times, except if we have to rebalance the buckets, which shouldn't happen frequently). 

Visualizing what this code will look like, we can imagine we'll make a HashMap to store the coordinates we've visited, we'll have a pair of coordinates to know where Santa is, and we'll have an iterator that will parse the string of moves. P2 just requires us to alternate between two Santas, which we can do by tracking if our current move is odd or even. We could have a bool we flip, or increment a counter, or anything really as long as it consistently swaps moves. 

Thus our V1 of the code looks something like this:

## Initial Version

```rust 
use std::time::{Instant};
use std::fs;
use std::collections::HashMap;

fn main(){
       
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();

        let start = Instant::now();
  
        let mut santa_1_x = 0;
        let mut santa_2_x = 0;
        let mut santa_3_x = 0;
        let mut santa_1_y = 0;
        let mut santa_2_y = 0;
        let mut santa_3_y = 0;

        let mut curr_turn = 0;

        let mut visited_santa_1 = HashMap::new();
        let mut visited_other_santas = HashMap::new();

        visited_santa_1.insert((0,0), true);
        visited_other_santas.insert((0,0), true);

        for c in input_string.chars() { 
            if(c == '^'){
                santa_1_x += 1;
                if(curr_turn % 2 == 0){
                    santa_2_x += 1;
                }else{
                    santa_3_x += 1;
                }
            }
            else if(c == 'v'){
                santa_1_x -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_x -= 1
                }else{
                    santa_3_x -= 1
                }
            }
            else if(c == '>'){
                santa_1_y += 1;
                if(curr_turn % 2 == 0){
                    santa_2_y += 1
                }else{
                    santa_3_y += 1
                }
            }
            else if(c == '<'){
                santa_1_y -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_y -= 1
                }else{
                    santa_3_y -= 1
                }
            }
            
            visited_santa_1.insert((santa_1_x, santa_1_y), true);
            if(curr_turn % 2 == 0){
                visited_other_santas.entry((santa_2_x, santa_2_y)).or_insert(true);
            }else{
                visited_other_santas.entry((santa_3_x, santa_3_y)).or_insert(true);
            }
            curr_turn += 1;
        }

        let p1 = visited_santa_1.keys().len();
        let p2 = visited_other_santas.keys().len();
        print!("\n day 1: {}", p1);
        print!("\n day 2: {}", p2);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```
 Our run time is something like 698 microseconds, which is pretty good. But we can do better. 
 
 A small immediate improvement that comes to mind is not doing `keys.len` at the end, since that's essentially iterating over the existing dict. Instead we can check if the key is in use when we go to write, and if it is not, we increment our counter by 1. Something like this: 
 
## Counter vs. Keys.len
 
```rust
use std::time::{Instant};
use std::fs;
use std::collections::HashMap;
use std::collections::hash_map::Entry;

fn main(){
       
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();

        let start = Instant::now();
  
        let mut santa_1_x = 0;
        let mut santa_2_x = 0;
        let mut santa_3_x = 0;
        let mut santa_1_y = 0;
        let mut santa_2_y = 0;
        let mut santa_3_y = 0;

        let mut curr_turn = 0;

        let mut visited_santa_1 = HashMap::new();
        let mut visited_other_santas = HashMap::new();

        visited_santa_1.insert((0,0), true);
        visited_other_santas.insert((0,0), true);

        let mut p1 = 0;
        let mut p2 = 0;

        for c in input_string.chars() { 
            if(c == '^'){
                santa_1_x += 1;
                if(curr_turn % 2 == 0){
                    santa_2_x += 1;
                }else{
                    santa_3_x += 1;
                }
            }
            else if(c == 'v'){
                santa_1_x -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_x -= 1
                }else{
                    santa_3_x -= 1
                }
            }
            else if(c == '>'){
                santa_1_y += 1;
                if(curr_turn % 2 == 0){
                    santa_2_y += 1
                }else{
                    santa_3_y += 1
                }
            }
            else if(c == '<'){
                santa_1_y -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_y -= 1
                }else{
                    santa_3_y -= 1
                }
            }
            
            match visited_santa_1.entry((santa_1_x, santa_1_y)) {
                Entry::Occupied(_) => (),
                Entry::Vacant(v) => {
                                    v.insert(true);
                                    p1 += 1
                }
            }
            if(curr_turn % 2 == 0){
                match visited_other_santas.entry((santa_2_x, santa_2_y)) {
                    Entry::Occupied(_) => (),
                    Entry::Vacant(v) => {
                                        v.insert(true);
                                        p2 += 1
                    }
                };
                match visited_other_santas.entry((santa_3_x, santa_3_y)){
                    Entry::Occupied(_) => (),
                    Entry::Vacant(v) => {
                                        v.insert(true);
                                        p2 += 1
                    }
                };
            }
            curr_turn += 1;
        }
        print!("\n day 1: {}", p1);
        print!("\n day 2: {}", p2);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

Which gives us a runtime of... 670 microseconds. A 20 microsecond improvement. Not as good as we'd like, but not terrible. Iterating over the map in memory was obviously not that time consuming. 

Lets examine the problem-space and see if we can come up with any more ideas. 

For one, we know we're dealing with a fixed dataset that has a maximum number of 8192 moves. This means our physical grid is really no larger than 8192x8192, even assuming all the moves are in one direction. The movement is also not random. Mapping out the moves we get an image that looks like this: 

[![Click to view larger image](/assets/img/Rust_AoC_2015_Day_3_2_RandomWalk.png)](/assets/img/Rust_AoC_2015_Day_3_2_RandomWalk.png)

This is *not* a random walking path. Generally walking paths in small iterations cluster around a central node, and migrate slightly from side to side as a new random center is determined. If there were a flat 25% chance of going a specific direction, we would have a much tighter knot, and none of these long spawning paths going off into the distance. If this were a much broader dataset, we could consider doing some kind of memoization of move patterns, or limited compression... but we only have 8000ish moves. Which makes that unlikely to be fruitful. In fact, the more I considered optimizations, the more i realized, there's no way to avoid scanning the memory space once, and doing it more than once is probably inefficient. I had however, one last idea. What if we could improve on the map? I considered a [Trie](https://en.wikipedia.org/wiki/Trie), but the insertion time seemed generally worse or equal to a map. Since we only had 2000ish dict entries, we are probably not running into a lot of bucket rebalancing. 

Alright, fine, what if we used an Array? Instead of having a tuple key, we could turn the coordinate tuple into an integer key, access the array directly by index (O(1)) and writing directly (O(1)). Sure our array would have to be big. Massive in fact to make it work, but memory is not a real concern. Arrays aren't *meant* to be used as HashMap substitutes, but maybe it'll be faster than our match statements?  

## Preallocated Array

```rust
use std::time::{Instant};
use std::fs;

fn main(){
       
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();

        let start = Instant::now();
  
        let mut santa_1_x = 4000;
        let mut santa_2_x = 4000;
        let mut santa_3_x = 4000;
        let mut santa_1_y = 4000;
        let mut santa_2_y = 4000;
        let mut santa_3_y = 4000;

        let mut curr_turn = 0;


        let mut visited_santa_1: [u8; 8000*8000] = [0; 8000*8000];
        let mut visited_other_santas: [u8; 8000*8000] = [0; 8000*8000];

        visited_santa_1[santa_1_x*8000 + santa_1_y ] = 1;
        visited_other_santas[santa_2_x*8000 + santa_2_y ] = 1;

        let mut p1 = 1;
        let mut p2 = 1;

        for c in input_string.chars() { 
            if(c == '^'){
                santa_1_x += 1;
                if(curr_turn % 2 == 0){
                    santa_2_x += 1;
                }else{
                    santa_3_x += 1;
                }
            }
            else if(c == 'v'){
                santa_1_x -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_x -= 1
                }else{
                    santa_3_x -= 1
                }
            }
            else if(c == '>'){
                santa_1_y += 1;
                if(curr_turn % 2 == 0){
                    santa_2_y += 1
                }else{
                    santa_3_y += 1
                }
            }
            else if(c == '<'){
                santa_1_y -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_y -= 1
                }else{
                    santa_3_y -= 1
                }
            }

            if visited_santa_1[santa_1_x*8000 + santa_1_y ] != 1{
                visited_santa_1[santa_1_x*8000 + santa_1_y ] = 1;
                p1 += 1;
            }
            
            if(curr_turn % 2 == 0){
                if visited_other_santas[santa_2_x*8000 + santa_2_y ] != 1{
                    visited_other_santas[santa_2_x*8000 + santa_2_y ] = 1;
                    p2 += 1;
                }
            }else{
                if visited_other_santas[santa_3_x*8000 + santa_3_y ] != 1{
                    visited_other_santas[santa_3_x*8000 + santa_3_y ] = 1;
                    p2 += 1;
                }
            }
            curr_turn += 1;
        }
        print!("\n day 1: {}", p1);
        print!("\n day 2: {}", p2);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

Some arrays, set to be 64000000 entries in size. That's 64 million. We'll populate it all with zeroes, and it will be principally full of zeroes. Our poor mans hashing algorithm to index into the array will be 8000(x_coord) + y+coord, and we'll move our coordinate space so all values inside it are positive. (Roughly, we should have built a bigger space to make *sure* we weren't dipping into the negatives, but being an initial test, this will do. 

`thread 'main' has overflowed its stack`

Alright, we did it. We can pack up and go home. I beat Dave to the error of errors. 

Arrays in rust are contiguous in memory, and we asked a little too much from our available memory space. Theoretically we should be using the rust [Box](https://doc.rust-lang.org/std/boxed/struct.Box.html) to allocate our memory into the heap instead. Or we could try using a Vec. A Vec is *like* an array, but it allocates its memory in the heap instead of the stack and it's not of fixed size. (If "heap" and "stack" are mystery words to you, I highly recommend [this bit](https://doc.rust-lang.org/1.22.0/book/first-edition/the-stack-and-the-heap.html) of the rust book) That's all a bunch of overhead I wanted to skip, but it looks like there's no getting around it. Lets try it with a vector. 

## Preallocated Vectors

```
use std::time::{Instant};
use std::fs;

fn main(){
       
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();

        let start = Instant::now();
  
        let mut santa_1_x = 4000;
        let mut santa_2_x = 4000;
        let mut santa_3_x = 4000;
        let mut santa_1_y = 4000;
        let mut santa_2_y = 4000;
        let mut santa_3_y = 4000;

        let mut curr_turn = 0;


        let mut visited_santa_1 = vec![0; 8000*8000];
        let mut visited_other_santas = vec![0; 8000*8000];

        visited_santa_1[santa_1_x*8000 + santa_1_y ] = 1;
        visited_other_santas[santa_2_x*8000 + santa_2_y ] = 1;

        let mut p1 = 1;
        let mut p2 = 1;

        for c in input_string.chars() { 
            if(c == '^'){
                santa_1_x += 1;
                if(curr_turn % 2 == 0){
                    santa_2_x += 1;
                }else{
                    santa_3_x += 1;
                }
            }
            else if(c == 'v'){
                santa_1_x -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_x -= 1
                }else{
                    santa_3_x -= 1
                }
            }
            else if(c == '>'){
                santa_1_y += 1;
                if(curr_turn % 2 == 0){
                    santa_2_y += 1
                }else{
                    santa_3_y += 1
                }
            }
            else if(c == '<'){
                santa_1_y -= 1;
                if(curr_turn % 2 == 0){
                    santa_2_y -= 1
                }else{
                    santa_3_y -= 1
                }
            }

            if visited_santa_1[santa_1_x*8000 + santa_1_y ] != 1{
                visited_santa_1[santa_1_x*8000 + santa_1_y ] = 1;
                p1 += 1;
            }
            
            if(curr_turn % 2 == 0){
                if visited_other_santas[santa_2_x*8000 + santa_2_y ] != 1{
                    visited_other_santas[santa_2_x*8000 + santa_2_y ] = 1;
                    p2 += 1;
                }
            }else{
                if visited_other_santas[santa_3_x*8000 + santa_3_y ] != 1{
                    visited_other_santas[santa_3_x*8000 + santa_3_y ] = 1;
                    p2 += 1;
                }
            }
            curr_turn += 1;
        }
        print!("\n day 1: {}", p1);
        print!("\n day 2: {}", p2);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

This does not crash, but the results are disappointing. Our massive fixed size vector is worst than a map (which we kind of expected). The runtime for this is about 1000 microseconds, 300 more than our first solution. Unsurprisingly, almost 770 of those microseconds are in initializing the vecors. If we compare the runtime not counting the time it takes to creat the vectors, the vector solution is actually almost 400 microseconds faster (we also skipped initalizating the HashMaps for fairness)! 

What does this mean? If we had a fixed dimension for the Santa traveling, and a much larger dataset, then it seems likely the array based solution would be *faster*. Its a reminder to always consider what your problem space actually is, and analyze the specific data you're working with, since that will dictate what solutions work best. Everything is a tradeoff, and when you're chasing speed (as we are), you can make other tradeoffs (like making sacrifices in memory) 

Join us next time while we try to do things in parallel. 
