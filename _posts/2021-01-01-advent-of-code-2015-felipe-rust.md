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
  
# [Day 2](https://www.adventofcode.com/2015/day/2)

Day 2 is the last day I completed in 2015. So from here on out its all new to me. (Well, that's not totally true, I've discussed most problems in AoC with Dave at some point or another.) The problem itself is fairly basic, its one of the fundamental asks in software: take a list of things, and perform mathematical operations on them. Thinking about the problem at a base level, we're going to want some kind of `for...each` loop that looks at each entry, and then does math on it. Looking at the input, it looks like none of the math involves anything more complex than numbers of length 2, so we're likely not looking at any crazy math optimizations to speed things up. I do make note of the limited subset of inputs though, it feels like we might wind up doing something tricky with that. 

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

# [Day 3](https://www.adventofcode.com/2015/day/2)

I promised we'd use datastructures wrong today, and while I didn't go *quite* as far as I planned to on that front, we still do some interesting things. 

The problem, as you already know is about Santa visiting houses and keeping track of which houses have been visited. If you've ever done software interviews, you've run into a variation of this problem... letter counting. The way the problem is usually phrased as "Write a program, that given an arbitrary string, will return which letter appears the most frequently." It doesn't *sound* anything like this problem, but its foundationally the same. It requires you to iterate over a string and keep a ledger of some kind tracking the results of each character in the string. If you're *not* super familiar with software, you probably imagined you have to build a map using a 2D array, and keep track of the position of the Santa, and flatten that... but you really don't.

What matters here is 

1. Tracking the location of Santa 
2. Tracking houses that have been visited

You *can* do that by drawing a map, but its a miserable exercise. You can also acomplish that by having a coordinate pair that tells you where Santa is, and a HashMap that keeps track of visited coordinates. The arguments in favor of the HashMap are many, namely we'll be looking at a really fast read and write time (O(1) write, read and insert times, except if we have to rebalance the buckets, which shouldn't happen frequently). 

Visualizing what this code will look like, we can imagine we'll make a HashMap to store the coordinates we've visited, we'll have a pair of coordinates to know where Santa is, and we'll have an iterator that will parse the string of moves. P2 just requires us to alternate between two Santas, which we can do by tracking if our current move is odd or even. We could have a bool we flip, or increment a counter, or anything really as long as it consistently swaps moves. 

