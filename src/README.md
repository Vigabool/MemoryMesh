# VigVault + MemoryMesh Integration

This directory contains the scripts needed to integrate VigVault with MemoryMesh, creating a dynamic knowledge graph of your ideas, knowledge, projects, and their relationships.

## Setup

1. Install the required dependencies:

```bash
cd /Users/nickvigdahl/Desktop/VigVault/Codebases/MemoryMesh/src
npm install
```

## Usage

### Building the Knowledge Graph

To build the knowledge graph from your VigVault files:

```bash
cd /Users/nickvigdahl/Desktop/VigVault/Codebases/MemoryMesh/src
node buildKnowledgeGraph.js
```

This will:
- Parse all markdown files in specified VigVault directories
- Extract nodes (ideas, knowledge, projects, tags, topics)
- Extract relationships between nodes
- Build the memory.json file for MemoryMesh
- Display statistics about the generated graph

### Exploring the Knowledge Graph

A simple interactive explorer is included to help you browse the graph:

```bash
cd /Users/nickvigdahl/Desktop/VigVault/Codebases/MemoryMesh/src
node queryGraph.js
```

In interactive mode, you can use these commands:
- `search [query]`: Find nodes containing the query text
- `type:[nodeType]`: Find nodes of a specific type (e.g., `type:idea`)
- `tag:[tagName]`: Find nodes with a specific tag (e.g., `tag:coding`)
- `node [name]`: Display a specific node and its relationships
- `stats`: Show graph statistics
- `help`: Show available commands
- `exit` or `quit`: Exit the program

You can also use the explorer in command-line mode:

```bash
# Search for nodes
node queryGraph.js search coding

# Display a specific node
node queryGraph.js node MemoryMesh
```

## File Structure

- `VigVaultParser.js`: Core parser that extracts data from markdown files
- `buildKnowledgeGraph.js`: Builds the memory.json file for MemoryMesh
- `queryGraph.js`: Simple utility for exploring the knowledge graph
- `package.json`: Node.js package configuration

## Integration with Claude

When using Claude, you can use MemoryMesh MCP tools to interact with the knowledge graph:

- `add_idea`: Create a new idea node
- `add_knowledge`: Create a new knowledge node
- `add_project`: Create a new project node
- `add_tag`: Create a new tag node
- `add_topic`: Create a new topic node
- `search_nodes`: Search for nodes by name or metadata
- `open_nodes`: Retrieve specific nodes by name
- `add_edges`: Create new relationships between nodes

## Maintenance

To keep your knowledge graph in sync with your VigVault files, you can:

1. Periodically run `buildKnowledgeGraph.js` to rebuild the entire graph
2. In the future, implement file system watchers to automatically update the graph when files change

## Troubleshooting

If you encounter issues:

1. Check that the paths in `VigVaultParser.js` match your actual VigVault directory structure
2. Verify that the `memory.json` file is being created in the correct location
3. Make sure MemoryMesh is properly configured to use this memory file
