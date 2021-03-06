if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function generateCube(xSize, ySize, zSize, xDivs, yDivs, zDivs, uvGeneratorFunc) {
		var undef = void 0;
		
		var vertexBuffer = [];
		var indexBuffer = [];
		
		// Default values
		if (xSize === undef) { xSize = 1; }
		if (ySize === undef) { ySize = 1; }
		if (zSize === undef) { zSize = 1; }
		if (xDivs === undef) { xDivs = 1; }
		if (yDivs === undef) { yDivs = 1; }
		if (zDivs === undef) { zDivs = 1; }
		if (!uvGeneratorFunc) { uvGeneratorFunc = generateDefaultUV; }
		
		if (xDivs > 999 || yDivs > 999 || zDivs > 999) {
			throw "Divisions must not over 999";
		}
		
		// Make vertices and indices on each a face
		var xNumPoints = xDivs + 1;
		var yNumPoints = yDivs + 1;
		var zNumPoints = zDivs + 1;
		var vmapFront = buildFace(xNumPoints, yNumPoints, 'x', 'y', 'z', 0, false);
		var vmapBack  = buildFace(xNumPoints, yNumPoints, 'x', 'y', 'z', zNumPoints - 1, true);
		var vmapRight = buildFace(zNumPoints, yNumPoints, 'z', 'y', 'x', xNumPoints - 1, false);
		var vmapLeft  = buildFace(zNumPoints, yNumPoints, 'z', 'y', 'x', 0, true);
		var vmapTop   = buildFace(xNumPoints, zNumPoints, 'x', 'z', 'y', 0, true);
		var vmapBottom= buildFace(xNumPoints, zNumPoints, 'x', 'z', 'y', yNumPoints - 1, false);


		// Merge vertices and indices from six faces
		
		function generateVerticesOnFacce(face_name, face_vmap) {
			face_vmap.generateVertices(face_name, vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs, uvGeneratorFunc);
		}

		generateVerticesOnFacce('front', vmapFront);
		generateVerticesOnFacce('back', vmapBack);
		generateVerticesOnFacce('right', vmapRight);
		generateVerticesOnFacce('left', vmapLeft);
		generateVerticesOnFacce('top', vmapTop);
		generateVerticesOnFacce('bottom', vmapBottom);
		
		return {
			vertices: vertexBuffer,
			indices: indexBuffer
		};
	}
	
	function buildFace(cols, rows, colAxis, rowAxis, planeAxis, planePosition, reverseFace) {
		var vertexMap = new VertexMap(cols, rows);
		var i, j;

		var indexOrigins = {
			x: 0, y: 0, z: 0
		};

		var indices = {
			x: 0, y: 0, z: 0
		};

		var nextIndices = {
			x: 0, y: 0, z: 0
		};
		
		indices[planeAxis] = planePosition;

		indices[rowAxis] = indexOrigins[rowAxis];
		for (j = 0;j < (rows-1);++j) {
			indices[colAxis] = indexOrigins[colAxis];
			for (i = 0;i < (cols-1);++i) {
				nextIndices.x = indices.x;
				nextIndices.y = indices.y;
				nextIndices.z = indices.z;
				nextIndices[colAxis] += 1;
				nextIndices[rowAxis] += 1;
				
				var vertexIndex1, vertexIndex2, vertexIndex3, vertexIndex4;
				if (planeAxis == 'y') {
					vertexIndex1 = vertexMap.requestIndex(indices.x    , indices.y, indices.z    , i  , j);
					vertexIndex2 = vertexMap.requestIndex(nextIndices.x, indices.y, indices.z    , i+1, j);
					vertexIndex3 = vertexMap.requestIndex(indices.x    , indices.y, nextIndices.z, i  , j+1);
					vertexIndex4 = vertexMap.requestIndex(nextIndices.x, indices.y, nextIndices.z, i+1, j+1);
				} else {
					vertexIndex1 = vertexMap.requestIndex(indices.x    , indices.y    , indices.z    , i  , j);
					vertexIndex2 = vertexMap.requestIndex(nextIndices.x, indices.y    , nextIndices.z, i+1, j);
					vertexIndex3 = vertexMap.requestIndex(indices.x    , nextIndices.y, indices.z    , i  , j+1);
					vertexIndex4 = vertexMap.requestIndex(nextIndices.x, nextIndices.y, nextIndices.z, i+1, j+1);
				}
				
				if (!reverseFace) {
					vertexMap.faceIndices.push(vertexIndex1, vertexIndex2, vertexIndex3);
					vertexMap.faceIndices.push(vertexIndex3, vertexIndex2, vertexIndex4);
				} else {
					// Make a face in reversed vertex order
					vertexMap.faceIndices.push(vertexIndex2, vertexIndex1, vertexIndex4);
					vertexMap.faceIndices.push(vertexIndex4, vertexIndex1, vertexIndex3);
				}
				
				indices[colAxis] += 1;
			}
			indices[rowAxis] += 1;
		}
		
		return vertexMap;
	}
	
	// ------------------------------------
	
	function VertexMap(cols, rows) {
		this.map = {};
		this.list = [];
		this.colrowList = [];
		this.faceIndices = [];
		
		this.nCols = cols;
		this.nRows = rows;
	}
	
	VertexMap.prototype = {
		requestIndex: function(ix, iy, iz, col, row) {
			var k = this.makeKey(ix, iy, iz);
			if (!this.map.hasOwnProperty(k)) {
				var nextIndex = this.list.length;
				this.map[k] = nextIndex;
				this.list.push(k);
				this.colrowList.push(row*1000 + col);
			}
			
			return this.map[k];
		},

		xOfIndex: function(i) {
			var k = this.list[i];
			return k % 1000;
		},

		yOfIndex: function(i) {
			var k = this.list[i];
			return Math.floor(k / 1000) % 1000;
		},

		zOfIndex: function(i) {
			var k = this.list[i];
			return Math.floor(k / 1000000) % 1000;
		},

		colOfIndex: function(i) {
			return this.colrowList[i] % 1000;
		},

		rowOfIndex: function(i) {
			return Math.floor(this.colrowList[i] / 1000);
		},

		makeKey: function(ix, iy, iz) {
			return ix + (iy * 1000) + (iz * 1000000);
		},
	
		generateVertices: function(faceName, vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs, uvgen) {
			var vertexIndexOrigin = vertexBuffer.length;
			var indexBufferOrigin = indexBuffer.length;
			var vlen = this.list.length;
			var i;
			
			for (i = 0;i < vlen;++i) {
				var v = this.generateVertex(faceName, i, xSize, ySize, zSize, xDivs, yDivs, zDivs, uvgen);
				vertexBuffer.push(v);
			}
			
			var ilen = this.faceIndices.length;
			for (i = 0;i < ilen;++i) {
				indexBuffer.push(this.faceIndices[i] + vertexIndexOrigin);
			}
			
			// Set normal vector to all vertices
			var N = calcNormalVector(vertexBuffer, indexBuffer, indexBufferOrigin);
			setNVector(vertexBuffer, vertexIndexOrigin, vlen, N);
		},
		
		generateVertex: function(faceName, index, xSize, ySize, zSize, xDivs, yDivs, zDivs, uvgen) {
			var ix = this.xOfIndex(index);
			var iy = this.yOfIndex(index);
			var iz = this.zOfIndex(index);
			
			var xOrigin = -xSize * 0.5;
			var yOrigin =  ySize * 0.5;
			var zOrigin =  zSize * 0.5;
			
			var xStep =  xSize / xDivs;
			var yStep = -ySize / yDivs;
			var zStep = -zSize / zDivs;
			
			var v = new smallworld3d.Vertex3D();
			v.position.x = xOrigin + xStep*ix;
			v.position.y = yOrigin + yStep*iy;
			v.position.z = zOrigin + zStep*iz;
			
			// Set uv coordinate
			uvgen(v.textureUV, faceName, this.colOfIndex(index), this.rowOfIndex(index), this.nCols, this.nRows);
			
			return v;
		}
	};
	
	function calcNormalVector(vertexBuffer, indexBuffer, indexOrigin) {
		// Generate normal vector of the face using cross product
		var v1 = vertexBuffer[indexBuffer[ indexOrigin   ]];
		var v2 = vertexBuffer[indexBuffer[ indexOrigin+1 ]];
		var v3 = vertexBuffer[indexBuffer[ indexOrigin+2 ]];

		tmpV1.copyFrom(v2.position).sub(v1.position);
		tmpV2.copyFrom(v3.position).sub(v2.position);
		var N = new smallworld3d.geometry.Vec4();
		N.cp3(tmpV2, tmpV1).normalize3();

		return N;
	}
	
	function setNVector(destList, destIndexOrigin, destLength, sourceN) {
		for (var i = 0;i < destLength;++i) {
			destList[destIndexOrigin + i].N.copyFrom(sourceN);
		}
	}
	
	function generateDefaultUV(outUV, faceName, colIndex, rowIndex, nCols, nRows) {
		var u = colIndex / (nCols-1);
		var v = rowIndex / (nRows-1);
		outUV.u = u;
		outUV.v = v;
	}

	var tmpV1 = new smallworld3d.geometry.Vec4();
	var tmpV2 = new smallworld3d.geometry.Vec4();

	pkg.generateCube = generateCube;
})(window.smallworld3d);