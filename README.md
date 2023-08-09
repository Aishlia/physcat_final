# Comparison of Scipy Basinhopping to a D3 Physical Simulation With Springs
Global optimization is a very challenging process. This is highlighted when trying to optimize multi-variable functions with constraints that scale with the number of items being optimized.

## Goal of the optimization
There are n shapes on a 2d plane (n1, n2, n3, ...). Each shape contains m number of points (m0, m1, m2, m3, .....). The goal is to optimize the placement of the shapes such that they are not overlapping and the distance between the corresponding points on each shape are minimized (ie. distance between n1m0, n2m0, n3m0 are minimized). They are represented on graphs as the minimization between red point, blue points, green points, etc..

## Overview
Basinhopping is a stochastic global optimization method developed by David Wales and Jonathan Doye. It is an iterative algorithm where every cycle does the following:
1. Goes to a random perturbation of the coordinates.
2. Does local minimization.
3. Accepts of rejects the new coordinates base on the minimized function value.

In scipy, basinhopping is the replacement for the now deprecated simulated annealing that worked in similar ways.

## Setup
Two algorithms are compared on two fronts: least distance between points achieved and runtime. One algorithm is the basinhopping algorithm from [scipy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.basinhopping.html). The other is a simulation built by me that pulls corresponding points together with springs. Shapes in both algorithms are allowed to move on 3 axis of freedom (left/right, up/down, and rotation).

## Results of basinhopping.
Due to the limitations of runtime, the basinhopping algorithm is only allowed to iterate 100 times. This leads to an average runtime of approximately 8 minutes for 3 shapes with 2 points in each. The result of one test is shown below.

```
fun: 49770.17545011049
lowest_optimization_result: fun: 49770.17545011049
                            jac: array([ -358.35253906,   895.2890625 ,  6216.19873047, 20291.70654297,0.,0.])
message: 'Iteration limit reached'
nfev: 1016
nit: 100
njev: 100
status: 9
success: False
x: array([-1.53974410e+00,  1.04716901e+02,  1.06895558e+02,  5.53076908e+04,
                                                              1.35867820e+00,  5.32440702e-01])
message: ['requested number of basinhopping iterations completed successfully']
minimization_failures: 101
nfev: 94169
nit: 100
njev: 8841
x: array([-1.53974410e+00,  1.04716901e+02,  1.06895558e+02,  5.53076908e+04,
                                    1.35867820e+00,  5.32440702e-01])
```
![](/visual_src/basinhopping.png)

The parameters on the basinhopping call do not use a pre-specified starting temperature. Starting placement of the objects is also random. The only constrains on the function are that the objects must not be placed on top of each other. The function over which it is optimizing is the sum of the distances between the related points. Basinhopping uses SLSQP (sequential least squared programming) by default.


## Results of simulation
Average runtime of the simulation is 4.2 seconds with visualization. The simulation assumes the boxes have mass and inertia. The corresponding points on each shape are connected via "springs" with a k chosen by me. They are randomly placed around a 2d surface and let lose to collide with one another. They are solid objects so they cannot overlap. This was done in javascript originally to take advantage of the D3 library's prebuilt physics simulation; however, the use of D3 has been mostly removed. Javascript does allow for quick and easy visualization and less scalability run-time issues.

Here is a sample run with visualization. The runtime presented is slower than reality (I'm not sure how to make the gif go real-time).

One iteration involved placing the boxes in random locations and letting them be pulled until the system was stable.

![](https://i.imgur.com/pueItCy.gif)

The optimum distance achieved over 10 runs with random starting placement is 53309. I did notice that it would occasionally dip into the 4.... range, but it would jump out. I need to add an accept criteria to allow for such states. The runtime for 10 runs was under 1 second.

NOTE: The gif included is running an old version that does not allow for full rotation (only 90 degree). I could not get my screen recording to work on the computer that could run the full rotations. I don't know why it doesn't work with M1.

## Conclusion
The basinhopping run was able to achieve 49770 distance over 100 iterations at an average runtime of 5 seconds per iteration. The simulation was able to achieve 53309 over 10 iterations with an average runtime of .0001 seconds per iteration. The simulation was not allowed to run more than 10 iterations due to the crude starting placement algorithm that tended to cap after 10 iterations. A more intelligent starting placement and acceptance criteria would probably have resulted in better numbers. For this specific case, running a lightweight simulation is much kinder on runtime. I was only able to compare 3 shapes because the runtime of basinhopping would get to large. The simulation was able to easily scale to 100 shapes without much slowdown. The parameters of both the basinhopping algorithm and the simulation could be improved. With more delving into how each parameter of the basinhopping function works, I predict the runtime could be halved and the accuracy could be drastically improved. Likewise with the simulation.
