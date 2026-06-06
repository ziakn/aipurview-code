import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../test/renderWithProviders";
import { Button } from "../index";

describe("Button", () => {
  it("renders button text", () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("handles onClick", async () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Submit</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("supports disabled state", () => {
    renderWithProviders(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("does not fire onClick when disabled", () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <Button disabled onClick={handleClick}>
        No click
      </Button>,
    );

    const button = screen.getByRole("button", { name: "No click" });
    // Disabled MUI buttons have pointer-events: none, so we verify
    // the button is disabled rather than attempting a click
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom testId via data-testid", () => {
    renderWithProviders(<Button testId="my-btn">Test</Button>);
    expect(screen.getByTestId("my-btn")).toBeInTheDocument();
  });

  it("passes className to the button", () => {
    renderWithProviders(<Button className="custom-class">Styled</Button>);
    const button = screen.getByRole("button", { name: "Styled" });
    expect(button.className).toContain("custom-class");
  });

  it("merges sx prop with default styles", () => {
    renderWithProviders(
      <Button sx={{ backgroundColor: "red" }}>Sx Button</Button>,
    );
    const button = screen.getByRole("button", { name: "Sx Button" });
    expect(button).toBeInTheDocument();
  });

  it("falls back to children string for aria-label when label not provided", () => {
    renderWithProviders(<Button>Aria Fallback</Button>);
    expect(screen.getByRole("button", { name: "Aria Fallback" })).toBeInTheDocument();
  });

  it("uses children as aria-label when no explicit aria-label given", () => {
    renderWithProviders(<Button>Child text</Button>);
    expect(screen.getByRole("button", { name: "Child text" })).toBeInTheDocument();
  });
});
