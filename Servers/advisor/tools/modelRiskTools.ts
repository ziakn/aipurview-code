export const toolsDefinition: any[] = [
    {
        type: "function",
        function: {
            name: "fetch_model_risks",
            description: "Retrieve and filter model-specific risks. Use this tool to search for risks associated with AI models based on category, level, status, owner, or model. Returns an array of model risk objects matching the specified criteria.",
            parameters: {
                type: "object",
                properties: {
                    modelId: {
                        type: "number",
                        description: "Filter risks by model ID. Use this to get risks associated with a specific AI model."
                    },
                    risk_category: {
                        type: "string",
                        enum: ["Performance", "Bias & Fairness", "Security", "Data Quality", "Compliance"],
                        description: "Filter by risk category. 'Performance' for model performance issues, 'Bias & Fairness' for fairness concerns, 'Security' for security vulnerabilities, 'Data Quality' for data-related risks, 'Compliance' for regulatory compliance risks."
                    },
                    risk_level: {
                        type: "string",
                        enum: ["Low", "Medium", "High", "Critical"],
                        description: "Filter by risk severity level. 'Critical' requires immediate action, 'High' needs urgent attention, 'Medium' should be monitored, 'Low' is acceptable."
                    },
                    status: {
                        type: "string",
                        enum: ["Open", "In Progress", "Resolved", "Accepted"],
                        description: "Filter by risk status. 'Open' not yet addressed, 'In Progress' being mitigated, 'Resolved' successfully addressed, 'Accepted' risk accepted as-is."
                    },
                    owner: {
                        type: "string",
                        description: "Filter by risk owner name. Supports partial matching."
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of risks to return. Default is to return all matching risks. Use this to get a preview or top N results."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_model_risk_analytics",
            description: "Get comprehensive analytics and distributions for model risk data. Use this tool to understand the model risk landscape, identify patterns, and generate insights about risk distribution across different dimensions. Returns aggregated statistics including category distribution, level breakdown, status distribution, owner analysis, and risks by model.",
            parameters: {
                type: "object",
                properties: {
                    modelId: {
                        type: "number",
                        description: "Optional: Scope analytics to a specific model. If not provided, returns analytics for all model risks in the tenant."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_model_risk_executive_summary",
            description: "Get a high-level executive summary of the model risk landscape. Use this tool for quick overview of total risks, severity breakdown, status progress, top categories, risks needing attention, and owner distribution. Ideal for answering questions about overall model risk posture, what needs attention, and risk mitigation progress.",
            parameters: {
                type: "object",
                properties: {
                    modelId: {
                        type: "number",
                        description: "Optional: Scope summary to a specific model. If not provided, returns summary for all model risks in the tenant."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_create_model_risk",
            description: "Create a new model risk for a specific AI model. Requires user confirmation before executing. Returns the created model risk object.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "number",
                        description: "The model ID to associate the risk with."
                    },
                    risk_name: {
                        type: "string",
                        description: "A concise, descriptive name for the model risk."
                    },
                    description: {
                        type: "string",
                        description: "Detailed description of the risk, including potential causes and consequences."
                    },
                    risk_category: {
                        type: "string",
                        enum: ["Performance", "Bias & Fairness", "Security", "Data Quality", "Compliance"],
                        description: "The category of the model risk."
                    },
                    risk_level: {
                        type: "string",
                        enum: ["Low", "Medium", "High", "Critical"],
                        description: "The severity level of the model risk."
                    },
                    status: {
                        type: "string",
                        enum: ["Open", "In Progress", "Resolved", "Accepted"],
                        description: "Initial status for the model risk. Defaults to 'Open'."
                    },
                    owner: {
                        type: "string",
                        description: "Name of the person responsible for managing this risk."
                    },
                    target_date: {
                        type: "string",
                        description: "Target date for risk review or mitigation (ISO 8601 format)."
                    },
                    mitigation_plan: {
                        type: "string",
                        description: "Plan for mitigating the risk."
                    },
                    impact: {
                        type: "string",
                        description: "Description of the potential impact if the risk materializes."
                    },
                    likelihood: {
                        type: "string",
                        description: "Likelihood of the risk occurring."
                    }
                },
                required: ["model_id", "risk_name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_update_model_risk",
            description: "Update an existing model risk's properties. Requires user confirmation before executing. Only the provided fields will be updated.",
            parameters: {
                type: "object",
                properties: {
                    model_risk_id: {
                        type: "number",
                        description: "The ID of the model risk to update."
                    },
                    risk_name: {
                        type: "string",
                        description: "Updated name for the model risk."
                    },
                    description: {
                        type: "string",
                        description: "Updated description of the risk."
                    },
                    risk_category: {
                        type: "string",
                        enum: ["Performance", "Bias & Fairness", "Security", "Data Quality", "Compliance"],
                        description: "Updated risk category."
                    },
                    risk_level: {
                        type: "string",
                        enum: ["Low", "Medium", "High", "Critical"],
                        description: "Updated severity level."
                    },
                    status: {
                        type: "string",
                        enum: ["Open", "In Progress", "Resolved", "Accepted"],
                        description: "Updated status."
                    },
                    owner: {
                        type: "string",
                        description: "Updated risk owner name."
                    },
                    target_date: {
                        type: "string",
                        description: "Updated target date (ISO 8601 format)."
                    },
                    mitigation_plan: {
                        type: "string",
                        description: "Updated mitigation plan."
                    },
                    impact: {
                        type: "string",
                        description: "Updated impact description."
                    },
                    likelihood: {
                        type: "string",
                        description: "Updated likelihood."
                    }
                },
                required: ["model_risk_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_change_model_risk_status",
            description: "Change the status of a model risk. Use this to move a risk through its lifecycle (e.g., from 'Open' to 'In Progress' to 'Resolved'). Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_risk_id: {
                        type: "number",
                        description: "The ID of the model risk to update."
                    },
                    status: {
                        type: "string",
                        enum: ["Open", "In Progress", "Resolved", "Accepted"],
                        description: "The new status to set."
                    }
                },
                required: ["model_risk_id", "status"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agent_delete_model_risk",
            description: "Soft-delete a model risk. This marks the risk as deleted but does not permanently remove it. Requires user confirmation before executing.",
            parameters: {
                type: "object",
                properties: {
                    model_risk_id: {
                        type: "number",
                        description: "The ID of the model risk to delete."
                    }
                },
                required: ["model_risk_id"]
            }
        }
    }
];
