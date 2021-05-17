var A = {
    vertices: [ // assumed convex for now. In future allow multiple shapes
        {x: -50, y: -50},
        {x: 50,  y: -50},
        {x: 50,  y: 50},
        {x: -50, y: 50}
    ],
    nodes: [
        {x: 30, y: 30, color: 1},
        {x: 30, y: -30, color: 0},
    ]
};
var B = {
    vertices: [
        {x: -50, y: -50},
        {x: 50,  y: -50},
        {x: 50,  y: 50},
        {x: -50, y: 50}
    ],
    nodes: [
        {x: 30, y: 30, color: 0},
        {x: 30, y: -30, color: 1}
    ]
};
var C = {
    vertices: [
        {x: -50, y: -100},
        {x: 50,  y: -100},
        {x: 50,  y: 100},
        {x: -50, y: 100}
    ],
    nodes: [
        {x: 5, y: 80, color: 0},
        {x: 30, y: -20, color: 1}
    ]
};
var D = {
    vertices: [
        {x: -50, y: -100},
        {x: 50,  y: -100},
        {x: 50,  y: 100},
        {x: -50, y: 50}
    ],
    nodes: [
        {x: 5, y: 40, color: 1},
        {x: 30, y: -20, color: 0}
    ]
};
var shapes = [A, B, C];

////////////////////////////////////////////////////////////////////////////////
// Initialize data

var grouped_nodes = [];

var i, j, k, s, s2, n, n2, v, v2;
var nodes, vertices, color;
var sin, cos, threshold, overlap_x, overlap_y;

var dt = 0.005; // time step
var hooke = 1;  // hooke constant of springs
var damping_t = 4; // damping factor for translational motion
var damping_r = 3;  // damping factor for rotational motion
var repulsion_factor = 2; // multiplier for repulsive force due to overlap
var elasticity = 0; // elasticity of collisions

var damping_t_c = Math.pow(10, -dt * damping_t);
var damping_r_c = Math.pow(10, -dt * damping_r);

var iters = 0;
var cost;

var response = new SAT.Response();

// for each shape
for (i = 0; i < shapes.length; i++) {
    s = shapes[i];
    nodes = [];
    vertices = [];

    // for each node in the shape
    for (j = 0; j < s.nodes.length; j++) {

        // convert to SAT Vector
        n = s.nodes[j];
        color = n.color;
        n = new SAT.Vector(n.x, n.y);
        n.color = color;
        nodes[j] = n;

        if (grouped_nodes[n.color] == undefined) {
            grouped_nodes[n.color] = [];
        }

        n.number = grouped_nodes[n.color].length;

        n.s_index =  i;
        n.ax = n.x; // constant offset in shape's local coordinates
        n.ay = n.y;
        n.dx = n.x; // relative to shape's center in absolute coords
        n.dy = n.y;

        grouped_nodes[n.color][n.number] = n;
    }

    // for each vertex in the shape
    for (j = 0; j < s.vertices.length; j++) {

        // convert to SAT Vector
        v = s.vertices[j];
        v = new SAT.Vector(v.x, v.y);
        vertices[j] = v;

    }

    // convert s to SAT Polygon

    s = new SAT.Polygon(new SAT.Vector(), vertices);
    s.nodes = nodes;
    s.forces = new SAT.Vector(0, 0); // net x, y force vector
    s.torques = 0;                   // net counter-clockwise torque
    s.lin_p = new SAT.Vector(0, 0);  // linear momentum: x, y
    s.rot_p = 0;                     // counter-clockwise angular momentum

    s.m = 0.1; // mass
    s.I = 0;   // rotational inertia

    for (j = 0; j < s.nodes.length; j++) {
        n = s.nodes[j];
        s.I += s.m * (n.x ** 2 + n.y ** 2) / s.nodes.length;
    }

    // random placement
    s.pos.x += (Math.random() - 0.5) * window.innerWidth;
    s.pos.y += (Math.random() - 0.5) * window.innerHeight;
    s.setAngle(Math.random() * 2 * Math.PI);

    shapes[i] = s;
}

////////////////////////////////////////////////////////////////////////////////
console.log(shapes)
var svg = d3.select("body").append("svg")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight)
  .append("g")
    .attr("transform", "translate(" + window.innerWidth / 2 + ", " +
                                      window.innerHeight / 2 + ")");

console.log(svg);

var fill = d3.scaleOrdinal(d3.schemeCategory10);

function affine(s) {
	  return "translate(" +
        s.pos.x + ", " +
        s.pos.y + ") " +
        "rotate(" + (s.angle * 180 / Math.PI) + ")";
}

