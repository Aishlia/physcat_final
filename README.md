# Comparison of Scipy basinhopping with SLSQP to a physical simulation
Global optimization is a very challenging process. This is highlighted when trying to optimize multi-variable functions with constraints that scale with the number of items being optimized.

## Goal
There are n shapes on a 2d  (n1, n2, n3, ...). Each shape contains m number of points (m0, m1, m2, m3, .....). The goal is to optimize the placement of the shapes such that they are not overlapping and the distance between the corresponding points on each shape are minimized (ie. distance between n1m0, n2m0, n3m0 are minimized). They are represented on graphs as the minimization between red point, blue points, green points, etc..

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

The parameters on the basinhopping call do not use a pre-specified starting temperature. Starting placement of the objects is also random. The only constrains on the function are that the objects must not be placed on top of each other. The function over which it is optimizing is the sum of the distances between the related points.


## Results of simulation

![](https://i.imgur.com/pueItCy.gif)
