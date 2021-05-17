#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import matplotlib.pyplot as plt
from scipy.optimize import basinhopping
from shapely import affinity
from shapely import geometry as geom
import numpy as np
from time import time

# Make matplotlib interactive and set up persistent graph
LIVE = False
plt.ion()
fig = plt.figure()
ax = fig.add_subplot(111, aspect='equal')


class Point:
    def __init__(self, color, coordinates):
        """
        Parameters
        ----------
        color: String
        coordinates: (x, y)
        """
        self.color = color
        self.coordinates = coordinates


class Shape:  # limited to polygonal shapes
    """
    Basic 2d-shape build

    Attributes
    ----------
    nodes: A list of Points
    poly: A shapely polygon built with the passed vertices

    """
    def __init__(self, vertices, nodes):
        """
        Parameters
        ----------
        vertices: A sequence of (x, y) numeric coordinate pairs
        nodes: A sequence of (color, (x, y)) Points
        """
        self.nodes = []
        self.poly = geom.Polygon(vertices)
        for p in nodes:
            color = p[0]
            coordinates = p[1]
            self.nodes.append(Point(color, coordinates))

    def adjust_shape(self, coords):
        """
        Moves the shape to the place and rotation specified by the coords

        Parameters
        ----------
        coords: list of [x, y, theta] coordinates for all shapes

        Returns
        ----------
        adjusted_shape: Shape transformed and rotated using given coords
        """
        adjusted_shape = Shape(
            affinity.rotate(
                self.poly,
                coords[2],
                origin=(0, 0),
                use_radians=True
            ),
            []
        )

        adjusted_shape.poly = affinity.affine_transform(
            adjusted_shape.poly,
            [1, 0, 0, 1, coords[0], coords[1]]
        )

        # adjust nodes
        for j in self.nodes:
            color = j.color
            adjusted_x = (affinity.rotate(
                geom.Point(j.coordinates[0],
                           j.coordinates[1]),
                coords[2], origin=(0, 0),
                use_radians=True)).x + coords[0]
            adjusted_y = (affinity.rotate(
                geom.Point(j.coordinates[0],
                           j.coordinates[1]),
                coords[2], origin=(0, 0),
                use_radians=True)).y + coords[1]
            adjusted_shape.nodes.append(Point(color, (adjusted_x, adjusted_y)))

        return adjusted_shape

    def add_shape_plot(self, ax, coords, color):
        """
        Adds passed shape to the passed ax plot
        Returns the bounds of the object to assist with creating x & y limits
        of graph
        """
        shape = self.adjust_shape(coords)
        x, y = shape.poly.exterior.xy
        plt.plot(x, y, color=color, alpha=0.7, linewidth=3,
                solid_capstyle='round', zorder=2)

        for j in shape.nodes:
            x = j.coordinates[0]
            y = j.coordinates[1]
            ax.add_patch(plt.Circle(
                (x, y),
                radius=1,
                color=j.color
            ))

        return shape.poly.bounds


class Circle(Shape):
    def __init__(self, center, radius, nodes):
        """
        Generated coordinates for a polygonal approximation of a circle
        Uses those coordinates to create a Shape with passed nodes

        Parameters
        ----------
        center: (x, y) of the center of the circle
        radius: int
        nodes: A sequence of (color, (x, y)) Points
        """
        centerx, centery = center
        radius = radius
        start_angle, end_angle = 0, 360  # In degrees
        num_segments = 1000

        theta = np.radians(np.linspace(start_angle, end_angle, num_segments))
        x = centerx + radius * np.cos(theta)
        y = centery + radius * np.sin(theta)

        # self.poly = geom.MultiPoint(np.column_stack([x, y])).convex_hull
        Shape.__init__(self, geom.MultiPoint(np.column_stack([x, y])), nodes)


def unionize(shapes):
    """
    Unionizes shapes' polys and nodes

    Parameters
    ----------
    shapes: A list of shapes to be unionized

    Returns
    ----------
    total_union: A Shape that is the union of all of passed shapes
    """
    total_union = Shape(shapes[0].poly, [])

    total_union.poly = shapes[0].poly
    for i in shapes:
        total_union.poly = total_union.poly.union(i.poly)
        for j in i.nodes:
            total_union.nodes.append(j)

    return total_union


def evaluate_overlap(shapes, coords):
    """
    Parameters
    ----------
    shapes: List of shapes
    coords: List of [x, y, theta] for all shapes

    Returns
    ----------
    overlap: int The area of how much the shapes overlap
    """
    n = len(shapes)
    overlap = 0
    for i in range(0, n):
        for j in range(i, n):
            shape1 = shapes[i].adjust_shape(coords[i])
            shape2 = shapes[j].adjust_shape(coords[j])

            overlap += shape1.poly.intersection(shape2.poly).area

    return overlap


