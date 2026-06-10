import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../../test/renderWithProviders";
import AutoCompleteField from "../index";
import { TextField } from "@mui/material";

const options = [
  { label: "Apple", id: 1 },
  { label: "Banana", id: 2 },
];

describe("AutoCompleteField Component", () => {
  it("renders label", () => {
    renderWithProviders(
      <AutoCompleteField
        label="Fruit"
        options={options}
        getOptionLabel={(o) => o.label}
        renderInput={(params) => <TextField {...params} placeholder="Pick a fruit" size="small" />}
      />,
    );

    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Pick a fruit")).toBeInTheDocument();
  });

  it("shows required asterisk", () => {
    renderWithProviders(
      <AutoCompleteField
        label="Fruit"
        options={options}
        getOptionLabel={(o) => o.label}
        renderInput={(params) => <TextField {...params} placeholder="Pick" size="small" />}
        isRequired
      />,
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows optional label", () => {
    renderWithProviders(
      <AutoCompleteField
        label="Fruit"
        options={options}
        getOptionLabel={(o) => o.label}
        renderInput={(params) => <TextField {...params} placeholder="Pick" size="small" />}
        isOptional
      />,
    );

    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("renders error message", () => {
    renderWithProviders(
      <AutoCompleteField
        label="Fruit"
        options={options}
        getOptionLabel={(o) => o.label}
        renderInput={(params) => <TextField {...params} placeholder="Pick" size="small" />}
        error="Required field"
      />,
    );

    expect(screen.getByText("Required field")).toBeInTheDocument();
  });
});
