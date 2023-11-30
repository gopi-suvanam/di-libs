(()=>{

if(typeof di=== 'undefined') di={};
if(typeof di.ml === 'undefined') di.ml={};

if(typeof numeric === 'undefined') console.log("Warning: ml.GLM will not work without numeric.js library");


var GaussianLaw = function(means, covariances) {

  if (!(numeric.dim(covariances)[0] === numeric.dim(means)[0])) {
    throw new Error('Dimension mismatch (0) : '+numeric.dim(covariances)[0]+' '+numeric.dim(means)[0]);
  }
  if (!(numeric.dim(covariances)[1] === numeric.dim(means)[0])) {
    throw new Error('Dimension mismatch (1) : '+numeric.dim(covariances)[1]+' '+numeric.dim(means)[0]);
  }

  this.dimension = numeric.dim(means);
  this.means = means;
  this.covariances = covariances;
  this.precisions = covariances.inverse();
  this.cholesky = covariances.cholesky();
  this.determinant = covariances.determinant();
  this.determinantsqrt = Math.pow(this.determinant, -0.5);
  
  this.determinantlogsqrt = -0.5 * Math.log(this.determinant);
  this.pdfscale = Math.pow(2*Math.PI, -0.5*this.dimension);
  this.pdfscalelog = -0.5 * this.dimension * Math.log(2*Math.PI);
};

GaussianLaw.prototype.pdf = function(X) {
  var dA = numeric.dotVV(numeric.sub(X,this.means), numeric.dot(this.precisions, numeric.sub(X,this.means)));
  return this.pdfscale * this.determinantsqrt * Math.exp(-0.5*dA);
};

GaussianLaw.prototype.logpdf = function(X) {
  var dA = numeric.dotVV(numeric.sub(X,this.means), numeric.dot(this.precisions, numeric.sub(X,this.means)));
  return this.pdfscalelog + this.determinantlogsqrt + (-0.5*dA);
};

GaussianLaw.prototype.simulate = function() {
  var stdvec = [];
  for (var i=0; i<this.dimension; i++) {
    // Box Muller method
    var u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
    var v = 1 - Math.random();
    var g = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    stdvec.push(g);
  }
  var covvec = numeric.dot(this.cholesky, stdvec);
  return numeric.add(this.means, covvec);
};




let HMM = function(nbstates, obsdim) {
  //var a = this.stateTransitionMatrix =
  //  new HMMMatrices.HMMStateTransitionMatrix(aDef);
  var transmat = numeric.add(numeric.identity(nbstates), 0.1);
  this.stateTransitionMatrix = numeric.div(transmat, numeric.sum(transmat[0]));
  /*var b = this.observationProbabilityMatrix =
    new HMMMatrices.HMMObservationProbabilityMatrix(bDef);*/
  var g = [];
  var pi = [];
  var covars = numeric.identity(obsdim);
  var means = numeric.add(numeric.mul(covars[0], 0), 3+(i-0.5*nbstates)/nbstates); // to have different vectors  
  for (var i=0; i<nbstates; i++) {

    var gaussian = new GaussianLaw(means, covars); // FILL IN MORE ARGUMENTS
    g.push(gaussian);
    pi.push(1/nbstates);
  };
  this.observationProbabilityCPDs = g;
  this.initialStateDistributionMatrix = [pi]; // WARNING : nest in matrix for legacy reasons

  /*if (a.numberOfStates !== b.numberOfStates ||
      a.numberOfStates !== pi.numberOfStates) {
    throw new Error('ml.HMM: number of states mismatch.');
  }*/

  this.numberOfStates = nbstates;
  //this.numberOfObservationSymbols = b.numberOfObservationSymbols;
  this.dimensionOfObservations = obsdim;
};

HMM.prototype.numberOfStates = 0;
HMM.prototype.dimensionOfObservations = 0;
HMM.prototype.initialStateDistributionMatrix = null;
HMM.prototype.stateTransitionMatrix = null;
HMM.prototype.observationProbabilityCPDs = null;


HMM.prototype.simulateStates = function(pathLength, withObservations) {

  var states = [];
  var observations = [];

  for (var t=0; t<pathLength; t++) {
    states.push(-1); // dummy assignment to adjust vector length
    var nextprobas;
    if (t==0) {
      nextprobas = this.initialStateDistributionMatrix[0];
    }
    else
    {
      nextprobas = this.stateTransitionMatrix[states[t-1]];
    }
    var r = Math.random();
    var cumprob = 0;
    for (var s=0; s<this.numberOfStates; s++) {
      cumprob+= nextprobas[s];
      if ((states[t]<0) && (r<cumprob))
      {
        states[t] = s;
      }
    }
    if ((states[t]<0) || (states[t]>=this.numberOfStates))
    {
      throw new Error('states was not assigned properly');
    }
    if (withObservations)
    {
      observations.push(this.observationProbabilityCPDs[states[t]].simulate());
    }
  }
  var dico = {states: states};
  if (withObservations)
  {
    dico.observations = observations;
  }
  return dico
};

// Train model to fit the observations.
// This method will modify the model matrices.
// This is the solution 3 in chapter 4.3, implemented with code in chapter 7.
HMM.prototype.fitObservations = function(o, maxIters, verbose) {
  this._verifyObservations(o);

  var oldLogProb = -Infinity;

  for (var iter = 0; iter < maxIters; iter++) {
    var alphaPassResults = this._alphaPass(o);
    var alpha = alphaPassResults.alpha;
    if (verbose)
    {
      console.log(alpha);
    }
    var c = alphaPassResults.c;
    var beta = this._betaPass(c, o);
    if (verbose)
    {
      console.log(beta);
    }
    var gammaPassResults = this._gammaPass(alpha, beta, c, o);
    var gamma = gammaPassResults.gamma;
    var digamma = gammaPassResults.digamma;

    this._updateModel(gamma, digamma, o);

    var logProb = this._getLogProb(c);

    if (logProb <= oldLogProb) {
      break;
    }

    oldLogProb = logProb;
  }

  return iter;
};


HMM.prototype.getStateProbabilityPath = function(o) {
  this._verifyObservations(o);

  var T = o.length;
  var N = this.numberOfStates;

  var alphaPassResults = this._alphaPass(o);
  var alpha = alphaPassResults.alpha;
  var c = alphaPassResults.c;
  var beta = this._betaPass(c, o);
  var gammaPassResults = this._gammaPass(alpha, beta, c, o);
  var gamma = gammaPassResults.gamma;
  //var digamma = gammaPassResults.digamma;

  var probas = [];
  for (var t=0; t<T-1; t++) // WARNING : last Gamma is wrong
  {
    var vec = [];
    for (s=0; s<N; s++) {
      vec.push( gamma[t * N + s] );
    }
    probas.push(vec);
  }
  //probas.push[[null,null]]; // WARNING : last Gamma is wrong
  return probas;
};


// This is the 2nd part of chapter 7: The α-pass
HMM.prototype._alphaPass = function(o) {
  var n = this.numberOfStates;
  var a = this.stateTransitionMatrix;
  var b = this.observationProbabilityCPDs;
  var pi = this.initialStateDistributionMatrix;
  var T = o.length;

  var i, j, t;

  var c = new Float64Array(T);
  var alpha = new Float64Array(T * n);

  c[0] = 0;
  for (i = 0; i < n; i++) {
    alpha[0 * n + i] = pi[0][i] * b[i].pdf(o[0]);
    c[0] += alpha[0 * n + i];
  }

  c[0] = 1 / c[0];
  for (i = 0; i < n; i++) {
    alpha[0 * n + i] *= c[0];
  }

  for (t = 1; t < T; t++) {
    //c[t] = 0;
    for (i = 0; i < n; i++) {
      alpha[t * n + i] = 0;
      for (j = 0; j < n; j++) {
        alpha[t * n + i] +=
          alpha[(t - 1) * n + j] * a[j][i];
      }
      alpha[t * n + i] *= b[i].pdf(o[t]);
      c[t] += alpha[t * n + i];
    }

    c[t] = 1 / c[t];
    for (i = 0; i < n; i++) {
      alpha[t * n + i] *= c[t];
    }
  }

  return {
    c: c,
    alpha: alpha
  };
};

// Part 3 of chapter 7: The β-pass
HMM.prototype._betaPass = function(c, o) {
  var n = this.numberOfStates;
  var T = o.length;

  var i, j, t;

  var beta = new Float64Array(T * n);

  for (i = 0; i < n; i++) {
    beta[(T - 1) * n + i] = c[(T - 1)];
    //beta[(T - 1) * n + i] = 1;
  }

  for (t = T - 2; t >= 0; t--) {
    for (i = 0; i < n; i++) {
      beta[t * n + i] = 0;
      for (j = 0; j < n; j++) {
        beta[t * n + i] +=
          this.stateTransitionMatrix[i][j] *
          this.observationProbabilityCPDs[j].pdf(o[t + 1]) *
          beta[(t + 1) * n + j];
      }
      beta[t * n + i] *= c[t];
    }
  }

  return beta;
};

// Part 4 of chapter 7: Compute γt(i, j) and γt(i)
HMM.prototype._gammaPass = function(alpha, beta, c, o) {
  var n = this.numberOfStates;
  //var T = c.length;
  var T = o.length;

  // WARNING
  // should check that 'alpha', 'beta' and 'o' have same t-length
  // what is 'c ? seems useless

  var gamma = new Float64Array(T * n);
  var digamma = new Float64Array(T * n * n);

  // WARNING :
  // 'digamma' ('xi' on Wikipedia for Baum-Welsh) seems correct
  // but 'gamma' itself looks wrong

  var i, j, t;

  for (t = 0; t < T - 1; t++) {
    var denom = 0;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        denom +=
          alpha[t * n + i] * 
          this.stateTransitionMatrix[i][j] *
          this.observationProbabilityCPDs[j].pdf(o[t + 1]) *
          beta[(t + 1) * n + j];
      }
    }
    for (i = 0; i < n; i++) {
      gamma[t * n + i] = 0;
      for (j = 0; j < n; j++) {
        digamma[t * n * n + i * n + j] =
          (alpha[t * n + i] *
            this.stateTransitionMatrix[i][j] *
            this.observationProbabilityCPDs[j].pdf(o[t + 1]) *
            beta[(t + 1) * n + j]) / denom;
        gamma[t * n + i] += digamma[t * n * n + i * n + j];
      }
    }
  }

  return {
    gamma: gamma,
    digamma: digamma
  };
};