def evaluate_cost(shapes, coords):
    assert len(shapes) == len(coords)
    num_of_shapes = len(shapes)

    total_cost = 0

    # number of shapes to test
    for i in range(0, num_of_shapes):
        # testing each coordinates in the shape
        for j in range(0, len(shapes[i].nodes)):
            # testing each coordinates against all other shapes
            for k in range(j + 1, num_of_shapes):
                # testing each coordinates against all other shape's nodes
                for l in range(0, len(shapes[k].nodes)):
                    if shapes[i].nodes[j].color == shapes[k].nodes[l].color:
                        x = (affinity.rotate(
                            geom.Point(shapes[i].nodes[j].coordinates[0],
                                       shapes[i].nodes[j].coordinates[1]),
                            coords[i][2], origin=(0, 0), use_radians=True)).x + \
                            coords[i][0]
                        y = (affinity.rotate(
                            geom.Point(shapes[i].nodes[j].coordinates[0],
                                       shapes[i].nodes[j].coordinates[1]),
                            coords[i][2], origin=(0, 0), use_radians=True)).y + \
                            coords[i][1]
                        x1 = (affinity.rotate(
                            geom.Point(shapes[k].nodes[l].coordinates[0],
                                       shapes[k].nodes[l].coordinates[1]),
                            coords[k][2], origin=(0, 0), use_radians=True)).x + \
                             coords[k][0]
                        y1 = (affinity.rotate(
                            geom.Point(shapes[k].nodes[l].coordinates[0],
                                       shapes[k].nodes[l].coordinates[1]),
                            coords[k][2], origin=(0, 0), use_radians=True)).y + \
                             coords[k][1]
                        total_cost += (x - x1) ** 2 + (y - y1) ** 2

    return total_cost


def unpack(coords):
    n, r = divmod(len(coords), 3)
    assert r == 0

    return [[0, 0, 0]] + [
        (coords[i], coords[i + 1], coords[i + 2]) for i in range(n)
    ]


def solve(shapes):
    n = len(shapes)

    def objective_function(coords):
        assert len(coords) == (n - 1) * 3
        coords = unpack(coords)

        cost = evaluate_cost(shapes, coords)

        if LIVE:
            # print(coords, cost)
            plot(shapes, coords)

        return cost

    def constraint_function(coords):
        assert len(coords) == (n - 1) * 3
        coords = unpack(coords)

        return -evaluate_overlap(shapes, coords)

    # function will be bounded to search within "max_coords"
    max_coord = 0
    for i in shapes:
        max_coord += max(i.poly.bounds[2], i.poly.bounds[3])

    cons = ({'type': 'ineq',
             'fun': constraint_function})

    minimizer_kwargs = {"method": "SLSQP", "constraints": cons}

    sol = basinhopping(
        objective_function,
        np.random.rand((n - 1) * 3), # np.random.rand((n - 1) * 3) [0] * (n - 1) * 3
        niter=100,
        # T=100,
        minimizer_kwargs=minimizer_kwargs,
    )

    print(sol)

    return unpack(sol.x)


def print_plot(shapes, coords):
    n = len(shapes)

    colors = ['red', 'blue', 'green', 'puple', 'orange']

    ax.clear()

    for i in range(0, n):
        shapes[i].add_shape_plot(ax, coords[i], colors[i])

    fig.canvas.draw()


################################################################################
# # box1
# box1_vertices = [(0, 0), (40, 0), (40, 100), (0, 100)]
# box1_nodes = [('red', (38, 85)), ('blue', (38, 75)), ('purple', (5, 5))]
# box1 = Shape(box1_vertices, box1_nodes)
#
# # box2
# box2_vertices = [(0, 0), (40, 0), (40, 50), (0, 50)]
# box2_nodes = [('red', (38, 15)), ('blue', (38, 25)), ('green', (35, 45))]
# box2 = Shape(box2_vertices, box2_nodes)
#
# # circle1
# circle1_center = (0, 0)
# circle1_radius = 50
# circle1_nodes = [('purple', (-25, 25)), ('red', (0, 0)), ('green', (45, 0))]
# circle1 = Circle(circle1_center, circle1_radius, circle1_nodes)
#
# # union test
# s1 = Shape([(0, 0), (40, 0), (40, 90), (0, 90)],
#            [('red', (35, 70)), ('blue', (35, 80)), ('purple', (30, 80))])
# s2 = Circle((40, 90), 40, [('green', (45, 60))])
# s3 = Shape([(40, 90), (40, 140), (90, 140), (120, 115), (90, 90)],
#            [('red', (50, 100))])
# a = unionize([s1, s2, s3])
#
# example_input = [box1, box2]

################################################################################

b1_vertices = [(-50, -50), (50, -50), (50, 50), (-50, 50)]
b1_nodes = [('red', (30, 30)), ('blue', (30, -30))]
b1 = Shape(b1_vertices, b1_nodes)

b2_vertices = [(-50, -50), (50, -50), (50, 50), (-50, 50)]
b2_nodes = [('red', (30, -30)), ('blue', (30, 30))]
b2 = Shape(b2_vertices, b2_nodes)

b3_vertices = [(-50, -100), (50, -100), (50, 100), (-50, 100)]
b3_nodes = [('red', (5, 80)), ('blue', (30, -20))]
b3 = Shape(b3_vertices, b3_nodes)

b4_vertices = [(-50, -100), (50, -100), (50, 100), (-50, 100)]
b4_nodes = [('red', (30, -20)), ('blue', (5, 80))]
b4 = Shape(b4_vertices, b4_nodes)

example_input = [b1, b2, b3]

# prevents execution of following code during import
# (imported by other file)
if __name__ == '__main__':
    x = time()
    print("Start time %s" % x)
    optimum_coords = solve(example_input)
    print("end time: ", time() - x)
    print_plot(example_input, optimum_coords)
    x = input("hold")  # really inelegant way of holding the plot open
