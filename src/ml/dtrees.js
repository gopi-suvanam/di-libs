/**
 * Calculates the chi-squared statistic.
 * 
 * @param {Array<number>} observed - Observed frequencies.
 * @param {Array<number>} expected - Expected frequencies.
 * @returns {number} Chi-squared statistic value.
 */
function chiSquared(observed, expected) {
  // Initialize chi-squared statistic to 0.
  let chiSq = 0;

  // Iterate over observed frequencies.
  for (let i in observed) {
    // For each category, calculate the squared difference between observed and expected frequencies,
    // divided by the expected frequency. Add to the total chi-squared statistic.
    chiSq += Math.pow(observed[i] - (expected[i] || 0), 2) / (expected[i] || 0);
  }

  // Return the calculated chi-squared statistic.
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
  // Initialize frequency counters.
  let frequencies = {};
  let targetTotals = {};

  // Iterate over data to count frequencies.
  data.forEach(row => {
    let attrValue = row[attribute];
    let targetValue = row[target];

    // Initialize frequency object for attribute value if needed.
    if (!frequencies[attrValue]) {
      frequencies[attrValue] = {};
    }

    // Initialize frequency counter for attribute-target pair if needed.
    if (!frequencies[attrValue][targetValue]) {
      frequencies[attrValue][targetValue] = 0;
    }

    // Increment frequency counter.
    frequencies[attrValue][targetValue]++;

    // Initialize target total counter if needed.
    if (!targetTotals[targetValue]) {
      targetTotals[targetValue] = 0;
    }

    // Increment target total counter.
    targetTotals[targetValue]++;
  });

  // Initialize observed and expected frequency objects.
  let observed = {};
  let expected = {};

  // Calculate observed and expected frequencies.
  for (let attrValue in frequencies) {
    // Calculate total frequency for attribute value.
    let total = Object.values(frequencies[attrValue]).reduce((a, b) => a + b, 0);

    for (let targetValue in targetTotals) {
      // Calculate observed frequency.
      observed[attrValue + ":" + targetValue] = frequencies[attrValue][targetValue] || 0;

      // Calculate expected frequency using total and target totals.
      expected[attrValue + ":" + targetValue] = (total * targetTotals[targetValue]) / data.length;

      // Normalize frequency for attribute-target pair.
      if (targetValue in frequencies[attrValue]) {
        frequencies[attrValue][targetValue] = frequencies[attrValue][targetValue] / total;
      }
    }
  }

  // Return observed frequencies, expected frequencies, and raw frequencies.
  return { observed, expected, frequencies };
}

/**
 * Calculates Bhattacharyya similarity coefficient between two probability distributions.
 * 
 * @param {Object<number>} dict1 - First probability distribution.
 * @param {Object<number>} dict2 - Second probability distribution.
 * @returns {number} Bhattacharyya similarity coefficient (0 ≤ BC ≤ 1).
 */
function bhattacharyyaSimilarity(dict1, dict2) {
  // Initialize Bhattacharyya coefficient.
  let bc = 0;

  // Calculate sum of probabilities for each distribution.
  const sum1 = Object.values(dict1).reduce((a, b) => a + b, 0);
  const sum2 = Object.values(dict2).reduce((a, b) => a + b, 0);

  // Iterate over keys in dict1.
  for (let key in dict1) {
    // Calculate Bhattacharyya coefficient for each corresponding probability pair.
    bc += Math.sqrt((dict1[key] * (dict2[key] || 0)) / (sum1 * sum2));
  }

  // Return Bhattacharyya similarity coefficient.
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
  // Initialize variables.
  let bestAttribute = null;
  let bestChiSq = 0;
  let bestFrequencies = {};

  // Iterate over attributes.
  attributes.forEach(attribute => {
    // Calculate observed and expected frequencies for attribute.
    let { observed, expected, frequencies } = getFrequencies(data, attribute, target);

    // Calculate chi-squared statistic.
    let chiSq = chiSquared(observed, expected);

    // Update best attribute if chi-squared statistic improves.
    if (chiSq > bestChiSq) {
      bestChiSq = chiSq;
      bestFrequencies = mergeCategories(frequencies);
      bestAttribute = attribute;
    }
  });

  // Store best attribute in frequencies object.
  bestFrequencies['bestAttribute'] = bestAttribute;

  // Return best frequencies and attribute.
  return bestFrequencies;
}

/**
 * Combines two frequency dictionaries by summing corresponding values.
 * 
 * @param {Object<number>} targetFrequencies1 - First frequency dictionary.
 * @param {Object<number>} targetFrequencies2 - Second frequency dictionary.
 * @returns {Object<number>} Combined frequency dictionary.
 */