Thus our V1 of the code looks something like this 

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
 
 ```
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

[insert image here]

This is *not* a random walking path. Generally walking paths in small iterations cluster around a central node, and migrate slightly from side to side as a new random center is determined. If there were a flat 25% chance of going a specific direction, we would have a much tighter knot, and none of these long spawning paths going off into the distance. If this were a much broader dataset, we could consider doing some kind of memoization of move patterns, or limited compression... but we only have 8000ish moves. Which makes that unlikely to be fruitful. In fact, the more I considered optimizations, the more i realized, there's no way to avoid scanning the memory space once, and doing it more than once is probably inefficient. I had however, one last idea. What if we could improve on the map? I considered a [Trie](https://en.wikipedia.org/wiki/Trie), but the insertion time seemed generally worse or equal to a map. Since we only had 2000ish dict entries, we are probably not running into a lot of bucket rebalancing. 

Alright, fine, what if we used an Array? Instead of having a tuple key, we could turn the coordinate tuple into an integer key, access the array directly by index (O(1)) and writing directly (O(1)). Sure our array would have to be big. Massive in fact to make it work, but memory is not a real concern. Arrays aren't *meant* to be used as HashMap substitutes, but maybe it'll be faster than our match statements?  

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


# [Day 4](https://www.adventofcode.com/2015/day/4)


#### Understanding MD5

I promised we'd do things in parallel today, and we shall, but first, lets try to solve the base problem. Essentially what we're being asked to do is compute a large amount of static content that is not depenendent on previous content. Specifically we're looking at md5 hashes, which is a one way transformation applied to a specific string. We don't need to understand the algorithm fully since we have a crate to implement it for us... but we probably should at least look at it. Because sometimes we can find shortcuts for our specific use-case. 

Like all challenging problems, we start by looking for an explanation of what the heck we're dealing with. Usually this means wikipedia. A quick search takes us [here](https://en.wikipedia.org/wiki/MD5). We should read carefully in case there's a footnote pointing to "by the way there's a super known vulnerability that happens to answer your problem", but alas that's not the case. Some neat info and what I can only describe as a bunch of mathematicall mumbo-jumbo. I'm sure if I were Dave this would make perfect sense, but I don't have the same math background. 

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

1. Our times is probably best spent not reinventing the wheel. Its unlikely that as a crypto amateur I'm going to somehow discover a better way to do MD5 hashes. 

Still, that was by no means a waste of time. We learned a little about hashing algorithms, and about reading dense mathy looking things. We can now confidently use the md5 crate without it being a black box. 

#### First Attempt

So lets get back to code. Lets write the base, simple implementation of what our algorithm might look like. As a reminder, we're trying to compute the smallest value which appended to our input, results in an md5 hash starting with 5 zeroes for part 1, and 6 zeroes for part 2

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

#### Parallelization
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
                	        Some(result) =>  {
                                            if result < answer1 || answer1 == 0 {
                                                answer1 = result;
                                            }
                            }
                			None => continue
                        };
                        match options.1 {
                	        Some(result) =>  {
                                            if result < answer2 || answer2 == 0 {
                                                answer2 = result;
                                            }
                            }
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

`thread_spawner`: This functions spawns threads, but what's with its return value? What's a `JoinHandle`? While I'm going to explain things, as usual we are best served by the documentation. In this case the [rust book](https://doc.rust-lang.org/book/ch16-01-threads.html) does an *excelent* job of explaining things. To whit, a thread is an async process. That means its going to go run off, do its own thing, and one day come back with a result. That could be in a microsecond, it could be in a year. Neither we nor the compiler have any way of knowing. That's why we have JoinHandles. JoinHandles are, essentially, blockers. They say "this is a process that will one day return a value". When we call "join" on a JoinHandler, we're saying. "wait here, and give me back whatever result comes out." 

Its actually vitally important that we have blockers like that when we parallelize. Otherwise we can often wind up spawning infinite threads (as our thread spawner doesn't wait for any to finish and just keeps going), slowing down all our threads, or worse, main finishes without waiting for the threads to finish, never giving us our results, and causing the execution to end. Always think about where you're going to block to wait for existing threads to finish when parallelizing. 

`calc_hashes`: This is just our old hash calculation, cut out of main, and tweaked to take some variables so it iterates only over values we care about. It also returns a tuple with answers for p1 and p2, contained in a options block. We've covered option blocks before (or at least Dave has), but in essence, an option block can either be None or a Result. Usually in our case it'll be None, unless we've found an answer within the specific value range we've given this function. 

The key thing to notice about `calc_hashes` is that it iterates over a range of values, meaning we can spawn a thread for something like 1001-2000, without needing to compute the previous values. As mentioned, this is a prerequisite for proper threading. It also needs to be able to return both possible answers, in case we set an absurd range like 10_000_000 and one single thread finds both answers. 

`main`: Now that we understand the other functions, we can look at what `main `is doing. Nothing about it should be that alien. 

First we run the `spawn_thread` function some arbitrary number of times equal to the number of threads we want. This will be determined by your cpu (which will tell you how many threads you can run). You should be trying to match that number, as any higher numbers will result in thread swapping and loss of preformance. It will probably be a base 2 number, but google is your friend here. 

We take those threads and each is responsible for a chunk of numbers, in this case 100000, after which the thread will return an option with either an answer for p1 or None, and and answer for p2 or None. Theoretically a given thread could find both answers. We make sure to call .join() on each thread so we block for them to be done, then we process all 16 of the threads and look at their answers. We could theoretically do some kind of optimization surrounding the order of calling joins, but that is beyond the scope of our first effort at parallelization. 

The offset is where we start from after a given set of threads have completed. Think of it like a moving index. 

This may *seem* like a lot, but its very possible to do, especially tackling one problem at the time. I suggest trying to get a single thread to spawn, and going from there. You will run into type errors, and all kinds of fun, but all that is part of the system guaranteeing you thread safety. 

Now, with this code under our belt, what does performance time look like? 138350 microseconds. Not bad, that's a 4x speedup. Now I cheated a little bit, and tried various permutations of threads and ranges. It turns out the optimal time is when you have a number of threads equal to what your cpu can handle and your range is such that you'll find your answer having to spawn threads only once. This was trivial to figure out via trial and error, but I suspect in future problems, we're going to need a more robust approach to that solution. 

Tune in next time, for some password generation (which we will not be able to parallelize).

# [Day 5](https://www.adventofcode.com/2015/day/5)

Day 5 is... boring. There's no other word for it. Its a fairly straightforward problem, and it takes someone more clever than I to come up with an exciting optimization. (I'm sure someone has). Dave and I spent a couple hours speculating about potential avenues to optimize, but it turns out its quite hard to improve on doing things in a single pass. 


But enough  bellyaching, lets look at the problem. Day 5 asks us to parse a long list of stings, and count how many of them are naughty, and how many are nice. Instinctually by now, we should know we're going to iterate over the list and do operations on the strings. Scanning the rules: 

```
t contains at least three vowels (aeiou only), like aei, xazegov, or aeiouaeiouaeiou.
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


