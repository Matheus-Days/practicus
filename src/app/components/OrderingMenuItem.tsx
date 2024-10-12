import { MenuItem, MenuItemProps } from '@mui/material';
import { ReactNode } from 'react';

type OrderingMenuItemProps = {
  children: ReactNode;
};

export default function OrderingMenuItem(props: MenuItemProps): JSX.Element {
  return (
    <MenuItem
      {...props}
      sx={{
        fontSize: '0.8125rem',
        lineHeight: '1.2188rem',
        letterSpacing: '0.0094rem',
        color: '#163945'
      }}
    >
      {props.children}
    </MenuItem>
  );
}
