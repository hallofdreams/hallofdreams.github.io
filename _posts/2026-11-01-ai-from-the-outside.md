---
title: "Rambles I: The AI Onion"
author: Felipe
date: 2026-11-01 04:00:00 -0500
categories: [Essays, AI]
tags: [essay, ai, felipe, rambles]     # TAG names should always be lowercase
---

<p style="display:none;">A ramble on the general perception of AI, how labs are behaving overall, and society. Written by someone who probably spends too many tokens and too much time on twitter. Death. Homelessness. Slop. </p>

I have a bunch of thoughts on the state of AI and software engineering that no one asked to hear. Fortunately, I am very much in the habit of putting thoughts to the public forum that no one is especially interested in reading about, so this does not pose an impediment.

I often see this lukewarm take from people who are not quite as immersed in AI as I am, that models are "dumb", and when I probe it's inevitably someone using Haiku on low reasoning for a thing it's not well suited for. Or they tried it three years ago. Or they saw a TikTok about AI interviews. I'm of the belief that if you're not using a frontier model in a harness, you really have no conception of what AI can do.

Don't get me wrong, models are dumb. I've seen Fable on high reasoning try to run commands that would have deleted critical infrastructure (thanks Terraform). But models are also superhumanly capable at some things. Anyone who has seen a model figure out an obscure hardware issue using just random bash commands can tell you that. All it takes is the ability to properly point the model at a problem, and to give it the tools to do its work.

Which is what harnesses get you. They let you empower a model with the tools it needs to do things that before would have taken weeks or months in hours. If you're a software engineer, right about now you're saying "duh, everyone knows this". But they don't. Talk to your average friend, the guy not in tech. I talk to my lawyer friend, who I will call Tim (because that's his name). His organization uses Copilot, running models at least two generations behind. His models can barely help him format a file. To Tim, AI is not that helpful, it's not a force multiplier, it's a curiosity, something slightly cheaper than an intern to do what an intern would do.

Tim is a brilliant dude. If he had an appropriate harness and a model with the right tools, I am entirely certain he could have a model spitting out custom scripts that would let him do the work of at least two Tims. Tim doesn't know what `grep` is, he doesn't usually have to build pivot tables, and making a presentation is a multi-hour affair. With Claude for Lawyers, it would still be a multi-hour affair, but he wouldn't be spending most of it trying to get the graph to align just right. I've seen Tim battle with making executive reports in some of the most complicated Excel sheets I've ever seen. An annoying process of manually filling in data, adding formulas, modifying those further, and then adding a layer of formatting. I know Fable could get this automated and done on a $200 a month subscription and Tim would only need to ask it to update things. Provided there was a harness that kept him from approving Fable sending an email to the board to celebrate. That would be dozens of hours of a highly paid expert saved, by the mere virtue of giving him the right tools.

The other side is people who have been barraged, hammered, and sieged by AI slop in every communication, who have seen every email go from "plz do the sheet" to five hundred words of the same thing, plus or minus some hallucinations. While being told they'll soon be made homeless by these same tools which will replace them entirely any day now. Oh, and the people making models keep telling everyone that their AI might kill everyone within the decade, or even this year! So death, homelessness and slop. A great trifecta, matched with the experience of asking a model to add an image to a slide and having it fail.

So it's no wonder that people are… reluctant to embrace AI. I think labs and hundreds of startups are aware of the harness issue, and feel like if they solve it, they will solve the perception issue, and people will embrace AI. Even with things like the release of the Dot, it's clear that "just build a better harness" is not quite a solution, because there's an unresolved tension with current models. On one hand, you want to give the models tool usage; on the other, Tim's boss is going to be a lot less understanding than my boss if I told him "haha my model happened to nuke this important folder", and he's less likely to have a plan to deal with that disaster. Tim doesn't know what `rm -rf` is, he's just going to blindly approve that. So you need safeguards, which inevitably cripple the model.

You can't have both perfect safety and a high level of ability with the present ability of models. Labs have erred on the side of safety. Startups push the ability side. It's a matter of time, though, until models are advanced and cheap enough that a judge model is robust enough to provide the kind of safety non-technical users need. At which point I wouldn't want to be in the spot of being a company selling "AI for Dog Groomers" or whatever, because unless you have great market penetration, the Dot equivalent will devour you whole.

Let's imagine a future where you've managed to perfect the Dot, or Claude Code for Lawyers or whatever. People are still dealing with death, homelessness and slop. Those are not just marketing issues. It's the classic engineer fallacy, generalizing our experience to everyone's experience. We've seen firsthand that, no, AI is not taking our jobs, it's just changing how we work. That it is incredible and just how much capability AI enables. Obviously if other people see it, they'll forget about the whole "AI has ruined art" and "I will have to live under a bridge in the post-scarcity hellscape people keep promising". This is a little like the French nobles in 1789 wondering when the peasants will realize it's just a bad year and bread prices will normalize soon.

