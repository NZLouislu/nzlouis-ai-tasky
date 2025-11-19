// Test file to verify Jira project sorting logic

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
}

interface Platform {
  id: string;
  name: string;
  projects: Array<{
    id: string;
    platformProjectId: string;
    projectName: string;
  }>;
}

// Test data
const platforms: Platform[] = [
  {
    id: 'jira',
    name: 'jira',
    projects: [
      { id: '1', platformProjectId: 'JMS', projectName: 'jira-md-sync' },
      { id: '2', platformProjectId: 'JMST', projectName: 'jira-md-sync-testing' }
    ]
  }
];

const allJiraProjects: JiraProject[] = [
  { id: '1', key: 'JMS', name: 'jira-md-sync', description: 'Project 1' },
  { id: '2', key: 'JMST', name: 'jira-md-sync-testing', description: 'Project 2' },
  { id: '3', key: 'MDP', name: 'My Dev Project', description: 'Project 3' },
  { id: '4', key: 'SCRUM', name: 'Scrum Board', description: 'Project 4' }
];

// Extract existing project keys
function getExistingProjectKeys(platforms: Platform[]): string[] {
  const jiraPlatform = platforms.find((p) => p.name === 'jira');
  return jiraPlatform?.projects.map((proj) => proj.platformProjectId) || [];
}

// Sort projects: unconnected first, then connected
function sortProjects(projects: JiraProject[], existingKeys: string[]): JiraProject[] {
  const unselected = projects.filter((p) => !existingKeys.includes(p.key));
  const selected = projects.filter((p) => existingKeys.includes(p.key));
  return [...unselected, ...selected];
}

// Run tests
console.log('\n=== Test 1: Extract existing project keys ===');
const existingKeys = getExistingProjectKeys(platforms);
console.log('Existing project keys:', existingKeys);
console.log('Expected: ["JMS", "JMST"]');
console.log('Test 1 PASSED:', JSON.stringify(existingKeys) === JSON.stringify(['JMS', 'JMST']));

console.log('\n=== Test 2: Sort projects ===');
const sorted = sortProjects(allJiraProjects, existingKeys);
console.log('Sorted projects:');
sorted.forEach((p, i) => {
  const isConnected = existingKeys.includes(p.key);
  console.log(`  ${i + 1}. ${p.key} - ${p.name} ${isConnected ? '(CONNECTED)' : ''}`);
});

const expectedOrder = ['MDP', 'SCRUM', 'JMS', 'JMST'];
const actualOrder = sorted.map(p => p.key);
console.log('\nExpected order:', expectedOrder);
console.log('Actual order:', actualOrder);
console.log('Test 2 PASSED:', JSON.stringify(actualOrder) === JSON.stringify(expectedOrder));

console.log('\n=== Test 3: Check connected projects are at the end ===');
const firstTwoAreUnconnected = !existingKeys.includes(sorted[0].key) && !existingKeys.includes(sorted[1].key);
const lastTwoAreConnected = existingKeys.includes(sorted[2].key) && existingKeys.includes(sorted[3].key);
console.log('First two are unconnected:', firstTwoAreUnconnected);
console.log('Last two are connected:', lastTwoAreConnected);
console.log('Test 3 PASSED:', firstTwoAreUnconnected && lastTwoAreConnected);

console.log('\n=== All Tests Summary ===');
const allTestsPassed = 
  JSON.stringify(existingKeys) === JSON.stringify(['JMS', 'JMST']) &&
  JSON.stringify(actualOrder) === JSON.stringify(expectedOrder) &&
  firstTwoAreUnconnected && lastTwoAreConnected;
console.log(allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
