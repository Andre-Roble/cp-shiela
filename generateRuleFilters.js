const fs = require('fs');

// Load rules and template files
const urlFilters = JSON.parse(fs.readFileSync('rules.json', 'utf-8'));
const template = JSON.parse(fs.readFileSync('rulefilters_template.json', 'utf-8'));

const ruleFilters = urlFilters.map((url, index) => {
  return {
    ...template,
    id: index + 1,            // Increment ID for each rule
    condition: {
      ...template.condition,
      urlFilter: url          // Set the urlFilter dynamically
    }
  };
});

// Save the generated rules to rulefilters.json
fs.writeFileSync('rulefilters.json', JSON.stringify(ruleFilters, null, 2));
