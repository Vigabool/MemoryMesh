/**
 * queryGraph.js
 * 
 * Utility for querying and exploring the knowledge graph.
 * This script provides a simple command-line interface for exploring the graph.
 */

const fs = require('fs');
const path = require('path');

// Memory file path
const MEMORY_FILE_PATH = path.join(__dirname, '../dist/data/memory.json');

/**
 * Load the knowledge graph from the memory file
 * @returns {Object} - The knowledge graph data
 */
function loadGraph() {
  try {
    const content = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error loading knowledge graph:', error);
    process.exit(1);
  }
}

/**
 * Find nodes by name, type, or query string
 * @param {Array<Object>} graph - The knowledge graph data
 * @param {string} query - Search query
 * @returns {Array<Object>} - Matching nodes
 */
function findNodes(graph, query) {
  const nodes = graph.filter(item => item.type === 'node');
  
  if (!query) {
    return nodes;
  }
  
  // Check if this is a type query (e.g., "type:idea")
  if (query.includes(':')) {
    const [field, value] = query.split(':').map(part => part.trim().toLowerCase());
    
    if (field === 'type' || field === 'nodetype') {
      return nodes.filter(node => 
        node.nodeType && node.nodeType.toLowerCase() === value
      );
    }
    
    if (field === 'tag') {
      // Return nodes that have this tag
      const edges = graph.filter(item => 
        item.type === 'edge' && 
        item.edgeType === 'tagged_with' && 
        item.to.toLowerCase() === value
      );
      
      const nodeNames = new Set(edges.map(edge => edge.from));
      return nodes.filter(node => nodeNames.has(node.name));
    }
  }
  
  // General search
  const queryLower = query.toLowerCase();
  return nodes.filter(node => {
    // Search in name
    if (node.name && node.name.toLowerCase().includes(queryLower)) {
      return true;
    }
    
    // Search in metadata
    if (node.metadata && Array.isArray(node.metadata)) {
      return node.metadata.some(item => 
        item.toLowerCase().includes(queryLower)
      );
    }
    
    return false;
  });
}

/**
 * Find edges connecting to a node
 * @param {Array<Object>} graph - The knowledge graph data
 * @param {string} nodeName - Name of the node
 * @returns {Object} - Incoming and outgoing edges
 */
function findEdges(graph, nodeName) {
  const edges = graph.filter(item => item.type === 'edge');
  
  const outgoing = edges.filter(edge => edge.from === nodeName);
  const incoming = edges.filter(edge => edge.to === nodeName);
  
  return { outgoing, incoming };
}

/**
 * Display a node with its relationships
 * @param {Object} node - The node to display
 * @param {Object} edges - The node's edges
 * @param {Array<Object>} graph - The knowledge graph data
 */
function displayNode(node, edges, graph) {
  console.log('\n='.repeat(50));
  console.log(`Node: ${node.name} (${node.nodeType})`);
  console.log('='.repeat(50));
  
  if (node.metadata && node.metadata.length > 0) {
    console.log('\nMetadata:');
    node.metadata.forEach(item => console.log(`- ${item}`));
  }
  
  if (edges.outgoing.length > 0) {
    console.log('\nOutgoing Relationships:');
    edges.outgoing.forEach(edge => {
      console.log(`- ${edge.edgeType} -> ${edge.to}`);
    });
  }
  
  if (edges.incoming.length > 0) {
    console.log('\nIncoming Relationships:');
    edges.incoming.forEach(edge => {
      console.log(`- ${edge.from} -> ${edge.edgeType} -> ${node.name}`);
    });
  }
}

/**
 * Interactive mode for exploring the graph
 */
