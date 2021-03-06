if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function Mesh() {
		this.vertices = [];
		this.indices  = [];
		this.groups   = [];
		this.materials = [];
		
		this.transformedVertices = [];
	}
	
	Mesh.prototype = {
		addVertex: function(v) {
			this.vertices.push(v);
		},
		
		addTriangle: function(a, b, c) {
			this.indices.push(a, b, c);
		},
		
		getFacesCount: function() {
			return this.indices / 3;
		},
		
		addTriangleGroup: function(nTriangles) {
			this.groups.push(nTriangles);
			this.materials.push(null);
		},
		
		setGroupMaterial: function(index, m) {
			this.materials[index] = m;
		},
		
		doTransform: function(renderingContext) {
			var len = this.vertices.length;
			allocateTransformedVertices(this.transformedVertices, len);
			
			renderingContext.transformVertices(this.transformedVertices, this.vertices);
			renderingContext.applyViewportTransform(this.transformedVertices);
		},
		
		drawSubset: function(renderingContext, index, overrideTexture) {
			var startIndex = (index == 0) ? 0 : this.groups[index - 1];
			
			// Number of faces in this group
			var len = this.groups[index] || this.getFacesCount();
			
			var r = renderingContext.rasterizer;
			if (overrideTexture) {
				// Use specified texture, ignoring orignal one.
				r.setTexture(overrideTexture);
			} else if (this.materials[index]) {
				r.setTexture(this.materials[index].textureImageBuffer || null);
			} else {
				// Render without texture
				r.setTexture();
			}
	
			var ls = this.indices;
			var vs = this.transformedVertices;
			for (var i = 0;i < len;i++) {
				var ti = startIndex + i;
				var a = ls[ti*3  ];
				var b = ls[ti*3+1];
				var c = ls[ti*3+2];
				
				var vA = vs[a];
				var vB = vs[b];
				var vC = vs[c];

				var cA = vA.color;
				var cB = vB.color;
				var cC = vC.color;
				
				r.setVertexAttribute(0,
					vA.position.x, vA.position.y, vA.position.z, // coordinate
					1.0 / vA.position.w, // RHW
					cA.r, cA.g, cA.b, cA.a,
					vA.textureUV.u, vA.textureUV.v, vA.textureUV.s, vA.textureUV.t);

				r.setVertexAttribute(1,
					vB.position.x, vB.position.y, vB.position.z, // coordinate
					1.0 / vB.position.w, // RHW
					cB.r, cB.g, cB.b, cB.a,
					vB.textureUV.u, vB.textureUV.v, vB.textureUV.s, vB.textureUV.t);

				r.setVertexAttribute(2,
					vC.position.x, vC.position.y, vC.position.z, // coordinate
					1.0 / vC.position.w, // RHW
					cC.r, cC.g, cC.b, cC.a,
					vC.textureUV.u, vC.textureUV.v, vC.textureUV.s, vC.textureUV.t);
					
				r.fillTriangle();
			}
		}
	};
	
	function allocateTransformedVertices(ls, len) {
		if (ls.length < len) {
			ls.length = len;
			for (var i = 0;i < len;i++) {
				if (!ls[i]) { ls[i] = new smallworld3d.TransformedVertex(); }
			}
		}
	}
	
	pkg.Mesh = Mesh;
})(window.smallworld3d);