# [Day 6](https://www.adventofcode.com/2015/day/6)

Today we're grapping with one of the most frustrating things in computer science. When you know there's a *better* answer, but you just can't reach it, despite your best efforts. Dave and I spent at least a month talking about pretty much every permutation of a solution, and prototyping various approaches. This problem is actually a great example of the type of problem where you can conceptualize it in a variety of ways, and try to solve it from different angles. 

First, a disclaimer, the majority of the thrust of the thinking will be focused on part 1 of the problem, because we were confident a solution that solved p1 well could be adopted to p2. This is not *necessarily* true, but we were willing to accept a super elegant p1 and then think about how to solve p2 elegantly. With that out of the way, lets hop right in. 

First, lets nail down the problem. It describes a grid, 1000 long, 1000 wide, in which each square contains a light. We want to toggle those lights on and off following a sequence of instructions. A few initial thoughts: 

1. Order matters, we can't multithread the instructions
2. There's probably an o(n) solution where we iterate over the instructions once 
3. The o(n) solution is actually o(n*m), where m is the number of lights toggled in each instruction, unless we find a way to treat a set of instructions like a block
4. The easiest representation of this is probably an array of arrays, e.g. a matrix
5. A matrix opens the door to matrix algebra as a potential simplification
6. Dave's favorite solution to simplify matrix problems is something known as a sparse matrix. We'll probably have to at least try one. 

The basic, O(n) solution (where n stands for the number of instructions), is the very basic brute force solution that we probably came to instinctually, namely to create an array of arrays initialized at 0 representing the grid, and execute every instruction in order. And that works, its a good solution, but the itch in my brain tells me we can do better. 

Not just better, I believe we can create a soluton that works on a million by a million grid, with tens of thousands of instructions. That is really the goal here. To find a solution that doesn't just solve the problem, but that solves the problem if it gets ridiculous. 

## Matrix Solutions

![Matrices](/assets/img/Rust_AoC_2015_Day_6_1_matrix.png)