HMM.prototype._updateModel = function(gamma, digamma, o) {
  var n = this.numberOfStates;
  //var m = this.numberOfObservationSymbols;
  var T = o.length;
  var obsdim = this.dimensionOfObservations;

  var i, j, t, numer, denom;

  for (i = 0; i < n; i++) {
    this.initialStateDistributionMatrix[0][i] = gamma[0 * n + i];
  }

  for (i = 0; i < n; i++) {
    for (j = 0; j < n; j++) {
      numer = 0;
      denom = 0;
      for (t = 0; t < T - 1; t++) {
        numer += digamma[t * n * n + i * n + j];
        denom += gamma[t * n + i];
      }
      this.stateTransitionMatrix[i][j] = numer / denom;
    }
  }

  for (i = 0; i < n; i++) {
    // maximization step : wrt to means
    var newMeans = numeric.mul(this.observationProbabilityCPDs[i].means, 0); // null vector of correct dimension
    denom = 0;
    for (t = 0; t < T - 1; t++) {
      newMeans = numeric.add(newMeans, numeric.mul(gamma[t * n + i], o[t]));
      denom += gamma[t * n + i];
    }
    newMeans = numeric.div(newMeans, denom);

    // maximization step : wrt to covariances
    var newVars = numeric.mul(this.observationProbabilityCPDs[i].covariances, 0); // null matrix of correct dimension
    for (t = 0; t < T - 1; t++) {
      proba = gamma[t * n + i];
      for (j=0; j<obsdim; j++) {
        for (k=0; k<obsdim; k++) {
          newVars[j][k] = newVars[j][k] + proba * (o[t][j]-newMeans[j]) * (o[t][k]-newMeans[k]);
        }; // k
      }; // j
    };
    newVars = numeric.div(newVars, denom);
    this.observationProbabilityCPDs[i] = new GaussianLaw(newMeans, newVars);
  }
};


HMM.prototype._verifyObservations = function(o) {
  var T = o.length;
  //var m = this.numberOfObservationSymbols;
  var obsdim = this.dimensionOfObservations;

  for (var t = 0; t < T; t++) {
    /*if (typeof o[t] === 'number' && o[t] % 1 === 0 && o[t] >= 0 && o[t] < m) {
      continue;
    }*/
    if (o[t].length === obsdim ) {
      continue;
    }

    throw new Error('ml.HMM: ' + 'observations at t=' + t + ' is invalid.');
  }
};

// Part 6 of chapter 7: Compute log[P (O | λ)]
HMM.prototype._getLogProb = function(c) {
  var T = c.length;

  var logProb = 0;
  for (var t = 0; t < T; t++) { // WARNING : WRONG IF IS SET TO C=0
    logProb += Math.log(c[t]);
  }

  return -logProb;
};


di.ml.HMM=HMM;



})();