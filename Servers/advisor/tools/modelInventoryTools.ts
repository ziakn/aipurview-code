export const toolsDefinition: any[] = [
  {
    type: "function",
    function: {
      name: "fetch_model_inventories",
      description:
        "Retrieve and filter AI models from the model inventory. Use this tool to search for specific models based on project, framework, status, security assessment, provider, hosting provider, or model name. Returns an array of model objects matching the specified criteria.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description:
              "Filter models by project ID. Use this to get models associated with a specific project.",
          },
          frameworkId: {
            type: "number",
            description:
              "Filter models by framework ID (e.g., ISO-42001, ISO-27001, EU AI Act). Use this to get models used within a specific compliance framework.",
          },
          status: {
            type: "string",
            enum: ["Approved", "Restricted", "Pending", "Blocked"],
            description:
              "Filter by model approval status. 'Approved' means ready for use, 'Restricted' has limitations, 'Pending' awaiting approval, 'Blocked' should not be used.",
          },
          security_assessment: {
            type: "boolean",
            description:
              "Filter by whether the model has undergone security assessment. true = assessed, false = not assessed.",
          },
          provider: {
            type: "string",
            description:
              "Filter by AI provider name (e.g., 'OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral AI'). Supports partial matching.",
          },
          hosting_provider: {
            type: "string",
            description:
              "Filter by hosting infrastructure provider (e.g., 'AWS', 'Google Cloud', 'Azure', 'On-premises'). Supports partial matching.",
          },
          model: {
            type: "string",
            description:
              "Filter by model name (e.g., 'GPT-4', 'Claude', 'Gemini', 'Llama'). Supports partial matching.",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of models to return. Default is to return all matching models. Use this to get a preview or top N results.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_model_inventory_analytics",
      description:
        "Get comprehensive analytics and distributions for model inventory data. Use this tool to understand the model landscape, identify patterns, and generate insights about model distribution across different dimensions. Returns aggregated statistics including status distribution, provider breakdown, security assessment coverage, hosting provider distribution, and capabilities analysis.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description:
              "Optional: Scope analytics to a specific project. If not provided, returns analytics for all models in the tenant.",
          },
        },
        required: [],
      },
    },
    },
    {
        type: "function",
        function: {
            name: "get_model_inventory_executive_summary",
            description: "Get a high-level executive summary of the model inventory landscape. Use this tool for quick overview of total models, approval status breakdown, security assessment progress, top providers, recent additions, and hosting distribution. Ideal for answering questions about overall model inventory posture, what models are available, and what needs attention.",
            parameters: {
                type: "object",
                properties: {
                    projectId: {
                        type: "number",
                        description: "Optional: Scope summary to a specific project. If not provided, returns summary for all models in the tenant."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_register_model",
            description: "Register a new AI model in the model inventory. Creates a new model entry with the specified provider, model name, version, and other details. Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "The model name (e.g., 'GPT-4', 'Claude 3', 'Gemini Pro')."
                    },
                    model_type: {
                        type: "string",
                        description: "The provider/vendor of the model (e.g., 'OpenAI', 'Anthropic', 'Google')."
                    },
                    version: {
                        type: "string",
                        description: "The model version (e.g., '1.0', '2024-01', 'turbo')."
                    },
                    description: {
                        type: "string",
                        description: "Description of the model's capabilities and intended use."
                    },
                    project_id: {
                        type: "number",
                        description: "Optional project ID to associate the model with."
                    }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_update_model",
            description: "Update properties of an existing model in the inventory. Only the provided fields will be updated. Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "number",
                        description: "The ID of the model to update."
                    },
                    name: {
                        type: "string",
                        description: "Updated model name."
                    },
                    model_type: {
                        type: "string",
                        description: "Updated provider/vendor name."
                    },
                    version: {
                        type: "string",
                        description: "Updated version string."
                    },
                    description: {
                        type: "string",
                        description: "Updated description of the model."
                    },
                    status: {
                        type: "string",
                        enum: ["Approved", "Restricted", "Pending", "Blocked"],
                        description: "Updated approval status."
                    },
                    hosting_provider: {
                        type: "string",
                        description: "Updated hosting provider (e.g., 'AWS', 'Google Cloud', 'Azure', 'On-premises')."
                    },
                    capabilities: {
                        type: "string",
                        description: "Updated capabilities as a comma-separated string."
                    }
                },
                required: ["model_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_update_model_lifecycle_phase",
            description: "Update the lifecycle phase/status of a model in the inventory. Use this to transition a model between approval states (e.g., from 'Pending' to 'Approved'). Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "number",
                        description: "The ID of the model to update."
                    },
                    lifecycle_phase: {
                        type: "string",
                        enum: ["Approved", "Restricted", "Pending", "Blocked"],
                        description: "The new lifecycle phase/status for the model."
                    }
                },
                required: ["model_id", "lifecycle_phase"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_retire_model",
            description: "Retire a model by setting its status to 'Blocked'. This indicates the model should no longer be used but preserves the record. Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "number",
                        description: "The ID of the model to retire."
                    }
                },
                required: ["model_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_delete_model",
            description: "Permanently delete a model from the inventory. This also removes associated project/framework links and optionally model risks. This action cannot be undone. Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "number",
                        description: "The ID of the model to delete."
                    }
                },
                required: ["model_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_link_model_to_project",
            description: "Link an existing model to a project. Creates an association between the model and the specified project. Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "number",
                        description: "The ID of the model to link."
                    },
                    project_id: {
                        type: "number",
                        description: "The ID of the project to link the model to."
                    }
                },
                required: ["model_id", "project_id"]
            }
        }
    }
];
