import React, { useState } from "react";
import { Box, alpha, Menu, MenuItem, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { PageBreadcrumbs } from "../../../components/breadcrumbs/PageBreadcrumbs";
import CustomizableButton from "../../../components/button/customizable-button";
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
  const theme = useTheme();
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
    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(1), mb: theme.spacing(2) }}>
      <PageBreadcrumbs
        items={breadcrumbItems}
        autoGenerate={false}
        showCurrentPage={false}
        showDivider={false}
        sx={{ mb: 0, "& > hr": { mb: 0 } }}
      />
      <CustomizableButton
        onClick={handleOpen}
        endIcon={<ChevronDown size={14} />}
        text={currentModule.label}
        variant="text"
        size="small"
        sx={{
          textTransform: "none",
          fontSize: theme.typography.pxToRem(13),
          fontWeight: 500,
          color: brand.primary,
          py: theme.spacing(1),
          px: theme.spacing(2),
          minWidth: "auto",
          ml: -1,
          "&:hover": { backgroundColor: alpha(brand.primary, 0.06) },
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: { minWidth: 200, mt: theme.spacing(2) },
        }}
        disableRipple
      >
        {Object.values(MODULE_PATHS).map((module) => (
          <MenuItem
            key={module.path}
            onClick={() => handleNavigate(module.path)}
            selected={location.pathname === module.path}
            disableRipple
            sx={{
              fontSize: theme.typography.pxToRem(14),
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
