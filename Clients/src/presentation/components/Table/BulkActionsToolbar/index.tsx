import { useCallback, useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { CustomizableButton } from "../../button/customizable-button";
import ConfirmationModal from "../../Dialogs/ConfirmationModal";
import singleTheme from "../../../themes/v1SingleTheme";

export interface BulkActionConfirm {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  confirm?: BulkActionConfirm;
}

interface BulkActionsToolbarProps {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({ count, onClear, actions }) => {
  const theme = useTheme();
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleActionClick = useCallback((action: BulkAction) => {
    if (action.disabled) return;
    if (action.confirm) {
      setPendingAction(action);
    } else {
      void action.onClick();
    }
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (isRunning) return;
    setPendingAction(null);
  }, [isRunning]);

  const handleProceedConfirm = useCallback(async () => {
    if (!pendingAction) return;
    try {
      setIsRunning(true);
      await pendingAction.onClick();
    } finally {
      setIsRunning(false);
      setPendingAction(null);
    }
  }, [pendingAction]);

  if (count <= 0) return null;

  return (
    <>
      <Stack
        direction="row"
        role="toolbar"
        aria-label="Bulk actions"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing(4),
          px: theme.spacing(4),
          py: theme.spacing(2),
          mb: theme.spacing(2),
          backgroundColor: `${theme.palette.primary.main}14`,
          border: singleTheme.tableStyles.primary.frame.border,
          borderRadius: theme.shape.borderRadius,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <Stack direction="row" alignItems="center" gap={theme.spacing(3)}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: "13px",
              color: theme.palette.primary.main,
            }}
          >
            {count} selected
          </Typography>
          <CustomizableButton
            text="Clear"
            variant="text"
            size="small"
            onClick={onClear}
            sx={{ color: theme.palette.text.secondary, fontSize: "13px" }}
            ariaLabel="Clear selection"
          />
        </Stack>

        <Box
          component="ul"
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: theme.spacing(2),
            m: 0,
            p: 0,
            listStyle: "none",
          }}
        >
          {actions.map((action) => (
            <li key={action.id}>
              <CustomizableButton
                text={action.label}
                variant="outlined"
                size="small"
                color={action.confirm?.danger ? "error" : "primary"}
                startIcon={action.icon}
                onClick={() => handleActionClick(action)}
                isDisabled={action.disabled}
                ariaLabel={action.label}
              />
            </li>
          ))}
        </Box>
      </Stack>

      {pendingAction?.confirm && (
        <ConfirmationModal
          title={pendingAction.confirm.title}
          body={pendingAction.confirm.body}
          cancelText="Cancel"
          proceedText={pendingAction.confirm.confirmLabel}
          proceedButtonVariant="contained"
          proceedButtonColor={pendingAction.confirm.danger ? "error" : "primary"}
          onCancel={handleCancelConfirm}
          onProceed={handleProceedConfirm}
          isLoading={isRunning}
          isOpen
        />
      )}
    </>
  );
};

export default BulkActionsToolbar;
