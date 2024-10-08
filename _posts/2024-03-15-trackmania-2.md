---
title: Trackmania II - Trackmania Nightmares
author: David & Felipe
date: 2024-03-15 12:00:00 -0500
categories: [Programming, Trackmania]
tags: [trackmania, rust, programming, david, felipe]     # TAG names should always be lowercase
series: Trackmania
---
<div style="display:none;">Trackmania: the world's most competitive racing game.  A series of nightmares before the dream could begin: packet losses, Linux to Windows to Linux, VNC and screen-sharing, OpenPlanet and plugins...</div>

## Trackmania Nightmares

We began this project near the end of September of 2023, and started seriously training near the end of February.  Perhaps two weeks of that time were spent writing machine learning code, and the remaining *months* were spent playing whack-a-mole with one stupid technical issue after the next, trying again and again to just install the game, or a dependency, or a library, or an operating system, or sshing.  If you're only interested in the overview or the theory, skip to the [reflection section](#reflection) or feel free to skip to the next post: you won't be missing much.  But if you found this page because you're trying to fix a technical issue with Trackmania on Linux yourself, read on, because we might have encountered the same problem ourselves.

If you just want our final working setup, skip ahead to [Final Setup](#final-setup).

### A Dream is Born

Step one of every project is to get your hardware lined up.  If you’re a fancy-schmancy researcher with a lab or a startup with a budget, that probably means writing configuration at scale, worrying about networking, figuring out how to get your Kubernetes pods to ingest via Istio and whatever other forms of black magic are required.  For us, it meant booting up old reliable Sotano, a computer so named because it had lived in Felipe’s parents’ basement for half a decade.  It was the computer that had carried us through HATETRIS, which we had lovingly upgraded with a brand new GPU when we thought we’d need such things, and which had been a pretty reliable workhorse.

Step zero was, of course, to get a few hundred gigabytes of old HATETRIS runs off the machine and onto an external hard drive; a task that took all of 20 minutes of effort.  Then, realizing the python installation was broken and we were on an ancient version of Linux, we decided maybe it was time for a reformat and OS upgrade.  Hardly a challenge.  Flash a USB drive, restart the computer, enter boot mode, install the OS. Forty minutes later, the Ubuntu 22.02 Server Edition was installed.  Reboot, get ready to set some settings… 

Then sit on the boot up screen?  Forever?  Not a problem.  Restart again, launch into BIOS and maybe see if something is up.  We want to set the boot selector back to the hard drive anyway… but the BIOS screen never came up. No combination of DEL, F12, F2, F3, and all the other function hotkeys would get us there, no matter how frantically we mashed. 

<img src="/assets/img/Trackmania/bootscreen.jpg" width="400" alt="A blank screen with a cursor in the middle." title="A blank screen with a cursor in the middle."/>

Which, of course, meant that something, somewhere, had failed.  Maybe the keyboard or screen were not functioning properly?  That could explain the boot into a blank screen, right?  Or perhaps the keyboard wasn’t being registered: then no amount of hotkey presses would get us there.  Fortunately, every reasonable human being owns dozens of keyboards and at least four different screens (not counting televisions) and VGA and HDMI cables, so running through permutations of connections and USB ports was just a matter of patience.  We quickly discovered that the new tiny monitor was broken, which was a relief: the computer obviously worked!

Except, it didn’t.  The boot screen remained an implacable enemy as Felipe worked through the various ways he could plug in monitors and keyboards. To the untrained observer (e.g. Felipe’s wife, watching him march up and down the stairs with a rapidly growing pile of keyboards, monitors and cables), it probably looked like he’d finally snapped and decided to build a shrine to the Machine-God.  Despite his frantic efforts and protestations, the conclusion we’d both dreaded since the first few attempts became harder and harder to deny.  Somewhere the hardware had failed, and we were never moving past this screen: 

<img src="/assets/img/Trackmania/blackscreen.jpg" width="400" alt="A bios boot screen." title="A bios boot screen."/>

Now, it could be a hard drive failure, or it could be the motherboard had died, or it could be any other number of permutations of issues. Three days of exhaustive debugging, of removing and replacing motherboard batteries, unplugging cables, tightening them, and wondering “what does SATA even stand for?" (Serial Advanced Technology Attachment, disappointingly), we decided it would be wise to budget out what a replacement build would look like. Shockingly, once you have a GPU, the rest of the machine is almost budget friendly. 

So that’s what we decided.  Consulting with an outside expert (the friend in the group who actually builds computers) we got together a list of what would work for our goals.  We’d been wanting to upgrade our RAM anyway, and the old motherboard couldn’t accommodate us last time, so this was a good opportunity to remove that limitation.  More cores in the CPU would be helpful too, so we splurged a little for that.  With Amazon shipping, the parts were at the doorstep within forty-eight hours. 

<img src="/assets/img/Trackmania/Parts_List.png" width="600" alt="An Amazon list of computer parts." title="An Amazon list of computer parts."/>

Amazingly, not having built a computer in a decade, the process has become significantly less painful, and after only a couple of hours of muttering and only needing to YouTube two things, we had a computer that could get past a boot screen.  We christened it **Somnium**: the Latin word for 'Dream'. 

<img src="/assets/img/Trackmania/Boot_Device.jpg" width="400" alt="A screen showing 'Please insert a bootable device'." title="A screen showing 'Please insert a bootable device'."/>

Of course, that meant we had to go install an OS now… 

### Ubuntu Server: Servering The Will to Live 

Getting Ubuntu Server installed was just a matter of doing a dance that would soon become familiar.  Plug in installation device, go into BIOS, select USB drive as the boot device, boot into USB, run through the installation steps, including the annoying portion where you just sit around and wait, restart the machine, log in, set up SSH keys from the external hard drive, and boom, you’re ready to rumble.  Unless that is, you actually want to install Trackmania and all the dependencies you might need to machine learn. 

Rust was not an issue, the installation there is a known process. Steam and Wine were a bit more daunting, but nothing insurmountable. Then you’re faced with the fact that you have to install something on Steam with no GUI.  Oh, right.  Ubuntu Server assumes you’re running this in some anonymous server via the terminal and you’ll be running things that don’t require extraneous things like… “a monitor”.  A slight oversight, but fortunately, there is plenty of software to allow you to attach a monitor and use a GUI.  After all, human beings use those all the time.  Google gave a bunch of results that seemed aimed at the kind of person who knows why they’re using Ubuntu Sever instead of Ubuntu Desktop, and that kind of person wasn’t us, so we reached out to our good friend ChatGPT and asked it what we should do.  The response was a step by step guide that began: 

> Running a graphical application like Trackmania on a Linux server in a headless session can be a bit tricky, but it's possible to achieve with a combination of Xvfb (X Virtual Framebuffer) and a VNC server.  Here's a step-by-step guide to accomplish this:

Great! A step by step guide! Surely this would get us rolling. I mean, sure, it had some issues right off the bat, like the fact that we needed the VNC server to connect via SSH and not a password, and also we’d have to do some port modifications, and well, we don’t actually know anything about Xvfb, but how bad could it be? 

### I Scream, You Scream, We All Scream For Shared Screens!

VNC is a remote desktop system that lets you view and remote-control a computer, showing you whatever that computer’s graphics display is displaying - in basic terms, it shows you whatever that computer is currently sending its monitor.  On Ubuntu Desktop, this is fine, but on Ubuntu Server, in which there is no monitor and no desktop renderer, that becomes a problem.  The graphics display for Ubuntu is called the X Window System (or simply X11, or X), so the solution is the [X Virtual FrameBuffer (`Xvfb` for short)](https://linux.die.net/man/1/xvfb), which implements X in virtual memory without requiring a screen, or graphics output, or a desktop.  And then you can use a specific VNC server, [`x11vnc`](https://github.com/LibVNC/x11vnc), to connect remotely to that virtual framebuffer, and see remotely what the server *would* be showing, if it had a monitor or graphics display in the first place.

`x11vnc` is, of course,not to be confused with [Xvnc](https://tigervnc.org/doc/Xvnc.html), which is a sort of all-in-one X server and VNC server.  And this is where we got extremely confused.  Trying to figure out port forwarding so that an SSH tunnel could reach a VNC server running on a local port, which itself pointed to an `Xvfb` server (or was it `Xvnc`?  We couldn’t remember) was hard enough, but once we got there, we had nothing but a blank screen to work with.  If we wanted to launch a program with a GUI, we had to make sure that program was pointed towards the correct virtual X window, or else we’d never see it.  And if that program launched a *different* program, making sure that different program also stayed in the same X window was even more of a headache.

Because, naturally, that’s what happened.  Our first mode of installation was to install Trackmania, through Ubisoft Connect, through Steam, through Lutris.  And it’s not that any of these steps were unsolvable - much to our envy, PedroAI got not just *one* version of the game running for machine learning purposes but *three*, in parallel, with `x11vnc` - but every step made the debugging process longer and longer.  It’s doable, if you know how.  But we didn’t.

### Lutris: This, That, and the Otter

Trackmania is a game designed for Windows.  We wanted to run the game in Linux.  Linux is not Windows.  This was a problem.

Fortunately for us, we’re not the only ones to ever have that problem.  Over the years, people have made **emulators** which make a Windows program think that it’s running in Windows, when it’s not. (Except, notably for WINE, which is explicitly Not An Emulator, even though everyone uses it as such) These emulators essentially act as containers, with miniature stripped-down versions of Windows inside them, and the Windows program can sit in that container and never know that there’s a world full of unforgiving Linux incompatibilities just outside its glass walls.

But, these emulators aren’t perfect.  Different programs can require different Windows-specific libraries, or settings, or register values, and so an emulator that works perfectly for one program doesn’t always work for all programs.  This is where Linux programs such as [Lutris](https://lutris.net/faq) come in.  Some brave soul plays and tweaks with emulator settings and libraries and installation options until coming up with a combination that actually works and lets the game install correctly.  When he finally has one, he writes down all the different parameters and tweak settings into a single script, and uploads that script to Lutris’ database, so that others who want to run that program can come in and just run the script to do all the custom fiddling and tweaking required.

(There was roughly two days’ worth of figuring out how to fix broken installations, figuring out the difference between installing Lutris from a `.deb` file vs. from Ubuntu’s software manager vs. from [flatpak](https://flatpak.org/), as well as installing, uninstalling, purging, fixing, and reinstalling various python libraries such as `pycairo` and `python-gi-cairo`, which were different in subtle and incompatible ways.  But two days was a rounding error by this point, so it’s not worth further details.)

But, there’s still a problem.  The emulator recommended for Trackmania 2020 is [Valve Software’s Proton](https://github.com/ValveSoftware/Proton), which comes included with Linux versions of Steam.  The problem is that running Proton outside of Steam on non-Steam games is a diceroll.  To quote [Glorious Eggroll](https://github.com/GloriousEggroll/proton-ge-custom), a custom Proton developer:

> **RUNNING NON-STEAM GAMES WITH PROTON OUTSIDE OF STEAM IS NOT SUPPORTED. DO NOT ASK FOR HELP WITH THIS.**

What’s the problem?  [Trackmania 2020](https://store.steampowered.com/app/2225070/Trackmania/) is available on Steam, so just install it through Steam and use Lutris.  The problem, just like in the Xvfb section, is that there’s a middleman: Steam opens the Ubisoft Connect Launcher, which itself opens Trackmania, and to simplify installation, Lutris’ Trackmania installation scripts skip the Steam step entirely.  But, the latest versions of Trackmania really needed a specific version of Proton - Proton Experimental - in order to work.  After looking through quite a few angry messages warning us in no uncertain terms not to try to use Proton Experimental in Lutris without Steam, we found a [step-by-step guide](https://old.reddit.com/r/Lutris/comments/n3s0m2/how_can_i_use_proton_experimental_with_lutris/gwrn8ob/) on how to do it...that had since been deleted.

<img src="/assets/img/Trackmania/Deleted_Guide.png" alt="A reddit comment reads [deleted], and a bunch of replies praise the detailed guide." title="A reddit comment reads [deleted], and a bunch of replies praise the detailed guide."/>

This was something of microcosm of the whole project.  Eventually, with Internet Archive, we found the original guide, and painstakingly followed it despite the annoyance of trying to do GUI-based things on low-resolution Xvfb screens.  We got Ubisoft Connect working, but in trying to go beyond that, we encountered more and more problems.  The end result, after quite a lot of work, was an error message so infrequently used that nobody had ever fixed the typo:

<img src="/assets/img/Trackmania/Corrupted_Installation.png" alt="Corrupted installation.  Please verify files integrity or reinstall the game." title="Corrupted installation.  Please verify files integrity or reinstall the game."/>

At this point, we decided that discretion was the better part of valor, and decided to install Windows instead.

### Windows Woes: Wrestling With Window Selection

Alright, back to the drawing board.  Download Windows, put it on a USB, format the USB correctly. Plug the USB into Somnium. Enter BIOS.  Select USB as boot drive.  Restart.  Boot into Windows installer.  Unplug the ethernet cord so it doesn’t make you register a Microsoft account. Spend a literal hour on the install.  Don’t forget to put in your registration code. Boom, a fresh Windows install, a process that’s only *slightly* more painful than doing it for Linux. 

Of course, `ssh`ing doesn’t work the way you’d expect, and installing Windows Subsystem for Linux (WSL) is the *opposite* of what we wanted to do.  We wanted to use the native Windows features.  We are not going to give an exhaustive rundown here of installing OpenSSH on Windows, because there are many excellent tutorials on it.  What we *will* tell you is that by default, if the account you want to ssh in is an administrator, there is a *special* file in the OpenSSH directory that you need to modify to point at your `ssh` keys, which is different from the one standard users use, they are `administrators_authorized_keys` and `authorized_keys` respectively.  Oh, and that if you open any of your `ssh` key files with the wrong program and save them, you will break them in a way that is nearly undetectable until you restore them from backup. 

And for once, a small blessing: all the port forwarding we’d done in the past still worked. 

Of course, once *that’s* set up, you still need to figure out how to remote desktop in.  Did you know that if you have remote desktop set up, the only permitted auth is a **password**, and not an ssh key?  That you have to set up a ssh tunnel and then connect to the RDP session?  Oh, and that if the RDP session ends, running programs do too, so you need a second user if you want to be able to run a program in the background while someone connects and disconnects?  Fortunately, you can set up two accounts and solve things that way.  Unfortunately, sharing files between them is tricky, but solvable.  That’s what we did: we made a new administrator account named Fictor and had it as a permanently running account so we could (theoretically) perpetually train our network.  With Fictor and Sominum both living on our Windows account, we were all set to really begin work.  Sure, [shadowing another user](https://gitlab.com/Remmina/Remmina/-/issues/2774) didn’t work, but small potatoes when we had the ability to screen share over Discord.  It wasn’t going to be easy, but people write programs to interact with running GUIs all the time, so that portion will at least be easy. Indeed ChatGPT once again suggested the approach would be simple: 

<img src="/assets/img/Trackmania/ChatGPT_1.png" alt="A script suggested by ChatGPT featuring the windows-rs Rust crate." title="A script suggested by ChatGPT featuring the windows-rs Rust crate."/>

There’s a handy [Windows API crate](https://github.com/microsoft/windows-rs) in Rust that you can use to interact with Windows methods.  Surely, somewhere in here is a simple method to pick a running window and press keypresses into it!  As a savvy reader, by now you know what that means.  Three days of trying to select a window using the windows-rs crate, having exhausted every StackOverflow question we could find related to the problem and generally having tried every permutation of code we could invent, we were back at ChatGPT, who helpfully informed us that the best way to do that would be to invoke powershell directly. It’s simple, you see: 

<img src="/assets/img/Trackmania/ChatGPT_2.png" alt="A PowerShell script suggested by ChatGPT that selects Notepad and writes to it." title="A PowerShell script suggested by ChatGPT that selects Notepad and writes to it."/>
 
Exceedingly simple.  Except while we were able to *list* windows, focusing on the Trackmania window and sending it an input was… not working, at all.  We saw there was a running window. We could not select it, and it was not receiving inputs.  Even switching to Notepad was giving us inconsistent and poor results.  We got deep into the PowerShell documentation: hundreds of methods, none of them simple; tons of examples, most of them not really functional for what we wanted.  Wading back into the broader internet, everyone agreed… why use PowerShell, which was calling out to dotnet anyway, and not just use the rust API bindings in `windows-rs`? 

What we probably should have done was use a [joystick emulator like Yann Bouteiller’s `vgamepad`](https://github.com/yannbouteiller/vgamepad), but we didn’t appreciate the difference between that and `Send-KeysToWindow` at the time, and assumed that we’d still need the window selection logic that wasn’t working to work, before anything like `vgamepad` was a viable option.

At this point, we threw our hands up in the air.  [PedroAI](https://www.trackmania.ai/blog/) had assured us that he’d managed to get his setup working on Linux, and being no closer to getting it working on Windows, we backed up all our Windows settings and installed Ubuntu Desktop again. 

### Shut Up and Take My Money!

But, for a brief and glorious period of time, we had Windows!  Installing Trackmania was a breeze, with no compatibility issues at all.  Having finally installed the game, and installed OpenPlanet ([we’ll get to OpenPlanet](#hack-the-openplanet), don’t worry), we discovered the next obstacle: we needed to use custom plugins made by others in the ML community, in order to feed race data to the machine learning model that we really wanted to start coding already.  Eventually, we’d need to make our own plugins.  And both Nadeo’s own home screen and the [OpenPlanet documentation](https://openplanet.dev/next/club) made it clear that only Club Access, the most expensive of the (at the time) three tiers of subscription, could run unsigned custom plugins.  No problem!  We’d already spent enough money to buy a completely new computer, so spending a mere $30 on a year’s Club Access was a no-brainer.  Surely a multibillion dollar company like Ubisoft had made the process of giving them money for a product seamless. 

Purchasing Club Access took more than a week.

At first, the problem was simple: the “ADD TO CART” button on the website did nothing when we clicked it, and did not add Club Access to the cart.  Okay, probably due to one of the adblocks in the browser.  So we disabled the adblocker.  Same problem.  Switched browsers.  Same problem.  [Cleared cookies, cleared the system cache, opened in Incognito mode from another computer, IP address, and Ubisoft account entirely](https://www.ubisoft.com/en-us/help/connectivity-and-performance/article/browser-troubleshooting-for-ubisoft-webpages/000062631), only to inexplicably still get the same issue.  We looked online for help, only to find that Ubisoft’s [entire support forum had migrated to Discord](https://discussions.ubisoft.com/).  We sent a detailed help message to Ubisoft’s Support Desk, but they never responded to the support ticket.  We tried buying from the in-game store rather than through an online browser...and got a different message:

> Sorry, it seems you tried to purchase this more than once. Try again in a few moments.

Sadly, in the absence of a support forum, the only results on Google for that message were others just as baffled as we were, and there were no solutions proposed beyond just waiting a few days and seeing if the problem went away on its own.  Impatient and not wanting to wait, we even tried using the browser’s developer console to analyze the Ubisoft store’s website, to narrow down which part of the process was causing the problem and maybe try to manually trigger whatever event the “ADD TO CART” button was supposed to trigger, but gave up after getting lost in a maze of TikTok tracking pixels apparently coating every visible surface of the store.

<img src="/assets/img/Trackmania/Ubisoft_TikTok.png" alt="Developer console on the Ubisoft website showing tons of TikTok tracking pixels." title="Developer console on the Ubisoft website showing tons of TikTok tracking pixels.">

Five days later, we tried again, and had no problem purchasing the subscription.  We have no idea what caused this problem and we have no idea what fixed it.  But it was five days spent trying to solve a problem that we never would have anticipated needing to solve in the first place. This was not the last time we’d be blocked by mysterious forces outside of our control that could only be defeated by waiting. 

### SSH Standstill: ISP Impasse 

While all that had happened under Windows, it was now behind us. It was time to move on to Ubuntu: this time, the Desktop edition. You know the dance by now.  Plug in USB drive.  Download Ubuntu Desktop, install Ubuntu Desktop on the USB,... etc.  By this point we were pros at it, so Ubuntu Desktop was rapidly installed, `ssh` was enabled, and we could get to work.  Because real life always insists on interrupting, we had to take a break for a couple days so some of us could “earn money to afford computers” and “maybe finish the thesis that’s been in progress for five years”.  On the side, Dave was working on an annoyingly complex Project Euler problem, and he decided that the additional RAM in Somnium was just what he needed to brute-force through twelve billion integers to victory.

<img src="/assets/img/Trackmania/ProjectEuler.png" alt="A Project Euler problem containing a single equation and twelve billion numbers to check." title="A Project Euler problem containing a single equation and twelve billion numbers to check."/>

So off he went, `ssh`ed into Somnium, and started to load up Rust… when suddenly he was disconnected.  Weird, but the Internet sometimes has issues.  No problem.  He logged back in, resumed installing things, and suddenly, once again, was dropped.  This time, he couldn’t `ssh` back.  All his attempts to ping the IP failed, and `ssh` was timing out.  Fortunately, he hadn’t actually changed anything or run any kind of program yet, so clearly this was something wrong on the computer network side.  We hopped on Discord and began investigating.  Sominium was on, of course, and the local network was live. It was possible for Felipe to `ssh` in from the local network, and Somnium could access the broader internet.  But no service could ping this IP address.  We turned it on and off again, and turned the router on and off again, just in case.  Still nothing; tracing the route, the packets disappeared somewhere in the Verizon network. We tried a service to ping the computer from multiple geographical locations, and none of them could ping it.  We speculated that we were on the edge of an Internet tsunami, that we were seeing the first symptoms of the collapse of the entire Internet and life as we knew it. That or it was a transient network issue. 

We decided to call it a day, and see if it would fix itself.  It didn’t, and no amount of network configuration seemed to help.  For a week, we tried various things: disabled firewalls, set up different port forwarding rules, verified that settings on Somnium had not changed, triple checked `ssh` keys (even though it wasn’t a key auth issue in the first place), restarted Somium, downloaded Linux packages for diagnosing network issues… and then resorted to desperate means.  We contacted Verizon.  Who very politely said since we weren’t using their router, and that since we weren’t premium customers, we could pound sand.  There was nothing they could or would do.  As far as they could tell us, everything was dandy.  By this point we’d done the digital equivalent of plugging in all our monitors and cables and keyboards to the failing Sotano, but with even less success. 

<img src="/assets/img/Trackmania/Verizon.png" alt="Things Verizon has done for me so far: 1. Told me it must be my router.  2. Restarted my Internet.  3.  Not understood what a ping is.  Things they have not done: 1. Addressed the problem." title="A summary of things Verizon has and has not done."/>

We had one last theory: we speculated that something was broken in our IP reservation.  The *best* way to get a new one from Verizon is to just turn your main router off and let your IP get reassigned, when you turn it back on, you’ll have a new IP.  So we shut off the router for 45 minutes… and had the same IP.  And the same problems.  In desperation, we turned the router off overnight: our last prayer, a ritual to soothe the angry network spirits.  That worked.  We got a new IP.  With it, all our network problems had vanished, as if they had never been.  Another week spent resolving an issue that brought us no closer to writing any actual machine learning code. 

### Hack the OpenPlanet

But, we were finally getting close.  Once we were able to `ssh` into the computer again, we had Trackmania working, and we’d finally purchased Club Access so that we could use all the features of OpenPlanet.  OpenPlanet, [as mentioned earlier](#shut-up-and-take-my-money), is Trackmania’s plugin and mod manager, and we needed to get it working so that we could install our own plugins.

Why did we need plugins?  Because, without plugins, the only data we could give our machine would consist of static pictures of the screen.  Human players get to play with all kinds of information beyond the images of the car: audio cues can give the RPM and the gearbox, numbers on screen can give the speed and the checkpoint times, and [various extensions](https://openplanet.dev/plugin/dashboard) provide even more data than that, such as wheel status and acceleration.

Running an OCR program on the screen itself to get some of those numbers was going to be slow, fraught with inaccuracy, and inefficient - [though it *has* been done before for Trackmania](https://antonin.cool/trackmania-ia-deeplearning-python-opencv-self-driving/).  But a plugin could give our program those numbers directly.  All we needed was OpenPlanet, because once we had it, we could install any other mod we wanted.  And fortunately, [OpenPlanet could be run on Linux](https://openplanet.dev/docs/help/linux); but following the directions and calling `wine`, we quickly encountered a litany of several hundred nearly-identical errors:

> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\explorer.exe" (error=80)   
> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\hh.exe" (error=80)   
> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\notepad.exe" (error=80)   
> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\regedit.exe" (error=80)   
> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\system32\\explorer.exe" (error=80)   
> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\system32\\iexplore.exe" (error=80)   
> 0030:err:setupapi:create_dest_file failed to create L"C:\\windows\\system32\\notepad.exe" (error=80)   
> ...

That’s obviously a permissions issue; easy enough to fix by calling `wine` with `sudo`.  Sure enough, OpenPlanet installed with no errors.

But now the game wouldn’t start.  Ubisoft Connect would open, the game could be selected, the loading screen would appear...and nothing else would happen.

It wouldn’t be accurate to say that this took us a month’s worth of work to fix, because that month was December and found us both busy with [Advent of Code](https://adventofcode.com/), with work, with Christmas, and with other non-Trackmania demands on our time.  But it wasn’t for another month that we realized that the first installation actually had worked, despite all those permissions errors.  It really shouldn’t be run with `sudo`, and running it with `sudo` will cause the installation to work but for Trackmania to have its own invisible permissions errors.

It wasn’t until January that we actually got OpenPlanet working again...whereupon there was an update which forced us to completely uninstall both OpenPlanet and Trackmania itself and reinstall from scratch, because the update process for OpenPlanet on Linux is very fragile.  But at least now we knew how to do it, and what took a month the first time, we got down to a mere fifteen-minute annoyance.  Now we could install plugins.

### Dependencies Dilemma – Dealing with Dated Datagatherer

We wanted to gather data for reinforcement learning, so Palamabron’s plugin called [Data Gatherer for Reinforcement Learning](https://openplanet.dev/plugin/sac_getdata) seemed the natural choice.  The plugin sends data to an TCP socket, which took some work to interface with, but eventually, we got a more fundamental problem: `Script exception: Null pointer access`, traced ultimately to the plugin [PlayerState](https://openplanet.dev/plugin/playerstate).

<img src="/assets/img/Trackmania/NullPointerException.png" alt="A null pointer exception referencing the culprit plugin PlayerState." title="A null pointer exception referencing the culprit plugin PlayerState."/>

It turned out that one of the requirements for Palamabron’s plugin was a plugin which has since been deprecated; the [OpenPlanet Discord server](https://discord.com/invite/openplanet) suggested that we switch instead to the plugin [MLFeed: Race Data](https://openplanet.dev/plugin/mlfeedracedata), but that plugin turned out not to have most of the features we actually needed, and its various dependencies and dependents didn’t either.  

Ultimately, the plugin we actually downloaded and actually used - before we started to modify it - wasn’t even in the OpenPlanet repository.  It was instead hidden [deep in a zip folder in the repository for Yann Bouteiller’s Trackmania Reinforcement Learning project](https://github.com/trackmania-rl/tmrl/releases/download/v0.6.0/resources.zip), which despite using Python instead of Rust, was looking more and more appealing by the day.  But that plugin didn’t rely on outdated dependencies.  It actually worked.  We wrote a quick Rust program to send keystrokes in and get car data out, and it **worked**.

That was the last obstacle between us and machine learning.  At long last, after thousands of words’ worth of problems, we could write some Rust code and see the car move all on its own.  Sure, machine learning takes time, but we had time.  We could now write some basic reinforcement learning code, leave the game running for a week, and come back to see better driving than we’d left it with. 

### Taking RAM for a Joyride

There is a [known issue](https://www.reddit.com/r/TrackMania/comments/11t0r3r/is_anyone_else_having_memory_leaks_trackmania/) with Trackmania leaking memory.  That is: the more it runs, the more RAM it uses.  Usually, that’s not a huge problem (unless [you’re a speedrunner trying to overflow the timer for a world record](https://www.youtube.com/watch?v=1aEb5sJISsE)), but if you happen to want to leave the program running for a week, so it can train continuously, it can be an issue.  It can also be an issue if you, for example, hop off a Discord call where you’ve made great progress programming inputs via a gamepad, and forget to shut off the game before disconnecting from the virtual desktop. In fact you might connect again, a week later, to find that the screen is completely frozen.

Maybe this is the memory leak issue, and maybe it's not.  It's not a problem either way: you can just kill the `x11vnc` server, which should let you spin up a new desktop and just restart Trackmania. 

<img src="/assets/img/Trackmania/Corrupted_Installation.png" alt="Corrupted installation.  Please verify files integrity or reinstall the game." title="Corrupted installation.  Please verify files integrity or reinstall the game."/>

Ok, so maybe interrupting the server mid… whatever it is it was doing had some unexpected results. How bad could it be? 

Turns out you might have to uninstall everything twice, and then walk through your reinstallation instructions… and forget to remove `sudo` again. So scrub everything a third time and make *sure* you got all the files before running through the reinstallation process again. 

In the future, killing the process by restarting the machine with `sudo reboot` proved to be less destructive to the integrity of the installation.  But we still worry about leaving the game unsupervised for too long.

## Final Setup

So, after all that, now that we have a working setup, what does that setup look like?  In our case, it looks like a .txt file, crudely formatted and frequently copied, that we reference whenever we need to start over from scratch.  Which still happens from time to time.

```
Before installing anything:
    - `sudo apt install build-essential libudev-dev`

Starting the remote desktop:
    - Launch a detached terminal with `tmux` or `screen`.
    - `x11vnc -auth guess -forever -loop -noxdamage -repeat -rfbport $PORTNUMBER -shared`

After installing the game through Steam, Ubisoft Connect must be installed separately:
    - Go to the Ubisoft Connect installer at ~/.steam/steam/steamapps/common/Trackmania/UbisoftConnectInstaller.exe
    - export WINEPREFIX=~/.steam/steam/steamapps/compatdata/2225070/pfx
    - wine UbisoftConnectInstaller.exe
   	  - Do *not* use `sudo` for this, even though it will complain that you’re not using sudo and that you don’t have the permissions to do what you are trying to do
      - If you do use `sudo`, it will look like it works, but won't work.

Getting OpenPlanet working:
    - The game itself runs fine with only the launch option `PROTON_NO_FSYNC=1 %command%`
    - However, Openplanet requires `WINEDLLOVERRIDES="dinput8=n,b"`
    - The dinput override requires vc_redist.x64.exe to be installed.
   	    export WINEPREFIX=~/.steam/steam/steamapps/compatdata/2225070/pfx
   	    export WINEPATH="~/.steam/steam/steamapps/common/Proton - Experimental/files/bin/wine64"
   	    wine ~/Downloads/VC_redist.x64.exe
    - Copy Openplanet to ~/.steam/steam/steamapps/steamapps/common/Trackmania
   	    export WINEPREFIX=~/.steam/steam/steamapps/compatdata/2225070/pfx
   	    export WINEPATH="~/.steam/steam/steamapps/common/Proton - Experimental/files/bin/wine64"
   	    wine OpenPlanet.exe
    - Install to Z:\home\somnium\.steam\steam\steamapps\common\Trackmania

After reinstalling, put the desired plugin (TMRL_GrabData.op) into OpenPlanetNext/Plugins.
In Openplanet (F3) in the game, enable developer mode on startup.

If you ever see the error "Ubisoft Connect has detected an unrecoverable error and must shut down.", you need to completely uninstall the game and start over.
```

It doesn’t seem so bad, now that we’ve figured it all out.

## Reflection 

This post is more than six thousand words of technical problems, most of which are actually meaningless in a broader context.  Most people doing projects will not care at all about the specific way one might have to install OpenSSL or that `pycairo` and `python-gi-cairo` are two different incompatible libraries.  In fact, it’s doubtful even one human being will find the specific details of our issues helpful (though do tweet at us if you run into the networking issue we saw!), but there’s a broader theme here: doing the devops/sysadmin parts of a project is a huge upfront drain.

Many projects don’t really talk about this.  Instead you see a nice README that explains how to do things, but that README that doesn’t reflect the human pain and suffering it took to figure out that the path for your Steam directory depends on the version of Proton you have.  You can look at our final instructions (less than three hundred words) and compare it to the literal five months of trying to get things working; that ratio probably isn't unique to us.

Learning to do this initial setup is a skill, and one that most people embarking on their first project don’t realize they need.  We imagine many projects fail to get off the ground not because the people working on it don’t have brilliant ideas, or because they can’t code their way out of a paper bag… but because they ran into some obscure kernel issue, and when faced with downgrading the kernel to get their GPU to work, or doing something else, they did something else. 

It’s disheartening sometimes, working on a project where you’ve sketched out the gorgeous code you’re going to write to do the cool thing, and instead you spend three days reading StackOverflow questions about concepts you’ve never encountered, and that you don’t want to know anything about.  This is only made worse by the vast amount of projects that don’t have the bandwidth (understandably) to support many different modes of operation or installation, leaving people like us who want to use those resources to forge their own way.  There’s a specific form of despair that emerges upon discovering the open source project you want to use hasn’t been updated since 2012 and no longer works on modern operating systems. 

Those are all probably insoluble problems. We can’t make open source projects support all ways in which they can be used.  Python libraries will always have four different ways of being installed, each version of Linux will be insidiously different from the next.  Those are things that will always be that way.  What we **can** do is talk about the difficulties of setup, chronicling the fixes in ways that hopefully don’t just disappear off the face of the internet when a single Reddit account is deleted.  We can ensure that when someone goes to start writing `FirstCoolProject.py` and, a month later, is deep into writing `ThisCantBeRight.docx`, that brave explorer can see that he's not alone: the vast majority of projects start with banging one's head into a wall of errors and setup issues. 

All these problems are things one can get good at solving.  We’ve gotten good at solving them, even when its a frustrating nightmare.  Learning when to pivot vs. when to dig down is always a challenge, but the more times you start a project and have to do something wonky, the more adept you become at making it work, even if it's not perfect.  Setting up projects can be extremely daunting, but it must be done in order to actually get to the “good” parts.  You just need to do the bare minimum to get it working for you; you can solve for others later.  Make sure you take good notes, because you will either be referencing them all the time, or wishing all the time that you had notes to reference.

Perhaps the best lesson is this: you just need it to work.  On your machine.  For now.  It doesn’t need to be perfect, just good enough to let you do what you actually want to do. 