/**
 * Phase 3 — Mastra Agent Network Configuration
 *
 * Registers all specialized agents and configures the communication network.
 */

import { getAllAgents, getRegistryStatus } from "./agentRegistry";
import { logStructured } from "../../utils/logger/fileLogger";

const fileName = "agentNetwork.ts";

let networkInitialized = false;

/**
 * Initialize the agent network.
 * Called on server startup after all agents are registered.
 */
export function initializeNetwork(): void {
  if (networkInitialized) return;

  const status = getRegistryStatus();
  logStructured(
    "successful",
    `agent network initialized: ${status.totalAgents} agents, ${status.healthyAgents} healthy`,
    "initializeNetwork",
    fileName
  );

  networkInitialized = true;
}

/**
 * Get network status summary.
 */
export function getNetworkStatus(): {
  initialized: boolean;
  agents: ReturnType<typeof getRegistryStatus>;
} {
  return {
    initialized: networkInitialized,
    agents: getRegistryStatus(),
  };
}

/**
 * Shutdown the agent network gracefully.
 */
export function shutdownNetwork(): void {
  logStructured("successful", "agent network shutdown", "shutdownNetwork", fileName);
  networkInitialized = false;
}