You cannot solve a perception problem with a better product. You can't solve a perception problem when the perception is, on some level, correct. Companies are laying off people and saying "AI" while waving their hands mystically. You also can't solve a perception problem when you have an entire social class whose identity demands they make proclamations that alarm the rest of society. A mixed group of generally well-off to rich technocrats whose decisions are in fact impacting the global economy to a deforming degree. Because yes, labs and their multi-billion-dollar IPOs have created a distinct social class, which is small, vocal, and the hyperfocus of AI discourse. A discourse that everyone is watching. One that has its own internal language that outsiders struggle to interpret.

Imagine, if you will, that I tell my neighbor I am building a bomb in my garage. I post flyers in my neighborhood talking about how we need to be prepared for how we're going to commute to work after the bomb goes off. I write in my blog some rather detailed plans of how I might set off a hypothetical bomb. I sit outside my house and yell about the big blowing up that is coming "any day now". The neighbors and the police are unlikely to be sympathetic to my statement that the bomb is going to make me more motivated at work, and that I don't intend to use it. That it's purely so the guy across the street, who I promise you is much worse, doesn't finish his first. It's insane. Yet it's what AI discourse looks like to people who don't know or care what RLHF stands for.

In our bomb analogy, it doesn't matter if both of the neighbors are actually building a fantastic farming machine and not a bomb and are just misunderstood. It doesn't matter if they sincerely believe they're doing the right thing. You will be judged by your messaging, and you are the expert on what you're doing. If you claim you're building bombs, people will believe you. Especially since, in this case, you have become responsible for a humongous economic change.

What if your neighbors really are building bombs? And you are the responsible party? Then maybe instead of posting flyers and yelling about the explosions, you should put your vast resources and wealth towards containing the explosions? Rather than, say… [firing a bunch of safety researchers](https://fortune.com/2024/05/21/openai-superalignment-20-compute-commitment-never-fulfilled-sutskever-leike-altman-brockman-murati/) or having [only a small sliver of your entire budget dedicated to safety](https://adityamenon.xyz/projects/ai-safety/ai-safety-rounding-error/)? That would, if nothing else, reassure people that maybe the "death" thing is something you're seriously trying to avoid, not something you're shrugging about as you race towards the end times.

Is the messaging a problem? It is if you're a lab and want more mainstream AI adoption. People forced to adopt AI by the bosses who want to fire them so they can justify 25% layoffs are not going to be superfans of your product. They're also, history suggests, going to burn down your data centers so they can try to return to a world you destroyed. It's also a problem for anyone who sees a better, brighter future where we all live in a post-scarcity utopia, because, spoilers, mass unemployment is not the hallmark of "better, brighter future". Which is our "homelessness" problem.

People are going to lose their jobs over AI. Translation and captioning are two industries that have already been run over. Many companies have done layoffs claiming the productivity gains of AI made people redundant. The fear of being displaced, replaced and ultimately ruined is not some fictitious bugbear. It's a reality. Software engineers as a whole have been fortunate enough to not have their industry vanish overnight. That the universal response has been either ideas about UBI that will never be implemented or a shrug and an "industries die, crosstrain!" is the type of thing that made taxi drivers in Paris set Ubers on fire.

Then there's the slop. So much slop. People using AI for a million things it's not suited to. Presentations that the presenter didn't read before stepping up on stage that contain lines like "please run this example before the presentation and take a screenshot" and that have the same soul and personality as a mannequin. Hundreds of emails, very nicely written, that do the "it's not this, it's that". The flood of Facebook posts that say "I'm 110 and I baked this cake" and the cake is a shoggoth's nightmare of what a cake might look like if you just look at the details. I could go on, but the point is, when things like writing and art are made easy to access in volume like this, the result is a flooding of every channel, and it's noticeable. You don't need to be particularly savvy to recognize that more than half of the writing you see posted all looks eerily similar, mentions "hinges" and is way too long. It's exhausting. You might like beef, but you don't want to have to live in a society where we spread the cow manure over every road. People have been told that with AI everyone will be free of the burden of work, and what they've seen is their social media flooded with garbage and every part of the internet irrevocably polluted. It's hard to blame people for thinking they've been swindled.

I don't have a magical solution. If I had a playbook for "get everyone to at least begrudgingly accept AI while making the world better with it", I'd have OpenAI pay me a few million a year to do just that. Social change is here, and upheaval will follow. It's not just the labs and AI; socioeconomic currents have been pulling hard at the world, and a shift is inevitable, but AI has accelerated certain trends. AI will likely take the blame for a lot of things that are not strictly the fault of AI, but rather the result of specific wealth distribution and empowerment patterns.

Is AI going to cause people to lose jobs? 

Almost certainly. 


Are we all doomed? 

Unlikely. 


Are we tired of slop? 

Absolutely. 


Can we somehow convince Tim that AI is not just like cryptocurrency, that it's actually useful? 

Probably. 


Will that stop a bunch of people who lost their jobs from being justifiably angry or somehow stem the inevitable consequences?  

No.


<sidebox title="Felipe's Rambles">
I sat down and started writing my opinions on the state of software engineering, and it rapidly became a rambly post that went off for several thousand words on eight unrelated topics. I thought it would be more enjoyable to have them split up for ease of browsing, so expect a few differently themed rambles from me over the coming indeterminate unit of time.
</sidebox>