---
layout: post
author: David
title:  "Advent Of Code 2019 - Day 1"
date:   2019-12-01 07:42:04
categories: Poems AdventOfCode Fiction

permalink: /david/advent-of-code-2019-day-1/
---

2019's Advent of Code has a twist to it - a poetry-writing contest to be run on [/r/adventofcode](http://old.reddit.com/r/adventofcode).  Each poem has to be accompanied by code snippets or a repository link, of course, so it makes for a fun challenge: to think in the syntax and grammar of code (Mathematica, in my case) and immediately afterwards to think in the syntax and grammar of structured poems.

## Code

Pretty easy to make it a one-liner in Mathematica; I lost a minute on Part 2 because I forgot that when calculating the fuel from ```NestWhileList```, you need to drop both the first and last elements of the list.

Import:

{% highlight mathematica %}
input = Import[FileNameJoin[{NotebookDirectory[], "Day1Input.txt"}], "List"];
{% endhighlight %}

Part 1:

{% highlight mathematica %}
Total[Floor[#/3 - 2] & /@ input]
{% endhighlight %}

Part 2:

{% highlight mathematica %}
Total[Table[Total@NestWhileList[Floor[#/3 - 2] &, i, # > 0 &][[2 ;; -2]], {i, input}]]
{% endhighlight %}

## Poem: Achilles, Zeno, Newton, Tsiolkovsky

	In ancient Greece, in olden times,
	The gods once held a race:
	Achilles, swiftest of all men,
	Against a turtle's pace.

	Achilles, turning towards the beast,
	said "I'll give you a start.
	I'll stay here at the starting line,
	'Til we're two *stades* apart."

	The turtle, slowly, turned his head.
	"My friend, you've lost the bet.
	The gods are laughing up on high.
	And you don't know it yet."

	The line was drawn, the flag was dropped,
	And off the turtle went.
	A day went by, Achilles woke,
	And raced out from his tent.

	Two stades he ran, and saw the beast
	A mere ten *cubits* yonder.
	And at that speed he crossed the gap,
	Before his mind could wander.

	He saw the turtle still ahead,
	Though now, by just two *πόσιν*.
	(The author, here, regretted Greek,
	and wished 'haiku' he'd chosen.)

	This race continued, on and on,
	the chasm ever waning.
	Achilles couldn't close the gap,
	but ran on, ever straining.

	Then from on high a voice boomed out,
	and all around was laughter.
	The great god Zeno entered in,
	Two others walking after.

	"King Achilles, you have lost.
	The turtle is more sprightly.
	For when you get to where he was,
	He's traveled further, slightly!

	If all these gaps are added on,
	The terms go on forever.
	You race against infinity:
	A Sisyphean endeavour."

	But Newton, with him, intervened.
	"These sums are not so motile.
	You can add up an endless sum,
	And get a finite total."

	Achilles, gleeful, ran again,
	and left the turtle trailing.
	In glee, he jumped and tried to fly, 
	but each attempt was failing.

	And when the Earth had pulled him back,
	he turned and asked a question.
	"My lords, if men should wish to fly,
	Have you some good suggestion?"

	And then Tsiolkovsky rose and spoke,
	the last among the Powers.
	"Lord Newton gave you finities,
	but mercy won't be ours!"

	"For logarithms are my crown,
	and gravity my scepter.
	No ship of yours, dear King, will fly
	Unless *my* laws accept her."

	And to this day, he reigns supreme.
	His cursed equation rankles.
	Whene'er we reach above, we fly
	with logs tied to our ankles.

