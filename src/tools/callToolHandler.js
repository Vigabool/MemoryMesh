// src/tools/callToolHandler.js
import {dynamicTools} from './tools.js';
import {formatToolResponse, formatToolError} from '../utils/responseFormatter.js';

/**
 * Handles incoming tool call requests by routing them to the appropriate handler based on the tool name.
 *
 * @param {Object} request - The incoming request containing tool call parameters.
 * @param {Object} knowledgeGraphManager - The manager instance for interacting with the knowledge graph.
 * @returns {Promise<Object>} - The result of the tool call.
 * @throws {Error} If the tool is unknown or if processing the tool call fails.
 */
export async function handleCallToolRequest(request, knowledgeGraphManager) {
    const {name, arguments: args} = request.params;

    if (!args) {
        return formatToolError({
            operation: name,
            error: "No arguments provided",
            suggestions: ["Provide arguments for the tool call"]
        });
    }

    try {
        // First check if it's a generic tool
        switch (name) {
            case "add_nodes":
                return formatToolResponse({
                    data: {nodes: await knowledgeGraphManager.addNodes(args.nodes)},
                    message: `Successfully added ${args.nodes.length} nodes`,
                    actionTaken: "Added nodes to the knowledge graph"
                });

            case "update_nodes":
                return formatToolResponse({
                    data: {nodes: await knowledgeGraphManager.updateNodes(args.nodes)},
                    message: `Successfully updated ${args.nodes.length} nodes`,
                    actionTaken: "Updated nodes in the knowledge graph"
                });

            case "add_edges":
                return formatToolResponse({
                    data: {edges: await knowledgeGraphManager.addEdges(args.edges)},
                    message: `Successfully added ${args.edges.length} edges`,
                    actionTaken: "Added edges to the knowledge graph"
                });

            case "update_edges":
                return formatToolResponse({
                    data: {edges: await knowledgeGraphManager.updateEdges(args.edges)},
                    message: `Successfully updated ${args.edges.length} edges`,
                    actionTaken: "Updated edges in the knowledge graph"
                });

            case "add_metadata":
                return formatToolResponse({
                    data: {metadata: await knowledgeGraphManager.addMetadata(args.metadata)},
                    message: `Successfully added metadata`,
                    actionTaken: "Added metadata to nodes in the knowledge graph"
                });

            case "delete_nodes":
                await knowledgeGraphManager.deleteNodes(args.nodeNames);
                return formatToolResponse({
                    message: `Successfully deleted nodes: ${args.nodeNames.join(', ')}`,
                    actionTaken: "Deleted nodes from the knowledge graph"
                });

            case "delete_metadata":
                await knowledgeGraphManager.deleteMetadata(args.deletions);
                return formatToolResponse({
                    message: `Successfully deleted metadata`,
                    actionTaken: "Deleted metadata from nodes in the knowledge graph"
                });

            case "delete_edges":
                await knowledgeGraphManager.deleteEdges(args.edges);
                return formatToolResponse({
                    message: `Successfully deleted edges`,
                    actionTaken: "Deleted edges from the knowledge graph"
                });

            case "read_graph":
                return formatToolResponse({
                    data: await knowledgeGraphManager.readGraph(),
                    message: `Successfully read the knowledge graph`,
                    actionTaken: "Read the knowledge graph"
                });

            case "search_nodes":
                return formatToolResponse({
                    data: await knowledgeGraphManager.searchNodes(args.query),
                    message: `Successfully searched nodes with query: ${args.query}`,
                    actionTaken: "Searched nodes in the knowledge graph"
                });

            case "open_nodes":
                return formatToolResponse({
                    data: await knowledgeGraphManager.openNodes(args.names),
                    message: `Successfully opened nodes: ${args.names.join(', ')}`,
                    actionTaken: "Opened nodes in the knowledge graph"
                });

            default:
                // Only try schema-based handling if it's not a generic tool
                if (name.match(/^(add|update|delete)_/)) {
                    const toolResult = await dynamicTools.handleToolCall(name, args, knowledgeGraphManager);
                    // Check if the toolResult is already formatted (i.e., it's an error)
                    if (toolResult.toolResult && toolResult.toolResult.isError) {
                        return toolResult;
                    } else {
                        return formatToolResponse({
                            data: toolResult,
                            message: `Successfully executed tool: ${name}`,
                            actionTaken: `Executed tool: ${name}`
                        });
                    }
                }

                return formatToolError({
                    operation: name,
                    error: `Unknown tool: ${name}`,
                    suggestions: ["Check the list of available tools"]
                });
        }
    } catch (error) {
        // Catch and reformat errors
        return formatToolError({
            operation: name,
            error: error.message,
            context: {input: args},
            suggestions: ["Review the error message and the provided arguments"],
            recoverySteps: ["If the error persists, notify the human"]
        });
    }
}