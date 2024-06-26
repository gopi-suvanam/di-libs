(()=>{
norm_dist={}

norm_dist.stdcdf=function(x){   //HASTINGS.  MAX ERROR = .000001
	var T=1/(1+.2316419*Math.abs(x));
	var D=.3989423*Math.exp(-x*x/2);
	var p=D*T*(.3193815+T*(-.3565638+T*(1.781478+T*(-1.821256+T*1.330274))));
	if (x>0) {
		p=1-p
	}
	return p
}   

norm_dist.dist = function(z) {
  return (1.0/(Math.sqrt(2*Math.PI)))*Math.exp(-0.5*z);
  //??  Math.exp(-0.5*z*z)
};

norm_dist.cdf=function(z,mu,sd) {

	if (sd<0) {
		throw("The standard deviation must be nonnegative.")
	} else if (sd==0) {
	    if (z<mu){
	        return 0;
	    } else {
		    return 1;
		}
	} else {
		return norm_dist.normalcdf((z-mu)/sd);
			}

}

norm_dist.nrand = function() {
	return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()) 
};


norm_dist.multivariate = function(x, mean, covariance){
  const d = mean.length;
  const det = covariance.determinant();
  const invCovariance = covariance.inverse();

  const diff = [];
  for (let i = 0; i < d; i++) {
    diff.push(x[i] - mean[i]);
  }

  let exponent = 0;
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      exponent -= 0.5 * (diff[i] * invCovariance[i][j] * diff[j]);
    }
  }

  const normalization = 1 / (Math.pow(2 * Math.PI, d / 2) * Math.sqrt(Math.abs(det)));

  return normalization * Math.exp(exponent);
}

})();
