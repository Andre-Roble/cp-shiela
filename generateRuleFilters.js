const fs = require('fs');

// Load rules and template files
const urlFilters = JSON.parse(fs.readFileSync('rules.json', 'utf-8'));
const template = JSON.parse(fs.readFileSync('rulefilters_template.json', 'utf-8'));

// Generate rule filters from URL filters and template
const ruleFilters = urlFilters.map((rule, index) => {
  // If the rule is a string, treat it as a URL with default priority 1
  if (typeof rule === 'string') {
    return {
      ...template,
      id: index + 1,
      condition: {
        ...template.condition,
        urlFilter: rule,  // Set the urlFilter dynamically
      },
      priority: 1  // Default priority if no priority is specified
    };
  }

  // If the rule is an object with URL and priority
  return {
    ...template,
    id: index + 1,
    condition: {
      ...template.condition,
      urlFilter: rule.url,  // Set the urlFilter dynamically
    },
    priority: rule.priority || 1  // Use the specified priority or default to 1
  };
});

// Save the generated rules to rulefilters.json
fs.writeFileSync('rulefilters.json', JSON.stringify(ruleFilters, null, 2));

console.log('Rule filters generated and saved to rulefilters.json');

//terminal command
// node generateRuleFilters.js