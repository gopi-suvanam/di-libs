/*

Linear Algebra
-- Matrix multiplication
-- Determinant
-- Matrix inversion
-- Cholesky Decomposition
-- Eigen decomposition -- TODO

*/

(()=>{
Array.prototype.mmult=function(other){
       var left_shape=this.shape;
       var right_shape=other.shape;
       if(left_shape[0]!=right_shape[1] || left_shape[1]!=right_shape[0]) throw("Dimension mismatch");
       other_transpose=other.transpose();
       return this.map(row=>other_transpose.map(col=>row.dot(col)));

	
};

Array.prototype.inverse = function(){
	var shape=this.shape();
	if(shape[0]!=shape[1]) throw("Matrix has to be square");
	
	  const n = shape[0];
	  var identity = [];
	  var inverse = [];
	  let det = 1;
	  var idx=range(0,n,1);
	
	  // Create identity matrix
	  var identity=idx.map(i=>idx.map(j=>i==j?1:0));
	  var copy=idx.map(i=>idx.map(j=>this[i][j]));
	  
	  
	
	  // Gaussian elimination with partial pivoting
	  for (let i = 0; i < n; i++) {
	    let maxRow = i;
	    for (let j = i + 1; j < n; j++) {
	      if (Math.abs(copy[j][i]) > Math.abs(copy[maxRow][i])) {
	        maxRow = j;
	      }
	    }
	
	    // Swap rows
	    const tmp = copy[i];
	    copy[i] = copy[maxRow];
	    copy[maxRow] = tmp;
	
	    const tmp2 = identity[i];
	    identity[i] = identity[maxRow];
	    identity[maxRow] = tmp2;
	
	    // Check if matrix is singular
	    if (copy[i][i] === 0) {
	      return null;
	    }
	
	    // Scale row
	    const pivot = copy[i][i];
	    det *= pivot;
	    for (let j = 0; j < n; j++) {
	      copy[i][j] /= pivot;
	      identity[i][j] /= pivot;
	    }
	
	    // Eliminate column
	    for (let j = 0; j < n; j++) {
	      if (j !== i) {
	        const factor = copy[j][i];
	        for (let k = 0; k < n; k++) {
	          copy[j][k] -= factor * copy[i][k];
	          identity[j][k] -= factor * identity[i][k];
	        }
	      }
	    }
	  }
	
	  // Inverse is in the identity matrix
	  return identity;
	

}

Array.prototype.determinant=function(){
	const shape=this.shape();
	if(shape[0]!=shape[1]) throw("Matrix has to be square");
	const n=shape[0];
	if(n==1)
		return this[0][0];
	let det = 0;
	  for (let i = 0; i < n; i++) {
	    var subMatrix = this.transpose()
	    subMatrix.splice(i,1);
	    subMatrix=subMatrix.transpose();
	    subMatrix.shift();

	    
	
	    const sign = i % 2 === 0 ? 1 : -1;
		
	    det += sign * this[0][i] * subMatrix.determinant();
		
	  }
	  return det;
	
}

const cholesky = function (array) {
	shape=array.shape()
	if (shape[0]!=shape[1]) throw("Matrix has to be square");
	const zeros = [...Array(shape[0])].map( _ => Array(shape[0]).fill(0));
	const L = zeros.map((row, r, xL) => row.map((v, c) => {
		const sum = row.reduce((s, _, i) => i < c ? s + xL[r][i] * xL[c][i] : s, 0);
		return xL[r][c] = c < r + 1 ? r === c ? Math.sqrt(array[r][r] - sum) : (array[r][c] - sum) / xL[c][c] : v;
	}));
	return L;
}

Array.prototype.cholesky=function(){return cholesky(this)}

})();