The first thing we discussed was removing redundant instructions. E.g. flipping a block that is already off doesn't do anything... but scouting ahead to prune instructions adds complexity for not much gain, so that was right out. I wondered if given the nature of matrix algebra we could compress all the instructions into a single instruction which we would then execute as a final step to figure out the state of the grid. That seemed promising at first, since there's a [linear algebra crate](https://rust-lang-nursery.github.io/rust-cookbook/science/mathematics/linear_algebra.html) that might do what we need. 

Ok so that's a promising opening, but one that fizzled out quickly. To represent a set of instructions as a matrix, we have to create an instruction matrix, and apply it on top of the previous instructions, which complexity wise, winds up taking just as long, or longer than applying the instructions to the grid directly. So that's a no go. Which sort of knocks out matrix algebra a possibility. Thankfully, because I wasn't exactly looking forward to the math. 

So we probably don't want to do linear algebra directly, but what about sparse matrices? I only happen to know they exist because Dave keeps evangelizing them to me, and this seems like a circumstance where it could be genuinely useful. What the heck is a sparse matrix though? And how would you discover they exist if you didn't have Dave? 

A sparse matrix is a data structure optimized for holding a matrix where *most* of the entries are 0 valued. That is, for example, if you had a 1000x1000 grid where only ten squares had non-zero values. Usually this is represented as a triplet structure, where we store a pair of coordinates and a value, but most programming languages have some kind of crate or module to represent these, and indeed, [rust does too](https://docs.rs/sprs/0.10.0/sprs/), so we don't have to worry about how we would implement it ourselves, because we wont. 

What if you'd never heard of a sparse matrix before? How would you arrive at something like this? The key is to think about two things. 

1. What data do I care about?
2. Is there a data structure tuned for this data?

Point one you can answer pretty easily. You don't care at all about anything flipped to zero, you only care about data in your matrix that is non-zero. That's a bunch of key words you can search for. For example `matrix with non-zero data` gives us a number of reference pages for programming languages, the majority of which wind up referencing sparse matrices. I'll note that there are several iterations which do not give the results you want, like `matrix of zeros`. Generally I find explicitly calling out what you want, rather than something adjacent will give you the best results. 

Here's the thing though. It doesn't actually save us much time if any. Our data isn't sparse enough, as we rapidly discovered looking at what the final soluton turns out to be. We have about as many 1's as 0's, and the performance gain isn't there. Its the beginning of a solution path that will actually bare fruit, but the key word "sparse matrix", isn't where the solution lies. 


![Solution](/assets/img/Rust_AoC_2015_Day_6_2_solution.png)

*What the final solution looks like. Thanks Dave*

The important takeaway here is that we *don't* care about zeroes. In fact, we could be in an infinitely large grid, and it wouldn't matter, since only the bounds of our instructions are relevant...

## Rectangles

![Rectangles](/assets/img/Rust_AoC_2015_Day_6_4_rec_header.jpg)

The matrix solutions didn't sit right with me, because ultimately they're an inelegant representation of coordinate sets. You know what also defines an arbitrary region of space on a grid? A rectangle. Taking the previous idea of overlapping instructions, if we represent each instruction as an *area*, we avoid the issue of needing to instantiate a matrix for each new instruction set. 

Simple enough... except we have to do it all in one iteration to compete with the brute force solution. We can't just generate a set of instructions as rectangles and then apply them on the grid, because we're not saving any time. Instead we have to consider the primary grid (the one we claimed not to care about earlier.) as a rectangle on top of which we're playing the other rectangles. This gets hairy, fast. Not that that's going to deter us. 

The goal of course, is to not need to execute extraneous instructions by eliminating unneeded rectangles, and then at the very end get the non-overlapping area of all lit rectangles. This seems overly complex, probably because it is, but there are several data structures that might help us, and I remain steadfast in the idea that there is an optimal solution here. 

Ok, so the first problem you have to solve to fix this using rectangles is "how do you determine if two rectangles are overlapping". You'd think this would be trivial. Its not. Its solved, but its annoying. You can do fancy vector stuff, but that was beyond what I wanted to investigate. Another solution is to check to see if any of the four corners of either rectangle is bounded by the area of the other. That takes 16 Boolean logic checks, is easy to mess up, and misses a core case. 

Alright, fine, lets look at all the possible cases then. To help with this Dave whipped up a visualization in Mathematica. It boils down to four potential overlap cases

![solutions](/assets/img/Rust_AoC_2015_Day_6_5_rec_test.jpg)

One way to think about it is to look at the overlap of line segments, but again, there's a lot of cases to consider there. I went as far as coding out a monster function to do this, when Dave proposed something much simpler. (It only took us 1200 words to get to the first line of code this time. By the time we reach day 25 I hope to have had a blog with no actual code) 

```rust
use std::cmp;

struct Rectangle {
    xmin: i64,
    ymin: i64,
    xmax: i64,
    ymax: i64
}

fn rect_overlap(rect1: Rectangle, rect2: Rectangle) -> Option<Rectangle> {
    let left_x = cmp::max(rect1.xmin, rect2.xmin);
    let right_x = cmp::min(rect1.xmax, rect2.xmax);
    let top_y = cmp::max(rect1.ymin, rect2.ymin);
    let bottom_y = cmp::min(rect1.ymax, rect2.ymax);
    
    if left_x <= right_x && top_y <= bottom_y {
        return Some (Rectangle {
            xmin: left_x,
            ymin: top_y,
            xmax: right_x,
            ymax: bottom_y
        })
    } else {
        return None
    }
}
```

This is much more elegant, and doesn't require doing the various checks I was doing in my initial iteration, while working on roughly the same principles. 

Alright, now we can determine if rectangles overlap, what's next?

Obviously we just start putting rectangles down on a grid. There's just one issue. Every time we put a rectangle down we have to check if *any* existing rectangle overlaps. If it does, we have to generate new rectangles to represent the different states. We can be tricky and avoid some cases, such as where a rectangle is fully enveloped by a rectangle of the same color, but it starts to explode. 

![Oh No](/assets/img/Rust_AoC_2015_Day_6_6_oh_no.png)

*A minor issue*

This is... non-ideal. Other, less determined people might have concluded their intuition was wrong, and moved on, done useful things with their life. Not us. 

Obviously we have a lot of rectangles. There's a couple different ways to help deal with that. The first is to add naïve optimizations. Remove rectangles already inside rectangles, add logic for when to skip adding. We tried this, and discovered several fun bugs. I'll let Dave tell that story if he wants, since this was mostly in Mathematica, and his brain-child. What we discovered though is that to make these optimizations we had to run various comparisons on every rectangle every time a new rectangle was created. This is the opposite of optimal. 

![Oh No](/assets/img/Rust_AoC_2015_Day_6_3_rectangles.gif)

*It looked pretty cool though*

Clearly what we need is a data structure that works well with overlapping rectangles. Surely someone has thought about this problem before? 

Indeed, they have, in all kinds of contexts. Turns out we're not the first to deal with rectangles. We discovered a couple data structures that looked promising. To whit, KD-Trees and R-Trees. 

## A forest of trees

I'm not an expert on these data structures, so I'll mostly be giving a layman's interpretation of obtuse Wikipedia articles and a paper or two we read along the way. Ultimately, we wound up implementing neither of these, so if you don't care about data structures feel free to skip this section. 

Alright, so, what is a KD-Tree, and why do we think it applies? A KD-Tree is a binary tree, that is each node has a maximum of two children. In a KD-Tree each node is a coordinate pair, or in some special cases, a set of coordinate pairs. A KD-Tree specifically organizes coordinate sets so you split space into sub-regions, theoretically letting you get specific pairs in log(n) time. The Wikipedia page explicitly calls out that `Instead of points, a k-d tree can also contain rectangles or hyperrectangles`. Obviously if we could run a search that only got us the rectangles we cared about that would make our overlapping areas problems significantly easier. 

But there is a catch. Building the tree is a `O(n * log(n))` operation. Which might still be faster than O(nm), but might not, since we have to add to the tree at every step. The tree will likely become unbalanced and require a rebuild every so often, adding complexity. This seemed unsuitable, especially as we couldn't find a single good example of someone using a kd-tree with rectangles in a way we could parse into working code. 

R-Trees on the other hand looked extremely promising, I mean, look at this image: 

![Rtrees](/assets/img/Rust_AoC_2015_Day_6_7_rtree.png)

*Glorious glorious rectangles*

The idea behind r-trees, it seems to me is you draw rectangles around your existing rectangles, and each node is an array (or linked list) of rectangles, which might contain sub-rectangles. Getting an area of all overlapping rectangles seemed pretty promising, as it could potentially mean looking at one thousand rectangles for comparisons, rather than a million. It has one tiny issue of course. R-trees do not guarantee good worst-case performance. They also are difficult to build, as the algorithms to determine where and how to bound rectangles were beyond me. 

Its extremely likely an r-tree would  have worked for our use case, but its around this time I got this message from Dave: 

`I figured out an intermediate solution, in between the kind of solution we wanted and brute force.`

## Good enough?

Remember our conversation about sparse matrices, before I went down into data-structure land and talked way too much about rectangles? It turns out we were on to something. 

I'm gonna throw a big block of code in here, and then talk about it. I also want to point out that other than helping refine some of the code, this was fundamentally Dave's work, in an effort, I'm sure, to get me to stop trying to implement R-Trees. 

```rust
use std::fs;
use std::time::{Instant};
use std::collections::HashMap;

#[derive(Debug, Eq, Hash, PartialEq)]
struct Rectangle<'a> {
	xmin: i64,
	ymin: i64,
	xmax: i64,
	ymax: i64,
	light: &'a str
}


fn main() {
	let start = Instant::now();

	let file = "../Inputs/Day6Input.txt";
	let input_raw: String = fs::read_to_string(file).unwrap();
	
	let mut rectangles: Vec<Rectangle> = Vec::new();
	
	let mut x_range = vec![];
	let mut y_range = vec![];
	
	for line in input_raw.lines() {
		let mut tokens = line.split(|c| c == ' ' || c == ',');
		let mut keyword = tokens.next().unwrap();
		if keyword == "turn" {
			keyword = tokens.next().unwrap();
		};
		let xmin: i64 = tokens.next().unwrap().parse().unwrap();
		let ymin: i64 = tokens.next().unwrap().parse().unwrap();
		tokens.next();
		let xmax: i64 = tokens.next().unwrap().parse::<i64>().unwrap() + 1; // Plus one is critical!
		let ymax: i64 = tokens.next().unwrap().parse::<i64>().unwrap() + 1;
		let light: &str = keyword;
		
		x_range.push(xmin);
		x_range.push(xmax);
		y_range.push(ymin);
		y_range.push(ymax);
		
		rectangles.push(Rectangle{xmin,ymin,xmax,ymax,light});
	}
	
	x_range.sort();
	x_range.dedup();
	y_range.sort();
	y_range.dedup();
	
	let mut x_diff = Vec::with_capacity(x_range.len());
	let mut x_hash = HashMap::new();
	
	for i in 0..(x_range.len()) {
		if i < x_range.len() - 1 {
			x_diff.push(x_range[i+1] - x_range[i]);
		} else {
			x_diff.push(1);
		}
		x_hash.insert(x_range[i],i as usize);
	};
	
	let mut y_diff = Vec::with_capacity(y_range.len());
	let mut y_hash = HashMap::new();
	
	for i in 0..(y_range.len()) {
		if i < y_range.len() - 1 {
			y_diff.push(y_range[i+1] - y_range[i]);
		} else {
			y_diff.push(1);
		}
		y_hash.insert(y_range[i],i as usize);
	};
	
	let mut first_lights = vec![vec![0i64; y_range.len()]; x_range.len()];
	let mut second_lights = vec![vec![0i64; y_range.len()]; x_range.len()];
	
	for r in rectangles {
	
		let xmin = *(x_hash.get(&r.xmin).unwrap());
		let xmax = *(x_hash.get(&r.xmax).unwrap());
		let ymin = *(y_hash.get(&r.ymin).unwrap());
		let ymax = *(y_hash.get(&r.ymax).unwrap());
	
		for row in &mut first_lights[xmin..xmax] {
			for val in &mut row[ymin..ymax] {
				*val = match r.light {
					"on" => 1,
					"off" => 0,
					"toggle" => if *val == 1 {0} else {1}, 
					_ => 0
				}
			}
		}
		
		for row in &mut second_lights[xmin..xmax] {
			for val in &mut row[ymin..ymax] {
				*val = match r.light {
					"on" => *val + 1,
					"off" => if *val <= 1 {0} else {*val - 1},
					"toggle" => *val + 2, 
					_ => 0
				}
			}
		}
	}
	
	let mut part1 = 0;
	let mut part2 = 0;
	
	for i in 0..x_range.len() {
		for j in 0..y_range.len() {
			part1 += first_lights[i][j] * x_diff[i] * y_diff[j];
			part2 += second_lights[i][j] * x_diff[i] * y_diff[j];
		}
	}
	
	let end = start.elapsed().as_micros();
	
	println!("Part 1: {}",part1);
    println!("Part 2: {}",part2);
    println!("Time: {} μs", end);
}
```
Essentially, without getting too far into the weeds, this is a solution that works by not caring at all about the larger enveloping grid. Since we only track specific lights, we can expand our search area as new instructions arrive. The instructions define the boundaries. Which is nice. 

Each instruction is a rectangle, and we put those in an array. We take those instructions and with some optimizations apply those until we get a final, non bounded grid. 

A little fancy math, and we get a space and time complexity that looks like this. 
![Some Math](/assets/img/Rust_AoC_2015_Day_6_8_space.png)

Specifically, this is not better in the worst case scenario but works very well with the specific AoC input. We experimented with a larger grid, a million by a million and it works better than the brute force, (in fact the brute force would take a long time to solve it), however it doesn't scale with the number of instructions the way we would have liked. A thousand rectangles takes 1.5 seconds. Ten thousand made my machine scream until we stopped it. It works, its a better solution, but I remain convinced its not the *best* solution. 

## Throwing the towel 

At this point, we decided we'd had enough. There is probably a more clever super-optimal solution that works for a million instructions in a billion by a billion grid, but its not something we're going to uncover today, or possibly ever. Part of solving a problem like this is knowing when to walk away and come back to it when you know more. If we were determined beyond reason to solve this, this is the point where we'd look for someone who's an expert in the field to talk to, but we're alright putting it to bed for now. 

Of course, if you, reader, come upon a way to solve this with rectangles and r-trees, we'd be thrilled to hear from you. 

This raises a question, of course. I just spent an inordinate amount of words telling you about how we failed to find the best solution. How all we did was "good enough". About how we gave up, because the solutions we were looking at were too hard. Why? Because there's value in failure too. I feel like every blog I read talks about some super cool success, and that's great, its important to celebrate wins, but a lot of development is not that. A lot of writing code is bashing your head against the wall trying various angles, and having none of them work out. Googling concepts you don't understand and realizing the descriptions are vague and doing more googling. Following your gut only to discover that it doesn't know what its talking about. I wanted to give a glimpse of that. Show the dead ends and back alleys that you run into. Because ultimately, writing code is about a lot more than *writing code*. Its about failing forward.  