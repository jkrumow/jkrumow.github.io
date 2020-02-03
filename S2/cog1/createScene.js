/**
 * Populate the scene-graph with nodes,
 * calling methods form the scene-graph and node modules.
 * 
 * Texture files have to exist in the "textures" sub-directory.
 * 
 * @namespace cog1
 * @module createScene
 */
define(["exports", "scenegraph", "animation"], //
	function (exports, scenegraph, animation) {
		"use strict";

		/**
		 * 	Call methods form the scene-graph (tree) module to create the scene.
		 *
		 */
		function init() {

			// BEGIN exercise myModel

			var myModel = scenegraph.createNodeWithModel("myModel", "myModel", { color: 7, scale: 50 });
			myModel.rotateTo([0.22, 5.88, 0]);

			// END exercise myModel

			// BEGIN M2 Sphere

			var mySphere = scenegraph.createNodeWithModel("mySphere", "mySphere", { scale: 300, color: 3, sphereness: 3 });

			// END M2 Sphere

			var cubeNode = scenegraph.createNodeWithModel("cube", "cube", { scale: 200 });
			cubeNode.rotateTo([0.22, 5.88, 0]);

			//var cubeNode = scenegraph.createNodeWithModel("cube", "cube", {scale:100, textureURL:"brickWall.jpg"});		
			var cubeNode1 = scenegraph.createNodeWithModel("cube 1", "cube", { scale: 70, textureURL: "stoneWall.jpg" });
			cubeNode1.translate([50, 200, 0]);
			//cubeNode1.rotate([1,1,1]);
			var cubeNode2 = scenegraph.createNodeWithModel("cube 2", "cube", { scale: 50, textureURL: "uvTest.jpg" });
			cubeNode2.translate([-100, -400, 0]);
			//cubeNode2.rotate([-1,-1,-1]);
			var cubeNode3 = scenegraph.createNodeWithModel("cube procedural texture", "cube", { scale: 50, textureURL: "sampleProceduralRGB" });
			var cubeNode4 = scenegraph.createNodeWithModel("cube six faces texture", "cube", { scale: 200, textureURL: "OrbitCube.gif", sixFacesTexture: true });
			var cubeNode5 = scenegraph.createNodeWithModel("cube 3x3 texture", "cube", { scale: 50, textureURL: "cubeColor.png", sixFacesTexture: true });
			var cubeNode6 = scenegraph.createNodeWithModel("cube Escher texture", "cube", { scale: 200, textureURL: "EscherCubeFish.gif", sixFacesTexture: true });

			var insideOutPolyNode = scenegraph.createNodeWithModel("insideOutPoly", "insideOutPoly");

			var diamondNode = scenegraph.createNodeWithModel("diamond", "diamond");

			var torusNode = scenegraph.createNodeWithModel("torus", "torus");
			var torusNode1 = scenegraph.createNodeWithModel("torus 13", "torus", { r2: 50, n2: 13, color: 8 });

			var teapotNode = scenegraph.createNodeWithModel("teapot", "teapot", { color: 0, scale: 30 });
			var dirtyTeapotNode = scenegraph.createNodeWithModel("dirtyTeapot", "teapot_dirty", { color: 8 });
			dirtyTeapotNode.rotate([0.54, 0.25, 0.0]);

			var waltheadNode = scenegraph.createNodeWithModel("walthead", "walthead", { color: 7 });

			var plainNode1 = scenegraph.createNodeWithModel("plain", "plain", { scale: 300, color: 9, textureURL: "land_ocean_ice_2048.jpg" });
			var plainTriangles = scenegraph.createNodeWithModel("plainTriangles", "plainTriangles", { scale: 300, color: 9, textureURL: "land_ocean_ice_2048.jpg" });

			var emptyNode1 = scenegraph.createNodeWithModel("empty", "empty");

			// BEGIN exercise Scenegraph

			var cubeNodeA = scenegraph.createNodeWithModel("cubeA", "cube", { scale: 120 });
			var cubeNodeB = scenegraph.createNodeWithModel("cubeB", "cube", { scale: 80 }, cubeNodeA);
			var cubeNodeC = scenegraph.createNodeWithModel("cubeC", "cube", { scale: 30 }, cubeNodeB);

			cubeNodeA.translate([-500, 0, 0]);
			cubeNodeB.translate([250, 0, 0]);
			cubeNodeC.translate([150, 0, 0]);

			cubeNodeA.rotate([0.42, -0.51, -1.0]);
			cubeNodeB.rotate([0.96, 0.76, 0.0]);
			cubeNodeC.rotate([0.36, 0.73, 0.0]);

			// END exercise Scenegraph

			// Assign animations.
			// animation.assign(cubeNode, "move");
			// animation.assign(cubeNode1, "move");
			// animation.assign(cubeNode2, "rotate");

			// BEGIN exercise Rotating-Planet-Animation

			var sun = scenegraph.createNodeWithModel("sun", "mySphere", { scale: 180, color: 11, sphereness: 3 });

			// use orbit as invisible object to rotate sun differently than planet
			var orbit = scenegraph.createNodeWithModel("planetOrbit", "plain", { scale: 0 }, sun);
			var planet = scenegraph.createNodeWithModel("planet", "mySphere", { scale: 70, color: 13, sphereness: 3 }, orbit);

			// use ring to rotate moon differently than planet
			var ring = scenegraph.createNodeWithModel("ring", "torus", { r1: 100, r2: 3, n2: 13, color: 12 }, orbit);
			var moon = scenegraph.createNodeWithModel("moon", "mySphere", { scale: 20, color: 7, sphereness: 3 }, ring);

			// positioning within node hierarchy
			sun.rotate([0.39, 0.0, 0.0]);
			planet.translate([400, 0.0, 0.0]);
			ring.translate([400, 0.0, 0.0]);
			ring.rotate([-1.6, 0.0, 0.0]);
			moon.translate([100, 0.0, 0.0]);

			// Mind the the order of transformation types get mixed up
			// then traversing the hierarchy in the scene-graph.
			//
			// Animation of a Planet with an also rotation moon or a ring. 
			// The planet rotates around an small sun.        
			animation.assign(sun, "rotate", { rotationSpeed: [0.0, -0.1, 0.0,] });
			animation.assign(orbit, "rotate", { rotationSpeed: [0.0, 0.08, 0.0] });
			animation.assign(planet, "rotate", { rotationSpeed: [0.0, -0.05, 0.0] });
			animation.assign(ring, "rotate", { rotationSpeed: [0.0, 0.0, -0.02] });

			// END exercise Rotating-Planet-Animation


			// Set visibility of nodes (hide: set to false).
			// Comment out what you want to see as the default is visible.
			myModel.setVisible(false);
			mySphere.setVisible(false);
			cubeNode.setVisible(false);
			cubeNode1.setVisible(false);
			cubeNode2.setVisible(false);
			cubeNode3.setVisible(false);
			cubeNode4.setVisible(false);
			cubeNode5.setVisible(false);
			cubeNode6.setVisible(false);
			insideOutPolyNode.setVisible(false);
			diamondNode.setVisible(false);
			torusNode.setVisible(false);
			torusNode1.setVisible(false);
			teapotNode.setVisible(false);
			dirtyTeapotNode.setVisible(false);
			waltheadNode.setVisible(false);
			plainNode1.setVisible(false);
			plainTriangles.setVisible(false);
			emptyNode1.setVisible(false);
			cubeNodeA.setVisible(false);
			cubeNodeB.setVisible(false);
			cubeNodeC.setVisible(false);
			sun.setVisible(true);


			// Set the initially interactive node [by name].
			// If not set, it is the first node created.
			//scenegraph.setInteractiveNodeByName("sphere");
			//scenegraph.setInteractiveNode(torusNode);
			scenegraph.setInteractiveNode(sun);

			// Create a node for the light, which is not visible by default.
			var lightnode = scenegraph.createPointLightNode("light", "diamond");

			// Set light parameter.
			// ambientLI, pointLI, pointPos, specularLI, specularLIExpo
			scenegraph.setLights(0.2, 0.9, [847, 247, 500], 1.0, 12.0);
		}

		// Public API.
		exports.init = init;
	});
