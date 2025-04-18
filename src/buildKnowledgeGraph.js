/**
 * buildKnowledgeGraph.js
 * 
 * Processes VigVault files and builds the knowledge graph.
 * This script creates the memory.json file used by MemoryMesh.
 */

const fs = require('fs');
const path = require('path');
const { processVigVaultFiles } = require('./VigVaultParser');

// Memory file path
const MEMORY_FILE_PATH = path.join(__dirname, '../dist/data/memory.json');

/**
 * Process VigVault files and build the knowledge graph
 */
async function buildKnowledgeGraph() {
  console.log('Starting knowledge graph build process...');
  
  // Get nodes and relationships from VigVault
  const { nodes, relationships } = processVigVaultFiles();
  
  console.log(`Extracted ${nodes.length} nodes and ${relationships.length} relationships`);
  
  // Format nodes for MemoryMesh
  const formattedNodes = nodes.map(node => ({
    type: 'node',
    ...node
  }));
  
  // Format relationships for MemoryMesh
  const formattedRelationships = relationships.map(rel => ({
    type: 'edge',
    ...rel
  }));
  
  // Combine all data
  const graphData = [...formattedNodes, ...formattedRelationships];
  
  // Format each object as a JSON line
  const jsonLines = graphData.map(item => JSON.stringify(item)).join('\n');
  
  // Write to the memory file
  fs.writeFileSync(MEMORY_FILE_PATH, jsonLines);
  
  console.log(`Knowledge graph built successfully with ${graphData.length} total items`);
  console.log(`Memory file written to: ${MEMORY_FILE_PATH}`);

  // Display some statistics
  const nodeTypes = new Set(nodes.map(node => node.nodeType));
  const edgeTypes = new Set(relationships.map(rel => rel.edgeType));
  
  console.log('\nKnowledge Graph Statistics:');
  console.log('==========================');
  console.log(`Total Nodes: ${nodes.length}`);
  console.log(`Total Edges: ${relationships.length}`);
  console.log(`Node Types: ${Array.from(nodeTypes).join(', ')}`);
  console.log(`Edge Types: ${Array.from(edgeTypes).join(', ')}`);
  
  const nodeTypeCounts = {};
  nodes.forEach(node => {
    nodeTypeCounts[node.nodeType] = (nodeTypeCounts[node.nodeType] || 0) + 1;
  });
  
  console.log('\nNode Type Distribution:');
  Object.entries(nodeTypeCounts).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
}

// Check if file is being run directly
if (require.main === module) {
  // Run the build process
  buildKnowledgeGraph()
    .then(() => console.log('Build completed successfully'))
    .catch(error => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}

module.exports = {
  buildKnowledgeGraph
};