var shape = svg.selectAll('.shape').data(shapes)
.enter().append('g')
    .attr("class", "shape")
    .attr("transform", affine)
    // outline
    .append("polygon")
    .attr("points", function(s) {
        var out = "";
        for (i = 0; i < s.points.length; i++) {
            if (i > 0) {
                out += ", ";
            }
            out += s.points[i].x.toString() + "," +
                   s.points[i].y.toString();
        }
        return out;
    })
    .style("stroke", "black")
    .style("fill-opacity", "0.0")
    .select(function() {
        return this.parentNode;
    })

    // nodes
    .each(function(s) {
        var node = d3.select(this).selectAll(".node").data(s.nodes);
        node.enter().append("circle")
            .attr("cx", function(n) { return n.x; })
            .attr("cy", function(n) { return n.y; })
            .attr("r", 3)
            .attr("fill", function(n) { return fill(n.color); });
    });

console.log(shape);

function animate() {

    // do math
    // for simplicity, assume all shapes have
    // unit translational and rotational inertia
    ////////////////////////////////////////////////////////////////////////////

    cost = 0;

    // 1) update positions using last momenta:
    for (i = 0; i < shapes.length; i++) {
        s = shapes[i];

        // 1a) linear and angular momentum
        s.pos.x += s.lin_p.x / s.m * dt; // x
        s.pos.y += s.lin_p.y / s.m * dt; // y

        // 1b) updates positions of vertices as s.calcPoints
        s.setAngle(

            Math.floor((s.angle + (s.rot_p / s.I * dt)) / Math.PI * 4) * Math.PI / 4 // discretize to 30 degrees

        ); // theta

        cos = Math.cos(s.angle);
        sin = Math.sin(s.angle);

        // 1c) update positions of nodes
        for (j = 0; j < s.nodes.length; j++) {

            n = s.nodes[j];

            n.dx = cos * n.ax - sin * n.ay;
            n.dy = sin * n.ax + cos * n.ay;
            n.x = s.pos.x + n.dx;
            n.y = s.pos.y + n.dy;
        }
    }

    // 2) apply momentum damping
    for (i = 0; i < shapes.length; i++) {
        s = shapes[i];

        s.lin_p.x *= damping_t_c;
        s.lin_p.y *= damping_t_c;
        s.rot_p *= damping_r_c;
    }

    // 3a) calculate forces using new positions, and immediately update momenta
    for (i = 0; i < grouped_nodes.length; i++) {
        nodes = grouped_nodes[i];

        for (j = 0; j < nodes.length; j++) {
            n = nodes[j];
            s = shapes[n.s_index];

            // each pair of like-colored nodes (j, k)
            for (k = 0; k < j; k++) {
                n2 = nodes[k];
                s2 = shapes[n2.s_index];

                // linear forces applied to both shapes
                s.lin_p.x += hooke * (n2.x - n.x) * dt;
                s.lin_p.y += hooke * (n2.y - n.y) * dt;
                s2.lin_p.x += hooke * (n.x - n2.x) * dt;
                s2.lin_p.y += hooke * (n.y - n2.y) * dt;

                // torques applied to both shapes
                s.rot_p += hooke * (
                    n.dx * (n2.y - n.y) -
                    n.dy * (n2.x - n.x)
                ) * dt;
                s2.rot_p += hooke * (
                    n2.dx * (n.y - n2.y) -
                    n2.dy * (n.x - n2.x)
                ) * dt;

                // update cost
                cost += ((n2.x - n.x) ** 2 + (n2.y - n.y) ** 2);
            }
        }
    }
    // 3b) Collisions
    for (i = 0; i < shapes.length; i++) {
        s = shapes[i];
        for (j = 0; j < i; j++) { // each pair of shapes
            s2 = shapes[j];

            overlap_x = 0;
            overlap_y = 0;
            response.clear();
            if (SAT.testPolygonPolygon(s, s2, response)) {
                overlap_x -= response.overlapV.x;
                overlap_y -= response.overlapV.y;
            }
            response.clear();
            if (SAT.testPolygonPolygon(s2, s, response)) {
                overlap_x += response.overlapV.x;
                overlap_y += response.overlapV.y;
            }

            if (overlap_x || overlap_y) {

                // conserves linear momentum
                s.lin_p.x += overlap_x;
                s.lin_p.y += overlap_y;
                s2.lin_p.x -= overlap_x;
                s2.lin_p.y -= overlap_y;

            }
        }
    }

    //console.log(cost);

    function printCost() {
      document.getElementById('output').innerHTML = Math.round(cost);
    }
    printCost()

    // 4) update svg
    //console.log(shape.enter('g'))
    shape
        .attr("transform", affine);

    // 5) Early termination or recursion
    iters += 1;
    threshold = 0; // maximum component of momentum

    for (i = 0; i < shapes.length; i++) {
        threshold = Math.max(threshold, Math.abs(s.lin_p.x));
        threshold = Math.max(threshold, Math.abs(s.lin_p.y));
        threshold = Math.max(threshold, Math.abs(s.rot_p));
    }
    if (threshold > 0.1 && iters < 1000) {
        window.requestAnimationFrame(animate);
    } else {
        console.log('done', iters);
    }

}

window.requestAnimationFrame(animate);
