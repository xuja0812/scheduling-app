import React from "react";
import { Tabs, Tab, Button } from "@mui/material";

const PlanTabs = React.memo(({ plans, activePlanIndex, setActivePlanIndex, handleAddPlan }) => {
  return (
    <Tabs
      value={activePlanIndex}
      onChange={(_, newIndex) => setActivePlanIndex(newIndex)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        "& .MuiTab-root": {
          color: "#cbd5e1",
          textTransform: "none",
          fontWeight: "500",
          "&.Mui-selected": {
            color: "#60a5fa",
          },
        },
        "& .MuiTabs-indicator": {
          backgroundColor: "#60a5fa",
        },
      }}
    >
      {plans.map((plan, idx) => (
        <Tab
          key={plan.id || idx} 
          label={plan.name || `Plan ${idx + 1}`}
          sx={{ minWidth: 120 }}
        />
      ))}
      <Button
        onClick={handleAddPlan}
        size="small"
        variant="outlined"
        sx={{
          ml: 1,
          textTransform: "none",
          fontWeight: "500",
          color: "#60a5fa",
          borderColor: "rgba(96, 165, 250, 0.3)",
          borderRadius: "8px",
          "&:hover": {
            borderColor: "#60a5fa",
            backgroundColor: "rgba(96, 165, 250, 0.1)",
          },
        }}
      >
        + New
      </Button>
    </Tabs>
  );
});

export default PlanTabs;
