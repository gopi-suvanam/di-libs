(()=>{

if(typeof di=== 'undefined') di={};

let performance = {};
performance.r2 = (observed, predicted) => {
  const meanObserved = observed.reduce((acc, val) => acc + val, 0) / observed.length;
  const ssTotal = observed.reduce((acc, val) => acc + (val - meanObserved) ** 2, 0);
  const ssResidual = observed.reduce((acc, val, i) => acc + (val - predicted[i]) ** 2, 0);
  return 1 - (ssResidual / ssTotal);
};

function calculateAUCFromROC(rocCurve) {
  let auc = 0;
  for (let i = 1; i < rocCurve.length; i++) {
    const dx = rocCurve[i][0] - rocCurve[i - 1][0];
    const ySum = rocCurve[i][1] + rocCurve[i - 1][1];
    auc += 0.5 * dx * ySum;
  }
  return auc;
}

performance.roc=function(predictedProbabilities, actualClasses) {
  if (predictedProbabilities.length !== actualClasses.length) {
    throw new Error('Arrays must have the same length');
  }

  // Combine predicted probabilities and actual classes into an array of objects
  const data = predictedProbabilities.map((prob, i) => ({ prob, actual: actualClasses[i] }));

  // Sort data by predicted probability in descending order
  data.sort((a, b) => b.prob - a.prob);

  const rocCurve = [];
  let truePositives = 0;
  let falsePositives = 0;
  let totalPositives = data.reduce((acc, item) => acc + item.actual, 0);
  let totalNegatives = data.length - totalPositives;

  for (let i = 0; i < data.length; i++) {
    if (data[i].actual === 1) {
      truePositives++;
    } else {
      falsePositives++;
    }

    // Calculate false positive rate (FPR) and true positive rate (TPR)
    const fpr = falsePositives / totalNegatives;
    const tpr = truePositives / totalPositives;

    // Add FPR and TPR as a tuple to the ROC curve array
    rocCurve.push([fpr, tpr]);
  }

  // Calculate AUC from the ROC curve using the function
  const auc = calculateAUCFromROC(rocCurve);
  const gini=2*auc-1;

  return { rocCurve, auc, gini };
}


performance.accuracy=function(predictedProbabilities, actualClasses, threshold = 0.5) {
  if (predictedProbabilities.length !== actualClasses.length) {
    throw new Error('Arrays must have the same length');
  }

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  for (let i = 0; i < predictedProbabilities.length; i++) {
    const predictedClass = predictedProbabilities[i] >= threshold ? 1 : 0;
    const actualClass = actualClasses[i];

    if (predictedClass === 1 && actualClass === 1) {
      truePositives++;
    } else if (predictedClass === 1 && actualClass === 0) {
      falsePositives++;
    } else if (predictedClass === 0 && actualClass === 1) {
      falseNegatives++;
    } else if (predictedClass === 0 && actualClass === 0) {
      trueNegatives++;
    }
  }

  const accuracy = (truePositives + trueNegatives) / predictedProbabilities.length;

  const sensitivity = truePositives / (truePositives + falseNegatives);
  const specificity = trueNegatives / (trueNegatives + falsePositives);
  const precision = truePositives / (truePositives + falsePositives);
  const recall = sensitivity; // Recall is synonymous with sensitivity
  const f1Score = 2 * (precision * recall) / (precision + recall);

  return {
    accuracy,
    sensitivity,
    specificity,
    precision,
    recall,
    f1Score
  };
}

di.performance=performance;

})();