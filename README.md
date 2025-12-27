# Hanoi Simulator

A web-based simulator designed to support teaching recursion
through the Tower of Hanoi problem.

## Simulator website

[Hanoi Simulator](https://akonno.github.io/hanoisimulator/) (GitHub Pages)

The simulator can be used directly in a web browser.
No installation is required.

## Intended audience

This simulator is intended primarily for **instructors teaching programming**,
especially when introducing the concept of **recursive calls**.

The Tower of Hanoi is a well-known puzzle that naturally lends itself
to recursive solutions. However, implementing a visual representation
of the puzzle often requires programming knowledge beyond recursion itself,
which can be a distraction for beginners.

Hanoi Simulator addresses this gap by providing a visual execution
environment for the puzzle.

## What this simulator does (and does not do)

- This simulator **does not solve the Tower of Hanoi puzzle by itself**.
- Instead, it **executes a sequence of move instructions provided by the user**
  and visualizes each step.
- If the instruction sequence contains errors, they are detected and reported.

In a typical classroom setting, students write a program that outputs
a sequence of instructions for moving the disks.
By pasting those instructions into the simulator, instructors and students
can visually verify whether the solution is correct.

For demonstration purposes, the simulator is preloaded with
a sample instruction sequence for the three-disk problem.

## Documentation

- **About**  
  Overview of the simulator design, educational intent, and basic concepts.  
  https://akonno.github.io/hanoisimulator/about.html

- **For instructors**  
  Teaching notes, classroom usage examples, and practical guidance for instructors.  
  https://akonno.github.io/hanoisimulator/for-instructors.html

## License

[MIT License](https://opensource.org/license/mit/)

## Credits

- Textures for the floor, disks, and pillars by
  [Lennart Demes at ambientCG](https://ambientcg.com/)
