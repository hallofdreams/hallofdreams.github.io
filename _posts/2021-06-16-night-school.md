---
title: Night School
author: David
date: 2021-06-16 12:00:00 -0500
categories: [Fiction, Writing Prompts]
tags: [fiction, writing-prompts, david]     # TAG names should always be lowercase
---

<div style="display:none;">From /r/WritingPrompts, a story of a mathematical ghost that won't leave, a girl who doesn't like him too much, an RSA-encrypted message that can't be decoded, and number theory that death can't end.</div>

*This was originally written for /r/WritingPrompts: ["[WP] The ghost likes to quiz you with math questions. Lately, it's all been about really advanced number theory, like it's grooming you to crack RSA encryption."](https://old.reddit.com/r/WritingPrompts/comments/o13095/wp_the_ghost_likes_to_quiz_you_with_math/).*  

*With a prompt like that, how could I resist?*

# Night School

## Part 1

"Good evening, Miss Pomerance.  Did you finish your homework?"

You never can tell for certain with ghosts, but after three months I'd learned his habits pretty well.  He never appeared before sunset or stayed after sunrise, never was visible in view of a camera or when I had company, never spoke without being polite, and never left without asking at least one question.  I'd given up trying to take a picture after the first week, and at this point, I'd almost accepted the fact that a ghost showed up for a conversation every night.  I like to think I'm pretty tolerant, pretty open-minded; I take life as it comes.  Ever since I was old enough to travel by myself, I've loved backpacking, and what I've loved most about it is talking to random people in out-of-the-way spots who I'd never meet, not in a million years, in my day-to-day life.  If a ghost was polite to me, I could be polite back.  But I had to draw the line somewhere.

"I keep telling you, I'm not going to read a dozen books just because you ask nicely.  I have a life during the day and I'm not going to waste my free time on this stuff."

"Indeed you do, and like I always say, life is wasted on the living.  These books would do you far more good than you think, especially Hardy's or Sedgewick's.  But skip chapter XVIII of Hardy's; we have better upper and lower bounds for all of those functions now, and approximations are only useful for mathematicians too puffed up to do REAL exact work.  Now, Sedgewick is a little weak on the theory since he focuses on the practical algorithms, so what I liked to do was have Mollin's next to me to reference while I read it..."

I knew, from hard experience, that he'd go on like this for a very long time if I didn't interrupt.

"Listen, stop, just stop.  I'm not reading Hardy, or Sedgewick, or Mollin, or Cameron, or any of these other books you keep pushing.  If you just want somebody to talk to, I'll be here, but if you want to talk math, go haunt a mathematician somewhere.  I'm sure there are college professors who'd love to speak to you."

"I talked to many mathematicians when I was alive, and college professors too.  Too many for my liking, to tell you the honest truth.  I wanted new company."

"But why me, specifically?  It's not like there's anything particular about me you're interested in.  You've never once asked me how my day is going."  

"How was your day today, Miss Pomerance?"

I sighed.  I should have seen that coming.

"You know what?  It was great.  The weather is gorgeous outside, work wasn't too hard, and I had a nice dinner date over next to the arboretum.  It was a nice day, right up until sunset.  Thank you for asking."

"Excellent!"

He seemed...genuinely happy to hear that?  His features were always indistinct, but this time his face seemed less rigid and solemn than usual?  Normally, talking to him is like talking to a picture with a mouth that moves, but I could see his face actually change a little.

"So it would seem by all accounts," he said after a long pause, "that an hour or so of number theory would be a fine way to get ready for bed."

Well, I should have known that wouldn't last.

"Ugh.  It's been three months and the only person you haunt is me, and all you ever talk about is math and algorithms, and you won't tell me why, and you won't even tell me your name!"

"OoOoooOOOooiamaghostwhosememorieswashawayonthesandsoftimeOooooOoOOOOoooo..."

"Oh, so you can remember my name, and the name of every math textbook author who ever lived, but not your own name?"

"OoooOooOooononeescapetheriverlethewhosewatersbringoblivionOooooooOOO..."

"You're annoying, you know that?  There *have* to be better uses of your time.  Why not just go to Heaven and stop hanging around this mortal coil?"

"You could go there too.  Go get martyred somewhere and you're a shoe-in at the Pearly Gates, or so a reliable source tells me.  Are you particularly eager to go?"

I didn't give him the satisfaction of an answer.

Plus, I didn't really know what to say.  The ghost stories I read when I was a little girl all said that ghosts get stuck, doing the same things over and over again that they did in life, until some condition gets met and they can move on.  But this ghost seemed a lot more coherent and self-aware than the ones I'd read about, and if I kept having this conversation with him then *I'd* be the one stuck doing the same things over and over again.  What else could I say that I hadn't said before a dozen times?

"Fine.  I'll humour you.  Pick one of these books and one chapter, and I'll read it before tomorrow night.  How about that?"

The ghost reached out a hand and pointed midway through the stack.

"This one", he said. 

I pulled it out and looked at the title.  *Algebraic Number Theory* by Frazer Jarvis.  "Jarvis?" I asked.  "What, did a butler write this book?"

"A butler?  You're thinking of Jeeves, not Jarvis."

"No, Jarvis is...never mind."

"Chapter eleven.  Just the first two sections, with the quadratic sieve.  Don't worry about the rest of the chapter yet, but do try the exercises.  We'll talk tomorrow night."

I nodded, and he vanished.  *Well*, I thought to myself, *how bad could it be?*  I picked up the book, flipped to the chapter, and started reading.

> A very well-known protocol is the RSA system for encryption and decryption of messages.  At the heart of this system lies the observation that while multiplication of two numbers is easy, recovering the factors of a product is difficult.  Sometimes the analogy is made with mixing pots of paint of different colors - mixing a pot of red paint and a pot of white paint to get a suitable shade of pink is easy, but given a mixed pot of pink paint, separating out the white and red paints is very difficult!

"Getting rid of some red paint can't possibly be more difficult than getting rid of a math-obsessed ghost," I muttered, and kept reading.

## Part 2

> Sieve the twos and sieve the threes -  
> The Sieve of Eratosthenes!  
> When the multiples sublime  
> The numbers which remain are prime!  
>
> Add `log p` as you advance -  
> Such is the Sieve of Pomerance!  
> The largest sums which you have found  
> Give numbers which are smooth and round!  
>
> Mark out a gigantic square.  
> Add `log`s at random everywhere.  
> This brief account you must forgive  
> Of Pollard's Number Field Sieve!  
>
> -- John M. Pollard, "A Tale of Two Sieves"

"So, Miss Pomerance, if I gave you an eleven-digit semiprime, how would you factor it?"

"Just eleven digits?  I'd do trial division."

"And how long would that take to run?"

"Only a few seconds, if that.  If all you want to factor is one number less than a trillion, then even an inefficient algorithm will get it almost instantly."

It was two weeks later, and though I was yet to admit it, I was starting to find the math interesting.  And I was almost...irritated? that I followed some of it.  I thought when I picked up Jarvis' book that I'd look at it, not understand a word of it, and maybe convince the ghost to go haunt a library or a math fraternity or something when he saw I wasn't getting it.  But bits of it stuck with me.

"But trial division involves every prime, and there are thirty-seven billion primes less than a trillion.  Computers might be a bit faster than they were in my day, but don't tell me they can do *that* in a second."

"You only need to go up to the square root of a number in trial division.  If it's a semiprime, then you have two prime numbers `a*b` that equal `N`, and if `b` is bigger than the square root, `a` has to be smaller.  And there are only...uhhh...sixty-eight thousand primes less than a million."

"*Seventy*-eight thousand," he corrected.  "The prime-pi of a million is seventy-eight thousand, four hundred and ninety-eight."

"How in the world do you remember all these off the top of your...well, head?"

"You'd be surprised at how frequently it came up, Miss Pomerance."

"Still 'Miss Pomerance'?  I have a first name, you know."

"You do indeed, but I was old even before I was dead, and I still remember how to be polite."

I turned to the copyright page of *Algebraic Number Theory*.  "This was published in 2014, so if you've read it you can't be all *that* old.  And Lewis Carroll wrote a whole book with my first name in the title, and that was like a hundred fifty years ago.  It can't be too much to ask."

"And if I were in mid-nineteenth century Oxford as Lewis Carroll was when he was alive, surrounded by a proper aesthetic sense, perhaps I too would feel less need for formal social graces."

"I think I can see why those math professors you've mentioned didn't want you hanging around, before your death or after it."

"Those philistines wear cargo shorts to conferences.  Disgraceful.  At any rate, you're quite correct, a computer would handle trial division up to a million with ease.  How about a twenty-digit number?"

"You could just about do it with trial division, but a decently powered computer would take a while, especially if the primes were close to each other."

"And if the primes were close, what could you do then?"

"You could check for factors both near the square root. `x^2 - y^2 = (x+y)(x-y)`  Start listing each `x^2` greater than your number `N`, and when the difference is a square then you have two factors."

I took a deep breath when I finished that sentence.  I dreaded my next question, but I had to ask him.

"Your haunting me, pestering me about factorization, your entire shtick of speaking all formal - was all this only to set up a pun about 'difference of squares'?"

"Months of work only to set up a pun?  I'm not nearly that smooth, but I'll confess it had crossed my mind.  And what happens if my number `N` has primes neither especially close together nor especially far away?"

"Parallel processing, I guess.  Have one process do trial division, another process do squares, and see which one finishes first."

"Come now, you've read Jarvis, at least the first couple sections.  Isn't there a better way?"

"Ughh...I read it, I get the theory I think, but I just can't figure out how to make it work."

"Then forget all the stuff about the index calculus, that's all bookkeeping.  Tell me what the quadratic sieve *means*."

"Basically, it's the same idea as the difference of squares.  If `x^2-y^2` equals `N`, then that makes life easy, but we don't really need that.  All we need is `x^2-y^2` to be divisible by `N`.  If it is, then `(x+y)(x-y)` is divisible by `N`, and so part of `N` goes into `(x+y)` and part of `N` goes into `(x-y)`.  So we want `x^2≡y^2 mod N`."

"Good!  Good.  Finding two squares that are congruent is the key, not just for the quadratic sieve, but for the number field, and for Shor's algorithm to boot if you had a quantum computer.  Fermat's method looks for the squares, the quadratic sieve looks for smooth numbers and makes its own squares, and the number field sieve looks for number fields and makes squares from those. The rest is just a bunch of fiddling."

"Most of math is a bunch of fiddling.  Fiddling is hard!"

"Of course it is, but you know what I always say about the drunken sailor."

Not this analogy again.  "Yes, yes.  If the drunken sailor stumbles about for `N` steps at random, he'll walk in circles and only go a distance `√N` from where he started.  But if there's a pretty girl over in the distance, he'll stumble this way, and that way, but he'll go in a definite direction and cover a distance proportional to `N`.  You've only told me about a hundred times."

"And I'll tell you a hundred more if need be.  Having a goal clearly in mind makes the end state far, far easier to reach, even if it feels like you're stumbling around in the dark.  That's critically important in mathematics."

"You say that, and yet you won't even tell me what the goal is!"

"I want you to understand RSA encryption.  I have been perfectly clear about that for a long time."

"But WHY?" I shouted at him.

"Good night, Miss Pomerance," he said calmly, and vanished.

## Part 3

It was eight months since the ghost started to appear, and five since I'd started learning about all the various ways to factor numbers.  I'd read Jarvis' chapter on the number field sieve, and for that matter Pollard's entire book on it, and the Wikipedia article, and plenty more.  I did three dozen Project Euler problems based on factorization and sieving, and read the threads, and learned not just how to implement a program to factor numbers but how to optimize programs to trade memory for time and vice versa.  In one rare instance, I even got to tell the ghost something *he* didn't know, when I stumbled upon Lucy_Hedgehog's `O(n^(2/3))` algorithm for summing prime numbers; he was impressed, though when he found out it was based on a method for counting primes he immediately went on a tirade about the uselessness of approximations and upper bounds for any 'real and practical work'.  I'd learned an awful lot.

And I had a working number field sieve factorization program.

It's difficult to say how much work went into that sentence.  The quadratic sieve isn't actually that hard to implement, if you don't care too much about efficiency; all you have to is step through the numbers greater than `√N`, pick the ones without a prime factor bigger than some smoothness bound `B`, and collect them.  If `B` is 47 (the fifteenth prime), then you need fifteen of those numbers.  Once you have enough, you can make yourself a pair of squares `x` and `y`, calculate `(x+y)(x-y)`, and factoring `N` is smooth sailing.  You could write that without knowing any real number theory at all.

But the number field sieve is a different beast entirely.  Even when you stop being scared of words like `ring homomorphism`, even once you're used to factoring numbers which aren't even integers anymore, even once you're used to writing phrases like 'If 𝖕  is a nonzero prime ideal in ℤ_K appearing in the factorisation of 〈a + b√d〉 for some coprime pair (a, b)` rather than writing good old-fashioned numbers, it still comes down to a lot of unavoidable work.  Even the simplest version requires some good knowledge of algebraic number theory, and that version will fail for almost every number and only work in a few lucky cases.  To get one fully general - which can truly cover any number - you have to not just know how to deal with large factorbases and large binary matrices, but you have to understand how rings (an odd name; think 'crime ring' instead of Sauron) can be factored and mapped to rational numbers, and how those rational numbers can be in turn mapped into `x` and `y`.  And from there, it's the same thing - but so much work goes into the two words 'from there'!

And the kicker is - it's not *that* fast.  Oh, it's asymptotically faster than the quadratic, or any other classical algorithm for factoring semiprimes, but you only start to see an improvement when you have numbers with a hundred digits, or more.  Unless you have numbers that big or bigger, it's not at all worth it.  And it still has limits - you still can't factor a number that's too big.  And standard RSA?  Way, way, WAY too big.  So I still couldn't see the point.

Even now, he had never once told me why he'd done all this.  But now that I had this program working, written by hand and from scratch, I counted down the minutes until sunset.  Now he'd *have* to tell me.

"Good evening, Miss Pomerance," he said, arriving right on schedule.

"Good evening, Mister Ghost," I replied formally.  I was all dressed up for the occasion, since I figured honey would go further than vinegar.  I'd come to like the old ghost, and if being all formal for one night would entice him to explain what was going on, I figured that was well worth it.  And besides - tonight may as well have been my graduation.

"I must say, I'm extremely proud of you.  Plenty of people could implement the number field sieve with enough perseverance, but not many people have that perseverance.  You worked hard, and you learned a lot.  Don't discount that."

I decided to start with the small questions first.  "You know, Mister Ghost, you never did tell me why you only used my last name."

"Perhaps I simply like your last name.  You've noticed, I think, the name of the creator of the quadratic sieve?"

"Yes - Carl Pomerance.  I looked him up, and it turns out he's a third cousin of my dad's.  I never knew."

"Mathematics must run in your family, then.  It would be a waste for you not to know at least a little bit, if you have the knack for it."

I laughed.  "The knack?  It took five months!  And none of it was easy, and I had a ghost pestering me the entire time!"

"Yes, but so did lots of people.  Perhaps not ghosts - though you never know - but lots of people needed guidance to do what they did.  It didn't mean they didn't deserve what they accomplished."

"Okay, Mister Ghost.  I'm just going to ask.  All this - all of this, the past eight months?  Was it all for a sense of accomplishment?  Did you see some poor girl not doing much with her life and decide to take her under her wing, only to reveal that the magic was inside her all along?  Because, if that's the point, if that's why you did this, then there have to be better ways.  I've enjoyed this, I'll admit it, but I would have enjoyed plenty of other things too.  Was that why?"

The ghost seemed genuinely taken aback.  "My dear Miss Pomerance, I thought by now it would be very clear why I wanted you to learn and do all of this.  You're bright, you're very bright, but sometimes you miss what is blindingly obvious."

"Then tell me, please.  I've gone through all this.  If there's a greater purpose, I deserve to know."

The ghost smiled.  "It has been a pleasure getting to know you.  These past eight months have been some of the best of my...well, 'life' wouldn't be the right term, now would it?  But whatever this is, these months were the best of it.  And I think you know already, you just don't want to put the pieces together.  All those boxes of books you had in your closet, that I got you to bring out - why were so many of those books about math?"

"I inherited a bunch of books when-" I started, and choked.  Oh.  Of course!  How had I never realized?

"Goodbye, Alice."  The ghost vanished for the last time.

## Epilogue

I made the three hour drive to my parents' house that evening.  Most of Grandpa's things had gone to them, though he'd left half the books to me and all of his weights and grippers to my older brother.  I'd checked all of the boxes I had in my place, and none of them had what I knew he must have been talking about.

"Alice!" said my mom.  "Well, this is unexpected.  What brings you home?"

"Grandpa's stuff.  It's still in the basement, right?"

"Well, yes, but-" she said, as I quickly stepped inside past her and took off my coat.  "But why would you need it in such a rush?"

"You wouldn't believe me if I told you!" I called back, heading to the basement.  "Just give me a minute and I'll show you!"

When I came upstairs triumphantly a few minutes later, my dad had heard the commotion and come down to see what was happening.  "Is that Grandpa's old stuff?"

"It sure is," I said, putting the box down and pulling out the first notebook from it.  "Remember these?  He was always writing, and he always had those calculators with him too.  Right up until the end."

"Of course I remember," said Dad.  "Growing up, your uncles and I would always try to get a peek at those notebooks.  Never understood them, though.  Too much math."

"No.  Just the right amount of math."

"Huh?"

"Give me a minute."

I flipped through the first book and then the second, looking for something until suddenly-

"Aha!  Look at this!"

Dad peered at it, and Mom put on her glasses and walked round to see what the fuss was about.  "A really long number?"

"A huge number.  Way more than a hundred digits.  And I'll bet you it's semiprime."

"Semi-what?"

I struggled, trying to dumb it down for them.  "Uhhh, basically, you can use these to encrypt numbers, and you can turn messages in text into a number.  And you can decrypt the messages the same way.  All you need to know are the factors of the number."

"What, and you just happen to know the factors?"

"I can figure them out."

It took me twenty minutes to scan and OCR the pages, but at last I had the numbers, and I had the padding scheme he'd written in the margins to decrypt the message.  I pulled out my laptop, booted up my number field sieve, and was about to hit 'enter' when I paused.

Would Grandpa have made it that difficult?  

On a hunch, I took the number, and took the square root.  I subtracted one and rounded down, and added one and rounded up.  Then I multiplied them together.

It was the same number, down to the last digit. A pair of twin primes. No need for the number field sieve, or the quadratic sieve, or any number theory at all. I laughed out loud. Good old Grandpa.

> Alice,
> 
> By the time you read this, this message will be very old indeed.  I write this to you on a summer afternoon in nineteen ninety-nine, and my lovely grandchildren are sound asleep in the next room.  They've been running around all day at the park, and deserve a nice nap.  You might know them.  You might have met them, once or twice.  
>
> I told them both, walking home, that I was proud of them, and my granddaughter asked me, 'Why?  I didn't do anything.'.  I forget exactly what I said, but it wasn't enough.  It's hard to explain the pride a parent feels, or a grandparent, to someone so young.  I don't think she was old enough to believe me.  That's why I wrote this.  
>
> My granddaughter is six years old, yet this was the first time I ever spent a full day with her.  I don't know how many more I'll spend with her, but even if I'd only seen her for a second, I would have been proud.  Seeing her, and her brother too, out there, running around, full of life, looking at the world with eyes so new, there's no feeling in the world like it.  It's more than a craftsman looking at a fine piece of work, it's more than a teacher seeing a student graduate.  And it's as real and deep as anything else I've ever felt.  But I couldn't explain it to her.  
>
> It is far more likely than not that you will never see this message, but if you do, know this: I am proud of you.  I've been proud of you since you were six years old.  And if you've managed to read this message, then you can't doubt that this time, when I say that I'm proud of you, I truly mean it. 
>
> Your grandfather,  
> Bob
