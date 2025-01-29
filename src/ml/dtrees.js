/**
 * Calculates the chi-squared statistic.
 * 
 * @param {Float32Array} observed - Observed frequencies.
 * @param {Float32Array} expected - Expected frequencies.
 * @returns {number} Chi-squared statistic value.
 */
function chiSquared(observed, expected) {
  let chiSq = 0;
  for (let i = 0; i < observed.length; i++) {
    chiSq += Math.pow(observed[i] - expected[i], 2) / expected[i];
  }
  return chiSq;
}

/**
 * Calculates observed and expected frequencies for a given attribute and target.
 * 
 * @param {Array<Object>} data - Dataset.
 * @param {string} attribute - Attribute to split data by.
 * @param {string} target - Target variable.
 * @returns {Object} Object containing observed frequencies, expected frequencies, and raw frequencies.
 */
function getFrequencies(data, attribute, target) {
  const attrValues = new Set(data.map(row => row[attribute]));
  const targetValues = new Set(data.map(row => row[target]));

  // Initialize frequency counters.
  const frequencies = new Map();
  const targetTotals = new Map();

  // Count frequencies.
  data.forEach(row => {
    const attrValue = row[attribute];
    const targetValue = row[target];

    if (!frequencies.has(attrValue)) {
      frequencies.set(attrValue, new Map());
    }
    if (!frequencies.get(attrValue).has(targetValue)) {
      frequencies.get(attrValue).set(targetValue, 0);
    }
    frequencies.get(attrValue).set(targetValue, frequencies.get(attrValue).get(targetValue) + 1);

    if (!targetTotals.has(targetValue)) {
      targetTotals.set(targetValue, 0);
    }
    targetTotals.set(targetValue, targetTotals.get(targetValue) + 1);
  });

  // Initialize observed and expected frequencies as Float32Array.
  const observed = new Float32Array(attrValues.size * targetValues.size);
  const expected = new Float32Array(attrValues.size * targetValues.size);

  let index = 0;
  frequencies.forEach((targetMap, attrValue) => {
    const total = Array.from(targetMap.values()).reduce((a, b) => a + b, 0);
    targetValues.forEach(targetValue => {
      const observedFreq = targetMap.get(targetValue) || 0;
      const expectedFreq = (total * targetTotals.get(targetValue)) / data.length;
      observed[index] = observedFreq;
      expected[index] = expectedFreq;
      index++;
    });
  });

  return { observed, expected, frequencies };
}

/**
 * Calculates Bhattacharyya similarity coefficient between two probability distributions.
 * 
 * @param {Float32Array} prob1 - First probability distribution.
 * @param {Float32Array} prob2 - Second probability distribution.
 * @returns {number} Bhattacharyya similarity coefficient (0 ≤ BC ≤ 1).
 */
function bhattacharyyaSimilarity(prob1, prob2) {
  let bc = 0;
  for (let i = 0; i < prob1.length; i++) {
    bc += Math.sqrt(prob1[i] * prob2[i]);
  }
  return bc;
}

/**
 * Finds the best attribute to split a node in a decision tree.
 * 
 * @param {Array<Object>} data - Dataset.
 * @param {Array<string>} attributes - Available attributes.
 * @param {string} target - Target variable.
 * @returns {Object} Object containing best attribute, merged frequencies, and chi-squared statistic.
 */
function findBestSplit(data, attributes, target) {
  let bestAttribute = null;
  let bestChiSq = 0;
  let bestFrequencies = {};

  attributes.forEach(attribute => {
    const { observed, expected, frequencies } = getFrequencies(data, attribute, target);
    const chiSq = chiSquared(observed, expected);

    if (chiSq > bestChiSq) {
      bestChiSq = chiSq;
      bestFrequencies = mergeCategories(frequencies);
      bestAttribute = attribute;
    }
  });

  bestFrequencies['bestAttribute'] = bestAttribute;
  return bestFrequencies;
}

/**
 * Combines two frequency dictionaries by summing corresponding values.
 * 
 * @param {Map} targetFrequencies1 - First frequency dictionary.
 * @param {Map} targetFrequencies2 - Second frequency dictionary.
 * @returns {Map} Combined frequency dictionary.
 */
