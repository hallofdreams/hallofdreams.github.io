---
title: Learning Rust via 2015 Advent of Code
author: David & Felipe
date: 2021-01-04 00:00:00 -0500
categories: [Advent of Code, "2015"]
tags: [programming, rust, david, felipe]     # TAG names should always be lowercase
---

Unlike Dave, I have done some stuff in rust. However I've never actually finished a month of AoC problems, much to my shame. This changes now. 

Dave will be taking on the fun challenge of teaching us rust via error messages, I will be trying something slightly different. One of the issues with AoC is hopping over the cliff between code that "does the thing" and code that actually runs quickly. In the early problems its not a big deal, since generally the leap between an incredible solution and the simplest is a matter of, at most seconds, but as you go into day 25 it starts mattering. So what we'll be doing here is first writing the "obvious" or most natural solution, and bit by bit working towards a more optimized solution. Some days the most natural solution will be the best solution, and on those days we'll explore alternatives, and work out various potential approaches, and see how they work out. This will be an exercise in learning what the rust complier does, via actually using it. I expect the results will both surprise and shock me. 

# [Day 1](https://www.adventofcode.com/2015/day/1)

The first thing to master when looking at the AoC problems is "what the heck is this asking?" early on, its easy, later you spend a long time looking at it wondering what all the words mean, and pondering the true meaning of "elf". So on a first read, the question seems to be asking, "after looking at the input, what floor will we have ended up on?". But really, that can be translated to "How many ( are there, minus how many )" One way to do this, would be to iterate over everything and count, but we can do so in a much more simple way. Say: 

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

A neat thing dave pointed out to me when I was writing this: if we say "(" that refers to the *string* version of the character, if we say '(' that's the character version. It saves us having to do an annoying conversion, so its good to know. 

There's also something I'm doing that's kind of inneficient to avoid sanitizing the text. I use two ifs, instead of an if...else. My expectation is that will raise the evaluation time slightly, since `branch prediction` will treat is as two separate statements, instead of one branching location. (If my understanding is correct, which it may not be! Yell at me on twitter if I'm wrong) 

Our run time is... 180 microseconds, which is an order of magnitude better than our part 1. 

What the heck is going on?

Well, for one, we can surmise that the default iteration speed is *much* faster than the native `.matches()` method. Hazarding a guess why, its because matches takes a regex, and unwraps the string. The code for it in the [rust source](https://doc.rust-lang.org/src/core/macros/mod.rs.html#219-242) seems pretty straight forward, but its clearly designed for a borader use-case than our specific case. 

We also run it twice, which is less than ideal. 

Looking at our part 2, it makes logical sense that we could jam part 1 in there as well. We lose on the bailing out early bit (since we need to count all the parens), but that means out whole program, instead of iterating over the string three times, needs only iterate over it once.

While we're in there lets also get rid of that annoying if...if and make it an if else, and trust that our input is good. I also added a bit to ensure that we only output the result of p2 once, which didn't impact the speed at all it seemed. 

```rust

use std::fs::File;
use std::io::prelude::*;
use std::path::Path;
use std::time::{Instant};
    

fn main(){
        let start = Instant::now();
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

Running it with `cargo run --release` which builds the relase optimized version we get a run time of  141 microseconds. Not at all bad

If we include the file opening... things are less good. It adds almost 90 microseconds, which is non-ideal. 

<section on file opening goes here>
  
# [Day 2](https://www.adventofcode.com/2015/day/2)

Day 2 is the last day I completed in 2015. So from here on out its all new to me. (Well, that's not totally true, I've discussed most problems in AoC with Dave at some point or another.) The problem itself is fairly basic, its one of the fundamental asks in software: take a list of things, and perform mathematical operations on them. Thinking about the problem at a base level, we're going to want some kind of `for...each` loop that looks at each entry, and then does math on it. Looking at the input, it looks like none of the math involves anything more complex than numbers of length 2, so we're likely not looking at any crazy math optimizations to speed things up. I do make note of the limited subset of inputs though, it feels like we might wind up doing something tricky with that. 

A barebones soluton looks something like this. 

```rust
use std::time::{Instant};
use std::fs;
    

fn main(){
        let start = Instant::now();
        let file ="../input.txt";
        let input_string: String = fs::read_to_string(file).unwrap();
        let lines = input_string.lines();
        let lines2 = input_string.lines();

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

I looked at this, and I was pretty satisifed with my solution. It ran in 331 seconds (not counting the file time), and produced the correct answers. Certainly much faster than almost any interpreted language, and a fairly neat solution. 

A brief digression on timing here. You may have noticed Dave consistently gets better times than I do. We did a little testing, it turns out that `cargo run --release` has different perfomance profiles on different OS. I'm running on Windows, Dave is running on linux, and my solutions run much faster on his machine than mine, despite similar hardware profiles. I tested on a really crummy linux box, and it was about 100% faster to run than on Windows. Out of curiosity we also tested on a Mac and found it ran even slower, so it's evident that for some reason rust is much more performant on linux. We're planning to talk about this further in a later post after we run some tests. 

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

Obviously, adding all this overhead should have cost us time, right? We're initalizing arrays, pushing values, merging bytes, this feels like it should be less efficient. Somehow, it isn't. Our runtime for this code was 300 microseconds, to the 330 microseconds of the first appreoach, an almost 10% speedup. Saftey costs time, and by stripping it out we increased the perfomance of our code! 

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

To me, this is much easier to read than our second pass. 