function interactiveMode() {
  const graph = loadGraph();
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('VigVault Knowledge Graph Explorer');
  console.log('=================================');
  console.log('Enter a search query, node name, or command:');
  console.log('- "help" for help');
  console.log('- "stats" for graph statistics');
  console.log('- "exit" to quit');
  
  readline.setPrompt('> ');
  readline.prompt();
  
  readline.on('line', (line) => {
    const input = line.trim();
    
    if (input === 'exit' || input === 'quit') {
      readline.close();
      return;
    }
    
    if (input === 'help') {
      console.log('\nAvailable commands:');
      console.log('- search [query]          : Search for nodes');
      console.log('- type:[nodeType]         : Find nodes by type (e.g., type:idea)');
      console.log('- tag:[tagName]           : Find nodes with a specific tag (e.g., tag:coding)');
      console.log('- node [name]             : Display a specific node');
      console.log('- stats                   : Show graph statistics');
      console.log('- exit, quit              : Exit the program');
      readline.prompt();
      return;
    }
    
    if (input === 'stats') {
      const nodes = graph.filter(item => item.type === 'node');
      const edges = graph.filter(item => item.type === 'edge');
      const nodeTypes = [...new Set(nodes.map(node => node.nodeType))];
      const edgeTypes = [...new Set(edges.map(edge => edge.edgeType))];
      
      console.log('\nKnowledge Graph Statistics:');
      console.log(`- Total Nodes: ${nodes.length}`);
      console.log(`- Total Edges: ${edges.length}`);
      console.log(`- Node Types: ${nodeTypes.join(', ')}`);
      console.log(`- Edge Types: ${edgeTypes.join(', ')}`);
      
      // Node type distribution
      console.log('\nNode Type Distribution:');
      const nodeTypeCounts = {};
      nodes.forEach(node => {
        nodeTypeCounts[node.nodeType] = (nodeTypeCounts[node.nodeType] || 0) + 1;
      });
      
      Object.entries(nodeTypeCounts).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
      });
      
      readline.prompt();
      return;
    }
    
    if (input.startsWith('node ')) {
      const nodeName = input.substring(5).trim();
      const node = graph.find(item => 
        item.type === 'node' && item.name === nodeName
      );
      
      if (node) {
        const edges = findEdges(graph, nodeName);
        displayNode(node, edges, graph);
      } else {
        console.log(`Node '${nodeName}' not found.`);
      }
      
      readline.prompt();
      return;
    }
    
    // Default: search
    const nodes = findNodes(graph, input);
    
    if (nodes.length === 0) {
      console.log('No matching nodes found.');
    } else {
      console.log(`\nFound ${nodes.length} matching nodes:`);
      nodes.forEach(node => {
        const metadataPreview = node.metadata && node.metadata.length > 0
          ? node.metadata[0]
          : '';
        console.log(`- ${node.name} (${node.nodeType}) ${metadataPreview}`);
      });
      
      if (nodes.length === 1) {
        // If only one node found, display it
        const edges = findEdges(graph, nodes[0].name);
        displayNode(nodes[0], edges, graph);
      }
    }
    
    readline.prompt();
  });
  
  readline.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });
}

// Process command-line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Interactive mode
    interactiveMode();
  } else if (args[0] === 'search' && args.length > 1) {
    // Search mode
    const query = args.slice(1).join(' ');
    const graph = loadGraph();
    const nodes = findNodes(graph, query);
    
    if (nodes.length === 0) {
      console.log('No matching nodes found.');
    } else {
      console.log(`\nFound ${nodes.length} matching nodes:`);
      nodes.forEach(node => {
        console.log(`- ${node.name} (${node.nodeType})`);
      });
    }
  } else if (args[0] === 'node' && args.length > 1) {
    // Show node mode
    const nodeName = args[1];
    const graph = loadGraph();
    const node = graph.find(item => 
      item.type === 'node' && item.name === nodeName
    );
    
    if (node) {
      const edges = findEdges(graph, nodeName);
      displayNode(node, edges, graph);
    } else {
      console.log(`Node '${nodeName}' not found.`);
    }
  } else {
    console.log('Usage:');
    console.log('  node queryGraph.js                  : Interactive mode');
    console.log('  node queryGraph.js search [query]   : Search for nodes');
    console.log('  node queryGraph.js node [name]      : Display a specific node');
  }
}

module.exports = {
  loadGraph,
  findNodes,
  findEdges
};
