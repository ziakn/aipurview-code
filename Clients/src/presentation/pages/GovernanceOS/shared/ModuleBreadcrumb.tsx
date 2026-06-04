import React, { useState } from "react";
import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { PageBreadcrumbs } from "../../../components/breadcrumbs/PageBreadcrumbs";
import { brand } from "../../../themes/palette";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const MODULE_PATHS: Record<string, { label: string; path: string }> = {
  "/governance": { label: "Hub", path: "/governance" },
  "/governance/framework-mapper": { label: "Framework Mapper", path: "/governance/framework-mapper" },
  "/governance/scenarios": { label: "Scenario Builder", path: "/governance/scenarios" },
  "/governance/insights": { label: "Unified Insights", path: "/governance/insights" },
  "/governance/evidence": { label: "Evidence Hub", path: "/governance/evidence" },
  "/governance/knowledge-graph": { label: "Knowledge Graph", path: "/governance/knowledge-graph" },
  "/governance/regulatory-radar": { label: "Regulatory Radar", path: "/governance/regulatory-radar" },
};

const ModuleBreadcrumb: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentModule = MODULE_PATHS[location.pathname] || { label: "Hub", path: "/governance" };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Governance Intelligence" },
    { label: currentModule.label },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
      <PageBreadcrumbs
        items={breadcrumbItems}
        autoGenerate={false}
        showCurrentPage={false}
        showDivider={false}
        sx={{ mb: 0, "& > hr": { mb: 0 } }}
      />
      <Button
        onClick={handleOpen}
        endIcon={<ChevronDown size={14} />}
        sx={{
          textTransform: "none",
          fontSize: "13px",
          fontWeight: 500,
          color: brand.primary,
          py: 0.5,
          px: 1,
          minWidth: "auto",
          ml: -1,
          "&:hover": { backgroundColor: `${brand.primary}10` },
        }}
      >
        {currentModule.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: { minWidth: 200, mt: 0.5 },
        }}
      >
        {Object.values(MODULE_PATHS).map((module) => (
          <MenuItem
            key={module.path}
            onClick={() => handleNavigate(module.path)}
            selected={location.pathname === module.path}
            sx={{
              fontSize: "14px",
              fontWeight: location.pathname === module.path ? 600 : 400,
              color: location.pathname === module.path ? brand.primary : "inherit",
            }}
          >
            {module.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ModuleBreadcrumb;
