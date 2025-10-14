'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAdminContext } from '../../contexts/AdminContext';
import EventDashboard from './EventDashboard';
import CheckoutsTable from './CheckoutsTable';
import RegistrationsTable from './RegistrationsTable';
import AdminCheckoutManagement from './AdminCheckoutManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `event-tab-${index}`,
    'aria-controls': `event-tabpanel-${index}`,
  };
}

export default function EventDetails() {
  const { selectedEvent, navigateToEventsList } = useAdminContext();
  const [tabValue, setTabValue] = useState(0);

  if (!selectedEvent) {
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={navigateToEventsList}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <ArrowBackIcon sx={{ mr: 1 }} />
          Voltar aos Eventos
        </Link>
        <Typography color="text.primary">Detalhes do Evento</Typography>
      </Breadcrumbs>

      {/* Dashboard */}
      <EventDashboard />

      {/* Gerenciamento de Cortesias do Admin */}
      <AdminCheckoutManagement />

      {/* Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="event tabs">
              <Tab label="Aquisições" {...a11yProps(0)} />
              <Tab label="Inscrições" {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <CheckoutsTable />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <RegistrationsTable />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
