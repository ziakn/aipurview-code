import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/renderWithProviders";

// Suppress console errors from async state updates
vi.spyOn(console, "error").mockImplementation(() => {});

// Mock hooks and repositories used by Home
vi.mock("../../../../application/hooks/useDashboard", () => ({
  useDashboard: () => ({
    dashboard: {
      projects_list: [],
    },
    loading: false,
    fetchDashboard: vi.fn(),
  }),
}));

vi.mock("../../../../application/contexts/VerifyWise.context", () => ({
  VerifyWiseContext: {
    _currentValue: {
      setDashboardValues: vi.fn(),
      componentsVisible: { home: false, sidebar: false },
      changeComponentVisibility: vi.fn(),
      refreshUsers: vi.fn().mockResolvedValue(undefined),
      userRoleName: "Admin",
    },
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children({
      setDashboardValues: vi.fn(),
      componentsVisible: { home: false, sidebar: false },
      changeComponentVisibility: vi.fn(),
      refreshUsers: vi.fn().mockResolvedValue(undefined),
      userRoleName: "Admin",
    }),
  },
}));

// We need to mock useContext to return the right values
const mockSetDashboardValues = vi.fn();
const mockChangeComponentVisibility = vi.fn();
const mockRefreshUsers = vi.fn().mockResolvedValue(undefined);

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: (context: any) => {
      // Check if it's our VerifyWiseContext
      if (context?._currentValue?.setDashboardValues !== undefined) {
        return {
          setDashboardValues: mockSetDashboardValues,
          componentsVisible: { home: false, sidebar: false },
          changeComponentVisibility: mockChangeComponentVisibility,
          refreshUsers: mockRefreshUsers,
          userRoleName: "Admin",
        };
      }
      // Fall through to actual useContext for other contexts (theme, etc.)
      return (actual as any).useContext(context);
    },
  };
});

vi.mock("../../../../application/hooks/useMultipleOnScreen", () => ({
  default: () => ({ allVisible: false }),
}));

// Mock heavy child components
vi.mock("../../../components/Forms/ProjectForm", () => ({
  ProjectForm: () => <div data-testid="project-form" />,
}));

vi.mock("../../../components/ProjectsList/ProjectsList", () => ({
  default: ({ newProjectButton }: any) => (
    <div data-testid="project-list">{newProjectButton}</div>
  ),
}));

vi.mock("../../../components/Modals/StandardModal", () => ({
  default: ({ children }: any) => <div data-testid="standard-modal">{children}</div>,
}));

vi.mock("../../../components/Modals/AiOrNotScreening", () => ({
  default: () => <div data-testid="ai-screening" />,
}));

vi.mock("../../../components/PageTour", () => ({
  default: () => null,
}));

vi.mock("../../../components/Layout/PageHeaderExtended", () => ({
  PageHeaderExtended: ({ title, children }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

import Home from "../1.0Home/index";

describe("Home", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText("Use cases")).toBeInTheDocument();
  });

  it("renders the project list", () => {
    renderWithProviders(<Home />);
    expect(screen.getByTestId("project-list")).toBeInTheDocument();
  });

  it("renders the new use case button", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText("New use case")).toBeInTheDocument();
  });
});
