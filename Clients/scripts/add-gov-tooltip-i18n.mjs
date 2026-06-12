import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const translationsPath = path.resolve(__dirname, "../src/i18n/translations.ts");

const newTooltipKeys = {
  // Shared components — additional keys
  "Governance.Tooltip.FrameworkSelector.Source": "Source framework",
  "Governance.Tooltip.FrameworkSelector.Source.Desc": "Choose the framework to map from",
  "Governance.Tooltip.FrameworkSelector.Target": "Target framework",
  "Governance.Tooltip.FrameworkSelector.Target.Desc": "Choose the framework to map into",
  "Governance.Tooltip.CrossMappingBadge.Count": "Cross-framework mappings",
  "Governance.Tooltip.CrossMappingBadge.Count.Desc": "Number of mappings linked to this control",
  "Governance.Tooltip.MappingStatsPanel.Header": "Mapping statistics",
  "Governance.Tooltip.MappingStatsPanel.Header.Desc": "Breakdown of cross-framework mappings",

  // Framework Mapper
  "Governance.Tooltip.FrameworkMapper.ViewMode": "View mode",
  "Governance.Tooltip.FrameworkMapper.ViewMode.Desc": "Switch between list and matrix views",
  "Governance.Tooltip.FrameworkMapper.Export": "Export mappings",
  "Governance.Tooltip.FrameworkMapper.Export.Desc": "Download pairwise mappings as CSV",
  "Governance.Tooltip.FrameworkMapper.Import": "Import mappings",
  "Governance.Tooltip.FrameworkMapper.Import.Desc": "Upload a CSV file to create mappings",
  "Governance.Tooltip.FrameworkMapper.NewMapping": "New mapping",
  "Governance.Tooltip.FrameworkMapper.NewMapping.Desc": "Create a cross-framework control mapping",
  "Governance.Tooltip.FrameworkMapper.DomainFilter": "Domain filter",
  "Governance.Tooltip.FrameworkMapper.DomainFilter.Desc": "Filter mappings by governance domain",

  // Mapping Matrix
  "Governance.Tooltip.MappingMatrix.Cell": "Mapping count",
  "Governance.Tooltip.MappingMatrix.Cell.Desc": "Click to view mappings between these frameworks",
  "Governance.Tooltip.MappingMatrix.Header": "Framework axis",
  "Governance.Tooltip.MappingMatrix.Header.Desc": "Source rows and target columns",
  "Governance.Tooltip.MappingMatrix.Legend": "Density legend",
  "Governance.Tooltip.MappingMatrix.Legend.Desc": "Color intensity shows mapping density",

  // Mapping Form
  "Governance.Tooltip.MappingForm.SourceFramework": "Source framework",
  "Governance.Tooltip.MappingForm.SourceFramework.Desc": "Framework containing the source control",
  "Governance.Tooltip.MappingForm.SourceControl": "Source control",
  "Governance.Tooltip.MappingForm.SourceControl.Desc": "Identifier of the control being mapped",
  "Governance.Tooltip.MappingForm.TargetFramework": "Target framework",
  "Governance.Tooltip.MappingForm.TargetFramework.Desc": "Framework receiving the mapped control",
  "Governance.Tooltip.MappingForm.TargetControl": "Target control",
  "Governance.Tooltip.MappingForm.TargetControl.Desc": "Identifier of the equivalent control",
  "Governance.Tooltip.MappingForm.Strength": "Mapping strength",
  "Governance.Tooltip.MappingForm.Strength.Desc": "Relationship between the two controls",
  "Governance.Tooltip.MappingForm.DomainTag": "Domain tag",
  "Governance.Tooltip.MappingForm.DomainTag.Desc": "Optional governance domain category",
  "Governance.Tooltip.MappingForm.Rationale": "Rationale",
  "Governance.Tooltip.MappingForm.Rationale.Desc": "Explanation for why these controls map",
  "Governance.Tooltip.MappingForm.Confidence": "Confidence score",
  "Governance.Tooltip.MappingForm.Confidence.Desc": "Certainty level for this mapping",

  // Bulk Import
  "Governance.Tooltip.BulkImport.Upload": "Upload CSV",
  "Governance.Tooltip.BulkImport.Upload.Desc": "Select a CSV file with mapping rows",
  "Governance.Tooltip.BulkImport.Import": "Import mappings",
  "Governance.Tooltip.BulkImport.Import.Desc": "Save valid rows as new mappings",

  // Scenario Builder
  "Governance.Tooltip.ScenarioBuilder.Industry": "Industry",
  "Governance.Tooltip.ScenarioBuilder.Industry.Desc": "Sector used to tailor recommendations",
  "Governance.Tooltip.ScenarioBuilder.Region": "Region",
  "Governance.Tooltip.ScenarioBuilder.Region.Desc": "Regulatory region for framework priority",
  "Governance.Tooltip.ScenarioBuilder.RiskLevel": "Risk level",
  "Governance.Tooltip.ScenarioBuilder.RiskLevel.Desc": "AI system risk classification",
  "Governance.Tooltip.ScenarioBuilder.UseCaseType": "Use case type",
  "Governance.Tooltip.ScenarioBuilder.UseCaseType.Desc": "Category of AI system",
  "Governance.Tooltip.ScenarioBuilder.GetRecommendations": "Get recommendations",
  "Governance.Tooltip.ScenarioBuilder.GetRecommendations.Desc": "Generate scenarios matching context",
  "Governance.Tooltip.ScenarioBuilder.NewScenario": "New scenario",
  "Governance.Tooltip.ScenarioBuilder.NewScenario.Desc": "Create a custom governance scenario",

  // Scenario Form
  "Governance.Tooltip.ScenarioForm.Name": "Scenario name",
  "Governance.Tooltip.ScenarioForm.Name.Desc": "Short name for this scenario",
  "Governance.Tooltip.ScenarioForm.Description": "Description",
  "Governance.Tooltip.ScenarioForm.Description.Desc": "Context and purpose of this scenario",
  "Governance.Tooltip.ScenarioForm.Industry": "Industry",
  "Governance.Tooltip.ScenarioForm.Industry.Desc": "Sector this scenario applies to",
  "Governance.Tooltip.ScenarioForm.Region": "Region",
  "Governance.Tooltip.ScenarioForm.Region.Desc": "Regulatory region this scenario targets",
  "Governance.Tooltip.ScenarioForm.Frameworks": "Frameworks",
  "Governance.Tooltip.ScenarioForm.Frameworks.Desc": "Frameworks included in this scenario",
  "Governance.Tooltip.ScenarioForm.PrimaryFramework": "Primary framework",
  "Governance.Tooltip.ScenarioForm.PrimaryFramework.Desc": "Baseline framework for this scenario",

  // Active Scenario
  "Governance.Tooltip.ActiveScenario.ViewInsights": "View insights",
  "Governance.Tooltip.ActiveScenario.ViewInsights.Desc": "Open Unified Insights for this scenario",
  "Governance.Tooltip.ActiveScenario.Deactivate": "Deactivate",
  "Governance.Tooltip.ActiveScenario.Deactivate.Desc": "Stop the active scenario",
  "Governance.Tooltip.ActiveScenario.Activate": "Activate scenario",
  "Governance.Tooltip.ActiveScenario.Activate.Desc": "Create tasks for selected projects",
  "Governance.Tooltip.ActiveScenario.Progress": "Task progress",
  "Governance.Tooltip.ActiveScenario.Progress.Desc": "Completion status by framework",

  // Activation History
  "Governance.Tooltip.ActivationHistory.Status": "Activation status",
  "Governance.Tooltip.ActivationHistory.Status.Desc": "Whether this activation is active",
  "Governance.Tooltip.ActivationHistory.Deactivate": "Deactivate",
  "Governance.Tooltip.ActivationHistory.Deactivate.Desc": "Stop this active activation",

  // Activation Wizard
  "Governance.Tooltip.ActivationWizard.Projects": "Select projects",
  "Governance.Tooltip.ActivationWizard.Projects.Desc": "Projects where tasks will be created",
  "Governance.Tooltip.ActivationWizard.Owners": "Assign owners",
  "Governance.Tooltip.ActivationWizard.Owners.Desc": "Owners for each framework",
  "Governance.Tooltip.ActivationWizard.Review": "Review activation",
  "Governance.Tooltip.ActivationWizard.Review.Desc": "Confirm scenario activation details",

  // What-If Simulator
  "Governance.Tooltip.WhatIfSimulator.BaseScenario": "Base scenario",
  "Governance.Tooltip.WhatIfSimulator.BaseScenario.Desc": "Starting point for simulation",
  "Governance.Tooltip.WhatIfSimulator.Primary": "Primary framework",
  "Governance.Tooltip.WhatIfSimulator.Primary.Desc": "Baseline framework in simulation",
  "Governance.Tooltip.WhatIfSimulator.Secondary": "Secondary frameworks",
  "Governance.Tooltip.WhatIfSimulator.Secondary.Desc": "Supporting frameworks in simulation",
  "Governance.Tooltip.WhatIfSimulator.Supplementary": "Supplementary frameworks",
  "Governance.Tooltip.WhatIfSimulator.Supplementary.Desc": "Optional additional frameworks",
  "Governance.Tooltip.WhatIfSimulator.Run": "Run simulation",
  "Governance.Tooltip.WhatIfSimulator.Run.Desc": "Calculate estimated coverage and effort",
  "Governance.Tooltip.WhatIfSimulator.Coverage": "Est coverage",
  "Governance.Tooltip.WhatIfSimulator.Coverage.Desc": "Estimated mapped control percentage",
  "Governance.Tooltip.WhatIfSimulator.Controls": "Total controls",
  "Governance.Tooltip.WhatIfSimulator.Controls.Desc": "Estimated controls to address",
  "Governance.Tooltip.WhatIfSimulator.Effort": "Est effort",
  "Governance.Tooltip.WhatIfSimulator.Effort.Desc": "Estimated hours required",
  "Governance.Tooltip.WhatIfSimulator.Timeline": "Timeline",
  "Governance.Tooltip.WhatIfSimulator.Timeline.Desc": "Estimated weeks to complete",

  // Scenario Comparison
  "Governance.Tooltip.ScenarioComparison.Selector": "Scenario selector",
  "Governance.Tooltip.ScenarioComparison.Selector.Desc": "Choose up to three scenarios to compare",
  "Governance.Tooltip.ScenarioComparison.Attribute": "Comparison attribute",
  "Governance.Tooltip.ScenarioComparison.Attribute.Desc": "Scenario property being compared",

  // Unified Insights
  "Governance.Tooltip.UnifiedInsights.SelectProject": "Select project",
  "Governance.Tooltip.UnifiedInsights.SelectProject.Desc": "Project to analyze coverage and gaps",
  "Governance.Tooltip.UnifiedInsights.Refresh": "Refresh coverage",
  "Governance.Tooltip.UnifiedInsights.Refresh.Desc": "Recalculate coverage for selected project",
  "Governance.Tooltip.UnifiedInsights.Export": "Export CSV",
  "Governance.Tooltip.UnifiedInsights.Export.Desc": "Download coverage report as CSV",
  "Governance.Tooltip.UnifiedInsights.AvgCoverage": "Average coverage",
  "Governance.Tooltip.UnifiedInsights.AvgCoverage.Desc": "Mean mapped control percentage",
  "Governance.Tooltip.UnifiedInsights.MappedControls": "Mapped controls",
  "Governance.Tooltip.UnifiedInsights.MappedControls.Desc": "Controls with cross-framework mappings",
  "Governance.Tooltip.UnifiedInsights.TotalControls": "Total controls",
  "Governance.Tooltip.UnifiedInsights.TotalControls.Desc": "Controls across active frameworks",
  "Governance.Tooltip.UnifiedInsights.ActiveFrameworks": "Active frameworks",
  "Governance.Tooltip.UnifiedInsights.ActiveFrameworks.Desc": "Frameworks assigned to project",

  // Hub
  "Governance.Tooltip.Hub.ViewScenario": "View scenario",
  "Governance.Tooltip.Hub.ViewScenario.Desc": "Open active scenario details",
  "Governance.Tooltip.Hub.RunCoverage": "Run coverage",
  "Governance.Tooltip.Hub.RunCoverage.Desc": "Open Unified Insights",
  "Governance.Tooltip.Hub.ChooseScenario": "Choose scenario",
  "Governance.Tooltip.Hub.ChooseScenario.Desc": "Select or create a governance scenario",
  "Governance.Tooltip.Hub.GetRecommendations": "Get recommendations",
  "Governance.Tooltip.Hub.GetRecommendations.Desc": "Receive scenario suggestions",
  "Governance.Tooltip.Hub.RunCoverageAnalysis": "Run coverage analysis",
  "Governance.Tooltip.Hub.RunCoverageAnalysis.Desc": "Analyze coverage and gaps",
  "Governance.Tooltip.Hub.ViewMappings": "View mappings",
  "Governance.Tooltip.Hub.ViewMappings.Desc": "Open Framework Mapper",
  "Governance.Tooltip.Hub.NewScenario": "New scenario",
  "Governance.Tooltip.Hub.NewScenario.Desc": "Create a custom scenario",
  "Governance.Tooltip.Hub.AvgCoverage": "Average coverage",
  "Governance.Tooltip.Hub.AvgCoverage.Desc": "Mean mapped control percentage",
  "Governance.Tooltip.Hub.TotalGaps": "Total gaps",
  "Governance.Tooltip.Hub.TotalGaps.Desc": "Unmapped controls across frameworks",
  "Governance.Tooltip.Hub.ActiveFrameworks": "Active frameworks",
  "Governance.Tooltip.Hub.ActiveFrameworks.Desc": "Frameworks in current project",
  "Governance.Tooltip.Hub.TotalMappings": "Total mappings",
  "Governance.Tooltip.Hub.TotalMappings.Desc": "Cross-framework links created",
  "Governance.Tooltip.Hub.GapHotspots": "Gap hotspots",
  "Governance.Tooltip.Hub.GapHotspots.Desc": "Frameworks with the most unmapped controls",
};

