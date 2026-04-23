import { SxProps, Theme } from '@mui/material';
import { brand, background, status } from "../../../themes/palette";

export const modalContainerStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: `${background.main}`,
  borderRadius: 3,
  boxShadow: 6,
  maxWidth: 480,
  width: '100%',
  mx: 2,
  maxHeight: '90vh',
  overflow: 'auto',
  animation: 'scaleIn 0.2s',
  padding: '20px',
};

export const modalHeaderStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${status.default.border}`,
  p: 2,
};

export const modalCloseButtonStyle: SxProps<Theme> = {
  color: `${status.default.text}`,
  '&:hover': { color: '#232B3A', background: '#e3f5e6' },
  p: 1,
};

export const modalDescriptionStyle: SxProps<Theme> = {
  color: `${status.default.text}`,
  mb: 6,
  fontSize: 14,
  textAlign: 'left',
  mt: 6,
};

export const frameworkCardStyle: SxProps<Theme> = {
  border: '1px solid #d0d5dd',
  borderRadius: '4px',
  background: `linear-gradient(135deg, ${background.main} 0%, #fafbfc 100%)`,
  p: '20px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  '&:hover': {
    borderColor: '#b9c1cc',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
};

export const frameworkCardSelectedStyle: SxProps<Theme> = {
  border: `1.5px solid ${brand.primary}`,
  borderRadius: '4px',
  background: 'linear-gradient(135deg, #f4fbf8 0%, #e9f6ef 100%)',
  p: '20px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  '&:hover': {
    boxShadow: '0 1px 3px rgba(19, 113, 91, 0.12)',
  },
};

export const frameworkCardTitleStyle: SxProps<Theme> = {
  fontWeight: 600,
  color: '#1a202c',
  fontSize: 15,
  lineHeight: 1.4,
};

export const frameworkCardAddedStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  color: `${brand.primary}`,
  gap: 1,
  fontSize: 14,
};

export const frameworkCardDescriptionStyle: SxProps<Theme> = {
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.55,
  textAlign: 'left',
  mt: '6px',
  mb: '16px',
};

export const frameworkAddedBadgeStyle: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: '#e6f4ee',
  border: `1px solid ${brand.primary}`,
  borderRadius: '12px',
  px: '10px',
  py: '3px',
  fontSize: 12,
  fontWeight: 600,
  color: brand.primary,
  lineHeight: 1.4,
};

export const modalDoneButtonStyle: SxProps<Theme> = {
  px: 4,
  py: 1,
  fontWeight: 500,
  borderRadius: 2,
  boxShadow: 'none',
  fontSize: 15,
  backgroundColor: `${brand.primary}`,
  color: `${background.main}`,
  border: `1px solid ${brand.primary}`,
  '&:hover': {
    backgroundColor: `${brand.primaryDark}`,
  },
}; 