function combineFrequencies(targetFrequencies1, targetFrequencies2) {
  const result = new Map(targetFrequencies1);
  targetFrequencies2.forEach((value, key) => {
    result.set(key, (result.get(key) || 0) + value);
  });
  return result;
}

/**
 * Merges similar categories in a frequency dictionary based on Bhattacharyya similarity.
 * 
 * @param {Map} frequencies - Frequency dictionary with categories as keys.
 * @returns {Object} Object containing merged frequency dictionary, category-to-group mapping, and group-to-categories mapping.
 */
function mergeCategories(frequencies) {
  const categories = Array.from(frequencies.keys());
  const categoryToGroup = new Map();
  const groupToCategories = new Map();
  const groupFrequencies = new Map();

  for (let i = 0; i < categories.length; i++){
	category=categories[i];
    if (categoryToGroup.has(category)) continue;

    categoryToGroup.set(category, category);
    groupToCategories.set(category, [category]);

    for (let j = i + 1; j < categories.length; j++) {
      const otherCategory = categories[j];
      if (categoryToGroup.has(otherCategory)) continue;

      const similarity = bhattacharyyaSimilarity(
        new Float32Array(Array.from(frequencies.get(category).values())),
        new Float32Array(Array.from(frequencies.get(otherCategory).values()))
      );

      if (similarity > 0.9) {
        categoryToGroup.set(otherCategory, category);
        groupToCategories.get(category).push(otherCategory);
      }
    }
  };

  return { groupFrequencies, categoryToGroup, groupToCategories };
}

/**
 * Calculates the frequency of each target value in a dataset.
 * 
 * @param {Array<Object>} data - Dataset.
 * @param {string} target - Target variable.
 * @returns {Float32Array} Float32Array with target value frequencies.
 */
function getTargetFrequencies(data, target) {
  const targetCounts = new Map();
  const totalCount = data.length;

  data.forEach(row => {
    const targetValue = row[target];
    targetCounts.set(targetValue, (targetCounts.get(targetValue) || 0) + 1 / totalCount);
  });

  return new Float32Array(Array.from(targetCounts.values()));
}

/**
 * Recursively builds a decision tree.
 * 
 * @param {Array<Object>} data - Dataset.
 * @param {Array<string>} attributes - Available attributes.
 * @param {string} target - Target variable.
 * @param {number} [maxDepth=3] - Maximum tree depth.
 * @param {number} [minLeaf=1] - Minimum instances per leaf.
 * @returns {Object|null} Decision tree node or null.
 */
function buildTree(data, attributes, target, maxDepth = 3, minLeaf = 1) {
  if (attributes.length === 0 || data.length === 0 || maxDepth == 0) {
    return null;
  }

  const { bestAttribute, categoryToGroup, groupFrequencies } = findBestSplit(data, attributes, target);

  if (!bestAttribute) {
    return null;
  }

  const node = {
    attribute: bestAttribute,
    children: {},
    isLeaf: true,
    value: getTargetFrequencies(data, target),
    categoryToGroup,
  };

  groupFrequencies.forEach((group, key) => {
    const subset = data.filter(row => categoryToGroup.get(row[bestAttribute]) === key);

    if (subset.length > minLeaf && maxDepth > 0) {
      const child = buildTree(
        subset,
        attributes.filter(attr => attr !== bestAttribute),
        target,
        maxDepth - 1
      );

      if (child) {
        node.children[bestAttribute + ":" + key] = child;
      }
    }
  });

  node.isLeaf = Object.keys(node.children).length === 0;
  return node;
}

/**
 * Predicts the target value for a single instance using the decision tree.
 * 
 * @param {Object} tree - Decision tree.
 * @param {Object} instance - Instance to predict.
 * @returns {Float32Array|null} Predicted target value frequencies or null.
 */
function predict(tree, instance) {
  if (tree.isLeaf) {
    return tree.value;
  }

  const attrValue = instance[tree.attribute];
  const childNode = tree.children[tree.attribute + ":" + tree.categoryToGroup.get(attrValue)];

  if (!childNode) {
    return null;
  }

  return predict(childNode, instance);
}
