/**
 * An object that shows a city.
 * 
 * @namespace cog1.data
 * @module myModel
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
			var color = parameter.color;
		}
		// Set default values if parameter is undefined.
		if (scale == undefined) {
			scale = 200;
		}
		if (color == undefined) {
			color = 8;
		}

		// Instance of the model to be returned.
		var instance = {};

		instance.vertices = [
			// bottom plate
			[0, -5.7, 0],

			// base plate
			[-20, 0, -10],
			[20, 0, -10],
			[0, 0, 5],

			// main builing
			[-1, 0, -2],
			[1, 0, -2],
			[1, 0, -4],
			[-1, 0, -4],
			[-1, 3, -2],
			[1, 3, -2],
			[1, 3, -4],
			[-1, 3, -4],

			// left builing
			[-5, 0, -2],
			[-1, 0, -2],
			[-1, 0, -6],
			[-5, 0, -6],
			[-5, 1, -2],
			[-1, 1, -2],
			[-1, 1, -6],
			[-5, 1, -6],

			// tall builing
			[3, 0, -5],
			[5, 0, -5],
			[5, 0, -7],
			[3, 0, -7],
			[3, 5, -5],
			[5, 5, -5],
			[5, 5, -7],
			[3, 5, -7],

			// monument base
			[-10, 0, -6],
			[-8, 0, -6],
			[-8, 0, -8],
			[-10, 0, -8],
			[-9.5, 1.5, -6.5],
			[-8.5, 1.5, -6.5],
			[-8.5, 1.5, -7.5],
			[-9.5, 1.5, -7.5],

			// monument column
			[-9.5, 1.5, -6.5],
			[-8.5, 1.5, -6.5],
			[-8.5, 1.5, -7.5],
			[-9.5, 1.5, -7.5],
			[-9.5, 7, -6.5],
			[-8.5, 7, -6.5],
			[-8.5, 7, -7.5],
			[-9.5, 7, -7.5],

			// monument top
			[-10.5, 7, -5.5],
			[-7.5, 7, -5.5],
			[-7.5, 7, -8.5],
			[-10.5, 7, -8.5],
			[-9, 8, -7]
		];

		instance.polygonVertices = [
			// base plate
			[0, 1, 2],
			[0, 2, 3],
			[0, 3, 1],
			[1, 2, 3],

			// main building
			[4, 5, 9, 8],
			[7, 6, 10, 11],
			[8, 11, 7, 4],
			[9, 10, 6, 5],
			[8, 9, 10, 11],
			[4, 5, 6, 7],

			// left building
			[12, 13, 17, 16],
			[15, 14, 18, 19],
			[16, 19, 15, 12],
			[17, 18, 14, 13],
			[16, 17, 18, 19],
			[12, 13, 14, 15],

			// tall building
			[20, 21, 25, 24],
			[23, 22, 26, 27],
			[24, 27, 23, 20],
			[25, 26, 22, 21],
			[24, 25, 26, 27],
			[20, 21, 22, 23],

			// monument base
			[28, 29, 33, 32],
			[31, 30, 34, 35],
			[32, 35, 31, 28],
			[33, 34, 30, 29],
			[32, 33, 34, 35],
			[28, 29, 30, 31],

			// monument column
			[36, 37, 41, 40],
			[39, 38, 42, 43],
			[40, 43, 39, 36],
			[41, 42, 38, 37],
			[40, 41, 42, 43],
			[36, 37, 38, 39],

			// monument top
			[44, 45, 46, 47],
			[44, 45, 48],
			[45, 46, 48],
			[46, 47, 48],
			[47, 44, 48]
		];

		data.applyScale.call(instance, scale);
		data.setColorForAllPolygons.call(instance, color);

		return instance;
	};
});