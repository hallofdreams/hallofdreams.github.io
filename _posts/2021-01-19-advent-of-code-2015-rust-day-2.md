---
title: Learning Rust with Advent of Code - Day 2
author: David & Felipe
date: 2021-01-19 12:00:00 -0500
categories: [Programming, Advent of Code]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
---
<div style="display:none;">2015 Day 2: An arithmetic problem involving the dimensions of presents, wrapping paper, and bows; an easy problem made trickier by not knowing how to convert strings or how to appease borrow chekers.</div>

# [Day 2](https://www.adventofcode.com/2015/day/2)

The problem: you're given a list of dimensions of the form `lxwxh` for an integer length `l`, a width `w`, and a height `h`.

Part 1: Find the total of the surface area plus the area of the smallest side of each rectangular prism .

Part 2: Find the total of the smallest perimeter of any face plus the cubic volume on each rectangular prism.

----

# David

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

----

# Felipe

Day 2 is the last day I completed in 2015. So from here on out its all new to me. (Well, that's not totally true, I've discussed most problems in AoC with Dave at some point or another.) The problem itself is fairly basic, its one of the fundamental asks in software: take a list of things, and perform mathematical operations on them. Thinking about the problem at a base level, we're going to want some kind of `for...each` loop that looks at each entry, and then does math on it. Looking at the input, it looks like none of the math involves anything more complex than numbers of length 2, so we're likely not looking at any crazy math optimizations to speed things up. I do make note of the limited subset of inputs though, it feels like we might wind up doing something tricky with that. 

## Barebones Solution

A barebones soluton looks something like this. 

```rust
use std::time::{Instant};
use std::fs;

fn main(){
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();
        let lines = input_string.lines();
        let lines2 = input_string.lines();

        let start = Instant::now();
        let mut day_2 = 0;
        let mut day_1 = 0;
        for string in lines {
            let mut dimensions = string.split('x')
            .map(|n| n.parse::<usize>().unwrap())
            .collect::<Vec<_>>();

            dimensions.sort();
            let length = dimensions[0];
            let width = dimensions[1];
            let height = dimensions[2];

            let volume: usize = length*width*height;
            let smallest_perimiter: usize = length*2 + width*2;
            let surface_area: usize = (length*width*2) + (length*height*2) + (height*width*2);
            day_1 += surface_area + length*width;

            day_2 += volume + smallest_perimiter;
        }
        print!("day 2: {}", day_2);
        print!("\n day 1: {}", day_1);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

Note that this is optimzied from my first pass solution which used two loops. It made sense to roll part 1 into part 2. The only slightly tricky optimization I do in this first pass is sorting the list of dimensions, so that length and width are always the smallest. It avoids us having to do extra computations and take the minimum, or having a bunch of if statements to replicate the sort. Since the list is only length three, it should be relatively quick. After the fact Dave and I compared our code and found that sorting was about as time consuming as taking the minimum twice, which is what his code does. 

I looked at this, and I was pretty satisifed with my solution. It ran in 331 microseconds (not counting the file time), and produced the correct answers. Certainly much faster than almost any interpreted language, and a fairly neat solution. 

A brief digression on timing here. You may have noticed Dave consistently gets better times than I do. We did a little testing, it turns out that `cargo run --release` has different perfomance profiles on different OS. I'm running on Windows, Dave is running on linux, and my solutions run much faster on his machine than mine, despite similar hardware profiles. I tested on a really crummy linux box, and it was about 100% faster to run than on Windows. Out of curiosity we also tested on a Mac and found it ran even slower, so it's evident that for some reason rust is much more performant on linux. We're planning to talk about this further in a later post after we run some tests. 

## Byte Parsing

Returning to the problem at hand, I wondered though, if this being rust, we couldn't get into the weeds, and do something to speed things up. 

```rust 
let mut dimensions = string.split('x')
            .map(|n| n.parse::<usize>().unwrap())
            .collect::<Vec<_>>();
```

This block in particular looked supicious to me. Reading the file as a string wasn't a big lift for rust, after all, strings are just collections of bytes, but parsing the bytes into groups and ensuring you translate any multi-byte characters correctly (like emojis) does take up some headroom. Further, we then had to perform a split operation and convert stings to integers, which I was convinced was a major time sink. 

What then, if we just took our string, which is a byte array, and parsed it by hand. Usually you need a lot of saftey around these operations because you could have any arbitrary input, but we control our input here, we know its going to be only numbers, and the "x" character. No emojis, chinese characters, umlauts or escaped characters. If we did not control our input, this would be a recipie for disaster. I was convinced this wouldn't *actually* save time, given that rust is already very efficient, and that inbuilt methods tend to be pretty good. Still I was looking for an excuse to get into the weeds (or the bytes in this case), and I figured a simple solution wouldn't take that long. 

```rust 
use std::time::{Instant};
use std::fs;

