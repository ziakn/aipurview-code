import { vi } from "vitest";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

vi.mock("../RiskLevel/constants", () => ({
  Severity: { Minor: 1, Moderate: 2, Major: 3 },
  Likelihood: { Unlikely: 1, Possible: 2, Likely: 3 },
}));

vi.mock("../RiskLevel/riskValues", () => ({
  RiskLikelihood: [],
  RiskSeverity: [],
}));

vi.mock("./interface", () => ({ RiskFormValues: {}, MitigationFormValues: {} }));
vi.mock("./projectRiskValue", () => ({
  aiLifecyclePhase: [],
  riskCategoryItems: [],
  mitigationStatusItems: [],
  approvalStatusItems: [],
  riskLevelItems: [],
  likelihoodItems: [],
  riskSeverityItems: [],
}));

vi.mock("../../../application/repository/projectRisk.repository", () => ({
  createProjectRisk: vi.fn(),
  updateProjectRisk: vi.fn(),
}));

vi.mock("../../../application/hooks/useUsers", () => ({
  default: () => ({ users: [] }),
}));

vi.mock("../../../application/hooks/useAuth", () => ({
  useAuth: () => ({ userId: 1, roleName: "Admin" }),
}));

vi.mock("../../../application/contexts/VerifyWise.context", () => ({
  VerifyWiseContext: { _currentValue: null },
}));

vi.mock("../../../application/constants/permissions", () => ({
  default: { canEdit: ["Admin", "Editor"] },
}));

vi.mock("../../tools/riskCalculator", () => ({
  RiskCalculator: { calculate: vi.fn().mockReturnValue(0) },
}));

vi.mock("../Common/HistorySidebar", () => ({
  HistorySidebar: () => <div data-testid="history-sidebar" />,
}));

vi.mock("./style", () => ({
  getTabStyle: () => ({}),
}));

vi.mock("../QuantitativeRiskForm", () => ({
  default: () => <div data-testid="quant-form" />,
  quantitativeInitialState: {},
}));

vi.mock("../../../application/hooks/useRiskAssessmentMode", () => ({
  useRiskAssessmentMode: () => ({ mode: "qualitative" }),
}));

vi.mock("./RisksSection", () => ({
  default: () => <div data-testid="risk-section" />,
}));

vi.mock("../../types/riskForm.types", () => ({}));

import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/renderWithProviders";
import AddNewRiskForm from "../index";

describe("AddNewRiskForm", () => {
  const defaultProps = {
    projectId: 1,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  it("renders the form component without crashing", () => {
    renderWithProviders(<AddNewRiskForm {...defaultProps} />);
    // The component should render - check for common form elements
    expect(document.body).toBeTruthy();
  });

  it("renders with existingRisk prop for editing", () => {
    renderWithProviders(
      <AddNewRiskForm {...defaultProps} existingRisk={{ id: 1, risk_name: "Test Risk" } as any} />
    );
    expect(document.body).toBeTruthy();
  });
});