function combineFrequencies(targetFrequencies1, targetFrequencies2) {
  // Get all unique keys from both dictionaries.
  const allKeys = [...new Set([...Object.keys(targetFrequencies1), ...Object.keys(targetFrequencies2)])];

  // Initialize the result dictionary.
  const result = {};

  // Iterate through each key and sum the values from both dictionaries.
  allKeys.forEach(key => {
    // Use || 0 to default to 0 if key is missing in either dictionary.
    result[key] = (targetFrequencies1[key] || 0) + (targetFrequencies2[key] || 0);
  });

  // Return the combined frequency dictionary.
  return result;
}





/**
 * Merges similar categories in a frequency dictionary based on Bhattacharyya similarity.
 * 
 * @param {Object<Object<number>>} frequencies - Frequency dictionary with categories as keys.
 * @returns {Object} Object containing merged frequency dictionary, category-to-group mapping, and group-to-categories mapping.
 */
function mergeCategories(frequencies) {
  // Initialize variables.
  let categories = Object.keys(frequencies);
  let merged = {};
  let categoryToGroup = {};
  let groupToCategories = {};
  let groupFrequencies = {};

  // Iterate over categories.
  for (let i = 0; i < categories.length; i++) {
    // Skip already merged categories.
    if (categoryToGroup[categories[i]]) continue;

    // Initialize category-to-group and group-to-categories mappings.
    categoryToGroup[categories[i]] = categories[i];
    groupToCategories[categories[i]] = [categories[i]];

    // Compare with remaining categories.
    for (let j = i + 1; j < categories.length; j++) {
      // Skip already merged categories.
      if (categoryToGroup[categories[j]]) continue;

      // Calculate Bhattacharyya similarity.
      let similarity = bhattacharyyaSimilarity(frequencies[categories[i]], frequencies[categories[j]]);

      // Merge categories if similarity exceeds threshold (adjust as needed).
      if (similarity > 0.9) {
        categoryToGroup[categories[j]] = categories[i];
        groupToCategories[categories[i]].push(categories[j]);
      }
    }
  }
    // Return merged frequency dictionary, category-to-group mapping, and group-to-categories mapping.
  return { groupFrequencies, categoryToGroup, groupToCategories };

}


  
/**
 * Calculates the frequency of each target value in a dataset.
 * 
 * @param {Array<Object>} data - Dataset.
 * @param {string} target - Target variable.
 * @returns {Object<number>} Object with target values as keys and frequencies as values.
 */
function getTargetFrequencies(data, target) {
  // Initialize object to store target value frequencies.
  let targetCounts = {};

  // Total number of data points.
  const totalCount = data.length;

  // Iterate over data points.
  data.forEach(row => {
    // Initialize count for target value if needed.
    if (!targetCounts[row[target]]) {
      targetCounts[row[target]] = 0;
    }

    // Increment count and normalize by total count.
    targetCounts[row[target]] += 1 / totalCount;
  });

  // Return object with target value frequencies.
  return targetCounts;
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
  // Base cases: no attributes, no data, or max depth reached.
  if (attributes.length === 0 || data.length === 0 || maxDepth == 0) {
    return null;
  }

  // Find best attribute to split data.
  let {
    bestAttribute,
    categoryToGroup,
    groupFrequencies,
    groupToCategories
  } = findBestSplit(data, attributes, target);

  // No suitable attribute found.
  if (!bestAttribute) {
    return null;
  }

  // Initialize node.
  let node = {
    attribute: bestAttribute,
    children: {},
    isLeaf: true
  };

  // Store target value frequencies.
  node['value'] = getTargetFrequencies(data, target);

  // Store category grouping information.
  node['categoryToGroup'] = categoryToGroup;

  // Recursively build child nodes.
  Object.keys(groupFrequencies).forEach(group => {
    const subset = data.filter(row => categoryToGroup[row[bestAttribute]] == group);

    // Only recurse if subset has enough instances and depth allows.
    if (subset.length > minLeaf && maxDepth > 0) {
      const child = buildTree(
        subset,
        attributes.filter(attr => attr !== bestAttribute),
        target,
        maxDepth - 1
      );

      // Add child node if it exists.
      if (child) {
        node.children[bestAttribute + ":" + group] = child;
      }
    }
  });

  // Mark node as leaf if no children.
  node['isLeaf'] = Object.keys(node.children).length === 0;

  console.log("Returning one node");

  return node;
}




/**
* Predicts the target value for a single instance using the decision tree.
 * 
 * @param {Object} tree - Decision tree.
 * @param {Object} instance - Instance to predict.
 * @returns {Object|null} Predicted target value frequencies or null.
 */
function predict(tree, instance) {
  // Leaf node: return target value frequencies.
  if (tree.isLeaf) {
    return tree.value;
  }

  // Get attribute value from instance.
  let attrValue = instance[tree.attribute];

  // Get child node based on attribute value and category grouping.
  let childNode = tree.children[tree.attribute + ":" + tree['categoryToGroup'][attrValue]];

  // No child node found: return null or default value.
  if (!childNode) {
    // Consider returning the most common target value in the current node instead of null.
    // return getMostCommonTargetValue(tree.value);
    return null;
  }

  // Recursively predict using child node.
  return predict(childNode, instance);
}