fn main(){
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();
        let lines = input_string.lines();
        let lines2 = input_string.lines();

        
        let mut day_2 = 0;
        let mut day_1 = 0;
        let start = Instant::now();
        for string in lines {
            let byte_dimensions = string.as_bytes();
            let mut dimensions = vec![];
            let mut num = vec![];
            
            for byte in byte_dimensions {
  
                if(*byte == 120u8){
                    let mut final_num = 0;
                    for b in num.iter(){
                        final_num = final_num * 10u8 + b;
                    }
                    dimensions.push(final_num);
                    num = vec![];
                }else{
                    num.push(*byte-48);
                }
                
            }
            let mut final_num = 0;
            for b in num.iter(){
                final_num = final_num * 10u8 + b;
            }
            dimensions.push(final_num);
            num = vec![];

            dimensions.sort();
            let length = dimensions[0] as u64;
            let width = dimensions[1] as u64;
            let height = dimensions[2] as u64;

            let volume: u64 = length*width*height;
            let smallest_perimiter: u64 = length*2 + width*2;

            day_2 += volume + smallest_perimiter;
            let surface_area: u64 = (length*width*2) + (length*height*2) + (height*width*2);
            day_1 += surface_area + length*width;
        }
        print!("day 1: {} day 2: {}", day_1, day_2);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```
Getting there was slightly more involved than I expected. Basically the byte representation of each number is simply its byte value minus 48 (good to know for those annoying algorithm problems that sometimes show up in intervews!), and we knew no number was going to be longer than 2 characters in length, so we could handle both cases with relative ease. Our delimiter character is an "x" which in bytecode is represented by the number 120, and since we're reading line by line, we have to parse the last number, which won't end with an "x" after we've calcuated the first two. 

To whit, we scan the bytes, and if they're numbers we put them in a "number array" which is our representation of the number, if it's an "x" we interpret this array to form a number and shove it into the dimensions array, and when we reach the end of the line we wrap up the last number. 

Another consideration is we have to recast our sum to be u64 or we'll overflow the variable and wind up with incorrect numbers. 

Other than that, the code is exactly the same as our first pass. 

Obviously, adding all this overhead should have cost us time, right? We're initalizing arrays, pushing values, merging bytes, this feels like it should be less efficient. Somehow, it isn't. Our runtime for this code was 300 microseconds, to the 330 microseconds of the first appreoach, an almost 10% speedup. Safety costs time, and by stripping it out we increased the perfomance of our code! 

## Byte File Reader

From here, it made natural sense to just skip the conversion to a string at all. Rust can very capably read the whole file from end to end as bytes (since strings are just byte arrays), and we can parse the whole string of bytes, saving us the need to split by lines, or even use any inbuilt character parsing. 

```rust
use std::time::{Instant};
use std::io::prelude::*;
use std::fs::File;

fn file_reader(path:&str) -> Vec<u8>{
    let f = File::open(path);
    let mut buffer = Vec::new();
    let mut file:File;
    match f {
        Ok(v) => file = v,
        Err(e) => panic!("error: {:?}", e),
    }

    // read the whole file
    let res = file.read_to_end(&mut buffer);
    match res {
        Ok(_) => return buffer,
        Err(e) => panic!("error: {:?}", e),
    }
}

fn main(){
        let start = Instant::now();
        let file ="../input.txt";
        let byte_buffer = file_reader(file);

        let mut day_2 = 0;
        let mut day_1 = 0;
        let mut dimensions = vec![];
        let mut num = vec![];
        for byte in byte_buffer {
            
            if byte == 120u8 || byte == 10u8 {
                let mut final_num = 0;
                for b in num.iter(){
                    final_num = final_num * 10u8 + b;
                }
                dimensions.push(final_num);
                num = vec![];
            }else{
                num.push(byte-48);
            }
              
            if byte == 10u8 {
                dimensions.sort();
                let length = dimensions[0] as u64;
                let width = dimensions[1] as u64;
                let height = dimensions[2] as u64;

                let volume: u64 = length*width*height;
                let smallest_perimiter: u64 = length*2 + width*2;

                day_2 += volume + smallest_perimiter;
                let surface_area: u64 = (length*width*2) + (length*height*2) + (height*width*2);
                day_1 += surface_area + length*width;
                dimensions = vec![]
            }
        }
        print!("day 1: {} day 2: {}", day_1, day_2);
        let end = start.elapsed().as_micros();
        print!("\n execution time in microseconds {}", end);
}
```

The primary change is that instead of reading each line, we scan for the line break character, "\n" represented by the number 10. This lets us know we've hit the end of a line and can do the requisite math. The logic for checking for x's and putting our numbers together remains the same, and the cleanup logic just moves into the block that looks for the linebreak character. 

To me, this is much easier to read than our second pass. Its also faster, it runs in 263 microseconds, almost 20% faster than our original solution. It also opens the file just one single microsecond faster, which suggests there's not much of a time gain to be made in the file opening bit, at least not unless we really want to get our hands dirty...

There is a lesson to take away here, from the point of view of our desire to write the fastest code possible: more often than not, inbuilt methods include a lot of security precautions we don't need at all. If we can control our input, writing our own parsing will more often than not be faster. 

This is not the last time we'll be seeing bytes, or byte arrays. 

Join us next time where we try to use datastructures in ways they were never intended. 
