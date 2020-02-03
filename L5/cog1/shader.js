/**
 * Fragment shader for the light calculation.
 * Interpolation is done as well.
 *
 * There are no materials, only a color (one per face/polygon).
 * All polygons have one color for diffuse and ambient light.
 * For specular light the color of the polygon is always white.
 *
 * Shader will be called from the scene and from raster.
 *
 * @namespace cog1.shader
 * @module shader
 */
define(["exports"], function (exports) {
	"use strict";

	// List of shading function names.
	// Shading function have to exported.
	var shadingFunctionNames = ["none", "flat", "gouraud", "phong", "toon"];
	// Name of the current/default shading function, which used for all nodes.
	// Possible names are defined in shadingFunctionNames.
	var shadingFunctionName = "toon";
	// Shading-function called from raster.scanline function.
	var shadingFuncton = null;

	// There may be ambient light and
	// one white point-light in the scene.
	var ambientLightIntensity = 0.0;
	var pointLightIntensity = 0.0;
	var specularLightIntensity = 0.0;
	var specularLightExponent = 1.0;
	// The light position does not get transformed or
	// projected. It has to be set in respect to the
	// screen coordinates.
	var pointLightPosition = [0, 0, 0];

	// Data of the model.
	var model = null;
	var polygonIndex = undefined;
	var modelData = null;
	var vertices = null;
	var polygons = null;
	var vertexNormals = null;
	var polygonNormals = null;

	// Index of the current polygon.
	var polygonIndex = undefined;
	// The current polygon.
	var polygon = undefined;
	// Normal of the current polygon.
	var polygonNormal = null;
	// Light intensities at the vertices of the current polygon.
	var intensities = [];

	// Single light intensity for the current polygon.
	var polygonLightIntensity;
	// Light intensity at the vertices corner-points of the current polygon.
	// Used for gouraud shading.
	var polygonVertexLightIntensity = [];

	// Pointer/reference to the shading function.
	// The shadingFunction is called directly from raster to save the time for the lookup.
	// The name of the shading function is kept in the scene.
	var shadingFunction;
	// initFunction is called for each polygon.
	var initFunction;
	// Do the first step in a bi-linear interpolation
	// once for each scanline.
	var interpolationPrepareScanlineFunction;
	// Do the second step in a bi-linear interpolation
	// for each x-value on the current scanline.
	var interpolationStepOnScanlineFunction;

	// For gouraud interpolation.
	// Array of floats with the two intensities at start and end of scan-line segment.
	var scanlineInterpolationLightIntensities = [];
	// Intensity val interpolated on scanline.
	var scanlineInterpolationLightIntensity;
	var scanlineInterpolationLightIntensityDelta;
	//
	// For phong interpolation.
	// Array of vec3 with the two normals at start and end of scan-line segment.
	var scanlineInterpolationNormals = [];
	// Normal vec3 interpolated on scanline.
	var scanlineInterpolationNormal = [];
	var scanlineInterpolationNormalDelta = [];
	// Interpolation of the vertex on scanline without projection.
	// Array of vec3 with the two vertices at start and end of scan-line segment.
	var scanlineInterpolationVertices = [];
	// Vertex vec3 interpolated on scanline.
	var scanlineInterpolationVertex = [];
	var scanlineInterpolationVertexDelta = [];
	//
	// For toon shading.
	// To form zones we need the intensity range.
	// Calculated in setLights function.
	var sumOfAllLightTypesIntensity = 0;

	function init() {
		setShadingFunctionName.call(this, shadingFunctionName);
	}

	/**
	 * Set position and intensities of the light.
	 * This is called only via scene-graph.
	 *
	 * Set parameter as undefined to leave unchanged.
	 * Also dimensions of the position vector may be undefined,
	 * which leaves them unchanged.
	 *
	 * @parameter LI are positive floats, pointPos is a vec3.
	 */
	function setLights(ambientLI, pointLI, pointPos, specularLI, specularLIExpo) {
		// If parameters are undefined leave values as they are.
		ambientLightIntensity = ambientLI != undefined ? ambientLI : ambientLightIntensity;
		pointLightIntensity = pointLI != undefined ? pointLI : pointLightIntensity;
		//console.log("SambientLightIntensity: "+ambientLightIntensity+"  pointLightIntensity: "+ pointLightIntensity);
		specularLightIntensity = specularLI != undefined ? specularLI : specularLightIntensity;
		specularLightExponent = specularLIExpo != undefined ? specularLIExpo : specularLightExponent;
		sumOfAllLightTypesIntensity = ambientLightIntensity + pointLightIntensity;// + specularLightIntensity;
		//console.log("setLights sumOfAllLightTypesIntensity: "+sumOfAllLightTypesIntensity);

		// Check change in position.
		if (pointPos) {
			for (var i = 0; i < pointLightPosition.length; i++) {
				pointLightPosition[i] = pointPos[i] != undefined ? pointPos[i] : pointLightPosition[i];
			};
		}
		//console.log("pointLightPosition: " + pointLightPosition);
	}

	/**
	 *@returns true if the current shading function takes
	 * the position of the point light into consideration.
	 */
	function usesLightLocation() {
		if (shadingFunctionName == "none") {
			return false;
		}
		return true;
	}

	/**
	 * Set function to perform the shading by name, see shadingFunctionNames.
	 * Set one shading function for all nodes/models.
	 */
	function setShadingFunctionName(functiontName) {
		shadingFunctionName = functiontName;
		shadingFunction = this[functiontName];
		// Assume all init and interpolation-functions for all shader are exported.
		initFunction = this[shadingFunctionName + "Init"];
		interpolationPrepareScanlineFunction = this[shadingFunctionName + "InterpolationPrepareScanline"];
		interpolationStepOnScanlineFunction = this[shadingFunctionName + "InterpolationStepOnScanline"];
	}

	function getShadingFunctionName() {
		return shadingFunctionName;
	}

	function getShadingFunction() {
		return shadingFunction;
	}

	function getInitFunction() {
		return initFunction;
	}

	function getInterpolationPrepareScanlineFunction() {
		return interpolationPrepareScanlineFunction;
	}

	function getInterpolationStepOnScanlineFunction() {
		return interpolationStepOnScanlineFunction;
	}

	/**
	 * @returns a reference to the current shading function
	 */
	function getShadingFunction() {
		return shadingFunction;
	}

	/**
	 * Prepare shader and interpolation with the data for one model.
	 * Function is called from scene.
	 */
	function setModel(_model) {
		model = _model;
		modelData = model.getData();
		vertices = model.getTransformedVertices();
		polygons = modelData.polygonVertices;
		vertexNormals = model.getTransformedVertexNormals();
		polygonNormals = model.getTransformedPolygonNormals();
	}

	/**
	 * Prepare shader and interpolation for polygon.
	 * Function is called from scene.
	 * @parameter polygonIndex is the index of the polygon to process.
	 */
	function setPolygon(_polygonIndex) {
		if (model == null) {
			console.error("Error in setPolygon: no model set.");
			return false;
		}
		polygonIndex = _polygonIndex;
		polygon = polygons[polygonIndex];
		polygonNormal = polygonNormals[polygonIndex];
		// Initialize depending on the current shading function.
		initFunction();
	}

	/**
	 * Light intensity for a 3D-Point, that we do not name vertex
	 * as it can be a 3D-position on a polygon, as well as a vertex of the model.
	 *
	 * @parameters point vec3 of 3D-Array
	 *
	 * @returns an object with intensities for diffuse, ambientDiffuse, specular and total.
	 */
	function calcLightIntensity(point, normal) {

		// Intensity of diffuse light.
		var diffuse = 0;
		// Intensity of ambient plus diffuse light.
		var ambientDiffuse = 0;
		// Direction vector from light to point on surface.
		var directionToLight = [];

		// BEGIN exercise Flat-Shading

		// Calculate diffuse light.
		// Calculate vector from light to point and normalize on one step.
		vec3.direction(pointLightPosition, point, directionToLight);

		// Cut light from the wrong direction that leads to negative light intensities.
		if (directionToLight[2] < 0) {
			return {
				diffuse: 0,
				ambientDiffuse: 0,
				specular: 0,
				total: 0
			};
		}

		// Add ambient and diffuse Lambert intensity term.
		var cosAlpha = vec3.dot(normal, directionToLight);
		diffuse = pointLightIntensity * Math.max(0.0, cosAlpha);
		ambientDiffuse = ambientLightIntensity + diffuse;

		// Calculate reflection vector of light direction in respect to normal.
		var specular = 0;
		if (cosAlpha >= 0) {
			var reflect = [0, 0, 0];
			vec3.scale(normal, 2 * cosAlpha, reflect);
			vec3.subtract(reflect, directionToLight);

			// Specular light in eye direction ,which is +z in orthogonal projection,
			// Otherwise it is the normalized negative eye/camera vector,
			// which in turn is the negative point-vector when the camera is in the origin
			// (not implemented).
			specular =
				specularLightIntensity * Math.pow(
					Math.max(0, vec3.dot(reflect, [0, 0, 1])),
					specularLightExponent
				);
		}

		// Check calculation
		// if (specular > 0.9 || specular < 0) {
		// 	var lenNormal = vec3.length(normal);
		// 	var lenLightDir = vec3.length(directionToLight);
		// 	var lenReflect = vec3.length(reflect);
		// 	if (lenNormal < 0 || lenLightDir < 0 || lenReflect < 0) {
		// 		console.log("light vectors negative");
		// 	}
		// 	if (lenNormal > 1.0001 || lenLightDir > 1.0001 || lenReflect > 1.0001) {
		// 		console.log("light vectors too long: %s %s %s", lenNormal, lenLightDir, lenReflect);
		// 	}
		// }

		// END exercise Flat-Shading

		// Return object with intensities.
		return {
			diffuse: diffuse,
			ambientDiffuse: ambientDiffuse,
			specular: specular,
			total: ambientDiffuse + specular
		};
	}

	/**
	 * Do no shading, just return the color.
	 * In general, calculate the light an the final color.
	 * Function is called from raster during scan-line.
	 * Functions setModle and setPolygon have to be called first.
	 * A shading function must be exported to be called form raster.
	 * Every shading function must have a initialization function named xxxInit.
	 * @parameter color object modify field rgbaShaded field of color of the fragment.
	 * @return nothing
	 */
	function none(color) {
		vec3.set(color.rgba, color.rgbaShaded);
	}

	/**
	 * Depending on the shading function, do some
	 * pre-calculation for the current polygon.
	 */
	function noneInit() {
	}

	/**
	 * Interpolation function called for each scanline.
	 */
	function noneInterpolationPrepareScanline() {
	}

	/**
	 * Interpolation function called for each fragment/pixel/x on current scanline
	 * after all other calculation took place. Thus this function prepare the next step.
	 */
	function noneInterpolationStepOnScanline() {
	}

	// BEGIN exercise Flat-Shading

	/**
	 * See function none.
	 */
	function flat(color) {
		vec3.scale(color.rgba, polygonLightIntensity.ambientDiffuse, color.rgbaShaded);

		var specularWhite = [255, 255, 255, 255];
		vec3.scale(specularWhite, polygonLightIntensity.specular);
		vec3.add(color.rgbaShaded, specularWhite);
	}

	/**
	 * 	Calculate one light intensity for the current polygon.
	 */
	function flatInit() {
		var polygonCenter = [0, 0, 0];
		for (var v = 0; v < polygon.length; v++) {
			vec3.add(polygonCenter, vertices[polygon[v]]);
		}
		vec3.scale(polygonCenter, (1.0 / polygon.length));

		// Calculate light intensity at polygon center.
		// Use ambient and diffuse light.
		// Use ambient, diffuse and specular light.
		var intensity = calcLightIntensity(polygonCenter, polygonNormal);
		polygonLightIntensity = intensity;
	}


	// END exercise Flat-Shading

	/**
	 * See function none.
	 */
	function flatInterpolationPrepareScanline() {
	}

	/**
	 * See function none.
	 */
	function flatInterpolationStepOnScanline() {
	}

	// BEGIN exercise Gouraud-Shading

	/**
	 * See function none.
	 *
	 * @ interpolationWeight : weight of start and end point on scan-line.
	 */
	function gouraud(color, interpolationWeight) {
		// Calculate shading.
		var weightStart = 1 - scanlineInterpolationLightIntensity;
		var weightEnd = scanlineInterpolationLightIntensity;

		var intensityAD = scanlineInterpolationLightIntensities[0][0] * weightStart +
			scanlineInterpolationLightIntensities[1][0] * weightEnd;
		vec3.scale(color.rgba, intensityAD, color.rgbaShaded);

		var intensitySP = scanlineInterpolationLightIntensities[0][1] * weightStart +
			scanlineInterpolationLightIntensities[1][1] * weightEnd;
		var specularWhite = [255, 255, 255, 255];
		vec3.scale(specularWhite, intensitySP);
		vec3.add(color.rgbaShaded, specularWhite);
	}

	/**
	 * See function none.
	 *
	 * Calculate light intensity at all vertices/corners.
	 */
	function gouraudInit() {
		// Calculate shading.
		// Used the vertexIndex as index, to lookup intensity in shading function.
		// Use ambient, diffuse and specular light.
		for (var v = 0; v < polygon.length; v++) {
			var vertexIndex = polygon[v];
			var intensity = calcLightIntensity(vertices[vertexIndex], vertexNormals[vertexIndex]);
			polygonVertexLightIntensity[vertexIndex] = intensity;
		}
	}

	/**
	 * Interpolate intensities at the corners/vertices
	 * to the points at the start and end of a scan-line segment.
	 * Store the results in scanlineInterpolationLightIntensities
	 *
	 * @parameter interpolationVertexIndices, interpolationWeights.
	 * @parameter deltaX is the number of step on the scan-line segment.
	 */
	function gouraudInterpolationPrepareScanline(interpolationVertexIndices, interpolationWeights, deltaX) {

		// Interpolation of intensities.
		scanlineInterpolationLightIntensities = [];

		// i is index of start and end point on scan-line.
		for (var i = 0; i < 3; i += 2) {
			var vertexIndex0 = interpolationVertexIndices[i];
			var vertexIndex1 = interpolationVertexIndices[i + 1];
			var weight0 = interpolationWeights[i];
			var weight1 = interpolationWeights[i + 1];

			var intensity0 = polygonVertexLightIntensity[vertexIndex0];
			var intensity1 = polygonVertexLightIntensity[vertexIndex1];
			var intensityAD = intensity0.ambientDiffuse * weight0 + intensity1.ambientDiffuse * weight1;
			var intensitySP = intensity0.specular * weight0 + intensity1.specular * weight1;
			scanlineInterpolationLightIntensities.push([intensityAD, intensitySP]);
		}

		// Calculate delta for light intensity interpolation.
		if (deltaX === 0) scanlineInterpolationLightIntensityDelta = 0;
		else scanlineInterpolationLightIntensityDelta = 1 / deltaX;

		// Initialize start intensity for interpolation, as a reference.
		scanlineInterpolationLightIntensity = 0;
	}

	/**
	 * See function none.
	 */
	function gouraudInterpolationStepOnScanline() {
		// Interpolation of intensities on scanline.
		scanlineInterpolationLightIntensity += scanlineInterpolationLightIntensityDelta;
	}

	// END exercise Gouraud-Shading


	// BEGIN exercise Phong-Shading

	/**
	 * See function none.
	 *
	 * @ interpolationWeight : weight of start and end point on scan-line.
	 */
	function phong(color, interpolationWeight) {

		// The normal must not always point into positive z-direction.
		// Even with a positive polygon normal the normal of a fragment
		// on that polygon may be negative as the vertex-normals on
		// a convex surface point away from the direct of the center/averaged normal.
		// Do not skip fragments facing backwards.
		// if(scanlineInterpolationNormal[2] < 0) {}

		// Normalize the averaged normals.
		vec3.normalize(scanlineInterpolationNormal);

		// Calculate shading.
		var intensity = calcLightIntensity(scanlineInterpolationVertex, scanlineInterpolationNormal);
		vec3.scale(color.rgba, intensity.ambientDiffuse, color.rgbaShaded);

		// Add white specular light.
		var specularWhite = [255, 255, 255, 255];
		vec3.scale(specularWhite, intensity.specular);
		vec3.add(color.rgbaShaded, specularWhite);
	}

	/**
	 * Light calculations have to be done later for each fragment.
	 */
	function phongInit(interpolationVertexIndices) {
	}

	/**
	 * Interpolate normals from the four corners/vertices
	 * to the points at the start and end of a scan-line segment.
	 * Store the results in scanlineInterpolationNormal
	 *
	 * Interpolation of current vertex before projection.
	 * We cannot just take [x,y,z] from Scan-line as this has been projected.
	 * The vertex is used for eye- and light-vector calculation.
	 *
	 * @parameter interpolationVertexIndices, interpolationWeights for the two edges involved in the scanline segment.
	 * @parameter deltaX is the number of step on the scan-line segment.
	 */
	function phongInterpolationPrepareScanline(interpolationVertexIndices, interpolationWeights, deltaX) {
		// Interpolation of vertex and normals.

		// i is index of start and end point (start and end edge) on scan-line.
		for (var i = 0; i < 2; i++) {
			scanlineInterpolationNormals[i] = [];
			scanlineInterpolationVertices[i] = [];

			// j is index of start and end point of edge involved in scanline.
			var j = i * 2;
			var vertexIndex0 = interpolationVertexIndices[j];
			var vertexIndex1 = interpolationVertexIndices[j + 1];
			var weight = interpolationWeights[j + 1];

			// Normal interpolation.
			var normalDelta = [];
			vec3.subtract(
				vertexNormals[vertexIndex1],
				vertexNormals[vertexIndex0],
				normalDelta
			);
			vec3.scale(normalDelta, weight);
			vec3.add(vertexNormals[vertexIndex0], normalDelta, scanlineInterpolationNormals[i]);

			// Vertex interpolation.
			var vertexDelta = [];
			vec3.subtract(
				vertices[vertexIndex1],
				vertices[vertexIndex0],
				vertexDelta
			);
			vec3.scale(vertexDelta, weight);
			vec3.add(vertices[vertexIndex0], vertexDelta, scanlineInterpolationVertices[i]);

			// TODO:
			// Do not normalize the averaged normals twice,
			// thus not on edge an on scanline, normalize only
			// once after second interpolation on scanline.
			// vec3.normalize(scanlineInterpolationNormals[i]);
		}

		// Calculate delta for vertex interpolation.
		var deltaXX = (deltaX === 0) ? 0 : 1 / deltaX;
		vec3.subtract(
			scanlineInterpolationVertices[1],
			scanlineInterpolationVertices[0],
			scanlineInterpolationVertexDelta
		);
		vec3.scale(scanlineInterpolationVertexDelta, deltaXX);

		// Initialize start vertex for interpolation, as a reference.
		scanlineInterpolationVertex = scanlineInterpolationVertices[0];

		// Calculate delta for normal interpolation.
		vec3.subtract(
			scanlineInterpolationNormals[1],
			scanlineInterpolationNormals[0],
			scanlineInterpolationNormalDelta
		);
		vec3.scale(scanlineInterpolationNormalDelta, deltaXX);

		// Initialize start vertex for interpolation, as a reference.
		scanlineInterpolationNormal = scanlineInterpolationNormals[0];
	}

	/**
	 * See function none.
	 *
	 * Interpolation of vertex and scanlineInterpolationLightIntensities on scan-line.
	 */
	function phongInterpolationStepOnScanline() {
		// Interpolation of current vertex for next step.
		vec3.add(scanlineInterpolationVertex, scanlineInterpolationVertexDelta);

		// Interpolation of current normal for next step.
		vec3.add(scanlineInterpolationNormal, scanlineInterpolationNormalDelta);
	}

	// END exercise Phong-Shading

	// BEGIN exercise Toon-Shading

	/**
	 * Toon shading, see phone as base.
	 */
	function toon(color, interpolationWeight) {

		// Normalize the averaged normals.
		vec3.normalize(scanlineInterpolationNormal);

		// Calculate shading.
		var intensity = calcLightIntensity(scanlineInterpolationVertex, scanlineInterpolationNormal);

		// Use zones for discretization.
		var toonIntensity = intensity.ambientDiffuse;
		if (toonIntensity < 0.1) toonIntensity = 0.0;
		else if (toonIntensity < 0.2) toonIntensity = 0.1;
		else if (toonIntensity < 0.5) toonIntensity = 0.3;
		else if (toonIntensity < 0.7) toonIntensity = 0.5;
		else if (toonIntensity < 1.0) toonIntensity = 1.0;
		vec3.scale(color.rgba, toonIntensity, color.rgbaShaded);

		var toonSpecular = intensity.specular;
		if (toonSpecular < 0.5) toonSpecular = 0.0;
		else toonSpecular = 1.0;

		// Add white specular light.
		var specularWhite = [255, 255, 255, 255];
		vec3.scale(specularWhite, toonSpecular);
		vec3.add(color.rgbaShaded, specularWhite);

		// Draw outlines by darkening all polygons that point away from viewer.
		var contourIntensity = 1 - vec3.dot([0, 0, -1], scanlineInterpolationNormal);
		contourIntensity = smoothstep(1.2 - 0.01, 1.2 + 0.01, contourIntensity);
		vec3.scale(color.rgbaShaded, contourIntensity);
	}

	function smoothstep(edge0, edge1, x) {
		x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
		return x * x * (3 - 2 * x);
	}

	function clamp(x, lower, upper) {
		return Math.min(upper, Math.max(lower, x));
	}

	/**
	 * Interpolation for toon shading, see phone as base.
	 */
	// Set the function pointer directly to phong interpolation.
	var toonInit = phongInit;
	var toonInterpolationPrepareScanline = phongInterpolationPrepareScanline;
	var toonInterpolationStepOnScanline = phongInterpolationStepOnScanline;

	// END exercise Toon-Shading

	/**
	 * Do a check before the shading function is executed.
	 * The check may also be skipped for speed.
	 */
	function isEverytingSet() {
		if (model == null) {
			console.error("Error in shader: no model set.");
			return false;
		}
		if (polygonIndex == undefined) {
			console.error("Error in shader: no polygonIndex set.");
			return false;
		}
		return true;
	}

	// Getter.

	function getLightPosition() {
		return pointLightPosition;
	}

	function getPointLightIntensity() {
		return pointLightIntensity;
	}

	function getAmbientLightIntensity() {
		return ambientLightIntensity;
	}

	function getSpecularLightIntensity() {
		return specularLightIntensity;
	}

	function getSpecularLightExponent() {
		return specularLightExponent;
	}

	// Public API.
	exports.init = init;
	exports.setLights = setLights;
	exports.setModel = setModel;
	exports.setPolygon = setPolygon;
	exports.setShadingFunctionName = setShadingFunctionName;
	exports.getShadingFunctionName = getShadingFunctionName;
	exports.getShadingFunction = getShadingFunction;
	exports.getInterpolationPrepareScanlineFunction = getInterpolationPrepareScanlineFunction;
	exports.getInterpolationStepOnScanlineFunction = getInterpolationStepOnScanlineFunction;
	exports.getInitFunction = getInitFunction;
	exports.usesLightLocation = usesLightLocation;
	// Public constants.
	exports.shadingFunctionNames = shadingFunctionNames;
	// Export shading function to pass them as direct reference to other modules for speed.
	// The same is done for init- and interpolation functions.
	exports.none = none;
	exports.flat = flat;
	exports.gouraud = gouraud;
	exports.phong = phong;
	exports.toon = toon;
	// Init.
	exports.noneInit = noneInit;
	exports.flatInit = flatInit;
	exports.gouraudInit = gouraudInit;
	exports.phongInit = phongInit;
	exports.toonInit = toonInit;
	// Interpolation.
	exports.noneInterpolationPrepareScanline = noneInterpolationPrepareScanline;
	exports.flatInterpolationPrepareScanline = flatInterpolationPrepareScanline;
	exports.gouraudInterpolationPrepareScanline = gouraudInterpolationPrepareScanline;
	exports.phongInterpolationPrepareScanline = phongInterpolationPrepareScanline;
	exports.toonInterpolationPrepareScanline = toonInterpolationPrepareScanline;
	//
	exports.noneInterpolationStepOnScanline = noneInterpolationStepOnScanline;
	exports.flatInterpolationStepOnScanline = flatInterpolationStepOnScanline;
	exports.gouraudInterpolationStepOnScanline = gouraudInterpolationStepOnScanline;
	exports.phongInterpolationStepOnScanline = phongInterpolationStepOnScanline;
	exports.toonInterpolationStepOnScanline = toonInterpolationStepOnScanline;
	// Getter for light parameter.
	exports.getLightPosition = getLightPosition;
	exports.getPointLightIntensity = getPointLightIntensity;
	exports.getAmbientLightIntensity = getAmbientLightIntensity;
	exports.getSpecularLightIntensity = getSpecularLightIntensity;
	exports.getSpecularLightExponent = getSpecularLightExponent;
});
