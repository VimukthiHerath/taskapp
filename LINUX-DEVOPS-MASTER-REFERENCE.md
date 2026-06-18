# Linux Basics — DevOps/SRE Master Reference & Practice Guide

> A single, self-contained refresher built from the **Linux Basics Course (KodeKloud)**.
> Every command is broken down by **variety**, every **flag** is explained, and every
> section ends with **practical daily DevOps/SRE drills** you can run from a local VM or
> a real Linux machine.

---

## How to use this document

- **Read top-to-bottom** the first time to refresh, then jump via the Table of Contents.
- Each command block follows this pattern:
  - **What it does** (one line)
  - **Varieties** (each form of the command shown separately)
  - **Flags** (every flag explained in a table)
  - **DevOps/SRE Practice Drills** at the end of every module.
- `$` means a normal user prompt; `#` (or `sudo`) means root is required.
- Commands marked **(destructive)** can delete data or break a system — practice them in a
  throwaway VM (Vagrant, VirtualBox, multipass, a cloud spot instance, or `docker run -it ubuntu`).

### Recommended practice lab

```bash
# Quick disposable Ubuntu box (Docker)
docker run -it --name linuxlab --hostname linuxlab ubuntu:22.04 bash

# Or a multipass VM (gives you a real systemd + disks)
multipass launch --name linuxlab --disk 10G --memory 2G 22.04
multipass shell linuxlab

# Or VirtualBox/Vagrant
vagrant init ubuntu/jammy64 && vagrant up && vagrant ssh
```

> For storage/systemd/networking drills you want a **real VM** (multipass/VirtualBox/cloud),
> not a container, because containers share the host kernel and lack systemd + extra disks.

---

## Table of Contents

