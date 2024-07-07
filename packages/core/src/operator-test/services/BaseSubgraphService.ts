import { GraphQLClient } from 'graphql-request';

/**
 * Base class for interacting with the subgraph.
 * This class provides basic functionalities for querying the subgraph and checking its health status.
 */
export class BaseSubgraphService {
  protected client: GraphQLClient;
  private logFunction?: (log: string) => void;

  /**
   * Constructor for BaseSubgraphService.
   * @param {string} endpoint - The GraphQL endpoint for the subgraph.
   * @param {(log: string) => void} [logFunction] - Optional logging function to log messages.
   */
  constructor(endpoint: string, logFunction?: (log: string) => void) {
    this.client = new GraphQLClient(endpoint);
    this.logFunction = logFunction;
  }

  /**
   * Checks the health status of the subgraph.
   * This method sends a basic query to the subgraph to ensure it is responsive.
   * @returns {Promise<{ healthy: boolean; error?: string }>} - Returns an object indicating whether the subgraph is healthy and any error message if not.
   */
  async getHealthStatus(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Basic query to check if the subgraph is responsive
      const query = `{ _meta { block { number } } }`;
      await this.client.request(query);
      return { healthy: true };
    } catch (error) {
      // Log the error if the health check fails
      this.log('error', `Subgraph health check failed: ${error}`);
      return { healthy: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Executes a GraphQL query.
   * This method sends a query to the subgraph and returns the result.
   * @param {string} queryString - The query string to be executed.
   * @param {any} [variables] - Optional query variables.
   * @returns {Promise<T>} - Returns the result of the query.
   */
  protected async query<T>(queryString: string, variables?: any): Promise<T> {
    try {
      // Send the query to the subgraph
      return await this.client.request<T>(queryString, variables);
    } catch (error) {
      // Log the error if the query fails
      this.log('error', `GraphQL query failed: ${error}`);
      throw error;
    }
  }

  /**
   * Logs a message.
   * This method logs a message using the provided log function, if available.
   * @param {'info' | 'warn' | 'error'} level - The log level (info, warn, error).
   * @param {string} message - The message to log.
   */
  protected log(level: 'info' | 'warn' | 'error', message: string): void {
    if (this.logFunction) {
      switch (level) {
        case 'info':
          this.logFunction(`[Base Subgraph Service] [Info] ${message}`);
          break;
        case 'warn':
          this.logFunction(`[Base Subgraph Service] [WARN] ${message}`);
          break;
        case 'error':
          this.logFunction(`[Base Subgraph Service] [ERROR] ${message}`);
          break;
      }
    }
  }
}
