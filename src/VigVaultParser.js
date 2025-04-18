/**
 * VigVaultParser.js
 * 
 * Parses VigVault's markdown files and extracts structured data for the knowledge graph.
 * This script is the foundation for keeping the graph in sync with file changes.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// VigVault directory paths
const VIG_VAULT_PATH = '/Users/nickvigdahl/Desktop/VigVault';
const KNOWLEDGE_BASE_PATH = path.join(VIG_VAULT_PATH, '1-KnowledgeBase/Details');
const NEW_FILES_PATH = path.join(VIG_VAULT_PATH, '+ New Files');
const PROJECTS_PATH = path.join(VIG_VAULT_PATH, '3-Efforts/Projects');

/**
 * Extract frontmatter from markdown content
 * @param {string} content - Markdown file content
 * @returns {Object} - Parsed frontmatter as an object
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (match && match[1]) {
    try {
      return yaml.load(match[1]);
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      return {};
    }
  }
  
  return {};
}

/**
 * Extract nodes and relationships from a file
 * @param {string} filePath - Path to the markdown file
 * @returns {Object} - Extracted node and relationships
 */
function extractNodeFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);
    const fileName = path.basename(filePath, '.md');
    
    // Determine node type based on file path and tags
    let nodeType = 'knowledge';
    if (filePath.includes(PROJECTS_PATH)) {
      nodeType = 'project';
    } else if (frontmatter.tags && frontmatter.tags.includes('#idea')) {
      nodeType = 'idea';
    }
    
    // Create node data
    const node = {
      name: fileName,
      nodeType,
      metadata: []
    };
    
    // Add metadata from frontmatter
    if (frontmatter.created) node.metadata.push(`Created: ${frontmatter.created}`);
    if (frontmatter.year) node.metadata.push(`Year: ${frontmatter.year}`);
    if (frontmatter.encountered) node.metadata.push(`Encountered: ${frontmatter.encountered}`);
    if (frontmatter.status) node.metadata.push(`Status: ${frontmatter.status}`);
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      node.metadata.push(`Tags: ${frontmatter.tags.join(', ')}`);
    }
    if (frontmatter.in && frontmatter.in.length > 0) {
      node.metadata.push(`Topics: ${frontmatter.in.join(', ')}`);
    }
    
    // Extract relationships
    const relationships = [];
    
    // Add "related" relationships
    if (frontmatter.related && frontmatter.related.length > 0) {
      frontmatter.related.forEach(related => {
        if (typeof related === 'string') {
          relationships.push({
            from: fileName,
            to: related.replace(/[\[\]]/g, ''), // Remove Obsidian link brackets
            edgeType: 'related_to'
          });
        }
      });
    }
    
    // Add topic relationships
    if (frontmatter.in && frontmatter.in.length > 0) {
      frontmatter.in.forEach(topic => {
        relationships.push({
          from: fileName,
          to: topic,
          edgeType: 'belongs_to_topic'
        });
      });
    }
    
    // Add tag relationships
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      frontmatter.tags.forEach(tag => {
        // Remove the # symbol from tags
        const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
        relationships.push({
          from: fileName,
          to: tagName,
          edgeType: 'tagged_with'
        });
      });
    }
    
    // Add "up" relationships (hierarchical or parent-child relationships)
    if (frontmatter.up && frontmatter.up.length > 0) {
      frontmatter.up.forEach(parent => {
        if (typeof parent === 'string') {
          relationships.push({
            from: fileName,
            to: parent.replace(/[\[\]]/g, ''), // Remove Obsidian link brackets
            edgeType: 'part_of'
          });
        }
      });
    }
    
    return { node, relationships };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return { node: null, relationships: [] };
  }
}

/**
 * Create topic and tag nodes from unique values in files
 * @param {Array<string>} files - List of markdown file paths
 * @returns {Array<Object>} - List of topic and tag nodes with relationships
 */
function createExtraNodes(files) {
  const topics = new Set();
  const tags = new Set();
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const frontmatter = extractFrontmatter(content);
      
      if (frontmatter.in && frontmatter.in.length > 0) {
        frontmatter.in.forEach(topic => topics.add(topic));
      }
      
      if (frontmatter.tags && frontmatter.tags.length > 0) {
        frontmatter.tags.forEach(tag => {
          const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
          tags.add(tagName);
        });
      }
    } catch (error) {
      console.error(`Error extracting extra nodes from ${file}:`, error);
    }
  });
  
  // Create topic nodes
  const topicNodes = Array.from(topics).map(topic => ({
    node: {
      name: topic,
      nodeType: 'topic',
      metadata: []
    },
    relationships: []
  }));
  
  // Create tag nodes
  const tagNodes = Array.from(tags).map(tag => ({
    node: {
      name: tag,
      nodeType: 'tag',
      metadata: []
    },
    relationships: []
  }));
  
  return [...topicNodes, ...tagNodes];
}

/**
 * Walk through VigVault directories and process markdown files
 * @returns {Object} - Extracted nodes and relationships
 */
function processVigVaultFiles() {
  const directories = [KNOWLEDGE_BASE_PATH, NEW_FILES_PATH, PROJECTS_PATH];
  const markdownFiles = [];
  
  directories.forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.md')) {
          markdownFiles.push(path.join(dir, file));
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  });
  
  console.log(`Found ${markdownFiles.length} markdown files to process`);
  
  // Process main content files
  const extractedData = markdownFiles.map(file => extractNodeFromFile(file))
    .filter(data => data.node !== null);
  
  // Add topic and tag nodes
  const extraNodes = createExtraNodes(markdownFiles);
  
  // Combine all nodes and relationships
  const allData = [...extractedData, ...extraNodes];
  
  return {
    nodes: allData.map(data => data.node),
    relationships: allData.flatMap(data => data.relationships)
  };
}

module.exports = {
  processVigVaultFiles,
  extractFrontmatter,
  extractNodeFromFile,
  createExtraNodes
};
