/**
 * A sphere.
 * 
 * @namespace cog1.data
 * @module mySphere
 */
define(["exports", "data"], function (exports, data) {
    "use strict";
    /**
         * Create an instance of the model defined in this module.
         * 
         * @parameter object with fields:
         * @parameter scale
         * @parameter color [-1 for many colors]
         * @returns instance of this model.
         */
    exports.create = function (parameter) {
        if (parameter) {
            var scale = parameter.scale;
            var colors = parameter.colors;
        }
        // Set default values if parameter is undefined.
        if (scale == undefined) {
            scale = 200;
        }
        if (colors == undefined) {
            colors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        }

        // Instance of the model to be returned.
        var instance = {};

        // only one plane
        instance.vertices = [
            [0, 1, 0],
            [1, 0, 0],
            [0, 0, 1]
        ];

        // only one polygon
        instance.polygonVertices = [
            [0, 2, 1]
        ];

        // defines the roundness of the sphere
        var sphereness = 3;

        function buildSphereFragment() {
            instance.polygonVertices = splitPolygon(instance.polygonVertices[0], sphereness);
        }

        function splitPolygon(polygon, level) {
            if (level === 0) {
                return [polygon];
            }

            var p1 = projectPointOnSphere(
                centerOfTwoVertices(
                    instance.vertices[polygon[0]],
                    instance.vertices[polygon[1]]
                ));
            var p2 = projectPointOnSphere(
                centerOfTwoVertices(
                    instance.vertices[polygon[1]],
                    instance.vertices[polygon[2]]
                ));
            var p3 = projectPointOnSphere(
                centerOfTwoVertices(
                    instance.vertices[polygon[2]],
                    instance.vertices[polygon[0]]
                ));

            var m1 = tryStoreVertice(p1);
            var m2 = tryStoreVertice(p2);
            var m3 = tryStoreVertice(p3);

            var newPolygons = [
                [polygon[0], m1, m3],
                [polygon[1], m2, m1],
                [polygon[2], m3, m2],
                [m1, m2, m3]
            ];

            var splits = [];
            for (var p = 0; p < newPolygons.length; p++) {
                var split = splitPolygon(newPolygons[p], level - 1);
                splits = splits.concat(split);
            }

            return splits;
        }

        function centerOfTwoVertices(verticeA, verticeB) {
            return [
                (verticeA[0] + verticeB[0]) / 2,
                (verticeA[1] + verticeB[1]) / 2,
                (verticeA[2] + verticeB[2]) / 2
            ]
        }

        function projectPointOnSphere(point) {
            var factor = Math.sqrt(
                1 / (point[0] * point[0] + point[1] * point[1] + point[2] * point[2])
            );
            return [
                point[0] * factor,
                point[1] * factor,
                point[2] * factor
            ]
        }

        function tryStoreVertice(vertice) {
            var index = indexForVertice(vertice);
            if (index === -1) {
                instance.vertices.push(vertice);
                index = instance.vertices.length - 1;
            }
            return index;
        }

        function indexForVertice(vertice) {
            for (var v = 0; v < instance.vertices.length; v++) {
                var stored = instance.vertices[v];
                if (vertice[0] === stored[0] &&
                    vertice[1] === stored[1] &&
                    vertice[2] === stored[2]) {
                    return v;
                }
            }
            return -1;
        }

        function mirrorPoint(point, x, y, z) {
            return [
                point[0] * x,
                point[1] * y,
                point[2] * z
            ]
        }

        function mirrorFragment(x, y, z) {
            var polygonCount = instance.polygonVertices.length;
            for (var p = 0; p < polygonCount; p++) {
                var p1 = instance.vertices[instance.polygonVertices[p][0]];
                var p2 = instance.vertices[instance.polygonVertices[p][1]];
                var p3 = instance.vertices[instance.polygonVertices[p][2]];

                p1 = mirrorPoint(p1, x, y, z);
                p2 = mirrorPoint(p2, x, y, z);
                p3 = mirrorPoint(p3, x, y, z);

                var m1 = tryStoreVertice(p1);
                var m2 = tryStoreVertice(p2);
                var m3 = tryStoreVertice(p3);

                // flip polygon by swapping vertices so normal points outward again
                instance.polygonVertices.push(
                    [m3, m2, m1]
                );
            }
        }

        function cyclicalColors() {
            var cols = [];
            for (var c = 0; c < instance.polygonVertices.length; c++) {
                cols.push(colors[c % colors.length]);
            }
            return cols;
        }

        buildSphereFragment();
        mirrorFragment(-1, 1, 1);
        mirrorFragment(1, -1, 1);
        mirrorFragment(1, 1, -1);
        instance.polygonColors = cyclicalColors();

        data.applyScale.call(instance, scale);

        return instance;
    };
});