const placeholder = {
  de: "[DE] ",
  fr: "[FR] ",
};

function findBlockBoundaries(content, lang) {
  const startMarker = `  ${lang}: {`;
  const start = content.indexOf(startMarker);
  if (start === -1) throw new Error(`Could not find ${lang} block start`);

  // For de, end before fr. For fr, end before the final closing `};`
  const nextLang = lang === "de" ? "  fr: {" : "};";
  const nextLangIndex = content.indexOf(nextLang, start + startMarker.length);
  if (nextLangIndex === -1) throw new Error(`Could not find ${lang} block end`);

  // Walk back to the closing `  },`
  let end = content.lastIndexOf("  },", nextLangIndex);
  if (end === -1 || end < start) throw new Error(`Could not find ${lang} block closing`);

  return { start, end: end + 4 };
}

function insertIntoBlock(content, lang, key, english) {
  const { start, end } = findBlockBoundaries(content, lang);
  const block = content.slice(start, end);
  const value = lang === "en" ? english : `${placeholder[lang]}${english}`;
  const lineToAdd = `    "${key}": "${value}",`;

  const lines = block.split("\n");
  let insertAt = lines.length - 1;
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const match = line.match(/^\s+"([^"]+)":/);
    if (match && match[1] > key) {
      insertAt = i;
      break;
    }
  }

  lines.splice(insertAt, 0, lineToAdd);
  const newBlock = lines.join("\n");
  return content.slice(0, start) + newBlock + content.slice(end);
}

function main() {
  let content = fs.readFileSync(translationsPath, "utf8");

  for (const [key, english] of Object.entries(newTooltipKeys)) {
    if (content.includes(`"${key}"`)) {
      console.log(`Skipping existing key: ${key}`);
      continue;
    }

    for (const lang of ["de", "fr"]) {
      content = insertIntoBlock(content, lang, key, english);
    }

    console.log(`Added key: ${key}`);
  }

  fs.writeFileSync(translationsPath, content, "utf8");
  console.log("Done.");
}

main();
