// src/tools/registry/dynamicTools.ts

import {initializeDynamicTools, type IDynamicSchemaToolRegistry} from '../DynamicSchemaToolRegistry.js';
import type {Tool, ToolResponse} from '../../types/tools.js';
import type {KnowledgeGraphManager} from '../../core/KnowledgeGraphManager.js';
import {formatToolError} from '../../utils/responseFormatter.js';

/**
 * Manages dynamically generated tools based on schemas
 */
export class DynamicToolManager {
    private static instance: DynamicToolManager;
    private registry: IDynamicSchemaToolRegistry | null = null;
    private initialized = false;

    private constructor() {
    }

    /**
     * Gets the singleton instance of DynamicToolManager
     */
    static getInstance(): DynamicToolManager {
        if (!DynamicToolManager.instance) {
            DynamicToolManager.instance = new DynamicToolManager();
        }
        return DynamicToolManager.instance;
    }

    /**
     * Initializes the dynamic tool registry
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            this.registry = await initializeDynamicTools();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize dynamic tools:', error);
            throw new Error('Dynamic tools initialization failed');
        }
    }

    /**
     * Gets all dynamically generated tools
     */
    getTools(): Tool[] {
        if (!this.initialized || !this.registry) {
            throw new Error('Dynamic tools not initialized');
        }
        return this.registry.getTools();
    }

    /**
     * Handles a call to a dynamic tool
     */
    async handleToolCall(
        toolName: string,
        args: Record<string, any>,
        knowledgeGraphManager: KnowledgeGraphManager
    ): Promise<ToolResponse> {
        if (!this.initialized || !this.registry) {
            return formatToolError({
                operation: toolName,
                error: 'Dynamic tools not initialized',
                suggestions: ['Ensure dynamic tools are initialized before making tool calls']
            });
        }

        try {
            return await this.registry.handleToolCall(toolName, args, knowledgeGraphManager);
        } catch (error) {
            return formatToolError({
                operation: toolName,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                context: {args},
                suggestions: [
                    'Verify the tool name is correct',
                    'Check the provided arguments match the tool schema',
                    'Ensure all required parameters are provided'
                ]
            });
        }
    }

    /**
     * Checks if a tool name corresponds to a dynamic tool
     */
    isDynamicTool(toolName: string): boolean {
        if (!this.initialized || !this.registry) {
            return false;
        }
        return this.getTools().some(tool => tool.name === toolName);
    }
}

/**
 * Singleton instance of the DynamicToolManager
 */
export const dynamicToolManager = DynamicToolManager.getInstance();

/**
 * Re-export types that might be needed by consumers
 */
export type {
    Tool,
    ToolResponse,
    IDynamicSchemaToolRegistry
};