1. [Introduction & Mental Model](#module-1--introduction--mental-model)
2. [Working with the Shell — Part I](#module-2--working-with-the-shell--part-i)
3. [Linux Core Concepts](#module-3--linux-core-concepts)
4. [Package Management](#module-4--package-management)
5. [Working with the Shell — Part II](#module-5--working-with-the-shell--part-ii)
6. [Security & File Permissions](#module-6--security--file-permissions)
7. [Networking](#module-7--networking)
8. [Storage in Linux](#module-8--storage-in-linux)
9. [Service Management with systemd](#module-9--service-management-with-systemd)
10. [Capstone — Troubleshooting a Real Deployment](#module-10--capstone--troubleshooting-a-real-deployment)
11. [Appendix — Cheat Sheet & Daily Routine](#appendix--cheat-sheet--daily-routine)

---

# Module 1 — Introduction & Mental Model

### Why the shell matters
The GUI is friendlier but limited. The **shell** (CLI) is where real server work happens —
it is scriptable, remote-friendly, fast, and consistent across every Linux box you will ever
touch. As a DevOps/SRE engineer, 90% of your work is in a terminal over SSH.

### What a shell is
A program that gives **text-based interaction** between you and the OS: you type a command,
the kernel does the work, you get text back.

### The Home Directory
- Each user gets a private home directory, by default `/home/<username>` (e.g. `/home/michael`).
- The `root` user is the exception — its home is `/root`.
- Your home is yours: you can create/read/delete freely; other non-root users cannot peek in.
- The shorthand for "my home directory" is the tilde: `~`.

### Command anatomy

```
command  [options/flags]  [arguments]
  echo        -n            hello
```

- **command** — the program to run (`echo`, `ls`, `date`).
- **argument** — the input the command acts on (`hello`, a filename).
- **option/flag/switch** — modifies behaviour (`-n`, `--help`). Short flags use `-`, long flags use `--`.

| Example | Meaning |
|---|---|
| `echo` | prints a blank line (no argument needed) |
| `echo hello` | prints `hello` (argument supplied) |
| `uptime` | prints how long the system has run (no argument needed) |
| `echo -n hello` | prints `hello` with **no trailing newline** (`-n` flag) |

### Internal vs External commands

| Type | Where it lives | Examples |
|---|---|---|
| **Internal / built-in** | Part of the shell itself (~30 commands) | `echo`, `cd`, `pwd`, `set`, `export`, `alias` |
| **External** | Separate binaries/scripts on disk (in `$PATH`) | `mv`, `cp`, `date`, `uptime`, `ls` |

**Find out which a command is:**

```bash
type echo     # -> "echo is a shell builtin"
type mv       # -> "mv is /usr/bin/mv"
type -a ls    # -a shows ALL locations/definitions (alias + binary)
```

| `type` flag | Explanation |
|---|---|
| (none) | Tells you how the name would be interpreted (builtin/alias/file/keyword) |
| `-a` | Show **all** places the name is found, in search order |
| `-t` | Print just a one-word type: `alias`, `keyword`, `function`, `builtin`, or `file` |
| `-p` | Print the disk path only (nothing if it's a builtin/alias) |

### DevOps/SRE Practice Drills — Module 1

1. Open a terminal and identify your shell, user, and home: `echo $SHELL; whoami; echo $HOME`.
2. Run `type cd`, `type ls`, `type -a python3` and note which are builtins vs binaries.
3. Print "deploy started" with and without a trailing newline (`echo` vs `echo -n`).
4. Check how long your machine has been up with `uptime`, then `uptime -p` (pretty) and `uptime -s` (since when).
5. Decide a personal rule: from now on, when you don't know a command, run `type <cmd>` first.

---

# Module 2 — Working with the Shell — Part I

## 2.1 Navigation & inspecting where you are

### `pwd` — print working directory
Shows the absolute path of the directory you're currently in.

```bash
pwd            # /home/michael
pwd -P         # resolve symlinks and show the REAL physical path
pwd -L         # show the logical path (default; keeps symlink names)
```

| Flag | Explanation |
|---|---|
| `-L` | Logical — uses `$PWD` even if it contains symlinks (default) |
| `-P` | Physical — resolves all symlinks to the true directory |

### `ls` — list directory contents

```bash
ls                 # names in the current directory
ls /etc            # list a specific directory
ls -l              # long format: perms, owner, group, size, date
ls -a              # all, including hidden dotfiles (. and ..)
ls -la             # long + hidden together
ls -lh             # long + human-readable sizes (K, M, G)
ls -lt             # long, sorted by modification time (newest first)
ls -ltr            # long, by time, REVERSED (oldest first / newest last)
ls -lS             # sort by size (largest first)
ls -ld /etc        # info about the directory ITSELF, not its contents
ls -lR             # recursive: list every subdirectory too
ls -li             # show inode numbers
ls --color=auto    # colorize output by file type
```

| Flag | Explanation |
|---|---|
| `-l` | Long listing (one file per line with metadata) |
| `-a` | Show hidden files (those starting with `.`) |
| `-A` | Like `-a` but omit `.` and `..` |
| `-h` | Human-readable sizes (use **with** `-l`) |
| `-t` | Sort by modification time, newest first |
| `-r` | Reverse the sort order |
| `-S` | Sort by file size, largest first |
| `-d` | List the directory entry itself, not its contents |
| `-R` | Recurse into subdirectories |
| `-i` | Show inode numbers |
| `-1` | One entry per line (no metadata) |

> **SRE habit:** `ls -ltr` is the single most useful form — the most recently changed file is
> always at the **bottom**, right above your prompt. Perfect for "what changed last?".

## 2.2 Creating & changing directories

### `mkdir` — make directory

```bash
mkdir Asia                       # one directory
mkdir Europe Africa America      # multiple at once
mkdir -p India/Mumbai            # create parent + child in one shot
mkdir -p a/b/c/d                 # create a deep tree, no errors if parents exist
mkdir -m 700 secret              # create with explicit permissions (mode)
mkdir -v project                 # verbose: print what was created
```

| Flag | Explanation |
|---|---|
| `-p` | Create parent directories as needed; no error if it already exists |
| `-m <mode>` | Set permissions at creation time (e.g. `-m 750`) |
| `-v` | Verbose — print a line for each directory created |

### `cd` — change directory

```bash
cd Asia                 # relative: into ./Asia
cd /home/michael        # absolute: from root
cd ..                   # up one level
cd ../..                # up two levels
cd                      # straight to your home (~) from anywhere
cd ~                    # also home
cd ~bob                 # into user bob's home directory
cd -                    # back to the PREVIOUS directory you were in
cd /                    # the root of the filesystem
```

> `cd` is a shell **builtin** (it must be, because it changes the shell's own state).
> `cd -` (toggle between two dirs) and `cd` (home) are huge time savers.

**Absolute vs Relative path**

| Type | Starts from | Example |
|---|---|---|
| **Absolute** | the root `/` | `cd /home/michael/Asia` |
| **Relative** | your current `pwd` | `cd Asia` |

### `pushd` / `popd` / `dirs` — directory stack
An alternative to `cd` that remembers where you've been.

```bash
pushd /etc       # cd to /etc AND push it on the stack
pushd /var       # cd to /var, /etc remembered underneath
pushd /tmp       # stack now: /tmp /var /etc
dirs -v          # show the numbered stack
popd             # pop the top, return to the previous entry
pushd            # with no args: swap the top two entries
```

| Command | Explanation |
|---|---|
| `pushd <dir>` | Change to `<dir>` and save current location on the stack |
| `popd` | Remove top of stack and `cd` to the new top |
| `dirs -v` | List the stack with index numbers |

> **SRE use:** jumping between `/etc/nginx`, `/var/log`, and `/opt/app` during an incident
> without retyping long paths.

## 2.3 Moving, copying, renaming, deleting

### `mv` — move **or** rename (same command, two uses)

```bash
mv Europe/Morocco Africa/                 # MOVE a file/dir into another directory
mv /home/michael/old /home/michael/new    # MOVE using absolute paths
mv Asia/India/Munbai Asia/India/Mumbai    # RENAME (move to a new name, same dir)
mv -i a.txt b.txt                         # interactive: prompt before overwrite
mv -n a.txt b.txt                         # no-clobber: never overwrite
mv -v a.txt /tmp/                         # verbose: show what moved
mv -u src dst                             # update: move only if source is newer
mv file1 file2 file3 targetdir/           # move many into one directory
```

| Flag | Explanation |
|---|---|
| `-i` | Prompt before overwriting an existing file |
| `-n` | Never overwrite an existing file |
| `-f` | Force — overwrite without prompting (default) |
| `-v` | Verbose — print each move |
| `-u` | Move only when source is newer than destination (or dest missing) |

### `cp` — copy

```bash
cp City.txt /tmp/                  # copy a file into a directory
cp a.txt b.txt                     # copy to a new filename
cp -r Europe/UK Europe/UnitedKingdom   # -r = recursive (needed for directories)
cp -a srcdir/ dstdir/              # archive: preserve perms, timestamps, symlinks
cp -p a.txt /backup/              # preserve mode, ownership, timestamps
cp -i a.txt b.txt                 # prompt before overwrite
cp -u src dst                     # copy only if source newer
cp -v *.conf /etc/backup/         # verbose
cp -L link.txt dst/              # follow symlinks (copy the target, not the link)
```

| Flag | Explanation |
|---|---|
| `-r` / `-R` | Recursive — required to copy directories |
| `-a` | Archive — `-r` + preserve everything (best for backups/migrations) |
| `-p` | Preserve mode, ownership, and timestamps |
| `-i` | Interactive prompt before overwrite |
| `-u` | Update — copy only if source is newer |
| `-v` | Verbose |
| `-L` | Dereference — copy the file a symlink points to |
| `-n` | No-clobber — don't overwrite |

### `rm` — remove **(destructive)**

```bash
rm London.txt                # delete a file
rm -i secret.txt             # prompt before each deletion (safer)
rm -f stale.lock             # force: ignore missing files, no prompt
rm -r olddir/                # recursive: delete a directory and its contents
rm -rf build/                # recursive + force (the classic — be VERY careful)
rm -v *.tmp                  # verbose
rm -rI big_dir/              # prompt ONCE before recursive delete (safer -rf)
rm -- -weirdname             # "--" stops flag parsing for files starting with -
```

| Flag | Explanation |
|---|---|
| `-r` / `-R` | Recursive — delete directories and everything inside |
| `-f` | Force — no prompts, ignore nonexistent files |
| `-i` | Interactive — prompt before **every** removal |
| `-I` | Prompt **once** before removing many files or recursing (good middle ground) |
| `-v` | Verbose |
| `-d` | Remove empty directories |

> **NEVER run `rm -rf /` or `rm -rf $VAR/` when `$VAR` might be empty.** Always `echo` a
> variable before using it in a delete, and prefer `rm -rI` over `rm -rf` interactively.

### `touch` — create empty file / update timestamps

```bash
touch Country.txt                 # create an empty file (or update its mtime)
touch a.txt b.txt c.txt           # create several at once
touch -c maybe.txt                # don't create if it doesn't exist (just touch)
touch -t 202401011200 file        # set a specific timestamp [[CC]YY]MMDDhhmm
touch -d "2 hours ago" file       # set time using human-readable date
touch -a file                     # change only access time
touch -m file                     # change only modification time
touch -r ref.txt new.txt          # copy ref.txt's timestamps onto new.txt
```

| Flag | Explanation |
|---|---|
| `-c` | Do not create the file if it doesn't already exist |
| `-t <stamp>` | Use a specific timestamp |
| `-d <string>` | Use a free-form date string |
| `-a` | Update access time only |
| `-m` | Update modification time only |
| `-r <file>` | Use another file's timestamps as reference |

## 2.4 Viewing file contents

### `cat` — concatenate / print files

```bash
cat City.txt                  # print a file to the screen
cat a.txt b.txt               # print several files back-to-back
cat > new.txt                 # type text, end with Ctrl+D, writes to new.txt
cat >> new.txt                # append typed text to the file
cat -n file                   # number every line
cat -b file                   # number only non-blank lines
cat -A file                   # show tabs (^I), line ends ($), control chars
cat -s file                   # squeeze repeated blank lines into one
```

| Flag | Explanation |
|---|---|
| `-n` | Number all output lines |
| `-b` | Number non-blank lines only |
| `-A` | Show all non-printing characters (`-vET`) |
| `-E` | Show `$` at end of each line |
| `-T` | Show tabs as `^I` |
| `-s` | Squeeze multiple blank lines |

### `more` and `less` — paged viewing

```bash
more big.log     # page DOWN through a file (older, forward-mostly)
less big.log     # page both ways, search, far more capable
less +F app.log  # follow mode (like tail -f); Ctrl+C then q to stop
less -N file     # show line numbers
less -S file     # don't wrap long lines (chop, scroll sideways)
```

Inside `less`: `Space`/`b` page down/up, `/word` search forward, `?word` search back,
`n`/`N` next/prev match, `g`/`G` top/bottom, `q` quit.

| `less` flag | Explanation |
|---|---|
| `+F` | Start in follow mode (live tail) |
| `-N` | Show line numbers |
| `-S` | Chop long lines instead of wrapping |
| `-i` | Case-insensitive search |

> **SRE habit:** `less` is preferred over `more` (and over `cat` for big files). Use
> `less +F /var/log/syslog` to watch logs live without a separate `tail`.

## 2.5 Getting help

### `whatis` — one-line description

```bash
whatis date        # date (1) - print or set the system date and time
whatis ls cp mv    # multiple at once
```

### `man` — full manual pages

```bash
man date            # open the manual for date
man 5 crontab       # open section 5 (file formats) specifically
man -k network      # keyword search (same as apropos)
man -f date         # one-line summary (same as whatis)
man man             # the manual about manuals
```

Man sections worth knowing: **1** user commands, **5** file formats (e.g. `man 5 fstab`),
**8** admin commands (e.g. `man 8 mount`).

| `man` flag | Explanation |
|---|---|
| `-k <kw>` | Search all man pages for a keyword (apropos) |
| `-f <cmd>` | Show the short description (whatis) |
| `<n> <cmd>` | Open a specific section number |

### `--help` / `-h` — quick built-in help

```bash
date --help       # long help built into the program
date -h           # short help (not every command supports -h)
```

### `apropos` — search man page descriptions by keyword

```bash
apropos modpr        # find commands whose description mentions "modpr"
apropos -e network   # exact keyword match
apropos compression  # discover tools you didn't know existed
```

| `apropos` flag | Explanation |
|---|---|
| `-e` | Exact match of the keyword |
| `-a` | Match **all** keywords (AND instead of OR) |

> If `apropos`/`man -k` says "nothing appropriate", run `sudo mandb` to build the index.

## 2.6 The Bash shell itself

### Types of shells

| Shell | Command | Note |
|---|---|---|
| Bourne Shell | `sh` | The original; minimal |
| C Shell | `csh` / `tcsh` | C-like syntax |
| Korn Shell | `ksh` | Bourne + extras |
| Z Shell | `zsh` | Feature-rich, default on macOS |
| **Bourne Again Shell** | `bash` | The Linux default; this guide assumes bash |

```bash
echo $SHELL        # which shell is your login shell
echo $0            # which shell is running right now
cat /etc/shells    # all valid login shells installed
```

### `chsh` — change login shell

```bash
chsh                       # interactive; asks for the new shell path
chsh -s /bin/bash         # set your shell to bash
sudo chsh -s /bin/sh bob  # set another user's (bob's) login shell
chsh -l                   # list available shells (on some systems)
```

| Flag | Explanation |
|---|---|
| `-s <shell>` | Set the shell non-interactively |
| `-l` | List valid shells |

> The change takes effect on your **next login session**.

### Bash conveniences

```bash
# Tab completion: type part of a command/path, press TAB to auto-complete.

alias dt=date            # create a shortcut; now "dt" runs "date"
alias ll='ls -ltrh'      # a genuinely useful alias
alias                    # list all current aliases
unalias dt               # remove an alias

history                  # show previously run commands (numbered)
history 20               # last 20 commands
!42                      # re-run command number 42 from history
!!                       # re-run the very last command
!$                       # the last argument of the previous command
history -c               # clear the current session history
```

### Environment variables

```bash
echo $SHELL                       # read one variable
env                               # list ALL environment variables
printenv PATH                     # print one variable cleanly
OFFICE=caleston                   # shell (local) variable — NOT inherited by child processes
export OFFICE=caleston            # environment variable — inherited by child processes
export PATH=$PATH:/opt/obs/bin    # append a directory to PATH
unset OFFICE                      # delete a variable
echo $LOGNAME                     # your login name
```

**Make it persistent** (survives logout/reboot) by adding to a startup file:

```bash
echo 'export OFFICE=caleston' >> ~/.bashrc     # most common for bash
echo 'export OFFICE=caleston' >> ~/.profile    # login-shell profile
source ~/.bashrc                               # reload without logging out
```

| Concept | Local variable | Exported (environment) variable |
|---|---|---|
| Syntax | `NAME=value` | `export NAME=value` |
| Visible to child processes? | No | Yes |
| Survives reboot? | Only if in a startup file | Only if in a startup file |

### The `PATH` variable

`PATH` is the colon-separated list of directories the shell searches for external commands.

```bash
echo $PATH                              # see the search directories
which python3                           # show which binary will run
which -a python3                        # show ALL matches in PATH order
command -v python3                      # POSIX-portable "which"
export PATH=$PATH:/opt/obs/bin          # add a directory (this session)
echo 'export PATH=$PATH:/opt/obs/bin' >> ~/.bashrc   # make it permanent
```

| Command | Explanation |
|---|---|
| `which <cmd>` | First match of `<cmd>` in `$PATH` |
| `which -a <cmd>` | All matches, in order |
| `command -v <cmd>` | Portable alternative; also resolves builtins/aliases |

### Customizing the prompt (`PS1`)

```bash
echo $PS1                                  # see the current prompt definition
PS1="ubuntu-server$ "                      # set a plain prompt (this session only)
PS1="[\d \t \u@\h:\w ] $ "                 # date, time, user@host, working dir
PS1='[\d]\u@\h:\w\$ '                      # e.g. [Wed Apr 22]bob@caleston-lp10:~$
echo 'PS1="[\u@\h \w]\$ "' >> ~/.bashrc    # make it permanent
```

| Escape | Expands to |
|---|---|
| `\u` | Username |
| `\h` | Hostname (short) |
| `\H` | Hostname (FQDN) |
| `\w` | Full current working directory |
| `\W` | Basename of the working directory |
| `\d` | Date (e.g. "Wed Apr 22") |
| `\t` | Time (24-hour HH:MM:SS) |
| `\$` | `#` if root, otherwise `$` |
| `\n` | Newline |

### Useful one-liners from the labs

```bash
# Find a user's home directory from /etc/passwd (field 6, ":" delimited)
grep bob /etc/passwd | cut -d ":" -f6

# The same, via the built-in variable
echo $HOME
```

### DevOps/SRE Practice Drills — Module 2

1. **Recreate a directory tree** without `cd`-ing around: `mkdir -p ~/lab/{app,logs,conf,backup}` then `ls -lR ~/lab`.
2. **Safe move/copy:** copy `/etc/hostname` to `~/lab/backup/`, rename it `hostname.bak`, then copy it back with `-p` to preserve timestamps. Verify with `ls -l --full-time`.
3. **Practice the directory stack:** `pushd /etc && pushd /var/log && dirs -v && popd && pwd`.
4. **Build a "what changed last" habit:** run `ls -ltr /etc` and `ls -ltrh /var/log` and read the bottom line.
5. **Make 3 permanent aliases** in `~/.bashrc`: `ll='ls -ltrh'`, `..='cd ..'`, `gs='git status'`, then `source ~/.bashrc`.
6. **PATH drill:** create `~/bin`, add a script `hello` (echo something), `chmod +x` it, add `~/bin` to PATH in `~/.bashrc`, and run `hello` from anywhere.
7. **Help drill:** without google, use `man -k`/`apropos` to find a command that reports free memory, then confirm with `whatis`.
8. **Customize your prompt** to show `user@host:path` and a timestamp, and make it permanent.
9. **History drill:** run a few commands, then re-run one with `!<n>`, and reuse the last argument with `!$`.
10. **Cleanup safely:** create junk files in `~/lab/tmp`, delete them with `rm -rI ~/lab/tmp` and observe the single confirmation prompt.

---

# Module 3 — Linux Core Concepts

## 3.1 The Linux Kernel

The kernel is the core program that sits between your applications and the hardware.

- **Monolithic** — the kernel itself handles CPU scheduling, memory management, and most core
  operations directly.
- **Modular** — it can be extended at runtime via **loadable kernel modules** (e.g. a driver
  for a USB device) without rebuilding the kernel.

**The kernel's 4 major responsibilities:**

1. **Memory Management** — allocating/freeing RAM.
2. **Process Management** — scheduling which process runs when.
3. **Device Drivers** — talking to hardware.
4. **System calls & Security** — the controlled gateway between user programs and the kernel.

### Kernel space vs user space

| Space | Contains | Example |
|---|---|---|
| **Kernel space** | Kernel code, kernel extensions, device drivers | the scheduler, a network driver |
| **User space** | Your apps & runtimes | C, Java, Python, Ruby, Docker containers |

User programs reach the kernel through **system calls** — e.g. opening `/etc/os-release`
or allocating memory triggers a syscall.

### `uname` — kernel / system information

```bash
uname            # just "Linux"
uname -r         # kernel RELEASE, e.g. 4.15.0-88-generic
uname -a         # ALL info: kernel, hostname, version, arch, OS
uname -m         # machine hardware (e.g. x86_64, aarch64)
uname -n         # network node hostname
uname -v         # kernel build version/date
uname -o         # operating system (GNU/Linux)
```

| Flag | Explanation |
|---|---|
| `-r` | Kernel release (the version number) |
| `-a` | Everything in one line |
| `-m` | Hardware architecture |
| `-n` | Hostname |
| `-v` | Kernel version (build string) |
| `-o` | Operating system name |

**Reading a kernel version `4.15.0-88-generic`:** `4` = kernel version, `15` = major revision,
`0` = minor/patch, `88-generic` = distro build/flavor.

### Kernel module commands (from the lab)

```bash
lsmod                     # list loaded kernel modules
sudo modprobe <module>    # load a module AND its dependencies (preferred)
sudo modprobe -r <module> # unload a module and unused deps
sudo insmod <file.ko>     # low-level: insert a single module file (no deps)
sudo rmmod <module>       # low-level: remove a module
modinfo <module>          # show details about a module
```

| Command | Explanation |
|---|---|
| `lsmod` | Show currently loaded modules and their use counts |
| `modprobe` | Smart loader — resolves dependencies (like apt vs dpkg) |
| `insmod` | Dumb loader — one `.ko` file, no dependency resolution |
| `rmmod` | Remove a module |
| `modinfo` | Print module metadata (author, params, deps) |

## 3.2 Working with Hardware

When you plug in a **USB disk**: a kernel-space driver detects the change and emits a
**uevent** → the user-space **`udev`** daemon receives it → `udev` dynamically creates the
device node under `/dev/` → the new disk appears as e.g. `/dev/sdb`.

### `dmesg` — kernel ring buffer messages

```bash
dmesg                  # all kernel messages since boot
dmesg | grep -i usb    # filter for USB-related messages
dmesg -T               # human-readable timestamps
dmesg -w               # follow/wait for new messages live
dmesg -l err,warn      # only error and warning level messages
dmesg -H               # human-friendly paged output with colors
sudo dmesg             # may require root on hardened systems
```

| Flag | Explanation |
|---|---|
| `-T` | Show human-readable timestamps |
| `-w` | Wait — keep printing new messages as they arrive |
| `-l <levels>` | Filter by log level (`emerg,alert,crit,err,warn,notice,info,debug`) |
| `-H` | Human output (pager + relative time + color) |
| `-x` | Decode facility and level as text |

### `udevadm` — query/monitor the udev database

```bash
udevadm info --query=path --name=/dev/sda5   # the sysfs path of a device
udevadm info --query=all --name=/dev/sda     # all properties of a device
udevadm monitor                              # live-print uevents (plug/unplug a device to see)
udevadm trigger                              # re-emit events (re-apply rules)
```

| Argument | Explanation |
|---|---|
| `info --query=path` | Print the kernel device path |
| `info --query=all` | Print every property udev knows |
| `monitor` | Listen for live add/remove events (great for "which device did I just plug in?") |
| `trigger` | Replay events to re-apply rules |

### Listing hardware

```bash
lspci              # all PCI devices (NICs, GPUs, RAID controllers, wireless)
lspci -v           # verbose details
lspci -nn          # show vendor:device numeric IDs (useful for driver lookups)

lsblk              # block devices (disks/partitions) as a tree
lsblk -f           # include filesystem type, label, UUID, mountpoint
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT   # choose specific columns

lscpu              # CPU architecture, cores, sockets, caches, virtualization
lscpu | grep -i virtual              # is virtualization supported/enabled?

lsmem --summary    # memory blocks summary (online/offline RAM)
free -m            # used/free memory in MB
free -h            # used/free memory human-readable
free -g            # in GB
free -s 2          # refresh every 2 seconds

lshw               # extremely detailed full hardware inventory
sudo lshw          # run as root for complete info
sudo lshw -short   # condensed one-line-per-device table
sudo lshw -C network   # only a class of hardware (e.g. network)

lsusb              # USB devices
lsscsi             # SCSI devices
```

| Command | What it lists |
|---|---|
| `lspci` | PCI devices (network/graphics/storage controllers) |
| `lsblk` | Block storage devices and partitions |
| `lscpu` | CPU topology and features |
| `lsmem` | Memory blocks |
| `free` | Memory usage totals |
| `lshw` | Everything (run with sudo) |
| `lsusb` | USB devices |

> **Count physical cores:** `lscpu` → multiply **Core(s) per socket** × **Socket(s)**.

### `sudo` — run a command as root/another user

```bash
sudo lshw                 # run one command as root
sudo -i                   # start a full root login shell
sudo -s                   # start a root shell keeping your environment
sudo -u postgres psql     # run as a specific user (not root)
sudo -l                   # list what you're allowed to run via sudo
sudo !!                   # re-run the previous command with sudo
```

| Flag | Explanation |
|---|---|
| `-i` | Login shell as root (loads root's environment) |
| `-s` | Shell as root keeping current environment |
| `-u <user>` | Run as a specific user instead of root |
| `-l` | List your sudo privileges |
| `-k` | Forget the cached credentials (force re-prompt) |

## 3.3 The Boot Sequence

Four stages:

1. **BIOS/UEFI POST** — *Power On Self Test* checks the hardware. If it fails, boot stops.
2. **Boot Loader (GRUB2)** — loaded from the first sector of the boot disk (`/boot`). Shows the
   boot menu, then loads the **kernel** into memory and hands over control.
3. **Kernel Initialization** — kernel decompresses, initializes hardware & memory management,
   then looks for the **init** process.
4. **INIT Process** — on modern distros this is **systemd**, which mounts filesystems and starts
   all services to bring the system to a usable state.

> Old systems used **SysV init** (e.g. RHEL/CentOS 6). systemd's advantage: it **parallelizes**
> service startup, reducing boot time.

```bash
ls -l /sbin/init          # if it points to /lib/systemd/systemd, you're on systemd
```

## 3.4 Run Levels / systemd Targets

Modes the system can run in:

| Old runlevel | systemd target | Meaning |
|---|---|---|
| 3 | `multi-user.target` | Full multi-user, **no GUI** (typical server) |
| 5 | `graphical.target` | Multi-user **with GUI** |
| 0 | `poweroff.target` | Halt |
| 6 | `reboot.target` | Reboot |
| 1 | `rescue.target` | Single-user / maintenance |

```bash
runlevel                                   # show previous and current runlevel
systemctl get-default                      # current default target
sudo systemctl set-default multi-user.target   # boot to CLI by default (no GUI)
sudo systemctl set-default graphical.target    # boot to GUI by default
sudo systemctl isolate multi-user.target   # switch target NOW without reboot
```

> `get-default` reads `/etc/systemd/system/default.target` (a symlink to the chosen target).

## 3.5 File Types

**Everything in Linux is a file** — even directories and devices. Three top-level types:

1. **Regular file** (`-`) — text, binaries, images.
2. **Directory** (`d`) — a special file listing other files.
3. **Special files**, sub-divided into:
   - **Character device** (`c`) — `/dev` devices read char-by-char (keyboard, mouse, tty).
   - **Block device** (`b`) — `/dev` devices read in blocks (hard disks, RAM).
   - **Link** (`l`) — hard links and soft/symbolic links.
   - **Socket** (`s`) — inter-process communication endpoint.
   - **Named pipe / FIFO** (`p`) — connects one process's output to another's input.

### Identifying file types

```bash
file /home/michael          # describes what a file actually is
file script.sh              # e.g. "Bourne-Again shell script, ASCII text"
file insync1000.sock        # e.g. "socket"
file -b name.txt            # brief: type only, no filename
file -i name.txt            # MIME type (e.g. text/plain)

ls -l file                  # first char of perms shows type (- d l c b s p)
ls -ld /home/michael        # show the directory entry itself
```

| Command | Explanation |
|---|---|
| `file` | Inspects content/magic bytes to determine type |
| `file -b` | Brief output (omit filename) |
| `file -i` | Print MIME type |
| `ls -l` | First permission char encodes the file type |

### Links — hard vs soft

```bash
ln target.txt hardlink.txt        # HARD link: another name for the same inode/data
ln -s /opt/app/current symlink    # SOFT/symbolic link: a pointer to a path
ls -li                            # hard links share the same inode number
readlink -f symlink               # resolve a symlink to its absolute target
```

| Link type | Behaviour |
|---|---|
| **Hard link** (`ln`) | Second name to the *same data*; survives deleting the original; can't cross filesystems or link directories |
| **Soft/symlink** (`ln -s`) | A pointer to a *path*; breaks if the target is removed; can cross filesystems and link directories |

## 3.6 Filesystem Hierarchy

Linux uses a single-rooted, inverted tree starting at `/`.

| Directory | Purpose |
|---|---|
| `/` | Root of everything |
| `/home` | Home directories for normal users (`/home/bob`) |
| `/root` | The **root** user's home directory |
| `/opt` | Optional / third-party software (install your IDE, vendor apps here) |
| `/mnt` | Temporary manual mount point (empty by default) |
| `/media` | Auto-mount point for removable media (USB, CD) |
| `/tmp` | Temporary files (often wiped on reboot) |
| `/dev` | Device files (block & character) — what `lsblk` shows |
| `/bin` | Essential user binaries (`cp`, `mv`, `mkdir`, `ls`) |
| `/sbin` | Essential system/admin binaries |
| `/etc` | System-wide configuration files |
| `/lib`, `/lib64` | Shared libraries needed by binaries |
| `/usr` | User-land applications and their data (modern usage) |
| `/var` | Variable data: logs (`/var/log`), mail, spool, caches |
| `/proc` | Virtual FS exposing kernel/process info |
| `/sys` | Virtual FS exposing devices/kernel objects |
| `/boot` | Kernel, initramfs, GRUB bootloader files |

### `df` — disk free / mounted filesystems

```bash
df -h          # human-readable sizes of all mounted filesystems
df -hP         # human-readable + POSIX format (clean single-line rows)
df -hT         # also show the filesystem TYPE column
df -i          # show inode usage instead of block usage
df -h /var     # just the filesystem holding /var
```

| Flag | Explanation |
|---|---|
| `-h` | Human-readable (K/M/G) |
| `-P` | POSIX output (avoids wrapping long device names) |
| `-T` | Show filesystem type |
| `-i` | Report inodes instead of bytes (catches "disk full" caused by too many small files) |

### DevOps/SRE Practice Drills — Module 3

1. **Fingerprint a box you've never seen:** run `uname -a`, `lscpu`, `free -h`, `lsblk -f`, `df -hT` and write a 5-line summary of its specs.
2. **Boot health:** `dmesg -T --level=err,warn` — are there any hardware/driver errors at boot?
3. **Hot-plug detective:** start `udevadm monitor`, plug/unplug a USB stick (or `multipass mount`), and identify the new `/dev/sdX`.
4. **Targets:** check `systemctl get-default`; set it to `multi-user.target`, reboot the VM, confirm there's no GUI, then set it back.
5. **File-type quiz:** run `file` on `/etc/passwd`, `/bin/ls`, `/dev/sda`, `/dev/null`, `/run/*.sock`, and `~` — predict the type first.
6. **Links:** create a file, make a hard link and a symlink to it, `ls -li` to compare inodes, delete the original, and observe which link still works.
7. **Capacity alert practice:** run `df -h` and `df -i`; find the fullest filesystem; then `du -sh /var/log/*` to find the biggest log (preview of Module 5).
8. **Module spotting:** `lsmod | head`, pick one, run `modinfo <name>` and read what it does.

---

# Module 4 — Package Management

## 4.1 Concepts

A **package** is a compressed archive containing a program's binaries, config, and **metadata**
(including a **dependency manifest**). A **package manager** automates installing, upgrading,
configuring, and removing packages **and resolves dependencies** for you.

**Two big families:**

| Family | Low-level tool | High-level tool | Package ext | Distros |
|---|---|---|---|---|
| **Debian** | `dpkg` | `apt` / `apt-get` | `.deb` | Ubuntu, Debian, Mint, PureOS |
| **Red Hat** | `rpm` | `yum` / `dnf` | `.rpm` | RHEL, CentOS, Fedora, Rocky, Alma |

**Low-level vs high-level:** `dpkg`/`rpm` install a single local file but **do not resolve
dependencies**. `apt`/`yum` sit on top, pull from **repositories**, and handle dependencies.

- RHEL = paid, supported, enterprise. CentOS = community rebuild of RHEL (free).
- Repo config: YUM → `/etc/yum.repos.d/*.repo`; APT → `/etc/apt/sources.list` (+ `/etc/apt/sources.list.d/`).

## 4.2 RPM (Red Hat Package Manager) — low level

Five modes: **Install, Uninstall, Upgrade, Query, Verify.** Does **not** resolve dependencies.

```bash
sudo rpm -ivh firefox-68.6.0.x86_64.rpm   # install (verbose, hash progress)
sudo rpm -Uvh package.rpm                 # upgrade (or install if absent)
sudo rpm -e firefox                       # erase/uninstall
rpm -qa                                   # query: list ALL installed packages
rpm -qa | grep wget                       # find a package's exact name
rpm -qi wget                              # query info about a package
rpm -ql wget                              # list files a package installed
rpm -qf /usr/bin/wget                     # which package owns this file
rpm -V wget                               # verify a package's files
```

| Flag | Explanation |
|---|---|
| `-i` | Install |
| `-v` | Verbose |
| `-h` | Print hash marks as a progress bar |
| `-U` | Upgrade (install if not present) |
| `-e` | Erase (uninstall) |
| `-q` | Query mode |
| `-a` | All (with `-q`: all installed packages) |
| `-i` (with `-q`) | Package information |
| `-l` (with `-q`) | List files in the package |
| `-f` (with `-q`) | Find which package owns a file |
| `-V` | Verify installed files against the package database |

## 4.3 YUM (and its successor DNF) — high level

Resolves dependencies automatically; pulls from repos in `/etc/yum.repos.d/`.

```bash
yum repolist                  # list configured repositories
yum provides scp              # which package provides a command/file
yum search nginx              # search packages by keyword
yum info httpd                # details about a package
sudo yum install httpd        # install (prompts y/n)
sudo yum install -y httpd     # install, auto-answer yes
sudo yum remove httpd         # uninstall
sudo yum update telnet        # update one package
sudo yum update               # update ALL packages
sudo yum check-update         # list available updates (no changes)
sudo yum history              # transaction history (and undo)
yum list installed            # list installed packages
```

| Command / flag | Explanation |
|---|---|
| `repolist` | Show enabled repositories |
| `provides <x>` | Find which package provides a file/command |
| `search <kw>` | Search by keyword |
| `install` | Install a package + dependencies |
| `-y` | Assume "yes" to all prompts (scripts/automation) |
| `remove` | Uninstall |
| `update [pkg]` | Update one package, or all if omitted |
| `check-update` | Show what would update |
| `history` | View/undo past transactions |

> On modern RHEL/Fedora, **`dnf`** replaces `yum` with the same syntax (`dnf install ...`).

## 4.4 DPKG — Debian low level

Modes: Install, Uninstall, Upgrade, List, Status, Verify. Does **not** resolve dependencies.

```bash
sudo dpkg -i firefox.deb      # install a local .deb (may fail on missing deps)
sudo dpkg -r firefox          # remove (keep config files)
sudo dpkg -P firefox          # purge (remove + config files)
dpkg -l                       # list all installed packages
dpkg -l | grep nginx          # is nginx installed?
dpkg -L nginx                 # list files installed by a package
dpkg -S /usr/bin/nano         # which package owns a file
dpkg -s nginx                 # status/details of an installed package
sudo apt -f install           # fix broken dependencies after a dpkg install
```

| Flag | Explanation |
|---|---|
| `-i` | Install a local `.deb` |
| `-r` | Remove (keep configs) |
| `-P` | Purge (remove configs too) |
| `-l` | List installed packages |
| `-L <pkg>` | List files a package installed |
| `-S <file>` | Search which package owns a file |
| `-s <pkg>` | Show package status/details |

## 4.5 APT / APT-GET — Debian high level

Front-ends over `dpkg` that pull from repos in `/etc/apt/sources.list`. **`apt`** is the
modern, user-friendly tool (progress bar, unified search); **`apt-get`** is older/scriptable.

```bash
sudo apt update                  # refresh the package index (do this first!)
sudo apt upgrade                 # install available upgrades
sudo apt full-upgrade            # upgrade, removing packages if needed
sudo apt install telnet          # install a package + dependencies
sudo apt install -y nginx        # install, auto-yes
sudo apt remove telnet           # uninstall (keep config)
sudo apt purge telnet            # uninstall + config
sudo apt autoremove              # remove orphaned dependencies
apt search chromium-browser      # search the repos
apt show nginx                   # package details
apt list --installed             # list installed packages
apt list --upgradable            # what can be upgraded
sudo apt edit-sources            # edit /etc/apt/sources.list safely
```

| Command / flag | Explanation |
|---|---|
| `update` | Refresh the local package index from repos (no installs) |
| `upgrade` | Install newer versions of installed packages |
| `full-upgrade` | Upgrade even if some packages must be removed |
| `install` | Install package(s) + dependencies |
| `-y` | Assume yes (automation) |
| `remove` | Uninstall, keep config |
| `purge` | Uninstall + delete config |
| `autoremove` | Clean up unused dependencies |
| `search <kw>` | Search package names/descriptions |
| `show <pkg>` | Show details |

**APT vs APT-GET:**

| | `apt` | `apt-get` |
|---|---|---|
| Audience | Humans (interactive) | Scripts (stable interface) |
| Output | Pretty, progress bar | Plain |
| Search | `apt search` (built in) | needs `apt-cache search` |

> In CI/scripts prefer `apt-get` (its CLI is guaranteed stable); interactively prefer `apt`.

### DevOps/SRE Practice Drills — Module 4

1. **Index + upgrade hygiene:** on Ubuntu run `sudo apt update` then `apt list --upgradable`; on RHEL run `sudo yum check-update`. Read before you upgrade.
2. **Install & verify a tool:** install `tree` (or `htop`), confirm with `which tree`, then `dpkg -L tree` / `rpm -ql tree` to see what it dropped on disk.
3. **"What provides this?":** find which package provides `netstat`/`ss` using `apt search` / `yum provides`.
4. **Ownership lookup:** pick a binary in `/usr/bin`, find its owning package with `dpkg -S` or `rpm -qf`.
5. **Simulate a broken dep:** `sudo dpkg -i` a `.deb` that needs deps, watch it fail, then fix with `sudo apt -f install`.
6. **Clean up:** run `sudo apt autoremove` (or `yum autoremove`) and review what it wants to delete before confirming.
7. **Repo awareness:** `cat /etc/apt/sources.list` or `ls /etc/yum.repos.d/` and identify your sources.
8. **Idempotent install line:** write the one-liner you'd put in automation: `sudo apt-get update && sudo apt-get install -y nginx`.

---

# Module 5 — Working with the Shell — Part II

## 5.1 Viewing file/directory sizes

### `du` — disk usage (per file/directory)

```bash
du -sh test.img         # total size, human-readable (the everyday form)
du -sk test.img         # total size in kilobytes
du -sh *                # size of each item in the current directory
du -h --max-depth=1 /var   # one level deep — find the heavy subdirectories
du -sh /var/log/*       # size of each log
du -ah /etc | sort -rh | head   # biggest files under /etc
du -ch *.log            # per-file sizes + a grand total
du -x -sh /             # don't cross filesystem boundaries
```

| Flag | Explanation |
|---|---|
| `-s` | Summary — one total per argument (don't list every sub-file) |
| `-h` | Human-readable units |
| `-k` | Sizes in kilobytes |
| `-a` | Include files, not just directories |
| `-c` | Print a grand total |
| `--max-depth=N` | Only summarize N levels deep |
| `-x` | Stay on one filesystem |

> **`du` vs `df`:** `du` measures *what files take up*; `df` measures *what the filesystem
> reports free*. They can disagree when a deleted file is still held open by a process.

```bash
ls -lh test.img         # quick single-file size via long listing
```

## 5.2 Archiving with `tar`

`tar` ("tape archive") groups many files/dirs into one **tarball**. It can also compress.

```bash
tar -cf test.tar file1 file2 file3      # CREATE an archive (no compression)
tar -tf test.tar                         # LIST contents without extracting
tar -xf test.tar                         # EXTRACT into current directory
tar -xf test.tar -C /tmp/restore         # extract into a specific directory
tar -czf test.tar.gz mydir/              # create + gzip compress (.tar.gz)
tar -xzf test.tar.gz                      # extract a gzip tarball
tar -cjf test.tar.bz2 mydir/             # create + bzip2 compress (.tar.bz2)
tar -cJf test.tar.xz mydir/              # create + xz compress (.tar.xz)
tar -czvf test.tar.gz mydir/             # add -v to see each file as it's added
tar -czf bak.tar.gz --exclude='*.log' d/ # exclude a pattern
```

| Flag | Explanation |
|---|---|
| `-c` | Create a new archive |
| `-x` | Extract from an archive |
| `-t` | List the contents |
| `-f <file>` | Use this archive filename (**always needed**) |
| `-v` | Verbose — list files as processed |
| `-z` | Filter through **gzip** (`.gz`) |
| `-j` | Filter through **bzip2** (`.bz2`) |
| `-J` | Filter through **xz** (`.xz`) |
| `-C <dir>` | Change to `<dir>` before extracting/archiving |
| `--exclude=<pat>` | Skip matching files |

> Mnemonics: **c**reate, e**x**tract, lis**t**; always add **f** for the file. "Compress with z
> for g**z**ip". `tar -xzf file.tar.gz` is the one you'll type most.

## 5.3 Compression of single files

| Tool | Compress | Decompress | Read without extracting | Extension |
|---|---|---|---|---|
| gzip | `gzip f` | `gunzip f.gz` | `zcat f.gz` | `.gz` |
| bzip2 | `bzip2 f` | `bunzip2 f.bz2` | `bzcat f.bz2` | `.bz2` |
| xz | `xz f` | `unxz f.xz` | `xzcat f.xz` | `.xz` |

```bash
gzip test1.img         # replaces test1.img with test1.img.gz
gzip -k test1.img      # keep the original too (-k)
gzip -9 test1.img      # max compression (1=fast .. 9=best)
gunzip test1.img.gz    # decompress

bzip2 test.img         # better ratio, slower than gzip
bunzip2 test.img.bz2

xz test2.img           # best ratio, slowest
unxz test2.img.xz

zcat hostfile.txt.gz   # read a .gz without decompressing it
zcat /usr/share/man/man1/tail.1.gz | head -1   # peek inside compressed files
```

| Flag (gzip/bzip2/xz) | Explanation |
|---|---|
| `-k` | Keep the original file |
| `-d` | Decompress (same as the `gunzip`/`bunzip2`/`unxz` aliases) |
| `-1`..`-9` | Compression level (speed vs ratio) |
| `-v` | Verbose (show ratio) |

> Speed vs size, roughly: **gzip** fastest/largest, **bzip2** middle, **xz** slowest/smallest.

## 5.4 Finding files & searching text

### `locate` — fast filename search (from a database)

```bash
locate City.txt          # instant search using the mlocate DB
locate -i city.txt       # case-insensitive
locate -c passwd         # just count the matches
sudo updatedb            # rebuild the database (needed for new/recent files)
```

| Flag | Explanation |
|---|---|
| `-i` | Ignore case |
| `-c` | Print only the count of matches |
| `-n N` | Limit to N results |

> `locate` is fast but **stale** — it only knows what was in the DB at the last `updatedb`.

### `find` — live, powerful filesystem search

```bash
find /home/michael -name City.txt        # by exact name under a path
find . -iname "*.log"                     # case-insensitive name pattern
find / -name caleston-code 2>/dev/null    # search whole FS, hide permission errors
find /var/log -type f -name "*.log"       # only regular files
find /tmp -type d -empty                  # empty directories
find . -size +100M                        # files larger than 100 MB
find /var/log -mtime -1                   # modified in the last 24 hours
find /var/log -mmin -15                   # modified in the last 15 minutes
find . -name "*.tmp" -delete              # delete matches (destructive)
find . -type f -exec grep -l 'DATABASES' {} \;   # run a command per match
find /opt -type f -perm 0777              # find world-writable files
find /home -user bob                      # files owned by a user
```

| Expression | Explanation |
|---|---|
| `-name` / `-iname` | Match filename (case-sensitive / insensitive) |
| `-type f\|d\|l` | Restrict to file / directory / symlink |
| `-size +100M` / `-100k` | Bigger than / smaller than a size |
| `-mtime -N` / `+N` | Modified less than / more than N days ago |
| `-mmin -N` | Modified less than N minutes ago |
| `-empty` | Empty files/directories |
| `-perm <mode>` | Match permission bits |
| `-user` / `-group` | Match owner / group |
| `-delete` | Delete matches (test first without it!) |
| `-exec <cmd> {} \;` | Run a command for each match (`{}` = the file) |

### `grep` — search text inside files

```bash
grep second sample.txt              # lines containing "second" (case-sensitive)
grep -i capital sample.txt          # case-insensitive
grep -r "third Line" /home/michael  # recursive through a directory tree
grep -v "printed" sample.txt        # invert: lines that DON'T match
grep -w exam examples.txt           # match the whole word only
grep -vw exam examples.txt          # combine: NOT the whole word "exam"
grep -n error app.log               # show line numbers
grep -c error app.log               # count matching lines
grep -l error *.log                 # just the filenames that match
grep -A1 Arsenal table.txt          # 1 line AFTER each match
grep -B1 4 table.txt                # 1 line BEFORE each match
grep -A1 -B1 Chelsea table.txt      # 1 line before AND after (context)
grep -C2 error app.log              # 2 lines of context both sides
grep -E "error|fail|warn" app.log   # extended regex (alternation)
grep -o "ip=[0-9.]*" app.log        # print only the matched part
grep -ir 172.16.238.197 /etc/       # recursive + case-insensitive (find an IP in configs)
```

| Flag | Explanation |
|---|---|
| `-i` | Ignore case |
| `-r` / `-R` | Recurse into directories |
| `-v` | Invert match (non-matching lines) |
| `-w` | Match whole words only |
| `-n` | Prefix each line with its line number |
| `-c` | Print only the count of matching lines |
| `-l` | Print only names of files with a match |
| `-o` | Print only the matched text, not the whole line |
| `-A N` | Show N lines **after** each match |
| `-B N` | Show N lines **before** each match |
| `-C N` | Show N lines of context on **both** sides |
| `-E` | Extended regex (`grep -E` = `egrep`) |

> `grep` is case-sensitive by default. The trio `grep -rn`, `grep -i`, and `grep -C` cover most
> log investigations.

## 5.5 I/O Redirection & pipes

Every command has three streams:

| Stream | Number | Purpose |
|---|---|---|
| **STDIN** | 0 | Standard input |
| **STDOUT** | 1 | Normal output |
| **STDERR** | 2 | Error output |

```bash
echo $SHELL > shell.txt          # redirect STDOUT to a file (OVERWRITE)
echo $SHELL >> shell.txt         # redirect STDOUT to a file (APPEND)
cat missing 2> error.txt         # redirect STDERR (overwrite)
cat missing 2>> error.txt        # redirect STDERR (append)
cat missing 2> /dev/null         # discard errors (the "black hole")
command > out.txt 2>&1           # send STDOUT and STDERR to the same file
command &> out.txt               # bash shorthand for the line above
command < input.txt              # feed a file as STDIN
sort < names.txt > sorted.txt    # input and output redirection together
```

| Operator | Meaning |
|---|---|
| `>` | Redirect STDOUT, overwrite |
| `>>` | Redirect STDOUT, append |
| `2>` | Redirect STDERR, overwrite |
| `2>>` | Redirect STDERR, append |
| `2>&1` | Redirect STDERR to wherever STDOUT goes |
| `&>` | Redirect both STDOUT and STDERR (bash) |
| `<` | Take STDIN from a file |
| `/dev/null` | Discard whatever is written to it |

### Pipes `|` — chain commands

```bash
grep Hello sample.txt | less          # page a command's output
ps aux | grep nginx                    # filter a process list
cat access.log | grep 500 | wc -l      # count HTTP 500s
dmesg | grep -i error | tail -20       # last 20 kernel errors
zcat tail.1.gz | head -1               # decompress + take first line
```

### `tee` — write to a file **and** the screen

```bash
echo $SHELL | tee shell.txt            # print AND save
echo "line" | tee -a shell.txt         # append (-a) instead of overwrite
command | tee out.txt | grep error     # save full output, keep filtering
ls -l | sudo tee /root/listing.txt     # write to a root-owned file via sudo
```

| Flag | Explanation |
|---|---|
| `-a` | Append to the file(s) instead of overwriting |

> `tee` is the trick for writing to a root-owned file in a pipeline:
> `echo "..." | sudo tee -a /etc/somefile` (because `sudo >` redirects as your user, not root).

## 5.6 The `vi` / `vim` editor

`vi` is on every Linux box. `vim` ("vi improved") is the usual symlink target today.

```bash
vi sample.txt        # open (or create) a file
vim sample.txt
```

**Three modes:**

| Mode | How to enter | What you do |
|---|---|---|
| **Command** | Default on open; `Esc` returns here | Navigate, delete, copy, paste |
| **Insert** | `i`, `I`, `a`, `A`, `o`, `O` | Type text |
| **Last-line** | `:` from command mode | Save, quit, search/replace |

**Entering insert mode:**

| Key | Where it inserts |
|---|---|
| `i` | Before the cursor |
| `I` | At the start of the line |
| `a` | After the cursor |
| `A` | At the end of the line |
| `o` | Open a new line below |
| `O` | Open a new line above |

**Command-mode editing:**

| Key | Action |
|---|---|
| `x` | Delete the character under the cursor |
| `dd` | Delete (cut) the whole line |
| `yy` | Yank (copy) the line |
| `p` / `P` | Paste after / before |
| `u` | Undo |
| `Ctrl+r` | Redo |
| `/text` | Search forward for "text" |
| `?text` | Search backward |
| `n` / `N` | Next / previous search match |
| `gg` / `G` | Go to first / last line |
| `:n` | Go to line number n |

**Last-line (`:`) commands:**

| Command | Action |
|---|---|
| `:w` | Write (save) |
| `:w!` | Force-write |
| `:q` | Quit |
| `:q!` | Quit, discard changes |
| `:wq` or `:x` | Save and quit |
| `:set number` | Show line numbers |
| `:%s/old/new/g` | Replace all "old" with "new" in the file |

> **Survival sequence if you're stuck:** press `Esc`, then type `:q!` and Enter to exit
> without saving.

### DevOps/SRE Practice Drills — Module 5

1. **Find the disk hog:** `du -h --max-depth=1 /var | sort -rh | head` then drill into the biggest dir. Confirm against `df -h`.
2. **Back up a config dir:** `sudo tar -czvf /tmp/etc-$(date +%F).tar.gz /etc/ssh` then list it with `tar -tzf` and extract one file with `-C`.
3. **Log triage:** in `/var/log/syslog` (or `journalctl > /tmp/j.log`), run `grep -i error`, add `-n`, then `-C2`, then `-c` to count.
4. **Find recently changed files:** `sudo find /etc -mmin -60` and `find /var/log -type f -mtime -1` — "what changed in the last hour/day?".
5. **Find + act:** `find /tmp -name "*.tmp" -mtime +7` to list old temp files, then add `-delete` (in a VM!).
6. **Redirect like an SRE:** run a flaky command and capture everything: `mycmd > /tmp/out.log 2>&1`; then separate streams into two files.
7. **`tee` to root file:** append a line to a root-owned file using `echo ... | sudo tee -a`.
8. **Compression bake-off:** copy a big log three times; compress with gzip/bzip2/xz and compare sizes with `ls -lh`.
9. **`vi` muscle memory:** open a file, change a port number, delete a line with `dd`, undo with `u`, save with `:wq`. Then do a global replace with `:%s/8080/9090/g`.
10. **Pipe chain:** count unique IPs in a web log: `awk '{print $1}' access.log | sort | uniq -c | sort -rn | head`.

---

# Module 6 — Security & File Permissions

## 6.1 Linux accounts

User and group information lives in plain-text control files under `/etc` (readable by all,
editable only by root).

| File | Contents | Format |
|---|---|---|
| `/etc/passwd` | User accounts | `USERNAME:x:UID:GID:GECOS:HOMEDIR:SHELL` |
| `/etc/shadow` | Encrypted passwords + aging | `USERNAME:PASSWORD:LASTCHANGE:MIN:MAX:WARN:INACTIVE:EXPIRE` |
| `/etc/group` | Groups | `GROUPNAME:x:GID:MEMBERS` |
| `/etc/sudoers` | Who may use `sudo` | edited with `visudo` |

```bash
cat /etc/passwd                 # all users
grep -i ^bob /etc/passwd        # one user's account line
sudo grep bob /etc/shadow       # one user's password/aging line (root only)
grep -i ^bob /etc/group         # groups + members
id michael                      # uid, gid, and all group memberships
id -u                           # just the numeric user id
id -gn                          # primary group name
who                             # who is logged in right now
who -a                          # detailed who, including boot time
w                               # who + what they're running
last                            # login history + reboots
last reboot                     # just reboot history
whoami                          # the current effective username
```

| Field in `/etc/passwd` | Meaning |
|---|---|
| `USERNAME` | Login name |
| `x` | Password placeholder (real hash is in `/etc/shadow`) |
| `UID` | Numeric user ID (0 = root) |
| `GID` | Primary group ID |
| `GECOS` | Comment/full name |
| `HOMEDIR` | Home directory |
| `SHELL` | Login shell (e.g. `/bin/bash`, or `/usr/sbin/nologin` to forbid login) |

## 6.2 Switching users & escalating

```bash
su -                       # become root with root's full environment (needs root pw)
su - bob                   # become bob with bob's environment
su -c "whoami"             # run a single command as root (not recommended)
sudo command               # run one command as root (recommended, uses YOUR pw)
sudo -i                    # interactive root shell
sudo -u postgres psql      # run as another user
```

| Form | Notes |
|---|---|
| `su -` | Full switch; requires the **target** account's password |
| `sudo` | Per-command escalation; requires **your** password; audited; granular via `/etc/sudoers` |

> Disable direct root login by setting root's shell to `/usr/sbin/nologin` in `/etc/passwd`,
> and grant admins `sudo` instead. Always edit sudoers with **`sudo visudo`** (it validates syntax).

## 6.3 User & group management

```bash
sudo useradd bob                         # create a user (minimal)
sudo useradd -m -s /bin/bash bob         # create with home dir + bash shell
sudo useradd -u 1009 -g 1009 -d /home/robert -s /bin/bash -c "Mercury member" bob
sudo passwd bob                          # set/change bob's password
sudo usermod -aG sudo bob                # add bob to the sudo group (append!)
sudo usermod -L bob                      # lock the account
sudo usermod -U bob                      # unlock
sudo usermod -s /usr/sbin/nologin bob    # disable interactive login
sudo userdel bob                         # delete the user (keep home)
sudo userdel -r bob                      # delete the user AND home directory
sudo groupadd -g 1011 developer          # create a group
sudo groupdel developer                  # delete a group
groups bob                               # show bob's groups
```

| `useradd` flag | Explanation |
|---|---|
| `-m` | Create the home directory |
| `-u <uid>` | Set a specific UID |
| `-g <gid/group>` | Set the primary group |
| `-G <grps>` | Supplementary groups (comma-separated) |
| `-d <dir>` | Set the home directory path |
| `-s <shell>` | Set the login shell |
| `-c "<text>"` | Comment/full name (GECOS) |

| `usermod` flag | Explanation |
|---|---|
| `-aG <grp>` | **Append** to supplementary groups (omit `-a` and you *replace* them — dangerous) |
| `-L` / `-U` | Lock / unlock the password |
| `-s <shell>` | Change login shell |
| `-d <dir> -m` | Change (and move) home directory |

> **Most common mistake:** `usermod -G sudo bob` (without `-a`) removes bob from all his other
> groups. Always use `-aG`.

## 6.4 File permissions

Long listing decodes as: `type | owner(rwx) | group(rwx) | others(rwx)`.

```
-  rwx  r-x  r--
│   │    │    └─ others: read only
│   │    └────── group: read + execute
│   └─────────── owner: read + write + execute
└─────────────── file type ( - file, d dir, l link )
```

| Bit | On a file | On a directory |
|---|---|---|
| `r` (4) | Read contents | List the directory's entries |
| `w` (2) | Modify contents | Create/delete files within |
| `x` (1) | Execute it | Enter/traverse (`cd`) into it |

### `chmod` — change mode (permissions)

**Symbolic form** (`who` `+/-/=` `perms`; who = `u`ser, `g`roup, `o`thers, `a`ll):

```bash
chmod u+rwx file              # give owner read+write+execute
chmod ugo+r-x file            # all three: add read, remove execute
chmod o-rwx file             # remove all access for others
chmod u+rwx,g+r-x,o-rwx file  # combine multiple clauses
chmod a+x script.sh           # make executable for everyone
chmod -R g+w project/         # recursive: apply to a whole tree
```

**Numeric (octal) form** (sum r=4, w=2, x=1 per group):

```bash
chmod 777 file     # rwx rwx rwx — everyone full (rarely appropriate!)
chmod 755 file     # rwx r-x r-x — owner full, others read+exec (binaries/dirs)
chmod 750 file     # rwx r-x --- owner full, group read+exec, others none
chmod 660 file     # rw- rw- --- owner+group read/write, others none
chmod 644 file     # rw- r-- r-- owner write, others read (typical config/data)
chmod 600 file     # rw- --- --- owner only (secrets, private keys)
chmod 400 key.pem  # r-- --- --- read-only owner (SSH private key)
```

| Octal | Symbolic | Common use |
|---|---|---|
| `644` | `rw-r--r--` | Regular files/configs |
| `600` | `rw-------` | Secrets, credentials |
| `400` | `r--------` | SSH private keys |
| `755` | `rwxr-xr-x` | Executables and directories |
| `750` | `rwxr-x---` | Group-shared executables |
| `700` | `rwx------` | Private directories (`~/.ssh`) |

| `chmod` flag | Explanation |
|---|---|
| `-R` | Recursive (apply through directories) |
| `-v` | Verbose — report each change |
| `--reference=F` | Copy permissions from file F |

### `chown` / `chgrp` — change ownership

```bash
chown bob file               # change owner only
chown bob:developer file     # change owner AND group
chown :developer file        # change group only (note leading colon)
chown -R mercury /opt/app    # recursive ownership change (deployments!)
chgrp android file           # change only the group
chown --reference=a.txt b.txt   # copy ownership from another file
```

| Flag | Explanation |
|---|---|
| `-R` | Recurse into directories |
| `-v` | Verbose |
| `--reference=F` | Copy owner/group from file F |

## 6.5 SSH & SCP

### `ssh` — secure remote login

```bash
ssh devapp01                        # connect using your current username
ssh bob@devapp01                    # connect as a specific user
ssh -l bob devapp01                 # same, using -l for the login name
ssh -p 2222 bob@host                # non-default port
ssh -i ~/.ssh/id_rsa bob@host       # use a specific private key
ssh -v bob@host                     # verbose (debug connection problems)
ssh bob@host 'df -h'                # run a single remote command and exit
ssh -L 8080:localhost:80 bob@host   # local port-forward (tunnel)
ssh -J jump@bastion bob@private     # jump through a bastion host
```

| Flag | Explanation |
|---|---|
| `-l <user>` | Login user (alternative to `user@host`) |
| `-p <port>` | Connect to a non-standard SSH port |
| `-i <keyfile>` | Identity file (private key) to authenticate with |
| `-v` / `-vvv` | Verbose / very verbose debugging |
| `-L` | Local port forwarding (tunnel a remote service to your machine) |
| `-J <host>` | Jump/proxy through a bastion |

### Password-less (key-based) auth

```bash
ssh-keygen -t rsa                   # generate a key pair (RSA)
ssh-keygen -t ed25519 -C "me@lap"   # modern, recommended key type + comment
ssh-copy-id bob@devapp01            # install your PUBLIC key on the server
ssh devapp01                        # now logs in with no password
cat ~/.ssh/authorized_keys          # public keys allowed to log into THIS account
```

| File | Role |
|---|---|
| `~/.ssh/id_rsa` (or `id_ed25519`) | **Private** key — never share, keep `chmod 600` |
| `~/.ssh/id_rsa.pub` | **Public** key — safe to copy to servers |
| `~/.ssh/authorized_keys` | On the server: public keys allowed to log in |

| `ssh-keygen` flag | Explanation |
|---|---|
| `-t <type>` | Key type (`rsa`, `ed25519`, `ecdsa`) |
| `-b <bits>` | Key size (e.g. `-b 4096` for RSA) |
| `-C "<comment>"` | Label the key (often your email/host) |
| `-f <file>` | Output filename |

### `scp` — secure copy over SSH

```bash
scp file.tar.gz devapp01:/home/bob          # local -> remote
scp file.tar.gz devapp01:~/                  # remote home dir
scp devapp01:/var/log/app.log .              # remote -> local
scp -r media/ devapp01:/home/bob             # copy a directory recursively
scp -p file devapp01:~/                       # preserve timestamps/modes
scp -P 2222 file bob@host:~/                  # non-default port (capital P!)
scp -i key.pem file bob@host:~/               # specific identity key
```

| Flag | Explanation |
|---|---|
| `-r` | Recursive (copy directories) |
| `-p` | Preserve modification times and modes |
| `-P <port>` | Port (note: **capital** P, unlike ssh's `-p`) |
| `-i <key>` | Identity (private key) file |

> Modern alternative worth knowing: **`rsync -avz src/ host:dst/`** is faster for repeated
> syncs (only transfers changes) and is the SRE workhorse for moving data.

## 6.6 Firewalls with `iptables`

iptables filters packets using **tables → chains → rules**.

**FILTER table** (default) chains:
- `INPUT` — packets destined for this host.
- `FORWARD` — packets routed through this host.
- `OUTPUT` — packets generated by this host.

**NAT table** chains: `PREROUTING`, `OUTPUT`, `POSTROUTING`.

```bash
sudo apt install iptables                 # install (Ubuntu)
sudo iptables -L                          # list rules (FILTER table)
sudo iptables -L --line-numbers           # list with rule numbers (for deletion)
sudo iptables -L -n -v                    # numeric + packet/byte counters

# Allow inbound SSH (22) and HTTP (80) from one IP
sudo iptables -A INPUT -p tcp -s 172.16.238.187 --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp -s 172.16.238.187 --dport 80 -j ACCEPT

# Allow multiple ports at once
sudo iptables -A INPUT -p tcp -m multiport --dports 22,80,443 -j ACCEPT

# Drop everything else inbound (a default-deny rule)
sudo iptables -A INPUT -j DROP

# Block outbound HTTP
sudo iptables -A OUTPUT -p tcp --dport 80 -j DROP

# Allow HTTPS out to a specific host (insert at TOP with -I so it wins)
sudo iptables -I OUTPUT -p tcp -d google.com --dport 443 -j ACCEPT

# Delete a rule by its number
sudo iptables -D INPUT 3

# Block ICMP (ping) on eth0
sudo iptables -A INPUT -p icmp -i eth0 -j DROP

# Block a MAC address
sudo iptables -A INPUT -m mac --mac-source 0e:aa:bb:cc:00:de -j DROP
```

| Flag | Explanation |
|---|---|
| `-L` | List rules |
| `-A <chain>` | Append a rule to the end of a chain |
| `-I <chain> [n]` | Insert a rule at the top (or position n) |
| `-D <chain> <n>` | Delete rule number n |
| `-p <proto>` | Protocol (`tcp`, `udp`, `icmp`) |
| `-s <ip>` | Source address |
| `-d <host>` | Destination address |
| `--dport <port>` | Destination port |
| `--sport <port>` | Source port |
| `-i <iface>` | Input interface |
| `-j <target>` | Jump target: `ACCEPT`, `DROP`, `REJECT` |
| `-m multiport` | Match module for multiple ports |
| `-m mac --mac-source` | Match by MAC address |
| `--line-numbers` | Show rule numbers when listing |

**DROP vs REJECT:**

| Target | Behaviour |
|---|---|
| `DROP` | Silently discards the packet — sender just times out (looks "dead") |
| `REJECT` | Discards but sends back an error — sender learns the connection was refused |

> Rule **order matters** — rules are evaluated top to bottom; the first match wins. A `DROP all`
> at the top would block everything below it. On modern distros you'll often use `ufw`
> (`sudo ufw allow 22/tcp`) or `firewalld` as friendlier front-ends to the same machinery.

## 6.7 Scheduling with cron

`cron` runs jobs on a schedule; the schedule lives in a **crontab**.

**Field layout:**

```
┌── minute (0-59)
│ ┌── hour (0-23)
│ │ ┌── day of month (1-31)
│ │ │ ┌── month (1-12)
│ │ │ │ ┌── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *  command-to-run
```

```bash
crontab -e         # edit YOUR crontab
crontab -l         # list YOUR crontab
crontab -r         # remove your crontab (careful!)
sudo crontab -e -u bob   # edit another user's crontab
```

| Command | Explanation |
|---|---|
| `crontab -e` | Edit the current user's schedule |
| `crontab -l` | List the schedule |
| `crontab -r` | Remove the schedule |
| `-u <user>` | Operate on another user's crontab (root) |

**Special characters & strings:**

| Symbol/string | Meaning |
|---|---|
| `*` | Every value |
| `,` | List (e.g. `1,15,30`) |
| `-` | Range (e.g. `1-5`) |
| `/` | Step (e.g. `*/30` = every 30) |
| `@reboot` | Run once at startup |
| `@daily` / `@midnight` | Once a day |
| `@hourly` | Once an hour |
| `@weekly` / `@monthly` / `@yearly` | As named |

**Examples:**

```
*/30 * * * *    every 30 minutes
0 * * * *       every hour, on the hour
0 0 * * 0       midnight every Sunday
0 0 15 * *      midnight on the 15th of each month
0 0 1 1 *       midnight on January 1st (yearly)
@reboot         at every boot
0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1   # nightly backup at 02:00
```

> Cron has a **minimal environment** (tiny `$PATH`, no aliases). Use **absolute paths** in cron
> commands and redirect output to a log so failures aren't silent.

### DevOps/SRE Practice Drills — Module 6

1. **Account audit:** list all human users (`awk -F: '$3>=1000 {print $1}' /etc/passwd`), check who can sudo (`getent group sudo`), and find accounts with a real shell.
2. **Create a service-style user:** `sudo useradd -r -s /usr/sbin/nologin appsvc`, confirm it can't log in, and inspect its `/etc/passwd` line.
3. **Group collaboration:** create group `devs`, add two users with `usermod -aG`, create a shared dir `chmod 2770` owned by `:devs`, and verify both can write.
4. **Permission repair:** create a "secret" file, `chmod 600` it, then a script and `chmod 755` it; verify with `ls -l`. Recursively fix ownership of a fake app dir with `chown -R`.
5. **Key-based SSH end to end:** `ssh-keygen -t ed25519`, `ssh-copy-id` to another VM (or `localhost`), then log in with no password and disable password auth mentally.
6. **Move data three ways:** copy a tarball to another host with `scp`, then with `rsync -avz`, and compare speed on a second run.
7. **Firewall basics (in a VM):** allow 22 and 80, set a default `INPUT` DROP, verify you can still SSH, then list with `iptables -L --line-numbers` and delete a rule by number.
8. **DROP vs REJECT:** block a port with DROP, test with `nc`/`telnet` (hangs), switch to REJECT (instant refusal), and note the difference.
9. **Cron a real task:** schedule a script every 5 minutes that appends `date` + `df -h /` to a log; watch the log grow; then switch it to `@reboot`.
10. **Cron debugging:** intentionally use a bare command name (no path) so it fails, read the failure, and fix it with an absolute path + output redirection.

---

# Module 7 — Networking

## 7.1 DNS & name resolution

DNS maps names → IP addresses so you don't hard-code IPs everywhere. Resolution order and
sources are controlled by a few files.

| File | Role |
|---|---|
| `/etc/hosts` | Static, local name→IP overrides (checked before DNS if configured) |
| `/etc/resolv.conf` | The DNS server(s) to query (`nameserver 8.8.8.8`) |
| `/etc/nsswitch.conf` | The **order** of lookup sources (`hosts: files dns`) |

```bash
cat /etc/hosts                      # local static mappings
cat /etc/resolv.conf                # configured nameservers
grep hosts /etc/nsswitch.conf       # "files dns" = check /etc/hosts, then DNS

# Add a static mapping (root)
echo "192.168.1.11 db" | sudo tee -a /etc/hosts
ping db                             # now "db" resolves locally
```

### `ping` — reachability test (ICMP)

```bash
ping 192.168.1.11        # ping forever (Ctrl+C to stop) — Linux default
ping -c 4 192.168.1.11   # send only 4 packets then stop
ping -i 2 host           # 2-second interval between pings
ping -W 1 host           # wait at most 1s for each reply
ping -s 1400 host        # set packet size (test MTU/fragmentation)
ping6 ipv6host           # ping over IPv6
```

| Flag | Explanation |
|---|---|
| `-c <n>` | Send n packets then stop |
| `-i <sec>` | Interval between packets |
| `-W <sec>` | Per-reply timeout |
| `-s <bytes>` | Payload size |

> `ping` proves L3 reachability. If ping works but the app doesn't, the problem is higher up
> (port/service/firewall), not the network path.

### `nslookup` and `dig` — query DNS

```bash
nslookup www.google.com            # simple name -> IP lookup
nslookup caleston-repo-01          # resolve an internal host
nslookup google.com 8.8.8.8        # query a specific DNS server

dig www.google.com                 # detailed query (ANSWER section has the records)
dig +short www.google.com          # just the IP(s) — script-friendly
dig google.com MX                  # query a specific record type
dig +trace google.com             # follow the resolution from the root servers
dig -x 8.8.8.8                     # reverse lookup (IP -> name)
```

| Tool / flag | Explanation |
|---|---|
| `nslookup` | Quick, interactive-friendly DNS lookup |
| `dig` | Detailed, scriptable; preferred by SREs |
| `dig +short` | Print only the answer (great in scripts) |
| `dig +trace` | Show the full delegation path |
| `dig -x <ip>` | Reverse DNS (PTR) lookup |

**Common DNS record types:**

| Record | Maps |
|---|---|
| `A` | Hostname → IPv4 |
| `AAAA` | Hostname → IPv6 |
| `CNAME` | Name → another name (alias) |
| `MX` | Domain → mail server |
| `TXT` | Arbitrary text (SPF, verification) |
| `NS` | Domain → authoritative name servers |

## 7.2 Switching, routing & interfaces (`ip`)

- **Switching** connects interfaces **within the same network**.
- **Routing** connects **different networks** together via a gateway/router.

```bash
ip link                             # list interfaces and their state (UP/DOWN)
ip link set dev eth0 up             # bring an interface up
ip link set dev eth0 down           # bring it down

ip addr                             # show IP addresses on all interfaces
ip -br addr                         # brief one-line-per-interface summary
ip addr add 192.168.1.10/24 dev eth0   # assign an IP to an interface
ip addr del 192.168.1.10/24 dev eth0   # remove an IP

ip route                            # show the routing table
ip route add 192.168.2.0/24 via 192.168.1.1   # add a route to another network
ip route add default via 192.168.1.1          # set the default gateway
ip route del 192.168.2.0/24         # delete a route
ip neigh                            # ARP table (IP <-> MAC neighbors)
```

| Command | Explanation |
|---|---|
| `ip link` | Layer-2 interfaces and their up/down state |
| `ip addr` | Layer-3 addresses assigned to interfaces |
| `ip -br addr` | Brief, scannable address summary |
| `ip route` | The routing table (where packets go) |
| `ip neigh` | ARP/neighbor cache |

> Old tools you'll still see: `ifconfig` (→ `ip addr`), `route` (→ `ip route`),
> `netstat` (→ `ss`), `arp` (→ `ip neigh`). Learn the `ip` family; it's the modern standard.
> Persist config in `/etc/network/interfaces` (Debian) or Netplan `/etc/netplan/*.yaml` (Ubuntu).

## 7.3 Troubleshooting connectivity (top-down playbook)

When "Bob can't reach the repo server", work the layers in order:

```bash
# 1. Is my interface up and do I have an IP?
ip link
ip -br addr

# 2. Can the name resolve to an IP?
nslookup caleston-repo-01
dig +short caleston-repo-01

# 3. Can I reach the host at L3?
ping -c 3 caleston-repo-01

# 4. Where do packets die along the path?
traceroute 192.168.2.5          # hop-by-hop path (install: traceroute)
tracepath 192.168.2.5           # similar, no root needed
mtr 192.168.2.5                 # live, continuous traceroute+ping (great tool)

# 5. Is the service actually listening on its port?
netstat -an | grep 80 | grep -i LISTEN     # legacy
ss -tlnp | grep :80                         # modern equivalent
ss -tulpn                                    # all listening TCP+UDP with PIDs

# 6. Can I open the specific port from here?
nc -zv caleston-repo-01 80      # netcat port test
curl -v http://caleston-repo-01 # full HTTP-level check
telnet caleston-repo-01 80      # old-school port test

# 7. Fix: bring the interface up if it was down
sudo ip link set dev enp1s0f1 up
```

### `netstat` / `ss` — sockets & ports

```bash
netstat -an | grep LISTEN       # all listening sockets (numeric)
netstat -tulpn                  # TCP/UDP listening + program (needs root for names)
ss -tulpn                       # the modern, faster replacement
ss -tlnp                        # TCP listening only, numeric, with process
ss -s                           # socket summary stats
ss -tan state established       # all established TCP connections
```

| Flag (netstat/ss) | Explanation |
|---|---|
| `-t` | TCP sockets |
| `-u` | UDP sockets |
| `-l` | Only listening sockets |
| `-n` | Numeric (don't resolve names/ports — faster) |
| `-p` | Show the owning process/PID (root) |
| `-a` | All sockets (listening + connected) |

### `traceroute` & friends

| Tool | Explanation |
|---|---|
| `traceroute <host>` | Lists each router (hop) to the destination; `* * *` = a hop not replying |
| `tracepath <host>` | Like traceroute without needing root |
| `mtr <host>` | Combines ping + traceroute, updates live — best for spotting flaky hops |

> **Mental model:** check **link → DNS → ping → path → port → application** in that order. Most
> outages are DNS, a down interface, a wrong route, or a service not listening / firewalled.

### DevOps/SRE Practice Drills — Module 7

1. **Map your network:** run `ip -br addr`, `ip route`, and `cat /etc/resolv.conf`; write down your IP, gateway, and DNS server.
2. **Static host entry:** add `127.0.0.1 myapp.local` to `/etc/hosts`, `ping myapp.local`, then remove it.
3. **DNS deep dive:** compare `dig +short github.com`, `dig github.com MX`, and `dig -x 1.1.1.1`. Then `dig +trace example.com` and watch the delegation.
4. **Listening ports inventory:** `ss -tulpn` — list every service listening and which process owns it. Identify anything unexpected.
5. **Port reachability:** start a quick server `python3 -m http.server 8000`, then from another shell/VM test it with `nc -zv localhost 8000` and `curl -v localhost:8000`.
6. **Break & fix:** `sudo ip link set dev eth0 down`, observe loss with `ping`, then bring it back up (do this on a VM console, not over SSH!).
7. **Path analysis:** `traceroute 8.8.8.8` and `mtr 8.8.8.8`; identify the first external hop (your gateway).
8. **Full top-down drill:** pick an internal/external service that's "broken" and walk link→DNS→ping→port→curl, writing the conclusion at each step.

---

# Module 8 — Storage in Linux

## 8.1 Disks & partitions

- **Block devices** represent storage (disks, partitions, USB). They live under `/dev`.
- Disk naming: `sda`, `sdb`, ... (SCSI/SATA); partitions get numbers: `sda1`, `sda2`.
- **Major number** identifies the device type (8 = SCSI disk → `sd*`); **minor number**
  distinguishes individual devices.

```bash
lsblk                       # tree of disks and partitions (start here)
lsblk -f                    # + filesystem type, label, UUID, mountpoint
ls -l /dev/ | grep "^b"     # raw list of block device files (b = block)
sudo fdisk -l               # detailed partition info for all disks
sudo fdisk -l /dev/sda      # for one disk
```

**Partition types:**

| Type | Purpose |
|---|---|
| **Primary** | Bootable; up to 4 on MBR disks |
| **Extended** | A container that holds logical partitions; not usable directly |
| **Logical** | Created inside an extended partition |

### Creating partitions: `fdisk` vs `gdisk`

| Tool | Partition scheme |
|---|---|
| `fdisk` | MBR (older, ≤2 TB, max 4 primary) |
| `gdisk` | GPT (modern, huge disks, 128 partitions) |
| `parted` | Scriptable, handles both |

```bash
sudo gdisk /dev/sdb        # interactive GPT partition editor (destructive)
# Inside gdisk:  n = new partition,  p = print,  d = delete,  w = write & quit,  q = quit
sudo fdisk /dev/sdb        # interactive MBR editor
sudo partprobe /dev/sdb    # tell the kernel to re-read the partition table
```

**`gdisk` key commands:** `n` add partition, `p` print table, `d` delete, `t` change type,
`w` write changes (commits — **this overwrites!**), `q` quit without saving, `?` help.

## 8.2 Filesystems (EXT2 → EXT4)

A partition is just raw space until you put a **filesystem** on it (format it), then **mount**
it to a directory.

```bash
# 1. Create (format) a filesystem
sudo mkfs.ext4 /dev/sdb1        # make an ext4 filesystem
sudo mkfs.xfs /dev/sdb1         # xfs (common on RHEL)
mkfs.ext4 -L data /dev/sdb1     # set a volume label

# 2. Make a mount point and mount it
sudo mkdir -p /mnt/ext4
sudo mount /dev/sdb1 /mnt/ext4
sudo mount -t ext4 /dev/sdb1 /mnt/ext4   # explicitly state the type
sudo mount -o ro /dev/sdb1 /mnt/ext4     # mount read-only

# 3. Verify
mount | grep /dev/sdb1
df -hP | grep /dev/sdb1
lsblk -f

# 4. Unmount
sudo umount /mnt/ext4
```

| Command | Explanation |
|---|---|
| `mkfs.ext4 <dev>` | Create an ext4 filesystem on a device/partition |
| `mount <dev> <dir>` | Attach a filesystem to a directory |
| `mount -t <type>` | Force a filesystem type |
| `mount -o <opts>` | Mount options (`ro`, `rw`, `noexec`, `nosuid`) |
| `umount <dir|dev>` | Detach a filesystem |
| `blkid` | Show UUIDs/labels of block devices |

### Persistent mounts: `/etc/fstab`

Mounts done with `mount` vanish on reboot. To make them permanent, add a line to `/etc/fstab`.

```
# <file system>  <mount point>  <type>  <options>          <dump>  <pass>
/dev/sda1        /              ext4    defaults,relatime  0       1
UUID=xxxx-xxxx   /mnt/ext4      ext4    defaults           0       2
```

```bash
sudo blkid /dev/sdb1                                   # get the UUID (preferred over /dev name)
echo "/dev/sdb1 /mnt/ext4 ext4 defaults 0 0" | sudo tee -a /etc/fstab
sudo mount -a                                          # mount everything in fstab (test it!)
```

| fstab field | Meaning |
|---|---|
| file system | Device path or `UUID=` (UUID survives disk reordering) |
| mount point | Directory to mount onto |
| type | Filesystem type (`ext4`, `xfs`, `nfs`...) |
| options | `defaults`, `ro`, `noexec`, `nofail`... |
| dump | Backup flag for the legacy `dump` tool (usually `0`) |
| pass | `fsck` order at boot: `0` skip, `1` root, `2` others |

> **Always run `sudo mount -a` after editing fstab.** A bad fstab entry can prevent the system
> from booting — use the `nofail` option for non-critical mounts to avoid that.

## 8.3 External storage: DAS, NAS, SAN, NFS

| Type | What it is |
|---|---|
| **DAS** (Direct Attached Storage) | Storage attached directly to the host (local disk, USB) |
| **NAS** (Network Attached Storage) | File-level storage over the network (like NFS) |
| **SAN** (Storage Area Network) | Block-level storage over a high-speed fabric (often fiber channel) |

### NFS (file-level network sharing)

NFS shares **files** (not blocks) using a client/server model. The server exports directories
listed in `/etc/exports`.

```bash
# On the NFS server:
cat /etc/exports
# /software/repos 10.61.35.201 10.61.35.202 10.61.35.203
sudo exportfs -a                              # export everything in /etc/exports
sudo exportfs -o 10.61.35.201:/software/repos # export one dir to one client manually
sudo exportfs -v                              # list current exports

# On the NFS client:
sudo mount -t nfs server:/software/repos /mnt/repos
```

| Command | Explanation |
|---|---|
| `/etc/exports` | Defines which dirs are shared and to which clients |
| `exportfs -a` | Export all entries in `/etc/exports` |
| `exportfs -o` | Export a single directory to a client on the fly |
| `exportfs -v` | Show active exports |

## 8.4 LVM (Logical Volume Manager)

LVM adds a flexible layer over physical disks so you can resize storage without
repartitioning. Three layers:

```
Physical Volume (PV)  →  Volume Group (VG)  →  Logical Volume (LV)  →  filesystem  →  mount
   /dev/sdb               caleston_vg            vol1                    ext4         /mnt/vol1
```

```bash
sudo apt-get install lvm2              # install LVM tooling

# 1. Initialize a disk/partition as a Physical Volume
sudo pvcreate /dev/sdb
sudo pvdisplay                         # detailed PV info
sudo pvs                               # short PV summary

# 2. Create a Volume Group from one or more PVs
sudo vgcreate caleston_vg /dev/sdb
sudo vgdisplay
sudo vgs

# 3. Carve a Logical Volume out of the VG
sudo lvcreate -L 1G -n vol1 caleston_vg
sudo lvdisplay
sudo lvs

# 4. Put a filesystem on the LV and mount it
sudo mkfs.ext4 /dev/caleston_vg/vol1
sudo mkdir -p /mnt/vol1
sudo mount -t ext4 /dev/caleston_vg/vol1 /mnt/vol1

# 5. Grow it later (online), then grow the filesystem to match
sudo vgs                               # check free space in the VG
sudo lvresize -L +1G /dev/caleston_vg/vol1     # add 1 GB to the LV
sudo resize2fs /dev/caleston_vg/vol1           # grow the ext4 filesystem
df -hP /mnt/vol1                                # verify the new size
```

| Layer / command | Explanation |
|---|---|
| `pvcreate <dev>` | Mark a disk/partition as an LVM physical volume |
| `vgcreate <vg> <pv>` | Create a volume group from PVs |
| `lvcreate -L <size> -n <name> <vg>` | Create a logical volume |
| `pvs` / `vgs` / `lvs` | Quick summaries of PVs / VGs / LVs |
| `pvdisplay`/`vgdisplay`/`lvdisplay` | Detailed views |
| `lvresize -L +<size>` | Grow (or shrink) a logical volume |
| `vgextend <vg> <pv>` | Add another disk to a volume group |
| `resize2fs <lv>` | Grow an ext filesystem to fill the LV (use `xfs_growfs` for XFS) |

> **The killer LVM workflow:** disk filling up? Add a new disk → `pvcreate` → `vgextend` →
> `lvresize -L +50G` → `resize2fs`. No downtime, no repartitioning. This is why LVM exists.

### DevOps/SRE Practice Drills — Module 8

> Use a **real VM** and add a couple of extra virtual disks (e.g. VirtualBox "Add disk",
> `multipass` with `--disk`, or cloud block volumes). Containers won't work for these.

1. **Survey storage:** `lsblk -f`, `sudo fdisk -l`, `df -hT`, `blkid` — identify every disk, partition, filesystem, and what's mounted where.
2. **Partition a fresh disk:** on a spare `/dev/sdb`, create a GPT partition with `gdisk`, then `partprobe`, then confirm with `lsblk`.
3. **Format & mount:** `mkfs.ext4` the new partition, mount it to `/mnt/data`, write a test file, and `df -h` to confirm.
4. **Make it persistent:** get the UUID with `blkid`, add an fstab line with `nofail`, run `sudo mount -a`, then reboot and confirm it auto-mounts.
5. **Full LVM lifecycle:** `pvcreate` two disks → `vgcreate` → `lvcreate -L 2G` → format → mount.
6. **Grow on demand:** `vgextend` the VG with the second disk, `lvresize -L +1G`, `resize2fs`, and verify the bigger size with `df -h` — all while mounted.
7. **Inode vs space full:** create thousands of empty files until `df -i` shows full while `df -h` shows space free — understand the difference.
8. **NFS lab (two VMs):** export a dir from one VM via `/etc/exports` + `exportfs -a`, mount it on the other with `mount -t nfs`, and read/write across.
9. **Safe unmount practice:** try to `umount` a busy mount (cd into it first), see it fail with "target is busy", use `lsof +D /mnt/data` to find who's holding it, then unmount.

---

# Module 9 — Service Management with systemd

**systemd** is the init system and service manager used by virtually all modern distros (RHEL,
CentOS, Fedora, Ubuntu, Debian, Arch). It starts daemons on demand, manages mounts, provides
logging, and parallelizes boot.

## 9.1 Anatomy of a `.service` unit

A unit file (e.g. `/etc/systemd/system/project-mercury.service`) has three sections:

```ini
[Unit]
Description=Python Django for Project Mercury
Documentation=http://wiki.caleston-dev.ca/mercury
After=postgresql.service

[Service]
ExecStart=/usr/bin/project-mercury.sh
User=project_mercury
Restart=on-failure
RestartSec=10
WorkingDirectory=/opt/caleston-code/mercuryProject/

[Install]
WantedBy=multi-user.target
```

| Section | Purpose | Common keys |
|---|---|---|
| `[Unit]` | Metadata & ordering | `Description`, `Documentation`, `After=`, `Requires=`, `Wants=` |
| `[Service]` | How to run the process | `ExecStart=`, `ExecStop=`, `User=`, `Restart=`, `RestartSec=`, `Type=`, `Environment=`, `WorkingDirectory=` |
| `[Install]` | How it's enabled at boot | `WantedBy=` (usually `multi-user.target`) |

| Key | Explanation |
|---|---|
| `Description` | Human-readable name shown in `systemctl status` |
| `After=` | Start this unit *after* the listed units (ordering only) |
| `Requires=` | Hard dependency (if it fails, this fails) |
| `ExecStart=` | The command that launches the service (use **absolute paths**) |
| `User=` | Run the process as this (often non-root) user |
| `Restart=` | When to auto-restart: `no`, `on-failure`, `always`, `on-abnormal` |
| `RestartSec=` | Seconds to wait before restarting |
| `WantedBy=` | The target that pulls this in when enabled |

**After creating/editing a unit file:**

```bash
sudo systemctl daemon-reload                 # make systemd re-read unit files
sudo systemctl start project-mercury.service # start it now
sudo systemctl enable project-mercury        # start on boot (.service is optional)
```

## 9.2 `systemctl` — manage services & the system

```bash
# Lifecycle
sudo systemctl start docker        # start now
sudo systemctl stop docker         # stop now
sudo systemctl restart docker      # stop then start (brief downtime)
sudo systemctl reload docker       # re-read config WITHOUT dropping the service
sudo systemctl reload-or-restart docker   # reload if supported, else restart

# Boot behaviour
sudo systemctl enable docker       # start automatically at boot
sudo systemctl disable docker      # don't start at boot
sudo systemctl enable --now docker # enable AND start in one command
sudo systemctl is-enabled docker   # is it set to start at boot?

# Status & inspection
systemctl status docker            # state, recent logs, PID, memory
systemctl is-active docker         # just: active / inactive / failed
systemctl cat docker               # print the unit file (+ its path)
systemctl list-units               # all loaded ACTIVE units
systemctl list-units --all         # active + inactive + failed
systemctl list-units --type=service --state=running
systemctl --failed                 # only units that FAILED (incident triage!)
systemctl list-unit-files          # all installed units + enabled/disabled state

# Editing
sudo systemctl edit docker --full  # edit the full unit (applies immediately on save)
sudo systemctl edit docker         # create a drop-in override (partial)
sudo systemctl daemon-reload       # reload after manual file edits

# Targets (runlevels)
systemctl get-default                          # current default target
sudo systemctl set-default multi-user.target   # change the boot target
sudo systemctl isolate multi-user.target       # switch target right now

# Power
sudo systemctl reboot
sudo systemctl poweroff
```

| Command | Explanation |
|---|---|
| `start` / `stop` | Run / halt the service now |
| `restart` | Full stop + start (drops connections) |
| `reload` | Re-read config with no interruption (if the service supports it) |
| `enable` / `disable` | Toggle auto-start at boot |
| `enable --now` | Enable + start together |
| `status` | Detailed state + last log lines |
| `is-active` / `is-enabled` | Scriptable yes/no checks |
| `cat` | Show the unit file and its location |
| `list-units` | Currently loaded units |
| `--failed` | Show only failed units |
| `daemon-reload` | Reload unit files after editing them |

**Service states you'll see in `status`:**

| State | Meaning |
|---|---|
| `active (running)` | Running normally (a daemon with a process) |
| `active (exited)` | Ran once successfully and exited (one-shot) |
| `active (waiting)` | Running but waiting on an event |
| `inactive (dead)` | Stopped |
| `failed` | Crashed or exited with an error — investigate the logs |
| `enabled` / `disabled` | Will / won't start at boot |

> **Incident reflex:** `systemctl --failed` → `systemctl status <unit>` → `journalctl -u <unit> -e`.

## 9.3 `journalctl` — query systemd logs

systemd's `journald` collects logs from the kernel, services, and stdout/stderr of units.

```bash
journalctl                          # all logs, oldest first
journalctl -e                       # jump to the END (newest)
journalctl -r                       # reverse: newest first
journalctl -b                       # logs from the current boot only
journalctl -b -1                    # logs from the PREVIOUS boot
journalctl -k                       # kernel messages only (like dmesg)
journalctl -f                       # FOLLOW live (like tail -f) — essential
journalctl -u docker.service        # only one unit's logs
journalctl -u docker -f             # follow one unit live
journalctl -u docker --since "2022-01-01 13:45:00"   # since a timestamp
journalctl -u nginx --since "1 hour ago"             # relative time
journalctl --since today                              # since midnight
journalctl -p err                   # only error-priority and worse
journalctl -p warning..err          # a priority range
journalctl -n 50                    # last 50 lines
journalctl -u app -o json-pretty    # structured output for parsing
journalctl --disk-usage             # how much disk the journal uses
sudo journalctl --vacuum-time=7d    # delete journal entries older than 7 days
```

| Flag | Explanation |
|---|---|
| `-u <unit>` | Filter to a specific service/unit |
| `-f` | Follow (live tail) |
| `-e` | Jump to the most recent entries |
| `-r` | Reverse order (newest first) |
| `-b [N]` | Current boot (or boot N; `-1` = previous) |
| `-k` | Kernel messages only |
| `--since` / `--until` | Time window (absolute or "1 hour ago", "today") |
| `-p <prio>` | Priority filter (`emerg`..`debug`, or `err`, `warning`) |
| `-n <N>` | Show the last N lines |
| `-o <fmt>` | Output format (`short`, `json`, `json-pretty`, `cat`) |
| `--disk-usage` | Report journal size on disk |
| `--vacuum-time` / `--vacuum-size` | Prune old journal data |

> The everyday SRE combo: **`journalctl -u <service> -f`** to watch a service live, and
> **`journalctl -u <service> --since "10 min ago" -p err`** after a restart to confirm it's clean.

### DevOps/SRE Practice Drills — Module 9

1. **Status sweep:** run `systemctl --failed` and `systemctl list-units --type=service --state=running`; pick one service and read its full `systemctl status`.
2. **Lifecycle on a real service:** install nginx, then `enable --now`, `status`, `reload` after editing its config, and `restart`; observe the difference between reload and restart.
3. **Write your own unit:** create `/etc/systemd/system/hello.service` that runs a script printing the date to a log every start; `daemon-reload`, `enable --now`, and check `journalctl -u hello`.
4. **Auto-restart proof:** set `Restart=on-failure`, make the script `exit 1`, start it, and watch systemd retry in `journalctl -u hello -f`.
5. **Run-as-user:** add `User=` to your unit so it runs as a non-root account; verify with `systemctl status` (look at the PID's user) and `ps -u <user>`.
6. **Boot target:** check `get-default`, switch to `multi-user.target`, reboot the VM, confirm no GUI, switch back.
7. **Log forensics:** after restarting a service, run `journalctl -u <svc> --since "5 min ago"`; then `journalctl -p err -b` to see all errors this boot.
8. **Live tail an incident:** in one pane `journalctl -u nginx -f`, in another `curl` the server / stop it, and watch the log react in real time.
9. **Journal hygiene:** check `journalctl --disk-usage`, then `sudo journalctl --vacuum-time=2d` and confirm it shrank.

---

# Module 10 — Capstone — Troubleshooting a Real Deployment

This ties everything together: deploy a Django app on `devapp01` that talks to a PostgreSQL
database on `devdb01`, fix the breakage, and turn it into a managed systemd service. It exercises
**scp, ssh, tar, systemctl, netstat/ss, find, grep, vi, chown,** and **unit files** all at once.

### The end-to-end runbook

```bash
# 1. Copy the app bundle from the laptop to the web server
scp caleston-code.tar.gz devapp01:~/

# 2. On the web server, extract into /opt (root-owned, so sudo)
ssh devapp01
sudo tar -zxf caleston-code.tar.gz -C /opt
#    Goal: /opt/caleston-code/mercuryProject/ exists
ls -l /opt/caleston-code/mercuryProject/

# 3. Remove the tarball after extraction
rm caleston-code.tar.gz

# 4. Check the database server's service state
exit                # back to laptop
ssh devdb01
systemctl status postgresql.service     # likely: inactive (dead)

# 5. Allow the app to connect: append an auth rule, then start the DB
sudo vi /etc/postgresql/10/main/pg_hba.conf
#    add at the end:  host all all 0.0.0.0/0 md5
sudo systemctl start postgresql.service

# 6. Find the port postgres is actually listening on (note it!)
sudo netstat -ptean          # or: sudo ss -tlnp | grep postgres

# 7. Try to start the web app — watch it crash (wrong DB host/port)
exit                # back to laptop
ssh devapp01
cd /opt/caleston-code/mercuryProject
python3 manage.py runserver 0.0.0.0:8000     # stack trace -> Ctrl+C

# 8. Fix the app config: find the file with the DB settings
find . -type f -exec grep -l 'DATABASES = {' "{}" \;
vi ./mercury/settings.py
#    set host: localhost -> devdb01
#    set port: -> the real postgres port from step 6

# 9. Fix ownership of the whole app tree to the service account
sudo chown -R mercury /opt/caleston-code

# 10. Activate the virtualenv, run migrations, start the app
source ../venv/bin/activate
python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000     # should serve now -> Ctrl+C

# 11. Make it a proper systemd service
sudo vi /etc/systemd/system/mercury.service
```

```ini
[Unit]
Description=Project Mercury Web Application

[Service]
ExecStart=/usr/bin/python3 manage.py runserver 0.0.0.0:8000
Restart=on-failure
WorkingDirectory=/opt/caleston-code/mercuryProject/
User=mercury

[Install]
WantedBy=multi-user.target
```

```bash
# 12. Enable and start the managed service
sudo systemctl daemon-reload
sudo systemctl enable mercury
sudo systemctl start mercury
sudo systemctl status mercury
```

### What each failure taught us

| Symptom | Root cause | Fix | Tools |
|---|---|---|---|
| `/opt` extraction "permission denied" | `/opt` owned by root | `sudo tar -C /opt` | `tar`, `sudo` |
| DB unreachable | `postgresql` service `inactive (dead)` | `systemctl start postgresql` | `systemctl` |
| App can't connect | Wrong DB host (`localhost`) and wrong port | edit `settings.py` | `find`, `grep -l`, `vi`, `ss` |
| App can't read its files | Files owned by root, not `mercury` | `chown -R mercury` | `chown` |
| App dies on reboot | No service manager | create `mercury.service` | systemd unit, `systemctl` |

> **`venv` note:** a Python virtual environment isolates a project's packages so they don't
> pollute the system Python — common in DevOps. Activate with `source venv/bin/activate`.

### DevOps/SRE Practice Drills — Module 10 (Capstone)

1. **Recreate the topology:** spin up two VMs (`app` and `db`), set up `/etc/hosts` entries so they can reach each other by name, and configure key-based SSH between them.
2. **Ship an app:** `tar` up any small web app (or `python3 -m http.server`), `scp` it to `app`, extract under `/opt`, and fix ownership to a dedicated service user.
3. **Stand up a DB:** install PostgreSQL on `db`, start it, find its listening port with `ss -tlnp`, and confirm connectivity from `app` with `nc -zv db 5432`.
4. **Break it on purpose:** stop the DB and watch the app fail; diagnose using `systemctl status`, `journalctl -u`, and a `curl`/stack trace; then restore service.
5. **Config bug hunt:** hide a wrong host/port in a config file, then locate it with `find . -exec grep -l` and fix it in `vi`.
6. **Productionize:** write a `.service` unit for the app (`User=`, `Restart=on-failure`, `WorkingDirectory=`, `WantedBy=multi-user.target`), enable it, reboot, and confirm it comes back automatically.
7. **Firewall it:** allow only 22 and the app port inbound with iptables/ufw, verify the app still works, and confirm other ports are blocked with `nc`.
8. **Write the runbook:** document every command you used as a numbered runbook someone else could follow — this is the actual SRE deliverable.

---

# Appendix — Cheat Sheet & Daily Routine

## A. One-page command cheat sheet

**Navigation & files**

```bash
pwd                       # where am I
ls -ltrh                  # newest files at the bottom, human sizes
cd -                      # toggle to previous directory
mkdir -p a/b/c            # create nested dirs
cp -a src/ dst/           # copy preserving everything
mv -i a b                 # move/rename, prompt on overwrite
rm -rI dir/               # recursive delete, single confirm
find / -name f 2>/dev/null# search whole FS, hide errors
du -sh *                  # size of each item here
df -hT                    # filesystem usage + type
```

**Text & search**

```bash
grep -rin "error" /var/log     # recursive, case-insensitive, line numbers
grep -C2 pattern file          # 2 lines of context
less +F file                   # live tail inside less
sort | uniq -c | sort -rn      # top-N counter idiom
awk '{print $1}' f             # column extraction
sed -n '10,20p' f              # print a line range
```

**Processes & resources**

```bash
ps aux | grep proc        # find a process
top / htop                # live resource view
free -h                   # memory
uptime                    # load + how long up
kill -9 <pid>             # force-kill (last resort)
```

**Packages**

```bash
sudo apt update && sudo apt install -y <pkg>   # Debian/Ubuntu
sudo yum install -y <pkg>                        # RHEL/CentOS
dpkg -S /path/file ; rpm -qf /path/file          # who owns this file
```

**Permissions & users**

```bash
chmod 640 file ; chmod 755 script.sh ; chmod 600 key.pem
chown -R user:group dir/
sudo useradd -m -s /bin/bash bob ; sudo passwd bob
sudo usermod -aG sudo bob
id bob ; groups bob
```

**Networking**

```bash
ip -br addr ; ip route                # addresses + routes
dig +short host ; nslookup host       # DNS
ping -c3 host ; traceroute host ; mtr host
ss -tulpn                             # listening ports + process
nc -zv host port ; curl -v url        # port / HTTP test
```

**Storage & LVM**

```bash
lsblk -f ; blkid ; sudo fdisk -l
sudo mkfs.ext4 /dev/sdb1 ; sudo mount /dev/sdb1 /mnt
sudo mount -a                         # test fstab
pvcreate /dev/sdb ; vgcreate vg /dev/sdb ; lvcreate -L 5G -n lv vg
lvresize -L +5G /dev/vg/lv ; resize2fs /dev/vg/lv
```

**systemd & logs**

```bash
systemctl --failed
systemctl status <svc> ; sudo systemctl enable --now <svc>
sudo systemctl daemon-reload          # after editing a unit
journalctl -u <svc> -f                # live unit logs
journalctl -p err -b                  # this-boot errors
```

**SSH/SCP**

```bash
ssh user@host ; ssh -i key user@host ; ssh user@host 'uptime'
ssh-keygen -t ed25519 ; ssh-copy-id user@host
scp -r dir/ user@host:~/ ; rsync -avz dir/ user@host:~/dir/
```

## B. The "first 5 minutes on a strange server" checklist

```bash
hostnamectl                 # who/what is this box
uname -a                    # kernel & arch
cat /etc/os-release         # distro & version
uptime                      # load average & uptime
who                         # who else is on
df -hT                      # disk space (the #1 outage cause)
free -h                     # memory pressure
systemctl --failed          # anything broken?
ip -br addr ; ip route      # network identity
ss -tulpn                   # what's listening
journalctl -p err -b --no-pager | tail   # recent errors
```

## C. Suggested daily practice routine (15–30 min)

Run these in a disposable VM. Rotate focus so you cover everything in ~2 weeks.

| Day | Focus | Do this |
|---|---|---|
| Mon | Files & search | Recreate a dir tree, `find` + `grep` a needle, archive it with `tar -czf` |
| Tue | Permissions | Create users/groups, set `chmod`/`chown`, build a shared group dir |
| Wed | Processes & resources | `ps`, `top/htop`, kill a runaway process, read `free`/`uptime` |
| Thu | Networking | `ip`, `dig`, `ss -tulpn`, port-test a service with `nc`/`curl` |
| Fri | Storage | Partition + format + mount a disk, add an fstab entry, do a full LVM resize |
| Sat | systemd | Write a unit, `enable --now`, force a failure, read `journalctl` |
| Sun | Capstone | Deploy a small app across two VMs and turn it into a service |

**Weekly stretch goals:**

- Write one **bash script** that automates a task you did manually (backup, log rotation, health check).
- Schedule it with **cron** and verify it logs output.
- Break something on purpose, then fix it using only logs (`journalctl`, `/var/log`).
- Document a **runbook** for one task — clear enough for a teammate to follow.

## D. Beyond this course (natural next steps for DevOps/SRE)

- **Shell scripting**: variables, loops, conditionals, functions, `set -euo pipefail`.
- **Text power tools**: `awk`, `sed`, `cut`, `sort`, `uniq`, `xargs`, `jq` (JSON).
- **Process/perf**: `htop`, `iotop`, `vmstat`, `iostat`, `sar`, `lsof`, `strace`.
- **Modern firewall front-ends**: `ufw`, `firewalld`.
- **Config & infra as code**: Ansible, Terraform.
- **Containers & orchestration**: Docker, Kubernetes (everything here maps directly).
- **Observability**: Prometheus, Grafana, the ELK/Loki stack.

---

*Built from the KodeKloud Linux Basics Course notes, expanded with command varieties, full flag
references, and DevOps/SRE practice drills. Keep this file in your dotfiles repo and add your own
commands as you learn them.*

